import { describe, test, expect, beforeEach } from "vitest";
import { WindowLayoutManager } from "../src/manager";
import { WindowLayout } from "../src/types";
import { initI18n } from "../src/i18n";

describe("Smart Layout Name Generation (generateSmartLayoutName)", () => {
  let manager: WindowLayoutManager;

  beforeEach(() => {
    const mockApp: any = {
      vault: {
        getAbstractFileByPath: () => null,
      },
      workspace: {
        getLayout: () => ({}),
      },
    };
    initI18n(mockApp);
    const mockPlugin: any = {
      app: mockApp,
      settings: { spaces: [] },
    };
    manager = new WindowLayoutManager(mockPlugin);
  });

  test("should prioritize pinned files over active and normal files", () => {
    const layout: WindowLayout = {
      id: "layout-1",
      name: "",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: {},
        activeFile: "projects/ActiveDoc.md",
        leaves: [
          { id: "l1", type: "markdown", state: { file: "projects/NormalDoc.md" } },
          { id: "l2", type: "markdown", state: { file: "projects/ActiveDoc.md" } },
          { id: "l3", type: "markdown", state: { file: "notes/PinnedDoc.md" }, pinned: true },
        ],
      },
      metadata: { fileCount: 3, tabCount: 3, splitCount: 0 },
    };

    const smartName = manager.generateSmartLayoutName(layout);
    expect(smartName).toContain("PinnedDoc");
    expect(smartName.startsWith("PinnedDoc")).toBe(true);
  });

  test("should handle single file layout correctly without extension", () => {
    const layout: WindowLayout = {
      id: "layout-2",
      name: "",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: {},
        activeFile: "notes/MyNote.md",
        leaves: [
          { id: "l1", type: "markdown", state: { file: "notes/MyNote.md" } },
        ],
      },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0 },
    };

    const smartName = manager.generateSmartLayoutName(layout);
    expect(smartName).toBe("MyNote");
  });

  test("should format 2 files as [File1] & [File2]", () => {
    const layout: WindowLayout = {
      id: "layout-3",
      name: "",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: {},
        activeFile: "Doc1.md",
        leaves: [
          { id: "l1", type: "markdown", state: { file: "Doc1.md" } },
          { id: "l2", type: "markdown", state: { file: "Doc2.md" } },
        ],
      },
      metadata: { fileCount: 2, tabCount: 2, splitCount: 0 },
    };

    const smartName = manager.generateSmartLayoutName(layout);
    expect(smartName).toBe("Doc1 & Doc2");
  });

  test("should format 3+ files with (+N) overflow indicator", () => {
    const layout: WindowLayout = {
      id: "layout-4",
      name: "",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: {},
        activeFile: "Doc1.md",
        leaves: [
          { id: "l1", type: "markdown", state: { file: "Doc1.md" } },
          { id: "l2", type: "markdown", state: { file: "Doc2.md" } },
          { id: "l3", type: "markdown", state: { file: "Doc3.md" } },
          { id: "l4", type: "markdown", state: { file: "Doc4.md" } },
        ],
      },
      metadata: { fileCount: 4, tabCount: 4, splitCount: 0 },
    };

    const smartName = manager.generateSmartLayoutName(layout);
    expect(smartName).toBe("Doc1, Doc2 and others");
  });

  test("should prioritize Folder Space Explorer folder name over pinned/active files", () => {
    const layout: WindowLayout = {
      id: "layout-fs",
      name: "",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: {},
        activeFile: "projects/ActiveDoc.md",
        leaves: [
          { id: "l1", type: "markdown", state: { file: "notes/PinnedDoc.md" }, pinned: true },
          { id: "l2", type: "folder-space-explorer", state: { folder: "Projects/Frontend/ReactApp" } },
        ],
      },
      metadata: { fileCount: 1, tabCount: 2, splitCount: 0 },
    };

    const smartName = manager.generateSmartLayoutName(layout);
    expect(smartName).toBe("ReactApp");
  });
});
