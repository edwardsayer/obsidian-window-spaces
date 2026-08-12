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
  ExtendedWorkspaceLeaf,
  PopoutLayoutEngine,
  PopoutSide,
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
  private sidebarHintsByWindow = new WeakMap<Window, { left: boolean; right: boolean }>();
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
      let hints = this.sidebarHintsByWindow.get(win) || this.getEngineSidebarHints(win);

      if (!hints) {
        // Infer the physical endpoints once for legacy Spaces. Three columns
        // already imply both sidebars; two columns use the requested side (or
        // native Obsidian split classes when available). Keep this physical
        // mapping even if an Activity Bar is later hidden, so re-enabling the
        // other side does not create duplicate columns.
        const columns = this.engine.getTopLevelColumnElements(win);
        const hasLeftClass = columns[0]?.classList.contains("mod-left-split") === true;
        const hasRightClass = columns[columns.length - 1]?.classList.contains("mod-right-split") === true;
        hints = initialColumns >= 3
          ? { left: true, right: true }
          : initialColumns <= 1
            ? { left: false, right: false }
            : hasLeftClass || hasRightClass
              ? { left: hasLeftClass, right: hasRightClass }
              : { left: leftVisible && !rightVisible, right: rightVisible && !leftVisible };
      }
      this.setEngineSidebarHints(win, hints);

      const ensureSide = async (side: PopoutSide) => {
        if (!((side === "left" ? leftVisible : rightVisible) && !hints?.[side])) return;
        await this.engine.ensureSideColumn(win, side, this.getItemsForWindowSide(win, side)[0]?.viewType);
        hints = { ...(hints || { left: false, right: false }), [side]: true };
        this.setEngineSidebarHints(win, hints);
      };

      await ensureSide("left");
      await ensureSide("right");

      // `hints` describes physical sidebar columns, not current Activity Bar
      // visibility. Preserve it while a bar is hidden so a later toggle can
      // reuse the existing column instead of splitting it again.
      const finalHints = hints || { left: false, right: false };
      this.sidebarHintsByWindow.set(win, finalHints);
      this.setEngineSidebarHints(win, finalHints);

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

  private getEngineSidebarHints(win: Window): { left: boolean; right: boolean } | undefined {
    const engineWithSidebarHints = this.engine as PopoutLayoutEngine & {
      getSidebarSides?: (targetWin: Window) => { left: boolean; right: boolean } | undefined;
    };
    return engineWithSidebarHints.getSidebarSides?.(win);
  }

  private setEngineSidebarHints(win: Window, hints: { left: boolean; right: boolean }): void {
    this.sidebarHintsByWindow.set(win, { ...hints });
    const engineWithSidebarHints = this.engine as PopoutLayoutEngine & {
      setSidebarSides?: (targetWin: Window, sides: { left: boolean; right: boolean }) => void;
    };
    engineWithSidebarHints.setSidebarSides?.(win, hints);
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
        left: left.createEl("button", { cls: "window-spaces-activity-btn clickable-icon", attr: { type: "button", "aria-label": t("activityBar.toggleColumn"), title: t("activityBar.toggleColumn") } }),
        right: right.createEl("button", { cls: "window-spaces-activity-btn clickable-icon", attr: { type: "button", "aria-label": t("activityBar.toggleColumn"), title: t("activityBar.toggleColumn") } }),
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
  }

  /** 清理所有已注入的 Popout。 */
  cleanupAll(): void {
    Array.from(this.injectedWindows).forEach((win) => this.cleanupWindow(win));
  }

  /** 重新注入並渲染所有存活 Popout，並清理已關閉視窗的殘留（layout-change 時呼叫）。 */
  refreshAll(): void {
    const live = this.engine.getLivePopoutWindows();
    live.forEach((win) => this.injectForWindow(win));

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
    const hasCustomBorderInset = typeof layout?.borderInset === "number" && Number.isFinite(layout.borderInset);
    const borderInset = hasCustomBorderInset
      ? Math.max(0, Math.min(20, layout?.borderInset as number))
      : 0;
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
      if (hasCustomColor && hasCustomBorderInset) {
        body.style.setProperty("--window-space-border-inset", `${borderInset}px`);
      } else {
        body.style.removeProperty("--window-space-border-inset");
      }
      body.classList.toggle("has-window-space-border", hasCustomColor && hasCustomBorderInset && borderInset > 0);
      body.classList.toggle("has-window-space-folded-corner", showFoldedCorner);
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
        attr: { type: "button", "aria-label": label, title: label },
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
    const columns = this.engine.getTopLevelColumnElements(win);
    const last = columns.length - 1;
    const engineWithSidebarHints = this.engine as PopoutLayoutEngine & {
      getSidebarSides?: (targetWin: Window) => { left: boolean; right: boolean } | undefined;
    };
    const configuredSides = engineWithSidebarHints.getSidebarSides?.(win);
    const leftActivityVisible = this.isSideVisibleForWindow(win, "left");
    const rightActivityVisible = this.isSideVisibleForWindow(win, "right");
    columns.forEach((el, index) => {
      // Only a column adjacent to a visible Activity Bar is a visual sidebar.
      // If the bar is hidden, its neighboring column is content and must keep
      // the normal editor background/tab presentation.
      const isLeftSidebar = columns.length >= 2
        && leftActivityVisible
        && (configuredSides ? configuredSides.left : true)
        && index === 0;
      const isRightSidebar = columns.length >= 2
        && rightActivityVisible
        && (configuredSides ? configuredSides.right : true)
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
      await this.engine.ensureSideColumn(win, side, item.viewType);
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
    if (!columnEl) return;

    if (this.engine.isColumnHidden(win, side)) {
      this.engine.showColumn(win, side);
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
