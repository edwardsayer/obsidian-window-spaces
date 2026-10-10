import { describe, expect, test, vi } from "vitest";
import { TFile } from "obsidian";
import { initI18n } from "../src/i18n";
import { WindowLayoutManager } from "../src/manager";

type State = { type: string; state: Record<string, unknown>; active?: boolean };
type Group = { id: string; type: string; children: Leaf[]; currentTab: number };
type Leaf = {
  id: string;
  parent?: Group;
  containerEl: { ownerDocument: { defaultView: Window } };
  view: { getViewType: () => string };
  getViewState: () => State;
  setViewState: ReturnType<typeof vi.fn>;
  openFile: ReturnType<typeof vi.fn>;
  detach: () => void;
};

// Reproduce the relevant Vertical Tabs policies without loading that plugin:
// layout refresh removes empty siblings; openFile can redirect to a main tab.
function setup({ removeEmpty = false, redirectDuplicates = false } = {}) {
  const popout = { closed: false } as Window;
  const groups: Group[] = [];
  let nextLeaf = 0;
  const mainTabs: Leaf[] = [];
  const files = new Map<string, TFile>();
  const cleanup = () => {
    if (!removeEmpty) return;
    groups.forEach(group => {
      if (group.children.length <= 1) return;
      group.children.forEach(leaf => {
        if (leaf.view.getViewType() === "empty") leaf.detach();
      });
    });
  };
  const newGroup = () => {
    const group = { id: `group-${groups.length}`, type: "tabs", children: [], currentTab: 0 };
    groups.push(group);
    return group;
  };
  const newLeaf = (group: Group, win = popout): Leaf => {
    let state: State = { type: "empty", state: {} };
    const leaf: Leaf = {
      id: `leaf-${++nextLeaf}`,
      parent: group,
      containerEl: { ownerDocument: { defaultView: win } },
      view: { getViewType: () => state.type },
      getViewState: () => state,
      setViewState: vi.fn(async (next: State) => {
        state = { ...next, state: { ...next.state } };
        await Promise.resolve();
        cleanup();
      }),
      openFile: vi.fn(async (file: TFile) => {
        if (redirectDuplicates) {
          const existing = mainTabs.find(tab => tab.getViewState().state.file === file.path);
          if (existing) {
            workspace.setActiveLeaf(existing);
            leaf.detach();
          }
        }
        const type = file.path.endsWith(".canvas") ? "canvas" : "markdown";
        await leaf.setViewState({ type, state: { file: file.path }, active: false });
      }),
      detach: () => {
        const parent = leaf.parent;
        if (parent) parent.children.splice(parent.children.indexOf(leaf), 1);
        leaf.parent = undefined;
      },
    };
    group.children.push(leaf);
    queueMicrotask(cleanup);
    return leaf;
  };
  const workspace = {
    activeLeaf: null as Leaf | null,
    iterateAllLeaves: (callback: (leaf: Leaf) => void) => {
      mainTabs.forEach(leaf => { callback(leaf); });
      groups.forEach(group => {
        group.children.forEach(leaf => {
          if (!mainTabs.includes(leaf)) callback(leaf);
        });
      });
    },
    createLeafInParent: (group: Group) => newLeaf(group),
    createLeafBySplit: () => newLeaf(newGroup()),
    getMostRecentLeaf: () => workspace.activeLeaf,
    setActiveLeaf: vi.fn((leaf: Leaf) => { workspace.activeLeaf = leaf; }),
    revealLeaf: vi.fn().mockResolvedValue(undefined),
  };
  const plugin = {
    app: { workspace, vault: { getAbstractFileByPath: (path: string) => files.get(path) } },
    settings: { spaces: [], showNotifications: false },
    saveSettings: async () => {},
  } as any;
  initI18n(plugin.app);
  const manager = new WindowLayoutManager(plugin);
  vi.spyOn(manager as any, "ensureViewRenderedWithRetries").mockImplementation(() => {});
  const addFile = (path: string) => {
    const file = new TFile();
    file.path = path;
    files.set(path, file);
  };
  const addMainTab = async (path: string) => {
    const leaf = newLeaf(newGroup(), window);
    await leaf.setViewState({ type: "markdown", state: { file: path, mode: "source" } });
    mainTabs.push(leaf);
    return leaf;
  };
  return { popout, manager, workspace, newGroup, newLeaf, cleanup, addFile, addMainTab };
}

const paths = ["first.md", "second.md", "third.md", "fourth.md"];
const savedTabs = () => paths.map((file, i) => ({
  type: "leaf",
  id: `saved-${i}`,
  state: { type: "markdown", state: { file, mode: "preview", customState: i } },
}));

describe("saved tabs with navigation plugins", () => {
  test("keeps all four note tabs attached while layout refresh removes empty siblings", async () => {
    const { popout, manager, newGroup, newLeaf, cleanup } = setup({ removeEmpty: true });
    newLeaf(newGroup());
    const notes = savedTabs();
    const layout = {
      type: "window", direction: "vertical", children: [
        { type: "tabs", children: [{ type: "leaf", state: { type: "file-explorer", state: {} } }] },
        { type: "tabs", currentTab: 2, children: notes },
        { type: "tabs", children: [{ type: "leaf", state: { type: "outline", state: { file: paths[2] } } }] },
      ],
    };

    const built: Leaf[] = await (manager as any).buildSimpleWindowStructure(popout, layout);
    cleanup();
    const content = built.slice(1, 5);

    expect(content.every(leaf => !!leaf.parent)).toBe(true);
    expect(content[0].parent?.children).toEqual(content);
    expect(content.map(leaf => leaf.getViewState().state.file)).toEqual(paths);
    expect(content.map(leaf => leaf.getViewState().state.customState)).toEqual([0, 1, 2, 3]);
    expect(built[0].getViewState().type).toBe("file-explorer");
    expect(built[5].getViewState().type).toBe("outline");
  });

  test("restores each note into its saved window even when openFile redirects duplicates to main", async () => {
    const { popout, manager, workspace, newGroup, newLeaf, addFile, addMainTab } = setup({ redirectDuplicates: true });
    paths.forEach(addFile);
    const main = await addMainTab(paths[1]);
    const mainState = main.getViewState();
    const group = newGroup();
    const leaves = paths.map(() => newLeaf(group));
    const saved = savedTabs().map(node => ({ id: node.id, ...node.state }));

    await (manager as any).restoreFileStatesForWindow(popout, saved, paths[2], false, leaves);

    expect(group.children).toEqual(leaves);
    expect(leaves.map(leaf => leaf.getViewState().state.file)).toEqual(paths);
    expect(leaves.every(leaf => leaf.getViewState().state.mode === "preview")).toBe(true);
    expect(leaves.map(leaf => leaf.getViewState().state.customState)).toEqual([0, 1, 2, 3]);
    expect(main.getViewState()).toEqual(mainState);
    expect(workspace.activeLeaf).toBe(leaves[2]);
    expect(leaves.every(leaf => leaf.openFile.mock.calls.length === 0)).toBe(true);
  });

  test("preserves a registered file view's saved type and state", async () => {
    const { popout, manager, newGroup, newLeaf, addFile } = setup();
    addFile("drawing.canvas");
    const leaf = newLeaf(newGroup());
    const saved = [{ id: "drawing", type: "canvas", state: { file: "drawing.canvas", view: { x: 12, y: 34 } } }];

    await (manager as any).restoreFileStatesForWindow(popout, saved, undefined, false, [leaf], true);

    expect(leaf.getViewState()).toEqual({ type: "canvas", state: saved[0].state, active: false });
    expect(leaf.parent?.children).toEqual([leaf]);
  });
});
