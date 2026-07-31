import { Modal, Plugin, Notice } from "obsidian";
import { WindowLayout, WindowSettings } from "./types";
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
    console.log("Loading Window Spaces plugin");

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

    console.log("Window Spaces plugin loaded successfully");
  }

  onunload() {
    console.log("Unloading Window Spaces plugin");

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
    const savedSettings = await this.loadData();
    if (savedSettings && (savedSettings as any).layouts && !savedSettings.spaces) {
      savedSettings.spaces = (savedSettings as any).layouts;
      delete (savedSettings as any).layouts;
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
        } catch (error) {
          new Notice(`${t("errors.failedToSave")}: ${error.message}`);
        }
      },
    });

    // 開啟統一的視窗佈局對話框
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
      async (savedLayout) => {
        try {
          await this.manager.saveLayout(savedLayout);
        } catch (error) {
          new Notice(`${t("errors.failedToSave")}: ${error.message}`);
        }
      }
    );
    modal.open();
  }

  async openSaveCurrentLayoutModal(targetWindow?: Window): Promise<void> {
    try {
      const layout = await this.manager.captureCurrentLayout({}, targetWindow);
      this.openSaveLayoutModal(layout);
    } catch (error: any) {
      new Notice(`${t("errors.failedToSave")}: ${error?.message || error}`);
    }
  }

  openWindowLayoutsModal(
    targetWindow?: Window
  ): void {
    try {
      const win = targetWindow || (this.manager ? this.manager.getActiveWindow() : undefined);
      // Use a plain native Modal as the host. The same Window Spaces
      // controller already mounts reliably in ItemView panels; mounting it
      // here avoids the failing custom Modal.open()/onOpen lifecycle seen in
      // Obsidian 1.13 while preserving the shared picker and restore logic.
      const hostModal = new Modal(this.app);
      const controller = new WindowLayoutsModal(this.app, this, win);

      hostModal.setTitle(t("common.windowLayouts"));
      hostModal.onOpen = () => {
        try {
          hostModal.modalEl.addClass("window-layouts-modal");
          controller.mountInModalContainer(
            hostModal.contentEl,
            () => hostModal.close()
          );
        } catch (error: any) {
          console.error("[WindowSpaces] Error mounting Window Spaces picker:", error);
          hostModal.contentEl.empty();
          hostModal.contentEl.createEl("p", {
            text: `Error loading Window Spaces: ${error?.message || error}`,
          });
        }
      };
      hostModal.onClose = () => {
        controller.unmountFromContainer();
      };
      hostModal.open();
    } catch (error: any) {
      console.error("[WindowSpaces] Error opening WindowLayoutsModal:", error);
      new Notice(`Window Spaces Error: ${error?.message || error}`);
    }
  }

  async openWindowLayoutsPanel(
    location: WindowLayoutsPanelLocation = "tab"
  ): Promise<void> {
    const workspace = this.app.workspace as any;
    let leaf;

    if (location === "left") {
      leaf = workspace.getLeftLeaf(false);
    } else if (location === "right") {
      leaf = workspace.getRightLeaf(false);
    } else {
      // Commands can be invoked while a popout is focused. Select a main
      // workspace leaf first so getLeaf("tab") cannot create the view in a
      // popout window by accident.
      let mainLeaf = null;
      workspace.iterateAllLeaves((candidate: any) => {
        const body = candidate.containerEl?.ownerDocument?.body;
        const isPopout = body?.classList?.contains("is-popout-window") ||
          body?.classList?.contains("mod-popout");
        if (!mainLeaf && !isPopout) mainLeaf = candidate;
      });
      if (mainLeaf) workspace.setActiveLeaf(mainLeaf, { focus: false });
      leaf = workspace.getLeaf("tab");
    }

    if (!leaf) {
      throw new Error("Unable to create a Window Layouts panel");
    }

    await leaf.setViewState({ type: WINDOW_LAYOUTS_VIEW_TYPE, state: {} });
    await workspace.revealLeaf(leaf);
  }

  private setupEventListeners() {
    // 監聽視窗開關
    this.registerEvent(
      this.app.workspace.on("window-open", (_workspaceWindow, popoutWindow) => {
        this.manager.registerPopoutWindow(popoutWindow);
        WindowLayoutsModal.renderAllInstances();
        console.log("New window opened");
      })
    );

    this.registerEvent(
      this.app.workspace.on("window-close", (_workspaceWindow, popoutWindow) => {
        this.manager.unregisterPopoutWindow(popoutWindow);
        WindowLayoutsModal.renderAllInstances();
        console.log("Popout window closed");
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
        this.manager.captureCurrentLayout().then((layout) => {
          this.openSaveLayoutModal(layout);
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
