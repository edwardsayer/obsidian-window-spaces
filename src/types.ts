import { WorkspaceLeaf } from "obsidian";

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
  // 用於識別視窗的資訊
  windowInfo?: {
    windowId?: string;
    firstLeafId?: string;
  };
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

export interface ExtendedWorkspaceLeaf extends WorkspaceLeaf {
  id?: string;
  containerEl: HTMLElement;
  getViewState(): ViewState;
  setViewState(state: { type: string; state?: Record<string, unknown> }): Promise<void>;
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
}

export interface ExtendedWorkspace {
  leftSplit?: WorkspaceSplit;
  rightSplit?: WorkspaceSplit;
  rootSplit?: WorkspaceSplit;
  floatingSplit?: {
    children?: WorkspaceWindow[];
  };
  activeLeaf: WorkspaceLeaf | null;
  iterateAllLeaves(callback: (leaf: WorkspaceLeaf) => void | boolean): void;
  getLeftLeaf(split: boolean): WorkspaceLeaf;
  getRightLeaf(split: boolean): WorkspaceLeaf;
  getLeaf(type?: string): WorkspaceLeaf;
  setActiveLeaf(leaf: WorkspaceLeaf, params?: { focus?: boolean }): void;
  revealLeaf(leaf: WorkspaceLeaf): Promise<void>;
  on(name: "window-open" | "window-close", callback: (workspaceWindow: unknown, window: Window) => void): any;
  on(name: "layout-change" | "active-leaf-change", callback: () => void): any;
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

export interface WindowSettings {
  spaces: WindowLayout[];
  autoSave: boolean;
  showNotifications: boolean;
  maxLayouts: number;
  version: string;
  showStatusBarIndicator?: boolean;
  showLayoutStatusBar: boolean;
  layoutStatusBarDefaultApplied?: boolean;
  showWindowLayoutsRibbonIcon: boolean;
  sortBy?: "updated-desc" | "updated-asc" | "created-desc" | "created-asc" | "name-asc" | "name-desc";
  sectionsOrder?: string[];
  groupBySection?: boolean;
  showArchived?: boolean;
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

