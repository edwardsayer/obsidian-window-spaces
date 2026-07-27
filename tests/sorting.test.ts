import { describe, test, expect, beforeEach } from "vitest";
import { WindowLayoutManager } from "../src/manager";
import { WindowLayout } from "../src/types";
import { initI18n } from "../src/i18n";

describe("Layout Sorting & Timestamp Copy Logic (sorting.test.ts)", () => {
  let manager: WindowLayoutManager;
  let mockPlugin: any;

  const sampleLayouts: WindowLayout[] = [
    {
      id: "l-alpha",
      name: "Alpha Layout",
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 5000,
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    },
    {
      id: "l-beta",
      name: "Beta Layout",
      timestamp: 2000,
      createdAt: 3000,
      updatedAt: 3000,
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    },
    {
      id: "l-gamma",
      name: "Gamma Layout",
      timestamp: 3000,
      createdAt: 2000,
      updatedAt: 9000,
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    },
  ];

  beforeEach(() => {
    const mockApp: any = { workspace: { getLayout: () => ({}) }, vault: {} };
    initI18n(mockApp);
    mockPlugin = {
      app: mockApp,
      settings: {
        layouts: JSON.parse(JSON.stringify(sampleLayouts)),
        sortBy: "updated-desc",
      },
      saveSettings: async () => {},
    };
    manager = new WindowLayoutManager(mockPlugin);
  });

  test("should sort by updated-desc by default (newest updated first)", () => {
    const sorted = manager.getSavedLayouts();
    expect(sorted[0].name).toBe("Gamma Layout"); // updatedAt 9000
    expect(sorted[1].name).toBe("Alpha Layout"); // updatedAt 5000
    expect(sorted[2].name).toBe("Beta Layout");  // updatedAt 3000
  });

  test("should sort by updated-asc (oldest updated first)", () => {
    mockPlugin.settings.sortBy = "updated-asc";
    const sorted = manager.getSavedLayouts();
    expect(sorted[0].name).toBe("Beta Layout");  // updatedAt 3000
    expect(sorted[1].name).toBe("Alpha Layout"); // updatedAt 5000
    expect(sorted[2].name).toBe("Gamma Layout"); // updatedAt 9000
  });

  test("should sort by created-desc (newest created first)", () => {
    mockPlugin.settings.sortBy = "created-desc";
    const sorted = manager.getSavedLayouts();
    expect(sorted[0].name).toBe("Beta Layout");  // createdAt 3000
    expect(sorted[1].name).toBe("Gamma Layout"); // createdAt 2000
    expect(sorted[2].name).toBe("Alpha Layout"); // createdAt 1000
  });

  test("should sort by name-asc (A to Z)", () => {
    mockPlugin.settings.sortBy = "name-asc";
    const sorted = manager.getSavedLayouts();
    expect(sorted[0].name).toBe("Alpha Layout");
    expect(sorted[1].name).toBe("Beta Layout");
    expect(sorted[2].name).toBe("Gamma Layout");
  });

  test("should reset createdAt & updatedAt when copying A layout to a new B layout name", async () => {
    const originalLayout: WindowLayout = {
      id: "l-orig",
      name: "Original A",
      timestamp: 100,
      createdAt: 100,
      updatedAt: 200,
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };

    // 模擬將 Original A 複製/改名另存為 Copied B
    const copiedLayout: WindowLayout = {
      ...JSON.parse(JSON.stringify(originalLayout)),
      id: "l-new-b",
      name: "Copied B",
    };

    const beforeSave = Date.now();
    await manager.saveLayout(copiedLayout);
    const afterSave = Date.now();

    const savedB = mockPlugin.settings.layouts.find((l: any) => l.name === "Copied B");
    expect(savedB).toBeDefined();
    expect(savedB.createdAt).toBeGreaterThanOrEqual(beforeSave);
    expect(savedB.createdAt).toBeLessThanOrEqual(afterSave);
    expect(savedB.updatedAt).toBe(savedB.createdAt);
  });
});
