import { App, WorkspaceLeaf, Notice, TFile, setIcon } from "obsidian";
import {
  WindowLayout,
  WindowState,
  ViewState,
  SaveLayoutOptions,
  RestoreLayoutOptions,
} from "./types";
import { t, getI18n } from "./i18n";

interface LayoutLabelElements {
  statusBar: HTMLElement | null;
}

export class WindowLayoutManager {
  private plugin: any;
  private app: App;
  private layoutWindows = new WeakMap<WindowLayout, Window>();
  private popoutWindows = new Set<Window>();
  private layoutNames = new Map<Window, string>();
  private layoutLabels = new Map<Window, LayoutLabelElements>();

  constructor(plugin: any) {
    this.plugin = plugin;
    this.app = plugin.app;
  }

  /** 記錄 Obsidian 建立的 Popout，供 label 生命週期管理使用。 */
  registerPopoutWindow(targetWin: Window): void {
    if (!targetWin) return;

    this.popoutWindows.add(targetWin);
    this.refreshLayoutStatusBar(targetWin);

    // window-open 觸發時 Popout DOM 可能仍在建立中，再補一次確保狀態列出現。
    targetWin.setTimeout(() => this.refreshLayoutStatusBar(targetWin), 0);
  }

  /** 插件重新載入時，補註冊已經存在的 Popout。 */
  registerExistingPopoutWindows(): void {
    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const targetWin = (leaf as any).containerEl?.ownerDocument?.defaultView as Window | undefined;
      if (targetWin && this.isPopoutDocument(targetWin.document)) {
        this.registerPopoutWindow(targetWin);
      }
    });
  }

  /** Popout 關閉時移除對應的 layout label 與追蹤狀態。 */
  unregisterPopoutWindow(targetWin: Window): void {
    if (!targetWin) return;

    this.removeLayoutLabel(targetWin);
    this.popoutWindows.delete(targetWin);
  }

  /** Plugin 卸載時清除所有由本 plugin 建立的 Popout label。 */
  clearLayoutLabels(): void {
    for (const [targetWin, labels] of this.layoutLabels) {
      labels.statusBar?.remove();
      this.popoutWindows.delete(targetWin);
    }
    this.layoutNames.clear();
    this.layoutLabels.clear();
    this.popoutWindows.clear();
  }

  /**
   * 在指定 Popout 的內容區顯示目前套用的 layout 名稱。
   * 不修改 document.title，也不寫入 Obsidian layout tree。
   */
  setLayoutLabelForWindow(targetWin: Window | null, layoutName: string): void {
    if (!targetWin || !layoutName?.trim()) return;

    const targetDocument = targetWin.document;
    const body = targetDocument?.body;
    if (!body || !this.isPopoutDocument(targetDocument)) return;

    this.registerPopoutWindow(targetWin);
    this.layoutNames.set(targetWin, layoutName);

    // 清理舊版浮動 label，避免更新插件後殘留在 Popout 右上角。
    body.querySelectorAll(".window-spaces-layout-label").forEach((element) => element.remove());

    this.refreshLayoutStatusBar(targetWin);
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

    if (this.plugin.settings.showLayoutStatusBar === true) {
      labels.statusBar = this.ensureLayoutLabelElement(
        targetDocument,
        body,
        labels.statusBar,
        "window-spaces-layout-status"
      );
      this.updateLayoutLabelElement(
        labels.statusBar,
        this.layoutNames.get(targetWin) || t("common.noLayout"),
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

    const element = targetDocument.createElement("div");
    element.className = className;
    body.appendChild(element);
    return element;
  }

  private updateLayoutLabelElement(
    element: HTMLElement,
    layoutName: string,
    targetWin: Window
  ): void {
    const targetDocument = targetWin.document;
    let iconElement = element.querySelector<HTMLElement>(".window-spaces-layout-icon");
    if (!iconElement) {
      iconElement = targetDocument.createElement("span");
      iconElement.className = "window-spaces-layout-icon";
      setIcon(iconElement, "history");
      element.appendChild(iconElement);
    }

    let nameElement = element.querySelector<HTMLElement>(".window-spaces-layout-name");
    if (!nameElement) {
      nameElement = targetDocument.createElement("span");
      nameElement.className = "window-spaces-layout-name";
      element.appendChild(nameElement);
    }

    let actionsElement = element.querySelector<HTMLElement>(".window-spaces-layout-actions");
    if (!actionsElement) {
      actionsElement = targetDocument.createElement("div");
      actionsElement.className = "window-spaces-layout-actions";
      element.appendChild(actionsElement);
    }

    const ensureActionButton = (
      className: string,
      icon: string,
      label: string,
      onClick: (e: MouseEvent) => void
    ): HTMLButtonElement => {
      let button = actionsElement!.querySelector<HTMLButtonElement>(`.${className}`);
      if (!button) {
        button = targetDocument.createElement("button");
        button.className = `window-spaces-layout-action ${className} clickable-icon`;
        button.type = "button";
        setIcon(button, icon as any);
        actionsElement!.appendChild(button);
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

    const currentLayout = this.plugin.settings.layouts.find((l: WindowLayout) => l.name === layoutName);
    const isAutoSave = !!currentLayout?.autoSave;

    ensureActionButton(
      "window-spaces-layout-save",
      "save",
      t("commands.saveLayout"),
      () => void this.saveLayoutFromWindow(targetWin)
    );

    const autoSaveBtn = ensureActionButton(
      "window-spaces-layout-auto-save",
      "refresh-cw",
      isAutoSave ? t("manageModal.autoSaveEnabled") : t("manageModal.autoSaveDisabled"),
      async () => {
        const targetLayout = this.plugin.settings.layouts.find((l: WindowLayout) => l.name === layoutName);
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
      }
    );

    if (isAutoSave) {
      autoSaveBtn.classList.add("is-active");
    } else {
      autoSaveBtn.classList.remove("is-active");
    }

    ensureActionButton(
      "window-spaces-layout-restore",
      "history",
      t("commands.restoreLayout"),
      () => this.plugin.openWindowLayoutsModal("restore", targetWin)
    );
    ensureActionButton(
      "window-spaces-layout-manage",
      "layout",
      t("commands.manageLayouts"),
      () => this.plugin.openWindowLayoutsModal("manage", targetWin)
    );
    element.setAttribute("aria-label", `${t("common.layoutLabel")}: ${layoutName}`);
    element.setAttribute("title", layoutName);
    element.dataset.layoutName = layoutName;
  }

  /** 開啟全新的 Popout 視窗 */
  openNewPopoutWindow(): Window | null {
    try {
      const leaf = (this.app.workspace as any).openPopoutLeaf();
      if (leaf) {
        (leaf as any).setViewState({ type: "empty" });
        const targetWin = (leaf as any).containerEl?.ownerDocument?.defaultView || null;
        if (targetWin && typeof targetWin.focus === "function") {
          try {
            targetWin.focus();
          } catch (e) {
            console.warn("Failed to focus new popout window:", e);
          }
        }
        return targetWin;
      }
    } catch (e) {
      console.warn("Failed to open new popout window:", e);
    }
    return null;
  }

  private async saveLayoutFromWindow(targetWin: Window): Promise<void> {
    try {
      const layoutName = this.layoutNames.get(targetWin) || "";
      const existing = this.plugin.settings.layouts.find((l: WindowLayout) => l.name === layoutName);

      const layout = await this.captureCurrentLayout(
        { name: layoutName },
        targetWin
      );

      if (existing) {
        layout.autoSave = existing.autoSave;
      }

      this.plugin.openSaveLayoutModal(layout);
    } catch (error: any) {
      console.error("Failed to capture layout from Popout:", error);
      new Notice(`${t("errors.failedToSave")}: ${error?.message || error}`);
    }
  }

  private autoSaveTimers = new Map<Window, any>();
  private lastValidSnapshots = new Map<Window, WindowLayout>();

  /**
   * 檢查並發動所有已開啟自動保存的 Popout 視窗的 5 秒 Debounced 自動儲存
   */
  checkAndDebouncedAutoSaveAll(): void {
    this.layoutNames.forEach((layoutName, targetWin) => {
      const existing = this.plugin.settings.layouts.find((l: WindowLayout) => l.name === layoutName);
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
        if (this.autoSaveTimers.has(targetWin)) {
          clearTimeout(this.autoSaveTimers.get(targetWin));
        }

        const timer = setTimeout(() => {
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

    const existing = this.plugin.settings.layouts.find((l: WindowLayout) => l.name === layoutName);
    if (!existing || existing.autoSave !== true) return;

    try {
      let captured: WindowLayout | null = null;

      // 1. 嘗試進行現場 capture
      try {
        const liveCaptured = await this.captureCurrentLayout({ name: layoutName }, targetWin);
        if (liveCaptured.metadata?.fileCount > 0 || (liveCaptured.workspace?.leaves && liveCaptured.workspace.leaves.length > 0)) {
          captured = liveCaptured;
          captured.autoSave = true;
          captured.id = existing.id;
          this.lastValidSnapshots.set(targetWin, captured);
        }
      } catch (e) {
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
      const index = this.plugin.settings.layouts.findIndex((l: WindowLayout) => l.id === existing.id);
      if (index !== -1) {
        this.plugin.settings.layouts[index] = captured;
      } else {
        this.plugin.settings.layouts.push(captured);
      }
      await this.plugin.saveSettings();
    } catch (e) {
      console.warn(`[Window Spaces] Auto-save on close/change failed for "${layoutName}":`, e);
    }
  }

  private removeLayoutLabel(targetWin: Window): void {
    // 1. 若有待發動的 5 秒 Debounce 定時器，將其清除
    if (this.autoSaveTimers.has(targetWin)) {
      clearTimeout(this.autoSaveTimers.get(targetWin));
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

  private getWindowForLayout(layout: WindowLayout): Window | null {
    return this.layoutWindows.get(layout) ||
      this.findWindowForSavedLeaves(this.getSavedViewStates(layout));
  }

  /**
   * 獲取目前活動視窗 (activeWindow) 中真正的 activeLeaf
   */
  private getActiveLeafForCurrentWindow(targetWindow?: Window): WorkspaceLeaf | null {
    const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);
    const globalActiveLeaf = this.app.workspace.activeLeaf;

    // 1. 若全域 activeLeaf 的 ownerWindow 就是 currentWin，直接返回
    if (globalActiveLeaf && (globalActiveLeaf as any).containerEl?.ownerDocument?.defaultView === currentWin) {
      return globalActiveLeaf;
    }

    // 2. 若全域 activeLeaf 不在 currentWin（例如 Command Palette modal 搶焦），遍歷尋找屬於 currentWin 的 leaf
    let windowLeaf: WorkspaceLeaf | null = null;
    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (!windowLeaf && (leaf as any).containerEl?.ownerDocument?.defaultView === currentWin) {
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
    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if ((leaf as any).containerEl?.ownerDocument?.defaultView === targetWin) {
        leaves.push(leaf);
      }
    });
    return leaves;
  }

  /**
   * 捕獲當前活動視窗的佈局
   */
  async captureCurrentLayout(
    options: SaveLayoutOptions = {},
    targetWindow?: Window
  ): Promise<WindowLayout> {
    try {
      const fullLayout = this.app.workspace.getLayout();
      const activeLeaf = this.getActiveLeafForCurrentWindow(targetWindow);
      const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);

      // 取得當前活動 DOM 視窗中所有真實開著的 Leaves
      const windowLeaves = this.getLeavesForWindow(currentWin);

      // 只提取當前浮動視窗的佈局資訊
      let floatingLayout = this.extractCurrentFloatingLayout(fullLayout, activeLeaf);

      if (!floatingLayout) {
        const rootInfo = activeLeaf && typeof (activeLeaf as any).getRoot === "function" ? (activeLeaf as any).getRoot()?.constructor?.name : "no-leaf";
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
          children: windowLeaves.map((leaf) => ({
            id: this.generateId(),
            type: "tabs",
            children: [{
              id: (leaf as any).id || this.generateId(),
              type: "leaf",
              state: typeof (leaf as any).getViewState === "function" ? (leaf as any).getViewState() : { type: leaf.view?.getViewType() || "markdown", state: {} }
            }]
          }))
        };
      }

      const windowInfo = this.getCurrentWindowState();

      // Layout tree 才是目前視窗的完整來源。iterateAllLeaves 在某些
      // Obsidian 版本/Popout 狀態下只會回傳 active leaf，因此不能只用
      // windowLeaves 建立檔案列表。
      const layoutLeaves = this.extractLeavesFromLayout(floatingLayout);
      const liveLeavesById = new Map<string, WorkspaceLeaf>();
      windowLeaves.forEach((leaf) => {
        const id = (leaf as any).id;
        if (id) liveLeavesById.set(id, leaf);
      });

      const leaves: ViewState[] = layoutLeaves.map((layoutLeaf) => {
        const liveLeaf = liveLeavesById.get(layoutLeaf.id);
        if (!liveLeaf) return layoutLeaf;

        const viewState = typeof (liveLeaf as any).getViewState === "function"
          ? (liveLeaf as any).getViewState()
          : {};
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
        const id = (leaf as any).id || this.generateId();
        if (capturedIds.has(id)) return;

        const viewState = typeof (leaf as any).getViewState === "function"
          ? (leaf as any).getViewState()
          : {};
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
          layout: floatingLayout,
          activeFile: (activeLeaf?.view as any)?.file?.path,
          leaves,
        },
        metadata: {
          fileCount: this.countOpenFiles(leaves),
          tabCount: leaves.length,
          splitCount: 0,
          createdAt: new Date().toISOString(),
          obsidianVersion: (this.app as any).version || "unknown",
          pluginVersion: this.plugin?.manifest?.version || "1.0.0",
        },
        windowInfo: {
          firstLeafId: leaves.length > 0 ? leaves[0].id : undefined,
        },
      };

      // 儲存對話框開啟後 activeWindow 可能已經切回主視窗，
      // 因此保存 capture 當下的 DOM Window，供 saveLayout 使用。
      this.layoutWindows.set(capturedLayout, currentWin);
      return capturedLayout;
    } catch (error: any) {
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
    try {
      // 驗證佈局數據
      if (!this.validateLayout(layout)) {
        throw new Error(t("errors.invalidData"));
      }

      const savedLeaves = this.getSavedViewStates(layout);
      const savedLeafId = layout.windowInfo?.firstLeafId || savedLeaves[0]?.id;
      let currentLayout: any = this.app.workspace.getLayout();
      let floatingWindows = this.getFloatingWindows(currentLayout);

      // 1. 嘗試尋找目標現有視窗
      let targetIndex = -1;
      let targetWin: Window | null = null;

      if (options.forceNewWindow) {
        // 強制在新 Popout 視窗開啟
        targetIndex = -1;
      } else if (options.targetWindow && this.isPopoutDocument(options.targetWindow.document)) {
        // 優先還原至傳入的當前 Popout 視窗
        targetWin = options.targetWindow;
        const windowLeaves = this.getLeavesForWindow(targetWin);
        if (windowLeaves.length > 0 && floatingWindows.length > 0) {
          const leafId = (windowLeaves[0] as any).id;
          for (let i = 0; i < floatingWindows.length; i++) {
            if (this.floatingWindowContainsLeaf(floatingWindows[i], leafId)) {
              targetIndex = i;
              break;
            }
          }
        }
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

      // 2. 若找不到現有視窗，建立一個新 Popout 視窗
      if (targetIndex < 0) {
        const popoutLeaf = this.app.workspace.openPopoutLeaf();
        targetWin = this.getWindowForLeaf(popoutLeaf as WorkspaceLeaf);

        // 等待 Popout 視窗誕生
        await new Promise((resolve) => setTimeout(resolve, 150));

        // 重新讀取最新的 Layout
        currentLayout = this.app.workspace.getLayout();
        floatingWindows = this.getFloatingWindows(currentLayout);

        // 新開的視窗位於 floating 陣列末尾
        targetIndex = floatingWindows.length - 1;
      }

      // 3. 只替換目標 window 的 children，保留 floating container 與
      // window id。Obsidian 1.12 的 floating schema 是：
      // floating object -> window children -> split/tabs/leaf；不能把
      // floating 當成陣列，也不能直接用 leaf/split 覆蓋 window。
      if (targetIndex >= 0 && layout.workspace?.layout) {
        const currentFloatingWindow = floatingWindows[targetIndex];
        const restoredWindow = this.prepareFloatingWindowForRestore(
          layout.workspace.layout,
          currentFloatingWindow
        );
        if (currentLayout.floating?.type === "floating" && Array.isArray(currentLayout.floating.children)) {
          currentLayout.floating.children = currentLayout.floating.children.map(
            (child: any, idx: number) => (idx === targetIndex ? restoredWindow : child)
          );
        } else if (Array.isArray(currentLayout.floating)) {
          currentLayout.floating[targetIndex] = restoredWindow;
        }
        await this.app.workspace.changeLayout(currentLayout);
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      // 4. 取得目標 Popout 視窗的 DOM Window 並安全開啟所有檔案。
      // changeLayout 可能會重建 leaf，因此若原 ID 不再存在，改用還原後
      // 同一視窗中匹配最多保存 leaf 的方式辨識目標視窗。
      // changeLayout 會清除並重新建立 WorkspaceWindow，舊的 targetWin
      // 可能已經被關閉；一定要重新從新建的 leaf 找到新的 DOM window。
      targetWin = this.findWindowForSavedLeaves(savedLeaves) || targetWin;

      let missingFiles: string[] = [];
      if (options.validateFiles !== false && savedLeaves.length > 0) {
        missingFiles = await this.restoreFileStatesForWindow(
          targetWin,
          savedLeaves,
          layout.workspace?.activeFile
        );
      }

      // 5. 調整視窗尺寸與座標，並聚焦視窗
      if (targetWin) {
        if (layout.windowState) {
          if (layout.windowState.size && layout.windowState.size.width > 0 && layout.windowState.size.height > 0) {
            targetWin.resizeTo(layout.windowState.size.width, layout.windowState.size.height);
          }
          if (layout.windowState.position && typeof targetWin.moveTo === "function") {
            targetWin.moveTo(layout.windowState.position.x, layout.windowState.position.y);
          }
        }
        if (typeof targetWin.focus === "function") {
          try {
            targetWin.focus();
          } catch (e) {
            console.warn("Failed to focus target window:", e);
          }
        }
      }

      this.setLayoutLabelForWindow(targetWin, layout.name);

      if (options.showNotifications !== false) {
        if (missingFiles.length > 0) {
          const missingList = missingFiles.slice(0, 3).join(", ") + (missingFiles.length > 3 ? "..." : "");
          new Notice(`⚠️ ${t("notifications.layoutRestored")}: ${layout.name} (${t("notifications.missingFilesNotice")}: ${missingList})`, 8000);
        } else {
          new Notice(`${t("notifications.layoutRestored")}: ${layout.name}`);
        }
      }
    } catch (error: any) {
      console.error("Failed to restore layout:", error);
      throw new Error(`${t("errors.failedToRestore")}: ${error?.message || error}`);
    }
  }

  /**
   * 獲取所有保存的佈局 (按建立時間降序排列，最新儲存的在最上面)
   */
  getSavedLayouts(): WindowLayout[] {
    const settings = this.plugin.settings;
    const layouts = settings.layouts || [];
    const sortBy = settings.sortBy || "updated-desc";

    return [...layouts].sort((a, b) => {
      const aCreated = a.createdAt || a.timestamp || 0;
      const bCreated = b.createdAt || b.timestamp || 0;
      const aUpdated = a.updatedAt || a.timestamp || aCreated;
      const bUpdated = b.updatedAt || b.timestamp || bCreated;

      switch (sortBy) {
        case "updated-desc":
          return bUpdated - aUpdated;
        case "updated-asc":
          return aUpdated - bUpdated;
        case "created-desc":
          return bCreated - aCreated;
        case "created-asc":
          return aCreated - bCreated;
        case "name-asc":
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
        case "name-desc":
          return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: "base" });
        default:
          return bUpdated - aUpdated;
      }
    });
  }

  /**
   * 保存佈局到存儲
   */
  async saveLayout(layout: WindowLayout): Promise<void> {
    try {
      const settings = this.plugin.settings;
      if (!settings.layouts) {
        settings.layouts = [];
      }

      const now = Date.now();
      const existingIndex = settings.layouts.findIndex(
        (l) => l.name === layout.name
      );
      const isOverwrite = existingIndex >= 0;

      if (isOverwrite) {
        const existing = settings.layouts[existingIndex];
        layout.id = existing.id;
        layout.createdAt = existing.createdAt || existing.timestamp || now;
        layout.updatedAt = now;
        layout.timestamp = now;
        settings.layouts[existingIndex] = layout;
      } else {
        // 全新建立 (由 A 複製/改名另存為 B 時，重設 B 的 createdAt 為當時時間)
        layout.createdAt = now;
        layout.updatedAt = now;
        layout.timestamp = now;
        settings.layouts.push(layout);
      }

      // 限制佈局數量
      if (
        settings.maxLayouts &&
        settings.layouts.length > settings.maxLayouts
      ) {
        settings.layouts = settings.layouts.slice(-settings.maxLayouts);
      }

      await this.plugin.saveSettings();

      const sourceWindow = this.getWindowForLayout(layout);
      this.setLayoutLabelForWindow(sourceWindow, layout.name);

      if (this.plugin.settings.showNotifications !== false) {
        const noticeMsg = isOverwrite
          ? `${t("notifications.layoutOverwritten")}: ${layout.name}`
          : `${t("notifications.layoutSaved")}: ${layout.name}`;
        new Notice(noticeMsg);
      }
    } catch (error) {
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
      const index = settings.layouts.findIndex((l) => l.id === layoutId);

      if (index >= 0) {
        const deletedLayout = settings.layouts[index];
        settings.layouts.splice(index, 1);
        await this.plugin.saveSettings();

        if (this.plugin.settings.showNotifications !== false) {
          new Notice(
            `${t("notifications.layoutDeleted")}: ${deletedLayout.name}`
          );
        }
      }
    } catch (error) {
      console.error("Failed to delete layout:", error);
      throw new Error(t("errors.failedToDelete"));
    }
  }

  /**
   * 獲取當前視窗狀態
   */
  private getCurrentWindowState(): WindowState {
    const activeLeaf = this.getActiveLeafForCurrentWindow();
    let currentWindow = typeof activeWindow !== "undefined" ? activeWindow : window;

    if (activeLeaf && (activeLeaf as any).containerEl) {
      const ownerDocument = (activeLeaf as any).containerEl.ownerDocument;
      if (ownerDocument && ownerDocument.defaultView) {
        currentWindow = ownerDocument.defaultView;
      }
    }

    return {
      size: {
        width: currentWindow.innerWidth,
        height: currentWindow.innerHeight,
      },
      position:
        currentWindow.screenX !== undefined
          ? {
              x: currentWindow.screenX,
              y: currentWindow.screenY,
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
   * 以目前 WorkspaceWindow 的 id/容器為基礎，只替換其 children。
   * Obsidian 1.12 的 layout schema 是 floating -> window -> split/tabs/leaf。
   */
  private prepareFloatingWindowForRestore(savedLayout: any, currentWindow: any): any {
    const saved = JSON.parse(JSON.stringify(savedLayout));

    if (currentWindow?.type === "window") {
      if (saved.type === "window") {
        return {
          ...currentWindow,
          ...saved,
          id: currentWindow.id,
          children: Array.isArray(saved.children)
            ? saved.children.map((child: any) => this.normalizeFloatingLayout(child))
            : [],
        };
      }

      return {
        ...currentWindow,
        children: [this.normalizeFloatingLayout(saved)],
      };
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
   * 根據 Pinned 檔案、Active 檔案與檔案數量自動產生智慧佈局名稱 (UX-006)
   */
  generateSmartLayoutName(layout: WindowLayout): string {
    const leaves = this.getSavedViewStates(layout);
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
  private getSavedViewStates(layout: WindowLayout): ViewState[] {
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

  private getFilePathFromLeafState(leafState: any): string | null {
    if (!leafState) return null;
    if (typeof leafState === "string") return leafState;
    if (typeof leafState.state?.file === "string") return leafState.state.file;
    if (typeof leafState.state?.state?.file === "string") return leafState.state.state.file;
    if (typeof leafState.file === "string") return leafState.file;
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
    if (totalFiles > 1) {
      progressNotice = new Notice(`🔄 ${t("restoreModal.restoringLayout")}... (0/${totalFiles})`, 0);
    }

    let processedCount = 0;

    for (let i = 0; i < leaves.length; i++) {
      const leafState = leaves[i];
      const filePath = this.getFilePathFromLeafState(leafState);
      if (!filePath) continue;

      processedCount++;
      if (progressNotice) {
        progressNotice.setMessage(`🔄 ${t("restoreModal.restoringLayout")}... (${processedCount}/${totalFiles})`);
      }

      let targetLeaf: WorkspaceLeaf | null = leavesById.get(leafState.id) || null;
      if (i < windowLeaves.length && !targetLeaf) targetLeaf = windowLeaves[i];

      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file instanceof TFile) {
        if (targetLeaf) {
          const viewMode = leafState.state?.mode || leafState.state?.state?.mode;
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

    if (targetActiveLeaf) {
      try {
        this.app.workspace.setActiveLeaf(targetActiveLeaf, { focus: true });
      } catch (e) {
        console.warn("Failed to set active leaf:", e);
      }
    }

    return missingFiles;
  }

  /** 等待 changeLayout 完成 leaf 建立，避免只對第一個已建立的 leaf 開檔。 */
  private async waitForWindowLeaves(targetWin: Window, expectedCount: number): Promise<WorkspaceLeaf[]> {
    let leaves = this.getLeavesForWindow(targetWin);
    for (let attempt = 0; attempt < 20 && leaves.length < expectedCount; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      leaves = this.getLeavesForWindow(targetWin);
    }
    return leaves;
  }

  /** 取得 leaf 所屬的 DOM Window。 */
  private getWindowForLeaf(leaf: WorkspaceLeaf | null): Window | null {
    return (leaf as any)?.containerEl?.ownerDocument?.defaultView || null;
  }

  /** 根據保存的 leaf 集合辨識還原後的目標視窗。 */
  private findWindowForSavedLeaves(leaves: ViewState[]): Window | null {
    if (leaves.length === 0) return null;

    const savedIds = new Set(leaves.map((leaf) => leaf.id));
    const windows = new Map<Window, number>();
    let bestWindow: Window | null = null;
    let bestScore = 0;

    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const targetWindow = this.getWindowForLeaf(leaf);
      if (!targetWindow) return;

      const score = (windows.get(targetWindow) || 0) +
        (savedIds.has((leaf as any).id) ? 1 : 0);
      windows.set(targetWindow, score);
      if (score > bestScore) {
        bestScore = score;
        bestWindow = targetWindow;
      }
    });

    return bestWindow;
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
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
