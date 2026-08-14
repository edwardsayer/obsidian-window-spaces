import { App, WorkspaceLeaf, Notice, TFile, setIcon, WorkspaceWindowInitData } from "obsidian";
import {
  WindowLayout,
  WindowState,
  ViewState,
  SaveLayoutOptions,
  RestoreLayoutOptions,
  ExtendedWorkspace,
  ExtendedWorkspaceLeaf,
  WorkspaceItem,
  WindowSettings,
  PopoutHiddenState,
} from "./types";
import { t, tWithParams, getI18n } from "./i18n";
import { WindowLayoutsModal } from "./modals/restoreModal";
import WindowSpacesPlugin from "./main";

interface LayoutLabelElements {
  statusBar: HTMLElement | null;
}

interface PreservedWindowLayout {
  window: Window;
  layoutName: string;
  leaves: ViewState[];
  windowState: WindowState;
}

export class WindowLayoutManager {
  private plugin: WindowSpacesPlugin;
  private app: App;
  public layoutWindows = new WeakMap<WindowLayout, Window>();
  private popoutWindows = new Set<Window>();
  private layoutNames = new Map<Window, string>();
  private layoutLabels = new Map<Window, LayoutLabelElements>();
  private activeRestorePromise: Promise<void> | null = null;
  private isMatchingUnlabeled = false;
  public isRestoringLayout = false;
  private renderAttemptedLeaves = new WeakSet<WorkspaceLeaf>();
  private deferredViewLoads = new WeakMap<WorkspaceLeaf, Promise<void>>();

  constructor(plugin: WindowSpacesPlugin) {
    this.plugin = plugin;
    this.app = plugin.app;
  }

  /** 記錄 Obsidian 建立的 Popout，供 label 與 title 生命週期管理使用。 */
  registerPopoutWindow(targetWin: Window): void {
    if (!targetWin) return;

    this.popoutWindows.add(targetWin);
    this.matchUnlabeledPopoutWindows();
    this.refreshLayoutStatusBar(targetWin);
    this.hookPopoutWindowTitle(targetWin);
    this.schedulePopoutViewRendering(targetWin);

    // window-open 觸發時 Popout DOM 可能仍在建立中，再補多次確保狀態列與視窗標題 100% 正確反映。
    targetWin.setTimeout(() => {
      this.matchUnlabeledPopoutWindows();
      this.refreshLayoutStatusBar(targetWin);
      this.hookPopoutWindowTitle(targetWin);
    }, 0);
    targetWin.setTimeout(() => {
      this.matchUnlabeledPopoutWindows();
      this.refreshLayoutStatusBar(targetWin);
      this.hookPopoutWindowTitle(targetWin);
    }, 100);
    targetWin.setTimeout(() => {
      this.matchUnlabeledPopoutWindows();
      this.refreshLayoutStatusBar(targetWin);
      this.hookPopoutWindowTitle(targetWin);
    }, 300);
    targetWin.setTimeout(() => {
      this.matchUnlabeledPopoutWindows();
      this.refreshLayoutStatusBar(targetWin);
      this.hookPopoutWindowTitle(targetWin);
    }, 800);
  }

  /**
   * 在 Popout 建立/重新註冊後，以延遲生命週期工作重建尚未渲染的非檔案 view。
   * 不可掛在 active-leaf-change：File Explorer 的 mousedown/mouseup 期間重建
   * view 會阻止 Chromium 產生 click，造成使用者必須點兩次。
   */
  private schedulePopoutViewRendering(targetWin: Window): void {
    const render = (): void => {
      if (targetWin.closed) return;
      this.getLeavesForWindow(targetWin).forEach((leaf) => {
        // ensureViewRendered 會先檢查 .view-content 是否已有子元素，只有
        // 空的非檔案 view 才會進行 rebuild。
        this.ensureViewRendered(leaf);
      });
    };

    targetWin.setTimeout(render, 150);
    targetWin.setTimeout(render, 400);
    targetWin.setTimeout(render, 900);
  }

  /** 插件重新載入時，補註冊已經存在的 Popout。 */
  registerExistingPopoutWindows(): void {
    (this.app.workspace as unknown as ExtendedWorkspace).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      const targetWin = extLeaf.containerEl?.ownerDocument?.defaultView as Window | undefined;
      if (targetWin && this.isPopoutDocument(targetWin.document)) {
        this.registerPopoutWindow(targetWin);
      }
    });
    this.matchUnlabeledPopoutWindows();
  }

  /** Popout 關閉時移除對應的 layout label 與追蹤狀態。 */
  unregisterPopoutWindow(targetWin: Window): void {
    if (!targetWin) return;

    this.unhookPopoutWindowTitle(targetWin);
    this.removeLayoutLabel(targetWin);
    this.popoutWindows.delete(targetWin);
    this.layoutNames.delete(targetWin);
  }

  /** Plugin 卸載時清除所有由本 plugin 建立的 Popout label 與 Title hook。 */
  clearLayoutLabels(): void {
    for (const [targetWin, labels] of this.layoutLabels) {
      this.unhookPopoutWindowTitle(targetWin);
      labels.statusBar?.remove();
      this.popoutWindows.delete(targetWin);
    }
    this.layoutNames.clear();
    this.layoutLabels.clear();
    this.popoutWindows.clear();
  }

  /**
   * 針對 Popout 視窗進行標題 Hook（雙重防護：DOM document.title setter 劫持 + WorkspaceWindow.setTitle）
   */
  hookPopoutWindowTitle(targetWin: Window): void {
    if (!targetWin || !targetWin.document) return;

    const targetDoc = targetWin.document;
    const docRecord = targetDoc as unknown as Record<string, unknown>;

    // 1. DOM document.title Setter 劫持
    if (!docRecord._hasWindowSpacesTitlePatch) {
      const originalDescriptor =
        Object.getOwnPropertyDescriptor(Document.prototype, "title") ||
        Object.getOwnPropertyDescriptor(targetDoc, "title");

      if (originalDescriptor && originalDescriptor.set) {
        const originalSet = originalDescriptor.set;
        const originalGet = originalDescriptor.get;
        const self = this;

        docRecord._hasWindowSpacesTitlePatch = true;
        docRecord._originalTitleSet = originalSet;

        Object.defineProperty(targetDoc, "title", {
          configurable: true,
          enumerable: true,
          get() {
            try {
              return originalGet ? originalGet.call(targetDoc) : "";
            } catch {
              return "";
            }
          },
          set(newTitle: string) {
            const spaceName = self.getLayoutNameForWindow(targetWin);
            if (spaceName) {
              let formattedTitle = newTitle;
              if (newTitle && !newTitle.startsWith(spaceName)) {
                formattedTitle = `${spaceName} - ${newTitle}`;
              } else if (!newTitle) {
                formattedTitle = spaceName;
              }
              originalSet.call(targetDoc, formattedTitle);
            } else {
              originalSet.call(targetDoc, newTitle);
            }
          },
        });
      }
    }

    // 2. 針對 WorkspaceWindow 實例上的 setTitle API 劫持（若存在）
    const extApp = this.app as unknown as { workspace: ExtendedWorkspace };
    const floatingSplit = extApp.workspace?.floatingSplit;
    const workspaceWindow = floatingSplit?.children?.find(
      (child) => child.win === targetWin
    );

    if (workspaceWindow && typeof workspaceWindow.setTitle === "function") {
      if (!workspaceWindow._originalSetTitle) {
        workspaceWindow._originalSetTitle = workspaceWindow.setTitle;
        const self = this;

        workspaceWindow.setTitle = function (originalTitle: string) {
          const spaceName = self.getLayoutNameForWindow(targetWin);
          const origFn = this._originalSetTitle;

          if (spaceName && typeof origFn === "function") {
            let formattedTitle = originalTitle;
            if (originalTitle && !originalTitle.startsWith(spaceName)) {
              formattedTitle = `${spaceName} - ${originalTitle}`;
            } else if (!originalTitle) {
              formattedTitle = spaceName;
            }
            return origFn.call(this, formattedTitle);
          }

          if (typeof origFn === "function") {
            return origFn.call(this, originalTitle);
          }
        };
      }
    }

    // 3. 若已有名稱，主動觸發標題寫入以更新 DOM
    try {
      const spaceName = this.getLayoutNameForWindow(targetWin);
      if (spaceName && targetDoc.title) {
        const currentTitle = targetDoc.title;
        targetDoc.title = currentTitle;
      }
    } catch {
      // safe fallback for non-standard DOM environments
    }
  }

  private unhookPopoutWindowTitle(targetWin: Window): void {
    if (!targetWin || !targetWin.document) return;

    const targetDoc = targetWin.document;
    const docRecord = targetDoc as unknown as Record<string, unknown>;

    // 還原 document.title
    if (docRecord._hasWindowSpacesTitlePatch && typeof docRecord._originalTitleSet === "function") {
      const originalSet = docRecord._originalTitleSet as (title: string) => void;
      delete docRecord._hasWindowSpacesTitlePatch;
      delete docRecord._originalTitleSet;

      Object.defineProperty(targetDoc, "title", {
        configurable: true,
        enumerable: true,
        get() {
          return Object.getOwnPropertyDescriptor(Document.prototype, "title")?.get?.call(targetDoc) ?? "";
        },
        set(newTitle: string) {
          originalSet.call(targetDoc, newTitle);
        },
      });
    }

    // 還原 WorkspaceWindow.setTitle
    const extApp = this.app as unknown as { workspace: ExtendedWorkspace };
    const floatingSplit = extApp.workspace?.floatingSplit;
    const workspaceWindow = floatingSplit?.children?.find(
      (child) => child.win === targetWin
    );

    if (workspaceWindow && workspaceWindow._originalSetTitle) {
      workspaceWindow.setTitle = workspaceWindow._originalSetTitle;
      delete workspaceWindow._originalSetTitle;
    }
  }

  /**
   * 在指定 Popout 的內容區顯示目前套用的 layout 名稱，
   * 並呼叫 hookPopoutWindowTitle 覆寫視窗標題。
   */
  setLayoutLabelForWindow(targetWin: Window | null, layoutName: string): void {
    if (!targetWin || !layoutName?.trim()) return;

    this.registerPopoutWindow(targetWin);
    this.layoutNames.set(targetWin, layoutName);

    const targetDocument = targetWin.document;
    const body = targetDocument?.body;
    if (body) {
      body.setAttribute("data-layout-name", layoutName);
      body.querySelectorAll(".window-spaces-layout-label").forEach((element) => element.remove());
    }

    this.refreshLayoutStatusBar(targetWin);
    this.hookPopoutWindowTitle(targetWin);
    this.plugin.activityBars?.renderWindow(targetWin);

    // 延遲再次觸發標題寫入，確保與 Obsidian 異步載入的 View 標題完成同步
    targetWin.setTimeout(() => this.hookPopoutWindowTitle(targetWin), 50);
    targetWin.setTimeout(() => this.hookPopoutWindowTitle(targetWin), 200);
    targetWin.setTimeout(() => this.hookPopoutWindowTitle(targetWin), 500);
  }

  getLayoutNameForWindow(targetWin: Window): string | null {
    if (!targetWin) return null;
    const nameFromMap = this.layoutNames.get(targetWin);
    if (nameFromMap) return nameFromMap;

    const nameFromDOM = typeof targetWin.document?.body?.getAttribute === "function"
      ? targetWin.document.body.getAttribute("data-layout-name")
      : null;
    if (nameFromDOM) {
      this.layoutNames.set(targetWin, nameFromDOM);
      return nameFromDOM;
    }

    if (!this.isMatchingUnlabeled && this.isPopoutDocument(targetWin.document)) {
      this.matchUnlabeledPopoutWindows();
      return this.layoutNames.get(targetWin) || null;
    }

    return null;
  }

  /**
   * 當 Obsidian 啟動或多個 Popout 視窗重開時，若 Popout 視窗尚未標籤 space name，
   * 自動比對該視窗現有的 Leaves / 檔案與已儲存的 Layout (spaces)，
   * 為無標籤 Popout 視窗一對一辨識還原其 space name 及狀態列 / 側欄樣式。
   */
  /**
   * 把視窗目前的 live leaf id 集合回寫為該 layout 的識別記號（leafIdMarker）。
   * Obsidian 重啟後 floating 視窗的 leaf id 穩定保留，因此下次重啟可直接
   * 核對此記號識別 space，不需內容比對。靜默保存（不發通知、不拋錯）。
   */
  private syncWindowLeafMarker(targetWin: Window, layout: WindowLayout | null): void {
    if (!layout || !targetWin || targetWin.closed) return;
    try {
      const ids = this.getLeavesForWindow(targetWin)
        .map((leaf) => (leaf as unknown as ExtendedWorkspaceLeaf).id)
        .filter((id): id is string => !!id);
      if (ids.length === 0) return;
      const current = layout.leafIdMarker;
      const same = Array.isArray(current) &&
        current.length === ids.length &&
        current.every((id, i) => id === ids[i]);
      if (same) return;
      layout.leafIdMarker = ids;
      void this.plugin.saveSettings().catch(() => {
        // 靜默：識別記號同步失敗不影響主流程
      });
    } catch {
      // Ignore marker sync errors
    }
  }

  matchUnlabeledPopoutWindows(): void {
    if (this.isMatchingUnlabeled) return;
    this.isMatchingUnlabeled = true;
    try {
      const workspace = this.app.workspace as unknown as ExtendedWorkspace;
      if (!workspace || typeof workspace.iterateAllLeaves !== "function") return;

      const allPopouts = new Set<Window>();
      const claimedLayoutNames = new Set<string>();

      workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
        const win = this.getWindowForLeaf(leaf);
        if (win && !win.closed && this.isPopoutDocument(win.document)) {
          allPopouts.add(win);
          const name =
            this.layoutNames.get(win) ||
            (typeof win.document?.body?.getAttribute === "function"
              ? win.document.body.getAttribute("data-layout-name")
              : null);
          if (name) {
            claimedLayoutNames.add(name);
          }
        }
      });

      const unlabeledWindows = Array.from(allPopouts).filter((win) => {
        const name =
          this.layoutNames.get(win) ||
          (typeof win.document?.body?.getAttribute === "function"
            ? win.document.body.getAttribute("data-layout-name")
            : null);
        return !name;
      });

      if (unlabeledWindows.length === 0) return;

      const availableSpaces = (this.plugin.settings.spaces || []).filter(
        (space: WindowLayout) => space && space.name && !claimedLayoutNames.has(space.name)
      );

      if (availableSpaces.length === 0) return;

      for (const win of unlabeledWindows) {
        const existingName =
          this.layoutNames.get(win) ||
          (typeof win.document?.body?.getAttribute === "function"
            ? win.document.body.getAttribute("data-layout-name")
            : null);
        if (existingName) continue;

        const winLeaves = this.getLeavesForWindow(win);
        if (winLeaves.length === 0) continue;

        const winLeafIds = new Set(
          winLeaves.map((leaf) => (leaf as unknown as ExtendedWorkspaceLeaf).id).filter(Boolean)
        );
        const winFiles = new Set(
          winLeaves
            .map((leaf) => {
              const state =
                typeof (leaf as unknown as ExtendedWorkspaceLeaf).getViewState === "function"
                  ? (leaf as unknown as ExtendedWorkspaceLeaf).getViewState()?.state
                  : null;
              return this.getFilePathFromLeafState({ state: state || {} });
            })
            .filter((f): f is string => !!f)
        );
        // folder-spaces-explorer 等 view 的 panelId 跨 session 穩定，
        // 作為「無檔案 space」的比對特徵（leaf id 重啟後可能重建）。
        const winPanelIds = new Set(
          winLeaves
            .map((leaf) => {
              const state =
                typeof (leaf as unknown as ExtendedWorkspaceLeaf).getViewState === "function"
                  ? (leaf as unknown as ExtendedWorkspaceLeaf).getViewState()?.state
                  : null;
              const panelId = (state as { panelId?: unknown } | null | undefined)?.panelId;
              return typeof panelId === "string" && panelId ? panelId : null;
            })
            .filter((pid): pid is string => !!pid)
        );

        let bestSpace: WindowLayout | null = null;
        let bestScore = 0;

        for (const space of availableSpaces) {
          if (claimedLayoutNames.has(space.name)) continue;

          const savedLeaves = this.getSavedViewStates(space);
          if (savedLeaves.length === 0) continue;

          const savedLeafIds = new Set(savedLeaves.map((l) => l.id).filter(Boolean));
          const savedFiles = new Set(
            savedLeaves
              .map((l) => this.getFilePathFromLeafState(l))
              .filter((f): f is string => !!f)
          );
          const savedPanelIds = new Set(
            savedLeaves
              .map((l) => {
                const panelId = (l.state as { panelId?: unknown } | undefined)?.panelId;
                return typeof panelId === "string" && panelId ? panelId : null;
              })
              .filter((pid): pid is string => !!pid)
          );

          let score = 0;

          // (0) 視窗識別記號（leafIdMarker）比對：上次識別/restore 時回寫的
          // live leaf id 集合，重啟後視窗 leaf id 穩定 → 直接命中，最高權重。
          if (Array.isArray(space.leafIdMarker) && space.leafIdMarker.length > 0) {
            let markerHit = 0;
            for (const id of winLeafIds) {
              if (space.leafIdMarker.includes(id)) markerHit++;
            }
            score += markerHit * 200;
          }

          // (a) Leaf ID 匹配 (+100/leaf)
          for (const id of winLeafIds) {
            if (savedLeafIds.has(id)) score += 100;
          }

          // (b) 檔案路徑匹配 (+10/file)
          let matchingFilesCount = 0;
          for (const file of winFiles) {
            if (savedFiles.has(file)) matchingFilesCount++;
          }
          score += matchingFilesCount * 10;

          // (e) view state 特徵比對：folder-spaces-explorer 等 view 的 panelId
          // 跨 session 穩定，補足無檔案 space 的辨識（leaf id 重啟後可能重建）。
          for (const pid of winPanelIds) {
            if (savedPanelIds.has(pid)) score += 100;
          }

          // (c) 檔案完全吻合（Popout 中所有檔案與 space 中所有檔案一致）時大幅加分 (+50)
          if (winFiles.size > 0 && winFiles.size === savedFiles.size && matchingFilesCount === winFiles.size) {
            score += 50;
          }

          // (d) 視窗幾何尺寸與位置相似度 (已有內容匹配時才作為加分項 +5)
          const savedWindow = space.windowState;
          if (score > 0 && savedWindow && savedWindow.size) {
            const widthDiff = Math.abs(win.outerWidth - savedWindow.size.width);
            const heightDiff = Math.abs(win.outerHeight - savedWindow.size.height);
            if (widthDiff < 50 && heightDiff < 50) {
              score += 5;
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestSpace = space;
          }
        }

        // 嚴格門檻：必須至少有一項 Leaf / 檔案內容 match (score >= 10)
        if (bestSpace && bestScore >= 10) {
          claimedLayoutNames.add(bestSpace.name);
          this.setLayoutLabelForWindow(win, bestSpace.name);
          this.layoutWindows.set(bestSpace, win);
          // 回寫識別記號：使下次重啟直接命中 leafIdMarker，不再依賴內容比對
          this.syncWindowLeafMarker(win, bestSpace);
        }
      }
    } finally {
      this.isMatchingUnlabeled = false;
    }
  }

  refreshLayoutLabels(): void {
    for (const targetWin of this.popoutWindows) {
      this.refreshLayoutStatusBar(targetWin);
    }
  }

  private refreshLayoutStatusBar(targetWin: Window): void {
    const targetDocument = targetWin.document;
    const body = targetDocument?.body;
    if (!body || !this.isPopoutDocument(targetDocument)) return;

    const labels = this.layoutLabels.get(targetWin) || { statusBar: null };
    this.layoutLabels.set(targetWin, labels);

    const layoutName = this.getLayoutNameForWindow(targetWin);

    if (this.plugin.settings.showLayoutStatusBar === true) {
      labels.statusBar = this.ensureLayoutLabelElement(
        targetDocument,
        body,
        labels.statusBar,
        "window-spaces-layout-status"
      );
      this.updateLayoutLabelElement(
        labels.statusBar,
        layoutName || t("common.noLayout"),
        targetWin
      );
    } else {
      labels.statusBar?.remove();
      labels.statusBar = null;
    }
  }

  private ensureLayoutLabelElement(
    targetDocument: Document,
    body: HTMLElement,
    current: HTMLElement | null,
    className: string
  ): HTMLElement {
    if (current && current.ownerDocument === targetDocument) {
      if (!current.isConnected) body.appendChild(current);
      return current;
    }

    const existing = body.querySelector<HTMLElement>(`.${className}`);
    if (existing) return existing;

    const element = body.createDiv({ cls: className });
    return element;
  }

  private updateLayoutLabelElement(
    element: HTMLElement,
    layoutName: string,
    targetWin: Window
  ): void {
    const iconElement = element.querySelector<HTMLElement>(".window-spaces-layout-icon");
    if (iconElement) {
      iconElement.remove();
    }

    let nameElement = element.querySelector<HTMLElement>(".window-spaces-layout-name");
    if (!nameElement) {
      nameElement = element.createSpan({ cls: "window-spaces-layout-name" });
    }

    let actionsElement = element.querySelector<HTMLElement>(".window-spaces-layout-actions");
    if (!actionsElement) {
      actionsElement = element.createDiv({ cls: "window-spaces-layout-actions" });
    }

    const ensureActionButton = (
      className: string,
      icon: string,
      label: string,
      onClick: (e: MouseEvent) => void
    ): HTMLButtonElement => {
      let button = actionsElement ? actionsElement.querySelector<HTMLButtonElement>(`.${className}`) : null;
      if (!button && actionsElement) {
        button = actionsElement.createEl("button", {
          cls: `window-spaces-layout-action ${className} clickable-icon`,
          attr: { type: "button" },
        });
        setIcon(button, icon);
      }
      button.onclick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onClick(event);
      };
      button.setAttribute("aria-label", label);
      button.title = label;
      return button;
    };

    nameElement.textContent = layoutName;

    const currentLayout = this.plugin.settings.spaces.find((l: WindowLayout) => l.name === layoutName);
    const isAutoSave = !!currentLayout?.autoSave;

    // 移除舊版 window-spaces-layout-save 按鈕（若存在）
    const oldSaveBtn = actionsElement?.querySelector(".window-spaces-layout-save");
    if (oldSaveBtn) oldSaveBtn.remove();

    // 1. 直接儲存 Space (不開啟對話框)
    ensureActionButton(
      "window-spaces-layout-direct-save",
      "save",
      t("commands.saveLayoutDirect") || t("commands.saveLayout"),
      () => void this.saveLayoutDirectFromWindow(targetWin)
    );

    // 2. 空間設定對話框 (Pencil icon, 開啟 Space Setting 對話框)
    ensureActionButton(
      "window-spaces-layout-edit-settings",
      "pencil",
      t("saveModal.title"),
      () => void this.saveLayoutFromWindow(targetWin)
    );

    const autoSaveBtn = ensureActionButton(
      "window-spaces-layout-auto-save",
      "refresh-cw",
      isAutoSave ? t("manageModal.autoSaveEnabled") : t("manageModal.autoSaveDisabled"),
      () => {
        void (async () => {
          const targetLayout = this.plugin.settings.spaces.find((l: WindowLayout) => l.name === layoutName);
          if (targetLayout) {
            targetLayout.autoSave = !targetLayout.autoSave;
            await this.plugin.saveSettings();
            new Notice(
              targetLayout.autoSave
                ? `${layoutName}: ${t("manageModal.autoSaveEnabled")}`
                : `${layoutName}: ${t("manageModal.autoSaveDisabled")}`
            );
            this.updateLayoutLabelElement(element, layoutName, targetWin);
          } else {
            void this.saveLayoutFromWindow(targetWin);
          }
        })();
      }
    );

    if (isAutoSave) {
      autoSaveBtn.classList.add("is-active");
    } else {
      autoSaveBtn.classList.remove("is-active");
    }

    ensureActionButton(
      "window-spaces-layout-open",
      "layout",
      t("commands.openLayoutsRibbon"),
      () => this.plugin.openWindowLayoutsModal(targetWin)
    );

    ensureActionButton(
      "window-spaces-layout-settings",
      "settings",
      t("activityBar.openSettings"),
      () => this.openPluginSettings()
    );
    element.setAttribute("aria-label", `${t("common.layoutLabel")}: ${layoutName}`);
    element.setAttribute("title", layoutName);
    element.dataset.layoutName = layoutName;
  }

  /** 開啟 Window Spaces 設定頁面。 */
  private openPluginSettings(): void {
    void (async () => {
      try {
        const setting = (this.app as unknown as { setting?: { open?: () => Promise<void>; openTabById?: (id: string) => void } }).setting;
        if (!setting) return;
        // 需先開啟設定 Modal，再切換到指定 tab（obsidian 內部 API）
        if (typeof setting.open === "function") {
          await setting.open();
        }
        if (typeof setting.openTabById === "function") {
          setting.openTabById("window-spaces");
        }
      } catch (e) {
        console.warn("Failed to open Window Spaces settings:", e);
      }
    })();
  }


  /** 開啟全新的 Popout 視窗（等待 leaf 與 DOM 都完成掛載後再回傳視窗物件） */
  async openNewPopoutWindow(options: { initializeDefaults?: boolean } = {}): Promise<Window | null> {
    try {
      // shared 統一開窗：openPopoutLeaf + 初始 empty tab + 等待 window mount +
      // 依序呼叫所有已註冊 candidate 的 initializeNewPopoutWindow policy
      // （Window Spaces 的 activity bar 初始化即由此提供）。
      const result = await this.plugin.popoutLayout.openNewPopoutWindow();
      if (!result) return null;

      if (options.initializeDefaults !== false) {
        // 初始化完成後把 active 切回中央編輯區（New tab），讓使用者可直接開始編輯；
        // 避免 active 停留在右側欄第一個 view（「開啟完成時 New tab 被切走」的錯覺）。
        try {
          const centerLeaf = this.plugin.popoutLayout.getCenterLeafSync(result.win);
          if (centerLeaf) {
            this.app.workspace.setActiveLeaf(centerLeaf, { focus: true });
          }
        } catch (e) {
          console.warn("Failed to focus center leaf after New Window init:", e);
        }
      }
      return result.win;
    } catch (e) {
      console.warn("Failed to open new popout window:", e);
    }
    return null;
  }

  private async saveLayoutFromWindow(targetWin: Window): Promise<void> {
    try {
      const layoutName = this.layoutNames.get(targetWin) || "";
      const existing = this.plugin.settings.spaces.find((l: WindowLayout) => l.name === layoutName);

      const layout = await this.captureCurrentLayout(
        { name: layoutName },
        targetWin
      );

      if (existing) {
        layout.autoSave = existing.autoSave;
        layout.icon = existing.icon;
        layout.color = existing.color;
        layout.borderInset = existing.borderInset;
        layout.showFoldedCorner = existing.showFoldedCorner;
        layout.activityBars = existing.activityBars;
      }

      this.plugin.openSaveLayoutModal(layout, targetWin);
    } catch (error: unknown) {
      console.error("Failed to capture layout from Popout:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`${t("errors.failedToSave")}: ${message}`);
    }
  }

  private async saveLayoutDirectFromWindow(targetWin: Window): Promise<void> {
    try {
      const layoutName = this.layoutNames.get(targetWin) || "";
      const existing = this.plugin.settings.spaces.find((l: WindowLayout) => l.name === layoutName);

      const layout = await this.captureCurrentLayout(
        { name: layoutName },
        targetWin
      );

      if (existing) {
        layout.id = existing.id;
        layout.autoSave = existing.autoSave;
        layout.icon = existing.icon;
        layout.color = existing.color;
        layout.borderInset = existing.borderInset;
        layout.showFoldedCorner = existing.showFoldedCorner;
        layout.activityBars = existing.activityBars;
        layout.sections = existing.sections;
        layout.archived = existing.archived;
      }

      await this.saveLayout(layout);
      if (this.plugin.settings.showNotifications !== false) {
        new Notice(`${t("notifications.layoutSaved")}: ${layout.name}`);
      }
    } catch (error: unknown) {
      console.error("Failed to direct save layout from Popout:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`${t("errors.failedToSave")}: ${message}`);
    }
  }

  private autoSaveTimers = new Map<Window, number>();
  private lastValidSnapshots = new Map<Window, WindowLayout>();

  /**
   * 檢查並發動所有已開啟自動保存的 Popout 視窗的 5 秒 Debounced 自動儲存
   */
  checkAndDebouncedAutoSaveAll(): void {
    this.layoutNames.forEach((layoutName, targetWin) => {
      const existing = this.plugin.settings.spaces.find((l: WindowLayout) => l.name === layoutName);
      if (existing && existing.autoSave === true) {
        // 1. 視窗存活期間，嘗試備份當前合法的 Layout 快照
        void this.captureCurrentLayout({ name: layoutName }, targetWin)
          .then((snapshot) => {
            if (snapshot.metadata?.fileCount > 0 || (snapshot.workspace?.leaves && snapshot.workspace.leaves.length > 0)) {
              snapshot.autoSave = true;
              snapshot.id = existing.id;
              this.lastValidSnapshots.set(targetWin, snapshot);
            }
          })
          .catch(() => {});

        // 2. 設置 5 秒 Debounce 定時器
        const existingTimer = this.autoSaveTimers.get(targetWin);
        if (existingTimer !== undefined) {
          window.clearTimeout(existingTimer);
        }

        const timer = window.setTimeout(() => {
          this.autoSaveTimers.delete(targetWin);
          void this.autoSaveWindowLayout(targetWin);
        }, 5000); // 固定的 5 秒 Debounce 機制

        this.autoSaveTimers.set(targetWin, timer);
      }
    });
  }

  /**
   * 實時自動保存指定的 Popout 視窗佈局 (包含 0 檔案清空防呆保護)
   */
  async autoSaveWindowLayout(targetWin: Window): Promise<void> {
    const layoutName = this.layoutNames.get(targetWin);
    if (!layoutName) return;

    const existing = this.plugin.settings.spaces.find((l: WindowLayout) => l.name === layoutName);
    if (!existing || !existing.autoSave) return;

    try {
      let captured: WindowLayout | null = null;

      // 1. 嘗試進行現場 capture
      try {
        const liveCaptured = await this.captureCurrentLayout({ name: layoutName }, targetWin);
        if (liveCaptured.metadata?.fileCount > 0 || (liveCaptured.workspace?.leaves && liveCaptured.workspace.leaves.length > 0)) {
          captured = liveCaptured;
          captured.autoSave = true;
          captured.id = existing.id;
          captured.includeGeometry = existing.includeGeometry;
          captured.icon = existing.icon;
          captured.color = existing.color;
          captured.borderInset = existing.borderInset;
          captured.showFoldedCorner = existing.showFoldedCorner;
          captured.activityBars = existing.activityBars;
          this.lastValidSnapshots.set(targetWin, captured);
        }
      } catch {
        // 視窗已被摧毀時 capture 可能出錯
      }

      // 2. 防呆門檻：若現場 capture 為空/失敗（例如視窗正被關閉），退回使用關閉前最後一次合法的快照
      if (!captured) {
        captured = this.lastValidSnapshots.get(targetWin) || null;
      }

      // 3. 嚴格防呆門檻：若依然為空，或者快照中的檔案數為 0，且原本既有佈局含有檔案，堅決拒絕覆寫！
      if (!captured || (captured.metadata?.fileCount === 0 && existing.metadata?.fileCount > 0)) {
        console.warn(`[Window Spaces] Suppressed auto-save for layout "${layoutName}" to prevent empty file list overwrite.`);
        return;
      }

      const now = Date.now();
      captured.createdAt = existing.createdAt || existing.timestamp || now;
      captured.updatedAt = now;
      captured.timestamp = now;

      // 4. 安全靜默覆寫更新設定檔
      const index = this.plugin.settings.spaces.findIndex((l: WindowLayout) => l.id === existing.id);
      if (index !== -1) {
        this.plugin.settings.spaces[index] = captured;
      } else {
        this.plugin.settings.spaces.push(captured);
      }
      await this.plugin.saveSettings();
      WindowLayoutsModal.renderAllInstances();
    } catch (e) {
      console.warn(`[Window Spaces] Auto-save on close/change failed for "${layoutName}":`, e);
    }
  }

  private removeLayoutLabel(targetWin: Window): void {
    // 1. 若有待發動的 5 秒 Debounce 定時器，將其清除
    const timer = this.autoSaveTimers.get(targetWin);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      this.autoSaveTimers.delete(targetWin);
    }

    // 2. 視窗關閉時發動最終安全自動存檔
    void this.autoSaveWindowLayout(targetWin);

    // 3. 釋放快照與綁定
    this.lastValidSnapshots.delete(targetWin);

    const labels = this.layoutLabels.get(targetWin);
    labels?.statusBar?.remove();
    this.layoutNames.delete(targetWin);
    this.layoutLabels.delete(targetWin);
  }

  private isPopoutDocument(targetDocument: Document | null | undefined): boolean {
    const body = targetDocument?.body;
    return !!body && (
      body.classList.contains("is-popout-window") ||
      body.classList.contains("mod-popout")
    );
  }

  /**
   * 檢查指定 Layout 是否目前已在某個存活的 Popout 視窗中開啟。
   */
  getOpenWindowForLayout(layout: WindowLayout): Window | null {
    if (!layout) return null;

    // 1. 先查記憶體對映的 layoutWindows
    const mappedWin = this.layoutWindows.get(layout);
    if (mappedWin && !mappedWin.closed && this.isPopoutDocument(mappedWin.document)) {
      if (this.getLeavesForWindow(mappedWin).length > 0) {
        return mappedWin;
      }
    }

    // 2. 遍歷目前所有存活的 Popout 視窗，依名稱與標籤比對
    const liveWindows = new Set<Window>();
    const workspace = this.app.workspace as unknown as ExtendedWorkspace;
    if (typeof workspace.iterateAllLeaves === "function") {
      workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
        const win = this.getWindowForLeaf(leaf);
        if (win && !win.closed && this.isPopoutDocument(win.document)) {
          liveWindows.add(win);
        }
      });
    }

    for (const win of Array.from(liveWindows)) {
      const label = this.getLayoutNameForWindow(win);
      if (label && label === layout.name) {
        return win;
      }
    }

    // 3. 多級比對：比對檔案與 Leaves (必須有高精確度 matchScore > 0，嚴禁盲目 fallback 單一視窗)
    const savedLeaves = this.getSavedViewStates(layout);
    if (savedLeaves.length > 0) {
      const matchedWin = this.findWindowForSavedLeaves(savedLeaves, undefined, null, new Set(), true);
      if (matchedWin && !matchedWin.closed && this.isPopoutDocument(matchedWin.document)) {
        return matchedWin;
      }
    }

    return null;
  }

  public getWindowForLayout(layout: WindowLayout): Window | null {
    return this.getOpenWindowForLayout(layout) ||
      this.layoutWindows.get(layout) ||
      this.findWindowForSavedLeaves(this.getSavedViewStates(layout));
  }

  /** 確認 Popout 仍持有原生焦點，避免延遲重試搶回主視窗焦點。 */
  private isWindowFocused(targetWin: Window): boolean {
    try {
      const hasFocus = targetWin.document?.hasFocus;
      return typeof hasFocus === "function" ? hasFocus.call(targetWin.document) : true;
    } catch {
      return true;
    }
  }

  /** 確認主視窗 (plugin realm) 是否持有原生焦點。 */
  private isMainWindowFocused(): boolean {
    try {
      const hasFocus = window.document?.hasFocus;
      return typeof hasFocus === "function" ? hasFocus.call(window.document) : true;
    } catch {
      return true;
    }
  }

  /**
   * 聚焦 (Focus) 指定 Popout 視窗並啟用合適的 Leaf (顯式呼叫 revealLeaf 確保分頁真實切換為可見)
   */
  focusTargetWindow(targetWin: Window, preferredLeaf?: WorkspaceLeaf | null): void {
    if (!targetWin || targetWin.closed) return;

    const doFocusAndReveal = async (focusWindow: boolean) => {
      try {
        if (focusWindow && typeof targetWin.focus === "function") {
          targetWin.focus();
        }
        if (!focusWindow && !this.isWindowFocused(targetWin)) return;

        const freshLeaves = this.getLeavesForWindow(targetWin);
        if (freshLeaves.length === 0) return;

        let targetLeaf: WorkspaceLeaf | null = null;

        if (preferredLeaf && freshLeaves.includes(preferredLeaf)) {
          targetLeaf = preferredLeaf;
        } else {
          // 若無指定 preferredLeaf，優先保留當前視窗原有的 activeLeaf
          const activeLeaf = typeof this.app.workspace.getMostRecentLeaf === "function"
            ? this.app.workspace.getMostRecentLeaf()
            : (this.app.workspace as ExtendedWorkspace).activeLeaf;
          if (activeLeaf && freshLeaves.includes(activeLeaf)) {
            targetLeaf = activeLeaf;
          } else {
            targetLeaf = freshLeaves[0];
          }
        }

        if (targetLeaf) {
          await this.app.workspace.revealLeaf(targetLeaf);
          // revealLeaf() is asynchronous; the user may have switched to the
          // main window while it was pending. Never steal that focus back.
          if (!this.isWindowFocused(targetWin)) return;
          this.app.workspace.setActiveLeaf(targetLeaf, { focus: focusWindow });
        }
      } catch {
        // Ignore focus error
      }
    };

    void doFocusAndReveal(true);
    targetWin.setTimeout(() => { void doFocusAndReveal(false); }, 50);
    targetWin.setTimeout(() => { void doFocusAndReveal(false); }, 200);
  }

  /**
   * 取得指定視窗內「目前 active 的 tab」leaf（依 tab header 的 is-active class）。
   * 全域 activeLeaf 可能指向其他視窗（例如使用者已切回主視窗），此時不該
   * fallback 到視窗內第一個 leaf，以免把第一個 tab 搶成 active。
   */
  private getActiveLeafInWindow(targetWin: Window): WorkspaceLeaf | null {
    const workspace = this.app.workspace as unknown as ExtendedWorkspace;
    if (typeof workspace.iterateAllLeaves !== "function") return null;
    let found: WorkspaceLeaf | null = null;
    workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (found) return;
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      if (extLeaf.containerEl?.ownerDocument?.defaultView !== targetWin) return;
      const tabEl = (extLeaf as { tabHeaderEl?: HTMLElement }).tabHeaderEl;
      if (tabEl && tabEl.classList.contains("is-active")) {
        found = leaf;
      }
    });
    return found;
  }

  /**
   * 獲取目前活動視窗 (activeWindow) 中真正的 activeLeaf
   */
  private getActiveLeafForCurrentWindow(targetWindow?: Window): WorkspaceLeaf | null {
    const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);
    const globalActiveLeaf = this.app.workspace.getMostRecentLeaf();

    // 1. 若全域 activeLeaf 的 ownerWindow 就是 currentWin，直接返回
    if (globalActiveLeaf && (globalActiveLeaf as unknown as ExtendedWorkspaceLeaf).containerEl?.ownerDocument?.defaultView === currentWin) {
      return globalActiveLeaf;
    }

    // 2. 若全域 activeLeaf 不在 currentWin（例如 Command Palette modal 搶焦），遍歷尋找屬於 currentWin 的 leaf
    let windowLeaf: WorkspaceLeaf | null = null;
    (this.app.workspace as unknown as ExtendedWorkspace).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      if (!windowLeaf && extLeaf.containerEl?.ownerDocument?.defaultView === currentWin) {
        windowLeaf = leaf;
      }
    });

    return windowLeaf || globalActiveLeaf;
  }

  /**
   * 獲取指定 DOM Window 中所有的 WorkspaceLeaves
   */
  private getLeavesForWindow(targetWin: Window): WorkspaceLeaf[] {
    const leaves: WorkspaceLeaf[] = [];
    (this.app.workspace as unknown as ExtendedWorkspace).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      if (extLeaf.containerEl?.ownerDocument?.defaultView === targetWin) {
        leaves.push(leaf);
      }
    });
    return leaves;
  }

  /** 保存指定 Window 的 live leaf 狀態，供 changeLayout 後重新辨識視窗。 */
  private getViewStatesForWindow(targetWin: Window): ViewState[] {
    return this.getLeavesForWindow(targetWin).map((leaf) => {
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      const viewState = typeof extLeaf.getViewState === "function"
        ? extLeaf.getViewState()
        : { id: "", type: leaf.view?.getViewType() || "unknown", state: {} };
      return {
        id: extLeaf.id || this.generateId(),
        type: viewState.type || leaf.view?.getViewType() || "unknown",
        state: viewState.state || {},
      };
    });
  }

  /** 快照目前所有已套用 layout 的 live popout，供新視窗 restore 後復原標籤。 */
  private capturePreservedWindowLayouts(): PreservedWindowLayout[] {
    const liveWindows = new Set<Window>();
    (this.app.workspace as unknown as ExtendedWorkspace).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const targetWin = this.getWindowForLeaf(leaf);
      if (targetWin && this.isPopoutDocument(targetWin.document)) {
        liveWindows.add(targetWin);
      }
    });

    const snapshots: PreservedWindowLayout[] = [];
    liveWindows.forEach((targetWin) => {
      const layoutName = this.getLayoutNameForWindow(targetWin);
      if (!layoutName) return;
      snapshots.push({
        window: targetWin,
        layoutName,
        leaves: this.getViewStatesForWindow(targetWin),
        windowState: this.getWindowState(targetWin),
      });
    });
    return snapshots;
  }

  /**
   * 捕獲當前活動視窗的佈局
   */
  async captureCurrentLayout(
    options: SaveLayoutOptions = {},
    targetWindow?: Window
  ): Promise<WindowLayout> {
    try {
      const workspace = this.app.workspace as unknown as ExtendedWorkspace;
      const fullLayout = workspace.getLayout();
      const activeLeaf = this.getActiveLeafForCurrentWindow(targetWindow);
      const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);

      // 取得當前活動 DOM 視窗中所有真實開著的 Leaves
      const windowLeaves = this.getLeavesForWindow(currentWin);

      // 只提取當前浮動視窗的佈局資訊
      let floatingLayout = this.extractCurrentFloatingLayout(fullLayout, activeLeaf);

      if (!floatingLayout) {
        const extActiveLeaf = activeLeaf as unknown as ExtendedWorkspaceLeaf | null;
        const rootInfo = extActiveLeaf && typeof extActiveLeaf.getRoot === "function" ? extActiveLeaf.getRoot()?.constructor?.name : "no-leaf";
        const isPopout = this.isCurrentlyInPopoutWindow(activeLeaf);
        console.warn("[WindowSpaces Debug]", { rootInfo, isPopout, fullLayout });
        throw new Error(`${t("errors.notInPopoutWindow")} (root: ${rootInfo}, isPopout: ${isPopout})`);
      }

      // 若視窗包含多個 Leaves，但 layout 僅被抓為單一 leaf，將其包裝為包含全數 leaves 的 split 容器
      if (windowLeaves.length > 1 && floatingLayout.type === "leaf") {
        floatingLayout = {
          type: "split",
          id: this.generateId(),
          direction: "vertical",
          children: windowLeaves.map((leaf) => {
            const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
            return {
              id: this.generateId(),
              type: "tabs",
              children: [{
                id: extLeaf.id || this.generateId(),
                type: "leaf",
                state: typeof extLeaf.getViewState === "function" ? extLeaf.getViewState() : { type: leaf.view?.getViewType() || "markdown", state: {} }
              }]
            };
          })
        };
      }

      const windowInfo = this.getCurrentWindowState();

      // Layout tree 才是目前視窗的完整來源。iterateAllLeaves 在某些
      // Obsidian 版本/Popout 狀態下只會回傳 active leaf，因此不能只用
      // windowLeaves 建立檔案列表。
      const layoutLeaves = this.extractLeavesFromLayout(floatingLayout);
      const liveLeavesById = new Map<string, WorkspaceLeaf>();
      windowLeaves.forEach((leaf) => {
        const id = (leaf as unknown as ExtendedWorkspaceLeaf).id;
        if (id) liveLeavesById.set(id, leaf);
      });

      const leaves: ViewState[] = layoutLeaves.map((layoutLeaf) => {
        const liveLeaf = liveLeavesById.get(layoutLeaf.id);
        if (!liveLeaf) return layoutLeaf;

        const extLiveLeaf = liveLeaf as unknown as ExtendedWorkspaceLeaf;
        const viewState = typeof extLiveLeaf.getViewState === "function"
          ? extLiveLeaf.getViewState()
          : { id: "", type: liveLeaf.view?.getViewType() || layoutLeaf.type, state: {} };
        return {
          id: layoutLeaf.id,
          type: viewState.type || liveLeaf.view?.getViewType() || layoutLeaf.type,
          state: viewState.state || layoutLeaf.state || {},
        };
      });

      // 若 layout tree 缺少 leaf（例如 Obsidian 正在完成 Popout layout），
      // 仍保留即時找到的 leaf，避免保存時遺失其他檔案。
      const capturedIds = new Set(leaves.map((leaf) => leaf.id));
      windowLeaves.forEach((leaf) => {
        const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
        const id = extLeaf.id || this.generateId();
        if (capturedIds.has(id)) return;

        const viewState = typeof extLeaf.getViewState === "function"
          ? extLeaf.getViewState()
          : { id: "", type: leaf.view?.getViewType() || "unknown", state: {} };
        leaves.push({
          id,
          type: viewState.type || leaf.view?.getViewType() || "unknown",
          state: viewState.state || {},
        });
      });

      const capturedLayout: WindowLayout = {
        id: this.generateId(),
        name: options.name ?? this.layoutNames.get(currentWin) ?? "",
        timestamp: Date.now(),
        windowState: {
          size:
            options.includeWindowSize !== false
              ? windowInfo.size
              : { width: 0, height: 0 },
          position:
            options.includePosition !== false ? windowInfo.position : undefined,
        },
        workspace: {
          layout: floatingLayout as Record<string, unknown>,
          activeFile: (activeLeaf?.view as unknown as { file?: TFile })?.file?.path,
          leaves,
        },
        metadata: {
          fileCount: this.countOpenFiles(leaves),
          tabCount: leaves.length,
          splitCount: 0,
          createdAt: new Date().toISOString(),
          obsidianVersion: (this.app as unknown as { version?: string }).version || "unknown",
          pluginVersion: this.plugin?.manifest?.version || "1.0.0",
        },
        windowInfo: {
          firstLeafId: leaves.length > 0 ? leaves[0].id : undefined,
        },
      };

      const existingLayout = this.plugin.settings?.spaces?.find(
        (l: WindowLayout) => l.name === capturedLayout.name
      );
      if (existingLayout) {
        if (existingLayout.includeGeometry !== undefined) {
          capturedLayout.includeGeometry = existingLayout.includeGeometry;
        }
        if (existingLayout.icon !== undefined) {
          capturedLayout.icon = existingLayout.icon;
        }
        if (existingLayout.color !== undefined) {
          capturedLayout.color = existingLayout.color;
        }
        if (existingLayout.borderInset !== undefined) {
          capturedLayout.borderInset = existingLayout.borderInset;
        }
        if (existingLayout.showFoldedCorner !== undefined) {
          capturedLayout.showFoldedCorner = existingLayout.showFoldedCorner;
        }
        if (existingLayout.activityBars !== undefined) {
          capturedLayout.activityBars = existingLayout.activityBars;
        }
      }

      // 紀錄該視窗目前隱藏的側欄/分頁群組（Activity Bar 與 Pane 隱藏功能持久化）
      try {
        capturedLayout.hidden = this.plugin.popoutLayout.captureHiddenState(currentWin);
      } catch {
        capturedLayout.hidden = undefined;
      }

      // 儲存對話框開啟後 activeWindow 可能已經切回主視窗，
      // 因此保存 capture 當下的 DOM Window，供 saveLayout 使用。
      this.layoutWindows.set(capturedLayout, currentWin);
      return capturedLayout;
    } catch (error: unknown) {
      console.error("Failed to capture layout:", error);
      throw error;
    }
  }


  /**
   * 恢復指定的佈局 (忠實還原 Tabs, Horizontal/Vertical Splits 與檔案狀態)
   */
  async restoreLayout(
    layout: WindowLayout,
    options: RestoreLayoutOptions = {}
  ): Promise<void> {
    // A layout can be visible in both the persistent panel and a popout
    // dialog. Coalesce overlapping restore events so one click cannot create
    // two popout windows (one of them appearing blank during reconstruction).
    if (this.activeRestorePromise) return this.activeRestorePromise;

    const restorePromise = this.restoreLayoutInternal(layout, options);
    this.activeRestorePromise = restorePromise;
    try {
      await restorePromise;
    } finally {
      if (this.activeRestorePromise === restorePromise) {
        this.activeRestorePromise = null;
      }
    }
  }

  private async restoreLayoutInternal(
    layout: WindowLayout,
    options: RestoreLayoutOptions = {}
  ): Promise<void> {
    this.isRestoringLayout = true;
    try {
      // 驗證佈局數據
      if (!this.validateLayout(layout)) {
        throw new Error(t("errors.invalidData"));
      }

      // 0. 若此 space 已在某個存活的 Popout 視窗中開啟，直接聚焦該視窗，
      // 避免重複 restore 相同的 space。
      // - forceReload (Shift 套用至目前視窗) 是明確的覆寫動作，仍繼續走既有流程。
      // - clone 流程 (forceNewWindow 但無 focusExistingWindow) 刻意要開新視窗。
      if (
        !options.forceReload &&
        (!options.forceNewWindow || options.focusExistingWindow === true)
      ) {
        const existingWin = this.getOpenWindowForLayout(layout);
        if (existingWin && !existingWin.closed && this.isPopoutDocument(existingWin.document)) {
          // 聚焦已開啟的視窗時，保留視窗內目前的 active tab，
          // 避免 active 被搶回第一個 tab。
          this.focusTargetWindow(existingWin, this.getActiveLeafInWindow(existingWin));
          this.setLayoutLabelForWindow(existingWin, layout.name);
          this.refreshLayoutLabels();

          if (options.showNotifications !== false && this.plugin.settings.showNotifications !== false) {
            new Notice(tWithParams("notifications.switchedToOpenWindow", { name: layout.name }));
          }
          return;
        }
      }

      // changeLayout 可能重建任一既有 WorkspaceWindow。所有 restore 都先
      // 保存 live popout；普通 Enter restore 不保留將被取代的目標名稱。
      const preservedWindowLayouts = this.capturePreservedWindowLayouts()
        .filter((snapshot) =>
          options.forceNewWindow || snapshot.window !== options.targetWindow
        );

      const savedLeaves = this.getSavedViewStates(layout);
      const savedLeafId = layout.windowInfo?.firstLeafId || savedLeaves[0]?.id;
      const workspace = this.app.workspace as unknown as ExtendedWorkspace;
      let currentLayout: Record<string, unknown> = workspace.getLayout();
      let floatingWindows = this.getFloatingWindows(currentLayout);

      // 1. 嘗試尋找目標現有視窗
      let targetIndex = -1;
      let targetWin: Window | null = null;
      // 標記目標是否為本次 restore 才建立的全新 Popout（可走 leaf 層級重建）
      let isNewlyCreatedWindow = false;

      if (options.forceNewWindow) {
        // 強制在新 Popout 視窗開啟
        targetIndex = -1;
      } else if (options.targetWindow && this.isPopoutDocument(options.targetWindow.document)) {
        // 優先還原至傳入的當前 Popout 視窗 (取代當前視窗)
        targetWin = options.targetWindow;
        targetIndex = this.findFloatingWindowIndexForWindow(
          targetWin,
          floatingWindows
        );
      } else if (savedLeafId && floatingWindows.length > 0) {
        for (let i = 0; i < floatingWindows.length; i++) {
          if (this.floatingWindowContainsLeaf(floatingWindows[i], savedLeafId)) {
            targetIndex = i;
            break;
          }
        }

        const existingTargetLeaf = this.findLeafById(savedLeafId);
        targetWin = this.getWindowForLeaf(existingTargetLeaf);
      }

      // 2. 若找不到現有視窗，且非明確指定取代的 Popout 視窗，建立一個新 Popout 視窗
      if (targetIndex < 0) {
        if (!options.forceNewWindow && options.targetWindow && this.isPopoutDocument(options.targetWindow.document)) {
          // 最終仍以 live popout 的 DOM/容器順序定位，不因 runtime root
          // 沒有序列化 ID 而中止正常 Enter restore。
          targetWin = options.targetWindow;
          targetIndex = this.findPopoutOrdinal(targetWin, floatingWindows.length);
          if (targetIndex < 0) {
            throw new Error(t("errors.cannotRestore"));
          }
        } else {
          // 記錄開啟前的 Popout 視窗集合
          const popoutWinsBefore = new Set(this.getLivePopoutWindows());

          // 呼叫 openPopoutLeaf 建立新 Popout 分頁
          isNewlyCreatedWindow = true;
          const extWs = this.app.workspace as unknown as ExtendedWorkspace & {
            openPopoutLeaf?: (data?: WorkspaceWindowInitData) => WorkspaceLeaf;
          };
          // 【幾何前置】openPopoutLeaf 接受 WorkspaceWindowInitData（x/y/size），
          // 直接帶入 saved 幾何，讓新視窗在誕生瞬間就是正確位置與尺寸。
          // 若不帶，Obsidian 會以預設幾何（Electron 預設 1025x801@螢幕中央）
          // 建立，之後 restoreWindowGeometry 再校正會產生「先錯誤位置、
          // 約 1 秒後才跳正」的兩階段跳動。
          const popoutInitData: WorkspaceWindowInitData | undefined =
            layout.includeGeometry !== false && layout.windowState
              ? {
                  x: layout.windowState.position?.x,
                  y: layout.windowState.position?.y,
                  size: layout.windowState.size
                    ? {
                        width: layout.windowState.size.width,
                        height: layout.windowState.size.height,
                      }
                    : undefined,
                }
              : undefined;
          const popoutLeaf = extWs.openPopoutLeaf?.(popoutInitData);

          // 輪詢等待全新的 Live Popout Window 在 Electron 中被正式掛載建立（最多等待 2 秒）
          let newlyCreatedWin: Window | null = null;
          for (let attempt = 0; attempt < 40; attempt++) {
            await new Promise((resolve) => window.setTimeout(resolve, 50));
            const currentPopoutWins = this.getLivePopoutWindows();
            newlyCreatedWin = currentPopoutWins.find((w) => !popoutWinsBefore.has(w)) || null;
            if (newlyCreatedWin) break;
          }

          const extPopoutLeaf = popoutLeaf as unknown as ExtendedWorkspaceLeaf | undefined;
          targetWin = newlyCreatedWin || extPopoutLeaf?.containerEl?.ownerDocument?.defaultView || null;

          if (targetWin) {
            // 【幾何前置】新視窗一誕生立即進行座標移動與尺寸縮放，消弭兩階段鋸齒 jump
            this.restoreWindowGeometry(targetWin, layout.windowState, layout.includeGeometry, true);
          }

          // 重新讀取最新的 Layout
          currentLayout = workspace.getLayout();
          floatingWindows = this.getFloatingWindows(currentLayout);

          // 以新開視窗的 ID 或在 floating 陣列末尾精確定位 targetIndex
          if (targetWin) {
            targetIndex = this.findFloatingWindowIndexForWindow(targetWin, floatingWindows);
          }
          if (targetIndex < 0) {
            targetIndex = floatingWindows.length - 1;
          }
        }
      }

      // 3. 結構建立。新建的目標視窗若為簡單結構（單層 split / 單 tabs 群組），
      // 直接以 leaf 層級 API 重建，完全不觸發全域 changeLayout——主視窗與其他
      // popout 的 DOM/view 一律不受影響（changeLayout 內部會 clearLayout：
      // 關閉所有 floating window、detach 主視窗與全部 popout 的 DOM 後重建，
      // 代價極高）。巢狀 split 或取代既有視窗等複雜情境才 fallback 到 changeLayout。
      let builtLeaves: WorkspaceLeaf[] | null = null;
      if (targetIndex >= 0 && layout.workspace?.layout) {
        const rootNode = this.extractLayoutRootNode(layout.workspace.layout);
        if (isNewlyCreatedWindow && targetWin && this.isSimpleLayoutStructure(rootNode)) {
          builtLeaves = await this.buildSimpleWindowStructure(targetWin, rootNode);
          // 【方案 C】leaf 層級建立完成後、開啟檔案前，立即隱藏側欄。
          // 側欄收合不依賴 leaf id（由 root split 的頂層欄位定位），
          // 提前到這裡可避免「先顯示展開側欄、開檔後才收合」的二次跳動。
          // 巢狀 split fallback（changeLayout）路徑仍在下方套用。
          if (layout.hidden && targetWin) {
            try {
              if (layout.hidden.leftSidebar) {
                this.plugin.popoutLayout.hideColumn(targetWin, "left");
              }
              if (layout.hidden.rightSidebar) {
                this.plugin.popoutLayout.hideColumn(targetWin, "right");
              }
            } catch {
              // Ignore DOM not ready error during early apply
            }
          }
        } else {
          const currentFloatingWindow = floatingWindows[targetIndex];
          const restoredWindow = this.prepareFloatingWindowForRestore(
            layout.workspace.layout,
            currentFloatingWindow,
            layout.includeGeometry,
            layout.windowState
          );
          const livePopoutsBeforeLayout = this.getLivePopoutWindows();
          const floatingObj = currentLayout.floating as { type?: string; children?: unknown[] } | unknown[];
          if (typeof floatingObj === "object" && floatingObj !== null && "type" in floatingObj && (floatingObj as { type?: string }).type === "floating" && Array.isArray((floatingObj as { children?: unknown[] }).children)) {
            (floatingObj as { children: unknown[] }).children = (floatingObj as { children: unknown[] }).children.map(
              (child: unknown, idx: number) => {
                if (idx === targetIndex) return restoredWindow;
                const liveWin = livePopoutsBeforeLayout.find(
                  (w) => this.findFloatingWindowIndexForWindow(w, floatingWindows) === idx
                ) || livePopoutsBeforeLayout[idx];
                if (liveWin && !liveWin.closed && this.isPopoutDocument(liveWin.document)) {
                  return this.syncLiveWindowBoundsToFloatingChild(child, liveWin);
                }
                return child;
              }
            );
          } else if (Array.isArray(floatingObj)) {
            floatingObj[targetIndex] = restoredWindow;
          }
          await workspace.changeLayout(currentLayout);
        }
      }

      // 4. 取得目標 Popout 視窗最新活體 DOM Window。changeLayout 會關閉並
      // 重建所有 floating window（含 openPopoutLeaf 剛建立的目標窗），因此
      // 必須在 changeLayout 完成後立即重新解析目標視窗，並立刻套用保存的
      // 幾何，避免新視窗停留在預設位置直到檔案開啟完成後才被移動
      // （兩階段位置跳動）。
      const livePopouts = this.getLivePopoutWindows();
      let liveTargetWin: Window | null = null;

      if (options.forceNewWindow) {
        if (options.targetWindow) {
          const nonSourceWins = livePopouts.filter((w) => w !== options.targetWindow);
          if (nonSourceWins.length > 0) {
            liveTargetWin = nonSourceWins[nonSourceWins.length - 1];
          }
        } else {
          liveTargetWin = livePopouts[livePopouts.length - 1] || targetWin;
        }
      } else if (targetIndex >= 0 && targetIndex < livePopouts.length) {
        liveTargetWin = livePopouts[targetIndex];
      }

      targetWin = liveTargetWin || this.findWindowForSavedLeaves(
        savedLeaves,
        options.targetWindow,
        targetWin
      ) || targetWin;

      // 【幾何立即套用】changeLayout 以 window.open features 重建視窗，其
      // x/y 不一定被 Electron 採用；立即用 windowState 強制校正，再開始
      // 開啟檔案，消除「先偏位、開檔後才回正」的位移感。
      if (targetWin) {
        this.restoreWindowGeometry(targetWin, layout.windowState, layout.includeGeometry, true);
      }

      await new Promise((resolve) => window.setTimeout(resolve, 150));

      let missingFiles: string[] = [];
      if (options.validateFiles !== false && savedLeaves.length > 0) {
        missingFiles = await this.restoreFileStatesForWindow(
          targetWin,
          savedLeaves,
          layout.workspace?.activeFile
        );
      }

      // leaf 層級建立情境：saved leaf 與 live leaf 的 id 不同，需以「先序
      // 順序」對應套用 pinned，並把 hidden leaf id 轉換成 live id。
      if (builtLeaves && builtLeaves.length > 0) {
        this.applyPinnedStateToBuiltLeaves(builtLeaves, savedLeaves);
        if (layout.hidden?.hiddenLeafIds?.length && targetWin) {
          const hiddenIds = new Set(layout.hidden.hiddenLeafIds);
          layout.hidden.hiddenLeafIds = builtLeaves
            .filter((_, i) => hiddenIds.has(savedLeaves[i]?.id))
            .map((leaf) => (leaf as unknown as ExtendedWorkspaceLeaf).id || "");
        }
      }

      this.setLayoutLabelForWindow(targetWin, layout.name);
      // 回寫視窗識別記號：下次重啟可直接核對 leafIdMarker 識別此 space
      this.syncWindowLeafMarker(targetWin, layout);
      this.restorePreservedWindowLabels(preservedWindowLayouts, targetWin);
      this.refreshLayoutLabels();

      // 先套用隱藏的側欄/分頁群組，避免幾何對齊後再縮放側欄觸發橫向位移
      if (targetWin && layout.hidden) {
        this.applyHiddenStateAfterRestore(targetWin, layout.hidden);
      }

      // 5. 調整視窗尺寸與座標，並聚焦視窗
      if (targetWin) {
        this.layoutWindows.set(layout, targetWin);
        this.plugin.activityBars?.renderWindow(targetWin);
        // 幾何已在 changeLayout 後立即套用；此處僅以差異驗證（force=false）
        // 校正檔案開啟期間可能出現的微幅偏移，避免無謂地移動已就位的視窗。
        this.restoreWindowGeometry(targetWin, layout.windowState, layout.includeGeometry, false);

        // 若使用者在 restore 的非同步等待期間已切回主視窗，就不能再把全域
        // activeLeaf 指到 popout leaf，否則下一次主視窗 File Explorer 點擊
        // note 會被導向 popout（需點兩下才切換）。僅當 popout 仍持有焦點、
        // 或主視窗也未持有焦點（Obsidian 在背景）時才啟動 popout。
        const canActivatePopout = this.isWindowFocused(targetWin) || !this.isMainWindowFocused();

        const winLeaves = this.getLeavesForWindow(targetWin);
        if (winLeaves.length > 0 && canActivatePopout) {
          // restoreFileStatesForWindow 已把 active 設到 layout 保存時選中的
          // tab（activeFile 對應的 leaf，fallback 第一個 leaf）。此處只在全域
          // activeLeaf 尚未指向此 popout 時才設定，避免把 active 搶到第一個
          // column 的第一個 tab，導致原本選中的 tab 失去 active。
          const activeLeaf = typeof this.app.workspace.getMostRecentLeaf === "function"
            ? this.app.workspace.getMostRecentLeaf()
            : (this.app.workspace as ExtendedWorkspace).activeLeaf;
          if (!activeLeaf || !winLeaves.includes(activeLeaf)) {
            try {
              this.app.workspace.setActiveLeaf(winLeaves[0], { focus: true });
            } catch {
              // Ignore focus error
            }
          }
        }

        if (typeof targetWin.focus === "function" && canActivatePopout) {
          try {
            targetWin.focus();
          } catch (e) {
            console.warn("Failed to focus target window:", e);
          }
        }
      }

      // 視窗已顯示：補載仍為空的 deferred view（file-explorer / search 等）。
      // leaf 層級路徑的 view 在視窗未顯示時建立會變成 DeferredView，需在
      // 視窗顯示後（containerEl 可見）重新 loadIfDeferred 才會載入真實內容。
      if (targetWin) {
        this.ensureDeferredViewsLoaded(targetWin);
      }

      WindowLayoutsModal.renderAllInstances();

      if (options.showNotifications !== false && this.plugin.settings.showNotifications !== false) {
        if (missingFiles.length > 0) {
          const missingList = missingFiles.slice(0, 3).join(", ") + (missingFiles.length > 3 ? "..." : "");
          new Notice(`⚠️ ${t("notifications.layoutRestored")}: ${layout.name} (${t("notifications.missingFilesNotice")}: ${missingList})`, 8000);
        } else {
          new Notice(`${t("notifications.layoutRestored")}: ${layout.name}`);
        }
      }
    } catch (error: unknown) {
      console.error("Failed to restore layout:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${t("errors.failedToRestore")}: ${message}`);
    } finally {
      this.isRestoringLayout = false;
    }
  }

  /**
   * 獲取所有保存的佈局 (按建立時間降序排列，最新儲存的在最上面)
   */
  getSavedLayouts(): WindowLayout[] {
    const settings: Partial<WindowSettings> = this.plugin.settings || {};
    const spaces = settings.spaces || [];

    return [...spaces].sort((a, b) => {
      const mode = settings.sortBy || "updated-desc";
      const getTimestamp = (l: WindowLayout, field: "updatedAt" | "createdAt") =>
        l[field] ?? l.timestamp ?? 0;

      switch (mode) {
        case "updated-desc":
          return getTimestamp(b, "updatedAt") - getTimestamp(a, "updatedAt");
        case "updated-asc":
          return getTimestamp(a, "updatedAt") - getTimestamp(b, "updatedAt");
        case "created-desc":
          return getTimestamp(b, "createdAt") - getTimestamp(a, "createdAt");
        case "created-asc":
          return getTimestamp(a, "createdAt") - getTimestamp(b, "createdAt");
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "", undefined, { sensitivity: "base" });
        default:
          return getTimestamp(b, "updatedAt") - getTimestamp(a, "updatedAt");
      }
    });
  }

  /**
   * 保存新佈局或覆蓋既有佈局
   */
  async saveLayout(layout: WindowLayout): Promise<void> {
    try {
      const settings = this.plugin.settings;
      if (!settings.spaces) {
        settings.spaces = [];
      }

      const now = Date.now();
      const existingIndex = settings.spaces.findIndex(
        (l) => l.name === layout.name
      );
      const isOverwrite = existingIndex >= 0;

      if (isOverwrite) {
        const existing = settings.spaces[existingIndex];
        layout.id = existing.id;
        layout.createdAt = existing.createdAt || existing.timestamp || now;
        layout.updatedAt = now;
        layout.timestamp = now;
        if (layout.includeGeometry === undefined && existing.includeGeometry !== undefined) {
          layout.includeGeometry = existing.includeGeometry;
        }
        if (layout.borderInset === undefined && existing.borderInset !== undefined) {
          layout.borderInset = existing.borderInset;
        }
        if (layout.showFoldedCorner === undefined && existing.showFoldedCorner !== undefined) {
          layout.showFoldedCorner = existing.showFoldedCorner;
        }
        if (layout.activityBars === undefined && existing.activityBars !== undefined) {
          layout.activityBars = existing.activityBars;
        }
        settings.spaces[existingIndex] = layout;
      } else {
        // 全新建立 (由 A 複製/改名另存為 B 時，重設 B 的 createdAt 為當時時間)
        layout.createdAt = now;
        layout.updatedAt = now;
        layout.timestamp = now;
        settings.spaces.push(layout);
      }

      await this.plugin.saveSettings();
      WindowLayoutsModal.renderAllInstances();

      const sourceWindow = this.getWindowForLayout(layout);
      this.setLayoutLabelForWindow(sourceWindow, layout.name);
      if (sourceWindow) {
        this.plugin.activityBars?.renderWindow(sourceWindow);
      } else {
        this.plugin.activityBars?.refreshAll();
      }

      if (this.plugin.settings.showNotifications !== false) {
        const noticeMsg = isOverwrite
          ? `${t("notifications.layoutOverwritten")}: ${layout.name}`
          : `${t("notifications.layoutSaved")}: ${layout.name}`;
        new Notice(noticeMsg);
      }
    } catch (error: unknown) {
      console.error("Failed to save layout:", error);
      throw new Error(t("errors.failedToSave"));
    }
  }

  /**
   * 刪除指定佈局
   */
  async deleteLayout(layoutId: string): Promise<void> {
    try {
      const settings = this.plugin.settings;
      const index = settings.spaces.findIndex((l) => l.id === layoutId);

      if (index >= 0) {
        const deletedLayout = settings.spaces[index];
        settings.spaces.splice(index, 1);
        await this.plugin.saveSettings();
        WindowLayoutsModal.renderAllInstances();

        if (this.plugin.settings.showNotifications !== false) {
          new Notice(
            `${t("notifications.layoutDeleted")}: ${deletedLayout.name}`
          );
        }
      }
    } catch (error: unknown) {
      console.error("Failed to delete layout:", error);
      throw new Error(t("errors.failedToDelete"));
    }
  }


  /**
   * 重命名 Section 名稱並同步更新所有帶有該標籤的 Space 與 sectionsOrder
   */
  async renameSection(oldName: string, newName: string): Promise<void> {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) return;

    const settings = this.plugin.settings;
    if (!settings.sectionsOrder) settings.sectionsOrder = [];

    // 1. 更新 sectionsOrder
    const orderIndex = settings.sectionsOrder.indexOf(cleanOld);
    if (orderIndex !== -1) {
      settings.sectionsOrder[orderIndex] = cleanNew;
    }

    // 2. 批量更新所有 Space 中的 sections 陣列
    (settings.spaces || []).forEach((space: WindowLayout) => {
      if (space.sections && Array.isArray(space.sections)) {
        const secIndex = space.sections.indexOf(cleanOld);
        if (secIndex !== -1) {
          space.sections[secIndex] = cleanNew;
          // 去重
          space.sections = Array.from(new Set(space.sections));
        }
      }
    });

    await this.plugin.saveSettings();
    WindowLayoutsModal.renderAllInstances();
  }

  /**
   * 切換指定 Space 的封存狀態
   */
  async toggleArchiveSpace(spaceId: string, archiveStatus?: boolean): Promise<void> {
    const settings = this.plugin.settings;
    const space = (settings.spaces || []).find((s) => s.id === spaceId);
    if (!space) return;

    const newStatus = archiveStatus !== undefined ? archiveStatus : !space.archived;
    space.archived = newStatus;

    await this.plugin.saveSettings();
    WindowLayoutsModal.renderAllInstances();

    if (this.plugin.settings.showNotifications !== false) {
      let noticeText = newStatus ? "Space archived" : "Space unarchived";
      try {
        noticeText = newStatus ? t("manageModal.archiveSuccess") : t("manageModal.unarchiveSuccess");
      } catch {
        // Fallback if i18n not initialized
      }
      new Notice(`${noticeText}: ${space.name}`);
    }
  }

  /**
   * 更新 Section 排序順序
   */
  async reorderSections(newOrder: string[]): Promise<void> {
    this.plugin.settings.sectionsOrder = newOrder;
    await this.plugin.saveSettings();
    WindowLayoutsModal.renderAllInstances();
  }

  /**
   * 獲取所有目前開啟中的活體 Popout DOM Window (按 Workspace 順序)
   */
  getLivePopoutWindows(): Window[] {
    const wins: Window[] = [];
    (this.app.workspace as ExtendedWorkspace).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      const win = extLeaf.containerEl?.ownerDocument?.defaultView;
      if (win && this.isPopoutDocument(win.document) && !wins.includes(win)) {
        wins.push(win);
      }
    });
    return wins;
  }

  /**
   * 獲取當前活發對應的 DOM Window (包含當前命令發起所在 Popout 視窗)
   */
  getActiveWindow(): Window {
    const activeLeaf = this.getActiveLeafForCurrentWindow();
    if (activeLeaf) {
      const extLeaf = activeLeaf as unknown as ExtendedWorkspaceLeaf;
      const ownerDocument = extLeaf.containerEl?.ownerDocument;
      if (ownerDocument?.defaultView) {
        return ownerDocument.defaultView;
      }
    }
    return typeof activeWindow !== "undefined" ? activeWindow : window;
  }

  /**
   * 獲取當前視窗狀態
   */
  private getCurrentWindowState(): WindowState {
    const activeLeaf = this.getActiveLeafForCurrentWindow();
    let currentWindow = typeof activeWindow !== "undefined" ? activeWindow : window;

    if (activeLeaf) {
      const extLeaf = activeLeaf as unknown as ExtendedWorkspaceLeaf;
      const ownerDocument = extLeaf.containerEl?.ownerDocument;
      if (ownerDocument?.defaultView) {
        currentWindow = ownerDocument.defaultView;
      }
    }

    return this.getWindowState(currentWindow);
  }

  /**
   * 使用 outer dimensions，與 Window.resizeTo() 的參數語意一致。
   * innerWidth/innerHeight 是內容區大小，不能直接拿來恢復整個視窗。
   */
  private getWindowState(targetWin: Window): WindowState {
    return {
      size: {
        width: targetWin.outerWidth || targetWin.innerWidth,
        height: targetWin.outerHeight || targetWin.innerHeight,
      },
      position:
        targetWin.screenX !== undefined
          ? {
              x: targetWin.screenX,
              y: targetWin.screenY,
            }
          : undefined,
    };
  }

  /**
   * 檢查當前活動上下文是否位於 Popout 視窗
   */
  private isCurrentlyInPopoutWindow(activeLeaf: WorkspaceLeaf | null): boolean {
    // 1. 檢查官方 API activeWindow (Obsidian 1.0+)
    if (typeof activeWindow !== "undefined" && activeWindow !== window) {
      return true;
    }

    // 2. 檢查 activeLeaf containerEl 所在 document
    if (activeLeaf && (activeLeaf as any).containerEl) {
      const doc = (activeLeaf as any).containerEl.ownerDocument;
      if (doc && doc.defaultView && doc.defaultView !== window) {
        return true;
      }
      if (doc && this.isPopoutDocument(doc)) {
        return true;
      }
    }

    // 3. 檢查目前 document 的 body class
    if (typeof document !== "undefined" && this.isPopoutDocument(document)) {
      return true;
    }

    return false;
  }

  /**
   * 檢查 floating 視窗佈局中是否包含開啟指定的檔案
   */
  private floatingLayoutContainsFile(layout: any, filePath: string): boolean {
    if (!layout) return false;

    if (layout.type === "leaf") {
      return layout.state?.state?.file === filePath;
    } else if (Array.isArray(layout.children)) {
      for (let child of layout.children) {
        if (this.floatingLayoutContainsFile(child, filePath)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 只提取當前活動視窗的浮動佈局資訊 (完美支援新開 Popout 視窗)
   */
  private extractCurrentFloatingLayout(fullLayout: any, activeLeaf: WorkspaceLeaf | null): any {
    const isPopout = this.isCurrentlyInPopoutWindow(activeLeaf);

    // 策略 A: 優先使用完整 workspace layout 中的 floating tree。
    // 這是 Obsidian 實際使用的 schema（split -> tabs -> leaf），比從
    // active leaf 的 root 取得的局部 layout 更可靠。
    const floatingWindows = this.getFloatingWindows(fullLayout);
    if (floatingWindows.length > 0) {
      // 1. 透過 activeLeafId 比對
      const activeLeafId = (activeLeaf as any)?.id || null;
      if (activeLeafId) {
        for (let floatingItem of floatingWindows) {
          if (this.floatingWindowContainsLeaf(floatingItem, activeLeafId)) {
            return floatingItem;
          }
        }
      }

      // 2. 透過檔案路徑比對
      const activeFilePath = (activeLeaf?.view as any)?.file?.path;
      if (activeFilePath) {
        for (let floatingItem of floatingWindows) {
          if (this.floatingLayoutContainsFile(floatingItem, activeFilePath)) {
            return floatingItem;
          }
        }
      }

      // 3. 傳回 floating 陣列中的第一個
      if (isPopout || floatingWindows.length === 1) {
        return floatingWindows[0];
      }
    }

    // 策略 B: 只有在完整 layout 無法辨識時，才向 activeLeaf 的獨立
    // root 取得 layout。
    if (activeLeaf && typeof (activeLeaf as any).getRoot === "function") {
      const root = (activeLeaf as any).getRoot();
      if (root && typeof root.getLayout === "function") {
        const ws = this.app.workspace as any;
        if (root !== ws.rootSplit && root !== ws.leftSplit && root !== ws.rightSplit) {
          const rootLayout = root.getLayout();
          if (rootLayout) return rootLayout;
        }
      }
    }

    // 策略 C: 只要確認當前確實在 Popout 視窗內 (isPopout = true)
    if (isPopout && activeLeaf) {
      const viewState = typeof (activeLeaf as any).getViewState === "function" 
        ? (activeLeaf as any).getViewState() 
        : { type: activeLeaf.view?.getViewType() || "empty", state: {} };

      return {
        id: (activeLeaf as any).id || this.generateId(),
        type: "leaf",
        state: viewState,
      };
    }

    return null;
  }

  /** 取得 Obsidian floating container 內的實際 WorkspaceWindow 陣列。 */
  private getFloatingWindows(layout: any): any[] {
    const floating = layout?.floating;
    if (Array.isArray(floating)) return floating;
    if (floating?.type === "floating" && Array.isArray(floating.children)) {
      return floating.children;
    }
    return [];
  }

  /**
   * 以 live leaf 的 WorkspaceWindow root ID 精確定位 floating index。
   * Leaf ID 可能在多個 restored layout 中重複，因此只接受唯一 leaf 匹配。
   */
  private findFloatingWindowIndexForWindow(
    targetWin: Window,
    floatingWindows: any[]
  ): number {
    const windowLeaves = this.getLeavesForWindow(targetWin);

    for (const leaf of windowLeaves) {
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      const root = typeof extLeaf.getRoot === "function"
        ? (extLeaf.getRoot() as WorkspaceItem | null)
        : null;
      const rootLayout = root && typeof (root as { getLayout?: () => WorkspaceItem }).getLayout === "function"
        ? (root as { getLayout: () => WorkspaceItem }).getLayout()
        : null;
      const rootIds = new Set(
        [root?.id, rootLayout?.id].filter((id): id is string => !!id)
      );
      if (rootIds.size === 0) continue;

      const index = floatingWindows.findIndex((floatingWindow) =>
        rootIds.has(floatingWindow?.id)
      );
      if (index >= 0) return index;
    }

    const matchingIndices = new Set<number>();
    windowLeaves.forEach((leaf) => {
      const leafId = (leaf as any).id;
      if (!leafId) return;
      floatingWindows.forEach((floatingWindow, index) => {
        if (this.floatingWindowContainsLeaf(floatingWindow, leafId)) {
          matchingIndices.add(index);
        }
      });
    });

    return matchingIndices.size === 1
      ? Array.from(matchingIndices)[0]
      : this.findPopoutOrdinal(targetWin, floatingWindows.length);
  }

  /**
   * 以 live WorkspaceWindow container 的順序對應 serialized floating children。
   * Obsidian 公開 API 不保證 WorkspaceWindow 帶有 serialized window ID。
   */
  private findPopoutOrdinal(targetWin: Window, floatingCount: number): number {
    const workspace = this.app.workspace as any;
    const floatingChildren =
      workspace.floatingSplit?.children ||
      workspace.floating?.children ||
      [];

    if (Array.isArray(floatingChildren)) {
      const directIndex = floatingChildren.findIndex((container: any) =>
        container?.win === targetWin || container?.doc?.defaultView === targetWin
      );
      if (directIndex >= 0 && directIndex < floatingCount) {
        return directIndex;
      }
    }

    const livePopoutWindows: Window[] = [];
    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const container = typeof (leaf as any).getContainer === "function"
        ? (leaf as any).getContainer()
        : null;
      const leafWindow = container?.win || this.getWindowForLeaf(leaf);
      if (
        leafWindow &&
        this.isPopoutDocument(leafWindow.document) &&
        !livePopoutWindows.includes(leafWindow)
      ) {
        livePopoutWindows.push(leafWindow);
      }
    });

    const ordinal = livePopoutWindows.indexOf(targetWin);
    return ordinal >= 0 && ordinal < floatingCount ? ordinal : -1;
  }

  /**
   * 以目前 WorkspaceWindow 的 id/容器為基礎，只替換其 children。
   * Obsidian 1.12 的 layout schema 是 floating -> window -> split/tabs/leaf。
   */
  /**
   * 以 windowState（screenX/screenY、outerWidth/outerHeight）覆寫 floating
   * window 節點的序列化幾何，統一 changeLayout 建立視窗時使用的座標來源，
   * 避免 Obsidian 序列化幾何與 screen 座標不一致造成 restore 後的位移。
   */
  private applyWindowStateGeometry(
    node: Record<string, unknown> | null | undefined,
    windowState: WindowState | null | undefined
  ): void {
    if (!node || !windowState) return;
    const size = windowState.size;
    if (size && size.width > 0 && size.height > 0) {
      node.width = size.width;
      node.height = size.height;
    }
    if (windowState.position) {
      node.x = windowState.position.x;
      node.y = windowState.position.y;
    }
  }

  /**
   * 取得實際的根結構節點。保留 window/floating 包裝：多 child 的 window
   * （如 Professional：tabs + tabs + split）也可由 leaf 層級重建，是否可行
   * 交由 isSimpleLayoutStructure 遞迴判定。
   */
  private extractLayoutRootNode(layout: any): any {
    return layout ?? null;
  }

  /**
   * 判斷 layout 結構是否可用 leaf 層級 API 重建：
   * - leaf / tabs：可。
   * - split：children 皆為 tabs/leaf（無巢狀 split）。
   * - window / floating：children 皆為 tabs/leaf/split，且其中的 split
   *   本身無巢狀。
   * 其餘（巢狀 split、未知節點）一律回傳 false，交由全域 changeLayout fallback。
   */
  private isSimpleLayoutStructure(node: any, parentDirection?: string): boolean {
    if (!node) return false;
    if (node.type === "leaf" || node.type === "tabs") return true;
    if (node.type === "split") {
      if (!Array.isArray(node.children) || node.children.length === 0) return false;
      // 方向與父 split 相同時，createLeafBySplit 會扁平插入（無法包出巢狀
      // split），先序/佔位演算法都無法精確重建 → fallback。
      if (parentDirection && node.direction === parentDirection) return false;
      // 不支援 split 內再套 split（更深巢狀）
      for (const child of node.children) {
        if (!child) return false;
        if (child.type !== "tabs" && child.type !== "leaf") return false;
      }
      return true;
    }
    if (node.type === "window" || node.type === "floating") {
      if (!Array.isArray(node.children) || node.children.length === 0) return false;
      const dir = node.direction || "vertical";
      for (const child of node.children) {
        if (!child) return false;
        if (child.type === "split") {
          if (!this.isSimpleLayoutStructure(child, dir)) return false;
        } else if (child.type !== "tabs" && child.type !== "leaf") {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  /**
   * 在目標視窗內以 leaf 層級 API 重建結構（不觸發全域 changeLayout）。
   *
   * 使用「兩階段」演算法以正確支援單層巢狀 split（如 FET-Migration 的
   * window > [hSplit, tabs, tabs]）：
   * 1. 階段一：先為頂層每個單位建立「佔位 leaf」（同一層級，依序
   *    createLeafBySplit），確保外層分割結構完整。
   * 2. 階段二：逐個單位填充——tabs/leaf 直接填 leaf；split 則以其佔位
   *    leaf 為錨點遞迴展開（此時錨點位於外層正確層級，createLeafBySplit
   *    建立的新 split 會正確替換佔位位置）。
   *
   * 回傳依建立順序（= saved 樹先序）的 leaf 清單，供後續 openFile 配對。
   */
  private async buildSimpleWindowStructure(
    targetWin: Window,
    rootNode: any
  ): Promise<WorkspaceLeaf[]> {
    const workspace = this.app.workspace as unknown as ExtendedWorkspace;
    const initialLeaves = this.getLeavesForWindow(targetWin);
    const built: WorkspaceLeaf[] = [];

    const fillTabs = async (leaf: WorkspaceLeaf, node: any): Promise<WorkspaceLeaf> => {
      // 把 tabs/leaf 節點的 leaf 依序填入 leaf 所在的 tabs 群組，回傳最後 leaf
      const leafNodes =
        node.type === "leaf"
          ? [node]
          : Array.isArray(node.children)
            ? node.children.filter((c: any) => c?.type === "leaf")
            : [];
      const groupLeaves: WorkspaceLeaf[] = [];
      let last: WorkspaceLeaf = leaf;
      for (let i = 0; i < leafNodes.length; i++) {
        if (i > 0) {
          const parent = (last as unknown as ExtendedWorkspaceLeaf).parent;
          if (!parent) break;
          last = workspace.createLeafInParent(
            parent as unknown as Parameters<typeof workspace.createLeafInParent>[0],
            -1
          );
        }
        await this.applyBuiltLeafState(last, leafNodes[i]);
        groupLeaves.push(last);
        built.push(last);
      }
      // 恢復 saved layout 的 currentTab（該 tab group 保存時選中的 tab）。
      // leaf 層級重建預設會把 group 的 active tab 落在建立順序的預設值，
      // 造成「第一個 column 的第一個 tab 被特別 active、原本選中的 tab
      // lost active」；其他 split 的 tab group 同理一併恢復。
      if (node.type === "tabs" && typeof node.currentTab === "number" && groupLeaves.length > 0) {
        const activeIndex = Math.max(0, Math.min(node.currentTab, groupLeaves.length - 1));
        const groupActive = groupLeaves[activeIndex];
        if (groupActive) {
          try {
            await workspace.revealLeaf(groupActive);
            workspace.setActiveLeaf(groupActive, { focus: false });
          } catch {
            // Ignore focus/activation error during structure build
          }
        }
      }
      return last;
    };

    const expandSplit = async (
      node: any,
      direction: string,
      placeholderLeaf: WorkspaceLeaf
    ): Promise<WorkspaceLeaf> => {
      // 在佔位 leaf 位置展開 split：children 依序建立；方向不同時
      // createLeafBySplit 會建立新 split 替換佔位位置（isSimpleLayoutStructure
      // 已保證每個 split 方向與其父不同，因此必然成立）。
      let anchor: WorkspaceLeaf = placeholderLeaf;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (i > 0) {
          anchor = workspace.createLeafBySplit(
            anchor,
            direction === "horizontal" ? "horizontal" : "vertical"
          );
        }
        anchor = await fillTabs(anchor, child);
      }
      return anchor;
    };

    const isContainer = rootNode?.type === "window" || rootNode?.type === "floating";
    const topDirection = isContainer ? rootNode.direction || "vertical" : "vertical";
    const topUnits: any[] = isContainer ? rootNode.children || [] : [rootNode];

    // 階段一：建立頂層佔位 leaf（同層級依序分割）
    const placeholders: WorkspaceLeaf[] = [];
    let anchor: WorkspaceLeaf | null = initialLeaves[0] || null;
    for (let i = 0; i < topUnits.length; i++) {
      if (i > 0) {
        if (!anchor) break;
        try {
          anchor = workspace.createLeafBySplit(anchor, topDirection);
        } catch (e) {
          console.warn("Failed to split leaf during restore:", e);
          break;
        }
      }
      if (!anchor) break;
      placeholders.push(anchor);
    }

    // 階段二：填充 / 展開每個頂層單位
    for (let i = 0; i < topUnits.length && i < placeholders.length; i++) {
      const unit = topUnits[i];
      const placeholder = placeholders[i];
      if (unit?.type === "split") {
        await expandSplit(unit, unit.direction, placeholder);
      } else {
        await fillTabs(placeholder, unit);
      }
    }

    // 結構建立完成後，立即依 saved dimension 套用 flex-grow 權重
    // （與 Obsidian 原生 setDimension 語意一致）。createLeafBySplit 建立
    // 時每個分割都是 50/50 均分；此處用 saved 的 0~100 權重覆寫，讓視窗
    // 第一幀即為正確比例，restore 完成後不再需要 activityBar 以 flex-basis
    // 覆寫（避免兩階段跳動）。
    this.applySavedSplitDimensions(targetWin, rootNode);

    return built;
  }

  /**
   * 依 saved layout 的 dimension（Obsidian flex-grow 權重，0~100）遞迴
   * 套用 split 比例。與 Obsidian 原生 `setDimension` 語意一致：
   * - flex-grow 權重在容器縮放時自動重新分配；
   * - display:none 隱藏側欄時，剩餘欄位自動填滿（不需 rebalance）。
   */
  private applySavedSplitDimensions(win: Window, rootNode: any): void {
    if (!win || win.closed || !rootNode) return;
    const rootEl = win.document?.querySelector<HTMLElement>(".workspace-split.mod-root");
    if (!rootEl) return;

    // 建立 containerEl → Obsidian WorkspaceItem 對應，以便用 setDimension()
    // 同時寫入 dimension 屬性（Obsidian serialize 會保存）與 flex-grow
    // （視覺比例）。只設 CSS flex-grow 會讓「restore 後重新儲存」時
    // dimension 丟失（Obsidian serialize 讀的是物件的 dimension 屬性）。
    const elToItem = new Map<HTMLElement, { setDimension?: (v: number) => void }>();
    try {
      (this.app.workspace as unknown as {
        iterateAllLeaves: (cb: (leaf: any) => void) => void;
      }).iterateAllLeaves((leaf: any) => {
        if (!leaf || this.getWindowForLeaf(leaf) !== win) return;
        let item: any = leaf.parent;
        let guard = 0;
        while (item && guard++ < 20) {
          const itemEl = (item as { containerEl?: HTMLElement }).containerEl;
          if (itemEl instanceof HTMLElement && !elToItem.has(itemEl)) {
            elToItem.set(itemEl, item);
          }
          item = item.parent;
        }
      });
    } catch {
      // iterateAllLeaves 失敗時退回首選（僅 CSS）
    }

    const getSplitChildren = (el: HTMLElement): HTMLElement[] =>
      Array.from(el.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          (child.classList.contains("workspace-tabs") ||
            child.classList.contains("workspace-split"))
      );

    const setFlexGrow = (domEl: HTMLElement, dimension: number): void => {
      // 優先走 Obsidian setDimension：寫入 dimension 屬性 + flex-grow，
      // restore 後重新儲存時比例才不會丟失。
      const item = elToItem.get(domEl);
      if (item && typeof item.setDimension === "function") {
        // Obsidian setDimension 對 <=0 或 >=100 的值會設成 null（清除），
        // 因此僅在 (0,100) 區間使用；100 走純 CSS 避免被清除。
        if (dimension > 0 && dimension < 100) {
          item.setDimension(dimension);
          return;
        }
      }
      // fallback：僅設 CSS flex-grow（setCssProps 需 kebab-case key）
      const customEl = domEl as unknown as {
        setCssProps?: (props: Record<string, string>) => void;
      };
      const flexGrow = String(dimension);
      if (typeof customEl.setCssProps === "function") {
        customEl.setCssProps({ "flex-grow": flexGrow });
      } else {
        domEl.style.setProperty("flex-grow", flexGrow);
      }
    };

    const applyNode = (node: any, domEl: HTMLElement | null | undefined): void => {
      if (!node || !domEl) return;
      const dimension = Number(node.dimension);
      if (Number.isFinite(dimension) && dimension > 0 && dimension <= 100) {
        setFlexGrow(domEl, dimension);
      }
      if (node.type === "split" && Array.isArray(node.children)) {
        const domChildren = getSplitChildren(domEl);
        node.children.forEach((child: any, index: number) => {
          applyNode(child, domChildren[index]);
        });
      }
    };

    // window/floating 包裝：其 children 對應 rootEl 的頂層欄位
    if (rootNode.type === "window" || rootNode.type === "floating") {
      const domChildren = getSplitChildren(rootEl);
      (Array.isArray(rootNode.children) ? rootNode.children : []).forEach(
        (child: any, index: number) => {
          applyNode(child, domChildren[index]);
        }
      );
    } else {
      applyNode(rootNode, rootEl);
    }
  }

  /**
   * 為 leaf 層級建立的 leaf 設定 view state。
   * 檔案 leaf 交由 restoreFileStatesForWindow 的 openFile 處理（此處跳過）；
   * 非檔案 leaf 在此先建立 view，讓後續的 ensureViewRenderedWithRetries 能渲染。
   */
  private async applyBuiltLeafState(leaf: WorkspaceLeaf, node: any): Promise<void> {
    if (!leaf || !node) return;
    const filePath = this.getFilePathFromLeafState({
      type: node.type,
      state: (node.state as { state?: Record<string, unknown> } | undefined)?.state || {},
    });
    if (filePath) return;

    const nodeState = (node.state as { type?: string; state?: Record<string, unknown> } | undefined) || {};
    await leaf.setViewState({
      type: nodeState.type || node.type || "empty",
      active: false,
      state: nodeState.state || {},
    });

    // 核心 view（file-explorer / search / outline 等）是 deferred view：
    // setViewState 只建立 tab 標題，內容需 loadIfDeferred() 才會載入。
    // 未載入時 content area 會是空的（先前 changeLayout 路徑由 Obsidian
    // 的 setLayout 自動 load；leaf 層級路徑需自行處理）。
    const extLeaf = leaf as unknown as { isDeferred?: boolean; loadIfDeferred?: () => Promise<void> };
    if (extLeaf.isDeferred && typeof extLeaf.loadIfDeferred === "function") {
      try {
        await extLeaf.loadIfDeferred();
      } catch (e) {
        console.warn("Failed to load deferred view during restore:", e);
      }
    }
  }

  /**
   * leaf 層級建立後，依 saved 順序套用 pinned 狀態
   * （檔案 leaf 需於 openFile 之後才 toggle，避免 openFile 重置）。
   */
  private applyPinnedStateToBuiltLeaves(built: WorkspaceLeaf[], saved: ViewState[]): void {
    built.forEach((leaf, i) => {
      const savedLeaf = saved[i];
      if (!savedLeaf || savedLeaf.pinned !== true) return;
      const extLeaf = leaf as unknown as {
        togglePinned?: () => void;
        getViewState?: () => { pinned?: boolean };
      };
      const isPinned = extLeaf.getViewState?.()?.pinned === true;
      if (!isPinned && typeof extLeaf.togglePinned === "function") {
        try {
          extLeaf.togglePinned();
        } catch {
          // Ignore pinned toggle error
        }
      }
    });
  }

  private prepareFloatingWindowForRestore(
    savedLayout: any,
    currentWindow: any,
    includeGeometry = true,
    windowState?: WindowState | null
  ): any {
    const saved = JSON.parse(JSON.stringify(savedLayout));

    if (currentWindow?.type === "window") {
      if (saved.type === "window") {
        const merged = {
          ...currentWindow,
          ...saved,
          id: currentWindow.id,
          children: Array.isArray(saved.children)
            ? saved.children.map((child: any) => this.normalizeFloatingLayout(child))
            : [],
        };

        if (includeGeometry === false) {
          delete merged.x;
          delete merged.y;
          delete merged.width;
          delete merged.height;
          delete merged.dimension;
          delete merged.zoom;
          delete merged.isMaximized;
          delete merged.isFullScreen;
        } else {
          this.applyWindowStateGeometry(merged, windowState);
        }

        return merged;
      }

      const res = {
        ...currentWindow,
        children: [this.normalizeFloatingLayout(saved)],
      };

      if (includeGeometry === false) {
        delete res.x;
        delete res.y;
        delete res.width;
        delete res.height;
        delete res.dimension;
        delete res.zoom;
        delete res.isMaximized;
        delete res.isFullScreen;
      } else {
        this.applyWindowStateGeometry(res, windowState);
      }

      return res;
    }

    if (includeGeometry === false && saved?.type === "window") {
      delete saved.x;
      delete saved.y;
      delete saved.width;
      delete saved.height;
      delete saved.dimension;
      delete saved.zoom;
      delete saved.isMaximized;
      delete saved.isFullScreen;
    } else if (saved?.type === "window") {
      this.applyWindowStateGeometry(saved, windowState);
    }

    return saved.type === "window" ? saved : this.normalizeFloatingLayout(saved);
  }

  private normalizeFloatingLayout(layout: any): any {
    if (!layout) return layout;

    if (layout.type === "leaf") {
      return {
        type: "split",
        id: layout.id || this.generateId(),
        direction: "vertical",
        children: [{
          type: "tabs",
          id: this.generateId(),
          children: [JSON.parse(JSON.stringify(layout))],
        }],
      };
    }

    if (layout.type === "tabs") {
      return {
        ...layout,
        children: Array.isArray(layout.children)
          ? layout.children.map((child: any) => JSON.parse(JSON.stringify(child)))
          : [],
      };
    }

    if (layout.type === "window" || layout.type === "floating") {
      return {
        ...layout,
        children: Array.isArray(layout.children)
          ? layout.children.map((child: any) => this.normalizeFloatingLayout(child))
          : [],
      };
    }

    if (layout.type === "split") {
      return {
        ...layout,
        children: Array.isArray(layout.children)
          ? layout.children.map((child: any) => {
              if (child?.type === "leaf") {
                return {
                  type: "tabs",
                  id: this.generateId(),
                  children: [JSON.parse(JSON.stringify(child))],
                };
              }
              return this.normalizeFloatingLayout(child);
            })
          : [],
      };
    }

    return JSON.parse(JSON.stringify(layout));
  }

  /**
   * 檢查 floating 視窗是否包含指定的 leaf
   */
  private floatingWindowContainsLeaf(layout: any, leafId: string): boolean {
    if (!layout) return false;

    if (layout.type === "leaf") {
      return layout.id === leafId;
    } else if (Array.isArray(layout.children)) {
      for (let child of layout.children) {
        if (this.floatingWindowContainsLeaf(child, leafId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 從佈局數據中提取 leaf 信息
   */
  private extractLeavesFromLayout(
    layout: any,
    leaves: ViewState[] = []
  ): ViewState[] {
    if (!layout) return leaves;

    if (layout.type === "leaf") {
      leaves.push({
        id: layout.id || this.generateId(),
        type: layout.state?.type || "unknown",
        state: layout.state?.state || {},
        pinned: layout.pinned === true || layout.state?.pinned === true,
      });
    } else if (Array.isArray(layout.children)) {
      layout.children.forEach((child: any) => {
        this.extractLeavesFromLayout(child, leaves);
      });
    }
    return leaves;
  }

  /**
   * 嘗試從 FolderSpaces View 提取資料夾名稱 (最高優先級)
   */
  public getFolderSpaceNameFromLeaf(leaf: ViewState): string | null {
    if (!leaf) return null;
    const typeStr = leaf.type ? String(leaf.type).toLowerCase() : "";
    const isFolderSpaceView =
      typeStr === "folder-space-explorer" ||
      typeStr === "folder-space" ||
      typeStr === "folder-spaces" ||
      typeStr.includes("folder-space") ||
      typeStr.includes("folderspace");

    const stateObj = leaf.state as Record<string, unknown> | undefined;
    if (!stateObj && !isFolderSpaceView) return null;

    let rawFolderPath: string | null = null;

    if (typeof stateObj?.folder === "string") {
      rawFolderPath = stateObj.folder;
    } else if (typeof stateObj?.folderPath === "string") {
      rawFolderPath = stateObj.folderPath;
    } else if (typeof stateObj?.path === "string" && (isFolderSpaceView || !stateObj.file)) {
      rawFolderPath = stateObj.path;
    } else if (stateObj?.state && typeof stateObj.state === "object") {
      const innerState = stateObj.state as Record<string, unknown>;
      if (typeof innerState.folder === "string") {
        rawFolderPath = innerState.folder;
      } else if (typeof innerState.folderPath === "string") {
        rawFolderPath = innerState.folderPath;
      } else if (typeof innerState.path === "string" && (isFolderSpaceView || !innerState.file)) {
        rawFolderPath = innerState.path;
      }
    }

    if (!rawFolderPath && !isFolderSpaceView) return null;

    if (!rawFolderPath || rawFolderPath === "/" || rawFolderPath === ".") {
      return this.app.vault.getName();
    }

    const normalized = rawFolderPath.replace(/\\/g, "/").replace(/\/+$/, "");
    const lastFolder = normalized.split("/").pop() || normalized;
    return lastFolder.trim() || this.app.vault.getName();
  }

  /**
   * 根據 Folder Space Explorer、Pinned 檔案、Active 檔案與數量自動產生智慧佈局名稱 (UX-006)
   */
  generateSmartLayoutName(layout: WindowLayout): string {
    const leaves = this.getSavedViewStates(layout);

    // 最高優先級：若包含 Folder Space Explorer，取第一個 Folder Space Explorer 的資料夾名稱
    for (const leaf of leaves) {
      const folderSpaceName = this.getFolderSpaceNameFromLeaf(leaf);
      if (folderSpaceName) {
        return folderSpaceName;
      }
    }

    const activeFile = layout.workspace?.activeFile;

    const pinnedFileNames: string[] = [];
    const activeFileName: string[] = [];
    const otherFileNames: string[] = [];

    const getBaseName = (path: string): string => {
      const name = path.split("/").pop() || path;
      return name.endsWith(".md") ? name.slice(0, -3) : name;
    };

    leaves.forEach((leaf) => {
      const filePath = this.getFilePathFromLeafState(leaf);
      if (!filePath) return;

      const baseName = getBaseName(filePath);
      if (leaf.pinned) {
        if (!pinnedFileNames.includes(baseName)) {
          pinnedFileNames.push(baseName);
        }
      } else if (activeFile && filePath === activeFile) {
        if (!activeFileName.includes(baseName)) {
          activeFileName.push(baseName);
        }
      } else {
        if (!otherFileNames.includes(baseName)) {
          otherFileNames.push(baseName);
        }
      }
    });

    // 優先順序：Pinned 檔名 -> Active 檔名 -> 其他檔名
    const orderedNames: string[] = [];
    pinnedFileNames.forEach((n) => {
      if (!orderedNames.includes(n)) orderedNames.push(n);
    });
    activeFileName.forEach((n) => {
      if (!orderedNames.includes(n)) orderedNames.push(n);
    });
    otherFileNames.forEach((n) => {
      if (!orderedNames.includes(n)) orderedNames.push(n);
    });

    if (orderedNames.length === 0) {
      const now = new Date(layout.timestamp || Date.now());
      const i18n = getI18n();
      return `${t("saveModal.title")} ${i18n.formatDate(now)}`;
    }

    let generatedName = "";
    if (orderedNames.length === 1) {
      generatedName = orderedNames[0];
    } else if (orderedNames.length === 2) {
      generatedName = `${orderedNames[0]} & ${orderedNames[1]}`;
    } else {
      generatedName = `${orderedNames[0]}, ${orderedNames[1]} ${t("saveModal.andOthers")}`;
    }

    if (generatedName.length > 55) {
      generatedName = generatedName.slice(0, 52) + "...";
    }

    return generatedName;
  }

  /**
   * 取得保存的所有 leaf 狀態。以 layout tree 為主，並補上舊版本資料
   * 中可能存在但未被寫入 layout tree 的 workspace.leaves。
   */
  public getSavedViewStates(layout: WindowLayout): ViewState[] {
    const fromLayout = this.extractLeavesFromLayout(layout.workspace?.layout);
    const explicitLeaves = Array.isArray(layout.workspace?.leaves)
      ? layout.workspace.leaves
      : [];
    const explicitById = new Map(explicitLeaves.map((leaf) => [leaf.id, leaf]));

    const result = fromLayout.map((leaf) => {
      const explicit = explicitById.get(leaf.id);
      if (!explicit) return leaf;
      return {
        ...leaf,
        type: explicit.type || leaf.type,
        state: { ...leaf.state, ...explicit.state },
      };
    });

    const resultIds = new Set(result.map((leaf) => leaf.id));
    explicitLeaves.forEach((leaf) => {
      if (!resultIds.has(leaf.id)) result.push(leaf);
    });
    return result;
  }

  /**
   * 計算開啟的文件數量
   */
  private countOpenFiles(leaves: ViewState[]): number {
    return leaves.filter((leaf) => leaf.state.file).length;
  }

  public getFilePathFromLeafState(leafState: unknown): string | null {
    if (!leafState) return null;
    if (typeof leafState === "string") return leafState;
    const stateObj = leafState as { file?: unknown; state?: { file?: unknown; state?: { file?: unknown } } };
    if (typeof stateObj.state?.file === "string") return stateObj.state.file;
    if (typeof stateObj.state?.state?.file === "string") return stateObj.state.state.file;
    if (typeof stateObj.file === "string") return stateObj.file;
    return null;
  }

  /**
   * 恢復檔案狀態 (在對應現有分頁中安全開立檔案，尊重原生 Layout)
   */
  private async restoreFileStatesForWindow(
    targetWin: Window | null,
    leaves: ViewState[],
    activeFilePath?: string
  ): Promise<string[]> {
    const currentWin = targetWin || (typeof activeWindow !== "undefined" ? activeWindow : window);
    const windowLeaves = await this.waitForWindowLeaves(currentWin, leaves.length);
    const leavesById = new Map<string, WorkspaceLeaf>();
    windowLeaves.forEach((leaf) => {
      const id = (leaf as any).id;
      if (id) leavesById.set(id, leaf);
    });

    const missingFiles: string[] = [];
    let targetActiveLeaf: WorkspaceLeaf | null = null;
    const totalFiles = leaves.filter((l) => !!this.getFilePathFromLeafState(l)).length;

    let progressNotice: Notice | null = null;
    if (totalFiles > 1 && this.plugin.settings.showNotifications !== false) {
      progressNotice = new Notice(`🔄 ${t("restoreModal.restoringLayout")}... (0/${totalFiles})`, 0);
    }

    let processedCount = 0;
    const activeLeafForWindow = this.getActiveLeafForCurrentWindow(currentWin);

    for (let i = 0; i < leaves.length; i++) {
      const leafState = leaves[i];
      const filePath = this.getFilePathFromLeafState(leafState);

      if (!filePath) {
        // 非檔案 leaf（file-explorer / search / tag / outline / bookmarks 等）：
        // changeLayout 建立 leaf 後部分核心側欄 view 內容不會自動渲染（僅顯示 tab 標題）。
        // 以「已渲染 flag」檢查 + 延遲重試強制重新渲染。
        const targetLeaf = leavesById.get(leafState.id) ||
          (i < windowLeaves.length ? windowLeaves[i] : null);
        if (targetLeaf && targetLeaf !== activeLeafForWindow) {
          this.ensureViewRenderedWithRetries(currentWin, targetLeaf);
        }
        continue;
      }

      processedCount++;
      if (progressNotice) {
        progressNotice.setMessage(`🔄 ${t("restoreModal.restoringLayout")}... (${processedCount}/${totalFiles})`);
      }

      let targetLeaf: WorkspaceLeaf | null = leavesById.get(leafState.id) || null;
      if (i < windowLeaves.length && !targetLeaf) targetLeaf = windowLeaves[i];

      // 若該視窗現有分頁數少於所需分頁，自動為其切割建立新分頁容器
      if (!targetLeaf && windowLeaves.length > 0) {
        try {
          const baseLeaf = windowLeaves[windowLeaves.length - 1];
          targetLeaf = (this.app.workspace as any).createLeafBySplit(baseLeaf, "vertical");
          if (targetLeaf) windowLeaves.push(targetLeaf);
        } catch (e) {
          console.warn("Failed to create leaf by split for target window:", e);
        }
      }

      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file instanceof TFile) {
        if (targetLeaf) {
          const stateObj = leafState.state as { mode?: string; state?: { mode?: string } } | undefined;
          const viewMode = stateObj?.mode || stateObj?.state?.mode;
          const openOptions: any = { active: false };
          if (viewMode) {
            openOptions.state = { mode: viewMode };
          }
          await targetLeaf.openFile(file, openOptions);

          if (activeFilePath && filePath === activeFilePath) {
            targetActiveLeaf = targetLeaf;
          }
        }
      } else {
        const fileName = filePath.split("/").pop() || filePath;
        missingFiles.push(fileName);

        if (targetLeaf && typeof (targetLeaf as any).setViewState === "function") {
          try {
            await (targetLeaf as any).setViewState({ type: "empty" });
          } catch (e) {
            console.warn("Failed to set empty view state:", e);
          }
        }
      }
    }

    if (progressNotice) {
      progressNotice.hide();
    }

    const leafToFocus = targetActiveLeaf || null;
    if (leafToFocus) {
      try {
        await this.app.workspace.revealLeaf(leafToFocus);
        this.app.workspace.setActiveLeaf(leafToFocus, { focus: true });
        if ((leafToFocus as any)?.containerEl && typeof (leafToFocus as any).containerEl.focus === "function") {
          (leafToFocus as any).containerEl.focus();
        }
      } catch (e) {
        console.warn("Failed to set active leaf:", e);
      }
    } else {
      // 無 activeFile 時不要 fallback 到 windowLeaves[0]：leaf 層級重建
      // （fillTabs 已恢復各 tab group 的 currentTab）或 changeLayout 已把
      // active 指到視窗內的 leaf。此處只在 active 完全未指向此視窗時才補指，
      // 避免把第一個 column 的第一個 tab 搶成 active（原本選中的 tab lost active）。
      const currentActive = typeof this.app.workspace.getMostRecentLeaf === "function"
        ? this.app.workspace.getMostRecentLeaf()
        : (this.app.workspace as ExtendedWorkspace).activeLeaf;
      if (!currentActive || !windowLeaves.includes(currentActive)) {
        const fallbackLeaf = windowLeaves[0] || null;
        if (fallbackLeaf) {
          try {
            await this.app.workspace.revealLeaf(fallbackLeaf);
            this.app.workspace.setActiveLeaf(fallbackLeaf, { focus: true });
          } catch (e) {
            console.warn("Failed to set active leaf:", e);
          }
        }
      }
    }

    return missingFiles;
  }

  /** 等待 changeLayout 完成 leaf 建立，避免只對第一個已建立的 leaf 開檔。 */
  private async waitForWindowLeaves(targetWin: Window, expectedCount: number): Promise<WorkspaceLeaf[]> {
    let leaves = this.getLeavesForWindow(targetWin);
    for (let attempt = 0; attempt < 20 && leaves.length < expectedCount; attempt++) {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
      leaves = this.getLeavesForWindow(targetWin);
    }
    return leaves;
  }

  /** 取得 leaf 所屬的 DOM Window。 */
  private getWindowForLeaf(leaf: WorkspaceLeaf | null): Window | null {
    return (leaf as any)?.containerEl?.ownerDocument?.defaultView || null;
  }

  /** 根據保存的 leaf 集合辨識還原後的目標視窗。 */
  private findWindowForSavedLeaves(
    leaves: ViewState[],
    excludedWindow?: Window,
    preferredWindow?: Window | null,
    claimedWindows: Set<Window> = new Set(),
    requirePositiveScore = false
  ): Window | null {
    if (leaves.length === 0) return null;

    const savedIds = new Set(leaves.map((leaf) => leaf.id));
    const savedFiles = new Set(
      leaves
        .map((leaf) => this.getFilePathFromLeafState(leaf))
        .filter((filePath): filePath is string => !!filePath)
    );
    const windows = new Map<Window, number>();
    // 追蹤各視窗的 leaf-id 命中數與被命中的 saved 檔案集合（供覆蓋率門檻使用），
    // 避免只靠通用檔名（如多個 space 共用的 Untitled.md）造成誤匹配。
    const idMatches = new Map<Window, number>();
    const matchedSavedFiles = new Map<Window, Set<string>>();
    let bestWindow: Window | null = null;
    let bestScore = 0;

    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const targetWindow = this.getWindowForLeaf(leaf);
      if (
        !targetWindow ||
        targetWindow === excludedWindow ||
        claimedWindows.has(targetWindow) ||
        !this.isPopoutDocument(targetWindow.document)
      ) return;

      const viewState = typeof (leaf as any).getViewState === "function"
        ? (leaf as any).getViewState()
        : null;
      const filePath = this.getFilePathFromLeafState({
        state: viewState?.state || {},
      });
      const idHit = savedIds.has((leaf as any).id) ? 1 : 0;
      const fileHit = filePath && savedFiles.has(filePath) ? 1 : 0;
      const score = (windows.get(targetWindow) || 0) +
        (idHit ? 100 : 0) +
        (fileHit ? 10 : 0);
      windows.set(targetWindow, score);
      idMatches.set(targetWindow, (idMatches.get(targetWindow) || 0) + idHit);
      if (fileHit) {
        const set = matchedSavedFiles.get(targetWindow) || new Set<string>();
        set.add(filePath);
        matchedSavedFiles.set(targetWindow, set);
      }
      if (score > bestScore) {
        bestScore = score;
        bestWindow = targetWindow;
      }
    });

    // openPopoutLeaf() 回傳的 Window 若已確認仍是 live popout，優先使用，
    // 避免來源與新視窗共用 leaf ID 時形成平手。
    if (preferredWindow && windows.has(preferredWindow)) {
      return preferredWindow;
    }

    if (bestWindow) {
      // 當要求正分數 (requirePositiveScore) 時，leaf-id 命中視為高置信直接接受；
      // 純檔案匹配則需 saved 檔案覆蓋率 ≥ 50%，避免通用檔名（Untitled.md）誤判。
      if (requirePositiveScore && (idMatches.get(bestWindow) || 0) === 0) {
        const coverage = savedFiles.size > 0
          ? (matchedSavedFiles.get(bestWindow)?.size || 0) / savedFiles.size
          : 0;
        if (coverage < 0.5) return null;
      }
      return bestWindow;
    }

    // 當要求正分數 (positive score) 時，若未匹配到任何 leaf/file (score 0)，禁止盲目 fallback 回傳唯一視窗
    if (requirePositiveScore) return null;

    // 首次 restore 時若 Obsidian 已重建 leaf ID，但目前只有一個 popout，
    // 該視窗就是唯一合法目標。
    return windows.size === 1 ? Array.from(windows.keys())[0] : null;
  }

  /**
   * 將 restore 前保存的所有 layout 名稱與視窗幾何座標，一對一重新套用至 restore 後的
   * live popout。避免跨螢幕/異質 DPI 下 changeLayout 導至既有視窗尺寸微幅縮小。
   */
  private restorePreservedWindowLabels(
    snapshots: PreservedWindowLayout[],
    restoredTargetWindow: Window | null
  ): void {
    const claimedWindows = new Set<Window>();
    if (restoredTargetWindow) claimedWindows.add(restoredTargetWindow);

    snapshots.forEach((snapshot) => {
      const currentWindow = this.findWindowForSavedLeaves(
        snapshot.leaves,
        restoredTargetWindow || undefined,
        snapshot.window,
        claimedWindows
      );
      if (!currentWindow) return;
      this.setLayoutLabelForWindow(currentWindow, snapshot.layoutName);
      if (snapshot.windowState) {
        this.restoreWindowGeometry(currentWindow, snapshot.windowState, true, true);
      }
      claimedWindows.add(currentWindow);
    });
  }

  /** 在 changeLayout 重建 popout 後恢復實際視窗尺寸與座標（僅在幾何有顯著差異或強制時呼叫，防止重複無謂位移與 OS 邊框重算）。 */
  private restoreWindowGeometry(
    targetWin: Window,
    windowState: WindowState | null | undefined,
    includeGeometry = true,
    force = true
  ): void {
    if (!windowState || includeGeometry === false || !targetWin) return;

    const size = windowState.size;
    if (
      size &&
      size.width > 0 &&
      size.height > 0 &&
      typeof targetWin.resizeTo === "function"
    ) {
      const currentWidth = typeof targetWin.outerWidth === "number" ? targetWin.outerWidth : 0;
      const currentHeight = typeof targetWin.outerHeight === "number" ? targetWin.outerHeight : 0;
      if (force || currentWidth === 0 || Math.abs(currentWidth - size.width) > 2 || Math.abs(currentHeight - size.height) > 2) {
        targetWin.resizeTo(size.width, size.height);
      }
    }

    if (windowState.position && typeof targetWin.moveTo === "function") {
      const currentX = typeof targetWin.screenX === "number" ? targetWin.screenX : 0;
      const currentY = typeof targetWin.screenY === "number" ? targetWin.screenY : 0;
      if (force || currentX === 0 || Math.abs(currentX - windowState.position.x) > 2 || Math.abs(currentY - windowState.position.y) > 2) {
        targetWin.moveTo(windowState.position.x, windowState.position.y);
      }
    }
  }

  /**
   * 當發動 changeLayout 時，將非 Restore 目標之活體 Popout 視窗最新實際 outerWidth/outerHeight/screenX/screenY 帶入 floating schema，
   * 避免多螢幕異質 DPI 縮放率下呼叫全域 changeLayout 時，其他存活 Popout 視窗尺寸被重複縮放衰減。
   */
  private syncLiveWindowBoundsToFloatingChild(child: unknown, liveWin: Window): unknown {
    if (!child || typeof child !== "object" || !liveWin || liveWin.closed) return child;
    try {
      const cloned = { ...(child as Record<string, unknown>) };
      if (typeof liveWin.outerWidth === "number" && liveWin.outerWidth > 0) {
        cloned.width = liveWin.outerWidth;
      }
      if (typeof liveWin.outerHeight === "number" && liveWin.outerHeight > 0) {
        cloned.height = liveWin.outerHeight;
      }
      if (typeof liveWin.screenX === "number") {
        cloned.x = liveWin.screenX;
      }
      if (typeof liveWin.screenY === "number") {
        cloned.y = liveWin.screenY;
      }
      return cloned;
    } catch {
      return child;
    }
  }

  /** changeLayout 重建期間 DOM 尚未穩定，單次安全套用並於 200ms 做單次保險檢查。 */
  private applyHiddenStateAfterRestore(targetWin: Window, hidden: PopoutHiddenState): void {
    const engine = this.plugin.popoutLayout;
    const apply = (): void => {
      try {
        engine.applyHiddenState(targetWin, hidden);
      } catch {
        // Ignore DOM not ready error
      }
    };
    apply();
    if (typeof targetWin.setTimeout === "function") {
      targetWin.setTimeout(apply, 200);
    }
  }

  /** 是否為檔案類 view（markdown / pdf / 圖片等），此類 view 不參與強制渲染。 */
  private isFileView(leaf: WorkspaceLeaf | null): boolean {
    return !!leaf && !!(leaf.view as { file?: unknown } | null)?.file;
  }

  /** 檢查 leaf 是否已渲染出實際內容。 */
  private hasRenderedContent(leaf: WorkspaceLeaf | null): boolean {
    if (!leaf) return false;
    const leafEl = (leaf as unknown as ExtendedWorkspaceLeaf).containerEl ||
      (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
    if (!(leafEl instanceof HTMLElement)) return false;
    // 標準 view：.view-content 有子元素即已渲染。
    const content = leafEl.querySelector<HTMLElement>(".view-content");
    if (content) return content.children.length > 0;
    // File Explorer 家族（原生 file-explorer 與 Folder Space 重用同一 DOM 結構，
    // 無 .view-content）：nav-files-container 有子元素即已渲染。
    // 避免 restore 後的 lifecycle retry 把已渲染的 folder tree 反覆 rebuild（抖動）。
    const navFiles = leafEl.querySelector<HTMLElement>(".nav-files-container");
    if (navFiles) return navFiles.children.length > 0;
    return false;
  }

  /** 強制重新渲染 leaf 的 view（重建視圖，重新執行 onOpen）。 */
  private forceRenderView(leaf: WorkspaceLeaf): void {
    const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
    if (typeof extLeaf.rebuildView === "function") {
      try {
        extLeaf.rebuildView();
        return;
      } catch (e) {
        console.warn("rebuildView failed, falling back to setViewState:", e);
      }
    }

    // fallback：同型別 setViewState 只會呼叫 setState，不會重建視圖；
    // 先切成 empty 再切回目標型別以強制重建。
    const current = typeof extLeaf.getViewState === "function" ? extLeaf.getViewState() : null;
    const type = current?.type;
    if (!type) return;
    void (async () => {
      try {
        await extLeaf.setViewState({ type: "empty", active: false, state: {} });
        await extLeaf.setViewState({ type, active: false, state: current.state || {} });
      } catch (e) {
        console.warn("Failed to force render view:", e);
      }
    })();
  }

  /**
   * 單次檢查：先載入 deferred view，再於 DOM 仍為空時最多重建一次。
   * 多個 lifecycle retry 不得因 DOM 尚未及時更新而連續重建同一個 leaf。
   */
  ensureViewRendered(leaf: WorkspaceLeaf | null): void {
    if (!leaf || this.isFileView(leaf)) return;
    if (this.hasRenderedContent(leaf)) {
      this.renderAttemptedLeaves.delete(leaf);
      return;
    }

    if (leaf.isDeferred) {
      if (this.deferredViewLoads.has(leaf)) return;
      const pendingLoad = leaf
        .loadIfDeferred()
        .then(() => {
          this.deferredViewLoads.delete(leaf);
          if (!this.hasRenderedContent(leaf)) this.rebuildViewIfNeeded(leaf);
        })
        .catch(() => {
          this.deferredViewLoads.delete(leaf);
          this.rebuildViewIfNeeded(leaf);
        });
      this.deferredViewLoads.set(leaf, pendingLoad);
      return;
    }

    this.rebuildViewIfNeeded(leaf);
  }

  private rebuildViewIfNeeded(leaf: WorkspaceLeaf): void {
    if (this.hasRenderedContent(leaf) || this.renderAttemptedLeaves.has(leaf)) return;
    this.renderAttemptedLeaves.add(leaf);
    this.forceRenderView(leaf);
  }

  /**
   * 在 Popout tab 切換完成後延遲檢查 DOM，避免 active-leaf-change 的
   * mousedown/mouseup 階段重建 view 而吞掉原生 click 事件。
   */
  scheduleViewRenderAfterActivation(leaf: WorkspaceLeaf, targetWin: Window): void {
    if (!leaf || !targetWin || targetWin.closed) return;

    targetWin.setTimeout(() => {
      if (targetWin.closed) return;
      const container = (leaf as unknown as ExtendedWorkspaceLeaf).containerEl;
      if (!container?.isConnected) return;
      this.ensureViewRendered(leaf);
    }, 150);
  }

  /** 以受管控方式確保非檔案 view 已渲染，所有重試皆通過 per-leaf guard 防止重複 DOM 重建。 */
  private ensureViewRenderedWithRetries(targetWin: Window, leaf: WorkspaceLeaf): void {
    if (!leaf || !targetWin || targetWin.closed) return;
    this.ensureViewRendered(leaf);
    if (typeof targetWin.setTimeout === "function") {
      targetWin.setTimeout(() => {
        if (targetWin.closed) return;
        this.ensureViewRendered(leaf);
      }, 200);
    }
  }

  /**
   * 視窗已顯示後，對仍無內容的 deferred view（file-explorer / search 等）
   * 強制 loadIfDeferred——此時 containerEl 可見，setViewState 會建立真實
   * view（而非 DeferredView），內容即可渲染。300ms 後再確認一次，涵蓋
   * 視窗建立初期 onOpen 的非同步渲染延遲。
   */
  private ensureDeferredViewsLoaded(targetWin: Window): void {
    if (!targetWin || targetWin.closed) return;
    const attempt = async (): Promise<void> => {
      if (targetWin.closed) return;
      const leaves = this.getLeavesForWindow(targetWin);
      // 依序 await 處理，避免多個 rebuildView 並發互相衝突（working 標記會
      // 讓彼此的 setViewState 被跳過，導致停在半初始化空白）。
      for (const leaf of leaves) {
        if (this.isFileView(leaf) || this.hasRenderedContent(leaf)) continue;
        const extLeaf = leaf as unknown as {
          isDeferred?: boolean;
          loadIfDeferred?: () => Promise<void>;
          rebuildView?: () => Promise<void>;
        };
        if (extLeaf.isDeferred && typeof extLeaf.loadIfDeferred === "function") {
          try {
            await extLeaf.loadIfDeferred();
          } catch {
            // Ignore deferred load error
          }
          continue;
        }
        // 非 deferred 但內容仍空：視窗未顯示時建立的 view 停在半初始化
        // （open() 未完成，containerEl 空白）。視窗顯示後 rebuildView 可
        // 正確渲染；多階段 attempt 涵蓋視窗顯示時序的不確定性。
        this.renderAttemptedLeaves.delete(leaf);
        if (typeof extLeaf.rebuildView === "function") {
          try {
            await extLeaf.rebuildView();
          } catch {
            // Ignore rebuild error; 後續 attempt 會再試
          }
        } else {
          this.rebuildViewIfNeeded(leaf);
        }
      }
    };
    void attempt();
    if (typeof targetWin.setTimeout === "function") {
      [300, 1200, 2500].forEach((ms) => targetWin.setTimeout(() => void attempt(), ms));
    }
    // 視窗尚未顯示（Electron 顯示延遲）時，前面的 attempt 可能全部太早。
    // 視窗首次變為 visible 時再補載一次——此時 rebuildView 能正確渲染。
    const doc = targetWin.document;
    if (doc && typeof doc.addEventListener === "function") {
      doc.addEventListener(
        "visibilitychange",
        () => {
          if (targetWin.closed) return;
          if (doc.visibilityState === "visible") void attempt();
        },
        { once: true }
      );
    }
  }

  /**
   * 根據 ID 查找 leaf
   */
  private findLeafById(id: string): WorkspaceLeaf | null {
    if (!id) return null;
    let targetLeaf: WorkspaceLeaf | null = null;
    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (!targetLeaf && (leaf as any).id === id) {
        targetLeaf = leaf;
      }
    });
    return targetLeaf;
  }

  /**
   * 調整視窗位置
   */
  private adjustWindowPosition(position: { x: number; y: number }): void {
    try {
      // 這個功能在某些環境中可能受限
      if (window.moveTo) {
        window.moveTo(position.x, position.y);
      }
    } catch (error) {
      console.warn("Failed to adjust window position:", error);
    }
  }

  /**
   * 驗證佈局數據
   */
  private validateLayout(layout: WindowLayout): boolean {
    return !!(
      layout &&
      layout.id &&
      layout.name &&
      layout.workspace &&
      layout.workspace.layout
    );
  }

  /**
   * 生成唯一 ID
   */
  public generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
