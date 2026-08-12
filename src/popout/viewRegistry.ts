import { App, setIcon, WorkspaceLeaf } from "obsidian";
import { ActivityBarItem, ExtendedViewRegistry } from "../types";

/**
 * View type 列舉與解析工具。
 *
 * 三層組合（設計書 §4.3）：
 * 1. 內建精選清單（固定、可離線）。
 * 2. 防禦式讀取 `app.viewRegistry.viewByType`（非公開 API，try/catch）。
 * 3. 自訂 type 輸入（由設定頁處理）。
 */

/** 內建側欄可用的精選 View（icon 為 Lucide icon 名稱）。 */
export const BUILTIN_SIDEBAR_VIEWS: ActivityBarItem[] = [
  { viewType: "file-explorer", label: "File explorer", icon: "folder", side: "left" },
  { viewType: "search", label: "Search", icon: "search", side: "left" },
  { viewType: "outline", label: "Outline", icon: "list-tree", side: "left" },
  { viewType: "window-spaces-layouts", label: "Window Spaces", icon: "layout", side: "left" },
  { viewType: "bookmarks", label: "Bookmarks", icon: "bookmark", side: "right" },
  { viewType: "backlink", label: "Backlinks", icon: "link", side: "right" },
  { viewType: "tag", label: "Tags", icon: "tag", side: "right" },
  { viewType: "all-properties", label: "Properties", icon: "list", side: "right" },
  { viewType: "canvas", label: "Canvas", icon: "frame", side: "right" },
];

/** 已知非側欄可嵌入的 View type（列舉時排除）。 */
const EXCLUDED_VIEW_TYPES = new Set<string>([
  "empty",
  "markdown",
  "pdf",
  "image",
  "audio",
  "video",
  "release-notes",
  "sync",
]);

function getViewRegistry(app: App): ExtendedViewRegistry {
  return (app as unknown as { viewRegistry?: ExtendedViewRegistry })?.viewRegistry ?? {};
}

/** 從 viewRegistry 動態取得 view type 清單（防禦式）。 */
export function getRegistryViewTypes(app: App): string[] {
  try {
    const registry = getViewRegistry(app);
    const viewByType = registry.viewByType;
    if (!viewByType || typeof viewByType !== "object") return [];
    return Object.keys(viewByType).filter((type) => !EXCLUDED_VIEW_TYPES.has(type));
  } catch {
    return [];
  }
}

/** 設定 icon 並驗證是否成功渲染（無效名稱會產生空 svg）。 */
export function setIconWithCheck(el: HTMLElement, name: string): boolean {
  try {
    el.empty();
    setIcon(el, name);
    const svg = el.querySelector("svg");
    return !!svg && svg.children.length > 0;
  } catch {
    return false;
  }
}

/** 檔案類型 view 的固定 icon（Obsidian 無公開的文件類型 icon API）。 */
const FILE_VIEW_ICONS: Record<string, string> = {
  markdown: "file-text",
  pdf: "file-text",
  image: "image",
  audio: "audio",
  video: "video",
  canvas: "frame",
};

/** 取得檔案類型 view 的固定 icon（無則回傳 null）。 */
export function getFileTypeIcon(viewType: string): string | null {
  return FILE_VIEW_ICONS[viewType] ?? null;
}

/** 取得某 view type 的 icon（檔案固定 icon → 快取 → 內建清單 → fallback）。 */
export function resolveViewIcon(_app: App, viewType: string): string {
  const fixedFileIcon = FILE_VIEW_ICONS[viewType];
  if (fixedFileIcon) return fixedFileIcon;

  const cached = iconCache.get(viewType);
  if (cached?.icon) return cached.icon;

  const builtin = BUILTIN_SIDEBAR_VIEWS.find((item) => item.viewType === viewType);
  const icon = builtin?.icon ?? null;
  iconCache.set(viewType, { icon, dynamicAttempted: cached?.dynamicAttempted ?? false });
  return icon ?? "layout";
}

/**
 * 把 view 的 icon 套用到按鈕上：
 * - 0：檔案類型 view 使用固定 icon。
 * - 快取/內建硬編碼 icon。
 * - 兜底："layout"。
 * 若 `opts.allowDynamicIcon`（activity bar 中的 view 且無自訂 icon），在一般路徑都找不到
 * icon 時，會以非同步觸發動態偵測（掃描全部視窗已開啟的 leaf → 動態建立不可見實體），
 * 找到後直接更新按鈕。
 */
export function applyViewIcon(
  btn: HTMLElement,
  app: App,
  viewType: string,
  opts?: { allowDynamicIcon?: boolean }
): void {
  // 0：檔案類型 view 使用固定 icon
  const fixedFileIcon = FILE_VIEW_ICONS[viewType];
  if (fixedFileIcon && setIconWithCheck(btn, fixedFileIcon)) return;

  const cached = iconCache.get(viewType);
  const icon = cached?.icon ?? BUILTIN_SIDEBAR_VIEWS.find((item) => item.viewType === viewType)?.icon ?? null;
  if (icon) {
    setIconWithCheck(btn, icon);
  } else {
    setIcon(btn, "layout");
  }

  // 動態偵測（gated）：僅在「無固定/內建 icon」且「此 view 位於 activity bar」且「尚未嘗試過」時進行，
  // 避免為無關 view 浪費掃描 / 建立實體的開銷。
  if (!icon && opts?.allowDynamicIcon && !cached?.dynamicAttempted) {
    iconCache.set(viewType, { icon: null, dynamicAttempted: true });
    void detectViewIcon(app, viewType).then((dynamicIcon) => {
      if (!dynamicIcon) return;
      iconCache.set(viewType, { icon: dynamicIcon, dynamicAttempted: true });
      if (btn.isConnected) setIconWithCheck(btn, dynamicIcon);
    });
  }
}

/**
 * 套用 ActivityBarItem 的 icon：若有自訂 icon 先用自訂，否則走 applyViewIcon
 * （並允許動態偵測，因為這是 activity bar 中已設定的 view）。
 */
export function applyItemIcon(btn: HTMLElement, app: App, item: ActivityBarItem): void {
  if (item.icon && setIconWithCheck(btn, item.icon)) return;
  applyViewIcon(btn, app, item.viewType, { allowDynamicIcon: true });
}

// ===== 動態 icon 偵測 =====

/** icon 快取：icon 為 null 表示「未找到」，dynamicAttempted 表示已嘗試過動態偵測。 */
interface IconCacheEntry {
  icon: string | null;
  dynamicAttempted: boolean;
}
const iconCache = new Map<string, IconCacheEntry>();

/** 掃描全部視窗已開啟的 leaf，找該 view 的實體並取其 `view.getIcon()`。 */
function findIconFromOpenLeaves(app: App, viewType: string): string | null {
  let found: string | null = null;
  const ws = app.workspace as unknown as {
    iterateAllLeaves?: (cb: (leaf: { view?: unknown }) => void) => void;
  };
  if (typeof ws.iterateAllLeaves !== "function") return null;

  ws.iterateAllLeaves((leaf) => {
    if (found) return;
    const view = leaf?.view as { getViewType?: () => string; getIcon?: () => string } | undefined;
    if (!view) return;
    try {
      const vt = typeof view.getViewType === "function" ? view.getViewType() : "";
      if (vt !== viewType) return;
      const icon = typeof view.getIcon === "function" ? view.getIcon() : "";
      if (icon && typeof icon === "string") found = icon;
    } catch {
      // skip this leaf
    }
  });
  return found;
}

type ViewCreatorFn = (leaf: WorkspaceLeaf) => { getIcon?: () => string };

/** 以多種內部存取方式取得 view creator（registry 方法 → entry 欄位）。 */
function getViewCreatorForType(app: App, viewType: string): ViewCreatorFn | null {
  const registry = getViewRegistry(app);
  let creator: ViewCreatorFn | null = null;

  if (typeof registry.getViewCreator === "function") {
    const c = registry.getViewCreator(viewType);
    if (typeof c === "function") creator = c as ViewCreatorFn;
  }

  if (!creator) {
    const entry = (registry.viewByType ?? {})[viewType];
    // 情況 A：viewByType[type] 本身就是 view creator function
    if (typeof entry === "function") {
      creator = entry as ViewCreatorFn;
    } else if (entry && typeof entry === "object") {
      // 情況 B：entry 物件內含 creator 欄位
      for (const key of ["creator", "view", "viewCreator"] as const) {
        const candidate = (entry as { creator?: unknown; view?: unknown; viewCreator?: unknown })[key];
        if (typeof candidate === "function") {
          creator = candidate as ViewCreatorFn;
          break;
        }
      }
    }
  }

  return creator;
}

/** 嘗試直接呼叫 registry entry 上的 getIcon（若 Obsidian 內部有提供）。 */
function getIconFromRegistryEntry(app: App, viewType: string): string | null {
  const entry = getViewRegistry(app).viewByType?.[viewType];
  if (entry && typeof entry.getIcon === "function") {
    try {
      const icon = entry.getIcon();
      if (icon && typeof icon === "string") return icon;
    } catch {
      // fallthrough
    }
  }
  return null;
}

/** 動態建立該 view 的一個不可見實體（detached container）並取其 `getIcon()`。 */
async function getIconFromEphemeralView(app: App, viewType: string): Promise<string | null> {
  const creator = getViewCreatorForType(app, viewType);
  if (!creator) return null;

  const host = document.createElement("div");
  host.style.display = "none";
  try {
    document.body.appendChild(host);

    // 提供完整點的 fake leaf（Obsidian View 建構子會讀 leaf.app / viewState / history 等）
    const leaf = {
      app,
      containerEl: host,
      view: null,
      viewState: { type: viewType, state: {}, eState: {} },
      // View 基底建構子建立導覽按鈕時會讀 leaf.history.backHistory / forwardHistory
      history: { backHistory: [], forwardHistory: [] },
      parent: null,
      getViewState: () => ({ type: viewType, state: {}, eState: {} }),
      setViewState: () => Promise.resolve(),
      getRoot: () => null,
      detach: () => undefined,
    } as unknown as WorkspaceLeaf;

    const view = creator(leaf) as { getIcon?: () => string };
    (leaf as { view?: unknown }).view = view;

    const icon = typeof view.getIcon === "function" ? view.getIcon() : "";
    return icon && typeof icon === "string" ? icon : null;
  } catch (error: unknown) {
    console.debug(`[Window Spaces] Ephemeral view creation failed for "${viewType}"`, error);
    return null;
  } finally {
    host.remove();
  }
}

/** 以真實 leaf（getLeaf + setViewState）建立實體取 icon，讀取後立即 detach。 */
async function getIconFromRealLeaf(app: App, viewType: string): Promise<string | null> {
  const workspace = app.workspace as unknown as {
    getLeaf?: (type: string) => WorkspaceLeaf;
  };
  if (typeof workspace.getLeaf !== "function") return null;

  let leaf: WorkspaceLeaf | null = null;
  try {
    leaf = workspace.getLeaf("tab");
    // 先隱藏 leaf 容器再開 view，避免 tab 開啟觸發版面計算（forced reflow）
    const container = (leaf as unknown as { containerEl?: HTMLElement }).containerEl;
    if (container instanceof HTMLElement) {
      container.style.display = "none";
    }
    await leaf.setViewState({ type: viewType, active: false, state: {} });
    const view = (leaf as unknown as { view?: { getIcon?: () => string } }).view;
    const icon = view && typeof view.getIcon === "function" ? view.getIcon() : "";
    return icon && typeof icon === "string" ? icon : null;
  } catch {
    return null;
  } finally {
    if (leaf && typeof leaf.detach === "function") {
      try {
        leaf.detach();
      } catch {
        // ignore
      }
    }
  }
}

/** 動態偵測 view icon：掃全部視窗 → registry entry → 不可見實體 → 真實 leaf 兜底。 */
async function detectViewIcon(app: App, viewType: string): Promise<string | null> {
  const openIcon = findIconFromOpenLeaves(app, viewType);
  if (openIcon) return openIcon;

  const entryIcon = getIconFromRegistryEntry(app, viewType);
  if (entryIcon) return entryIcon;

  const ephemeralIcon = await getIconFromEphemeralView(app, viewType);
  if (ephemeralIcon) return ephemeralIcon;

  return getIconFromRealLeaf(app, viewType);
}

/**
 * 重新進行動態 icon 偵測（掃描全部視窗 + 動態建立不可見實體）。
 * 用於使用者從 View type list 選定新的 view、且該 view 尚未解析到 icon 時。
 * 已有 icon 時直接回傳快取結果。
 */
export async function ensureViewIcon(app: App, viewType: string): Promise<string | null> {
  const cached = iconCache.get(viewType);
  if (cached?.icon) return cached.icon;

  const icon = await detectViewIcon(app, viewType);
  iconCache.set(viewType, { icon, dynamicAttempted: true });
  return icon;
}

/** 設定頁 icon 選擇器提供的候選 icon 清單。 */
export const ICON_CHOICES = [
  "folder", "search", "list-tree", "bookmark", "link", "tag", "list",
  "layout", "frame", "canvas", "history", "star", "hash", "file-text",
  "image", "audio", "video", "calendar", "mail", "message-square",
  "command", "terminal", "code", "pen", "pencil", "note", "copy",
  "settings", "sliders-horizontal", "filter", "globe", "eye",
  "eye-off", "check", "x", "plus", "minus", "arrow-right", "arrow-left",
  "arrow-up", "arrow-down", "chevron-up", "chevron-down", "chevron-left",
  "chevron-right", "panel-left", "panel-right", "panel-top", "panel-bottom",
  "columns", "rows", "layout-grid", "layout-list", "grid", "inbox",
  "archive", "trash", "refresh-cw", "more-horizontal", "more-vertical",
] as const;


/**
 * 將 viewType ID 美化為標題大小寫（如 "folder-spaces-explorer" -> "Folder Spaces Explorer"）。
 */
export function formatViewTypeId(viewType: string): string {
  if (!viewType) return "";
  return viewType
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** 取得某 view type 的顯示名稱（registry → 內建清單 → 美化 viewType）。 */
export function resolveViewLabel(app: App, viewType: string): string {
  // 1. 優先取 view 自己在 viewRegistry 註冊的 display text
  try {
    const registry = getViewRegistry(app);
    const label =
      typeof registry.getDisplayText === "function" ? registry.getDisplayText(viewType) : "";
    if (label) return label;
  } catch {
    // fallthrough
  }

  // 2. 取內建清單
  const builtin = BUILTIN_SIDEBAR_VIEWS.find((item) => item.viewType === viewType);
  if (builtin?.label) return builtin.label;

  // 3. Fallback：純粹將 ID 的 '-' 替換為空格，單詞首字母大寫
  return formatViewTypeId(viewType);
}

/** 依 view 的顯示名稱排序，名稱相同時以 view type 作穩定排序。 */
export function sortViewTypesByLabel(app: App, viewTypes: string[]): string[] {
  return [...viewTypes].sort((a, b) => {
    const labelOrder = resolveViewLabel(app, a).localeCompare(
      resolveViewLabel(app, b),
      undefined,
      { sensitivity: "base" },
    );
    return labelOrder || a.localeCompare(b);
  });
}

/**
 * 將內建精選 + 動態 registry view 合併為「可用 view type」清單（去重）。
 * 回傳 items 已依照 `side` 分派至 left / right。
 */
export function enumerateAvailableViews(app: App): {
  left: ActivityBarItem[];
  right: ActivityBarItem[];
} {
  const seen = new Set<string>();
  const left: ActivityBarItem[] = [];
  const right: ActivityBarItem[] = [];

  const push = (item: ActivityBarItem) => {
    if (seen.has(item.viewType)) return;
    seen.add(item.viewType);
    if (item.side === "right") right.push(item);
    else left.push(item);
  };

  BUILTIN_SIDEBAR_VIEWS.forEach(push);

  const registryTypes = getRegistryViewTypes(app);
  for (const type of registryTypes) {
    if (!seen.has(type)) {
      push({
        viewType: type,
        side: "left",
      });
    }
  }

  return { left, right };
}
