import { describe, test, expect, beforeEach, vi } from "vitest";
import { WindowLayoutManager } from "../src/manager";
import { WindowLayout } from "../src/types";
import { initI18n } from "../src/i18n";

describe("Validation & Auto-Save Guardrails (validationAndGuardrails.test.ts)", () => {
  let manager: WindowLayoutManager;
  let mockPlugin: any;

  beforeEach(() => {
    mockPlugin = {
      app: { workspace: { getLayout: () => ({}) }, vault: {} },
      settings: {
        spaces: [],
        sortBy: "updated-desc",
      },
      saveSettings: async () => {},
    };
    initI18n(mockPlugin.app);
    manager = new WindowLayoutManager(mockPlugin);
  });

  test("validateLayout should invalidate empty or broken layout structures", () => {
    expect((manager as any).validateLayout(null as any)).toBe(false);
    expect((manager as any).validateLayout({} as any)).toBe(false);
    expect((manager as any).validateLayout({ name: "Test" } as any)).toBe(false);

    const valid: WindowLayout = {
      id: "v-1",
      name: "Valid Layout",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };
    expect((manager as any).validateLayout(valid)).toBe(true);
  });

  test("openNewPopoutWindow waits for the leaf view before resolving its Window", async () => {
    const popoutWindow = {
      document: {
        body: {
          classList: {
            contains: (className: string) => className === "is-popout-window",
          },
        },
      },
      focus: vi.fn(),
    } as unknown as Window;

    const leaf: any = {
      containerEl: { ownerDocument: { defaultView: null } },
      setViewState: vi.fn(async () => {
        await Promise.resolve();
        leaf.containerEl.ownerDocument.defaultView = popoutWindow;
      }),
    };
    mockPlugin.app.workspace.openPopoutLeaf = vi.fn(() => leaf);

    const result = await manager.openNewPopoutWindow();

    expect(leaf.setViewState).toHaveBeenCalledWith({ type: "empty" });
    expect(result).toBe(popoutWindow);
    expect(popoutWindow.focus).toHaveBeenCalled();
  });

  test("forceNewWindow bypasses smart-focus and creates a new popout for an already-open space", async () => {
    const popoutBody = {
      classList: { contains: (className: string) => className === "is-popout-window" },
    };
    const existingWindow = { document: { body: popoutBody } } as unknown as Window;
    const newWindow = {
      document: { body: popoutBody },
      focus: vi.fn(),
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      },
    } as unknown as Window;
    const openPopoutLeaf = vi.fn(() => ({}));

    mockPlugin.settings.showNotifications = false;
    mockPlugin.app.workspace.getLayout = vi.fn(() => ({ floating: [] }));
    mockPlugin.app.workspace.openPopoutLeaf = openPopoutLeaf;
    mockPlugin.app.workspace.changeLayout = vi.fn().mockResolvedValue(undefined);

    const layout: WindowLayout = {
      id: "force-new-space",
      name: "Already Open Space",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: { type: "leaf", id: "leaf-force-new", state: { type: "empty", state: {} } },
        leaves: [],
      },
      metadata: { fileCount: 0, tabCount: 0, splitCount: 0 },
    };

    vi.spyOn(manager as any, "getOpenWindowForLayout").mockReturnValue(existingWindow);
    vi.spyOn(manager as any, "capturePreservedWindowLayouts").mockReturnValue([]);
    vi.spyOn(manager as any, "getSavedViewStates").mockReturnValue([]);
    vi.spyOn(manager, "getLivePopoutWindows").mockReturnValue([newWindow]);
    vi.spyOn(manager as any, "getLeavesForWindow").mockReturnValue([]);
    vi.spyOn(manager as any, "restoreWindowGeometry").mockImplementation(() => {});
    vi.spyOn(manager as any, "restorePreservedWindowLabels").mockImplementation(() => {});
    vi.spyOn(manager as any, "setLayoutLabelForWindow").mockImplementation(() => {});
    vi.spyOn(manager as any, "refreshLayoutLabels").mockImplementation(() => {});
    const focusSpy = vi.spyOn(manager, "focusTargetWindow");

    await manager.restoreLayout(layout, { forceNewWindow: true, showNotifications: false });

    expect(focusSpy).not.toHaveBeenCalled();
    expect(openPopoutLeaf).toHaveBeenCalledTimes(1);
  });

  test("autoSaveWindowLayout should suppress overwriting with 0 files if existing layout contains files", async () => {
    const existingLayout: WindowLayout = {
      id: "l-existing",
      name: "My Work Layout",
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
      autoSave: true,
      windowState: { size: { width: 1000, height: 800 } },
      workspace: {
        layout: {},
        leaves: [{ id: "leaf-1", type: "markdown", state: { file: "Notes.md" } }],
      },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };

    mockPlugin.settings.spaces.push(existingLayout);

    // 模擬 Popout 視窗 DOM
    const mockWindow = { document: {} } as Window;
    (manager as any).layoutNames.set(mockWindow, "My Work Layout");

    // 模擬 capture 返回 0 檔案 (例如視窗正在解綁關閉)
    vi.spyOn(manager, "captureCurrentLayout").mockResolvedValue({
      id: "l-empty",
      name: "My Work Layout",
      timestamp: Date.now(),
      windowState: { size: { width: 0, height: 0 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 0, tabCount: 0, splitCount: 0 },
    });

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await manager.autoSaveWindowLayout(mockWindow);

    // 驗證原本有 1 個檔案的既有 Layout 未被覆寫為 0 個檔案
    const currentSettingsLayout = mockPlugin.settings.spaces[0];
    expect(currentSettingsLayout.metadata.fileCount).toBe(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Suppressed auto-save for layout "My Work Layout"')
    );
  });

  test("force-new restore should not select the source window when leaf IDs overlap", () => {
    const makeWindow = (isPopout: boolean) => ({
      document: {
        body: { classList: { contains: () => isPopout } },
      },
    }) as Window;
    const sourceWindow = makeWindow(true);
    const newWindow = makeWindow(true);
    const sourceLeaf = {
      id: "shared-leaf",
      containerEl: { ownerDocument: { defaultView: sourceWindow } },
    };
    const newLeaf = {
      id: "shared-leaf",
      containerEl: { ownerDocument: { defaultView: newWindow } },
    };

    mockPlugin.app.workspace.iterateAllLeaves = (callback: (leaf: any) => void) => {
      callback(sourceLeaf);
      callback(newLeaf);
    };

    const savedLeaves = [{ id: "shared-leaf", type: "markdown", state: { file: "Second.md" } }];

    expect(
      (manager as any).findWindowForSavedLeaves(savedLeaves, sourceWindow, newWindow)
    ).toBe(newWindow);
  });

  test("coalesces overlapping restore requests into one popout rebuild", async () => {
    let resolveRestore!: () => void;
    const restoreInternal = vi
      .spyOn(manager as any, "restoreLayoutInternal")
      .mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveRestore = resolve;
        })
      );
    const layout = { id: "layout-duplicate", name: "Duplicate" } as WindowLayout;

    const firstRestore = manager.restoreLayout(layout);
    const secondRestore = manager.restoreLayout(layout);

    expect(restoreInternal).toHaveBeenCalledTimes(1);
    resolveRestore();
    await Promise.all([firstRestore, secondRestore]);
  });

  test("first restore should ignore the main window and select the only popout", () => {
    const makeWindow = (isPopout: boolean) => ({
      document: {
        body: { classList: { contains: () => isPopout } },
      },
    }) as Window;
    const mainWindow = makeWindow(false);
    const popoutWindow = makeWindow(true);
    const mainLeaf = {
      id: "saved-leaf",
      containerEl: { ownerDocument: { defaultView: mainWindow } },
      getViewState: () => ({ type: "markdown", state: { file: "Main.md" } }),
    };
    const restoredPopoutLeaf = {
      id: "rebuilt-leaf",
      containerEl: { ownerDocument: { defaultView: popoutWindow } },
      getViewState: () => ({ type: "markdown", state: { file: "Restored.md" } }),
    };

    mockPlugin.app.workspace.iterateAllLeaves = (callback: (leaf: any) => void) => {
      callback(mainLeaf);
      callback(restoredPopoutLeaf);
    };

    const savedLeaves = [{
      id: "saved-leaf",
      type: "markdown",
      state: { file: "Restored.md" },
    }];

    expect(
      (manager as any).findWindowForSavedLeaves(savedLeaves, undefined, mainWindow)
    ).toBe(popoutWindow);
  });

  test("force-new restore should find a rebuilt source window by its files", () => {
    const makePopoutWindow = () => ({
      document: {
        body: { classList: { contains: () => true } },
      },
    }) as Window;
    const staleSourceWindow = makePopoutWindow();
    const rebuiltSourceWindow = makePopoutWindow();
    const restoredTargetWindow = makePopoutWindow();
    const rebuiltSourceLeaf = {
      id: "rebuilt-source-leaf",
      containerEl: { ownerDocument: { defaultView: rebuiltSourceWindow } },
      getViewState: () => ({ type: "markdown", state: { file: "First.md" } }),
    };
    const restoredTargetLeaf = {
      id: "restored-target-leaf",
      containerEl: { ownerDocument: { defaultView: restoredTargetWindow } },
      getViewState: () => ({ type: "markdown", state: { file: "Second.md" } }),
    };

    mockPlugin.app.workspace.iterateAllLeaves = (callback: (leaf: any) => void) => {
      callback(rebuiltSourceLeaf);
      callback(restoredTargetLeaf);
    };

    const sourceLeaves = [{
      id: "old-source-leaf",
      type: "markdown",
      state: { file: "First.md" },
    }];

    expect(
      (manager as any).findWindowForSavedLeaves(
        sourceLeaves,
        restoredTargetWindow,
        staleSourceWindow
      )
    ).toBe(rebuiltSourceWindow);
  });

  test("third force-new restore should preserve every earlier popout label", () => {
    const makePopoutWindow = () => ({
      document: {
        body: { classList: { contains: () => true } },
      },
    }) as Window;
    const staleFirstWindow = makePopoutWindow();
    const staleSecondWindow = makePopoutWindow();
    const rebuiltFirstWindow = makePopoutWindow();
    const rebuiltSecondWindow = makePopoutWindow();
    const thirdTargetWindow = makePopoutWindow();
    const makeLeaf = (id: string, targetWindow: Window, file: string) => ({
      id,
      containerEl: { ownerDocument: { defaultView: targetWindow } },
      getViewState: () => ({ type: "markdown", state: { file } }),
    });

    const liveLeaves = [
      makeLeaf("rebuilt-first", rebuiltFirstWindow, "First.md"),
      makeLeaf("rebuilt-second", rebuiltSecondWindow, "Second.md"),
      makeLeaf("third-target", thirdTargetWindow, "Third.md"),
    ];
    mockPlugin.app.workspace.iterateAllLeaves = (callback: (leaf: any) => void) => {
      liveLeaves.forEach(callback);
    };

    const setLabelSpy = vi
      .spyOn(manager, "setLayoutLabelForWindow")
      .mockImplementation(() => {});
    const snapshots = [
      {
        window: staleFirstWindow,
        layoutName: "First layout",
        leaves: [{ id: "old-first", type: "markdown", state: { file: "First.md" } }],
      },
      {
        window: staleSecondWindow,
        layoutName: "Second layout",
        leaves: [{ id: "old-second", type: "markdown", state: { file: "Second.md" } }],
      },
    ];

    (manager as any).restorePreservedWindowLabels(snapshots, thirdTargetWindow);

    expect(setLabelSpy).toHaveBeenCalledWith(rebuiltFirstWindow, "First layout");
    expect(setLabelSpy).toHaveBeenCalledWith(rebuiltSecondWindow, "Second layout");
    expect(setLabelSpy).not.toHaveBeenCalledWith(thirdTargetWindow, expect.any(String));
  });

  test("Enter restore should locate the active second popout by live container order", () => {
    const firstWindow = {} as Window;
    const secondWindow = {} as Window;
    const makeLeaf = (targetWindow: Window, rootId: string) => ({
      id: "duplicated-restored-leaf",
      containerEl: { ownerDocument: { defaultView: targetWindow } },
      getContainer: () => ({ win: targetWindow }),
      getRoot: () => ({
        id: rootId,
        getLayout: () => ({ id: rootId }),
      }),
    });
    const firstLeaf = makeLeaf(firstWindow, "runtime-root-1");
    const secondLeaf = makeLeaf(secondWindow, "runtime-root-2");
    mockPlugin.app.workspace.iterateAllLeaves = (callback: (leaf: any) => void) => {
      callback(firstLeaf);
      callback(secondLeaf);
    };
    mockPlugin.app.workspace.floatingSplit = {
      children: [{ win: firstWindow }, { win: secondWindow }],
    };
    const floatingWindows = [
      {
        id: "window-root-1",
        type: "window",
        children: [{ id: "duplicated-restored-leaf", type: "leaf" }],
      },
      {
        id: "window-root-2",
        type: "window",
        children: [{ id: "duplicated-restored-leaf", type: "leaf" }],
      },
    ];

    expect(
      (manager as any).findFloatingWindowIndexForWindow(
        secondWindow,
        floatingWindows
      )
    ).toBe(1);
  });

  test("preserved popout geometry should use and restore outer dimensions", () => {
    const resizeTo = vi.fn();
    const moveTo = vi.fn();
    const popoutWindow = {
      outerWidth: 1280,
      outerHeight: 720,
      innerWidth: 640,
      innerHeight: 360,
      screenX: 100,
      screenY: 200,
      resizeTo,
      moveTo,
    } as unknown as Window;

    const state = (manager as any).getWindowState(popoutWindow);
    expect(state).toEqual({
      size: { width: 1280, height: 720 },
      position: { x: 100, y: 200 },
    });

    (manager as any).restoreWindowGeometry(popoutWindow, state);
    expect(resizeTo).toHaveBeenCalledWith(1280, 720);
    expect(moveTo).toHaveBeenCalledWith(100, 200);
  });

  test("getOpenWindowForLayout should detect live popout window running target layout", () => {
    const mockWindow = {
      closed: false,
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
      },
    } as unknown as Window;

    const layout: WindowLayout = {
      id: "l-open",
      name: "Open Workspace",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };

    (manager as any).layoutWindows.set(layout, mockWindow);
    mockPlugin.app.workspace.iterateAllLeaves = (cb: any) => {
      cb({ containerEl: { ownerDocument: { defaultView: mockWindow } } });
    };

    expect(manager.getOpenWindowForLayout(layout)).toBe(mockWindow);
  });

  test("getOpenWindowForLayout should return null for unrelated layouts when 1 popout is open", () => {
    const mockWindow = {
      closed: false,
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
      },
    } as unknown as Window;

    const openLayout: WindowLayout = {
      id: "l-open",
      name: "Open Workspace",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: {},
        leaves: [{ id: "leaf-open", type: "markdown", state: { file: "Open.md" } }],
      },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };

    const unrelatedLayout: WindowLayout = {
      id: "l-unrelated",
      name: "Unrelated Workspace",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: {},
        leaves: [{ id: "leaf-other", type: "markdown", state: { file: "Other.md" } }],
      },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };

    mockPlugin.app.workspace.iterateAllLeaves = (cb: any) => {
      cb({
        id: "leaf-open",
        containerEl: { ownerDocument: { defaultView: mockWindow } },
        getViewState: () => ({ type: "markdown", state: { file: "Open.md" } }),
      });
    };

    expect(manager.getOpenWindowForLayout(openLayout)).toBe(mockWindow);
    expect(manager.getOpenWindowForLayout(unrelatedLayout)).toBe(null);
  });

  test("restoreWindowGeometry should skip resize and move when includeGeometry is false", () => {
    const resizeTo = vi.fn();
    const moveTo = vi.fn();
    const popoutWindow = {
      resizeTo,
      moveTo,
    } as unknown as Window;

    const state = {
      size: { width: 1280, height: 720 },
      position: { x: 100, y: 200 },
    };

    (manager as any).restoreWindowGeometry(popoutWindow, state, false);
    expect(resizeTo).not.toHaveBeenCalled();
    expect(moveTo).not.toHaveBeenCalled();
  });

  test("prepareFloatingWindowForRestore should strip geometry fields when includeGeometry is false", () => {
    const currentWindow = {
      type: "window",
      id: "win-curr",
    };

    const savedLayout = {
      type: "window",
      id: "win-saved",
      x: 300,
      y: 300,
      width: 1280,
      height: 720,
      dimension: { width: 1280, height: 720 },
      children: [],
    };

    const res = (manager as any).prepareFloatingWindowForRestore(savedLayout, currentWindow, false);
    expect(res.width).toBeUndefined();
    expect(res.height).toBeUndefined();
    expect(res.x).toBeUndefined();
    expect(res.y).toBeUndefined();
    expect(res.dimension).toBeUndefined();
  });

  test("autoSaveWindowLayout should preserve includeGeometry: false from existing layout", async () => {
    const existingLayout: WindowLayout = {
      id: "l-geom-false",
      name: "Geom False Layout",
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
      autoSave: true,
      includeGeometry: false,
      windowState: { size: { width: 1000, height: 800 } },
      workspace: {
        layout: {},
        leaves: [{ id: "leaf-1", type: "markdown", state: { file: "Notes.md" } }],
      },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };

    mockPlugin.settings.spaces.push(existingLayout);

    const mockWindow = { document: {} } as Window;
    (manager as any).layoutNames.set(mockWindow, "Geom False Layout");

    vi.spyOn(manager, "captureCurrentLayout").mockResolvedValue({
      id: "l-new-cap",
      name: "Geom False Layout",
      timestamp: Date.now(),
      windowState: { size: { width: 1000, height: 800 } },
      workspace: {
        layout: {},
        leaves: [{ id: "leaf-1", type: "markdown", state: { file: "Notes.md" } }],
      },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    });

    await manager.autoSaveWindowLayout(mockWindow);

    const currentLayoutInSettings = mockPlugin.settings.spaces[0];
    expect(currentLayoutInSettings.includeGeometry).toBe(false);
  });

  test("renameSection should update sectionsOrder and space.sections tag array", async () => {
    mockPlugin.settings.sectionsOrder = ["Work", "Personal"];
    mockPlugin.settings.spaces = [
      {
        id: "s-1",
        name: "Space 1",
        timestamp: 1000,
        sections: ["Work", "Projects"],
        windowState: { size: { width: 1000, height: 800 } },
        workspace: { layout: {}, leaves: [] },
        metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
      },
    ];

    await manager.renameSection("Work", "Office");

    expect(mockPlugin.settings.sectionsOrder).toEqual(["Office", "Personal"]);
    expect(mockPlugin.settings.spaces[0].sections).toEqual(["Office", "Projects"]);
  });

  test("toggleArchiveSpace should toggle archived flag on target space", async () => {
    mockPlugin.settings.spaces = [
      {
        id: "s-arch",
        name: "Space Arch",
        timestamp: 1000,
        archived: false,
        windowState: { size: { width: 1000, height: 800 } },
        workspace: { layout: {}, leaves: [] },
        metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
      },
    ];

    await manager.toggleArchiveSpace("s-arch");
    expect(mockPlugin.settings.spaces[0].archived).toBe(true);

    await manager.toggleArchiveSpace("s-arch");
    expect(mockPlugin.settings.spaces[0].archived).toBe(false);
  });
});
