import { describe, test, expect, beforeEach, vi } from "vitest";
import { WindowLayoutManager } from "../src/manager";
import { initI18n } from "../src/i18n";

/**
 * Leaf 層級 restore 結構重建（restoreLeafLevel.test.ts）
 *
 * 覆蓋 restoreLayoutInternal 中「不觸發全域 changeLayout」的 leaf 層級
 * 重建路徑：結構判定（isSimpleLayoutStructure / extractLayoutRootNode）與
 * 群組建立順序（buildSimpleWindowStructure）。
 */

interface MockLeaf {
  id: string;
  containerEl: { ownerDocument: { defaultView: Window } };
  setViewState: ReturnType<typeof vi.fn>;
  getViewState: ReturnType<typeof vi.fn>;
  parent?: any;
  togglePinned?: ReturnType<typeof vi.fn>;
}

function makeTargetWin(): Window {
  return { closed: false } as unknown as Window;
}

function makeWorkspaceMock(targetWin: Window, leaves: MockLeaf[]) {
  return {
    iterateAllLeaves: (cb: (leaf: any) => void) => {
      [...leaves].forEach((leaf) => cb(leaf));
    },
    createLeafInParent: (parent: any, index: number) => {
      const leaf = makeLeaf(leaves, targetWin);
      return leaf;
    },
    createLeafBySplit: (anchor: any, direction: string) => {
      const leaf = makeLeaf(leaves, targetWin);
      return leaf;
    },
    getLayout: () => ({}),
    getMostRecentLeaf: () => null,
    activeLeaf: null,
    revealLeaf: async () => {},
    setActiveLeaf: () => {},
    requestSaveLayout: async () => {},
  };
}

function makeLeaf(leaves: MockLeaf[], targetWin: Window): MockLeaf {
  const id = `leaf-${leaves.length + 1}`;
  const leaf: MockLeaf = {
    id,
    containerEl: { ownerDocument: { defaultView: targetWin } },
    parent: { type: "tabs", id: `tabs-${leaves.length + 1}` },
    setViewState: vi.fn().mockResolvedValue(undefined),
    getViewState: vi.fn(() => ({ type: "empty", state: {} })),
  };
  leaves.push(leaf);
  return leaf;
}

function createTestManager(workspace: any): WindowLayoutManager {
  const mockPlugin = {
    app: { workspace, vault: {} },
    settings: { spaces: [], sortBy: "updated-desc" },
    saveSettings: async () => {},
  } as any;
  initI18n(mockPlugin.app);
  return new WindowLayoutManager(mockPlugin);
}

describe("extractLayoutRootNode", () => {
  test("保留 window/floating 包裝（多 child 也由結構判定決定是否可重建）", () => {
    const manager = createTestManager({});
    const split = { type: "split", direction: "vertical", children: [] };
    const win = { type: "window", children: [split] };
    expect((manager as any).extractLayoutRootNode(win)).toBe(win);
    expect((manager as any).extractLayoutRootNode(split)).toBe(split);
    expect((manager as any).extractLayoutRootNode(null)).toBeNull();
  });
});

describe("buildLayoutTreeWithSidebars", () => {
  test("adds a sidebar beside a nested 2x1 content split", () => {
    const manager = createTestManager({});
    const contentSplit = {
      type: "split",
      direction: "horizontal",
      children: [
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "a.md" } } }] },
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "b.md" } } }] },
      ],
    };
    const root = { type: "window", direction: "vertical", children: [contentSplit] };

    const rebuilt = (manager as any).buildLayoutTreeWithSidebars(root, "file-explorer");

    expect(rebuilt.children).toHaveLength(2);
    expect(rebuilt.children[0]).toMatchObject({
      type: "tabs",
      children: [{ type: "leaf", state: { type: "file-explorer", state: {} } }],
    });
    expect(rebuilt.children[1]).toMatchObject({
      type: "split",
      direction: "horizontal",
    });
    expect(rebuilt.children[1].children).toHaveLength(2);
    expect(root.children).toHaveLength(1);
  });

  test("preserves a nested 2x2 content grid while adding a sidebar", () => {
    const manager = createTestManager({});
    const makeTabs = (id: string) => ({
      type: "tabs",
      id,
      children: [{ type: "leaf", state: { type: "empty", state: {} } }],
    });
    const root = {
      type: "window",
      direction: "vertical",
      children: [{
        type: "split",
        direction: "vertical",
        children: [{
          type: "split",
          direction: "horizontal",
          children: [
            { type: "split", direction: "vertical", children: [makeTabs("a"), makeTabs("b")] },
            { type: "split", direction: "vertical", children: [makeTabs("c"), makeTabs("d")] },
          ],
        }],
      }],
    };

    const rebuilt = (manager as any).buildLayoutTreeWithSidebars(root, "file-explorer");
    const content = rebuilt.children[1];
    const rows = content.children[0];

    expect(content).toMatchObject({ type: "split", direction: "vertical" });
    expect(rows).toMatchObject({ type: "split", direction: "horizontal" });
    expect(rows.children).toHaveLength(2);
    expect(rows.children[0].children).toHaveLength(2);
    expect(rows.children[1].children).toHaveLength(2);
    expect(rows.children[0].children[0].children[0].state.type).toBe("empty");
    expect(rows.children[1].children[1].children[0].state.type).toBe("empty");
  });

  test("still collapses a sidebar-only vertical split", () => {
    const manager = createTestManager({});
    const split = {
      type: "split",
      direction: "vertical",
      children: [
        { type: "tabs", children: [{ type: "leaf", state: { type: "bookmarks", state: {} } }] },
        { type: "tabs", children: [{ type: "leaf", state: { type: "search", state: {} } }] },
      ],
    };

    const normalized = (manager as any).normalizeColumnNode(split);

    expect(normalized.type).toBe("tabs");
    expect(normalized.children).toHaveLength(2);
  });

  test("rebuilds from the live tree without disabling file restoration", async () => {
    const manager = createTestManager({});
    const targetWin = { closed: false } as unknown as Window;
    const layout = {
      id: "layout-1",
      name: "2x1",
      workspace: { layout: { type: "window", children: [{ type: "tabs", children: [] }] }, leaves: [] },
    } as any;
    const liveRoot = {
      type: "window",
      direction: "vertical",
      children: [{ type: "split", direction: "horizontal", children: [{ type: "tabs", children: [] }] }],
    };

    vi.spyOn(manager as any, "getLiveWindowLayoutTree").mockReturnValue(liveRoot);
    const rebuildingStates: boolean[] = [];
    const restoreInPlace = vi
      .spyOn(manager as any, "restoreOpenSpaceInPlace")
      .mockImplementation(async () => {
        rebuildingStates.push(manager.isRebuildingPopoutLayout);
      });

    await (manager as any).rebuildPopoutLayoutWithSidebars(targetWin, layout, "file-explorer");

    expect(rebuildingStates).toEqual([true]);
    expect(manager.isRestoringLayout).toBe(false);

    expect(restoreInPlace).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: expect.objectContaining({
          layout: expect.objectContaining({
            children: expect.arrayContaining([
              expect.objectContaining({ type: "tabs" }),
              expect.objectContaining({ type: "split" }),
            ]),
          }),
          leaves: [],
        }),
      }),
      targetWin,
      { showNotifications: false, skipGeometry: true },
    );
  });
});

describe("isSimpleLayoutStructure", () => {
  let manager: WindowLayoutManager;
  beforeEach(() => {
    manager = createTestManager({});
  });

  test("單層 split / tabs / leaf 皆可重建", () => {
    const isSimple = (n: any) => (manager as any).isSimpleLayoutStructure(n);
    expect(isSimple({ type: "leaf", state: {} })).toBe(true);
    expect(isSimple({ type: "tabs", children: [{ type: "leaf" }] })).toBe(true);
    expect(
      isSimple({
        type: "split",
        direction: "vertical",
        children: [{ type: "tabs", children: [{ type: "leaf" }] }, { type: "tabs", children: [{ type: "leaf" }] }],
      })
    ).toBe(true);
  });

  test("多 child window（tabs + tabs + split）可重建，Professional 案例", () => {
    const isSimple = (n: any) => (manager as any).isSimpleLayoutStructure(n);
    expect(
      isSimple({
        type: "window",
        children: [
          { type: "tabs", children: [{ type: "leaf" }, { type: "leaf" }] },
          { type: "tabs", children: [{ type: "leaf" }, { type: "leaf" }] },
          { type: "split", direction: "horizontal", children: [{ type: "tabs" }, { type: "tabs" }] },
        ],
      })
    ).toBe(true);
  });

  test("單層巢狀但方向與父相同 → fallback（無法以 createLeafBySplit 包出巢狀）", () => {
    const isSimple = (n: any) => (manager as any).isSimpleLayoutStructure(n);
    // window(vertical) 內含 vertical split：方向與父相同 → false
    expect(
      isSimple({
        type: "window",
        children: [{ type: "split", direction: "vertical", children: [{ type: "tabs" }, { type: "tabs" }] }],
      })
    ).toBe(false);
    // window 內含 horizontal split（方向不同）→ true
    expect(
      isSimple({
        type: "window",
        children: [{ type: "split", direction: "horizontal", children: [{ type: "tabs" }, { type: "tabs" }] }],
      })
    ).toBe(true);
  });

  test("巢狀 split 與未知節點回傳 false（fallback 到 changeLayout）", () => {
    const isSimple = (n: any) => (manager as any).isSimpleLayoutStructure(n);
    expect(
      isSimple({
        type: "split",
        direction: "vertical",
        children: [{ type: "split", direction: "horizontal", children: [{ type: "tabs" }] }],
      })
    ).toBe(false);
    // window 內含巢狀 split
    expect(
      isSimple({
        type: "window",
        children: [
          { type: "split", direction: "vertical", children: [{ type: "split", direction: "horizontal" }] },
        ],
      })
    ).toBe(false);
    expect(isSimple(null)).toBe(false);
    expect(isSimple({ type: "unknown" })).toBe(false);
    expect(isSimple({ type: "split", children: [] })).toBe(false);
  });
});

describe("buildSimpleWindowStructure", () => {
  test("單 tabs 群組：重用 initial leaf，檔案 leaf 跳過 setViewState、非檔案 leaf 建立 view", async () => {
    const targetWin = makeTargetWin();
    const leaves: MockLeaf[] = [];
    const initial = makeLeaf(leaves, targetWin); // openPopoutLeaf 的初始 leaf
    const workspace = makeWorkspaceMock(targetWin, leaves);
    const manager = createTestManager(workspace);

    const saved = {
      type: "split",
      direction: "vertical",
      children: [
        {
          type: "tabs",
          children: [
            { type: "leaf", state: { type: "markdown", state: { file: "a.md" } } },
            { type: "leaf", state: { type: "markdown", state: { file: "b.md" } } },
          ],
        },
      ],
    };

    const built = await (manager as any).buildSimpleWindowStructure(targetWin, saved);
    expect(built.length).toBe(2);
    expect(built[0]).toBe(initial); // 重用初始 leaf
    expect(initial.setViewState).not.toHaveBeenCalled(); // 檔案 leaf 交給 openFile
    expect(built[1].setViewState).not.toHaveBeenCalled();
  });

  test("垂直三群組：以 createLeafBySplit 建立分割、createLeafInParent 加入同群組", async () => {
    const targetWin = makeTargetWin();
    const leaves: MockLeaf[] = [];
    const initial = makeLeaf(leaves, targetWin);
    const workspace = makeWorkspaceMock(targetWin, leaves);
    const splitSpy = vi.spyOn(workspace, "createLeafBySplit");
    const insertSpy = vi.spyOn(workspace, "createLeafInParent");
    const manager = createTestManager(workspace);

    const saved = {
      type: "split",
      direction: "vertical",
      children: [
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "a.md" } } }] },
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "b.md" } } }] },
        { type: "tabs", children: [{ type: "leaf", state: { type: "file-explorer", state: {} } }] },
      ],
    };

    const built = await (manager as any).buildSimpleWindowStructure(targetWin, saved);
    expect(built.length).toBe(3);
    expect(built[0]).toBe(initial);
    // 第二、三群組各以 createLeafBySplit 建立
    expect(splitSpy).toHaveBeenCalledTimes(2);
    expect(splitSpy.mock.calls[0][1]).toBe("vertical");
    expect(splitSpy.mock.calls[1][1]).toBe("vertical");
    expect(insertSpy).not.toHaveBeenCalled();
    // 非檔案 leaf（file-explorer）建立 view
    expect(built[2].setViewState).toHaveBeenCalledWith({
      type: "file-explorer",
      active: false,
      state: {},
    });
  });

  test("horizontal 群組方向傳遞正確", async () => {
    const targetWin = makeTargetWin();
    const leaves: MockLeaf[] = [];
    makeLeaf(leaves, targetWin);
    const workspace = makeWorkspaceMock(targetWin, leaves);
    const splitSpy = vi.spyOn(workspace, "createLeafBySplit");
    const manager = createTestManager(workspace);

    const saved = {
      type: "split",
      direction: "horizontal",
      children: [
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "a.md" } } }] },
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "b.md" } } }] },
      ],
    };

    await (manager as any).buildSimpleWindowStructure(targetWin, saved);
    expect(splitSpy).toHaveBeenCalledTimes(1);
    expect(splitSpy.mock.calls[0][1]).toBe("horizontal");
  });

  test("Professional 結構：window > [tabs, tabs, split[horizontal]] 兩階段重建", async () => {
    const targetWin = makeTargetWin();
    const leaves: MockLeaf[] = [];
    const initial = makeLeaf(leaves, targetWin);
    const workspace = makeWorkspaceMock(targetWin, leaves);
    const splitSpy = vi.spyOn(workspace, "createLeafBySplit");
    const insertSpy = vi.spyOn(workspace, "createLeafInParent");
    const manager = createTestManager(workspace);

    const saved = {
      type: "window",
      x: 1831,
      y: 363,
      width: 666,
      height: 577,
      children: [
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "a.md" } } }, { type: "leaf", state: { type: "markdown", state: { file: "b.md" } } }] },
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "c.md" } } }, { type: "leaf", state: { type: "markdown", state: { file: "d.md" } } }] },
        { type: "split", direction: "horizontal", children: [{ type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "e.md" } } }, { type: "leaf", state: { type: "markdown", state: { file: "f.md" } } }] }, { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "g.md" } } }] }] },
      ],
    };

    const built = await (manager as any).buildSimpleWindowStructure(targetWin, saved);
    expect(built.length).toBe(7);
    expect(built[0]).toBe(initial);
    // 兩階段：階段一頂層 3 佔位（2 次 vertical），階段二展開 hSplit（1 次 horizontal）
    expect(splitSpy).toHaveBeenCalledTimes(3);
    expect(splitSpy.mock.calls[0][1]).toBe("vertical");
    expect(splitSpy.mock.calls[1][1]).toBe("vertical");
    expect(splitSpy.mock.calls[2][1]).toBe("horizontal");
    // 群組內後續 leaf 以 createLeafInParent 加入（(2-1)+(2-1)+(2-1)+(1-1)=3）
    expect(insertSpy).toHaveBeenCalledTimes(3);
  });

  test("FET-Migration 巢狀案例：window > [hSplit, tabs, tabs] 正確展開", async () => {
    const targetWin = makeTargetWin();
    const leaves: MockLeaf[] = [];
    const initial = makeLeaf(leaves, targetWin);
    const workspace = makeWorkspaceMock(targetWin, leaves);
    const splitSpy = vi.spyOn(workspace, "createLeafBySplit");
    const manager = createTestManager(workspace);

    // 最左邊 split 被拖曳成上下兩個：window > [hSplit(tabsA, tabsB), tabsC, tabsD]
    const saved = {
      type: "window",
      children: [
        {
          type: "split",
          direction: "horizontal",
          children: [
            { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "a.md" } } }, { type: "leaf", state: { type: "markdown", state: { file: "b.md" } } }] },
            { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "c.md" } } }] },
          ],
        },
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "d.md" } } }] },
        { type: "tabs", children: [{ type: "leaf", state: { type: "markdown", state: { file: "e.md" } } }] },
      ],
    };

    const built = await (manager as any).buildSimpleWindowStructure(targetWin, saved);
    expect(built.length).toBe(5);
    expect(built[0]).toBe(initial);
    // 階段一：頂層 3 單位 → 2 次 vertical；階段二：展開 hSplit → 1 次 horizontal
    expect(splitSpy).toHaveBeenCalledTimes(3);
    expect(splitSpy.mock.calls[0][1]).toBe("vertical");
    expect(splitSpy.mock.calls[1][1]).toBe("vertical");
    expect(splitSpy.mock.calls[2][1]).toBe("horizontal");
  });

  test("同一 tabs 群組內多 leaf 以 createLeafInParent 加入", async () => {
    const targetWin = makeTargetWin();
    const leaves: MockLeaf[] = [];
    const initial = makeLeaf(leaves, targetWin);
    const workspace = makeWorkspaceMock(targetWin, leaves);
    const insertSpy = vi.spyOn(workspace, "createLeafInParent");
    const manager = createTestManager(workspace);

    const saved = {
      type: "tabs",
      children: [
        { type: "leaf", state: { type: "markdown", state: { file: "a.md" } } },
        { type: "leaf", state: { type: "markdown", state: { file: "b.md" } } },
        { type: "leaf", state: { type: "markdown", state: { file: "c.md" } } },
      ],
    };

    const built = await (manager as any).buildSimpleWindowStructure(targetWin, saved);
    expect(built.length).toBe(3);
    expect(built[0]).toBe(initial);
    expect(insertSpy).toHaveBeenCalledTimes(2);
  });

  describe("applySavedSplitDimensions", () => {
    function makeDomWin(rootEl: HTMLElement): Window {
      return {
        closed: false,
        document: {
          querySelector: (sel: string) => (sel === ".workspace-split.mod-root" ? rootEl : null),
        },
      } as unknown as Window;
    }

    test("以 flex-grow 權重套用頂層與巢狀 split 的 saved dimension", () => {
      const rootEl = document.createElement("div");
      rootEl.classList.add("workspace-split", "mod-root");
      const leftEl = document.createElement("div");
      leftEl.classList.add("workspace-tabs");
      const centerEl = document.createElement("div");
      centerEl.classList.add("workspace-tabs");
      const nestedEl = document.createElement("div");
      nestedEl.classList.add("workspace-split");
      const nestedTopEl = document.createElement("div");
      nestedTopEl.classList.add("workspace-tabs");
      const nestedBottomEl = document.createElement("div");
      nestedBottomEl.classList.add("workspace-tabs");
      nestedEl.append(nestedTopEl, nestedBottomEl);
      rootEl.append(leftEl, centerEl, nestedEl);

      const win = makeDomWin(rootEl);
      const manager = createTestManager({});
      const saved = {
        type: "window",
        children: [
          { type: "tabs", dimension: 25 },
          { type: "tabs", dimension: 40 },
          {
            type: "split",
            dimension: 35,
            children: [
              { type: "tabs", dimension: 70 },
              { type: "tabs", dimension: 30 },
            ],
          },
        ],
      };

      (manager as any).applySavedSplitDimensions(win, saved);

      expect(leftEl.style.flexGrow).toBe("25");
      expect(centerEl.style.flexGrow).toBe("40");
      expect(nestedEl.style.flexGrow).toBe("35");
      expect(nestedTopEl.style.flexGrow).toBe("70");
      expect(nestedBottomEl.style.flexGrow).toBe("30");
    });

    test("無 dimension 的節點保持原有 flex-grow 不覆寫", () => {
      const rootEl = document.createElement("div");
      rootEl.classList.add("workspace-split", "mod-root");
      const colEl = document.createElement("div");
      colEl.classList.add("workspace-tabs");
      colEl.style.flexGrow = "50";
      rootEl.appendChild(colEl);

      const win = makeDomWin(rootEl);
      const manager = createTestManager({});
      const saved = { type: "window", children: [{ type: "tabs" }] };

      (manager as any).applySavedSplitDimensions(win, saved);
      expect(colEl.style.flexGrow).toBe("50");
    });
  });
});
