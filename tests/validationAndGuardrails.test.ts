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
});
