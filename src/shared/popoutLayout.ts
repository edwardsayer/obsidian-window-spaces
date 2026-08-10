import { App, WorkspaceLeaf } from "obsidian";

/**
 * Minimal workspace structures used by the shared Popout engine.
 *
 * Keep these structural types local so this file can be copied byte-for-byte
 * into another plugin without importing plugin-specific domain types.
 */
export interface WorkspaceParent {
  parent?: WorkspaceParent;
  type?: string;
  isRoot?: boolean;
  kind?: string;
  children?: (WorkspaceLeaf | WorkspaceParent)[];
  containerEl?: HTMLElement;
}

export interface ExtendedWorkspaceLeaf extends Omit<WorkspaceLeaf, "parent"> {
  id?: string;
  containerEl: HTMLElement;
  parent?: WorkspaceParent;
  getViewState(): { type: string; state?: Record<string, unknown> };
  setViewState(state: { type: string; active?: boolean; state?: Record<string, unknown> }): Promise<void>;
}

export interface ExtendedWorkspace {
  activeLeaf: WorkspaceLeaf | null;
  getMostRecentLeaf?(root?: WorkspaceParent): WorkspaceLeaf | null;
  iterateAllLeaves(callback: (leaf: WorkspaceLeaf) => void | boolean): void;
  getLeaf(type?: string): WorkspaceLeaf;
  createLeafInParent(parent: unknown, index: number): WorkspaceLeaf;
  createLeafBySplit(target: unknown, direction: "horizontal" | "vertical", before?: boolean): WorkspaceLeaf;
  setActiveLeaf(leaf: WorkspaceLeaf, params?: { focus?: boolean }): void;
  revealLeaf(leaf: WorkspaceLeaf): Promise<void>;
}

export interface PopoutHiddenState {
  leftSidebar?: boolean;
  rightSidebar?: boolean;
  hiddenLeafIds?: string[];
}

/**
 * Generic Popout workspace Column/Pane layout engine.
 *
 * This module only provides window/DOM/layout primitives, including generic
 * pane visibility state capture/apply. Activity Bar UI, Window Spaces capture
 * and restore workflows, and interceptor/plugin policy remain outside shared.
 */

export type PopoutSide = "left" | "right";

export const INITIAL_SPLIT_RATIO = 0.34;

export interface PopoutPane {
  tabs: WorkspaceParent;
  left: number;
  width?: number;
  center: number;
}

export interface PopoutColumn {
  left: number;
  width: number;
  panes: PopoutPane[];
}

/** 判斷 DOM Window 是否為 Popout。 */
export function isPopoutWindow(win: Window | null | undefined): boolean {
  if (!win || (typeof window !== "undefined" && win === window)) return false;
  const body = win.document?.body;
  return !!body && (body.classList.contains("is-popout-window") || body.classList.contains("mod-popout"));
}

/** 取得 leaf 所屬的 DOM Window。 */
export function getWindowOfLeaf(leaf: WorkspaceLeaf | null | undefined): Window | null {
  if (!leaf) return null;
  const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
  const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
  return container?.ownerDocument?.defaultView ?? null;
}

/** 測量 WorkspaceTabs 容器本身的 DOMRect（背景 tab 寬高為 0，需測 tabs 容器）。 */
export function getPaneRect(tabs: WorkspaceParent | null | undefined): DOMRect | null {
  const container = tabs?.containerEl;
  if (container instanceof HTMLElement) {
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  const children = (tabs?.children ?? []) as WorkspaceLeaf[];
  for (const leaf of children) {
    const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
    const leafContainer = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
    if (leafContainer instanceof HTMLElement) {
      const rect = leafContainer.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
  }
  return null;
}

/** 將 X 軸重疊 > 50% 的上下垂直分割歸類為同一個水平直欄 (Column)。 */
export function collectPopoutColumns(panes: PopoutPane[]): PopoutColumn[] {
  if (panes.length === 0) return [];

  const columns: PopoutColumn[] = [];
  for (const pane of panes) {
    const paneWidth = pane.width ?? 400;
    let matchedColumn = columns.find((col) => {
      const overlap = Math.max(0, Math.min(pane.left + paneWidth, col.left + col.width) - Math.max(pane.left, col.left));
      const minWidth = Math.min(paneWidth, col.width);
      const overlapRatio = minWidth > 0 ? overlap / minWidth : 0;
      return overlapRatio > 0.5 || Math.abs(pane.left - col.left) < 30;
    });

    if (matchedColumn) {
      matchedColumn.panes.push(pane);
    } else {
      columns.push({
        left: pane.left,
        width: paneWidth,
        panes: [pane],
      });
    }
  }

  columns.sort((a, b) => a.left - b.left);
  return columns;
}

/** 向上追溯至 Popout 視窗層級的最頂層 Split 節點。 */
export function getTopLevelNodeInWindow(leaf: WorkspaceLeaf): WorkspaceLeaf | WorkspaceParent {
  let curr: WorkspaceLeaf | WorkspaceParent = leaf;
  while (curr && (curr as WorkspaceParent).parent) {
    const parent = (curr as WorkspaceParent).parent;
    if (!parent || !parent.parent || parent.type === "root" || parent.isRoot || parent.kind === "root") {
      return curr;
    }
    curr = parent;
  }
  return curr;
}

/** 尋找 leaf 的 containerEl 距離最近（含自身）的祖先中的 `.mod-root` split 元素。 */
export function findRootSplitElement(element: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = element;
  while (node) {
    if (node.classList.contains("workspace-split") && node.classList.contains("mod-root")) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** 從 element 向上找到 root 的 direct child（即頂層欄位元素）。 */
export function getDirectChildOf(root: HTMLElement, element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current && current.parentElement !== root) {
    current = current.parentElement;
  }
  return current && current.parentElement === root ? current : null;
}

/** 找到 leaf 在其 parent split 下的 direct child 元素（`.workspace-tabs` 或巢狀 split）。 */
export function getPaneContainerElement(leaf: WorkspaceLeaf): HTMLElement | null {
  const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
  const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
  if (!(container instanceof HTMLElement)) return null;

  let current: HTMLElement | null = container;
  while (current && current.parentElement) {
    if (current.parentElement.classList.contains("workspace-split")) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/** 是否為隱藏狀態（inline display:none）。 */
export function isElementHidden(el: HTMLElement | null | undefined): boolean {
  return !!el && el.style.display === "none";
}

/** 透過 Obsidian 樣式 Helper 設定 display（禁止直接指派 el.style.display）。 */
export function setElementDisplay(el: HTMLElement, display: string): void {
  const customEl = el as unknown as {
    setCssProps?: (props: Record<string, string>) => void;
  };
  if (typeof customEl.setCssProps === "function") {
    customEl.setCssProps({ display });
  } else {
    el.style.display = display;
  }
}

function setElementCssStyles(el: HTMLElement, styles: Record<string, string>): void {
  const customEl = el as unknown as {
    setCssStyles?: (styles: Record<string, string>) => void;
    setCssProps?: (props: Record<string, string>) => void;
  };
  if (typeof customEl.setCssStyles === "function") {
    customEl.setCssStyles(styles);
  } else if (typeof customEl.setCssProps === "function") {
    customEl.setCssProps(styles);
  } else {
    for (const [key, value] of Object.entries(styles)) {
      el.style.setProperty(key, value);
    }
  }
}

function getViewContainer(leaf: WorkspaceLeaf): HTMLElement | null {
  const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
  const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
  return container instanceof HTMLElement ? container : null;
}

function getDirectSplitChild(split: HTMLElement, element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current && current.parentElement !== split) {
    current = current.parentElement;
  }
  return current;
}

function scheduleInitialSplitSizing(panelLeaf: WorkspaceLeaf, editorLeaf: WorkspaceLeaf, win: Window): void {
  const raf = win.requestAnimationFrame?.bind(win) || window.requestAnimationFrame.bind(window);
  raf(() => {
    raf(() => {
      applyInitialSplitSizing(panelLeaf, editorLeaf);
    });
  });
}

function applyInitialSplitSizing(panelLeaf: WorkspaceLeaf, editorLeaf: WorkspaceLeaf): void {
  const panelContainer = getViewContainer(panelLeaf);
  const editorContainer = getViewContainer(editorLeaf);
  if (!panelContainer || !editorContainer) return;

  const split = panelContainer.closest<HTMLElement>(".workspace-split.mod-vertical");
  if (!split || !split.contains(editorContainer)) return;

  const panelPane = getDirectSplitChild(split, panelContainer);
  const editorPane = getDirectSplitChild(split, editorContainer);
  if (!panelPane || !editorPane || panelPane === editorPane) return;

  setElementCssStyles(panelPane, { flex: `0 0 ${INITIAL_SPLIT_RATIO * 100}%` });
  setElementCssStyles(editorPane, { flex: "1 1 0%" });
}

function findLeafInTabs(tabs: WorkspaceParent | null | undefined, viewType: string): WorkspaceLeaf | null {
  const children = (tabs?.children ?? []) as WorkspaceLeaf[];
  for (const leaf of children) {
    if (leaf.getViewState()?.type === viewType) {
      return leaf;
    }
  }
  return null;
}

export class PopoutLayoutEngine {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  get workspace(): ExtendedWorkspace {
    return this.app.workspace as unknown as ExtendedWorkspace;
  }

  /** 取得指定視窗中最新的 active leaf（限定該 window）。 */
  getActiveLeafInWindow(win: Window): WorkspaceLeaf | null {
    const activeLeaf =
      typeof this.workspace.getMostRecentLeaf === "function"
        ? this.workspace.getMostRecentLeaf()
        : this.workspace.activeLeaf;
    return activeLeaf && getWindowOfLeaf(activeLeaf) === win ? activeLeaf : null;
  }

  /** 取得指定視窗中最後一個 leaf（限定該 window）。 */
  getLastLeafInWindow(win: Window): WorkspaceLeaf | null {
    let lastLeaf: WorkspaceLeaf | null = null;
    this.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (getWindowOfLeaf(leaf) === win) {
        lastLeaf = leaf;
      }
    });
    return lastLeaf;
  }

  /** 取得指定視窗中所有 leaf。 */
  getLeavesForWindow(win: Window): WorkspaceLeaf[] {
    const leaves: WorkspaceLeaf[] = [];
    this.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (getWindowOfLeaf(leaf) === win) {
        leaves.push(leaf);
      }
    });
    return leaves;
  }

  /** 取得所有目前存活的 Popout DOM Window（去重）。 */
  getLivePopoutWindows(): Window[] {
    const wins: Window[] = [];
    this.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const win = getWindowOfLeaf(leaf);
      if (win && isPopoutWindow(win) && !wins.includes(win)) {
        wins.push(win);
      }
    });
    return wins;
  }

  /** 收集 Popout 視窗中的所有 Pane（測量 tabs 容器）。 */
  collectPopoutPanes(win: Window): PopoutPane[] {
    const tabsSet = new Set<WorkspaceParent>();
    this.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (getWindowOfLeaf(leaf) !== win) return;
      const parent = (leaf as unknown as ExtendedWorkspaceLeaf).parent;
      if (parent) {
        tabsSet.add(parent);
      }
    });

    const panes: PopoutPane[] = [];
    for (const tabs of tabsSet) {
      const rect = getPaneRect(tabs);
      const left = rect ? rect.left : 0;
      const width = rect ? rect.width : 400;
      panes.push({ tabs, left, width, center: left + width / 2 });
    }

    panes.sort((a, b) => a.left - b.left);
    return panes;
  }

  /** 在指定頂層欄位內尋找特定 view type 的 leaf（限定該欄位，不跨 tab group / 不跨側欄）。 */
  findLeafOfTypeInColumn(win: Window, columnEl: HTMLElement, viewType: string): WorkspaceLeaf | null {
    let found: WorkspaceLeaf | null = null;
    this.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (found) return;
      if (getWindowOfLeaf(leaf) !== win || leaf.getViewState()?.type !== viewType) return;
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
      if (container instanceof HTMLElement && columnEl.contains(container)) {
        found = leaf;
      }
    });
    return found;
  }

  private findLeafByIdInWindow(win: Window, leafId: string): WorkspaceLeaf | null {
    let found: WorkspaceLeaf | null = null;
    this.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (!found && getWindowOfLeaf(leaf) === win && (leaf as unknown as ExtendedWorkspaceLeaf).id === leafId) {
        found = leaf;
      }
    });
    return found;
  }

  private pickCenterPopoutPane(panes: PopoutPane[], win: Window): PopoutPane | null {
    const firstPane = panes[0];
    if (!firstPane) return null;
    if (panes.length === 1) return firstPane;

    const winCenter = win.innerWidth / 2;
    let bestPane = firstPane;
    let bestDistance = Infinity;
    for (const pane of panes) {
      const distance = Math.abs(pane.center - winCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPane = pane;
      }
    }
    return bestPane;
  }

  /**
   * 確保指定 Popout 的某側存在「側欄欄位」（結構化：第一/最後頂層欄位即側欄），
   * 並開啟/聚焦指定 view type。
   * - viewType 有值：建立/聚焦該 view 的 leaf。
   * - viewType 無值：僅確保欄位存在並回傳一個空 leaf（供攔截器由第三方設定 view）。
   */
  async ensureSideColumn(win: Window, side: PopoutSide, viewType?: string): Promise<WorkspaceLeaf> {
    const workspace = this.workspace;
    const columnEl = this.getColumnElement(win, side);

    if (columnEl) {
      const tabs = this.getSidebarTabsInColumn(win, columnEl);
      if (tabs) {
        if (viewType) {
          const existingInSidebar = findLeafInTabs(tabs, viewType);
          if (existingInSidebar) {
            await workspace.revealLeaf(existingInSidebar);
            workspace.setActiveLeaf(existingInSidebar, { focus: true });
            return existingInSidebar;
          }
        }
        const newLeaf = viewType
          ? await this.openPanelInTabs(tabs, viewType)
          : this.createLeafInTabs(tabs);
        await workspace.revealLeaf(newLeaf);
        workspace.setActiveLeaf(newLeaf, { focus: true });
        return newLeaf;
      }
    }

    // 尚無側欄欄位：建立貫穿全高的垂直 Split 欄位
    let editorLeaf = this.getActiveLeafInWindow(win) || this.getLastLeafInWindow(win);
    if (editorLeaf && viewType && editorLeaf.getViewState()?.type === viewType) {
      let otherLeaf: WorkspaceLeaf | null = null;
      workspace.iterateAllLeaves((l: WorkspaceLeaf) => {
        if (!otherLeaf && getWindowOfLeaf(l) === win && l.getViewState()?.type !== viewType) {
          otherLeaf = l;
        }
      });
      if (otherLeaf) editorLeaf = otherLeaf;
    }

    if (!editorLeaf) {
      return this.openPanelInEditor(win, viewType);
    }

    const targetNode = getTopLevelNodeInWindow(editorLeaf) || editorLeaf;
    const isParentNode = targetNode !== editorLeaf && Boolean((targetNode as WorkspaceParent).children);
    const before = side === "left" ? !isParentNode : isParentNode;
    const panelLeaf = workspace.createLeafBySplit(targetNode as WorkspaceLeaf, "vertical", before);

    if (viewType) {
      await panelLeaf.setViewState({
        type: viewType,
        active: false,
        state: {},
      });
    }

    scheduleInitialSplitSizing(panelLeaf, editorLeaf, win);

    await workspace.revealLeaf(panelLeaf);
    workspace.setActiveLeaf(panelLeaf, { focus: true });
    return panelLeaf;
  }

  /**
   * 在指定側欄欄位（頂層 column 元素）內解析目標 tabs 群組：
   * 優先取該欄位中 active leaf 所在的 pane，否則第一個 pane 的 tabs。
   */
  private getSidebarTabsInColumn(win: Window, columnEl: HTMLElement): WorkspaceParent | null {
    const activeLeaf = this.getActiveLeafInWindow(win);
    if (activeLeaf) {
      const tabs = this.getTabsForLeafInColumn(win, columnEl, activeLeaf);
      if (tabs) return tabs;
    }

    let firstTabs: WorkspaceParent | null = null;
    this.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (firstTabs) return;
      const tabs = this.getTabsForLeafInColumn(win, columnEl, leaf);
      if (tabs) firstTabs = tabs;
    });
    return firstTabs;
  }

  /** 若 leaf 位於指定 column 元素內，回傳其所屬 tabs 群組；否則 null。 */
  private getTabsForLeafInColumn(win: Window, columnEl: HTMLElement, leaf: WorkspaceLeaf): WorkspaceParent | null {
    if (getWindowOfLeaf(leaf) !== win) return null;
    const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
    const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
    if (container instanceof HTMLElement && columnEl.contains(container)) {
      return extLeaf.parent ?? null;
    }
    return null;
  }

  /** 攔截器專用：在指定側欄回傳一個 leaf（欄位不存在則建立），供第三方設定 view state。 */
  async openSideLeaf(win: Window, side: PopoutSide): Promise<WorkspaceLeaf> {
    return this.ensureSideColumn(win, side);
  }

  /**
   * 攔截器專用（同步版本）：`app.workspace.getLeftLeaf` 為同步 API，無法 await。
   * 同步建立/回傳側欄 leaf，不進行 reveal / setViewState（由第三方呼叫端後續設定）。
   */
  openSideLeafSync(win: Window, side: PopoutSide): WorkspaceLeaf | null {
    const workspace = this.workspace;
    const columnEl = this.getColumnElement(win, side);

    if (columnEl) {
      const tabs = this.getSidebarTabsInColumn(win, columnEl);
      if (tabs) {
        return this.createLeafInTabs(tabs);
      }
    }

    let editorLeaf = this.getActiveLeafInWindow(win) || this.getLastLeafInWindow(win);
    if (!editorLeaf) return null;

    const targetNode = getTopLevelNodeInWindow(editorLeaf) || editorLeaf;
    const isParentNode = targetNode !== editorLeaf && Boolean((targetNode as WorkspaceParent).children);
    const before = side === "left" ? !isParentNode : isParentNode;
    const panelLeaf = workspace.createLeafBySplit(targetNode as WorkspaceLeaf, "vertical", before);

    scheduleInitialSplitSizing(panelLeaf, editorLeaf, win);
    return panelLeaf;
  }

  private createLeafInTabs(tabs: WorkspaceParent | null | undefined): WorkspaceLeaf {
    const workspace = this.workspace;
    const children = (tabs?.children ?? []) as WorkspaceLeaf[];
    const leaf = workspace.createLeafInParent(
      tabs as unknown as Parameters<typeof workspace.createLeafInParent>[0],
      children.length
    );
    return leaf;
  }

  private async openPanelInTabs(tabs: WorkspaceParent | null | undefined, viewType: string): Promise<WorkspaceLeaf> {
    const leaf = this.createLeafInTabs(tabs);
    await leaf.setViewState({
      type: viewType,
      active: true,
      state: {},
    });
    return leaf;
  }

  /**
   * 統一入口：在指定 Popout 開啟/聚焦指定 view type。
   * - location "left"/"right"：側欄欄位。
   * - location "tab"：中央編輯區域。
   */
  async openPanel(
    win: Window,
    location: "left" | "right" | "tab",
    viewType: string
  ): Promise<WorkspaceLeaf> {
    if (location === "left" || location === "right") {
      return this.ensureSideColumn(win, location, viewType);
    }
    return this.ensureCenterPanel(win, viewType);
  }

  /** 在指定 Popout 的中央編輯區域開啟/聚焦指定 view type。 */
  async ensureCenterPanel(win: Window, viewType: string): Promise<WorkspaceLeaf> {
    const workspace = this.workspace;
    const panes = this.collectPopoutPanes(win);
    const targetPane = this.pickCenterPopoutPane(panes, win);

    if (targetPane) {
      const existingInTabs = findLeafInTabs(targetPane.tabs, viewType);
      if (existingInTabs) {
        await workspace.revealLeaf(existingInTabs);
        workspace.setActiveLeaf(existingInTabs, { focus: true });
        return existingInTabs;
      }
      return this.openPanelInTabs(targetPane.tabs, viewType);
    }

    const baseLeaf = this.getActiveLeafInWindow(win) ?? this.getLastLeafInWindow(win);
    if (!baseLeaf) {
      const leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: viewType,
        active: true,
        state: {},
      });
      await workspace.revealLeaf(leaf);
      workspace.setActiveLeaf(leaf, { focus: true });
      return leaf;
    }

    const tabs = (baseLeaf as unknown as ExtendedWorkspaceLeaf).parent;
    if (tabs) {
      const existingInTabs = findLeafInTabs(tabs, viewType);
      if (existingInTabs) {
        await workspace.revealLeaf(existingInTabs);
        workspace.setActiveLeaf(existingInTabs, { focus: true });
        return existingInTabs;
      }
    }
    const leaf = await this.openPanelInTabs(tabs, viewType);
    await workspace.revealLeaf(leaf);
    workspace.setActiveLeaf(leaf, { focus: true });
    return leaf;
  }

  private async openPanelInEditor(win: Window, viewType?: string): Promise<WorkspaceLeaf> {
    const workspace = this.workspace;
    const panes = this.collectPopoutPanes(win);
    const targetPane = this.pickCenterPopoutPane(panes, win);

    if (targetPane) {
      if (viewType) {
        const existingInTabs = findLeafInTabs(targetPane.tabs, viewType);
        if (existingInTabs) return existingInTabs;
      }
      return viewType
        ? this.openPanelInTabs(targetPane.tabs, viewType)
        : this.createLeafInTabs(targetPane.tabs);
    }

    const baseLeaf = this.getActiveLeafInWindow(win) ?? this.getLastLeafInWindow(win);
    if (!baseLeaf) {
      const leaf = workspace.getLeaf("tab");
      if (viewType) {
        await leaf.setViewState({ type: viewType, active: true, state: {} });
      }
      return leaf;
    }

    const tabs = (baseLeaf as unknown as ExtendedWorkspaceLeaf).parent;
    if (tabs && viewType) {
      const existingInTabs = findLeafInTabs(tabs, viewType);
      if (existingInTabs) return existingInTabs;
    }
    return viewType ? this.openPanelInTabs(tabs, viewType) : this.createLeafInTabs(tabs);
  }

  /** 判斷 leaf 是否位於 Popout 視窗的「偽側欄」（左側或右側頂層欄位）中。 */
  isLeafInSideColumn(win: Window, leaf: WorkspaceLeaf | null | undefined): boolean {
    if (!leaf || getWindowOfLeaf(leaf) !== win) return false;
    const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
    const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
    if (!(container instanceof HTMLElement)) return false;

    const leftCol = this.getColumnElement(win, "left");
    if (leftCol && leftCol.contains(container)) return true;

    const rightCol = this.getColumnElement(win, "right");
    if (rightCol && rightCol.contains(container)) return true;

    return false;
  }

  /**
   * 取得 Popout 視窗非側欄的「中央編輯區」Tabs 群組。
   * 排除包含在左側欄位或右側欄位內的 Tabs。
   */
  getCenterPanes(win: Window): PopoutPane[] {
    const panes = this.collectPopoutPanes(win);
    if (panes.length === 0) return [];

    const leftCol = this.getColumnElement(win, "left");
    const rightCol = this.getColumnElement(win, "right");

    const centerPanes = panes.filter((pane) => {
      const tabs = pane.tabs;
      const container = tabs.containerEl;
      if (container instanceof HTMLElement) {
        if (leftCol && leftCol.contains(container)) return false;
        if (rightCol && rightCol.contains(container)) return false;
      }
      const children = (tabs.children ?? []) as WorkspaceLeaf[];
      for (const leaf of children) {
        const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
        const leafContainer = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
        if (leafContainer instanceof HTMLElement) {
          if (leftCol && leftCol.contains(leafContainer)) return false;
          if (rightCol && rightCol.contains(leafContainer)) return false;
        }
      }
      return true;
    });

    return centerPanes;
  }

  /**
   * 同步取得/建立位於 Popout 視窗「中央編輯區」的 WorkspaceLeaf。
   * 用於避免側欄觸發開啟檔案時覆蓋側欄 View。
   */
  getCenterLeafSync(win: Window, newLeaf?: boolean | string): WorkspaceLeaf {
    const workspace = this.workspace;
    const centerPanes = this.getCenterPanes(win);
    const targetPane = this.pickCenterPopoutPane(centerPanes, win);

    if (targetPane) {
      const isNewTabRequested = newLeaf === true || newLeaf === "tab" || newLeaf === "split";
      if (!isNewTabRequested) {
        const children = (targetPane.tabs.children ?? []) as WorkspaceLeaf[];
        for (const leaf of children) {
          const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf & { pinned?: boolean };
          const isPinned = Boolean(extLeaf.pinned || (leaf.getViewState() as { pinned?: boolean })?.pinned);
          if (!isPinned) {
            return leaf;
          }
        }
      }
      return this.createLeafInTabs(targetPane.tabs);
    }

    // 尚無中央編輯區 (例如 Popout 視窗目前只有側欄欄位)：建立垂直 Split 放置中央區
    const baseLeaf = this.getActiveLeafInWindow(win) || this.getLastLeafInWindow(win);
    if (!baseLeaf) {
      return workspace.getLeaf("tab");
    }

    const targetNode = getTopLevelNodeInWindow(baseLeaf) || baseLeaf;
    const centerLeaf = workspace.createLeafBySplit(targetNode as WorkspaceLeaf, "vertical", false);
    return centerLeaf;
  }

  // ===== 隱藏/還原 =====

  /**
   * 取得 Popout 視窗 Root split 的頂層欄位元素（依 DOM 結構，不依賴幾何測量，
   * 因此即使欄位被 display:none 隱藏仍能正確定址）。
   */
  getTopLevelColumnElements(win: Window): HTMLElement[] {
    const leaves = this.getLeavesForWindow(win);
    if (leaves.length === 0) return [];
    const leaf = leaves[0];
    if (!leaf) return [];
    const container =
      (leaf as unknown as ExtendedWorkspaceLeaf).containerEl ||
      (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
    if (!(container instanceof HTMLElement)) return [];

    const rootEl = findRootSplitElement(container);
    if (!rootEl) return [];

    return Array.from(rootEl.children).filter((el): el is HTMLElement => {
      if (!(el instanceof HTMLElement)) return false;
      return (
        el.classList.contains("workspace-tabs") ||
        el.classList.contains("workspace-split")
      );
    });
  }

  /** 取得指定側的頂層欄位元素（DOM 結構優先，display-independent）。 */
  getColumnElement(win: Window, side: PopoutSide): HTMLElement | null {
    // 幾何測量（collectPopoutColumns）量不到 display:none 的欄位，側欄隱藏時會被
    // 誤判為最右/最左的可見欄位；因此一律先以 root split 的 direct children
    // （DOM 順序）定位左右側欄，隱藏中的側欄仍在 DOM 中，不受影響。
    const topEls = this.getTopLevelColumnElements(win);
    if (topEls.length >= 2) {
      return side === "left" ? topEls[0] ?? null : topEls[topEls.length - 1] ?? null;
    }
    return null;
  }

  /** 目前仍可見的頂層欄位數量（display:none 的欄位不計）。 */
  getVisibleColumnCount(win: Window): number {
    return this.getTopLevelColumnElements(win).filter((el) => !isElementHidden(el)).length;
  }

  isColumnHidden(win: Window, side: PopoutSide): boolean {
    return isElementHidden(this.getColumnElement(win, side));
  }

  hideColumn(win: Window, side: PopoutSide): void {
    const column = this.getColumnElement(win, side);
    if (column) setElementDisplay(column, "none");
  }

  showColumn(win: Window, side: PopoutSide): void {
    const column = this.getColumnElement(win, side);
    if (column) setElementDisplay(column, "");
  }

  hidePaneGroup(leaf: WorkspaceLeaf): void {
    const container = getPaneContainerElement(leaf);
    if (container) setElementDisplay(container, "none");
  }

  // ===== 持久化 =====

  /** 讀取指定視窗目前隱藏的欄位與 pane group。 */
  captureHiddenState(win: Window): PopoutHiddenState {
    const state: PopoutHiddenState = {};

    const leftEl = this.getColumnElement(win, "left");
    if (leftEl) state.leftSidebar = isElementHidden(leftEl);

    const rightEl = this.getColumnElement(win, "right");
    if (rightEl) state.rightSidebar = isElementHidden(rightEl);

    const hiddenIds: string[] = [];
    this.getLeavesForWindow(win).forEach((leaf) => {
      const container = getPaneContainerElement(leaf);
      if (container && isElementHidden(container)) {
        const id = (leaf as unknown as ExtendedWorkspaceLeaf).id;
        if (id) hiddenIds.push(id);
      }
    });
    if (hiddenIds.length > 0) {
      state.hiddenLeafIds = hiddenIds;
    }

    return state;
  }

  /** 於 restore 完成後重新套用隱藏狀態。 */
  applyHiddenState(win: Window, state: PopoutHiddenState | null | undefined): void {
    if (!state || !win || win.closed) return;

    if (state.leftSidebar) this.hideColumn(win, "left");
    if (state.rightSidebar) this.hideColumn(win, "right");

    if (Array.isArray(state.hiddenLeafIds)) {
      state.hiddenLeafIds.forEach((leafId) => {
        const leaf = this.findLeafByIdInWindow(win, leafId);
        if (leaf) this.hidePaneGroup(leaf);
      });
    }
  }
}
