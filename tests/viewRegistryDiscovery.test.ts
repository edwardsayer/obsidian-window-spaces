import type { App } from "obsidian";
import { describe, expect, test, vi } from "vitest";
import { enumerateAvailableViews, resolveViewLabel } from "../src/popout/viewRegistry";

describe("community view discovery", () => {
  test.each([["mk-path-view", "Navigator"], ["custom-panel", "Custom panel"]])(
    "discovers the open %s view and its display name without constructing another instance",
    (type, label) => {
      const creator = vi.fn();
      const workspace = {
        iterateAllLeaves(callback: (leaf: unknown) => void) {
          expect(this).toBe(workspace);
          callback({ view: { getViewType: () => type, getDisplayText: () => label } });
          callback({ view: { getViewType: () => "markdown", getDisplayText: () => "A note" } });
        },
      };
      const app = { workspace, viewRegistry: { viewByType: { "another-view": creator } } } as unknown as App;

      const available = enumerateAvailableViews(app);

      expect(available.left.filter((view) => view.viewType === type)).toHaveLength(1);
      expect(available.left.some((view) => view.viewType === "markdown")).toBe(false);
      expect(resolveViewLabel(app, type)).toBe(label);
      expect(creator).not.toHaveBeenCalled();
    }
  );

  test("skips broken live metadata and preserves registered and other open views", () => {
    const app = {
      viewRegistry: { viewByType: { "registered-view": vi.fn() } },
      workspace: {
        iterateAllLeaves(callback: (leaf: unknown) => void) {
          callback({ view: { getViewType: () => { throw new Error("Not ready"); } } });
          callback({ view: { getViewType: () => "ready-view", getDisplayText: () => "Ready" } });
        },
      },
    } as unknown as App;

    const types = enumerateAvailableViews(app).left.map((view) => view.viewType);

    expect(types).toContain("registered-view");
    expect(types).toContain("ready-view");
    expect(resolveViewLabel(app, "ready-view")).toBe("Ready");
  });
});
