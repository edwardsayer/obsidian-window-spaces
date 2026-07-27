import { describe, expect, test, vi } from "vitest";
import { WindowLayoutsModal } from "../src/modals/restoreModal";
import { WindowLayout } from "../src/types";

describe("WindowLayoutsModal restore target", () => {
  test("keeps the source popout window when restoring in a new window", async () => {
    const sourceWindow = { document: {} } as Window;
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = { manager: { restoreLayout } };
    const modal = new WindowLayoutsModal({} as any, plugin, sourceWindow);
    const layout = { id: "layout-2", name: "Second layout" } as WindowLayout;

    await (modal as any).restoreLayout(layout, true);

    expect(restoreLayout).toHaveBeenCalledWith(layout, {
      targetWindow: sourceWindow,
      forceNewWindow: true,
    });
  });

  test("restores in the source popout window when forceNewWindow is false", async () => {
    const sourceWindow = { document: {} } as Window;
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = { manager: { restoreLayout } };
    const modal = new WindowLayoutsModal({} as any, plugin, sourceWindow);
    const layout = { id: "layout-1", name: "First layout" } as WindowLayout;

    await (modal as any).restoreLayout(layout, false);

    expect(restoreLayout).toHaveBeenCalledWith(layout, {
      targetWindow: sourceWindow,
      forceNewWindow: false,
    });
  });
});
