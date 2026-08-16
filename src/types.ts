import { EventRef, Setting, WorkspaceLeaf } from "obsidian";

export interface WorkspaceParent {
  parent?: WorkspaceParent;
  type?: string;
  isRoot?: boolean;
  kind?: string;
  children?: (WorkspaceLeaf | WorkspaceParent)[];
  containerEl?: HTMLElement;
}

export interface WindowLayout {
  id: string;
  name: string;
  timestamp: number;
  createdAt?: number;
  updatedAt?: number;
  windowState: WindowState;
  workspace: WorkspaceState;
  metadata: LayoutMetadata;
  autoSave?: boolean;
  includeGeometry?: boolean;
  sections?: string[];
  archived?: boolean;
  icon?: string;
  color?: string;
  /** Popout frame inset thickness in pixels; undefined follows the global default. */
  borderInset?: number;
  /** Whether to show the folded-corner decoration; undefined follows the global default. */
  showFoldedCorner?: boolean;
  /** Per-space Activity Bar visibility and view-button selection. */
  activityBars?: {
    left?: WindowSpaceActivityBarSettings;
    right?: WindowSpaceActivityBarSettings;
  };
  // 用於識別視窗的資訊
  windowInfo?: {
    windowId?: string;
    firstLeafId?: string;
  };
  // 視窗識別記號：該 space 視窗目前的 live leaf id 集合。Obsidian 重啟後
  // floating 視窗的 leaf id 穩定保留，重啟後可直接核對此記號識別 space，
  // 不需內容比對（leaf id / 檔案 / panelId）。匹配或 restore 成功時回寫。
  leafIdMarker?: string[];
  // 隱藏的側欄/分頁群組狀態（Activity Bar 與 Pane 隱藏功能持久化）
  hidden?: PopoutHiddenState;
}

export interface WindowState {
  size: { width: number; height: number };
  position?: { x: number; y: number };
}

export interface WorkspaceState {
  layout: Record<string, unknown>;
  activeFile?: string;
  leaves: ViewState[];
}

export interface ViewState {
  id: string;
  type: string;
  state: Record<string, unknown>;
  pinned?: boolean;
}

export interface ExtendedWorkspaceLeaf extends Omit<WorkspaceLeaf, "parent"> {
  id?: string;
  containerEl: HTMLElement;
  parent?: WorkspaceParent;
  getViewState(): ViewState;
  setViewState(state: { type: string; active?: boolean; state?: Record<string, unknown> }): Promise<void>;
  rebuildView?(): void;
}

export interface WorkspaceItem {
  id?: string;
  type?: string;
  children?: WorkspaceItem[];
  leaves?: ExtendedWorkspaceLeaf[];
  win?: Window;
  doc?: Document;
  containerEl?: HTMLElement;
}

export interface WorkspaceSplit extends WorkspaceItem {
  direction?: string;
}

export interface WorkspaceWindow {
  win: Window;
  children?: WorkspaceItem[];
  getLayout(): Record<string, unknown>;
  setTitle?: (title: string) => void;
  _originalSetTitle?: (title: string) => void;
}

export interface ExtendedWorkspace {
  leftSplit?: WorkspaceSplit;
  rightSplit?: WorkspaceSplit;
  rootSplit?: WorkspaceSplit;
  floatingSplit?: {
    children?: WorkspaceWindow[];
  };
  activeLeaf: WorkspaceLeaf | null;
  getMostRecentLeaf?(root?: WorkspaceParent): WorkspaceLeaf | null;
  iterateAllLeaves(callback: (leaf: WorkspaceLeaf) => void | boolean): void;
  getLeftLeaf(split: boolean): WorkspaceLeaf;
  getRightLeaf(split: boolean): WorkspaceLeaf;
  getLeaf(type?: string): WorkspaceLeaf;
  createLeafInParent(parent: unknown, index: number): WorkspaceLeaf;
  createLeafBySplit(target: unknown, direction: "horizontal" | "vertical", before?: boolean): WorkspaceLeaf;
  setActiveLeaf(leaf: WorkspaceLeaf, params?: { focus?: boolean }): void;
  revealLeaf(leaf: WorkspaceLeaf): Promise<void>;
  on(name: "window-open" | "window-close", callback: (workspaceWindow: unknown, window: Window) => void): EventRef;
  on(name: "layout-change" | "active-leaf-change", callback: () => void): EventRef;
  getLayout(): Record<string, unknown>;
  changeLayout(layout: Record<string, unknown>): Promise<void>;
}

export interface LayoutMetadata {
  fileCount: number;
  tabCount: number;
  splitCount: number;
  missingFiles?: string[];
  createdAt: string;
  obsidianVersion: string;
  pluginVersion: string;
}

export const DEFAULT_COLOR_PRESETS: string[] = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
  "#6366f1",
];

export interface WindowSettings {
  spaces: WindowLayout[];
  autoSave: boolean;
  showNotifications: boolean;
  version: string;
  showStatusBarIndicator?: boolean;
  showLayoutStatusBar: boolean;
  layoutStatusBarDefaultApplied?: boolean;
  showWindowLayoutsRibbonIcon: boolean;
  sortBy?: "updated-desc" | "updated-asc" | "created-desc" | "created-asc" | "name-asc" | "name-desc";
  sectionsOrder?: string[];
  groupBySection?: boolean;
  showArchived?: boolean;
  defaultIcon?: string;
  colorPresets?: string[];
  /** Default Popout frame inset thickness in pixels. */
  defaultBorderInset?: number;
  /** Internal migration marker for the native-width default frame setting. */
  visualDefaultsVersion?: number;
  /** Default visibility of the Popout folded-corner decoration. */
  defaultShowFoldedCorner?: boolean;
  // Activity Bar 設定
  activityBars?: {
    left: ActivityBarItem[];
    right: ActivityBarItem[];
  };
  /** Default visibility for each Popout Activity Bar side. */
  activityBarDefaults?: {
    left: boolean;
    right: boolean;
  };
  /** Popout window theme accent decorations (tab header, splitter, panel focus, activity bar). */
  popoutAccents?: PopoutAccentSettings;
  // Workspace API 攔截器（Monkey Patch）開關，預設開啟
  workspaceInterceptorEnabled?: boolean;
}

export interface PopoutAccentSettings {
  enabled: boolean;
  splitter: boolean;
  activityBar: boolean;
}

/**
 * Activity Bar 上的單一 view 按鈕設定。
 */
export interface ActivityBarItem {
  viewType: string;
  label?: string;
  icon?: string;
  side: "left" | "right";
}

export interface WindowSpaceActivityBarSettings {
  show: boolean;
  /** Snapshot of the Activity Bar view buttons for this Space. */
  items?: ActivityBarItem[];
  /** Legacy selection format kept for backwards compatibility. */
  viewTypes?: string[];
}

/**
 * Popout 視窗的隱藏狀態（側欄欄位與分頁群組）。
 */
export interface PopoutHiddenState {
  leftSidebar?: boolean;
  rightSidebar?: boolean;
  hiddenLeafIds?: string[];
}

/**
 * Obsidian 內部 ViewRegistry 的擴充介面（非公開 API，防禦式存取）。
 */
export interface ViewRegistryEntry {
  type?: string;
  getIcon?: () => string;
  getDisplayText?: () => string;
  creator?: unknown;
}

/**
 * Obsidian `SettingGroup` 的型別宣告（Obsidian 1.12.7+ 新增，
 * 未包含於 obsidian.d.ts 1.10.3）。用於將同一 section 的設定
 * 組合成單一 panel（內部以水平分隔線連接）。
 */
export interface SettingGroupLike {
  settingEl: HTMLElement;
  nameEl?: HTMLElement;
  descEl?: HTMLElement;
  setName(name: string): this;
  setDesc(desc: string): this;
  setHeading(): this;
  addSetting(callback: (setting: Setting) => unknown): this;
  then(callback: (group: this) => unknown): this;
}

export interface ExtendedViewRegistry {
  viewByType?: Record<string, ViewRegistryEntry>;
  getViewCreator?(viewType: string): unknown;
  getIcon?(viewType: string): string;
  getDisplayText?(viewType: string): string;
}

/**
 * Obsidian 內部 workspace 擴充介面（含攔截器所需的方法）。
 */
export interface ExtendedWorkspaceWithInterceptor extends ExtendedWorkspace {
  getLeftLeaf: (split: boolean) => WorkspaceLeaf | null;
  getRightLeaf: (split: boolean) => WorkspaceLeaf | null;
  getLeavesOfType: (type: string) => WorkspaceLeaf[];
  _windowSpacesOriginalGetLeftLeaf?: (split: boolean) => WorkspaceLeaf | null;
  _windowSpacesOriginalGetRightLeaf?: (split: boolean) => WorkspaceLeaf | null;
  _windowSpacesOriginalGetLeavesOfType?: (type: string) => WorkspaceLeaf[];
  _windowSpacesInterceptorInstalled?: boolean;
}

export interface SaveLayoutOptions {
  name?: string;
  includePosition?: boolean;
  includeWindowSize?: boolean;
}

export interface RestoreLayoutOptions {
  activateImmediately?: boolean;
  validateFiles?: boolean;
  showNotifications?: boolean;
  targetWindow?: Window;
  forceNewWindow?: boolean;
  forceReload?: boolean;
  /**
   * 當此 space 已在某個存活 Popout 視窗中開啟時，直接聚焦該視窗，
   * 避免重複 restore 產生重複視窗。clone 流程不會傳入此旗標。
   */
  focusExistingWindow?: boolean;
}

