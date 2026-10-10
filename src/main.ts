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
  canInjectSidebars,
  canInjectStatusBar,
  getWindowPopoutPolicy,
  isWindowDisabledByPolicy,
} from "./popout/entrypointPolicy";
import {
  getWindowOfLeaf,
  isPopoutWindow,
  PopoutLayoutEngine,
} from "./shared/popoutLayout";
import { acquirePopoutLayoutEngine, releasePopoutLayoutEngine, PopoutLayoutEngineWithWindow } from "./shared/popoutLayoutRegistry";
import {
  SHARED_API_VERSION,
  SHARED_COMPATIBLE_FROM_VERSION,
  SHARED_IMPLEMENTATION_REVISION,
} from "./shared/sharedVersion";
import { PopoutActivityBarManager } from "./popout/activityBar";
import { WorkspaceInterceptor } from "./popout/workspaceInterceptor";
import {
  getDefaultActivityBarItems,
  prewarmViewIcons,
} from "./popout/viewRegistry";
import { DEFAULT_SPACE_ICON } from "./spaceVisuals";

function createDefaultSettings(): WindowSettings {
  return {
    spaces: [],
    autoSave: false,
    showNotifications: false,
    version: "1.0.0",
    showLayoutStatusBar: true,
    layoutStatusBarDefaultApplied: false,
    showWindowLayoutsRibbonIcon: true,
    sortBy: "updated-desc",
    sectionsOrder: [],
    groupBySection: true,
    showArchived: false,
    defaultIcon: DEFAULT_SPACE_ICON,
    colorPresets: [...DEFAULT_COLOR_PRESETS],
    defaultBorderInset: 1,
    visualDefaultsVersion: 1,
    defaultShowFoldedCorner: true,
    activityBars: {
      left: getDefaultActivityBarItems("left"),
      right: getDefaultActivityBarItems("right"),
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
    disableOnUrlPopouts: true,
    nativePopoutPolicy: "status-bar-only",
    urlPopoutPolicy: "disabled",
  };
}

const DEFAULT_SETTINGS: WindowSettings = createDefaultSettings();

export default class WindowSpacesPlugin extends Plugin {
  declare settings: WindowSettings;
  manager: WindowLayoutManager;
  windowLayoutsRibbonEl: HTMLElement | null = null;
  popoutLayout: PopoutLayoutEngineWithWindow;
  activityBars: PopoutActivityBarManager;
  workspaceInterceptor: WorkspaceInterceptor;

  /** 本外掛專屬 Space 啟動的開窗意圖（由 manager.openNewPopoutWindow 設定）。 */
  private dedicatedSpacePopoutPending = false;
  /** 本外掛專屬啟動所開、在取得 Space 名稱前即視為 explicit Space 的視窗。 */
  private dedicatedSpaceWindows?: WeakSet<Window>;

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
      //
      // 兩種開窗來源必須分流：
      // - 本外掛專屬啟動（Switcher 建立新 Space）：標記為 explicit Space 並強制完整
      //   初始化，因為此刻 Space 名稱尚未寫入 layout，policy 會誤判為一般原生視窗。
      // - 其他外掛（如 Folder Spaces）委託開窗：完全依 nativePopoutPolicy 裝飾，
      //   不強制建立側欄結構，避免產生「有 sidebar 卻沒有 activity bar」的不一致狀態。
      initializeNewPopoutWindow: (win: Window) => this.initializeNewPopoutWindowFor(win),
    });
    this.activityBars = new PopoutActivityBarManager(this, this.popoutLayout);
    this.workspaceInterceptor = new WorkspaceInterceptor(this.app, this.popoutLayout);
    this.workspaceInterceptor.enabled = this.settings.workspaceInterceptorEnabled !== false;
    // 僅對已注入 Activity Bar 且非 Obsidian UI 視窗（如設定 popout）攔截
    this.workspaceInterceptor.isManagedWindow = (win) => {
      if (this.isWindowDisabled(win)) return false;
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
    prewarmViewIcons(this.app);

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
    // initialize its bookkeeping. After layout-ready, identify those windows
    // only; their native layout is already authoritative and must not be
    // rebuilt or reconciled by Window Spaces.
    this.app.workspace.onLayoutReady(() => {
      void this.manager.reconcileOpenSpacesOnStartup();
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
      | Partial<WindowSettings>
      | null;
    // Build a detached default object so editing a newly-created settings list
    // cannot mutate the module-level factory defaults used by Reset Settings.
    this.settings = Object.assign(createDefaultSettings(), savedSettings);

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

    // 預設啟用 URL popout 停用功能；舊版未設定也啟用
    if (this.settings.disableOnUrlPopouts === undefined) {
      this.settings.disableOnUrlPopouts = true;
      await this.saveSettings();
    }

    // 遷移或初始化開窗管道策略。必須以「實際持久化的資料」判定缺鍵：
    // 此時 this.settings 已與 createDefaultSettings() 合併，兩個策略鍵必定有值，
    // 用 this.settings 判定會讓本區塊成為死碼，使舊版 disableOnUrlPopouts:false 的
    // 使用者被靜默降級為 "disabled"（與其原意相反）。以 saved 判定同時保留
    // 原本的 falsy 語意（null 視為缺鍵）。
    if (!savedSettings || !savedSettings.nativePopoutPolicy) {
      this.settings.nativePopoutPolicy = "status-bar-only";
      await this.saveSettings();
    }
    if (!savedSettings || !savedSettings.urlPopoutPolicy) {
      this.settings.urlPopoutPolicy =
        savedSettings?.disableOnUrlPopouts === false ? "full" : "disabled";
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

  /**
   * Restore every plugin option to its factory value while retaining the
   * user's saved Spaces verbatim. The caller is responsible for refreshing
   * UI/runtime effects after the save succeeds.
   */
  async resetSettingsPreservingSpaces(): Promise<void> {
    const previousSettings = this.settings;
    const spaces = Array.isArray(previousSettings?.spaces) ? previousSettings.spaces : [];
    this.settings = createDefaultSettings();
    this.settings.spaces = spaces;

    try {
      await this.saveSettings();
    } catch (error: unknown) {
      // Keep an I/O failure from leaving the live plugin in a reset-but-unsaved
      // state. No Space object was mutated during the reset attempt.
      this.settings = previousSettings;
      throw error;
    }
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
            await this.manager.saveLayout(savedLayout, targetWindow, {
              refreshLivePresentation: true,
            });
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
          // Popup picker 走 Stack scope：Modal.open 已把 hostModal.scope 推上該視窗的
          // scope 堆疊頂端，因此它擁有按鍵、且其他 modal / menu / Quick Switcher 自動讓位。
          controller.bindScope(hostModal.scope);
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

  /**
   * shared openNewPopoutWindow() 對所有 candidate 呼叫的初始化 policy。
   *
   * 見 onload 內的註解：專屬 Space 啟動強制完整初始化，其他外掛委託開窗
   * 完全依 nativePopoutPolicy 裝飾。
   */
  async initializeNewPopoutWindowFor(win: Window): Promise<void> {
    const dedicated = this.takeDedicatedSpacePopoutIntent();
    // 先標記再判定政策，讓專屬 Space 視窗在取得 Space 名稱前就被視為 explicit Space。
    if (dedicated) (this.dedicatedSpaceWindows ??= new WeakSet<Window>()).add(win);
    if (this.isWindowDisabled(win)) return;
    if (!this.activityBars) return;
    await this.activityBars.initializeNewWindow(win, dedicated);
  }

  isExplicitSpaceWindow(win: Window): boolean {
    if (!win || win.closed) return false;
    // 本外掛專屬啟動所開的視窗在取得 Space 名稱前即視為 explicit Space；
    // 否則開窗當下的 policy 檢查會把它誤判成一般原生視窗而拆掉剛建好的側欄。
    if (this.dedicatedSpaceWindows?.has(win)) return true;
    return Boolean(this.manager?.getLayoutNameForWindow(win));
  }

  /** 標記「接下來由本外掛開出的 popout 屬於專屬 Space 啟動」（供 manager 使用）。 */
  beginDedicatedSpacePopout(): void {
    this.dedicatedSpacePopoutPending = true;
  }

  /** 結束專屬 Space 啟動的開窗區間。 */
  endDedicatedSpacePopout(): void {
    this.dedicatedSpacePopoutPending = false;
  }

  /**
   * 取出（消費）一次專屬 Space 啟動意圖。
   *
   * shared openNewPopoutWindow() 會對所有候選呼叫 initializeNewPopoutWindow，
   * 但一次建立只會產生一個視窗，故意圖取用一次即失效，避免後續非本外掛開的
   * 視窗被誤判為專屬 Space。
   */
  private takeDedicatedSpacePopoutIntent(): boolean {
    if (!this.dedicatedSpacePopoutPending) return false;
    this.dedicatedSpacePopoutPending = false;
    return true;
  }

  getWindowPolicy(win: Window) {
    return getWindowPopoutPolicy(win, this.settings, this.app, this.isExplicitSpaceWindow(win));
  }

  canInjectSidebars(win: Window): boolean {
    return canInjectSidebars(win, this.settings, this.app, this.isExplicitSpaceWindow(win));
  }

  canInjectStatusBar(win: Window): boolean {
    return canInjectStatusBar(win, this.settings, this.app, this.isExplicitSpaceWindow(win));
  }

  isWindowDisabled(win: Window): boolean {
    return isWindowDisabledByPolicy(win, this.settings, this.app, this.isExplicitSpaceWindow(win));
  }

  checkAndHandleUrlPopout(win: Window): boolean {
    const policy = this.getWindowPolicy(win);
    if (policy === "disabled") {
      this.activityBars?.cleanupWindow(win);
      this.manager?.unregisterPopoutWindow(win);
      return true;
    }
    if (policy === "status-bar-only") {
      this.activityBars?.cleanupWindow(win);
      this.manager?.refreshLayoutStatusBar(win);
      return false;
    }
    return false;
  }

  checkAndCleanupUrlPopouts(): void {
    const livePopouts = this.popoutLayout?.getLivePopoutWindows?.() ?? [];
    for (const win of livePopouts) {
      this.checkAndHandleUrlPopout(win);
    }
  }

  scheduleUrlPopoutCheck(win: Window): void {
    if (this.manager?.isRestoringLayout || this.isExplicitSpaceWindow(win)) return;
    const delays = [50, 150, 300, 600, 1000];
    delays.forEach((delay) => {
      win.setTimeout(() => {
        try {
          if (win.closed || this.manager?.isRestoringLayout || this.isExplicitSpaceWindow(win)) return;
          this.checkAndHandleUrlPopout(win);
        } catch {
          // Cross-origin or destroyed window access safety
        }
      }, delay);
    });
  }

  handleUrlPopoutsSettingChange(): void {
    this.handlePopoutPolicyChange();
  }

  handlePopoutPolicyChange(): void {
    const livePopouts = this.popoutLayout?.getLivePopoutWindows?.() ?? [];
    for (const win of livePopouts) {
      const policy = this.getWindowPolicy(win);
      if (policy === "disabled") {
        this.activityBars?.cleanupWindow(win);
        this.manager?.unregisterPopoutWindow(win);
      } else if (policy === "status-bar-only") {
        this.activityBars?.cleanupWindow(win);
        this.manager?.registerPopoutWindow(win);
        this.manager?.refreshLayoutStatusBar(win);
      } else {
        this.manager?.registerPopoutWindow(win);
        this.activityBars?.injectForWindow(win);
        this.activityBars?.scheduleLayoutIntegrityCheck(win);
      }
    }
    this.activityBars?.refreshAll();
    this.manager?.matchUnlabeledPopoutWindows();
    this.manager?.refreshLayoutLabels();
  }

  private setupEventListeners() {
    // 監聽視窗開關
    this.registerEvent(
      this.app.workspace.on("window-open", (_workspaceWindow, popoutWindow) => {
        const policy = this.getWindowPolicy(popoutWindow);
        if (policy === "disabled") {
          this.activityBars?.cleanupWindow(popoutWindow);
          this.manager?.unregisterPopoutWindow(popoutWindow);
          WindowLayoutsModal.renderAllInstances();
          return;
        }

        this.manager.registerPopoutWindow(popoutWindow);

        if (this.canInjectSidebars(popoutWindow)) {
          this.activityBars.injectForWindow(popoutWindow);
          this.activityBars.scheduleLayoutIntegrityCheck(popoutWindow);
          this.activityBars.scheduleNewWindowInitialization(popoutWindow);
        } else {
          this.activityBars.cleanupWindow(popoutWindow);
        }

        this.scheduleUrlPopoutCheck(popoutWindow);
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
        this.checkAndCleanupUrlPopouts();
        this.manager.matchUnlabeledPopoutWindows();
        this.manager.checkAndDebouncedAutoSaveAll();
        this.activityBars.refreshAll();
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
        const leafWindow = leaf ? getWindowOfLeaf(leaf) : null;
        if (leaf && leafWindow && isPopoutWindow(leafWindow)) {
          if (this.checkAndHandleUrlPopout(leafWindow)) {
            return;
          }
          this.popoutLayout.rememberActiveContentPane(leafWindow, leaf);
        }

        if (this.manager?.isRestoringLayout) return;
        this.manager.checkAndDebouncedAutoSaveAll();
        this.activityBars.updateActiveStatesAll();

        // 等待 mousedown/mouseup/click 完成後，才檢查剛切換到的 Popout tab
        // 是否仍是空 DOM；主視窗不走此路徑，避免 File Explorer 單擊失效。
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


