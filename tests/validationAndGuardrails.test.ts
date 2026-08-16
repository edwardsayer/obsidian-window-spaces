import { describe, test, expect, beforeEach, vi } from "vitest";
import { WindowLayoutManager } from "../src/manager";
import { WindowLayout } from "../src/types";
import { initI18n } from "../src/i18n";
import * as obsidianModule from "obsidian";

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

  test("WindowLayout preserves custom icon and color fields when validated and saved", () => {
    const validWithIconAndColor: WindowLayout = {
      id: "v-icon-color",
      name: "Styled Layout",
      timestamp: Date.now(),
      icon: "🚀",
      color: "#ef4444",
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };
    expect((manager as any).validateLayout(validWithIconAndColor)).toBe(true);
    expect(validWithIconAndColor.icon).toBe("🚀");
    expect(validWithIconAndColor.color).toBe("#ef4444");
  });

  test("ensureViewRendered rebuilds only when content is empty and view is not a file view", () => {
    const contentEl = document.createElement("div");
    contentEl.classList.add("view-content");
    const leafEl = document.createElement("div");
    leafEl.appendChild(contentEl);

    const leaf = {
      containerEl: leafEl,
      view: { containerEl: leafEl, file: undefined },
      rebuildView: vi.fn(),
      getViewState: () => ({ type: "file-explorer", state: {} }),
      setViewState: vi.fn().mockResolvedValue(undefined),
    };

    // 未渲染（.view-content 無子元素）→ 強制 rebuildView
    manager.ensureViewRendered(leaf as any);
    expect(leaf.rebuildView).toHaveBeenCalled();

    // 已渲染 → 不重建
    leaf.rebuildView.mockClear();
    contentEl.appendChild(document.createElement("span"));
    manager.ensureViewRendered(leaf as any);
    expect(leaf.rebuildView).not.toHaveBeenCalled();

    // DOM 仍空白時，多次 lifecycle retry 也只允許一次 rebuild，避免 view 抖動
    contentEl.innerHTML = "";
    leaf.rebuildView.mockClear();
    manager.ensureViewRendered(leaf as any);
    manager.ensureViewRendered(leaf as any);
    expect(leaf.rebuildView).toHaveBeenCalledTimes(1);

    // 檔案類 view（.file 存在）→ 即使空白也不重建
    leaf.rebuildView.mockClear();
    contentEl.innerHTML = "";
    (leaf as any).view.file = { path: "a.md" };
    manager.ensureViewRendered(leaf as any);
    expect(leaf.rebuildView).not.toHaveBeenCalled();
  });

  test("delays Popout tab rendering until after activation events", () => {
    const contentEl = document.createElement("div");
    contentEl.classList.add("view-content");
    const leafEl = document.createElement("div");
    leafEl.appendChild(contentEl);
    document.body.appendChild(leafEl);

    const leaf = {
      containerEl: leafEl,
      view: { containerEl: leafEl, file: undefined },
      rebuildView: vi.fn(),
      getViewState: () => ({ type: "search", state: {} }),
      setViewState: vi.fn().mockResolvedValue(undefined),
    };
    const callbacks: Array<() => void> = [];
    const popoutWindow = {
      closed: false,
      setTimeout: (callback: () => void) => {
        callbacks.push(callback);
        return 0;
      },
    } as unknown as Window;

    manager.scheduleViewRenderAfterActivation(leaf as any, popoutWindow);
    expect(leaf.rebuildView).not.toHaveBeenCalled();

    callbacks[0]();
    expect(leaf.rebuildView).toHaveBeenCalledTimes(1);
    leafEl.remove();
  });

  test("openNewPopoutWindow delegates to the shared popout window API", async () => {
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

    const leaf: any = { setViewState: vi.fn() };
    const centerLeaf: any = { id: "center-leaf" };
    mockPlugin.popoutLayout = {
      openNewPopoutWindow: vi.fn().mockResolvedValue({ win: popoutWindow, leaf }),
      getCenterLeafSync: vi.fn().mockReturnValue(centerLeaf),
    };
    mockPlugin.app.workspace.setActiveLeaf = vi.fn();

    const result = await manager.openNewPopoutWindow();

    expect(mockPlugin.popoutLayout.openNewPopoutWindow).toHaveBeenCalled();
    expect(result).toBe(popoutWindow);
    expect(mockPlugin.popoutLayout.getCenterLeafSync).toHaveBeenCalledWith(popoutWindow);
    expect(mockPlugin.app.workspace.setActiveLeaf).toHaveBeenCalledWith(centerLeaf, { focus: true });
  });

  test("manual restore of an open target uses target-only reconcile", async () => {
    const popoutWindow = {
      closed: false,
      document: { body: { classList: { contains: (name: string) => name === "is-popout-window" } } },
    } as unknown as Window;
    const layout: WindowLayout = {
      id: "startup-matching-space",
      name: "IRM-1",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: { type: "leaf", id: "leaf-1", state: { type: "empty", state: {} } }, leaves: [] },
      metadata: { fileCount: 0, tabCount: 1, splitCount: 0 },
    };
    mockPlugin.settings.spaces = [layout];

    vi.spyOn(manager, "matchUnlabeledPopoutWindows").mockImplementation(() => {});
    vi.spyOn(manager, "getLivePopoutWindows").mockReturnValue([popoutWindow]);
    vi.spyOn(manager, "getLayoutNameForWindow").mockReturnValue("IRM-1");
    const inPlaceSpy = vi.spyOn(manager as any, "restoreOpenSpaceInPlace").mockResolvedValue(undefined);
    const workspaceRestoreSpy = vi.spyOn(manager as any, "restoreLayoutInternal");

    await manager.restoreLayout(layout, {
      targetWindow: popoutWindow,
      forceReload: true,
      showNotifications: false,
    });

    expect(inPlaceSpy).toHaveBeenCalledWith(layout, popoutWindow, {
      targetWindow: popoutWindow,
      forceReload: true,
      showNotifications: false,
    });
    expect(workspaceRestoreSpy).toHaveBeenCalledTimes(1);
  });

  test("startup reconcile reapplies each identified space via target-only path", async () => {
    const irmWin = {
      closed: false,
      document: { body: { classList: { contains: (name: string) => name === "is-popout-window" } } },
    } as unknown as Window;
    const personalWin = {
      closed: false,
      document: { body: { classList: { contains: (name: string) => name === "is-popout-window" } } },
    } as unknown as Window;
    const layout1: WindowLayout = {
      id: "startup-reconcile-1",
      name: "IRM-1",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: { type: "leaf", id: "leaf-1", state: { type: "empty", state: {} } }, leaves: [] },
      metadata: { fileCount: 0, tabCount: 1, splitCount: 0 },
    };
    const layout2: WindowLayout = {
      id: "startup-reconcile-2",
      name: "Personal",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: { type: "leaf", id: "leaf-2", state: { type: "empty", state: {} } }, leaves: [] },
      metadata: { fileCount: 0, tabCount: 1, splitCount: 0 },
    };
    mockPlugin.settings.spaces = [layout1, layout2];

    vi.spyOn(manager, "matchUnlabeledPopoutWindows").mockImplementation(() => {});
    vi.spyOn(manager, "getLivePopoutWindows").mockReturnValue([irmWin, personalWin]);
    vi.spyOn(manager, "getLayoutNameForWindow")
      .mockImplementation((w) => (w === irmWin ? "IRM-1" : w === personalWin ? "Personal" : null));
    const inPlaceSpy = vi.spyOn(manager as any, "restoreOpenSpaceInPlace").mockResolvedValue(undefined);
    const globalRestoreSpy = vi.spyOn(manager, "restoreLayout").mockResolvedValue(undefined);

    await manager.reconcileOpenSpacesOnStartup();

    expect(inPlaceSpy).toHaveBeenCalledWith(layout1, irmWin, { showNotifications: false, skipGeometry: true });
    expect(inPlaceSpy).toHaveBeenCalledWith(layout2, personalWin, { showNotifications: false, skipGeometry: true });
    expect(globalRestoreSpy).not.toHaveBeenCalled();
  });

  test("restore focuses the existing popout window for an already-open space when focusExistingWindow is set", async () => {
    const popoutBody = {
      classList: { contains: (className: string) => className === "is-popout-window" },
    };
    const existingWindow = {
      document: { body: popoutBody },
      focus: vi.fn(),
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      },
    } as unknown as Window;
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

    await manager.restoreLayout(layout, {
      forceNewWindow: true,
      focusExistingWindow: true,
      showNotifications: false,
    });

    expect(focusSpy).toHaveBeenCalledWith(existingWindow, null);
    expect(openPopoutLeaf).not.toHaveBeenCalled();
  });

  test("delayed popout focus retries yield after the user switches windows", () => {
    const hasFocus = vi.fn(() => false);
    const popoutWindow = {
      document: { hasFocus },
      focus: vi.fn(),
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      },
    } as unknown as Window;

    manager.focusTargetWindow(popoutWindow);

    expect(popoutWindow.focus).toHaveBeenCalledTimes(1);
    expect(hasFocus).toHaveBeenCalled();
  });

  test("clone restore (forceNewWindow without focusExistingWindow) still creates a new popout for an already-open space", async () => {
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
      id: "clone-space",
      name: "Cloned Space",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: { type: "leaf", id: "leaf-clone", state: { type: "empty", state: {} } },
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

  test("geometry reconcile tolerates up to five pixels of native restore drift", () => {
    const resizeTo = vi.fn();
    const moveTo = vi.fn();
    const popoutWindow = {
      outerWidth: 1276,
      outerHeight: 748,
      screenX: 4,
      screenY: 5,
      resizeTo,
      moveTo,
    } as unknown as Window;

    (manager as any).restoreWindowGeometry(popoutWindow, {
      size: { width: 1280, height: 752 },
      position: { x: 0, y: 0 },
    }, true, false);

    expect(resizeTo).not.toHaveBeenCalled();
    expect(moveTo).not.toHaveBeenCalled();
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

  test("saved panel identity prevents shared-file spaces from matching the wrong popout", () => {
    const makeWindow = () => ({
      closed: false,
      document: {
        body: { classList: { contains: () => true } },
      },
    }) as unknown as Window;
    const wrongWindow = makeWindow();
    const layout: WindowLayout = {
      id: "panel-identity-layout",
      name: "Professional",
      timestamp: Date.now(),
      windowState: { size: { width: 1280, height: 752 } },
      workspace: {
        layout: {},
        leaves: [{
          id: "saved-panel-leaf",
          type: "folder-spaces-explorer",
          state: { panelId: "professional-panel", folderPath: "Professional" },
        }],
      },
      metadata: { fileCount: 0, tabCount: 1, splitCount: 0 },
    };

    mockPlugin.app.workspace.iterateAllLeaves = (cb: any) => {
      cb({
        id: "different-leaf",
        containerEl: { ownerDocument: { defaultView: wrongWindow } },
        getViewState: () => ({
          type: "folder-spaces-explorer",
          state: { panelId: "personal-panel", folderPath: "Personal" },
        }),
      });
    };

    expect((manager as any).findWindowForSavedLeaves(
      layout.workspace.leaves,
      undefined,
      null,
      new Set(),
      true
    )).toBe(null);
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

  test("suppresses restore notifications when showNotifications is false", async () => {
    const noticeSpy = vi.spyOn(obsidianModule, "Notice");
    mockPlugin.settings.showNotifications = false;

    const layout: WindowLayout = {
      id: "no-notice-layout",
      name: "No Notice Space",
      timestamp: 1000,
      windowState: { size: { width: 1000, height: 800 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 0, tabCount: 0, splitCount: 0 },
    };

    vi.spyOn(manager as any, "restoreLayoutInternal").mockResolvedValue(undefined);

    await manager.restoreLayout(layout);

    expect(noticeSpy).not.toHaveBeenCalled();
    noticeSpy.mockRestore();
  });

  test("matchUnlabeledPopoutWindows automatically identifies popout space names on startup matching open leaves/files", () => {
    const createMockPopout = (file: string, id: string) => {
      const attributes = new Map<string, string>();
      const body = {
        classList: { contains: (cls: string) => cls === "is-popout-window" },
        getAttribute: (attr: string) => attributes.get(attr) || null,
        setAttribute: (attr: string, val: string) => attributes.set(attr, val),
        querySelectorAll: () => [],
        createDiv: () => document.createElement("div"),
      };
      const win: any = {
        outerWidth: 1000,
        outerHeight: 800,
        setTimeout: (cb: () => void) => {
          cb();
          return 0;
        },
      };
      const doc: any = {
        body,
        defaultView: win,
      };
      win.document = doc;

      const leafEl = { ownerDocument: doc };
      const leaf = {
        containerEl: leafEl,
        id,
        getViewState: () => ({
          type: "markdown",
          state: { file },
        }),
      };
      return { win: win as Window, leaf, doc, body };
    };

    const pop1 = createMockPopout("projectA/note1.md", "leaf-p1");
    const pop2 = createMockPopout("projectB/note2.md", "leaf-p2");

    mockPlugin.app.workspace.iterateAllLeaves = (cb: (leaf: any) => void) => {
      cb(pop1.leaf);
      cb(pop2.leaf);
    };

    mockPlugin.settings.spaces = [
      {
        id: "space-alpha",
        name: "Alpha Workspace",
        timestamp: 1000,
        windowState: { size: { width: 1000, height: 800 } },
        workspace: {
          layout: {},
          leaves: [
            {
              id: "leaf-p1",
              type: "markdown",
              state: { file: "projectA/note1.md" },
            },
          ],
        },
        metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
      },
      {
        id: "space-beta",
        name: "Beta Workspace",
        timestamp: 2000,
        windowState: { size: { width: 1000, height: 800 } },
        workspace: {
          layout: {},
          leaves: [
            {
              id: "leaf-p2",
              type: "markdown",
              state: { file: "projectB/note2.md" },
            },
          ],
        },
        metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
      },
    ];

    manager.matchUnlabeledPopoutWindows();

    expect(manager.getLayoutNameForWindow(pop1.win)).toBe("Alpha Workspace");
    expect(manager.getLayoutNameForWindow(pop2.win)).toBe("Beta Workspace");
    expect(pop1.body.getAttribute("data-layout-name")).toBe("Alpha Workspace");
    expect(pop2.body.getAttribute("data-layout-name")).toBe("Beta Workspace");
  });

  test("matchUnlabeledPopoutWindows does not overwrite existing space names or match zero-score windows", () => {
    const createMockPopout = (file: string, id: string, initialName?: string) => {
      const attributes = new Map<string, string>();
      if (initialName) attributes.set("data-layout-name", initialName);
      const body = {
        classList: { contains: (cls: string) => cls === "is-popout-window" },
        getAttribute: (attr: string) => attributes.get(attr) || null,
        setAttribute: (attr: string, val: string) => attributes.set(attr, val),
        querySelectorAll: () => [],
        createDiv: () => document.createElement("div"),
      };
      const win: any = {
        outerWidth: 1000,
        outerHeight: 800,
        setTimeout: (cb: () => void) => {
          cb();
          return 0;
        },
      };
      const doc: any = {
        body,
        defaultView: win,
      };
      win.document = doc;

      const leafEl = { ownerDocument: doc };
      const leaf = {
        containerEl: leafEl,
        id,
        getViewState: () => ({
          type: "markdown",
          state: { file },
        }),
      };
      return { win: win as Window, leaf, doc, body };
    };

    const pop1 = createMockPopout("existing.md", "leaf-existing", "Existing Space");
    const pop2 = createMockPopout("unknown.md", "leaf-unknown");

    mockPlugin.app.workspace.iterateAllLeaves = (cb: (leaf: any) => void) => {
      cb(pop1.leaf);
      cb(pop2.leaf);
    };

    mockPlugin.settings.spaces = [
      {
        id: "space-gamma",
        name: "Gamma Space",
        timestamp: 1000,
        workspace: {
          layout: {},
          leaves: [{ id: "leaf-other", type: "markdown", state: { file: "other.md" } }],
        },
        metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
      },
    ];

    manager.matchUnlabeledPopoutWindows();

    expect(manager.getLayoutNameForWindow(pop1.win)).toBe("Existing Space");
    expect(manager.getLayoutNameForWindow(pop2.win)).toBeNull();
  });

  test("matchUnlabeledPopoutWindows does not match a newly opened popout that merely shares one file (no strong feature hit)", () => {
    // 情境：Folder Spaces「open in new window」開的新 popout（leaf id / panelId 全新），
    // 點開一個與 saved space 相同的檔案 → 不應被誤匹配為 saved Space。
    const attributes = new Map<string, string>();
    const body = {
      classList: { contains: (cls: string) => cls === "is-popout-window" },
      getAttribute: (attr: string) => attributes.get(attr) || null,
      setAttribute: (attr: string, val: string) => attributes.set(attr, val),
      querySelectorAll: () => [],
      createDiv: () => document.createElement("div"),
    };
    const win: any = { outerWidth: 1000, outerHeight: 800, setTimeout: (cb: () => void) => { cb(); return 0; } };
    const doc: any = { body, defaultView: win };
    win.document = doc;
    const leafEl = { ownerDocument: doc };

    // 新開的 popout：leaf id 全新、無 panelId（folder space 尚無，或 panelId 不同）
    const popLeaf = {
      containerEl: leafEl,
      id: "leaf-fresh-" + Date.now(),
      getViewState: () => ({ type: "markdown", state: { file: "projectA/note1.md" } }),
    };
    mockPlugin.app.workspace.iterateAllLeaves = (cb: (leaf: any) => void) => cb(popLeaf);

    mockPlugin.settings.spaces = [
      {
        id: "space-alpha",
        name: "Alpha Workspace",
        timestamp: 1000,
        windowState: { size: { width: 1000, height: 800 } },
        workspace: {
          layout: {},
          leaves: [
            { id: "leaf-p1", type: "markdown", state: { file: "projectA/note1.md" } },
          ],
        },
        metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
      },
    ];

    manager.matchUnlabeledPopoutWindows();

    expect(manager.getLayoutNameForWindow(win)).toBeNull();
    expect(body.getAttribute("data-layout-name")).toBeNull();
  });

  test("restore skips setting the popout leaf active when the user is already in the main window", async () => {
    const setActiveLeaf = vi.fn();
    const targetWin = {
      document: {
        hasFocus: vi.fn(() => false), // popout 未持有焦點
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
      },
      focus: vi.fn(),
      setTimeout: () => 0, // 不執行延遲重試
      closed: false,
    } as unknown as Window;
    const popoutLeaf = {
      containerEl: { ownerDocument: { defaultView: targetWin } },
    };
    const hasFocusSpy = vi.spyOn(document, "hasFocus").mockReturnValue(true); // 主視窗持有焦點

    mockPlugin.settings.showNotifications = false;
    mockPlugin.app.workspace = {
      getLayout: () => ({ floating: [] }),
      openPopoutLeaf: () => popoutLeaf,
      changeLayout: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf,
      iterateAllLeaves: () => {},
    };

    vi.spyOn(manager as any, "getOpenWindowForLayout").mockReturnValue(null);
    vi.spyOn(manager as any, "capturePreservedWindowLayouts").mockReturnValue([]);
    vi.spyOn(manager as any, "getSavedViewStates").mockReturnValue([]);
    vi.spyOn(manager, "getLivePopoutWindows")
      .mockReturnValueOnce([]) // popoutWinsBefore：尚未建立任何視窗
      .mockReturnValue([targetWin]); // 輪詢 + step 4
    vi.spyOn(manager as any, "getLeavesForWindow").mockReturnValue([popoutLeaf]);
    vi.spyOn(manager as any, "restoreWindowGeometry").mockImplementation(() => {});
    vi.spyOn(manager as any, "restorePreservedWindowLabels").mockImplementation(() => {});
    vi.spyOn(manager as any, "setLayoutLabelForWindow").mockImplementation(() => {});
    vi.spyOn(manager as any, "refreshLayoutLabels").mockImplementation(() => {});

    const layout: WindowLayout = {
      id: "poison-guard",
      name: "Poison Guard",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: { type: "leaf", id: "leaf-poison", state: { type: "empty", state: {} } },
        leaves: [],
      },
      metadata: { fileCount: 0, tabCount: 0, splitCount: 0 },
    };

    await manager.restoreLayout(layout, { forceNewWindow: true, showNotifications: false });

    // 主視窗持有焦點時，不得把全域 activeLeaf 指到 popout leaf，也不得搶回焦點
    expect(setActiveLeaf).not.toHaveBeenCalled();
    expect(targetWin.focus).not.toHaveBeenCalled();
    hasFocusSpy.mockRestore();
  });

  test("restore still activates the popout leaf when the popout has focus", async () => {
    const setActiveLeaf = vi.fn();
    const targetWin = {
      document: {
        hasFocus: vi.fn(() => true), // popout 持有焦點
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
      },
      focus: vi.fn(),
      setTimeout: () => 0,
      closed: false,
    } as unknown as Window;
    const popoutLeaf = {
      containerEl: { ownerDocument: { defaultView: targetWin } },
    };
    const hasFocusSpy = vi.spyOn(document, "hasFocus").mockReturnValue(false); // 主視窗未持有焦點

    mockPlugin.settings.showNotifications = false;
    mockPlugin.app.workspace = {
      getLayout: () => ({ floating: [] }),
      openPopoutLeaf: () => popoutLeaf,
      changeLayout: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf,
      iterateAllLeaves: () => {},
    };

    vi.spyOn(manager as any, "getOpenWindowForLayout").mockReturnValue(null);
    vi.spyOn(manager as any, "capturePreservedWindowLayouts").mockReturnValue([]);
    vi.spyOn(manager as any, "getSavedViewStates").mockReturnValue([]);
    vi.spyOn(manager, "getLivePopoutWindows")
      .mockReturnValueOnce([])
      .mockReturnValue([targetWin]);
    vi.spyOn(manager as any, "getLeavesForWindow").mockReturnValue([popoutLeaf]);
    vi.spyOn(manager as any, "restoreWindowGeometry").mockImplementation(() => {});
    vi.spyOn(manager as any, "restorePreservedWindowLabels").mockImplementation(() => {});
    vi.spyOn(manager as any, "setLayoutLabelForWindow").mockImplementation(() => {});
    vi.spyOn(manager as any, "refreshLayoutLabels").mockImplementation(() => {});

    const layout: WindowLayout = {
      id: "focus-ok",
      name: "Focus OK",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: { type: "leaf", id: "leaf-focus-ok", state: { type: "empty", state: {} } },
        leaves: [],
      },
      metadata: { fileCount: 0, tabCount: 0, splitCount: 0 },
    };

    await manager.restoreLayout(layout, { forceNewWindow: true, showNotifications: false });

    expect(setActiveLeaf).toHaveBeenCalledWith(popoutLeaf, { focus: true });
    expect(targetWin.focus).toHaveBeenCalledTimes(1);
    hasFocusSpy.mockRestore();
  });
});

describe("findWindowForSavedLeaves coverage guard (Active badge accuracy)", () => {
  let manager: WindowLayoutManager;
  let mockPlugin: any;

  beforeEach(() => {
    mockPlugin = {
      app: { workspace: {}, vault: {} },
      settings: { spaces: [], sortBy: "updated-desc" },
      saveSettings: async () => {},
    };
    initI18n(mockPlugin.app);
    manager = new WindowLayoutManager(mockPlugin);
  });

  /** 建立一個 popout 視窗的 mock leaf（body 帶 is-popout-window class）。 */
  const makePopoutLeaves = (entries: Array<{ id: string; type: string; file?: string }>) => {
    const body = { classList: { contains: (cls: string) => cls === "is-popout-window" }, getAttribute: () => null };
    const win = { document: { body }, closed: false };
    const leaves = entries.map((e) => ({
      id: e.id,
      containerEl: { ownerDocument: { defaultView: win, body } },
      getViewState: () => ({ type: e.type, state: e.file ? { file: e.file } : {} }),
    }));
    mockPlugin.app.workspace.iterateAllLeaves = (cb: (leaf: unknown) => void) => leaves.forEach(cb);
    return win;
  };

  test("通用檔名（Untitled.md）低覆蓋率時不誤匹配：IRM-1 saved 3 檔僅 1 檔命中 → null", () => {
    makePopoutLeaves([
      { id: "a1", type: "markdown", file: "Professional/4.md" },
      { id: "a2", type: "markdown", file: "Untitled.md" },
      { id: "a3", type: "markdown", file: "Untitled.md" },
      { id: "a4", type: "markdown", file: "Untitled.md" },
      { id: "a5", type: "markdown", file: "Untitled.md" },
    ]);
    const saved = [
      { id: "x1", type: "markdown", state: { file: "Untitled.md" } },
      { id: "x2", type: "markdown", state: { file: "IRM-MOC.md" } },
      { id: "x3", type: "markdown", state: { file: "IRM/IMR-P1/P1-RA.md" } },
    ];
    const win = (manager as any).findWindowForSavedLeaves(saved, undefined, null, new Set(), true);
    expect(win).toBeNull();
  });

  test("saved 檔案高覆蓋率（4/4）時正常匹配", () => {
    const win = makePopoutLeaves([
      { id: "a1", type: "markdown", file: "Professional/4.md" },
      { id: "a2", type: "markdown", file: "Untitled.md" },
      { id: "a3", type: "markdown", file: "Professional/productivity/12-weeks one Year.md" },
      { id: "a4", type: "markdown", file: "my self/My TASK.md" },
    ]);
    const saved = [
      { id: "x1", type: "markdown", state: { file: "Professional/4.md" } },
      { id: "x2", type: "markdown", state: { file: "Untitled.md" } },
      { id: "x3", type: "markdown", state: { file: "Professional/productivity/12-weeks one Year.md" } },
      { id: "x4", type: "markdown", state: { file: "my self/My TASK.md" } },
    ];
    const result = (manager as any).findWindowForSavedLeaves(saved, undefined, null, new Set(), true);
    expect(result).toBe(win);
  });

  test("leaf id 命中（高置信）即使檔案覆蓋率低也接受", () => {
    const win = makePopoutLeaves([
      { id: "x1", type: "markdown", file: "Untitled.md" },
      { id: "other", type: "search" },
    ]);
    const saved = [
      { id: "x1", type: "markdown", state: { file: "IRM-MOC.md" } },
      { id: "x2", type: "markdown", state: { file: "IRM/IMR-P1/P1-RA.md" } },
      { id: "x3", type: "markdown", state: { file: "Untitled.md" } },
    ];
    const result = (manager as any).findWindowForSavedLeaves(saved, undefined, null, new Set(), true);
    expect(result).toBe(win);
  });

  test("restore 不覆蓋已選中的 tab（全域 activeLeaf 已在 popout 內時，不再強設第一個 leaf）", async () => {
    const setActiveLeaf = vi.fn();
    const targetWin = {
      document: {
        hasFocus: vi.fn(() => true),
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
      },
      focus: vi.fn(),
      setTimeout: () => 0,
      closed: false,
    } as unknown as Window;
    const firstTabLeaf = { containerEl: { ownerDocument: { defaultView: targetWin } } };
    const selectedTabLeaf = { containerEl: { ownerDocument: { defaultView: targetWin } } };
    const hasFocusSpy = vi.spyOn(document, "hasFocus").mockReturnValue(false);

    mockPlugin.settings.showNotifications = false;
    mockPlugin.app.workspace = {
      getLayout: () => ({ floating: [] }),
      openPopoutLeaf: () => selectedTabLeaf,
      changeLayout: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf,
      // restoreFileStatesForWindow 已把 active 設到「layout 保存時選中的 tab」
      activeLeaf: selectedTabLeaf,
      iterateAllLeaves: () => {},
    };

    vi.spyOn(manager as any, "getOpenWindowForLayout").mockReturnValue(null);
    vi.spyOn(manager as any, "capturePreservedWindowLayouts").mockReturnValue([]);
    vi.spyOn(manager as any, "getSavedViewStates").mockReturnValue([]);
    vi.spyOn(manager, "getLivePopoutWindows")
      .mockReturnValueOnce([])
      .mockReturnValue([targetWin]);
    // 第一個 leaf 是「第一個 column 的第一個 tab」（不同於選中的 tab）
    vi.spyOn(manager as any, "getLeavesForWindow").mockReturnValue([firstTabLeaf, selectedTabLeaf]);
    vi.spyOn(manager as any, "restoreWindowGeometry").mockImplementation(() => {});
    vi.spyOn(manager as any, "restorePreservedWindowLabels").mockImplementation(() => {});
    vi.spyOn(manager as any, "setLayoutLabelForWindow").mockImplementation(() => {});
    vi.spyOn(manager as any, "refreshLayoutLabels").mockImplementation(() => {});

    const layout: WindowLayout = {
      id: "no-steal-active",
      name: "No Steal Active",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: { type: "leaf", id: "leaf-ns", state: { type: "empty", state: {} } },
        leaves: [],
      },
      metadata: { fileCount: 0, tabCount: 0, splitCount: 0 },
    };

    await manager.restoreLayout(layout, { forceNewWindow: true, showNotifications: false });

    // 全域 activeLeaf 已是選中的 tab → 不得被覆蓋為第一個 leaf
    expect(setActiveLeaf).not.toHaveBeenCalled();
    expect(targetWin.focus).toHaveBeenCalledTimes(1);
    hasFocusSpy.mockRestore();
  });

  test("buildSimpleWindowStructure 恢復每個 tab group 的 currentTab（不把第一個 tab 設為 active）", async () => {
    const setActiveLeaf = vi.fn();
    const revealLeaf = vi.fn().mockResolvedValue(undefined);
    const targetWin = { document: { body: {} } } as unknown as Window;
    const initialLeaf = { parent: {} };
    const leafA = { parent: {} };
    const leafB = { parent: {} };

    mockPlugin.app.workspace = {
      createLeafInParent: vi.fn().mockReturnValueOnce(leafA).mockReturnValueOnce(leafB),
      createLeafBySplit: vi.fn(),
      revealLeaf,
      setActiveLeaf,
      iterateAllLeaves: () => {},
    };

    vi.spyOn(manager as any, "getLeavesForWindow").mockReturnValue([initialLeaf]);
    vi.spyOn(manager as any, "applyBuiltLeafState").mockResolvedValue(undefined);
    vi.spyOn(manager as any, "applySavedSplitDimensions").mockImplementation(() => {});

    // 單一 split 內的 tabs 群組：saved currentTab = 1（選中第 2 個 tab）
    const rootNode = {
      type: "window",
      children: [
        {
          type: "split",
          direction: "horizontal",
          children: [
            {
              type: "tabs",
              currentTab: 1,
              children: [
                { type: "leaf", id: "l0", state: { type: "empty" } },
                { type: "leaf", id: "l1", state: { type: "empty" } },
                { type: "leaf", id: "l2", state: { type: "empty" } },
              ],
            },
          ],
        },
      ],
    };

    await (manager as any).buildSimpleWindowStructure(targetWin, rootNode);

    // groupLeaves = [initialLeaf, leafA, leafB]；currentTab=1 → leafA
    expect(revealLeaf).toHaveBeenCalledWith(leafA);
    expect(setActiveLeaf).toHaveBeenCalledWith(leafA, { focus: false });
  });
});
