import { App, Menu, Notice, WorkspaceLeaf, setIcon } from "obsidian";
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

interface ColumnFlexEntry {
  element: HTMLElement;
  flexGrow: number;
}

interface SidebarFlexSnapshot {
  left: ColumnFlexEntry | null;
  center: ColumnFlexEntry[];
  right: ColumnFlexEntry | null;
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
  private plugin: { app: App; settings: WindowSettings; saveSettings?: () => Promise<void> };
  private engine: PopoutLayoutEngine;
  private barsByWindow = new WeakMap<Window, WindowBars>();
  private injectedWindows = new Set<Window>();
  /** 初始化中的視窗：初始化期間暫停 syncSidebarColumnClasses，避免過渡狀態誤判。 */
  private initializingWindows = new Set<Window>();
  private sidebarHintsByWindow = new WeakMap<Window, SidebarSides>();
  private columnEnsurePromises = new WeakMap<Window, Promise<void>>();
  /** Preserve live column weights while one sidebar is temporarily hidden. */
  private sidebarFlexSnapshots = new WeakMap<Window, SidebarFlexSnapshot>();

  constructor(plugin: { app: App; settings: WindowSettings; saveSettings?: () => Promise<void> }, engine: PopoutLayoutEngine) {
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
      // Sidebar rebuilds invoke restoreOpenSpaceInPlace(), which renders the
      // target window while its new tree is still being assembled. Do not let
      // this asynchronous guard observe the transient column count and create
      // a second copy of the sidebar; the rebuild's final render will run the
      // normal column reconciliation against the completed tree.
      const manager = this.plugin as unknown as {
        manager?: {
          isRebuildingPopoutLayout?: boolean;
          isRestoringLayout?: boolean;
        };
      };
      if (manager.manager?.isRebuildingPopoutLayout) return;

      const layout = this.getLayoutForWindow(win);
      if (!layout) return;

      const leftVisible = this.isSideVisibleForWindow(win, "left");
      const rightVisible = this.isSideVisibleForWindow(win, "right");
      const initialColumns = this.engine.getTopLevelColumnElements(win).length;

      // A restored Space stores activity-bar settings separately from its
      // content tree. For nested layouts (2x2 is a representative case),
      // createLeafBySplit would anchor a missing sidebar inside the first
      // content row. Reuse the target-only tree rebuild instead so the
      // original nested content split remains one content column.
      // During restore, non-editor/sidebar views are still being materialized.
      // A temporary empty endpoint must not be mistaken for a missing sidebar;
      // the post-restore integrity pass will reconcile the completed tree.
      if (
        !manager.manager?.isRestoringLayout &&
        layout.activityBars &&
        (leftVisible || rightVisible)
      ) {
        await this.rebuildMissingSidebars(win, layout);
      }

      // 依 activity bar 可見性建立/更新 hints（不再依欄位內容推斷）
      this.ensureSidebarHints(win);

      // 確保側欄欄位存在（getColumnElement null → 補帶預設 view 的欄位）
      this.ensureSideColumnPresent(win, "left", leftVisible);
      this.ensureSideColumnPresent(win, "right", rightVisible);
      // 維持最少一欄 content area（頂層欄位 ≥ activity bar 數 + 1）
      this.ensureContentColumnPresent(win);

      const finalColumns = this.engine.getTopLevelColumnElements(win).length;
      if (finalColumns !== initialColumns) {
        await this.waitForLayoutFrame(win);
        if (manager.manager?.isRebuildingPopoutLayout) return;
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

  /**
   * 清除該視窗的側欄 hints，讓下一次 ensureSidebarHints 以目前的頂層欄位數
   * 重新記錄 originalCount。用於 leaf 層級重建（rebuildTargetWindowStructure）
   * 完成後：舊 hints 的 originalCount 記錄的是重建前的欄位數，若重建後欄位
   * 數減少，ensureLayoutIntegrity 會誤判側欄缺失而重複補欄（多出一個欄位）。
   * 這裡不修改 shared engine 的刪除 API，僅以「目前顯示狀態」覆寫 sides，
   * 使 getColumnElement 走舊式欄位數判斷（需求 = left + right + 1）。
   */
  resetSidebarHints(win: Window): void {
    if (!win || win.closed) return;
    this.sidebarHintsByWindow.delete(win);
    this.engine.setSidebarSides(win, {
      left: this.isSideVisibleForWindow(win, "left"),
      right: this.isSideVisibleForWindow(win, "right"),
    });
  }

  /**
   * 清除視窗內所有頂層欄位（含巢狀 split / tab group）的 sidebar 標記，
   * 將它們的語意重置為 content area。用於舊 space 升級的第一刻：即使既有
   * 欄位殘留 mod-left-split / mod-right-split / window-spaces-sidebar-column
   * 等標記，也能確保 shared getColumnElement 不因「側欄標記優先」而誤把
   * 舊 content 欄當成 sidebar；後續 ensure 只補出新的側欄，原有欄位全數
   * 保留為 content。
   */
  private clearSidebarMarks(win: Window): void {
    const markClasses = [
      "window-spaces-sidebar-column",
      "mod-sidedock",
      "mod-left-split",
      "mod-right-split",
      "window-spaces-has-hidden-next",
    ];
    this.engine.getTopLevelColumnElements(win).forEach((col) => {
      col.classList.remove(...markClasses);
      col.querySelectorAll<HTMLElement>(".workspace-tabs, .workspace-split").forEach((el) => {
        el.classList.remove(...markClasses);
      });
    });
  }

  /**
   * 若任一「顯示且 sidebar 欄位缺失」的側存在，以全新 layout 重建該視窗，
   * 在欄位容器層級補出標準 workspace-tabs sidebar 欄位（B2：每次新增側都走
   * 重構）。保留原 content 的 leaf view state；既有側欄欄位原封保留。
   *
   * @returns 是否執行了重建。
   */
  private async rebuildMissingSidebars(win: Window, layout: WindowLayout): Promise<boolean> {
    if (!win || win.closed || !layout) return false;
    const leftShow = this.isSideVisibleForWindow(win, "left");
    const rightShow = this.isSideVisibleForWindow(win, "right");
    const leftView = leftShow ? this.getItemsForWindowSide(win, "left")[0]?.viewType : undefined;
    const rightView = rightShow ? this.getItemsForWindowSide(win, "right")[0]?.viewType : undefined;

    // 「該側 sidebar 欄位是否已存在」優先看側欄標記；若 layout-change 尚未
    // 完成標記同步，再以該側任一已配置 view 作為 fallback。不能只檢查第一個
    // default view：使用者切換到同一 Activity Bar 的其他 view 後，Save 觸發
    // renderWindow 不應把現有 sidebar 誤判成缺失並重建整棵 layout。
    const topCols = this.engine.getTopLevelColumnElements(win);
    const last = topCols.length - 1;
    const leftPresent = topCols[0] && (
      this.isMarkedSidebarColumn(topCols[0], "left") ||
      this.columnContainsAnyViewType(topCols[0], this.getItemsForWindowSide(win, "left").map((item) => item.viewType))
    );
    const rightPresent = topCols[last] && (
      this.isMarkedSidebarColumn(topCols[last], "right") ||
      this.columnContainsAnyViewType(topCols[last], this.getItemsForWindowSide(win, "right").map((item) => item.viewType))
    );
    const leftMissing = leftShow && !leftPresent;
    const rightMissing = rightShow && !rightPresent;
    if (!leftMissing && !rightMissing) return false;

    const manager = (this.plugin as unknown as {
      manager?: {
        rebuildPopoutLayoutWithSidebars?: (
          win: Window,
          layout: WindowLayout,
          left?: string,
          right?: string
        ) => Promise<void>;
      };
    }).manager;
    if (!manager?.rebuildPopoutLayoutWithSidebars) return false;

    // 對已存在（未缺）的那側不傳 view，避免 rebuild 重複新增；只為缺的側加。
    await manager.rebuildPopoutLayoutWithSidebars(
      win,
      layout,
      leftMissing ? leftView : undefined,
      rightMissing ? rightView : undefined
    );
    // 重建後頂層欄位數與結構改變，重設側欄 hints（避免舊 originalCount 誤判）
    this.resetSidebarHints(win);
    return true;
  }

  /** 欄位元素內是否包含指定 viewType 的 leaf。 */
  private columnContainsViewType(colEl: HTMLElement | undefined, viewType?: string): boolean {
    if (!colEl || !viewType) return false;
    return Array.from(colEl.querySelectorAll(".workspace-leaf [data-type]"))
      .some((el) => el.getAttribute("data-type") === viewType);
  }

  /** 欄位內是否包含該 Activity Bar 已配置的任一 view。 */
  private columnContainsAnyViewType(colEl: HTMLElement | undefined, viewTypes: string[]): boolean {
    return viewTypes.some((viewType) => this.columnContainsViewType(colEl, viewType));
  }

  /** 判斷欄位是否已被同步標記為指定側的 sidebar。 */
  private isMarkedSidebarColumn(colEl: HTMLElement | undefined, side: PopoutSide): boolean {
    if (!colEl) return false;
    return colEl.classList.contains(
      side === "left" ? "mod-left-split" : "mod-right-split"
    );
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
    // flex-grow 權重語意（與 Obsidian 原生 setDimension 一致）：容器縮放時
    // 依權重分配可見欄位；側欄收合時由 toggleSideSidebar 將釋放的權重只交給 content。
    const weights = leftVisible && rightVisible
      ? [25, 50, 25]
      : leftVisible
        ? [25, 75]
        : rightVisible
          ? [75, 25]
          : [100];

    columns.forEach((column, index) => {
      const weight = weights[index];
      if (weight === undefined) return;
      this.setColumnFlexGrow(column, weight);
    });
  }

  private setColumnFlexGrow(column: HTMLElement, flexGrow: number): void {
    if (!Number.isFinite(flexGrow) || flexGrow <= 0) return;
    const customEl = column as unknown as {
      setCssProps?: (props: Record<string, string>) => void;
    };
    const value = String(flexGrow);
    if (typeof customEl.setCssProps === "function") {
      // setCssProps 以 setProperty(key, value) 套用，key 需為 kebab-case
      customEl.setCssProps({ "flex-grow": value });
    } else {
      column.style.setProperty("flex-grow", value);
    }
  }

  private getColumnFlexGrow(win: Window, column: HTMLElement): number {
    const inline = Number(column.style.flexGrow);
    if (Number.isFinite(inline) && inline > 0) return inline;
    try {
      const computed = Number(win.getComputedStyle(column).flexGrow);
      if (Number.isFinite(computed) && computed > 0) return computed;
    } catch {
      // Fall back to a neutral weight in test/non-DOM environments.
    }
    return 1;
  }

  private captureSidebarFlexSnapshot(win: Window): SidebarFlexSnapshot | null {
    const columns = this.engine.getTopLevelColumnElements(win);
    if (columns.length < 2) return null;

    const left = this.engine.getColumnElement(win, "left");
    const right = this.engine.getColumnElement(win, "right");
    if (!left && !right) return null;

    const entry = (element: HTMLElement | null): ColumnFlexEntry | null =>
      element && columns.includes(element)
        ? { element, flexGrow: this.getColumnFlexGrow(win, element) }
        : null;

    const leftEntry = entry(left);
    const rightEntry = entry(right);
    const sideColumns = new Set(
      [leftEntry?.element, rightEntry?.element].filter(
        (element): element is HTMLElement => Boolean(element)
      )
    );
    const center = columns
      .filter((column) => !sideColumns.has(column))
      .map((element) => ({
        element,
        flexGrow: this.getColumnFlexGrow(win, element),
      }));

    return { left: leftEntry, center, right: rightEntry };
  }

  private restoreSidebarFlexSnapshot(snapshot: SidebarFlexSnapshot): void {
    if (snapshot.left) this.setColumnFlexGrow(snapshot.left.element, snapshot.left.flexGrow);
    snapshot.center.forEach((entry) => this.setColumnFlexGrow(entry.element, entry.flexGrow));
    if (snapshot.right) this.setColumnFlexGrow(snapshot.right.element, snapshot.right.flexGrow);
  }

  /** Hide one side while assigning its released weight to content only. */
  private preserveOtherSidebarWidth(
    snapshot: SidebarFlexSnapshot,
    hiddenSide: PopoutSide
  ): void {
    const hiddenEntry = hiddenSide === "left" ? snapshot.left : snapshot.right;
    const centerWeight = snapshot.center.reduce((sum, entry) => sum + entry.flexGrow, 0);
    if (!hiddenEntry || centerWeight <= 0) return;

    const scale = (centerWeight + hiddenEntry.flexGrow) / centerWeight;
    snapshot.center.forEach((entry) => {
      this.setColumnFlexGrow(entry.element, entry.flexGrow * scale);
    });

    const otherEntry = hiddenSide === "left" ? snapshot.right : snapshot.left;
    if (otherEntry) this.setColumnFlexGrow(otherEntry.element, otherEntry.flexGrow);
  }

  private applyDefaultColumnSizingIfNeeded(win: Window, force = false): void {
    const layout = this.getLayoutForWindow(win);
    if (!force && layout && this.hasSavedLayoutDimensions(layout.workspace?.layout)) return;
    this.applyDefaultColumnSizing(
      win,
      this.isSideVisibleForWindow(win, "left"),
      this.isSideVisibleForWindow(win, "right")
    );
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
    spaceIdentity.oncontextmenu = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.showVisibilityMenu(win, evt);
    };

    const left = body.createDiv({ cls: "window-spaces-activity-bar window-spaces-activity-left" });
    // 只有左側 bar 有拖曳 handle（右上方是原生視窗控制鈕，不能遮蓋）
    const drag = left.createDiv({ cls: "window-spaces-activity-drag" });
    drag.oncontextmenu = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.showVisibilityMenu(win, evt);
    };
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
    colBtn.oncontextmenu = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.showVisibilityMenu(win, evt, side);
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
      // 前一欄 handle 隱藏標記：下一欄是收合的側欄（window-spaces-column-hidden）
      // 時，本欄的 right-edge handle 由 CSS 隱藏（避免重複 handle 與拖曳誤位移
      // 右側邊框）。以 JS 標記 class 取代 :has(+ ...) 選擇器，避免 DOM invalidate。
      const next = columns[index + 1];
      el.classList.toggle(
        "window-spaces-has-hidden-next",
        !!next && next.classList.contains("window-spaces-column-hidden")
      );
      const tabGroups = this.getSidebarTabGroups(el);
      tabGroups.forEach((tabsEl) => {
        if (tabsEl !== el) {
          tabsEl.classList.remove("window-spaces-sidebar-column");
        }
        tabsEl.classList.toggle("mod-sidedock", isSidebar);
        tabsEl.classList.toggle("mod-left-split", isLeftSidebar);
        tabsEl.classList.toggle("mod-right-split", isRightSidebar);
      });
      el.querySelectorAll<HTMLElement>(".workspace-split").forEach((nestedSplit) => {
        if (nestedSplit !== el) {
          nestedSplit.classList.remove("window-spaces-sidebar-column");
          nestedSplit.classList.toggle("mod-sidedock", isSidebar);
          nestedSplit.classList.toggle("mod-left-split", isLeftSidebar);
          nestedSplit.classList.toggle("mod-right-split", isRightSidebar);
        }
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
  private columnFillAttempts = new WeakMap<Window, { left: number; right: number; content?: number }>();

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
      // 維持最少一欄 content area（頂層欄位 ≥ activity bar 數 + 1）
      this.ensureContentColumnPresent(win);

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
    // 注意：edge 若不是「頂層欄位」元素（例如巢狀 content split）時，
    // createLeafBySplit 會把新欄位建在錯誤層級（split 內部），頂層欄位數
    // 不會增加 → 直接跳過不補。
    const edge = this.engine.getEdgeColumnElement(win, side);
    const topColumns = this.engine.getTopLevelColumnElements(win);
    // 欄位可能是 workspace-tabs 或 workspace-split（後者如 2x2/3x2 中由
    // horizontal split 表示的單一欄位）。只要 edge 屬於頂層欄位層級即可作為
    // 補欄基準——原先「只限 workspace-tabs」的檢查會把 split 表示的欄位
    // 擋掉，導致 enable 活動列時不補欄、反而把既有欄位同步成側欄。
    if (edge && !topColumns.includes(edge)) return null;
    // createLeafBySplit 沿 target leaf 向上找第一個 WorkspaceSplit 建欄。
    // edge 若是 split 表示的欄位，取其「內部 leaf」當 target 時會把新欄建到
    // 該 split 內部（錯誤層級、頂層數不增）→ 改用欄位容器層級的 workspace-tabs
    // 欄位 leaf 當基準，讓 createLeafBySplit 提升到欄位容器層級正確建欄。
    let targetLeaf = edge ? this.getFirstLeafInColumn(edge) : null;
    if (edge && !edge.classList.contains("workspace-tabs")) {
      const tabsCol = topColumns.find((el) => el.classList.contains("workspace-tabs")) || edge;
      targetLeaf = this.getFirstLeafInColumn(tabsCol);
    }
    if (!targetLeaf) {
      targetLeaf =
        this.engine.getActiveLeafInWindow(win) || this.engine.getLastLeafInWindow(win);
    }
    if (!targetLeaf) return null;

    // before=true 把新欄位放在最左（左側欄）；before=false 放在最右（右側欄）
    const before = side === "left";
    const topCountBefore = this.engine.getTopLevelColumnElements(win).length;
    // INTERNAL API: Workspace.createLeafBySplit - d.ts 有宣告但官方文件未記載（asar-findings #2：方向扁平化行為）
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

  /**
   * 確保頂層欄位數 ≥（顯示的 activity bar 數 + 1），即空間至少保留一欄
   * content area——完全以「目前顯示的 activity bar 個數」為準，不參考
   * hints 的 originalCount。
   *
   * 背景：getColumnElement 改為「側欄標記優先」判定後，guard 只守「該側
   * sidebar 存在」；使用者把 content 欄全部關閉後會得到 [sidebar, sidebar]
   * 而沒有 content。此方法於必要時在側欄之間補一欄空 content（New Tab）。
   *
   * 語意（activity bar 數 + 1 原則）：
   * - 兩側 bar 都顯示 → 至少 3 欄：[左側欄, content, 右側欄]
   * - 單側 bar 顯示 → 至少 2 欄：[側欄, content]
   * - bar 全隱藏（舊 space 未 turn on）→ 至少 1 欄（任一欄位即為 content，不重排）
   * - 舊 space 使用者 turn on bar 的當下：兩側欄立即成為 sidebar，若此時
   *   沒有 content 欄 → 自動補一欄（Professional 型 2 欄 [L, R] 開雙側 bar
   *   後會被補成 [L, C, R]——預期行為）。
   *
   * 補欄位置：有左側欄 → 建在其右側（before=false）；只有右側欄 → 建在其
   * 左側（before=true）；皆無時以任一 leaf 為基準。與 ensureSideColumnPresent
   * 相同的防護：createLeafBySplit 建欄後若頂層欄位數未增加（巢狀結構建錯層
   * 級），下次等 3 秒後再重試。
   *
   * @returns 建立的 leaf（若建立成功），否則 null。
   */
  private ensureContentColumnPresent(win: Window): WorkspaceLeaf | null {
    const leftVisible = this.isSideVisibleForWindow(win, "left");
    const rightVisible = this.isSideVisibleForWindow(win, "right");
    const requiredColumns = Number(leftVisible) + Number(rightVisible) + 1;
    if (this.engine.getTopLevelColumnElements(win).length >= Math.max(1, requiredColumns)) return null;

    const now = Date.now();
    const lastAttempt = this.columnFillAttempts.get(win);
    if (lastAttempt && lastAttempt.content && lastAttempt.content > now - 3000) return null;

    const workspace = this.engine.workspace;
    // 防護：無 workspace 或無 createLeafBySplit（測試 mock 或非標準環境）→ 跳過補欄
    if (!workspace || typeof workspace.createLeafBySplit !== "function") return null;

    // 基準 leaf：左側欄優先，其次右側欄，皆無時用任一 leaf
    const leftCol = this.engine.getColumnElement(win, "left");
    const rightCol = this.engine.getColumnElement(win, "right");
    const baseLeaf =
      (leftCol ? this.getFirstLeafInColumn(leftCol) : null) ||
      (rightCol ? this.getFirstLeafInColumn(rightCol) : null) ||
      this.engine.getActiveLeafInWindow(win) ||
      this.engine.getLastLeafInWindow(win);
    if (!baseLeaf) return null;

    // 有左側欄 → 建在其右側；只有右側欄 → 建在其左側；皆無 → 建在基準右側
    const before = !leftCol && !!rightCol;
    const topCountBefore = this.engine.getTopLevelColumnElements(win).length;
    // INTERNAL API: Workspace.createLeafBySplit - d.ts 有宣告但官方文件未記載（asar-findings #2：方向扁平化行為）
    const panelLeaf = workspace.createLeafBySplit(baseLeaf, "vertical", before);

    const attempts = { ...(lastAttempt || { left: 0, right: 0 }), content: now };
    this.columnFillAttempts.set(win, attempts);
    if (panelLeaf && this.engine.getTopLevelColumnElements(win).length > topCountBefore) {
      attempts.content = now + 10000;
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

  /**
   * 顯示 Space Logo / Toggle Button 的上下文選單：
   * - Space Logo 右鍵：顯示 Left activity bar, Left sidebar, Right activity bar, Right sidebar
   * - Left toggle button 右鍵：顯示 Left activity bar, Left sidebar
   * - Right toggle button 右鍵：顯示 Right activity bar, Right sidebar
   *
   * 規則：
   * - activity bar 不打勾 = activity bar 不顯示
   * - activity bar 未打勾時，sidebar disable，sidebar 一律顯示
   * - activity bar 打勾、sidebar 不打勾 = 顯示 activity bar，但隱藏 sidebar
   * - 變更打勾項目時，儲存對應的 space setting
   */
  showVisibilityMenu(win: Window, evt: MouseEvent, targetSide?: PopoutSide): void {
    const menu = new Menu();
    const sides: PopoutSide[] = targetSide ? [targetSide] : ["left", "right"];

    sides.forEach((side, idx) => {
      if (idx > 0) {
        menu.addSeparator();
      }

      const isLeft = side === "left";
      const barTitle = isLeft ? t("activityBar.leftActivityBar") : t("activityBar.rightActivityBar");
      const sidebarTitle = isLeft ? t("activityBar.leftSidebar") : t("activityBar.rightSidebar");

      const isBarVisible = this.isSideVisibleForWindow(win, side);
      const isSidebarHidden = this.engine.isColumnHidden(win, side);
      const isSidebarVisible = !isSidebarHidden;

      // 1. Activity Bar 項目
      menu.addItem((item) => {
        item
          .setTitle(barTitle)
          .setChecked(isBarVisible)
          .onClick(() => {
            void this.toggleSideActivityBar(win, side);
          });
      });

      // 2. Sidebar 項目
      menu.addItem((item) => {
        item.setTitle(sidebarTitle);
        if (!isBarVisible) {
          // activity bar 未打勾時，sidebar disable，sidebar 一律顯示
          item.setDisabled(true);
          item.setChecked(true);
        } else {
          item.setChecked(isSidebarVisible);
          item.onClick(() => {
            void this.toggleSideSidebar(win, side);
          });
        }
      });
    });

    menu.showAtMouseEvent(evt);
  }

  /** 切換指定側 Activity Bar 的顯示狀態，並持久化至 Space 設定。 */
  async toggleSideActivityBar(win: Window, side: PopoutSide): Promise<void> {
    const layout = this.getLayoutForWindow(win);
    const currentVisible = this.isSideVisibleForWindow(win, side);
    const nextVisible = !currentVisible;

    if (layout) {
      if (!layout.activityBars) {
        // 舊 space 首次升級為「新式側欄/活動列」語意的起點：在寫入活動列
        // 設定之前，先以「兩側活動列皆未顯示」的原始狀態錨定實體側欄
        // hints，並清除既有頂層欄位的 sidebar 標記。
        //
        // 原因：ensureSidebarHints 首次建立 hints 時會以「目前顯示狀態」
        // 記錄 initialLeft/initialRight。若舊 space 尚未有 hints 就 turn
        // on（升級的第一刻），ensureSidebarHints 可能把 initial* 記成
        // true，getColumnElement 的「需求欄位數 = originalCount」便不會補
        // 欄，連同「側欄標記優先」判定，直接把 activity bar 旁邊的既有
        // column 當成 sidebar。
        // 這裡預先（activityBars 尚未建立 → isSideVisibleForWindow 兩側皆
        // false）錨定 initial* = false 並清除殘留標記，確保升級語意為：
        // 原有所有欄位視為 content area，後續只補出新的 left/right
        // sidebar（以其第一個 view 按鈕為預設 view，無則 New Tab）。
        this.ensureSidebarHints(win);
        this.clearSidebarMarks(win);
        layout.activityBars = {};
      }
      if (!layout.activityBars[side]) {
        layout.activityBars[side] = {
          show: nextVisible,
          items: this.getItemsForSide(side).map((item) => ({ ...item })),
        };
      } else {
        layout.activityBars[side]!.show = nextVisible;
      }

      // 當 Activity Bar 不顯示時，該側 sidebar 一律顯示（強制解除隱藏）
      if (!nextVisible) {
        if (this.engine.isColumnHidden(win, side)) {
          this.engine.showColumn(win, side);
          this.markColumnAutoHideBlocked(win, side, 3000);
        }
        if (layout.hidden) {
          layout.hidden[side === "left" ? "leftSidebar" : "rightSidebar"] = false;
        }
      }

      await this.plugin.saveSettings?.();
    }

    // B2：enable 一側且該側 sidebar 欄位缺失時，以「全新含 sidebar 的 layout」
    // 重建該 popout（保留原 content 的 view state，只在欄位容器層級補出標準
    // sidebar tabs）——取代 createLeafBySplit 對 split 欄位建錯層級的問題。
    if (nextVisible && layout) {
      await this.rebuildMissingSidebars(win, layout);
      // Target-only rebuilds keep the final column count unchanged from the
      // second render onward, so ensureLayoutColumns cannot infer that this
      // was the first Activity Bar enable. Apply the initial 25/50/25 sizing
      // explicitly so a newly inserted sidebar does not inherit an equal 1/3
      // share from Obsidian's temporary tree.
      this.applyDefaultColumnSizingIfNeeded(win, true);
    }

    this.renderWindow(win);
  }

  /** 切換指定側 Sidebar 的顯示狀態，並持久化至 Space 設定。 */
  async toggleSideSidebar(win: Window, side: PopoutSide): Promise<void> {
    const isHidden = this.engine.isColumnHidden(win, side);
    const layout = this.getLayoutForWindow(win);

    if (isHidden) {
      const savedFlex = this.sidebarFlexSnapshots.get(win);
      // 原本隱藏 -> 切換為顯示
      const columnEl = this.engine.getColumnElement(win, side);
      if (!columnEl) {
        await this.openFallbackViewForSide(win, side);
      } else {
        this.engine.showColumn(win, side);
        this.markColumnAutoHideBlocked(win, side, 3000);
        await this.ensureColumnViewsRendered(win, columnEl);
      }

      if (savedFlex) {
        this.restoreSidebarFlexSnapshot(savedFlex);
        this.sidebarFlexSnapshots.delete(win);
      } else {
        this.applyDefaultColumnSizingIfNeeded(win);
      }

      if (layout) {
        if (!layout.hidden) layout.hidden = {};
        layout.hidden[side === "left" ? "leftSidebar" : "rightSidebar"] = false;
        await this.plugin.saveSettings?.();
      }
    } else {
      // 原本顯示 -> 切換為隱藏
      if (this.engine.getVisibleColumnCount(win) < 2) {
        new Notice(t("activityBar.cannotHideLastPane"));
        return;
      }
      const snapshot = this.captureSidebarFlexSnapshot(win);
      if (snapshot) this.sidebarFlexSnapshots.set(win, snapshot);
      this.engine.hideColumn(win, side);
      if (snapshot) {
        this.preserveOtherSidebarWidth(snapshot, side);
      } else {
        this.applyDefaultColumnSizingIfNeeded(win);
      }

      if (layout) {
        if (!layout.hidden) layout.hidden = {};
        layout.hidden[side === "left" ? "leftSidebar" : "rightSidebar"] = true;
        await this.plugin.saveSettings?.();
      }
    }

    this.updateTabHeaderAvoidance(win, this.isSideVisibleForWindow(win, "left"));
    this.updateActiveStates(win);
  }

  private async toggleColumn(win: Window, side: PopoutSide): Promise<void> {
    await this.toggleSideSidebar(win, side);
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
