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
  state: any;
  pinned?: boolean;
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
  layouts: WindowLayout[];
  autoSave: boolean;
  showNotifications: boolean;
  maxLayouts: number;
  version: string;
  showStatusBarIndicator?: boolean;
  showLayoutStatusBar: boolean;
  layoutStatusBarDefaultApplied?: boolean;
  showRestoreRibbonIcon: boolean;
  showManageRibbonIcon: boolean;
  sortBy?: "updated-desc" | "updated-asc" | "created-desc" | "created-asc" | "name-asc" | "name-desc";
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
}
