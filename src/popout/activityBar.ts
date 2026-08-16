import { App, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import {
  ActivityBarItem,
  WindowLayout,
  WindowSettings,
  WindowSpaceActivityBarSettings,
} from "../types";
import { t } from "../i18n";
import {
  isPopoutWindow,
  isElementHidden,
  setElementDisplay,
  ExtendedWorkspaceLeaf,
  PopoutLayoutEngine,
  PopoutSide,
  SidebarSides,
} from "../shared/popoutLayout";
import { applyItemIcon, applyViewIcon, resolveViewLabel, setIconWithCheck } from "./viewRegistry";
import { isSpaceEmoji, resolveSpaceIcon } from "../spaceVisuals";

interface WindowBars {
  left: HTMLElement;
  right: HTMLElement;
  spaceIdentity: HTMLElement;
  viewButtons: Map<string, HTMLButtonElement>;
  columnButtons: { left: HTMLButtonElement; right: HTMLButtonElement };
}

/**
 * Popout Activity Bar 控制器。
 *
 * 在每個 Popout 左右邊緣注入垂直工具列：
 * - 頂端：toggle 本側欄位按鈕。
 * - 分隔線下方：設定指定的 view 切換按鈕。
 * 欄位隱藏由 `PopoutLayoutEngine` 的 CSS display 機制處理。
 * 另外在左上角注入可拖曳移動視窗的 drag handle。
 */
export class PopoutActivityBarManager {
  private app: App;
  private plugin: { app: App; settings: WindowSettings };
  private engine: PopoutLayoutEngine;
  private barsByWindow = new WeakMap<Window, WindowBars>();
  private injectedWindows = new Set<Window>();
  /** 初始化中的視窗：初始化期間暫停 syncSidebarColumnClasses，避免過渡狀態誤判。 */
  private initializingWindows = new Set<Window>();
  private sidebarHintsByWindow = new WeakMap<Window, SidebarSides>();
  private columnEnsurePromises = new WeakMap<Window, Promise<void>>();

  constructor(plugin: { app: App; settings: WindowSettings }, engine: PopoutLayoutEngine) {
    this.app = plugin.app;
    this.plugin = plugin;
    this.engine = engine;
  }

  get settings(): WindowSettings {
    return this.plugin.settings;
  }

  isEnabled(): boolean {
    // Visibility is controlled independently by the left/right defaults and
    // per-Space settings. Keep injecting the lightweight controller so a
    // later setting change can update the existing Popout without reopening it.
    return true;
  }

  getItemsForSide(side: PopoutSide): ActivityBarItem[] {
    return this.settings.activityBars?.[side] ?? [];
  }

  /** Snapshot the global Activity Bar defaults for a newly-created Space. */
  getDefaultSettingsForNewSpace(): {
    left: WindowSpaceActivityBarSettings;
    right: WindowSpaceActivityBarSettings;
  } {
    const copy = (side: PopoutSide): WindowSpaceActivityBarSettings => ({
      show: this.settings.activityBarDefaults?.[side] !== false,
      items: this.getItemsForSide(side).map((item) => ({ ...item })),
    });
    return { left: copy("left"), right: copy("right") };
  }

  /**
   * Build the initial columns for a brand-new empty Popout. The first
   * configured button on each enabled side becomes that sidebar's first view.
   * When no view is available, ensureSideColumn intentionally leaves a New Tab
   * panel in that sidebar instead.
   */
  async initializeNewWindow(win: Window): Promise<void> {
    if (!win || win.closed) return;

    this.initializingWindows.add(win);
    try {
      await this.initializeNewWindowInternal(win);
    } finally {
      this.initializingWindows.delete(win);
      // 初始化完成後同步一次 sidebar class（此時結構已完整：左側欄 + 中央 + 右側欄）
      this.syncSidebarColumnClasses(win);
    }
  }

  private async initializeNewWindowInternal(win: Window): Promise<void> {
    if (!win || win.closed) return;

    this.injectForWindow(win);
    const leftVisible = this.settings.activityBarDefaults?.left !== false;
    const rightVisible = this.settings.activityBarDefaults?.right !== false;
    const engineWithSidebarHints = this.engine as PopoutLayoutEngine & {
      setSidebarSides?: (targetWin: Window, sides: { left: boolean; right: boolean }) => void;
    };
    engineWithSidebarHints.setSidebarSides?.(win, { left: leftVisible, right: rightVisible });

    if (leftVisible) {
      await this.engine.ensureSideColumn(win, "left", this.getItemsForSide("left")[0]?.viewType);
    }
    // ensureSideColumn focuses the newly-created sidebar leaf. Before creating
    // the opposite sidebar, explicitly reactivate the center pane so the right
    // split is made around content rather than around the left sidebar.
    if (leftVisible && rightVisible) {
      const centerLeaf = this.engine.getCenterLeafSync(win);
      this.app.workspace.setActiveLeaf(centerLeaf, { focus: false });
    }
    if (rightVisible) {
      await this.engine.ensureSideColumn(win, "right", this.getItemsForSide("right")[0]?.viewType);
    }

    await this.waitForLayoutFrame(win);
    this.applyDefaultColumnSizing(win, leftVisible, rightVisible);
    this.renderWindow(win);
  }

  /**
   * Keep a real content column while Activity Bar visibility changes on an
   * existing Space. A newly enabled side is added next to the current center;
   * enabling the second side then produces [left sidebar, content, right
   * sidebar].
   */
  private ensureLayoutColumns(win: Window): Promise<void> {
    const existing = this.columnEnsurePromises.get(win);
    if (existing) return existing;

    const promise = (async () => {
      const layout = this.getLayoutForWindow(win);
      if (!layout) return;

      const leftVisible = this.isSideVisibleForWindow(win, "left");
      const rightVisible = this.isSideVisibleForWindow(win, "right");
      const initialColumns = this.engine.getTopLevelColumnElements(win).length;

      // 依 activity bar 可見性建立/更新 hints（不再依欄位內容推斷）
      this.ensureSidebarHints(win);

      // 確保側欄欄位存在（getColumnElement null → 補帶預設 view 的欄位）
      this.ensureSideColumnPresent(win, "left", leftVisible);
      this.ensureSideColumnPresent(win, "right", rightVisible);

      const finalColumns = this.engine.getTopLevelColumnElements(win).length;
      if (finalColumns !== initialColumns) {
        await this.waitForLayoutFrame(win);
        if (!this.hasSavedLayoutDimensions(layout.workspace?.layout)) {
          this.applyDefaultColumnSizing(win, leftVisible, rightVisible);
        }
      }
    })().finally(() => {
      this.columnEnsurePromises.delete(win);
    });

    this.columnEnsurePromises.set(win, promise);
    return promise;
  }

  private getEngineSidebarHints(win: Window): SidebarSides | undefined {
    const engineWithSidebarHints = this.engine as PopoutLayoutEngine & {
      getSidebarSides?: (targetWin: Window) => SidebarSides | undefined;
    };
    return engineWithSidebarHints.getSidebarSides?.(win);
  }

  private setEngineSidebarHints(win: Window, hints: SidebarSides): void {
    this.sidebarHintsByWindow.set(win, { ...hints });
    const engineWithSidebarHints = this.engine as PopoutLayoutEngine & {
      setSidebarSides?: (targetWin: Window, sides: SidebarSides) => void;
    };
    engineWithSidebarHints.setSidebarSides?.(win, hints);
  }

  /**
   * 建立/更新該視窗的實體側欄 hints。
   *
   * 規則：sidebar = activity bar 旁的最外層欄位（不看欄位內容）。因此 hints
   * 的 left/right 直接同步為「該側 activity bar 是否顯示」。首次呼叫時記錄
   * 原始頂層欄位數（originalCount）與初始顯示狀態，供補欄判斷使用。
   */
  private ensureSidebarHints(win: Window): SidebarSides {
    const leftVisible = this.isSideVisibleForWindow(win, "left");
    const rightVisible = this.isSideVisibleForWindow(win, "right");
    const existing = this.sidebarHintsByWindow.get(win) || this.getEngineSidebarHints(win);

    if (existing && typeof existing.originalCount === "number") {
      // 已建立：只更新目前的顯示狀態（originalCount / initial* 不變）
      const updated: SidebarSides = {
        ...existing,
        left: leftVisible,
        right: rightVisible,
      };
      this.setEngineSidebarHints(win, updated);
      return updated;
    }

    // 首次建立：記錄原始欄位數與初始顯示狀態
    const hints: SidebarSides = {
      left: leftVisible,
      right: rightVisible,
      originalCount: this.engine.getTopLevelColumnElements(win).length,
      initialLeft: leftVisible,
      initialRight: rightVisible,
    };
    this.setEngineSidebarHints(win, hints);
    return hints;
  }

  private async waitForLayoutFrame(win: Window): Promise<void> {
    const raf = win.requestAnimationFrame?.bind(win);
    if (raf) {
      await new Promise<void>((resolve) => raf(() => resolve()));
      await new Promise<void>((resolve) => raf(() => resolve()));
      return;
    }
    await new Promise<void>((resolve) => win.setTimeout(resolve, 0));
  }

  private applyDefaultColumnSizing(win: Window, leftVisible: boolean, rightVisible: boolean): void {
    const columns = this.engine.getTopLevelColumnElements(win);
    // flex-grow 權重語意（與 Obsidian 原生 setDimension 一致）：容器縮放或
    // 側欄收合（display:none）時剩餘欄位自動重新分配，不需 rebalance。
    const weights = leftVisible && rightVisible
      ? [20, 60, 20]
      : leftVisible
        ? [24, 76]
        : rightVisible
          ? [76, 24]
          : [100];

    columns.forEach((column, index) => {
      const weight = weights[index];
      if (weight === undefined) return;
      const customEl = column as unknown as {
        setCssProps?: (props: Record<string, string>) => void;
      };
      const flexGrow = String(weight);
      if (typeof customEl.setCssProps === "function") {
        // setCssProps 以 setProperty(key, value) 套用，key 需為 kebab-case
        customEl.setCssProps({ "flex-grow": flexGrow });
      } else {
        column.style.setProperty("flex-grow", flexGrow);
      }
    });
  }

  private hasSavedLayoutDimensions(node: any): boolean {
    if (!node || !Array.isArray(node.children)) return false;
    return node.children.some((child: any) =>
      (typeof child?.dimension === "number" && Number.isFinite(child.dimension)) ||
      this.hasSavedLayoutDimensions(child)
    );
  }

  /**
   * Reapply Obsidian's serialized split dimensions after a leaf-level restore.
   * The leaf APIs recreate the tree but initially distribute every split
   * equally; saved `dimension` values are the source of truth for final sizes.
   *
   * 以 flex-grow 權重語意（0~100，與 Obsidian 原生 setDimension 一致）遞迴
   * 套用：容器縮放或側欄收合時剩餘欄位自動重新分配，不會像 flex-basis 百分比
   * 那樣需要手動 rebalance。
   */
  private applySavedLayoutDimensions(win: Window): void {
    const layout = this.getLayoutForWindow(win);
    let rootNode = layout?.workspace?.layout as any;
    if (!rootNode) return;

    // Some workspace snapshots wrap the actual window tree in a `floating`
    // node. The popout root element corresponds to that node's window child.
    if (rootNode.type === "floating" && rootNode.children?.length === 1) {
      rootNode = rootNode.children[0];
    }

    const rootEl = win.document.querySelector<HTMLElement>(
      ".workspace-split.mod-root"
    );
    if (!rootEl) return;

    const getSplitChildren = (splitEl: HTMLElement): HTMLElement[] =>
      Array.from(splitEl.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          (child.classList.contains("workspace-tabs") || child.classList.contains("workspace-split"))
      );

    const setFlex = (el: HTMLElement, dimension: number): void => {
      const customEl = el as unknown as {
        setCssProps?: (props: Record<string, string>) => void;
      };
      // flex-grow 權重（與 Obsidian setDimension 一致），而非 flex-basis 百分比
      const flexGrow = String(dimension);
      if (typeof customEl.setCssProps === "function") {
        // setCssProps 以 setProperty(key, value) 套用，key 需為 kebab-case
        customEl.setCssProps({ "flex-grow": flexGrow });
      } else {
        el.style.setProperty("flex-grow", flexGrow);
      }
    };

    const applyNode = (node: any, splitEl: HTMLElement): void => {
      if (!node || !Array.isArray(node.children)) return;
      const domChildren = getSplitChildren(splitEl);
      // 欄位數不匹配（例如開檔建了新的中央編輯區後，欄位數 > 存檔樹）：
      // 跳過 dimension 套用，避免把存檔權重錯位覆蓋到新欄位（保持現狀）。
      // restore 後欄位數匹配時才正常套用。
      if (domChildren.length !== node.children.length) return;
      node.children.forEach((child: any, index: number) => {
        const domChild = domChildren[index];
        if (!domChild) return;

        const dimension = Number(child?.dimension);
        if (Number.isFinite(dimension) && dimension > 0) {
          setFlex(domChild, dimension);
        }

        if (child?.type === "split") {
          applyNode(child, domChild);
        }
      });
    };

    applyNode(rootNode, rootEl);
  }

  private getItemsForWindowSide(win: Window, side: PopoutSide): ActivityBarItem[] {
    const layout = this.getLayoutForWindow(win);
    const savedSettings = layout?.activityBars?.[side];
    if (savedSettings?.items) return savedSettings.items;

    const items = this.getItemsForSide(side);
    const selectedViewTypes = savedSettings?.viewTypes;
    if (!selectedViewTypes) return items;
    const selected = new Set(selectedViewTypes);
    return items.filter((item) => selected.has(item.viewType));
  }

  private isSideVisibleForWindow(win: Window, side: PopoutSide): boolean {
    const layout = this.getLayoutForWindow(win);
    if (layout?.activityBars?.[side]) {
      return layout.activityBars[side]?.show === true;
    }
    // A legacy saved Space without per-side settings is intentionally hidden.
    if (layout) return false;
    return this.settings.activityBarDefaults?.[side] !== false;
  }

  /**
   * 套用 sidebar toggle icon（對齊 Obsidian 主視窗原生按鈕 SVG 結構與 CSS）：
   * 包含外框 <rect> 與內部側欄指示條 <rect class="sidebar-toggle-icon-inner">，
   * 透過 mod-left / mod-right 與 is-open / is-collapsed 類別控制側欄開合狀態與方向。
   */
  private applySidebarToggleIcon(btn: HTMLButtonElement, side: PopoutSide, hidden: boolean): void {
    btn.classList.add("window-spaces-sidebar-toggle-btn");
    btn.classList.toggle("mod-left", side === "left");
    btn.classList.toggle("mod-right", side === "right");
    btn.classList.toggle("is-collapsed", hidden);
    btn.classList.toggle("is-open", !hidden);

    let svg = btn.querySelector<SVGElement>("svg.sidebar-toggle-button-icon");
    if (!svg) {
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon sidebar-toggle-button-icon">
          <rect x="1" y="2" width="22" height="20" rx="4"></rect>
          <rect x="4" y="5" width="2" height="14" rx="2" fill="currentColor" class="sidebar-toggle-icon-inner"></rect>
        </svg>
      `.trim();
      svg = btn.querySelector<SVGElement>("svg.sidebar-toggle-button-icon");
    }

    const innerRect = svg?.querySelector<SVGRectElement>(".sidebar-toggle-icon-inner");
    if (innerRect) {
      if (hidden) {
        innerRect.setAttribute("width", "2");
        innerRect.style.setProperty("width", "var(--sidebar-left-toggle-inner-width, 8.33%)");
      } else {
        innerRect.setAttribute("width", "5.76");
        innerRect.style.setProperty("width", "var(--sidebar-left-toggle-inner-width-open, 24%)");
      }
    }
  }

  /** 針對單一 Popout 注入（若已注入且仍連接著 DOM 則重新渲染按鈕）。 */
  injectForWindow(win: Window): void {
    if (!win || win.closed || !isPopoutWindow(win)) return;
    if (!this.isEnabled()) {
      this.cleanupWindow(win);
      return;
    }

    // 跳過 Obsidian 自己的 UI 視窗（如設定 popout：含 modal container），
    // 避免注入 Activity Bar / 攔截器影響其運作。
    const body = win.document?.body;
    if (!body) {
      this.cleanupWindow(win);
      return;
    }
    if (body.querySelector(".modal-container")) {
      this.cleanupWindow(win);
      return;
    }

    const existing = this.barsByWindow.get(win);
    if (existing && existing.left.isConnected) {
      this.renderWindow(win);
      return;
    }

    const spaceIdentity = body.createDiv({ cls: "window-spaces-space-identity" });
    const left = body.createDiv({ cls: "window-spaces-activity-bar window-spaces-activity-left" });
    // 只有左側 bar 有拖曳 handle（右上方是原生視窗控制鈕，不能遮蓋）
    left.createDiv({ cls: "window-spaces-activity-drag" });
    const right = body.createDiv({ cls: "window-spaces-activity-bar window-spaces-activity-right" });

    this.barsByWindow.set(win, {
      left,
      right,
      spaceIdentity,
      viewButtons: new Map(),
      columnButtons: {
        left: left.createEl("button", { cls: "window-spaces-activity-btn clickable-icon", attr: { type: "button", "aria-label": t("activityBar.toggleColumn") } }),
        right: right.createEl("button", { cls: "window-spaces-activity-btn clickable-icon", attr: { type: "button", "aria-label": t("activityBar.toggleColumn") } }),
      },
    });

    body.classList.add("window-spaces-has-left-activity");
    body.classList.add("window-spaces-has-right-activity");

    this.injectedWindows.add(win);

    this.renderWindow(win);
  }

  /** 移除單一 Popout 的 activity bar 與 body class。 */
  cleanupWindow(win: Window): void {
    const bars = this.barsByWindow.get(win);
    if (bars) {
      bars.left.remove();
      bars.right.remove();
      bars.spaceIdentity.remove();
    }
    this.barsByWindow.delete(win);
    this.injectedWindows.delete(win);
    const body = win.document?.body;
    body?.classList.remove("window-spaces-has-left-activity");
    body?.classList.remove("window-spaces-has-right-activity");
    body?.classList.remove("window-spaces-has-left-activity-hidden");
    body?.classList.remove("window-spaces-has-right-activity-hidden");
    body?.classList.remove("window-spaces-left-activity-hidden");
    body?.classList.remove("window-spaces-right-activity-hidden");
    this.clearTabHeaderAvoidance(win);
    body?.style.removeProperty("--window-space-color");
    body?.style.removeProperty("--window-space-border-inset");
    body?.classList.remove("has-window-space-color");
    body?.classList.remove("has-window-space-border");
    body?.classList.remove("has-window-space-folded-corner");
    body?.classList.remove("has-space-accents-tab");
    body?.classList.remove("has-space-accents-splitter");
    body?.classList.remove("has-space-accents-panel");
    body?.classList.remove("has-space-accents-activity-bar");
  }

  /** 清理所有已注入的 Popout。 */
  cleanupAll(): void {
    Array.from(this.injectedWindows).forEach((win) => this.cleanupWindow(win));
  }

  /** 重新注入並渲染所有存活 Popout，並清理已關閉視窗的殘留（layout-change 時呼叫）。 */
  refreshAll(): void {
    const live = this.engine.getLivePopoutWindows();
    live.forEach((win) => {
      this.injectForWindow(win);
      // 佈局改變後排程完整性檢查（補足側欄 / 藏起空側欄）
      this.scheduleLayoutIntegrityCheck(win);
    });

    Array.from(this.injectedWindows).forEach((win) => {
      if (!live.includes(win)) this.cleanupWindow(win);
    });
  }

  getLayoutForWindow(win: Window): WindowLayout | null {
    if (!win || win.closed) return null;

    // 1. 優先依 explicit _windowSpacesLayoutId 尋找
    const explicitId = (win as unknown as { _windowSpacesLayoutId?: string })._windowSpacesLayoutId;
    if (explicitId) {
      const found = this.settings.spaces.find((s) => s.id === explicitId);
      if (found) return found;
    }

    // 2. 依 manager 的 layoutNames (視窗名) 尋找對應 space
    const manager = (this.plugin as unknown as { manager?: { getLayoutNameForWindow?: (w: Window) => string | null; layoutWindows?: WeakMap<WindowLayout, Window> } }).manager;
    const name = manager?.getLayoutNameForWindow?.(win);
    if (name) {
      const found = this.settings.spaces.find((s) => s.name === name);
      if (found) return found;
    }

    // 3. 依 manager 的 layoutWindows 記憶體 map 反向比對
    for (const space of this.settings.spaces ?? []) {
      if (manager?.layoutWindows?.get(space) === win) {
        return space;
      }
    }

    return null;
  }

  private updateDragHandleIcon(bars: WindowBars, win: Window): void {
    const drag = bars.left.querySelector<HTMLElement>(".window-spaces-activity-drag");
    if (!drag) return;

    drag.empty();
    bars.spaceIdentity.empty();

    const layout = this.getLayoutForWindow(win);
    const icon = resolveSpaceIcon(layout?.icon, this.settings.defaultIcon);
    const color = layout?.color?.trim();
    const hasCustomColor = Boolean(color);
    const rawBorderInset = typeof layout?.borderInset === "number" && Number.isFinite(layout.borderInset)
      ? layout.borderInset
      : (this.settings.defaultBorderInset ?? 1);
    const borderInset = Math.max(0, Math.min(5, rawBorderInset));
    const showFoldedCorner = hasCustomColor && (layout?.showFoldedCorner ?? this.settings.defaultShowFoldedCorner !== false);

    const body = win.document?.body;
    if (body) {
      if (hasCustomColor) {
        body.style.setProperty("--window-space-color", color as string);
        body.classList.add("has-window-space-color");
      } else {
        body.style.removeProperty("--window-space-color");
        body.classList.remove("has-window-space-color");
      }
      if (hasCustomColor && borderInset > 0) {
        body.style.setProperty("--window-space-border-inset", `${borderInset}px`);
      } else {
        body.style.removeProperty("--window-space-border-inset");
      }
      body.classList.toggle("has-window-space-border", hasCustomColor && borderInset > 0);
      body.classList.toggle("has-window-space-folded-corner", showFoldedCorner);

      const accents = this.settings.popoutAccents ?? {
        enabled: true,
        splitter: true,
        activityBar: true,
      };
      const accentsActive = hasCustomColor && accents.enabled !== false;
      // tab 裝飾（soft tint / tab 分隔線 / container border）與 panel border 為常態 accent，
      // 只需 enabled；splitter 與 activity bar 有各自獨立選項。
      body.classList.toggle("has-space-accents-tab", accentsActive);
      body.classList.toggle("has-space-accents-splitter", accentsActive && accents.splitter !== false);
      body.classList.toggle("has-space-accents-panel", accentsActive);
      body.classList.toggle("has-space-accents-activity-bar", accentsActive && accents.activityBar !== false);
    }

    const isEmoji = isSpaceEmoji(icon);
    if (isEmoji) {
      bars.spaceIdentity.createSpan({ cls: "window-spaces-space-icon window-spaces-drag-emoji", text: icon });
    } else {
      const iconEl = bars.spaceIdentity.createDiv({ cls: "window-spaces-space-icon window-spaces-drag-icon" });
      if (!setIconWithCheck(iconEl, icon)) {
        setIcon(iconEl, "square");
      }
    }
    bars.spaceIdentity.setAttribute("aria-label", layout?.name || "Window Space");
  }

  /** 重建指定視窗的按鈕內容。 */
  renderWindow(win: Window): void {
    void this.ensureLayoutColumns(win).then(() => this.renderWindowNow(win));
    this.renderWindowNow(win);
    // activity bar 設定/空間切換後，排程完整性檢查（補欄 / 藏起 / 解除隱藏）
    this.scheduleLayoutIntegrityCheck(win);
  }

  private renderWindowNow(win: Window): void {
    const bars = this.barsByWindow.get(win);
    if (!bars) return;

    this.updateDragHandleIcon(bars, win);
    const body = win.document?.body;
    if (body) {
      const leftVisible = this.isSideVisibleForWindow(win, "left");
      const rightVisible = this.isSideVisibleForWindow(win, "right");
      bars.spaceIdentity.classList.toggle(
        "window-spaces-space-identity-drag-region",
        !leftVisible,
      );
      body.classList.toggle("window-spaces-has-left-activity", leftVisible);
      body.classList.toggle("window-spaces-has-right-activity", rightVisible);
      body.classList.toggle("window-spaces-left-activity-hidden", !leftVisible);
      body.classList.toggle("window-spaces-right-activity-hidden", !rightVisible);
      this.updateTabHeaderAvoidance(win, leftVisible);
    }
    this.renderBar(bars, win, "left");
    this.renderBar(bars, win, "right");
    this.applySavedLayoutDimensions(win);
    this.updateActiveStates(win);
  }

  /**
   * When the left Activity Bar is hidden, reserve its exact width only in
   * the first tab header of the first visible root column. A root column may
   * contain multiple stacked split headers, so the class belongs on the
   * header itself rather than on the whole column.
   */
  private updateTabHeaderAvoidance(win: Window, leftActivityVisible: boolean): void {
    this.clearTabHeaderAvoidance(win);
    if (leftActivityVisible) return;

    const firstVisibleColumn = this.engine
      .getTopLevelColumnElements(win)
      .find((column) => !isElementHidden(column));
    const firstTabHeader = firstVisibleColumn?.querySelector<HTMLElement>(
      ".workspace-tab-header-container"
    );
    firstTabHeader?.classList.add("window-spaces-space-identity-tab-header");
  }

  private clearTabHeaderAvoidance(win: Window): void {
    win.document
      .querySelectorAll<HTMLElement>(".window-spaces-space-identity-tab-header")
      .forEach((header) => header.classList.remove("window-spaces-space-identity-tab-header"));
  }

  private renderBar(bars: WindowBars, win: Window, side: PopoutSide): void {
    const bar = side === "left" ? bars.left : bars.right;
    const isVisible = this.isSideVisibleForWindow(win, side);
    bar.classList.toggle("window-spaces-activity-hidden", !isVisible);

    // 移除舊的 view 按鈕與分隔線（保留 bar 容器與固定按鈕）。
    // viewButtons 同時保存左右兩側的按鈕，因此只清理目前這一側。
    bar.querySelectorAll(".window-spaces-activity-view, .window-spaces-activity-divider").forEach((el) => {
      bars.viewButtons.forEach((button, key) => {
        if (button === el) bars.viewButtons.delete(key);
      });
      el.remove();
    });

    // 固定控制按鈕：插入於 drag handle 之後、視圖按鈕之前
    const colBtn = side === "left" ? bars.columnButtons.left : bars.columnButtons.right;
    const isHidden = this.engine.isColumnHidden(win, side);
    this.applySidebarToggleIcon(colBtn, side, isHidden);
    colBtn.onclick = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      void this.toggleColumn(win, side);
    };
    const drag = bar.querySelector<HTMLElement>(".window-spaces-activity-drag");
    if (drag) {
      drag.after(colBtn);
    } else {
      bar.prepend(colBtn);
    }

    // 固定控制與 view 按鈕之間的分隔線
    bar.createDiv({ cls: "window-spaces-activity-divider" });

    const items = this.getItemsForWindowSide(win, side);
    const configuredTypes = new Set<string>();

    for (const item of items) {
      const label = item.label || resolveViewLabel(this.app, item.viewType);
      const btn = bar.createEl("button", {
        cls: "window-spaces-activity-btn window-spaces-activity-view clickable-icon",
        attr: { type: "button", "aria-label": label },
      });
      // 自訂 icon 優先，否則走 A+B 機制
      applyItemIcon(btn, this.app, item);
      btn.onclick = (evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        void this.toggleView(win, item);
      };
      bars.viewButtons.set(`${side}:${item.viewType}`, btn);
      configuredTypes.add(item.viewType);
    }
  }

  /** 更新所有按鈕的 active 狀態。 */
  updateActiveStates(win: Window): void {
    const bars = this.barsByWindow.get(win);
    if (!bars) return;

    this.syncSidebarColumnClasses(win);
    // 拖曳 tab 後 Obsidian 會非同步重建頂層欄位結構（例如把 workspace-tabs 拆成
    // 巢狀 workspace-split），且可能在 layout-change 事件之後才完成。因此延遲到
    // 下一幀再重新同步一次，確保新產生的容器 / tab group 也套用到 sidebar class。
    this.scheduleDeferredSync(win);

    bars.viewButtons.forEach((btn, key) => {
      // 以按鈕所屬的 bar 判定側（同側的 view 按鈕只反映自己側欄的狀態）
      const side: PopoutSide = bars.left.contains(btn) ? "left" : "right";
      const viewType = key.slice(key.indexOf(":") + 1);
      const columnEl = this.engine.getColumnElement(win, side);
      let active = false;
      if (columnEl) {
        const leaf = this.engine.findLeafOfTypeInColumn(win, columnEl, viewType);
        if (leaf) {
          active = this.isLeafVisibleInSideColumn(win, side, leaf);
        }
      }
      btn.classList.toggle("is-active", active);
    });

    this.setColumnActive(bars, win, "left");
    this.setColumnActive(bars, win, "right");
  }

  /** 判斷 Leaf 在所屬 Popout 側欄中是否處於 active (可見/選中) 狀態。 */
  private isLeafVisibleInSideColumn(win: Window, side: PopoutSide, leaf: WorkspaceLeaf): boolean {
    if (this.engine.isColumnHidden(win, side)) return false;

    const extLeaf = leaf as unknown as { containerEl?: HTMLElement; tabEl?: HTMLElement };
    const container = extLeaf.containerEl;
    if (!container) return false;

    if (extLeaf.tabEl?.classList.contains("is-active")) return true;

    const parent = container.parentElement;
    if (!parent) return false;

    const isHidden =
      container.classList.contains("mod-hidden") ||
      container.style.display === "none" ||
      parent.style.display === "none" ||
      parent.classList.contains("mod-hidden");

    return !isHidden;
  }

  /**
   * 將視窗最左/最右的頂層欄位標記為 sidebar column，並套用 Obsidian 的
   * sidebar 相關 class（mod-sidedock / mod-left-split / mod-right-split），
   * 使其 tab 使用與主視窗 sidebar 一致的樣式，且讓側欄的 resize handle 可拖曳。
   *
   * 注意：`.workspace-split` 容器也會套用這些 class——Obsidian 的
   * `.workspace-split.mod-left-split, .workspace-split.mod-right-split { flex: 0 0 auto }`
   * 確實會把巢狀 split 容器壓扁成 width 0，因此 styles.css 以相同 specificity、
   * 較晚載入的非 important `flex: 1 1 0` 覆蓋它，同時保留 Obsidian 的 inline
   * `flex-grow`（popout 的 resize 機制），sidebar 才不會消失、也才能拖寬。
   */
  private syncSidebarColumnClasses(win: Window): void {
    // 初始化中的視窗暫停同步：依序建左右側欄的過渡狀態（2 欄）會被誤判為
    // 「左側欄 + 右側欄」，把中央編輯區標成側欄。初始化完成後再統一同步。
    if (this.initializingWindows.has(win)) return;
    const columns = this.engine.getTopLevelColumnElements(win);
    const last = columns.length - 1;
    const leftActivityVisible = this.isSideVisibleForWindow(win, "left");
    const rightActivityVisible = this.isSideVisibleForWindow(win, "right");
    columns.forEach((el, index) => {
      // 規則：activity bar 旁的最外層欄位就是 sidebar（不看欄位內容 / 巢狀結構）。
      // 該側 activity bar 隱藏時，其鄰近欄位是 content，維持一般樣式。
      // hidden（toggle 收合）的欄位仍依結構標記為 sidebar，只是狀態是收合。
      const isLeftSidebar = columns.length >= 2
        && leftActivityVisible
        && index === 0;
      const isRightSidebar = columns.length >= 2
        && rightActivityVisible
        && index === last;
      const isSidebar = isLeftSidebar || isRightSidebar;
      el.classList.toggle("window-spaces-sidebar-column", isSidebar);
      el.classList.toggle("mod-sidedock", isSidebar);
      el.classList.toggle("mod-left-split", isLeftSidebar);
      el.classList.toggle("mod-right-split", isRightSidebar);
      const tabGroups = this.getSidebarTabGroups(el);
      tabGroups.forEach((tabsEl) => {
        tabsEl.classList.toggle("mod-sidedock", isSidebar);
        tabsEl.classList.toggle("mod-left-split", isLeftSidebar);
        tabsEl.classList.toggle("mod-right-split", isRightSidebar);
      });
      if (isSidebar) {
        this.ensureSidebarFileTabIcons(win, el);
      }
    });
  }

  /**
   * 判斷欄位內是否包含 editor 型 view（markdown / pdf / canvas 等內容 view）。
   *
   * 已停用：sidebar 判定改為「activity bar 旁就是 sidebar」，不再依欄位內容。
   * 保留定義以防外部引用；不再被調用。
   */
  private columnContainsEditor(win: Window, columnEl: HTMLElement): boolean {
    const editorViewTypes = new Set(["markdown", "pdf", "canvas", "excalidraw", "image", "audio", "video"]);
    const leaves = this.engine.getLeavesForWindow(win);
    for (const leaf of leaves) {
      const extLeaf = leaf as unknown as { containerEl?: HTMLElement };
      const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
      if (container instanceof HTMLElement && columnEl.contains(container)) {
        const type = leaf.getViewState()?.type;
        if (type && editorViewTypes.has(type)) return true;
      }
    }
    // DOM 特徵補強（view 已渲染但 leaf 尚未建立關聯時）
    return (
      columnEl.querySelector(
        ".markdown-source-view, .markdown-reading-view, .canvas-wrapper, .pdf-container, .excalidraw-wrapper"
      ) !== null
    );
  }

  /**
   * activity bar 隱藏時，該側欄位是 content area（不可隱藏）。
   * 若欄位正被 toggle 隱藏（狀態 4），強制解除隱藏，否則使用者永遠無法
   * 把這個被隱藏的 column 叫出來（activity bar 已不存在，沒有 toggle 鈕）。
   */
  private ensureContentColumnNotHidden(win: Window, side: PopoutSide): void {
    const edge = this.engine.getEdgeColumnElement(win, side);
    if (!edge) return;
    if (edge.classList.contains("window-spaces-column-hidden") || edge.style.display === "none") {
      edge.classList.remove("window-spaces-column-hidden");
      setElementDisplay(edge, "");
    }
  }

  /** 取得欄位內需要套用 sidebar 樣式的 tab group 元素（不含 split 容器本身）。 */
  private getSidebarTabGroups(columnEl: HTMLElement): HTMLElement[] {
    if (columnEl.classList.contains("workspace-tabs")) {
      return [columnEl];
    }
    return Array.from(columnEl.querySelectorAll<HTMLElement>(".workspace-tabs"));
  }

  /**
   * 於下一幀重新同步 sidebar class。Obsidian 拖曳 tab 時會非同步重建頂層欄位
   * 結構（例如把單一 workspace-tabs 拆成巢狀 workspace-split），重建可能在
   * layout-change 事件之後才完成；此延遲確保新節點也能套用到 sidebar 樣式，
   * 避免 sidebar 視覺樣式在拖曳後失效。
   */
  private scheduleDeferredSync(win: Window): void {
    const raf =
      (win && typeof win.requestAnimationFrame === "function" ? win.requestAnimationFrame : window.requestAnimationFrame).bind(
        win && typeof win.requestAnimationFrame === "function" ? win : window
      );
    raf(() => {
      if (win.closed) return;
      raf(() => {
        if (win.closed) return;
        if (this.barsByWindow.has(win)) {
          this.syncSidebarColumnClasses(win);
        }
      });
    });
  }

  /** DOM fallback：側欄中頁籤若無 icon（部分情境 Obsidian 不渲染），補上 icon。 */
  private ensureSidebarFileTabIcons(win: Window, columnEl: HTMLElement): void {
    columnEl.querySelectorAll<HTMLElement>(".workspace-tab-header").forEach((tabEl) => {
      let iconEl = tabEl.querySelector<HTMLElement>(".workspace-tab-header-inner-icon");
      if (!iconEl) {
        iconEl = tabEl.createDiv({ cls: "workspace-tab-header-inner-icon" });
        tabEl.prepend(iconEl);
      }
      if (iconEl.querySelector("svg")) return;

      const viewType = tabEl.getAttribute("data-type") || "markdown";
      // 該 tab 對應的 leaf 一定開在目前欄位內：直接取 view 實體的 icon，避免全域掃描
      const leaf = this.engine.findLeafOfTypeInColumn(win, columnEl, viewType);
      const leafIcon = leaf ? (leaf.view as { getIcon?: () => string }).getIcon?.() : "";
      if (leafIcon && setIconWithCheck(iconEl, leafIcon)) return;
      applyViewIcon(iconEl, this.app, viewType);
    });
  }

  private setColumnActive(bars: WindowBars, win: Window, side: PopoutSide): void {
    const columnEl = this.engine.getColumnElement(win, side);
    const hidden = !!columnEl && this.engine.isColumnHidden(win, side);
    const active = !!columnEl && !hidden;
    bars.columnButtons[side].classList.toggle("is-active", active);
    // 2026-02 反饋：toggle 永不休用。該側沒有物理側欄欄位時，點擊改為開啟活動列
    // 第一個 view 按鈕對應的 view；若無任何 view 按鈕則開啟系統預設 New Tab。
    bars.columnButtons[side].classList.remove("is-disabled");
    bars.columnButtons[side].disabled = false;
    // 依開合狀態切換 toggle 圖示（模仿主視窗）
    this.applySidebarToggleIcon(bars.columnButtons[side], side, hidden);
  }

  /** 該視窗是否已注入 Activity Bar（供攔截器判斷是否為本外掛管理的視窗）。 */
  isInjected(win: Window): boolean {
    return this.barsByWindow.has(win);
  }

  /** 更新所有已注入視窗的 active 狀態（layout-change 時呼叫）。 */
  updateActiveStatesAll(): void {
    Array.from(this.injectedWindows).forEach((win) => this.updateActiveStates(win));
  }

  // ===== 佈局完整性守護 =====

  private integrityCheckTimers = new Map<Window, number>();
  private autoHideBlockedUntil = new WeakMap<Window, { left: number; right: number }>();
  /** 補欄嘗試時間戳（防護：createLeafBySplit 建欄失敗時避免無限重試循環） */
  private columnFillAttempts = new WeakMap<Window, { left: number; right: number }>();

  /**
   * 排程佈局完整性檢查（debounced）。layout-change 事件觸發時 Obsidian 可能
   * 仍在異步重建頂層欄位（例如拖曳 tab 後把 workspace-tabs 拆成巢狀 split），
   * 因此延遲一段時間等結構穩定後再檢查，避免在重建途中誤判。
   */
  scheduleLayoutIntegrityCheck(win: Window): void {
    if (!win || win.closed || !this.barsByWindow.has(win)) return;
    const existing = this.integrityCheckTimers.get(win);
    if (existing !== undefined) {
      win.clearTimeout(existing);
    }
    const timer = win.setTimeout(() => {
      this.integrityCheckTimers.delete(win);
      if (win.closed || !this.barsByWindow.has(win)) return;
      void this.ensureLayoutIntegrity(win);
    }, 350);
    this.integrityCheckTimers.set(win, timer);
  }

  /**
   * 檢查並修正 Popout 的頂層佈局結構，維持「activity bar 旁就是 sidebar」
   * 的三欄語意：
   *
   * 1. 補足缺失的側欄欄位：兩側 activity bar 可見時，頂層必須有
   *    [left sidebar, content, right sidebar] 三欄。側欄在 close all 後被
   *    Obsidian 清空/移除時，補一個空的側欄欄位（New Tab），避免使用者
   *    拖曳 tab 時 Obsidian 建立「大欄包小欄」的巢狀結構。
   * 2. 藏起空的側欄：側欄欄位內只剩 New Tab（empty leaf）時藏起整個欄位
   *    （模仿 Obsidian 主視窗：tabs 全被關掉 → 先藏起左邊欄）。使用者點
   *    activity bar 的 toggle 按鈕時，再顯示空 panel 提醒開一個新的 view。
   */
  private async ensureLayoutIntegrity(win: Window): Promise<void> {
    if (!win || win.closed) return;
    try {
      const plugin = this.plugin as unknown as { manager?: { isRestoringLayout?: boolean } };
      if (plugin.manager?.isRestoringLayout) return;

      // 1. 依 activity bar 可見性建立/更新 hints（記錄原始欄位數）
      this.ensureSidebarHints(win);

      const leftVisible = this.isSideVisibleForWindow(win, "left");
      const rightVisible = this.isSideVisibleForWindow(win, "right");

      // 2. 補足側欄欄位（getColumnElement null → 補帶預設 view 的欄位）
      this.ensureSideColumnPresent(win, "left", leftVisible);
      this.ensureSideColumnPresent(win, "right", rightVisible);

      // 3. 欄位狀態整理（側欄收合狀態機）
      const blocked = this.autoHideBlockedUntil.get(win);
      const now = Date.now();
      for (const side of ["left", "right"] as const) {
        const visible = side === "left" ? leftVisible : rightVisible;
        const columnEl = this.engine.getColumnElement(win, side);
        if (visible) {
          // 是 sidebar：只剩 New Tab（empty leaf）→ 藏起（模仿 Obsidian 主視窗
          // 的 close all 行為）；使用者點 toggle 可展開空 panel 開新 view
          if (blocked && blocked[side] > now) continue;
          if (columnEl && !this.columnHasNonEmptyLeaf(win, columnEl)) {
            this.engine.hideColumn(win, side);
          }
        } else {
          // 不是 sidebar（activity bar 隱藏）→ 欄位是 content area，不可隱藏。
          // 若正被 toggle 隱藏（狀態 4）→ 強制解除，否則使用者無法叫出它。
          this.ensureContentColumnNotHidden(win, side);
        }
      }

      this.syncSidebarColumnClasses(win);
      this.updateActiveStates(win);
    } catch (error) {
      console.warn("[Window Spaces] Layout integrity check failed:", error);
    }
  }

  /**
   * 若指定側的物理側欄欄位缺失，補一個帶預設 view 的側欄欄位。
   *
   * 判斷依據：getColumnElement 依「需求欄位數」（原始欄位數 + activity bar
   * 新開啟的側數）決定該側是否有側欄。close all 清空/移除側欄後欄位數不足，
   * 會回 null → 需要補欄。補欄以該側最外欄位的第一個 leaf（或任一 leaf）為
   * 基準建立新的頂層欄位，並顯示該側 activity bar 設定的第一個 view。
   *
   * 防護（避免 layout 循環）：
   * - edge 是巢狀 split（workspace-split）時跳過——createLeafBySplit 會把
   *   新欄位建在該 split 內部（錯誤層級），頂層欄位數不會增加。
   * - 補欄後若欄位數未增加 → 短時間內不重試，防止每次 layout-change 都補欄。
   *
   * @returns 建立的 leaf（若建立成功），否則 null。
   */
  private ensureSideColumnPresent(win: Window, side: PopoutSide, visible: boolean): WorkspaceLeaf | null {
    if (!visible) return null;
    // 欄位已存在（無論是否藏起）→ 不需要補
    if (this.engine.getColumnElement(win, side)) return null;

    // 補欄失敗防護：短時間內不重複嘗試（防止建欄在錯誤層級造成的無限循環）
    const now = Date.now();
    const lastAttempt = this.columnFillAttempts.get(win);
    if (lastAttempt && lastAttempt[side] > now - 3000) return null;

    const workspace = this.engine.workspace;
    if (typeof workspace.createLeafBySplit !== "function") return null;

    // 以該側最外欄位的第一個 leaf 為 split 基準；完全沒有欄位時用任一 leaf。
    // 注意：edge 是巢狀 split（workspace-split）時，createLeafBySplit 會把新
    // 欄位建在該 split 內部（錯誤層級），頂層欄位數不會增加 → 直接跳過不補。
    const edge = this.engine.getEdgeColumnElement(win, side);
    if (edge && !edge.classList.contains("workspace-tabs")) return null;
    const targetLeaf =
      (edge ? this.getFirstLeafInColumn(edge) : null) ||
      this.engine.getActiveLeafInWindow(win) ||
      this.engine.getLastLeafInWindow(win);
    if (!targetLeaf) return null;

    // before=true 把新欄位放在最左（左側欄）；before=false 放在最右（右側欄）
    const before = side === "left";
    const topCountBefore = this.engine.getTopLevelColumnElements(win).length;
    const panelLeaf = workspace.createLeafBySplit(targetLeaf, "vertical", before);

    // 帶該側 activity bar 設定的第一個 view（與舊 space 開啟側邊欄的行為一致）
    const viewType = this.getItemsForWindowSide(win, side)[0]?.viewType;
    if (panelLeaf && viewType && typeof panelLeaf.setViewState === "function") {
      void panelLeaf.setViewState({ type: viewType, active: false, state: {} });
    }

    // 記錄嘗試時間；若欄位數未增加（建欄失敗），下次需等 3 秒後才重試
    const attempts = { ...(lastAttempt || { left: 0, right: 0 }), [side]: now };
    this.columnFillAttempts.set(win, attempts);

    // 補欄後驗證：欄位數有增加才視為成功（成功後 10 秒內不重複補）
    if (this.engine.getTopLevelColumnElements(win).length > topCountBefore) {
      attempts[side] = now + 10000;
      this.columnFillAttempts.set(win, attempts);
    }
    return panelLeaf || null;
  }

  /** 欄位內是否存在非 New Tab 的 leaf（empty leaf 視為空）。 */
  private columnHasNonEmptyLeaf(win: Window, columnEl: HTMLElement): boolean {
    let has = false;
    this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (has) return;
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
      if (container instanceof HTMLElement && columnEl.contains(container)) {
        const type = leaf.getViewState()?.type;
        if (type && type !== "empty") has = true;
      }
    });
    return has;
  }

  /** 取得欄位元素內的第一個 leaf。 */
  private getFirstLeafInColumn(columnEl: HTMLElement): WorkspaceLeaf | null {
    let found: WorkspaceLeaf | null = null;
    this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (found) return;
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
      if (container instanceof HTMLElement && columnEl.contains(container)) {
        found = leaf;
      }
    });
    return found;
  }

  /** 使用者手動展開側欄後，在一段時間內不自動藏起。 */
  private markColumnAutoHideBlocked(win: Window, side: PopoutSide, ms: number): void {
    const existing = this.autoHideBlockedUntil.get(win) || { left: 0, right: 0 };
    existing[side] = Date.now() + ms;
    this.autoHideBlockedUntil.set(win, existing);
  }

  // ===== 互動邏輯 =====

  private async toggleView(win: Window, item: ActivityBarItem): Promise<void> {
    const side = item.side;
    // 只在自己的側欄欄位內找該 view（不跨中央編輯區 / 不跨對側 sidebar）
    const columnEl = this.engine.getColumnElement(win, side);
    const leaf = columnEl ? this.engine.findLeafOfTypeInColumn(win, columnEl, item.viewType) : null;

    if (leaf) {
      if (this.engine.isColumnHidden(win, side)) {
        // 側欄隱藏中 → 顯示並切到該 view
        this.engine.showColumn(win, side);
        await this.revealAndActivate(leaf);
      } else {
        // 側欄顯示中：僅當該 view 目前就是側欄中「可見/顯示中」的 view 時才關閉（toggle off）。
        // 判斷以容器可見性為準（背景 tab 內容為 display:none），而非 tab 的 is-active
        // （is-active 對應視窗 active leaf，點擊側欄外的 view 時會被移除）。
        if (this.isLeafVisibleInSideColumn(win, side, leaf)) {
          this.engine.hideColumn(win, side);
        } else {
          await this.revealAndActivate(leaf);
        }
      }
    } else {
      // 自己側欄內沒有該 view（即使它存在於中央編輯區或對側 sidebar）→ 開在自己側欄
      const created = this.ensureSideColumnPresent(win, side, true);
      if (created && typeof created.setViewState === "function") {
        // 側欄欄位剛建立 → 直接設定 view（並帶該側 activity bar 的預設 view 已由
        // ensureSideColumnPresent 設定；此處覆寫為使用者點擊的 view）
        await created.setViewState({ type: item.viewType, active: true, state: {} });
      } else {
        await this.engine.ensureSideColumn(win, side, item.viewType);
      }
      // 側欄可能被完整性守護藏起（只剩 New Tab）→ 顯示，讓使用者看到剛開啟的 view
      if (this.engine.isColumnHidden(win, side)) {
        this.engine.showColumn(win, side);
        this.markColumnAutoHideBlocked(win, side, 3000);
      }
    }

    this.updateActiveStates(win);
  }

  private async revealAndActivate(leaf: WorkspaceLeaf): Promise<void> {
    try {
      await this.app.workspace.revealLeaf(leaf);
      this.app.workspace.setActiveLeaf(leaf, { focus: true });
    } catch {
      // Ignore focus error
    }
  }

  private async toggleColumn(win: Window, side: PopoutSide): Promise<void> {
    const columnEl = this.engine.getColumnElement(win, side);
    if (!columnEl) {
      // 2026-02 反饋：無側欄欄位時改為顯示活動列第一個 view 按鈕對應的 view；
      // 若無 view 按鈕則開啟系統預設 New Tab。
      await this.openFallbackViewForSide(win, side);
      return;
    }

    if (this.engine.isColumnHidden(win, side)) {
      this.engine.showColumn(win, side);
      // 使用者主動展開（可能只是要看空的 New Tab 提醒）→ 短時間內不自動藏起
      this.markColumnAutoHideBlocked(win, side, 3000);
      await this.ensureColumnViewsRendered(win, columnEl);
    } else {
      // 防呆：若隱藏後沒有任何可見欄位，則拒絕
      if (this.engine.getVisibleColumnCount(win) < 2) {
        new Notice(t("activityBar.cannotHideLastPane"));
        return;
      }
      this.engine.hideColumn(win, side);
    }
    // 側欄收合：flex-grow 權重語意下，display:none 的欄位不參與 flex 佈局，
    // 剩餘欄位依權重自動重新分配填滿，不需手動 rebalance。
    // The column toggle changes pane visibility, not Activity Bar settings.
    // Recompute only the tab-header marker here so lightweight test/mocked
    // windows do not need the full Activity Bar DOM renderer.
    this.updateTabHeaderAvoidance(win, this.isSideVisibleForWindow(win, "left"));
    // Refresh the toggle button's open/collapsed SVG state and each view
    // button's active state after the column visibility changed.
    this.updateActiveStates(win);
  }

  /** 側欄無物理欄位時：開啟活動列第一個 view 按鈕對應的 view；若無 view 按鈕則開啟 New Tab。 */
  private async openFallbackViewForSide(win: Window, side: PopoutSide): Promise<void> {
    const layout = this.getLayoutForWindow(win);
    const items = layout?.activityBars?.[side]?.items ?? [];
    if (items.length > 0) {
      await this.toggleView(win, items[0]);
      return;
    }
    try {
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.setViewState({ type: "empty", active: true, state: {} });
      this.app.workspace.setActiveLeaf(leaf, { focus: true });
    } catch (e) {
      console.warn("Failed to open default New Tab:", e);
    }
  }

  /**
   * Views restored into a hidden sidebar can remain DeferredViews with an
   * empty container. Once the sidebar becomes visible, load and render every
   * leaf in that column so split panels such as Tags and Search are populated.
   */
  private async ensureColumnViewsRendered(win: Window, columnEl: HTMLElement): Promise<void> {
    const leaves = this.engine.getLeavesForWindow(win).filter((leaf) => {
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
      const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
      return container instanceof HTMLElement && columnEl.contains(container);
    });

    const manager = (this.plugin as unknown as {
      manager?: {
        ensureViewRendered?: (leaf: WorkspaceLeaf) => void;
        scheduleViewRenderAfterActivation?: (leaf: WorkspaceLeaf, targetWin: Window) => void;
      };
    }).manager;

    for (const leaf of leaves) {
      const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf & {
        isDeferred?: boolean;
        loadIfDeferred?: () => Promise<void>;
      };
      if (extLeaf.isDeferred && typeof extLeaf.loadIfDeferred === "function") {
        try {
          await extLeaf.loadIfDeferred();
        } catch {
          // A later render attempt may still recover the view.
        }
      }
      manager?.ensureViewRendered?.(leaf);
      manager?.scheduleViewRenderAfterActivation?.(leaf, win);
    }
  }
}
