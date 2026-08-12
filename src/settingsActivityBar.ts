import { ActivityBarItem } from "./types";

export const ACTIVITY_BAR_DRAG_DATA_TYPE = "application/x-window-spaces-view-type";

function isActivityBarItem(value: ActivityBarItem | null | undefined): value is ActivityBarItem {
  return !!value && typeof value.viewType === "string" && value.viewType.trim().length > 0;
}

/**
 * Reorder activity-bar items by their stable view type rather than a DOM index.
 * A DOM index can become stale when the settings UI is rendered asynchronously.
 */
export function reorderActivityBarItems(
  items: ActivityBarItem[],
  draggedViewType: string,
  targetViewType: string,
  placeAfter: boolean
): ActivityBarItem[] | null {
  const fromIndex = items.findIndex((item) => isActivityBarItem(item) && item.viewType === draggedViewType);
  const targetIndex = items.findIndex((item) => isActivityBarItem(item) && item.viewType === targetViewType);

  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return null;

  const reordered = [...items];
  const [moved] = reordered.splice(fromIndex, 1);
  if (!moved) return null;

  const adjustedTargetIndex = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
  const insertIndex = placeAfter ? adjustedTargetIndex + 1 : adjustedTargetIndex;
  reordered.splice(insertIndex, 0, moved);
  return reordered;
}

/**
 * Keep one configured button when there is another known view that can replace
 * it. An Activity Bar may still be empty when the side has no discoverable
 * views at all (for example in a minimal vault), so that case remains allowed.
 */
export function canRemoveActivityBarItem(
  items: ActivityBarItem[],
  availableItems: ActivityBarItem[],
): boolean {
  if (items.length !== 1) return true;
  const currentType = items[0]?.viewType;
  return !availableItems.some((item) => item.viewType !== currentType);
}
