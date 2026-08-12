import { ActivityBarItem } from "../src/types";
import { reorderActivityBarItems } from "../src/settingsActivityBar";

function item(viewType: string): ActivityBarItem {
  return { viewType, side: "left" };
}

describe("activity bar drag reorder", () => {
  test("moves an item after the target using stable view types", () => {
    const items = [item("a"), item("b"), item("c")];

    const reordered = reorderActivityBarItems(items, "a", "c", true);

    expect(reordered?.map((entry) => entry.viewType)).toEqual(["b", "c", "a"]);
    expect(items.map((entry) => entry.viewType)).toEqual(["a", "b", "c"]);
  });

  test("moves an item before the target", () => {
    const items = [item("a"), item("b"), item("c")];

    const reordered = reorderActivityBarItems(items, "c", "a", false);

    expect(reordered?.map((entry) => entry.viewType)).toEqual(["c", "a", "b"]);
  });

  test("rejects a stale or unknown drag source without mutating the list", () => {
    const items = [item("a"), item("b")];

    const reordered = reorderActivityBarItems(items, "missing", "b", true);

    expect(reordered).toBeNull();
    expect(items.map((entry) => entry.viewType)).toEqual(["a", "b"]);
  });

  test("does not create an undefined item when the source and target are the same", () => {
    const items = [item("a"), item("b")];

    expect(reorderActivityBarItems(items, "a", "a", false)).toBeNull();
    expect(items.every(Boolean)).toBe(true);
  });
});
