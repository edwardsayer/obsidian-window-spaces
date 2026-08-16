import { Modal, Plugin, Notice, WorkspaceLeaf } from "obsidian";
import {
  WindowLayout,
  WindowSettings,
  ExtendedWorkspace,
  ExtendedWorkspaceLeaf,
  WorkspaceSplit,
  DEFAULT_COLOR_PRESETS,
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
import {
  getWindowOfLeaf,
  isPopoutWindow,
  PopoutLayoutEngine,
} from "./shared/popoutLayout";
import { acquirePopoutLayoutEngine, releasePopoutLayoutEngine } from "./shared/popoutLayoutRegistry";
import {
  SHARED_API_VERSION,
  SHARED_COMPATIBLE_FROM_VERSION,
  SHARED_IMPLEMENTATION_REVISION,
} from "./shared/sharedVersion";
import { PopoutActivityBarManager } from "./popout/activityBar";
import { WorkspaceInterceptor } from "./popout/workspaceInterceptor";
import { BUILTIN_SIDEBAR_VIEWS } from "./popout/viewRegistry";
import { DEFAULT_SPACE_ICON } from "./spaceVisuals";

const DEFAULT_SETTINGS: WindowSettings = {
  spaces: [],
  autoSave: false,
  showNotifications: true,
  version: "1.0.0",
  showLayoutStatusBar: true,
  layoutStatusBarDefaultApplied: false,
  showWindowLayoutsRibbonIcon: true,
  sortBy: "updated-desc",
  sectionsOrder: [],
  groupBySection: true,
  showArchived: false,
  defaultIcon: DEFAULT_SPACE_ICON,
  colorPresets: DEFAULT_COLOR_PRESETS,
  defaultBorderInset: 1,
  visualDefaultsVersion: 1,
  defaultShowFoldedCorner: true,
  activityBars: {
    left: BUILTIN_SIDEBAR_VIEWS.filter((item) => item.side === "left"),
    right: BUILTIN_SIDEBAR_VIEWS.filter((item) => item.side === "right"),
  },
  activityBarDefaults: {
    left: true,
    right: true,
  },
  popoutAccents: {
    enabled: true,
    splitter: true,
    activityBar: true,
  },
  workspaceInterceptorEnabled: true,
};

export default class WindowSpacesPlugin extends Plugin {
  settings: WindowSettings;
  manager: WindowLayoutManager;
  windowLayoutsRibbonEl: HTMLElement | null = null;
  popoutLayout: PopoutLayoutEngine;
  activityBars: PopoutActivityBarManager;
  workspaceInterceptor: WorkspaceInterceptor;

  async onload() {
    // 初始化國際化
    initI18n(this.app);

    // 加載設定
    await this.loadSettings();

    // 初始化管理器
    this.manager = new WindowLayoutManager(this);
    this.manager.registerExistingPopoutWindows();

    // 初始化 Popout 工作空間增強（Activity Bar + API 攔截器）
    this.popoutLayout = acquirePopoutLayoutEngine({
      id: "window-spaces",
      apiVersion: SHARED_API_VERSION,
      compatibleFrom: SHARED_COMPATIBLE_FROM_VERSION,
      implementationRevision: SHARED_IMPLEMENTATION_REVISION,
      create: () => new PopoutLayoutEngine(this.app),
      // 新 popout window 的初始化 policy：注入 activity bars、依 activityBarDefaults
      // 建立側欄結構與 sizing。供 Folder Spaces 等外掛經 shared openNewPopoutWindow()
      // 開啟視窗時，仍由 Window Spaces 統一管理「新視窗行為」。
      initializeNewPopoutWindow: (win: Window) =>
        this.activityBars ? this.activityBars.initializeNewWindow(win) : Promise.resolve(),
    });
    this.activityBars = new PopoutActivityBarManager(this, this.popoutLayout);
    this.workspaceInterceptor = new WorkspaceInterceptor(this.app, this.popoutLayout);
    this.workspaceInterceptor.enabled = this.settings.workspaceInterceptorEnabled !== false;
    // 僅對已注入 Activity Bar 且非 Obsidian UI 視窗（如設定 popout）攔截
    this.workspaceInterceptor.isManagedWindow = (win) => {
      if (!this.activityBars.isInjected(win)) return false;
      if (win.document?.body?.querySelector(".modal-container")) return false;
      return true;
    };
    this.workspaceInterceptor.install();

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

    // 為既有 Popout 注入 Activity Bar
    this.activityBars.refreshAll();

    // Native Obsidian restores retained Popout windows before the plugin can
    // apply a saved Window Space. Wait for the workspace to finish restoring,
    // then reapply every already-open, identified space without a notification.
    this.app.workspace.onLayoutReady(() => {
      void this.manager.restoreOpenSpacesOnStartup();
    });

    // 添加狀態欄指示器（可選）
    if (this.settings.showStatusBarIndicator === true) {
      this.addStatusBarIndicator();
    }
  }

  onunload() {
    this.windowLayoutsRibbonEl?.remove();
    this.windowLayoutsRibbonEl = null;

    this.manager?.clearLayoutLabels();

    // 清理 Activity Bar 與 API 攔截器
    this.workspaceInterceptor?.uninstall();
    this.activityBars?.cleanupAll();

    // 清理自動保存
    if (this.autoSaveCleanup) {
      this.autoSaveCleanup();
    }

    releasePopoutLayoutEngine("window-spaces");
  }

  refreshRibbonIcons() {
    if (this.settings.showWindowLayoutsRibbonIcon) {
      if (!this.windowLayoutsRibbonEl) {
        this.windowLayoutsRibbonEl = this.addRibbonIcon(
          "layout",
          t("commands.openLayoutsRibbon"),
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

    // Version 1 used 3px as the default frame inset. Migrate that legacy
    // default to Obsidian's native 1px accent-border thickness once, while
    // preserving other values that may have been explicitly chosen.
    if (savedSettings?.visualDefaultsVersion !== 1) {
      if (savedSettings?.defaultBorderInset === 3) {
        this.settings.defaultBorderInset = 1;
      }
      this.settings.visualDefaultsVersion = 1;
      await this.saveSettings();
    }

    // "layout" was the old built-in fallback. Migrate that legacy default so
    // icon-less Spaces now use the neutral square icon.
    if (savedSettings?.defaultIcon === "layout") {
      this.settings.defaultIcon = DEFAULT_SPACE_ICON;
      await this.saveSettings();
    }

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

    // Popout 工作空間增強命令
    this.addCommand({
      id: "toggle-left-activity-bar",
      name: t("commands.toggleLeftActivityBar"),
      icon: "panel-left",
      callback: () => this.toggleActivityBarVisibility("left"),
    });

    this.addCommand({
      id: "toggle-right-activity-bar",
      name: t("commands.toggleRightActivityBar"),
      icon: "panel-right",
      callback: () => this.toggleActivityBarVisibility("right"),
    });
  }

  private toggleActivityBarVisibility(side: "left" | "right"): void {
    const win =
      (this.manager ? this.manager.getActiveWindow() : undefined) ||
      (typeof activeWindow !== "undefined" ? activeWindow : window);
    if (!win || win === window) {
      new Notice(t("activityBar.onlyInPopout"));
      return;
    }
    const columnEl = this.popoutLayout.getColumnElement(win, side);
    if (!columnEl) {
      new Notice(t("activityBar.cannotHideLastPane"));
      return;
    }
    if (this.popoutLayout.isColumnHidden(win, side)) {
      this.popoutLayout.showColumn(win, side);
    } else {
      if (this.popoutLayout.getVisibleColumnCount(win) < 2) {
        new Notice(t("activityBar.cannotHideLastPane"));
        return;
      }
      this.popoutLayout.hideColumn(win, side);
    }
    this.activityBars.updateActiveStates(win);
  }

  openSaveLayoutModal(layout: WindowLayout, targetWindow?: Window) {
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
    // Popout 視窗開啟儲存對話框時，Obsidian 的 Modal.open() 預設掛載到 main window 的
    // document.body（plugin 的 JS realm 在主視窗，讀取的 activeWindow 也是主視窗），
    // 導致對話框被 popout 蓋住、看不到。此處明確將 modal 容器掛載到目標視窗的 body，
    // 讓對話框在使用者所在（點擊 Save 的）popout 最上層顯示。
    if (targetWindow && targetWindow !== window) {
      (modal as unknown as { open(parent?: HTMLElement): void }).open(targetWindow.document.body);
      return;
    }
    modal.open();
  }

  async openSaveCurrentLayoutModal(targetWindow?: Window): Promise<void> {
    try {
      const layout = await this.manager.captureCurrentLayout({}, targetWindow);
      this.openSaveLayoutModal(layout, targetWindow);
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
      return this.popoutLayout.openPanel(win, location, WINDOW_LAYOUTS_VIEW_TYPE);
    }

    // 處理在 Main Window 開啟
    let root: WorkspaceSplit | undefined;
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

  private setupEventListeners() {
    // 監聽視窗開關
    this.registerEvent(
      this.app.workspace.on("window-open", (_workspaceWindow, popoutWindow) => {
        this.manager.registerPopoutWindow(popoutWindow);
        this.activityBars.injectForWindow(popoutWindow);
        // 新 Popout 建立後排程佈局完整性檢查（補足側欄 / 藏起空側欄）
        this.activityBars.scheduleLayoutIntegrityCheck(popoutWindow);
        WindowLayoutsModal.renderAllInstances();
      })
    );

    this.registerEvent(
      this.app.workspace.on("window-close", (_workspaceWindow, popoutWindow) => {
        this.manager.unregisterPopoutWindow(popoutWindow);
        this.activityBars.cleanupWindow(popoutWindow);
        WindowLayoutsModal.renderAllInstances();
      })
    );

    // 監聽 Workspace 分頁與佈局變化（用於特定 Layout 的 5 秒 Debounced 自動儲存）
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        if (this.manager?.isRestoringLayout) return;
        this.manager.matchUnlabeledPopoutWindows();
        this.manager.checkAndDebouncedAutoSaveAll();
        this.activityBars.refreshAll();
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
        if (this.manager?.isRestoringLayout) return;
        this.manager.checkAndDebouncedAutoSaveAll();
        this.activityBars.updateActiveStatesAll();

        // 等待 mousedown/mouseup/click 完成後，才檢查剛切換到的 Popout tab
        // 是否仍是空 DOM；主視窗不走此路徑，避免 File Explorer 單擊失效。
        const leafWindow = leaf ? getWindowOfLeaf(leaf) : null;
        if (leaf && leafWindow && isPopoutWindow(leafWindow)) {
          this.manager.scheduleViewRenderAfterActivation(leaf, leafWindow);
        }
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

function findLeafInRoot(workspace: ExtendedWorkspace, root: WorkspaceSplit | undefined, viewType: string): WorkspaceLeaf | null {
  if (!root) return null;
  let found: WorkspaceLeaf | null = null;
  workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
    if (found) return;
    const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
    if (extLeaf.getRoot?.() === root && leaf.getViewState()?.type === viewType) {
      found = leaf;
    }
  });
  return found;
}


