import { App, WorkspaceLeaf, Notice, TFile, setIcon } from "obsidian";
import {
  WindowLayout,
  WindowState,
  ViewState,
  SaveLayoutOptions,
  RestoreLayoutOptions,
} from "./types";
import { t, tWithParams, getI18n } from "./i18n";
import { WindowLayoutsModal } from "./modals/restoreModal";

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
  private plugin: any;
  private app: App;
  private layoutWindows = new WeakMap<WindowLayout, Window>();
  private popoutWindows = new Set<Window>();
  private layoutNames = new Map<Window, string>();
  private layoutLabels = new Map<Window, LayoutLabelElements>();
  private activeRestorePromise: Promise<void> | null = null;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.app = plugin.app;
  }

  /** 記錄 Obsidian 建立的 Popout，供 label 生命週期管理使用。 */
  registerPopoutWindow(targetWin: Window): void {
    if (!targetWin) return;

    this.popoutWindows.add(targetWin);
    this.refreshLayoutStatusBar(targetWin);

    // window-open 觸發時 Popout DOM 可能仍在建立中，再補兩次確保狀態列 100% 出現。
    targetWin.setTimeout(() => this.refreshLayoutStatusBar(targetWin), 0);
    targetWin.setTimeout(() => this.refreshLayoutStatusBar(targetWin), 100);
    targetWin.setTimeout(() => this.refreshLayoutStatusBar(targetWin), 300);
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

    this.registerPopoutWindow(targetWin);
    this.layoutNames.set(targetWin, layoutName);

    const targetDocument = targetWin.document;
    const body = targetDocument?.body;
    if (body) {
      body.setAttribute("data-layout-name", layoutName);
      body.querySelectorAll(".window-spaces-layout-label").forEach((element) => element.remove());
    }

    this.refreshLayoutStatusBar(targetWin);
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
    return null;
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

    const currentLayout = this.plugin.settings.spaces.find((l: WindowLayout) => l.name === layoutName);
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
      t("commands.openLayouts"),
      () => this.plugin.openWindowLayoutsModal(targetWin)
    );
    element.setAttribute("aria-label", `${t("common.layoutLabel")}: ${layoutName}`);
    element.setAttribute("title", layoutName);
    element.dataset.layoutName = layoutName;
  }

  /** 開啟全新的 Popout 視窗（等待 leaf 與 DOM 都完成掛載後再回傳視窗物件） */
  async openNewPopoutWindow(): Promise<Window | null> {
    try {
      const leaf = (this.app.workspace as any).openPopoutLeaf();
      if (!leaf) return null;

      // openPopoutLeaf() 同步回傳 leaf，但 setViewState() 會非同步完成
      // view/container 的建立。若不等待這個 Promise，下面讀到的 ownerDocument
      // 可能仍是空值或尚未切換到真正的 Popout Window。
      await Promise.resolve((leaf as any).setViewState({ type: "empty" }));

      let targetWin: Window | null = null;
      for (let attempt = 0; attempt < 40; attempt++) {
        const candidate = (leaf as any).containerEl?.ownerDocument?.defaultView as Window | undefined;
        if (candidate && this.isPopoutDocument(candidate.document)) {
          targetWin = candidate;
          break;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }

      if (!targetWin) {
        console.warn("Popout leaf was created, but its Window was not mounted in time.");
        return null;
      }

      if (typeof targetWin.focus === "function") {
        try {
          targetWin.focus();
        } catch (e) {
          console.warn("Failed to focus new popout window:", e);
        }
      }
      return targetWin;
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
        if (this.autoSaveTimers.has(targetWin)) {
          window.clearTimeout(this.autoSaveTimers.get(targetWin));
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
    if (this.autoSaveTimers.has(targetWin)) {
      window.clearTimeout(this.autoSaveTimers.get(targetWin));
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
    if (typeof (this.app.workspace as any)?.iterateAllLeaves === "function") {
      (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
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

  private getWindowForLayout(layout: WindowLayout): Window | null {
    return this.getOpenWindowForLayout(layout) ||
      this.layoutWindows.get(layout) ||
      this.findWindowForSavedLeaves(this.getSavedViewStates(layout));
  }

  /**
   * 聚焦 (Focus) 指定 Popout 視窗並啟用首個 Leaf
   */
  focusTargetWindow(targetWin: Window): void {
    if (!targetWin || targetWin.closed) return;

    if (typeof targetWin.focus === "function") {
      try {
        targetWin.focus();
      } catch {
        // Ignore focus error
      }

      targetWin.setTimeout(() => {
        try {
          targetWin.focus();
          const freshLeaves = this.getLeavesForWindow(targetWin);
          if (freshLeaves.length > 0) {
            this.app.workspace.setActiveLeaf(freshLeaves[0], { focus: true });
          }
        } catch {
          // Ignore focus error
        }
      }, 50);

      targetWin.setTimeout(() => {
        try {
          targetWin.focus();
          const freshLeaves = this.getLeavesForWindow(targetWin);
          if (freshLeaves.length > 0) {
            this.app.workspace.setActiveLeaf(freshLeaves[0], { focus: true });
          }
        } catch {
          // Ignore focus error
        }
      }, 200);
    }
  }

  /**
   * 獲取目前活動視窗 (activeWindow) 中真正的 activeLeaf
   */
  private getActiveLeafForCurrentWindow(targetWindow?: Window): WorkspaceLeaf | null {
    const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);
    const globalActiveLeaf = this.app.workspace.getMostRecentLeaf();

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

  /** 保存指定 Window 的 live leaf 狀態，供 changeLayout 後重新辨識視窗。 */
  private getViewStatesForWindow(targetWin: Window): ViewState[] {
    return this.getLeavesForWindow(targetWin).map((leaf) => {
      const viewState = typeof (leaf as any).getViewState === "function"
        ? (leaf as any).getViewState()
        : {};
      return {
        id: (leaf as any).id || this.generateId(),
        type: viewState.type || leaf.view?.getViewType() || "unknown",
        state: viewState.state || {},
      };
    });
  }

  /** 快照目前所有已套用 layout 的 live popout，供新視窗 restore 後復原標籤。 */
  private capturePreservedWindowLayouts(): PreservedWindowLayout[] {
    const liveWindows = new Set<Window>();
    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
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

      const existingLayout = this.plugin?.settings?.spaces?.find(
        (l: WindowLayout) => l.name === capturedLayout.name
      );
      if (existingLayout && existingLayout.includeGeometry !== undefined) {
        capturedLayout.includeGeometry = existingLayout.includeGeometry;
      }

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
    try {
      // 驗證佈局數據
      if (!this.validateLayout(layout)) {
        throw new Error(t("errors.invalidData"));
      }

      // 0. 只有「目前視窗還原」才在 Layout 已開啟時直接聚焦既有視窗。
      // 一般 Enter / click 會傳入 forceNewWindow，必須繼續走新 Popout 流程，
      // 否則已開啟的 Layout 會被 Smart Focus 提前攔截，永遠不會開新視窗。
      if (!options.forceReload && !options.forceNewWindow) {
        const existingWin = this.getOpenWindowForLayout(layout);
        if (existingWin && !existingWin.closed && this.isPopoutDocument(existingWin.document)) {
          this.focusTargetWindow(existingWin);
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
      let currentLayout: any = this.app.workspace.getLayout();
      let floatingWindows = this.getFloatingWindows(currentLayout);

      // 1. 嘗試尋找目標現有視窗
      let targetIndex = -1;
      let targetWin: Window | null = null;

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
          const popoutLeaf = (this.app.workspace as any).openPopoutLeaf();

          // 輪詢等待全新的 Live Popout Window 在 Electron 中被正式掛載建立（最多等待 2 秒）
          let newlyCreatedWin: Window | null = null;
          for (let attempt = 0; attempt < 40; attempt++) {
            await new Promise((resolve) => window.setTimeout(resolve, 50));
            const currentPopoutWins = this.getLivePopoutWindows();
            newlyCreatedWin = currentPopoutWins.find((w) => !popoutWinsBefore.has(w)) || null;
            if (newlyCreatedWin) break;
          }

          targetWin = newlyCreatedWin || (popoutLeaf as any)?.containerEl?.ownerDocument?.defaultView || null;

          // 重新讀取最新的 Layout
          currentLayout = this.app.workspace.getLayout();
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

      // 3. 只替換目標 window 的 children，保留 floating container 與
      // window id。Obsidian 1.12 的 floating schema 是：
      // floating object -> window children -> split/tabs/leaf；不能把
      // floating 當成陣列，也不能直接用 leaf/split 覆蓋 window。
      if (targetIndex >= 0 && layout.workspace?.layout) {
        const currentFloatingWindow = floatingWindows[targetIndex];
        const restoredWindow = this.prepareFloatingWindowForRestore(
          layout.workspace.layout,
          currentFloatingWindow,
          layout.includeGeometry
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

      await new Promise((resolve) => window.setTimeout(resolve, 150));

      // 4. 取得目標 Popout 視窗最新活體 DOM Window 並安全開啟所有檔案
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
        this.layoutWindows.set(layout, targetWin);
        this.restoreWindowGeometry(targetWin, layout.windowState, layout.includeGeometry);

        const winLeaves = this.getLeavesForWindow(targetWin);
        if (winLeaves.length > 0) {
          try {
            this.app.workspace.setActiveLeaf(winLeaves[0], { focus: true });
          } catch {
            // Ignore focus error
          }
        }

        if (typeof targetWin.focus === "function") {
          try {
            targetWin.focus();
          } catch (e) {
            console.warn("Failed to focus target window:", e);
          }
          targetWin.setTimeout(() => {
            try {
              targetWin.focus();
              const freshLeaves = this.getLeavesForWindow(targetWin);
              if (freshLeaves.length > 0) {
                this.app.workspace.setActiveLeaf(freshLeaves[0], { focus: true });
              }
            } catch {
              // Ignore focus error
            }
          }, 100);
          targetWin.setTimeout(() => {
            try {
              targetWin.focus();
              const freshLeaves = this.getLeavesForWindow(targetWin);
              if (freshLeaves.length > 0) {
                this.app.workspace.setActiveLeaf(freshLeaves[0], { focus: true });
              }
            } catch {
              // Ignore focus error
            }
          }, 300);
        }
      }

      this.setLayoutLabelForWindow(targetWin, layout.name);
      this.restorePreservedWindowLabels(preservedWindowLayouts, targetWin);
      this.refreshLayoutLabels();
      WindowLayoutsModal.renderAllInstances();

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
    const settings = this.plugin.settings || {};
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
        settings.spaces[existingIndex] = layout;
      } else {
        // 全新建立 (由 A 複製/改名另存為 B 時，重設 B 的 createdAt 為當時時間)
        layout.createdAt = now;
        layout.updatedAt = now;
        layout.timestamp = now;
        settings.spaces.push(layout);
      }

      // 限制佈局數量
      if (
        settings.maxLayouts &&
        settings.spaces.length > settings.maxLayouts
      ) {
        settings.spaces = settings.spaces.slice(-settings.maxLayouts);
      }

      await this.plugin.saveSettings();
      WindowLayoutsModal.renderAllInstances();

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
    } catch (error) {
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
    (this.app.workspace as any).iterateAllLeaves((leaf: WorkspaceLeaf) => {
      const win = (leaf as any).containerEl?.ownerDocument?.defaultView as Window | undefined;
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
    if (activeLeaf && (activeLeaf as any).containerEl) {
      const ownerDocument = (activeLeaf as any).containerEl.ownerDocument;
      if (ownerDocument && ownerDocument.defaultView) {
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

    if (activeLeaf && (activeLeaf as any).containerEl) {
      const ownerDocument = (activeLeaf as any).containerEl.ownerDocument;
      if (ownerDocument && ownerDocument.defaultView) {
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
      const root = typeof (leaf as any).getRoot === "function"
        ? (leaf as any).getRoot()
        : null;
      const rootLayout = root && typeof root.getLayout === "function"
        ? root.getLayout()
        : null;
      const rootIds = new Set(
        [(root as any)?.id, rootLayout?.id].filter((id): id is string => !!id)
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
  private prepareFloatingWindowForRestore(
    savedLayout: any,
    currentWindow: any,
    includeGeometry = true
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

    const leafToFocus = targetActiveLeaf || windowLeaves[0] || null;
    if (leafToFocus) {
      try {
        this.app.workspace.setActiveLeaf(leafToFocus, { focus: true });
        if ((leafToFocus as any)?.containerEl && typeof (leafToFocus as any).containerEl.focus === "function") {
          (leafToFocus as any).containerEl.focus();
        }
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
      const score = (windows.get(targetWindow) || 0) +
        (savedIds.has((leaf as any).id) ? 100 : 0) +
        (filePath && savedFiles.has(filePath) ? 10 : 0);
      windows.set(targetWindow, score);
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

    if (bestWindow) return bestWindow;

    // 當要求正分數 (positive score) 時，若未匹配到任何 leaf/file (score 0)，禁止盲目 fallback 回傳唯一視窗
    if (requirePositiveScore) return null;

    // 首次 restore 時若 Obsidian 已重建 leaf ID，但目前只有一個 popout，
    // 該視窗就是唯一合法目標。
    return windows.size === 1 ? Array.from(windows.keys())[0] : null;
  }

  /**
   * 將 restore 前保存的所有 layout 名稱，一對一重新綁定到 restore 後的
   * live popout。目標新視窗與已配對視窗不會被重複使用。
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
      claimedWindows.add(currentWindow);
    });
  }

  /** 在 changeLayout 重建 popout 後恢復實際視窗尺寸與座標。 */
  private restoreWindowGeometry(
    targetWin: Window,
    windowState: WindowState | null | undefined,
    includeGeometry = true
  ): void {
    if (!windowState || includeGeometry === false) return;

    const size = windowState.size;
    if (
      size &&
      size.width > 0 &&
      size.height > 0 &&
      typeof targetWin.resizeTo === "function"
    ) {
      targetWin.resizeTo(size.width, size.height);
    }

    if (windowState.position && typeof targetWin.moveTo === "function") {
      targetWin.moveTo(windowState.position.x, windowState.position.y);
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
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
