import type { App, WorkspaceLeaf } from "obsidian";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { WorkspaceInterceptor } from "../src/popout/workspaceInterceptor";
import { PopoutActivityBarManager } from "../src/popout/activityBar";
import type { PopoutLayoutEngine } from "../src/shared/popoutLayout";
import type { WindowSettings } from "../src/types";

function createPopoutWindow(focused: boolean): Window {
  return {
    document: {
      body: { classList: { contains: (name: string) => name === "is-popout-window" } },
      hasFocus: () => focused,
    },
  } as unknown as Window;
}

function createLeaf(win: Window): WorkspaceLeaf {
  return {
    containerEl: { ownerDocument: { defaultView: win } },
  } as unknown as WorkspaceLeaf;
}

describe("workspace view discovery", () => {
  const globalObject = globalThis as unknown as { activeWindow?: Window };
  let previousActiveWindow: Window | undefined;
  let interceptor: WorkspaceInterceptor;

  beforeEach(() => {
    previousActiveWindow = globalObject.activeWindow;
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
  });

  afterEach(() => {
    interceptor?.uninstall();
    vi.restoreAllMocks();
    if (previousActiveWindow === undefined) delete globalObject.activeWindow;
    else globalObject.activeWindow = previousActiveWindow;
  });

  function setup(viewType: string, hosts: Window[], engine?: PopoutLayoutEngine) {
    const leaves = hosts.map(createLeaf);
    const workspace = {
      getLeftLeaf: vi.fn().mockReturnValue(null),
      getRightLeaf: vi.fn().mockReturnValue(null),
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
      getLeavesOfType: vi.fn(function (this: unknown, type: string): WorkspaceLeaf[] {
        expect(this).toBe(workspace);
        return type === viewType ? leaves : [];
      }),
    };
    const originalLookup = workspace.getLeavesOfType;
    const originalLeft = workspace.getLeftLeaf;
    const originalRight = workspace.getRightLeaf;
    interceptor = new WorkspaceInterceptor({ workspace } as unknown as App, engine);
    interceptor.install();
    return { workspace, leaves, originalLookup, originalLeft, originalRight };
  }

  test.each(["vertical-tabs", "custom-singleton-view"])(
    "layout reconciliation keeps the existing %s panel when a popout is focused",
    (viewType) => {
      globalObject.activeWindow = createPopoutWindow(true);
      const { workspace, leaves, originalLookup } = setup(viewType, [window]);
      const createPanel = vi.fn();

      // A singleton plugin checks for its panel on each layout-change event.
      // Focusing a popout must not make that existing panel disappear.
      for (let event = 0; event < 3; event++) {
        if (workspace.getLeavesOfType(viewType).length === 0) createPanel();
      }

      expect(createPanel).not.toHaveBeenCalled();
      expect(workspace.getLeavesOfType(viewType)).toBe(leaves);
      expect(originalLookup).toHaveBeenCalledWith(viewType);
    }
  );

  test("preserves panels in the main window and another popout when the active window has none", () => {
    globalObject.activeWindow = createPopoutWindow(true);
    const otherPopout = createPopoutWindow(false);
    const { workspace, leaves } = setup("custom-view", [otherPopout, window]);

    expect(workspace.getLeavesOfType("custom-view")).toBe(leaves);
  });

  test.each(["vertical-tabs", "custom-sidebar-view"])(
    "repeated activity-bar clicks do not relocate a newly opened %s into the main sidebar",
    async (viewType) => {
      const popout = createPopoutWindow(true);
      globalObject.activeWindow = popout;
      const { workspace, leaves } = setup(viewType, [window]);
      const mainSidebar = document.createElement("div");
      const popoutSidebar = document.createElement("div");
      const roots = new Map<WorkspaceLeaf, HTMLElement>([[leaves[0], mainSidebar]]);
      const relocateToMain = vi.fn((leaf: WorkspaceLeaf) => {
        roots.set(leaf, mainSidebar);
        Object.defineProperty(leaf.containerEl, "ownerDocument", { value: { defaultView: window } });
        mainSidebar.appendChild(leaf.containerEl);
      });

      // Vertical Tabs checks the first globally discovered panel's root during
      // onOpen/layout-change and moves it to the main sidebar if necessary.
      // Model that policy with an arbitrary view type too: filtering the lookup
      // must not change which existing panel the plugin considers its own.
      const reconcilePanel = () => {
        const first = workspace.getLeavesOfType(viewType)[0];
        if (first && roots.get(first) !== mainSidebar) relocateToMain(first);
      };
      const engine = {
        getColumnElement: vi.fn().mockReturnValue(popoutSidebar),
        findLeafOfTypeInColumn: vi.fn(() => leaves.find((leaf) => roots.get(leaf) === popoutSidebar)),
        ensureSideColumn: vi.fn(async () => {
          const containerEl = document.createElement("div");
          Object.defineProperty(containerEl, "ownerDocument", {
            value: { defaultView: popout }, configurable: true,
          });
          popoutSidebar.appendChild(containerEl);
          const localPanel = { containerEl } as unknown as WorkspaceLeaf;
          roots.set(localPanel, popoutSidebar);
          leaves.push(localPanel);
          reconcilePanel();
          return localPanel;
        }),
        isColumnHidden: vi.fn(() => popoutSidebar.style.display === "none"),
        hideColumn: vi.fn(() => { popoutSidebar.style.display = "none"; }),
        showColumn: vi.fn(() => { popoutSidebar.style.display = ""; }),
      };
      const manager = new PopoutActivityBarManager(
        { app: { workspace } as unknown as App, settings: {} as WindowSettings },
        engine as unknown as PopoutLayoutEngine
      );
      const activityBar = manager as unknown as {
        toggleView(win: Window, item: { viewType: string; side: "left" }): Promise<void>;
      };

      try {
        for (let click = 0; click < 4; click++) {
          await activityBar.toggleView(popout, { viewType, side: "left" });
          reconcilePanel();
        }

        expect(relocateToMain).not.toHaveBeenCalled();
        expect(engine.ensureSideColumn).toHaveBeenCalledTimes(1);
        expect(engine.ensureSideColumn).toHaveBeenCalledWith(popout, "left", viewType);
        expect(leaves.filter((leaf) => roots.get(leaf) === mainSidebar)).toEqual([leaves[0]]);
        expect(leaves.filter((leaf) => roots.get(leaf) === popoutSidebar)).toHaveLength(1);
      } finally {
        manager.cleanupAll();
      }
    }
  );

  test.each(["outline", "grid-view", "custom-view"])(
    "preserves global %s panel discovery and ordering even when local panels exist",
    (viewType) => {
      const popout = createPopoutWindow(true);
      globalObject.activeWindow = popout;
      const { workspace, leaves, originalLookup } = setup(viewType, [window, popout, popout, createPopoutWindow(false)]);

      expect(workspace.getLeavesOfType).toBe(originalLookup);
      expect(workspace.getLeavesOfType(viewType)).toBe(leaves);
    }
  );

  test("still reports no panels for a view that does not exist anywhere", () => {
    globalObject.activeWindow = createPopoutWindow(true);
    const { workspace } = setup("existing-view", [window]);

    expect(workspace.getLeavesOfType("missing-view")).toEqual([]);
  });

  test("explicit sidebar creation opens a local outline despite discovering the main-window outline", async () => {
    const popout = createPopoutWindow(true);
    globalObject.activeWindow = popout;
    const localOutline = {
      ...createLeaf(popout),
      setViewState: vi.fn().mockResolvedValue(undefined),
      loadIfDeferred: vi.fn().mockResolvedValue(undefined),
    };
    const engine = {
      getColumnElement: vi.fn().mockReturnValue(null),
      openSideLeafSync: vi.fn().mockReturnValue(localOutline),
    };
    const { workspace, leaves } = setup("outline", [window], engine as unknown as PopoutLayoutEngine);
    const mainOutline = leaves[0];
    localOutline.setViewState.mockImplementation(async () => {
      leaves.push(localOutline as unknown as WorkspaceLeaf);
    });

    expect(workspace.getLeavesOfType("outline")).toEqual([mainOutline]);
    const managedWorkspace = workspace as unknown as {
      ensureSideLeaf(type: string, side: "left" | "right"): Promise<WorkspaceLeaf>;
    };
    const created = await managedWorkspace.ensureSideLeaf("outline", "right");

    expect(created).toBe(localOutline);
    expect(engine.openSideLeafSync).toHaveBeenCalledWith(popout, "right");
    expect(localOutline.setViewState).toHaveBeenCalledWith({
      type: "outline", active: undefined, state: undefined,
    });
    expect(leaves).toContain(mainOutline);
    expect(workspace.getLeavesOfType("outline")).toEqual([mainOutline, localOutline]);
  });

  test.each(["main-window focus", "disabled routing", "unmanaged popout"])(
    "keeps the original lookup results with %s",
    (scenario) => {
      const popout = createPopoutWindow(true);
      globalObject.activeWindow = popout;
      const { workspace, leaves } = setup("outline", [window, popout]);
      if (scenario === "main-window focus") vi.mocked(document.hasFocus).mockReturnValue(true);
      if (scenario === "disabled routing") interceptor.enabled = false;
      if (scenario === "unmanaged popout") interceptor.isManagedWindow = () => false;

      expect(workspace.getLeavesOfType("outline")).toBe(leaves);
    }
  );

  test("leaves the original workspace lookup intact when the interceptor is unloaded", () => {
    globalObject.activeWindow = createPopoutWindow(true);
    const { workspace, leaves, originalLookup } = setup("custom-view", [window]);

    interceptor.uninstall();

    expect(workspace.getLeavesOfType).toBe(originalLookup);
    expect(workspace.getLeavesOfType("custom-view")).toBe(leaves);
  });

  test("does not overwrite another plugin's view lookup on unload", () => {
    globalObject.activeWindow = createPopoutWindow(true);
    const { workspace, leaves, originalLookup } = setup("custom-view", [window]);
    const pluginLookup = vi.fn((type: string) => originalLookup.call(workspace, type));
    workspace.getLeavesOfType = pluginLookup;

    interceptor.uninstall();

    expect(workspace.getLeavesOfType).toBe(pluginLookup);
    expect(workspace.getLeavesOfType("custom-view")).toBe(leaves);
  });

  test("keeps native method descriptors available to an older shared-coordinator participant", () => {
    const { workspace, originalLookup, originalLeft, originalRight } = setup("custom-view", [window]);
    const namespace = window as unknown as {
      __obsidian_workspace_interceptor_state_v1__: {
        originalMethods: Record<string, { hadOwn: boolean; value: unknown }>;
      };
    };
    const originals = namespace.__obsidian_workspace_interceptor_state_v1__.originalMethods;

    // An older participant reads these descriptors when it is the final one
    // to release the v1 coordinator. Missing entries would break its teardown.
    for (const [key, method] of [
      ["getLeftLeaf", originalLeft], ["getRightLeaf", originalRight], ["getLeavesOfType", originalLookup],
    ] as const) {
      expect(originals[key].hadOwn).toBe(true);
      expect(originals[key].value).toBe(method);
      expect(workspace[key]).toBe(method);
    }
  });

  test.each([
    ["mk-path-view", "left"], ["mk-path-view", "right"],
    ["custom-navigator", "left"], ["custom-navigator", "right"],
  ] as const)(
    "a background %s rebuild in the %s sidebar keeps its destination after popout focus changes",
    async (viewType, side) => {
      const popout = createPopoutWindow(true);
      const mainPanel = { ...createLeaf(window), setViewState: vi.fn().mockResolvedValue(undefined) };
      const popoutPanel = { ...createLeaf(popout), setViewState: vi.fn().mockResolvedValue(undefined) };
      const engine = { openSideLeafSync: vi.fn().mockReturnValue(popoutPanel) };
      const { workspace, originalLeft, originalRight } = setup(viewType, [window], engine as unknown as PopoutLayoutEngine);
      originalLeft.mockReturnValue(mainPanel as unknown as WorkspaceLeaf);
      originalRight.mockReturnValue(mainPanel as unknown as WorkspaceLeaf);

      // MAKE.md awaits indexing, then recreates its Navigator via the native
      // main-sidebar API. Focus may have moved to a popout during that await.
      const rebuild = (async () => {
        await Promise.resolve();
        const leaf = side === "left" ? workspace.getLeftLeaf(false) : workspace.getRightLeaf(false);
        await leaf?.setViewState({ type: viewType });
      })();
      globalObject.activeWindow = popout;
      await rebuild;

      expect(mainPanel.setViewState).toHaveBeenCalledWith({ type: viewType });
      expect(popoutPanel.setViewState).not.toHaveBeenCalled();
      expect(engine.openSideLeafSync).not.toHaveBeenCalled();
      expect(workspace.getLeftLeaf).toBe(originalLeft);
      expect(workspace.getRightLeaf).toBe(originalRight);
    }
  );
});
