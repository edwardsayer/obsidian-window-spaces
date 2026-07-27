import { describe, test, expect, beforeEach, vi } from "vitest";
import { WindowLayoutManager } from "../src/manager";
import { WindowLayout } from "../src/types";

describe("Validation & Auto-Save Guardrails (validationAndGuardrails.test.ts)", () => {
  let manager: WindowLayoutManager;
  let mockPlugin: any;

  beforeEach(() => {
    mockPlugin = {
      app: { workspace: { getLayout: () => ({}) }, vault: {} },
      settings: {
        layouts: [],
        sortBy: "updated-desc",
      },
      saveSettings: async () => {},
    };
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

    mockPlugin.settings.layouts.push(existingLayout);

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
    const currentSettingsLayout = mockPlugin.settings.layouts[0];
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
});
