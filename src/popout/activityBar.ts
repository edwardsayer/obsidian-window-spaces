import { App, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import { ActivityBarItem, WindowLayout, WindowSettings } from "../types";
import { t } from "../i18n";
import {
  isPopoutWindow,
  PopoutLayoutEngine,
  PopoutSide,
} from "./popoutLayout";
import { applyItemIcon, applyViewIcon, resolveViewLabel, setIconWithCheck } from "./viewRegistry";

interface WindowBars {
  left: HTMLElement;
  right: HTMLElement;
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

  constructor(plugin: { app: App; settings: WindowSettings }, engine: PopoutLayoutEngine) {
    this.app = plugin.app;
    this.plugin = plugin;
    this.engine = engine;
  }

  get settings(): WindowSettings {
    return this.plugin.settings;
  }

  isEnabled(): boolean {
    return this.settings.showActivityBars !== false;
  }

  getItemsForSide(side: PopoutSide): ActivityBarItem[] {
    return this.settings.activityBars?.[side] ?? [];
  }

  /**
   * 套用 sidebar toggle icon（設計階段決定的靜態 Lucide icon，與主視窗一致）：
   * - 欄位開啟（可收合）：`panel-left` / `panel-right`
   * - 欄位隱藏（可展開）：`panel-left-open` / `panel-right-open`
   */
  private applySidebarToggleIcon(btn: HTMLButtonElement, side: PopoutSide, hidden: boolean): void {
    const openIcon = side === "left" ? "panel-left" : "panel-right";
    const closedIcon = side === "left" ? "panel-left-open" : "panel-right-open";
    if (!setIconWithCheck(btn, hidden ? closedIcon : openIcon)) {
      setIcon(btn, openIcon);
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

    const left = body.createDiv({ cls: "window-spaces-activity-bar window-spaces-activity-left" });
    // 只有左側 bar 有拖曳 handle（右上方是原生視窗控制鈕，不能遮蓋）
    left.createDiv({ cls: "window-spaces-activity-drag" });
    const right = body.createDiv({ cls: "window-spaces-activity-bar window-spaces-activity-right" });

    this.barsByWindow.set(win, {
      left,
      right,
      viewButtons: new Map(),
      columnButtons: {
        left: left.createEl("button", { cls: "window-spaces-activity-btn clickable-icon", attr: { type: "button", "aria-label": t("activityBar.toggleColumn"), title: t("activityBar.toggleColumn") } }),
        right: right.createEl("button", { cls: "window-spaces-activity-btn clickable-icon", attr: { type: "button", "aria-label": t("activityBar.toggleColumn"), title: t("activityBar.toggleColumn") } }),
      },
    });

    body.classList.add("window-spaces-has-left-activity");
    body.classList.add("window-spaces-has-right-activity");

    this.renderWindow(win);
  }

  /** 移除單一 Popout 的 activity bar 與 body class。 */
  cleanupWindow(win: Window): void {
    const bars = this.barsByWindow.get(win);
    if (bars) {
      bars.left.remove();
      bars.right.remove();
    }
    this.barsByWindow.delete(win);
    this.injectedWindows.delete(win);
    const body = win.document?.body;
    body?.classList.remove("window-spaces-has-left-activity");
    body?.classList.remove("window-spaces-has-right-activity");
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
    for (const space of this.settings.spaces) {
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

    const layout = this.getLayoutForWindow(win);
    const icon = layout?.icon || this.settings.defaultIcon || "layout";
    const color = layout?.color;

    const body = win.document?.body;
    if (body) {
      if (color) {
        body.style.setProperty("--window-space-color", color);
        body.classList.add("has-window-space-color");
      } else {
        body.style.removeProperty("--window-space-color");
        body.classList.remove("has-window-space-color");
      }
    }

    const isEmoji = /\p{Extended_Pictographic}/u.test(icon) || !/^[a-zA-Z0-9-]+$/.test(icon);
    if (isEmoji) {
      drag.createSpan({ cls: "window-spaces-drag-emoji", text: icon });
    } else {
      const iconEl = drag.createDiv({ cls: "window-spaces-drag-icon" });
      if (!setIconWithCheck(iconEl, icon)) {
        setIcon(iconEl, "layout");
      }
    }
  }

  /** 重建指定視窗的按鈕內容。 */
  renderWindow(win: Window): void {
    const bars = this.barsByWindow.get(win);
    if (!bars) return;

    this.updateDragHandleIcon(bars, win);
    this.renderBar(bars, win, "left");
    this.renderBar(bars, win, "right");
    this.updateActiveStates(win);
  }

  private renderBar(bars: WindowBars, win: Window, side: PopoutSide): void {
    const bar = side === "left" ? bars.left : bars.right;

    // 移除舊的 view 按鈕與分隔線（保留 bar 容器與固定按鈕）
    bar.querySelectorAll(".window-spaces-activity-view, .window-spaces-activity-divider").forEach((el) => el.remove());
    bars.viewButtons.clear();

    // 固定控制按鈕：插入於 drag handle 之後、視圖按鈕之前
    const colBtn = side === "left" ? bars.columnButtons.left : bars.columnButtons.right;
    const isHidden = this.engine.isColumnHidden(win, side);
    this.applySidebarToggleIcon(colBtn, side, isHidden);
    colBtn.onclick = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.toggleColumn(win, side);
    };
    const drag = bar.querySelector<HTMLElement>(".window-spaces-activity-drag");
    if (drag) {
      drag.after(colBtn);
    } else {
      bar.prepend(colBtn);
    }

    // 固定控制與 view 按鈕之間的分隔線
    bar.createDiv({ cls: "window-spaces-activity-divider" });

    const items = this.getItemsForSide(side);
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
      bars.viewButtons.set(item.viewType, btn);
      configuredTypes.add(item.viewType);
    }
  }

  /** 更新所有按鈕的 active 狀態。 */
  updateActiveStates(win: Window): void {
    const bars = this.barsByWindow.get(win);
    if (!bars) return;

    this.syncSidebarColumnClasses(win);

    bars.viewButtons.forEach((btn, viewType) => {
      // 以按鈕所屬的 bar 判定側（同側的 view 按鈕只反映自己側欄的狀態）
      const side: PopoutSide = bars.left.contains(btn) ? "left" : "right";
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
    columns.forEach((el, index) => {
      const isSidebar = columns.length >= 2 && (index === 0 || index === last);
      el.classList.toggle("window-spaces-sidebar-column", isSidebar);
      el.classList.toggle("mod-sidedock", isSidebar);
      el.classList.toggle("mod-left-split", isSidebar && index === 0);
      el.classList.toggle("mod-right-split", isSidebar && index === last);
      const tabGroups = this.getSidebarTabGroups(el);
      tabGroups.forEach((tabsEl) => {
        tabsEl.classList.toggle("mod-sidedock", isSidebar);
        tabsEl.classList.toggle("mod-left-split", isSidebar && index === 0);
        tabsEl.classList.toggle("mod-right-split", isSidebar && index === last);
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

  private toggleColumn(win: Window, side: PopoutSide): void {
    const columnEl = this.engine.getColumnElement(win, side);
    if (!columnEl) return;

    if (this.engine.isColumnHidden(win, side)) {
      this.engine.showColumn(win, side);
    } else {
      // 防呆：若隱藏後沒有任何可見欄位，則拒絕
      if (this.engine.getVisibleColumnCount(win) < 2) {
        new Notice(t("activityBar.cannotHideLastPane"));
        return;
      }
      this.engine.hideColumn(win, side);
    }
    this.updateActiveStates(win);
  }
}
