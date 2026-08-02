import { Modal, Plugin, Notice, WorkspaceLeaf } from "obsidian";
import {
  WindowLayout,
  WindowSettings,
  ExtendedWorkspace,
  ExtendedWorkspaceLeaf,
} from "./types";
import { WindowLayoutManager } from "./manager";
import { SaveLayoutModal } from "./modals/saveModal";
import { WindowLayoutsModal } from "./modals/restoreModal";
import { WindowSpacesSettingTab } from "./settings";
import { initI18n, t } from "./i18n";
import {
  WINDOW_LAYOUTS_VIEW_TYPE,
  WindowLayoutsPanelLocation,
  WindowLayoutsView,
} from "./views/windowLayoutsView";

const DEFAULT_SETTINGS: WindowSettings = {
  spaces: [],
  autoSave: false,
  showNotifications: true,
  maxLayouts: 20,
  version: "1.0.0",
  showLayoutStatusBar: true,
  layoutStatusBarDefaultApplied: false,
  showWindowLayoutsRibbonIcon: true,
  sortBy: "updated-desc",
  sectionsOrder: [],
  groupBySection: true,
  showArchived: false,
};

export default class WindowSpacesPlugin extends Plugin {
  settings: WindowSettings;
  manager: WindowLayoutManager;
  windowLayoutsRibbonEl: HTMLElement | null = null;

  async onload() {
    // 初始化國際化
    initI18n(this.app);

    // 加載設定
    await this.loadSettings();

    // 初始化管理器
    this.manager = new WindowLayoutManager(this);
    this.manager.registerExistingPopoutWindows();

    // 註冊可固定在側欄或主工作區分頁的 Window Layouts view
    this.registerView(
      WINDOW_LAYOUTS_VIEW_TYPE,
      (leaf) => new WindowLayoutsView(leaf, this)
    );

    // 註冊命令
    this.registerCommands();

    // 刷新與添加 Ribbon 按鈕
    this.refreshRibbonIcons();

    // 添加設定頁面
    this.addSettingTab(new WindowSpacesSettingTab(this.app, this));

    // 設置事件監聽
    this.setupEventListeners();

    // 添加狀態欄指示器（可選）
    if (this.settings.showStatusBarIndicator === true) {
      this.addStatusBarIndicator();
    }
  }

  onunload() {
    this.windowLayoutsRibbonEl?.remove();
    this.windowLayoutsRibbonEl = null;

    this.manager?.clearLayoutLabels();

    // 清理自動保存
    if (this.autoSaveCleanup) {
      this.autoSaveCleanup();
    }
  }

  refreshRibbonIcons() {
    if (this.settings.showWindowLayoutsRibbonIcon) {
      if (!this.windowLayoutsRibbonEl) {
        this.windowLayoutsRibbonEl = this.addRibbonIcon(
          "layout",
          t("commands.openLayouts"),
          () => this.openWindowLayoutsModal()
        );
      }
    } else if (this.windowLayoutsRibbonEl) {
      this.windowLayoutsRibbonEl.remove();
      this.windowLayoutsRibbonEl = null;
    }
  }

  async loadSettings() {
    const savedSettings = (await this.loadData()) as
      | (Partial<WindowSettings> & { layouts?: WindowLayout[] })
      | null;
    if (savedSettings && savedSettings.layouts && !savedSettings.spaces) {
      savedSettings.spaces = savedSettings.layouts;
      delete savedSettings.layouts;
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings);

    // 將舊版「預設關閉」的狀態列設定遷移為新版預設開啟；之後尊重使用者的手動選擇。
    if (this.settings.layoutStatusBarDefaultApplied !== true) {
      this.settings.showLayoutStatusBar = true;
      this.settings.layoutStatusBarDefaultApplied = true;
      await this.saveSettings();
    }

    // 處理舊版本數據遷移
    if (!this.settings.version) {
      this.settings.version = DEFAULT_SETTINGS.version;
      await this.saveSettings();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  registerCommands() {
    // 保存當前視窗佈局
    this.addCommand({
      id: "save-current-window-layout",
      name: t("commands.saveLayout"),
      icon: "save",
      callback: async () => {
        try {
          await this.openSaveCurrentLayoutModal();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          new Notice(`${t("errors.failedToSave")}: ${message}`);
        }
      },
    });

    // 開啟 Window Spaces 彈出視窗 (與 ribbon icon 相同的入口)
    this.addCommand({
      id: "open-window-layouts",
      name: t("commands.openLayouts"),
      icon: "layout",
      callback: () => this.openWindowLayoutsModal(),
    });

    this.addCommand({
      id: "open-window-layouts-panel",
      name: t("commands.openLayoutsPanel"),
      icon: "layout",
      callback: () => void this.openWindowLayoutsPanel("tab"),
    });

    this.addCommand({
      id: "open-window-layouts-panel-left",
      name: t("commands.openLayoutsPanelLeft"),
      icon: "panel-left",
      callback: () => void this.openWindowLayoutsPanel("left"),
    });

    this.addCommand({
      id: "open-window-layouts-panel-right",
      name: t("commands.openLayoutsPanelRight"),
      icon: "panel-right",
      callback: () => void this.openWindowLayoutsPanel("right"),
    });
  }

  openSaveLayoutModal(layout: WindowLayout) {
    const modal = new SaveLayoutModal(
      this.app,
      this,
      layout,
      (savedLayout) => {
        void (async () => {
          try {
            await this.manager.saveLayout(savedLayout);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`${t("errors.failedToSave")}: ${message}`);
          }
        })();
      }
    );
    modal.open();
  }

  async openSaveCurrentLayoutModal(targetWindow?: Window): Promise<void> {
    try {
      const layout = await this.manager.captureCurrentLayout({}, targetWindow);
      this.openSaveLayoutModal(layout);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`${t("errors.failedToSave")}: ${message}`);
    }
  }

  openWindowLayoutsModal(
    targetWindow?: Window
  ): void {
    try {
      const win = targetWindow || (this.manager ? this.manager.getActiveWindow() : undefined);
      // Use a plain native Modal as the host. The shared Window Spaces
      // controller mounts here reliably, while popup-only CSS keeps its
      // toolbar visually separate from the native close X.
      const hostModal = new Modal(this.app);
      const controller = new WindowLayoutsModal(this.app, this, win);

      hostModal.setTitle(t("common.windowLayouts"));
      hostModal.onOpen = () => {
        try {
          hostModal.modalEl.addClass("window-layouts-modal");
          hostModal.modalEl.addClass("window-layouts-popout-modal");
          controller.mountInModalContainer(
            hostModal.contentEl,
            () => hostModal.close()
          );
          const titleHeader = hostModal.containerEl.querySelector<HTMLElement>(".modal-title");
          if (titleHeader) {
            controller.mountHeaderActions(titleHeader);
          }
        } catch (error: unknown) {
          console.error("[WindowSpaces] Error mounting Window Spaces picker:", error);
          const message = error instanceof Error ? error.message : String(error);
          hostModal.contentEl.empty();
          hostModal.contentEl.createEl("p", {
            text: `Error loading Window Spaces: ${message}`,
          });
        }
      };
      hostModal.onClose = () => {
        controller.unmountFromContainer();
      };
      hostModal.open();
    } catch (error: unknown) {
      console.error("[WindowSpaces] Error opening WindowLayoutsModal:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Window Spaces Error: ${message}`);
    }
  }

  async openWindowLayoutsPanel(
    location: WindowLayoutsPanelLocation = "tab",
    targetWindow?: Window
  ): Promise<WorkspaceLeaf | null> {
    // 步驟 1：最先偵測開在哪個視窗 (Main Window 或特定 Popout Window)
    const win =
      targetWindow ||
      (this.manager ? this.manager.getActiveWindow() : undefined) ||
      (typeof activeWindow !== "undefined" ? activeWindow : window);

    const isPopout =
      win !== window &&
      Boolean(
        win.document?.body?.classList.contains("is-popout-window") ||
          win.document?.body?.classList.contains("mod-popout")
      );

    const workspace = this.app.workspace as unknown as ExtendedWorkspace;

    // 處理在 Popout 視窗開啟
    if (isPopout) {
      return this.openPanelInPopoutWindow(location, win);
    }

    // 處理在 Main Window 開啟
    let root: any;
    if (location === "left") {
      root = workspace.leftSplit;
    } else if (location === "right") {
      root = workspace.rightSplit;
    } else {
      root = workspace.rootSplit;
    }

    // 步驟 2 & 3：看該 split (root) 中是否已有 Window Spaces panel 開啟，如果有就 reveal 並 active
    const existingLeaf = findLeafInRoot(workspace, root, WINDOW_LAYOUTS_VIEW_TYPE);
    if (existingLeaf) {
      await workspace.revealLeaf(existingLeaf);
      workspace.setActiveLeaf(existingLeaf, { focus: true });
      return existingLeaf;
    }

    // 沒有就在該 split 開啟 Window Space tab
    let leaf: WorkspaceLeaf;
    if (location === "left") {
      leaf = workspace.getLeftLeaf(false);
    } else if (location === "right") {
      leaf = workspace.getRightLeaf(false);
    } else {
      let mainLeaf: WorkspaceLeaf | null = null;
      workspace.iterateAllLeaves((candidate: WorkspaceLeaf) => {
        const extCandidate = candidate as unknown as ExtendedWorkspaceLeaf;
        const body = extCandidate.containerEl?.ownerDocument?.body;
        const isCandidatePopout =
          body?.classList?.contains("is-popout-window") ||
          body?.classList?.contains("mod-popout");
        if (!mainLeaf && !isCandidatePopout) mainLeaf = candidate;
      });
      if (mainLeaf) workspace.setActiveLeaf(mainLeaf, { focus: false });
      leaf = workspace.getLeaf("tab");
    }

    if (!leaf) {
      throw new Error("Unable to create a Window Layouts panel");
    }

    await leaf.setViewState({ type: WINDOW_LAYOUTS_VIEW_TYPE, state: {} });
    await workspace.revealLeaf(leaf);
    workspace.setActiveLeaf(leaf, { focus: true });
    return leaf;
  }

  private async openPanelInPopoutWindow(
    location: WindowLayoutsPanelLocation,
    win: Window
  ): Promise<WorkspaceLeaf> {
    const workspace = this.app.workspace;
    const columns = this.collectPopoutColumns(win);

    if (location === "left" || location === "right") {
      const sidebar = location === "left"
        ? findTrueLeftSidebar(win, columns)
        : findTrueRightSidebar(win, columns);

      if (sidebar) {
        // 已有滿高度的標準側欄 (紅框)
        const existingInSidebar = findLeafInTabs(sidebar.tabs, WINDOW_LAYOUTS_VIEW_TYPE);
        if (existingInSidebar) {
          await workspace.revealLeaf(existingInSidebar);
          workspace.setActiveLeaf(existingInSidebar, { focus: true });
          return existingInSidebar;
        }

        const newLeaf = await this.openPanelInTabs(sidebar.tabs);
        await workspace.revealLeaf(newLeaf);
        workspace.setActiveLeaf(newLeaf, { focus: true });
        return newLeaf;
      }

      // 尚無標準滿高度側欄 (綠框或單一/上下分割)：創立標準滿高度側欄 Vertical Split
      let editorLeaf = this.getActiveLeafInWindow(win) || this.getLastLeafInWindow(win);
      if (editorLeaf && editorLeaf.getViewState()?.type === WINDOW_LAYOUTS_VIEW_TYPE) {
        let otherLeaf: WorkspaceLeaf | null = null;
        workspace.iterateAllLeaves((l: WorkspaceLeaf) => {
          if (!otherLeaf && getWindowOfLeaf(l) === win && l.getViewState()?.type !== WINDOW_LAYOUTS_VIEW_TYPE) {
            otherLeaf = l;
          }
        });
        if (otherLeaf) editorLeaf = otherLeaf;
      }

      if (!editorLeaf) {
        return this.openPanelInPopoutEditor(win);
      }

      const targetNode = getTopLevelNodeInWindow(editorLeaf) || editorLeaf;
      const isParentNode = targetNode !== editorLeaf && Boolean((targetNode as any).children);
      const before = location === "left" ? !isParentNode : isParentNode;
      const panelLeaf = workspace.createLeafBySplit(targetNode, "vertical", before);

      await panelLeaf.setViewState({
        type: WINDOW_LAYOUTS_VIEW_TYPE,
        active: false,
        state: {}
      });

      scheduleInitialSplitSizing(panelLeaf, editorLeaf, win);

      await workspace.revealLeaf(panelLeaf);
      workspace.setActiveLeaf(panelLeaf, { focus: true });
      return panelLeaf;
    }

    // location === "tab" (在 Popout 編輯器中央區域開啟/切換)
    const allPanes = columns.reduce((acc, col) => acc.concat(col.panes), [] as PopoutPane[]);
    const targetPane = pickCenterPopoutPane(allPanes, win);
    const targetTabs = targetPane ? targetPane.tabs : (this.getActiveLeafInWindow(win)?.parent as any);

    if (targetTabs) {
      const existingInTarget = findLeafInTabs(targetTabs, WINDOW_LAYOUTS_VIEW_TYPE);
      if (existingInTarget) {
        await workspace.revealLeaf(existingInTarget);
        workspace.setActiveLeaf(existingInTarget, { focus: true });
        return existingInTarget;
      }
      const newLeaf = await this.openPanelInTabs(targetTabs);
      await workspace.revealLeaf(newLeaf);
      workspace.setActiveLeaf(newLeaf, { focus: true });
      return newLeaf;
    }

    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({
      type: WINDOW_LAYOUTS_VIEW_TYPE,
      active: true,
      state: {}
    });
    await workspace.revealLeaf(leaf);
    workspace.setActiveLeaf(leaf, { focus: true });
    return leaf;
  }

  private async openPanelInPopoutEditor(win: Window): Promise<WorkspaceLeaf> {
    const workspace = this.app.workspace;
    const columns = this.collectPopoutColumns(win);
    const allPanes = columns.reduce((acc, col) => acc.concat(col.panes), [] as PopoutPane[]);
    const targetPane = pickCenterPopoutPane(allPanes, win);

    if (targetPane) {
      const existingInTabs = findLeafInTabs(targetPane.tabs, WINDOW_LAYOUTS_VIEW_TYPE);
      if (existingInTabs) {
        await workspace.revealLeaf(existingInTabs);
        workspace.setActiveLeaf(existingInTabs, { focus: true });
        return existingInTabs;
      }
      return this.openPanelInTabs(targetPane.tabs);
    }

    const baseLeaf = this.getActiveLeafInWindow(win) ?? this.getLastLeafInWindow(win);
    if (!baseLeaf) {
      const leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: WINDOW_LAYOUTS_VIEW_TYPE,
        active: true,
        state: {}
      });
      await workspace.revealLeaf(leaf);
      workspace.setActiveLeaf(leaf, { focus: true });
      return leaf;
    }

    const tabs = baseLeaf.parent as any;
    if (tabs) {
      const existingInTabs = findLeafInTabs(tabs, WINDOW_LAYOUTS_VIEW_TYPE);
      if (existingInTabs) {
        await workspace.revealLeaf(existingInTabs);
        workspace.setActiveLeaf(existingInTabs, { focus: true });
        return existingInTabs;
      }
    }
    return this.openPanelInTabs(tabs);
  }

  private async openPanelInTabs(tabs: any): Promise<WorkspaceLeaf> {
    const workspace = this.app.workspace;
    const children = (tabs?.children ?? []) as WorkspaceLeaf[];

    for (const leaf of children) {
      if (leaf.getViewState().type === WINDOW_LAYOUTS_VIEW_TYPE) {
        await workspace.revealLeaf(leaf);
        workspace.setActiveLeaf(leaf, { focus: true });
        return leaf;
      }
    }

    const leaf = workspace.createLeafInParent(tabs, children.length);
    await leaf.setViewState({
      type: WINDOW_LAYOUTS_VIEW_TYPE,
      active: true,
      state: {}
    });
    await workspace.revealLeaf(leaf);
    workspace.setActiveLeaf(leaf, { focus: true });
    return leaf;
  }

  private collectPopoutColumns(win: Window): PopoutColumn[] {
    const panes = this.collectPopoutPanes(win);
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

  private collectPopoutPanes(win: Window): PopoutPane[] {
    const tabsSet = new Set<any>();

    this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (getWindowOfLeaf(leaf) !== win) {
        return;
      }
      if (leaf.parent) {
        tabsSet.add(leaf.parent);
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

  private getActiveLeafInWindow(win: Window): WorkspaceLeaf | null {
    const activeLeaf = this.app.workspace.activeLeaf;
    return activeLeaf && getWindowOfLeaf(activeLeaf) === win ? activeLeaf : null;
  }

  private getLastLeafInWindow(win: Window): WorkspaceLeaf | null {
    let lastLeaf: WorkspaceLeaf | null = null;
    this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (getWindowOfLeaf(leaf) === win) {
        lastLeaf = leaf;
      }
    });
    return lastLeaf;
  }

  private setupEventListeners() {
    // 監聽視窗開關
    this.registerEvent(
      this.app.workspace.on("window-open", (_workspaceWindow, popoutWindow) => {
        this.manager.registerPopoutWindow(popoutWindow);
        WindowLayoutsModal.renderAllInstances();
      })
    );

    this.registerEvent(
      this.app.workspace.on("window-close", (_workspaceWindow, popoutWindow) => {
        this.manager.unregisterPopoutWindow(popoutWindow);
        WindowLayoutsModal.renderAllInstances();
      })
    );

    // 監聽 Workspace 分頁與佈局變化（用於特定 Layout 的 5 秒 Debounced 自動儲存）
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.manager.checkAndDebouncedAutoSaveAll();
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.manager.checkAndDebouncedAutoSaveAll();
      })
    );
  }

  private addStatusBarIndicator() {
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText("Window Spaces");
    statusBarItem.onClickEvent((evt: MouseEvent) => {
      if (evt.shiftKey) {
        // Shift+點擊：快速保存
        void this.manager.captureCurrentLayout().then((layout) => {
          this.openSaveLayoutModal(layout);
        }).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          new Notice(`${t("errors.failedToSave")}: ${message}`);
        });
      } else {
        // 普通點擊：顯示佈局列表
        this.openWindowLayoutsModal();
      }
    });

    // 添加工具提示
    statusBarItem.setAttribute(
      "aria-label",
      "Window Spaces - Click to restore space, Shift+Click to save space"
    );
  }

  private autoSaveCleanup: (() => void) | null = null;
}

interface PopoutPane {
  tabs: any;
  left: number;
  width?: number;
  center: number;
}

interface PopoutColumn {
  left: number;
  width: number;
  panes: PopoutPane[];
}

const INITIAL_SPLIT_RATIO = 0.34;

function getWindowOfLeaf(leaf: WorkspaceLeaf): Window | null {
  const container = (leaf.view as any)?.containerEl;
  return container?.ownerDocument?.defaultView ?? null;
}

function getTopLevelNodeInWindow(leaf: WorkspaceLeaf): any {
  let curr: any = leaf;
  while (curr && curr.parent) {
    const parent = curr.parent;
    if (!parent.parent || parent.type === "root" || parent.isRoot || parent.kind === "root") {
      return curr;
    }
    curr = parent;
  }
  return curr;
}

function getPaneRect(tabs: any): DOMRect | null {
  const container = tabs?.containerEl;
  if (container instanceof HTMLElement) {
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  const children = (tabs?.children ?? []) as WorkspaceLeaf[];
  for (const leaf of children) {
    const leafContainer = (leaf.view as any)?.containerEl;
    if (leafContainer instanceof HTMLElement) {
      const rect = leafContainer.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
  }
  return null;
}

interface SidebarInfo {
  pane: PopoutPane;
  tabs: any;
}

function findTrueLeftSidebar(win: Window, columns: PopoutColumn[]): SidebarInfo | null {
  if (columns.length < 2) return null;
  const leftCol = columns[0];

  // 標準側欄 (紅框) 必須是該直欄唯一的全高分欄
  if (leftCol.panes.length !== 1) return null;

  const pane = leftCol.panes[0];
  const rect = getPaneRect(pane.tabs);
  const winHeight = win?.innerHeight || 600;

  if (rect) {
    const isFullHeight = rect.top < winHeight * 0.15 && (rect.top + rect.height) > winHeight * 0.85;
    if (!isFullHeight) return null;
  }

  return { pane, tabs: pane.tabs };
}

function findTrueRightSidebar(win: Window, columns: PopoutColumn[]): SidebarInfo | null {
  if (columns.length < 2) return null;
  const rightCol = columns[columns.length - 1];

  // 標準側欄 (紅框) 必須是該直欄唯一的全高分欄
  if (rightCol.panes.length !== 1) return null;

  const pane = rightCol.panes[0];
  const rect = getPaneRect(pane.tabs);
  const winHeight = win?.innerHeight || 600;

  if (rect) {
    const isFullHeight = rect.top < winHeight * 0.15 && (rect.top + rect.height) > winHeight * 0.85;
    if (!isFullHeight) return null;
  }

  return { pane, tabs: pane.tabs };
}


function pickCenterPopoutPane(panes: PopoutPane[], win: Window): PopoutPane | null {
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

function scheduleInitialSplitSizing(
  panelLeaf: WorkspaceLeaf,
  editorLeaf: WorkspaceLeaf,
  win: Window
): void {
  const raf = win.requestAnimationFrame?.bind(win) || window.requestAnimationFrame.bind(window);
  raf(() => {
    raf(() => {
      applyInitialSplitSizing(panelLeaf, editorLeaf);
    });
  });
}

function applyInitialSplitSizing(
  panelLeaf: WorkspaceLeaf,
  editorLeaf: WorkspaceLeaf
): void {
  const panelContainer = getViewContainer(panelLeaf);
  const editorContainer = getViewContainer(editorLeaf);
  if (!panelContainer || !editorContainer) return;

  const split = panelContainer.closest<HTMLElement>(".workspace-split.mod-vertical");
  if (!split || !split.contains(editorContainer)) return;

  const panelPane = getDirectSplitChild(split, panelContainer);
  const editorPane = getDirectSplitChild(split, editorContainer);
  if (!panelPane || !editorPane || panelPane === editorPane) return;

  panelPane.style.flex = `0 0 ${INITIAL_SPLIT_RATIO * 100}%`;
  editorPane.style.flex = "1 1 0%";
}

function getViewContainer(leaf: WorkspaceLeaf): HTMLElement | null {
  const container = (leaf.view as any)?.containerEl;
  return container instanceof HTMLElement ? container : null;
}

function getDirectSplitChild(split: HTMLElement, element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current && current.parentElement !== split) {
    current = current.parentElement;
  }
  return current;
}

function findLeafInTabs(tabs: any, viewType: string): WorkspaceLeaf | null {
  const children = (tabs?.children ?? []) as WorkspaceLeaf[];
  for (const leaf of children) {
    if (leaf.getViewState()?.type === viewType) {
      return leaf;
    }
  }
  return null;
}

function findLeafInRoot(workspace: any, root: any, viewType: string): WorkspaceLeaf | null {
  if (!root) return null;
  let found: WorkspaceLeaf | null = null;
  workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
    if (found) return;
    if ((leaf as any).getRoot?.() === root && leaf.getViewState()?.type === viewType) {
      found = leaf;
    }
  });
  return found;
}


