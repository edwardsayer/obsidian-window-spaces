import { describe, test, expect, beforeEach } from "vitest";
import { WindowLayoutManager } from "../src/manager";
import { WindowLayout } from "../src/types";

describe("Layout Tree Parsing & Extraction (layoutTree.test.ts)", () => {
  let manager: WindowLayoutManager;

  beforeEach(() => {
    const mockApp: any = { workspace: { getLayout: () => ({}) }, vault: {} };
    const mockPlugin: any = { app: mockApp, settings: { spaces: [] } };
    manager = new WindowLayoutManager(mockPlugin);
  });

  test("should recursively extract all leaves from nested split and tabs layout tree", () => {
    const layoutTree: any = {
      type: "split",
      id: "root-split",
      direction: "horizontal",
      children: [
        {
          type: "tabs",
          id: "tab-group-1",
          children: [
            { id: "leaf-1", type: "leaf", state: { type: "markdown", state: { file: "Doc1.md" } } },
            { id: "leaf-2", type: "leaf", state: { type: "markdown", state: { file: "Doc2.md" } } },
          ],
        },
        {
          type: "split",
          id: "nested-split",
          direction: "vertical",
          children: [
            {
              type: "tabs",
              id: "tab-group-2",
              children: [
                { id: "leaf-3", type: "leaf", state: { type: "markdown", state: { file: "Doc3.md" } } },
              ],
            },
          ],
        },
      ],
    };

    const extracted = (manager as any).extractLeavesFromLayout(layoutTree);
    expect(extracted.length).toBe(3);
    expect(extracted.map((l: any) => l.id)).toEqual(["leaf-1", "leaf-2", "leaf-3"]);
  });

  test("should merge explicit workspace.leaves with layout tree leaves gracefully", () => {
    const layout: WindowLayout = {
      id: "l-compat",
      name: "Compat Layout",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: {
        layout: {
          type: "leaf",
          id: "leaf-tree-1",
          state: { type: "markdown", state: { file: "MainDoc.md" } },
        },
        leaves: [
          { id: "leaf-tree-1", type: "markdown", state: { file: "MainDoc.md", mode: "source" } },
          { id: "leaf-explicit-2", type: "markdown", state: { file: "ExtraDoc.md", mode: "preview" } },
        ],
      },
      metadata: { fileCount: 2, tabCount: 2, splitCount: 0 },
    };

    const savedViewStates = (manager as any).getSavedViewStates(layout);
    expect(savedViewStates.length).toBe(2);
    expect(savedViewStates[0].id).toBe("leaf-tree-1");
    expect(savedViewStates[1].id).toBe("leaf-explicit-2");
  });
});
