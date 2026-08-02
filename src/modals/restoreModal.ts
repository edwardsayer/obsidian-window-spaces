import { App, Modal, Notice, Setting, setIcon, setTooltip, Menu } from "obsidian";
import { WindowLayout, ViewState, WindowSettings } from "../types";
import { t, getI18n } from "../i18n";
import WindowSpacesPlugin from "../main";

/**
 * 統一的 Window Layouts 視窗：搜尋、恢復與管理都在同一個入口完成。
 */
export class WindowLayoutsModal extends Modal {
  private plugin: WindowSpacesPlugin;
  private targetWindow?: Window;
  private searchInput!: HTMLInputElement;
  private listEl!: HTMLElement;
  private filteredLayouts: WindowLayout[] = [];
  private selectedIndex = 0;

  private keydownListener?: (event: KeyboardEvent) => void;
  private keydownTarget?: Window | Document | HTMLElement;
  private isPanelActive?: () => boolean;
  private panelRootEl?: HTMLElement;
  private panelMode = false;
  private externalHostClose?: () => void;
  private initialFocusTimer?: number;
  private initialSearchQuery?: string;
  private clearSearchBtn?: HTMLElement;

  public static activeInstances = new Set<WindowLayoutsModal>();

  public static renderAllInstances(): void {
    for (const instance of WindowLayoutsModal.activeInstances) {
      instance.renderLayouts();
    }
  }

  constructor(
    app: App,
    plugin: WindowSpacesPlugin,
    targetWindow?: Window
  ) {
    super(app);
    this.plugin = plugin;
    this.targetWindow = targetWindow;
  }

  onOpen() {
    try {
      WindowLayoutsModal.activeInstances.add(this);
      this.modalEl.addClass("window-layouts-modal");

      const modalWindow = this.modalEl.ownerDocument?.defaultView;
      const modalBody = modalWindow?.document?.body;
      if (
        modalWindow &&
        modalBody &&
        (modalBody.classList.contains("is-popout-window") ||
          modalBody.classList.contains("mod-popout"))
      ) {
        this.targetWindow = modalWindow;
      }

      this.setTitle(t("common.windowLayouts"));

      const titleHeader = this.containerEl.querySelector<HTMLElement>(".modal-title");
      if (titleHeader) {
        this.createHeaderActions(titleHeader);
      }

      this.renderContent();
    } catch (err: unknown) {
      console.error("[WindowSpaces] Error during WindowLayoutsModal onOpen:", err);
      WindowLayoutsModal.activeInstances.delete(this);
      this.removeKeydownListener();
      // Keep the native Modal alive and visibly report the failure. Closing a
      // Modal while Obsidian is still running Modal.open()/onOpen() can leave
      // its keyboard scope above the Command Palette scope.
      const message = err instanceof Error ? err.message : String(err);
      this.contentEl.empty();
      this.contentEl.createEl("p", {
        text: `Error loading Window Spaces: ${message}`,
      });
    }
  }

  /**
   * Render this modal's content inside an ItemView (or another host).
   * The modal instance is intentionally kept as the controller so the panel
   * and modal always expose the same layout actions and keyboard behavior.
   */
  mountInContainer(
    rootEl: HTMLElement,
    isSidebar?: boolean,
    isPanelActive?: () => boolean
  ): void {
    // Keep the optional argument for compatibility with older callers. The
    // panel UI is deliberately identical in editor tabs and sidebars.
    void isSidebar;
    WindowLayoutsModal.activeInstances.add(this);
    this.panelRootEl = rootEl;
    this.isPanelActive = isPanelActive;
    this.panelMode = true;
    this.renderContent();
  }

  /**
   * Mount the shared picker inside a plain native Obsidian Modal.
   *
   * This deliberately avoids calling WindowLayoutsModal.open(): Obsidian
   * 1.13 can fail while opening a subclass with a complex onOpen lifecycle,
   * while a native Modal plus mounted content remains reliable.
   */
  mountInModalContainer(rootEl: HTMLElement, closeHost: () => void): void {
    WindowLayoutsModal.activeInstances.add(this);
    this.panelRootEl = rootEl;
    this.isPanelActive = undefined;
    this.panelMode = false;
    this.externalHostClose = closeHost;
    this.renderContent();
  }

  unmountFromContainer(): void {
    WindowLayoutsModal.activeInstances.delete(this);
    this.removeKeydownListener();
    this.panelRootEl?.empty();
    this.panelRootEl = undefined;
    this.isPanelActive = undefined;
    this.panelMode = false;
    this.externalHostClose = undefined;
  }

  private getRootEl(): HTMLElement {
    return this.panelRootEl || this.contentEl;
  }

  /**
   * Find the .modal-container that hosts this instance, if any. Panels hosted
   * in sidebars or editor tabs return null; popup pickers mounted inside a
   * native Modal return that modal's container so stacked modals (rename
   * dialog, Command Palette, ...) can be told apart from the picker itself.
   */
  private getOwnModalContainer(): HTMLElement | null {
    let el: HTMLElement | null = this.getRootEl();
    const doc = el?.ownerDocument;
    while (el && doc && el !== doc.documentElement) {
      if (typeof el.classList?.contains === "function" && el.classList.contains("modal-container")) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  private closeHost(): void {
    if (this.externalHostClose) {
      this.externalHostClose();
    } else if (!this.panelMode) {
      this.close();
    }
  }

  private renderContent(): void {
    const contentEl = this.getRootEl();
    contentEl.empty();
    // This is the shared content component's root class. It must be present
    // on both the Modal content and the ItemView content so the same layout
    // item styles are applied in every host.
    contentEl.addClass("window-layouts-modal");
    contentEl.addClass("window-spaces-modal");
    if (this.panelMode) contentEl.addClass("window-layouts-panel");

    // The panel header is intentionally recreated after empty() so it is
    // part of the same root that owns the toolbar and list.
    if (this.panelMode) {
      const panelHeader = contentEl.createDiv("nav-header window-layouts-panel-header");
      this.createHeaderActions(panelHeader);
    }

    const toolbar = contentEl.createDiv("window-layouts-toolbar");
    const searchContainer = toolbar.createDiv("window-layouts-search-container search-input-container");

    this.searchInput = searchContainer.createEl("input");
    this.searchInput.type = "search";
    this.searchInput.placeholder = t("manageModal.searchPlaceholder");
    this.searchInput.setAttribute("aria-label", t("manageModal.searchPlaceholder"));

    if (this.initialSearchQuery !== undefined) {
      this.searchInput.value = this.initialSearchQuery;
      this.initialSearchQuery = undefined;
    }

    this.clearSearchBtn = searchContainer.createDiv("window-layouts-search-clear");
    setIcon(this.clearSearchBtn, "x");
    setTooltip(this.clearSearchBtn, t("manageModal.clearSearch") || "Clear search");

    this.clearSearchBtn.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      if (this.searchInput) {
        this.searchInput.value = "";
        this.searchInput.focus();
      }
      this.selectedIndex = 0;
      this.renderLayouts();
    };

    this.searchInput.addEventListener("input", () => {
      this.selectedIndex = 0;
      this.renderLayouts();
    });

    this.listEl = contentEl.createDiv("window-layouts-list");
    this.listEl.setAttribute("role", "listbox");
    this.renderLayouts();

    const instructionsEl = contentEl.createDiv("prompt-instructions window-layouts-instructions");

    const navInst = instructionsEl.createDiv("prompt-instruction");
    navInst.createSpan({ text: "↑ ↓", cls: "prompt-instruction-command" });
    navInst.createSpan({ text: t("instructions.navigate") });

    const useInst = instructionsEl.createDiv("prompt-instruction");
    useInst.createSpan({ text: "Shift ↵", cls: "prompt-instruction-command" });
    useInst.createSpan({ text: t("instructions.use") });

    const newWinInst = instructionsEl.createDiv("prompt-instruction");
    newWinInst.createSpan({ text: "↵", cls: "prompt-instruction-command" });
    newWinInst.createSpan({ text: t("instructions.useNewWindow") });

    const dismissInst = instructionsEl.createDiv("prompt-instruction");
    dismissInst.createSpan({ text: "esc", cls: "prompt-instruction-command" });
    dismissInst.createSpan({ text: t("instructions.dismiss") });

    const targetDoc = contentEl.ownerDocument || document;
    const targetWindow = targetDoc.defaultView || window;
    this.removeKeydownListener();
    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") {
        return;
      }

      const activeEl = targetDoc.activeElement as HTMLElement | null;
      const ownRootEl = this.getRootEl();

      // 當焦點位於 ownRootEl 之外的輸入框、編輯器或彈出對話框（如 Command Palette, Quick Switcher, Rename dialog 等）時，絕對不攔截按鍵
      if (activeEl && !ownRootEl.contains(activeEl)) {
        const tagName = activeEl.tagName?.toUpperCase();
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          activeEl.isContentEditable ||
          activeEl.classList?.contains("cm-content") ||
          Boolean(activeEl.closest(".modal-container, .modal, .prompt, .prompt-container, .menu"))
        ) {
          return;
        }
      }

      let focusedInstance: WindowLayoutsModal | null = null;
      for (const instance of WindowLayoutsModal.activeInstances) {
        const root = instance.getRootEl();
        if (activeEl && root && root.ownerDocument === targetDoc && root.contains(activeEl)) {
          focusedInstance = instance;
          break;
        }
      }

      // A panel or popup must never answer keys while the user is actually
      // typing in a DIFFERENT window (a popout). Obsidian forwards key events
      // between windows so core shortcuts keep working, so check the event's
      // origin window, the event target's document, and whether THIS document
      // currently holds OS focus. A forwarded event either keeps its original
      // window/document (caught by the first two checks) or is rebuilt in the
      // focused window (caught by document.hasFocus()).
      const eventView = (event as KeyboardEvent & { view?: Window | null }).view;
      const eventFromThisWindow = eventView == null || eventView === targetWindow;
      const eventTargetDoc = (event.target as Element | null)?.ownerDocument ?? null;
      const eventTargetsThisDocument = eventTargetDoc == null || eventTargetDoc === targetDoc;
      const thisDocumentFocused = targetDoc.hasFocus();

      // 檢查畫面中是否有 Command Palette (.prompt), Quick Switcher, Menu 或 Stacked Modals
      const ownModalContainer = this.getOwnModalContainer();
      const overlays = Array.from(
        targetDoc.querySelectorAll<HTMLElement>(
          ".modal-container, .modal, .prompt, .prompt-container, .menu"
        )
      );
      const otherModalOpen = overlays.some((el) => {
        if (ownModalContainer && (el === ownModalContainer || ownModalContainer.contains(el))) {
          return false;
        }
        if (ownRootEl.contains(el)) {
          return false;
        }
        const style = targetDoc.defaultView?.getComputedStyle(el);
        return (
          !el.classList.contains("is-hidden") &&
          style?.display !== "none" &&
          style?.visibility !== "hidden"
        );
      });

      const menuOpen = Boolean(
        targetDoc.querySelector<HTMLElement>(".menu:not(.is-hidden)")
      );
      const anyPopupOpen = Array.from(WindowLayoutsModal.activeInstances).some(
        (instance) => !instance.panelMode
      );
      const shouldHandle =
        eventFromThisWindow &&
        eventTargetsThisDocument &&
        thisDocumentFocused &&
        (this.panelMode
          ? !otherModalOpen &&
            !menuOpen &&
            (focusedInstance === this ||
              (!anyPopupOpen && this.isPanelActive?.() === true))
          : !otherModalOpen && !menuOpen);
      if (!shouldHandle) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.handleArrowKey(event.key === "ArrowDown" ? 1 : -1);
        return;
      }

      if (activeEl && activeEl.tagName === "BUTTON") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const rawQuery = this.searchInput?.value.trim() || "";
      const selectedLayout = this.filteredLayouts[this.selectedIndex >= 0 ? this.selectedIndex : 0];
      if (selectedLayout) {
        void this.restoreLayout(selectedLayout, !event.shiftKey);
      } else if (rawQuery) {
        void this.createAndSaveLayout(rawQuery, !event.shiftKey);
      }
    };
    // Listen on Window capture so Obsidian's document/workspace keymap cannot
    // consume ArrowUp/ArrowDown before an active Window Spaces panel sees it.
    this.keydownTarget = targetWindow;
    this.keydownTarget.addEventListener("keydown", this.keydownListener, true);

    if (this.initialFocusTimer !== undefined) {
      const timerWindow = this.modalEl?.ownerDocument?.defaultView || window;
      timerWindow.clearTimeout(this.initialFocusTimer);
    }

    const focusWindow = this.modalEl?.ownerDocument?.defaultView || window;
    this.initialFocusTimer = focusWindow.setTimeout(() => {
      this.initialFocusTimer = undefined;
      if (this.searchInput && this.searchInput.isConnected !== false) {
        this.searchInput.focus();
      }
    }, 50);
  }

  private createPanelButton(parentEl: HTMLElement): void {
    const panelButton = parentEl.createEl("button", {
      cls: "clickable-icon nav-action-button window-layouts-panel-btn",
      attr: { "aria-label": t("common.openAsPanel") },
    });
    setIcon(panelButton, "layout");
    setTooltip(panelButton, t("common.openAsPanel"));
    panelButton.onclick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.showPanelMenu(e);
    };
  }

  private createHeaderActions(parentEl: HTMLElement): void {
    const isPanelHeader = parentEl.classList.contains("window-layouts-panel-header");
    const actionsEl = parentEl.createDiv(
      isPanelHeader
        ? "nav-buttons-container window-layouts-header-actions"
        : "window-layouts-header-actions"
    );

    // 1. 顯示選項按鈕 (View Options Dropdown)
    const viewOptionsButton = actionsEl.createEl("button", {
      cls: "clickable-icon nav-action-button window-layouts-view-options-btn",
      attr: { "aria-label": t("manageModal.viewOptions") || "View Options" },
    });
    setIcon(viewOptionsButton, "eye");
    setTooltip(viewOptionsButton, t("manageModal.viewOptions") || "View Options");
    viewOptionsButton.onclick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.showViewOptionsMenu(e);
    };

    // 2. 排序按鈕 (Sort Dropdown)
    const sortButton = actionsEl.createEl("button", {
      cls: "clickable-icon nav-action-button window-layouts-sort-btn",
      attr: { "aria-label": t("manageModal.sortDateDesc") },
    });
    setIcon(sortButton, "sort-asc");
    setTooltip(sortButton, t("manageModal.sortDateDesc"));
    sortButton.onclick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.showSortMenu(e);
    };
    this.createPanelButton(actionsEl);
  }

  /**
   * Mount the shared header action buttons (view options, sort, panel menu)
   * into a native modal's title bar so popup windows expose the same three
   * toolbar actions as the persistent panels.
   */
  public mountHeaderActions(titleEl: HTMLElement): void {
    titleEl.classList.add("has-header-actions");
    if (titleEl.querySelector(".window-layouts-header-actions")) return;
    this.createHeaderActions(titleEl);
  }

  public showViewOptionsMenu(event: MouseEvent): void {
    const menu = new Menu();
    const settings: Partial<WindowSettings> = this.plugin?.settings || {};
    const isGrouped = settings.groupBySection !== false;
    const isShowArchived = settings.showArchived === true;

    // 依 Section 分組切換
    menu.addItem((item) => {
      item
        .setTitle(isGrouped ? (t("manageModal.groupBySection") || "Group by Section") : (t("manageModal.flatView") || "Flat List"))
        .setIcon(isGrouped ? "check" : "grid")
        .onClick(async () => {
          settings.groupBySection = !isGrouped;
          await this.plugin?.saveSettings();
          WindowLayoutsModal.renderAllInstances();
        });
    });

    menu.addSeparator();

    // 顯示/隱藏封存空間切換
    menu.addItem((item) => {
      item
        .setTitle(isShowArchived ? (t("manageModal.hideArchived") || "Hide Archived") : (t("manageModal.showArchived") || "Show Archived"))
        .setIcon(isShowArchived ? "check" : "box")
        .onClick(async () => {
          settings.showArchived = !isShowArchived;
          await this.plugin?.saveSettings();
          WindowLayoutsModal.renderAllInstances();
        });
    });

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    menu.showAtPosition({ x: rect.left, y: rect.bottom + 4 });
  }

  private handleArrowKey(direction: number): void {
    if (this.renderedLayoutEntries.length === 0) return;
    if (this.selectedIndex < 0) {
      this.selectedIndex = direction > 0 ? 0 : this.renderedLayoutEntries.length - 1;
    } else {
      this.selectedIndex =
        (this.selectedIndex + direction + this.renderedLayoutEntries.length) % this.renderedLayoutEntries.length;
    }
    this.updateSelectedItemHighlight();
    this.scrollSelectedIntoView();
  }

  private updateSelectedItemHighlight(): void {
    this.renderedLayoutEntries.forEach((entry, idx) => {
      const isSelected = idx === this.selectedIndex;
      entry.element.setAttribute("aria-selected", String(isSelected));
      entry.element.classList.toggle("is-selected", isSelected);
    });
  }

  private updateSearchUI(): void {
    const rawQuery = this.searchInput?.value.trim() || "";
    if (this.clearSearchBtn) {
      this.clearSearchBtn.style.display = rawQuery ? "flex" : "none";
    }
  }

  private async createAndSaveLayout(name: string, forceNewWindow = true): Promise<void> {
    const cleanName = name.trim();
    if (!cleanName) return;
    try {
      const isPopout = (win?: Window | null): win is Window => {
        if (!win || !win.document?.body) return false;
        const cl = win.document.body.classList;
        return cl.contains("is-popout-window") || cl.contains("mod-popout");
      };

      const activeWin = typeof this.plugin.manager?.getActiveWindow === "function"
        ? this.plugin.manager.getActiveWindow()
        : (this.targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window));

      const popoutWin = isPopout(activeWin) ? activeWin : (isPopout(this.targetWindow) ? this.targetWindow : null);

      if (popoutWin) {
        // 紀錄來源 Popout 視窗原本的佈局名稱，避免 Clone 到新視窗時將原視窗誤重命名
        const originalName = typeof this.plugin.manager?.getLayoutNameForWindow === "function"
          ? this.plugin.manager.getLayoutNameForWindow(popoutWin)
          : null;

        // 情境 1：在 Popout 視窗內執行 -> 複製 (Clone) 當前 Popout 視窗的活動佈局與檔案
        const layout = await this.plugin.manager.captureCurrentLayout({ name: cleanName }, popoutWin);
        layout.name = cleanName;

        // 當要在新視窗開啟時，切斷此 layout 與原視窗的存取對應，避免 saveLayout 將原視窗改名
        if (forceNewWindow && this.plugin.manager?.layoutWindows) {
          this.plugin.manager.layoutWindows.delete(layout);
        }

        await this.plugin.manager.saveLayout(layout);

        if (forceNewWindow) {
          // 恢復原 Popout 視窗原本的狀態列名稱
          if (originalName && typeof this.plugin.manager?.setLayoutLabelForWindow === "function") {
            this.plugin.manager.setLayoutLabelForWindow(popoutWin, originalName);
          }
          // 先關閉 Modal，防止 Modal 關閉生命週期奪回原視窗的焦點
          this.closeHost();
          // 預設 (Enter / Click)：Clone 佈局後在「新 Popout 視窗」開啟該佈局 (傳入 targetWindow 作為排除目標)
          await this.plugin.manager.restoreLayout(layout, { forceNewWindow: true, targetWindow: popoutWin });

          const newTargetWin = typeof this.plugin.manager?.getWindowForLayout === "function"
            ? this.plugin.manager.getWindowForLayout(layout)
            : null;
          if (newTargetWin && newTargetWin !== popoutWin && typeof newTargetWin.focus === "function") {
            try { newTargetWin.focus(); } catch { /* Ignore focus error */ }
            newTargetWin.setTimeout(() => {
              try { newTargetWin.focus(); } catch { /* Ignore focus error */ }
            }, 100);
            newTargetWin.setTimeout(() => {
              try { newTargetWin.focus(); } catch { /* Ignore focus error */ }
            }, 300);
          }
        } else {
          // 修飾鍵 (Shift+Enter / Shift+Click)：直接在「當前 Popout 視窗」套用與更新狀態列標籤
          if (this.plugin.manager?.layoutWindows) {
            this.plugin.manager.layoutWindows.set(layout, popoutWin);
          }
          if (typeof this.plugin.manager?.setLayoutLabelForWindow === "function") {
            this.plugin.manager.setLayoutLabelForWindow(popoutWin, cleanName);
          }
          this.closeHost();
        }
      } else {
        // 情境 2：在主視窗中執行 -> 建立全新的 0 檔案 Popout 佈局，並開啟新 Popout 視窗
        const newWin = await this.plugin.manager.openNewPopoutWindow();
        if (!newWin) {
          throw new Error(t("errors.cannotRestore"));
        }

        const emptyLayout: WindowLayout = {
          id: typeof this.plugin.manager?.generateId === "function"
            ? this.plugin.manager.generateId()
            : `layout_${Date.now()}`,
          name: cleanName,
          timestamp: Date.now(),
          windowState: {
            size: { width: 800, height: 600 },
            position: undefined,
          },
          workspace: {
            layout: {
              type: "leaf",
              id: `leaf_${Date.now()}`,
              state: { type: "empty", state: {} },
            },
            activeFile: undefined,
            leaves: [],
          },
          metadata: {
            fileCount: 0,
            tabCount: 0,
            splitCount: 0,
            createdAt: new Date().toISOString(),
            obsidianVersion: (this.app as unknown as { version?: string }).version || "unknown",
            pluginVersion: this.plugin?.manifest?.version || "1.0.0",
          },
        };

        await this.plugin.manager.saveLayout(emptyLayout);

        if (newWin) {
          if (this.plugin.manager?.layoutWindows) {
            this.plugin.manager.layoutWindows.set(emptyLayout, newWin);
          }
          if (typeof this.plugin.manager?.setLayoutLabelForWindow === "function") {
            this.plugin.manager.setLayoutLabelForWindow(newWin, cleanName);
            newWin.setTimeout(() => {
              this.plugin.manager.setLayoutLabelForWindow(newWin, cleanName);
            }, 50);
            newWin.setTimeout(() => {
              this.plugin.manager.setLayoutLabelForWindow(newWin, cleanName);
            }, 300);
          }

          this.closeHost();

          if (typeof newWin.focus === "function") {
            try {
              newWin.focus();
            } catch {
              // Ignore focus error
            }
            newWin.setTimeout(() => {
              try {
                newWin.focus();
              } catch {
                // Ignore focus error
              }
            }, 100);
          }
        } else {
          this.closeHost();
        }
      }

      new Notice(`${t("saveModal.saveSuccess")}: ${cleanName}`);

      if (this.searchInput) {
        this.searchInput.value = "";
      }
      this.selectedIndex = 0;
      WindowLayoutsModal.renderAllInstances();
    } catch (err: unknown) {
      this.closeHost();
      const message = err instanceof Error ? err.message : String(err);
      new Notice(message);
    }
  }

  private static collapsedSections = new Set<string>();
  private renderedLayoutEntries: { layout: WindowLayout; element: HTMLElement }[] = [];

  private renderLayouts(): void {
    if (!this.listEl) return;
    this.listEl.empty();
    this.renderedLayoutEntries = [];

    const rawQuery = this.searchInput?.value.trim() || "";
    const query = rawQuery.toLowerCase();
    const allSpaces = this.plugin?.manager?.getSavedLayouts() || [];
    const settings: Partial<WindowSettings> = this.plugin?.settings || {};
    const showArchived = settings.showArchived === true;
    const groupBySection = settings.groupBySection !== false;

    // 搜尋與封存過濾
    const searchFiltered = allSpaces.filter((layout: WindowLayout) => {
      if (!showArchived && layout.archived === true) return false;
      if (!query) return true;
      const matchName = layout.name.toLowerCase().includes(query);
      const matchSec = (layout.sections || []).some((s: string) => s.toLowerCase().includes(query));
      return matchName || matchSec;
    });

    this.filteredLayouts = searchFiltered;

    if (this.filteredLayouts.length > 0) {
      if (this.selectedIndex < 0 || this.selectedIndex >= this.filteredLayouts.length) {
        this.selectedIndex = 0;
      }
    } else {
      this.selectedIndex = -1;
    }

    this.updateSearchUI();

    if (this.filteredLayouts.length === 0) {
      if (rawQuery) {
        const createItem = this.listEl.createDiv("suggestion-item window-layout-item is-selected");
        const content = createItem.createDiv("suggestion-content qsp-content");
        const title = content.createDiv("suggestion-title qsp-title");
        title.createSpan({ text: rawQuery });

        const aux = createItem.createDiv("suggestion-aux qsp-aux");
        aux.createSpan({
          text: t("manageModal.enterToCreate") || "Enter to create",
          cls: "suggestion-flair",
        });

        createItem.onclick = (e: MouseEvent) => {
          void this.createAndSaveLayout(rawQuery, !e.shiftKey);
        };
      } else {
        this.listEl.createEl("p", {
          text: t("manageModal.noLayoutsMessage"),
          cls: "setting-item-description",
        });
      }
      return;
    }

    // 平舖清單 (Flat View 或搜尋狀態下)
    if (!groupBySection || rawQuery) {
      const activeSpaces = this.filteredLayouts.filter((l: WindowLayout) => !l.archived);
      const archivedSpaces = this.filteredLayouts.filter((l: WindowLayout) => l.archived === true);

      activeSpaces.forEach((layout: WindowLayout) => {
        this.renderLayoutItem(this.listEl, layout);
      });
      if (showArchived) {
        archivedSpaces.forEach((layout: WindowLayout) => {
          this.renderLayoutItem(this.listEl, layout);
        });
      }
      this.updateSelectedItemHighlight();
      return;
    }

    // 分組清單 (Grouped View)
    const knownSectionsOrder: string[] = Array.from(settings.sectionsOrder || []);
    const presentSectionsSet = new Set<string>();
    this.filteredLayouts.forEach((space: WindowLayout) => {
      (space.sections || []).forEach((sec: string) => presentSectionsSet.add(sec));
    });

    presentSectionsSet.forEach((sec) => {
      if (!knownSectionsOrder.includes(sec)) {
        knownSectionsOrder.push(sec);
      }
    });

    knownSectionsOrder.forEach((secName: string) => {
      const matchingSpaces = this.filteredLayouts.filter((s: WindowLayout) => (s.sections || []).includes(secName));
      const activeInSec = matchingSpaces.filter((s) => !s.archived);
      const archivedInSec = showArchived ? matchingSpaces.filter((s) => s.archived === true) : [];
      const totalCount = activeInSec.length + archivedInSec.length;

      if (totalCount === 0) return;

      this.renderSectionHeader(this.listEl, secName, totalCount, knownSectionsOrder, true);

      const isCollapsed = WindowLayoutsModal.collapsedSections.has(secName);
      if (!isCollapsed) {
        const secContainer = this.listEl.createDiv("space-section-container");
        activeInSec.forEach((layout: WindowLayout) => {
          this.renderLayoutItem(secContainer, layout);
        });
        archivedInSec.forEach((layout: WindowLayout) => {
          this.renderLayoutItem(secContainer, layout);
        });
      }
    });

    // 未分類 (Uncategorized)
    const uncategorizedSpaces = this.filteredLayouts.filter((s: WindowLayout) => !s.sections || s.sections.length === 0);
    const activeUncat = uncategorizedSpaces.filter((s) => !s.archived);
    const archivedUncat = showArchived ? uncategorizedSpaces.filter((s) => s.archived === true) : [];
    const totalUncat = activeUncat.length + archivedUncat.length;

    if (totalUncat > 0) {
      const uncatTitle = t("manageModal.uncategorized") || "Uncategorized";
      this.renderSectionHeader(this.listEl, uncatTitle, totalUncat, null, false);
      const isCollapsed = WindowLayoutsModal.collapsedSections.has(uncatTitle);
      if (!isCollapsed) {
        const secContainer = this.listEl.createDiv("space-section-container");
        activeUncat.forEach((layout: WindowLayout) => {
          this.renderLayoutItem(secContainer, layout);
        });
        archivedUncat.forEach((layout: WindowLayout) => {
          this.renderLayoutItem(secContainer, layout);
        });
      }
    }

    this.updateSelectedItemHighlight();
  }

  private renderSectionHeader(
    parentEl: HTMLElement,
    secName: string,
    count: number,
    allSectionsOrder: string[] | null,
    isReorderable = true
  ): void {
    const headerEl = parentEl.createDiv("space-section-header");

    if (isReorderable && allSectionsOrder) {
      headerEl.setAttribute("draggable", "true");

      headerEl.ondragstart = (e: DragEvent) => {
        e.dataTransfer?.setData("text/plain", secName);
        headerEl.addClass("is-dragging");
      };

      headerEl.ondragend = () => {
        headerEl.removeClass("is-dragging");
      };

      headerEl.ondragover = (e: DragEvent) => {
        e.preventDefault();
      };

      headerEl.ondrop = async (e: DragEvent) => {
        e.preventDefault();
        const draggedSec = e.dataTransfer?.getData("text/plain");
        if (draggedSec && draggedSec !== secName && allSectionsOrder.includes(draggedSec)) {
          const fromIdx = allSectionsOrder.indexOf(draggedSec);
          const toIdx = allSectionsOrder.indexOf(secName);
          if (fromIdx !== -1 && toIdx !== -1) {
            const newOrder = [...allSectionsOrder];
            newOrder.splice(fromIdx, 1);
            newOrder.splice(toIdx, 0, draggedSec);
            await this.plugin.manager.reorderSections(newOrder);
          }
        }
      };
    }

    const isCollapsed = WindowLayoutsModal.collapsedSections.has(secName);

    // 左側：Section 名稱、計數與更名按鈕
    const leftEl = headerEl.createDiv("space-section-header-left");

    const titleSpan = leftEl.createSpan({ text: secName, cls: "space-section-title" });

    leftEl.createSpan({ text: `(${count})`, cls: "space-section-count" });

    const triggerInlineRename = () => {
      const input = headerEl.createEl("input", {
        type: "text",
        value: secName,
        cls: "space-section-rename-input",
      });

      titleSpan.replaceWith(input);
      input.focus();

      const commitRename = async () => {
        const newName = input.value.trim();
        if (newName && newName !== secName) {
          await this.plugin.manager.renameSection(secName, newName);
        } else {
          WindowLayoutsModal.renderAllInstances();
        }
      };

      input.onblur = () => { void commitRename(); };
      input.onkeydown = (ke: KeyboardEvent) => {
        if (ke.key === "Enter") {
          ke.preventDefault();
          input.blur();
        } else if (ke.key === "Escape") {
          WindowLayoutsModal.renderAllInstances();
        }
      };
    };

    if (isReorderable) {
      // 雙擊整列群組標頭觸發更名 (Double click group header to rename)
      headerEl.ondblclick = (e: MouseEvent) => {
        e.stopPropagation();
        triggerInlineRename();
      };

      // 右鍵選單觸發更名
      headerEl.oncontextmenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const menu = new Menu();
        menu.addItem((item) => {
          item
            .setTitle(t("manageModal.renameSection") || "Rename Section")
            .setIcon("pencil")
            .onClick(() => triggerInlineRename());
        });
        menu.showAtMouseEvent(e);
      };
    }

    // 右側：展開 / 收合箭頭 (最右端，無高亮背景輕量化)
    const rightEl = headerEl.createDiv("space-section-header-right");

    const arrowIcon = rightEl.createSpan({ cls: "clickable-icon space-section-arrow" });
    setIcon(arrowIcon, isCollapsed ? "chevron-right" : "chevron-down");

    headerEl.onclick = (e: MouseEvent) => {
      if (e.detail > 1) return; // 雙擊時不觸發單擊的展開/收合
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT") return;
      if (WindowLayoutsModal.collapsedSections.has(secName)) {
        WindowLayoutsModal.collapsedSections.delete(secName);
      } else {
        WindowLayoutsModal.collapsedSections.add(secName);
      }
      this.renderLayouts();
    };
  }

  private renderLayoutItem(containerEl: HTMLElement, layout: WindowLayout): void {
    const layoutEl = containerEl.createDiv("suggestion-item window-layout-item");
    const itemIndex = this.renderedLayoutEntries.length;
    this.renderedLayoutEntries.push({ layout, element: layoutEl });

    const isSelected = itemIndex === this.selectedIndex;
    layoutEl.setAttribute("role", "option");
    layoutEl.setAttribute("aria-selected", String(isSelected));
    if (isSelected) layoutEl.addClass("is-selected");

    if (layout.archived === true) {
      layoutEl.addClass("is-archived");
    }

    this.setFilesTooltipForLayout(layoutEl, layout);

    let holdTimer: number | null = null;
    let isLongPress = false;

    const isActionButtonTarget = (target: EventTarget | null): boolean =>
      Boolean((target as HTMLElement | null)?.closest?.("button"));

    const cancelHold = () => {
      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    layoutEl.addEventListener("click", (e) => {
      if (isActionButtonTarget(e.target)) return;
      this.selectedIndex = itemIndex;
      this.updateSelectedItemHighlight();
    });

    const itemContentEl = layoutEl.createDiv("suggestion-content qsp-content");
    const titleEl = itemContentEl.createDiv({
      cls: "suggestion-title qsp-title",
    });
    titleEl.createSpan({ text: layout.name });

    if (layout.archived === true) {
      const archivedBadge = titleEl.createSpan({
        cls: "layout-archived-badge",
      });
      archivedBadge.setText("📦");
      setTooltip(archivedBadge, t("manageModal.archivedGroup") || "Archived");
    }

    if (layout.autoSave) {
      const autoSaveBadge = titleEl.createSpan({
        cls: "layout-auto-save-badge",
      });
      setIcon(autoSaveBadge, "refresh-cw");
      setTooltip(autoSaveBadge, t("manageModal.autoSaveEnabled"));
    }

    const noteEl = itemContentEl.createDiv("suggestion-note qsp-note");
    const i18n = getI18n();
    const pathEl = noteEl.createDiv("qsp-path");

    pathEl.createSpan({
      text: `${t("manageModal.updatedDate")}: ${i18n.formatDate(new Date(layout.updatedAt || layout.timestamp || layout.createdAt || Date.now()))}`,
      cls: "layout-date",
    });
    pathEl.createSpan({
      text: `${t("manageModal.fileCount")}: ${layout.metadata?.fileCount || 0}`,
      cls: "layout-files",
    });

    const openWin = typeof this.plugin.manager?.getOpenWindowForLayout === "function"
      ? this.plugin.manager.getOpenWindowForLayout(layout)
      : null;

    if (openWin) {
      pathEl.createSpan({
        text: `🟢 ${t("manageModal.windowOpenBadge") || "視窗開啟中"}`,
        cls: "layout-open-status",
      });
    }

    const actionsEl = layoutEl.createDiv("suggestion-aux qsp-aux layout-actions");
    const restoreButton = actionsEl.createEl("button", {
      text: t("common.restore"),
      cls: "layout-restore-btn mod-cta",
    });
    setTooltip(restoreButton, t("restoreModal.restoreHint"));

    restoreButton.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;
      isLongPress = false;
      holdTimer = window.setTimeout(() => {
        isLongPress = true;
        void this.restoreLayout(layout, false);
      }, 450);
    });

    restoreButton.addEventListener("mouseup", cancelHold);
    restoreButton.addEventListener("mouseleave", cancelHold);

    restoreButton.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      if (isLongPress) return;
      const forceNewWindow = !e.shiftKey;
      void this.restoreLayout(layout, forceNewWindow);
    };

    const moreButton = actionsEl.createEl("button", {
      cls: "layout-more-btn mod-cta",
    });
    setIcon(moreButton, "chevron-down");
    setTooltip(moreButton, t("manageModal.actions"));
    moreButton.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      this.showLayoutItemMenu(e, layout);
    };
  }

  private async restoreLayout(
    layout: WindowLayout,
    forceNewWindow = false
  ): Promise<void> {
    try {
      this.closeHost();
      await this.plugin.manager.restoreLayout(layout, {
        // forceNewWindow 只控制 restore 的目標是否新建；仍需傳入來源視窗，
        // 讓 manager 能保留該 popout 原本的 layout 名稱與狀態列。
        // focusExistingWindow：若該 space 已在某個 Popout 開啟，直接聚焦
        // 既有視窗，避免重複 restore 產生重複視窗 (clone 流程不傳此旗標)。
        targetWindow: this.targetWindow,
        forceNewWindow,
        forceReload: !forceNewWindow,
        focusExistingWindow: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`${t("errors.failedToRestore")}: ${message}`);
    }
  }

  private scrollSelectedIntoView(): void {
    const entry = this.renderedLayoutEntries[this.selectedIndex];
    if (entry && entry.element && typeof entry.element.scrollIntoView === "function") {
      entry.element.scrollIntoView({ block: "nearest" });
    } else {
      const selected = this.listEl?.querySelector<HTMLElement>(".window-layout-item.is-selected");
      if (selected && typeof selected.scrollIntoView === "function") {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }

  private showRenameDialog(layout: WindowLayout): void {
    const modal = new Modal(this.app);
    modal.setTitle(t("manageModal.renameButton"));
    modal.onOpen = () => {
      let input: HTMLInputElement;
      const setting = new Setting(modal.contentEl)
        .setName(t("saveModal.nameLabel"))
        .addText((text) => {
          input = text.inputEl;
          input.value = layout.name;
          input.focus();
          input.select();
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          });
        });
      setting.settingEl.addClass("window-spaces-setting-full-width");

      const buttonContainer = modal.contentEl.createDiv("ws-dialog-actions");

      const cancelButton = buttonContainer.createEl("button", {
        text: t("common.cancel"),
      });
      cancelButton.onclick = () => modal.close();

      const saveButton = buttonContainer.createEl("button", {
        text: t("common.save"),
        cls: "mod-cta",
      });

      const submit = async () => {
        const newName = input.value.trim();
        if (!newName) {
          new Notice(t("saveModal.emptyNameError"));
          input.focus();
          return;
        }

        const duplicate = this.plugin.settings.spaces.some(
          (item: WindowLayout) => item.id !== layout.id && item.name === newName
        );
        if (duplicate) {
          new Notice(t("saveModal.duplicateNameError"));
          input.focus();
          return;
        }

        layout.name = newName;
        await this.plugin.saveSettings();
        modal.close();
        WindowLayoutsModal.renderAllInstances();
        new Notice(t("notifications.layoutRenamed"));
      };

      saveButton.onclick = () => void submit();
    };
    modal.onClose = () => modal.contentEl.empty();
    modal.open();
  }

  private showDeleteDialog(layout: WindowLayout): void {
    void this.showConfirmDialog(
      `${t("manageModal.confirmDeleteMessage")}\n\n${layout.name}`,
      t("manageModal.confirmDeleteTitle")
    ).then(async (confirmed) => {
      if (!confirmed) return;

      try {
        await this.plugin.manager.deleteLayout(layout.id);
        WindowLayoutsModal.renderAllInstances();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        new Notice(`${t("errors.failedToDelete")}: ${message}`);
      }
    });
  }

  private showConfirmDialog(
    message: string,
    title: string = t("common.confirm")
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new Modal(this.app);
      modal.setTitle(title);
      modal.onOpen = () => {
        modal.contentEl.createEl("p", { text: message });

        const buttonContainer = modal.contentEl.createDiv("ws-dialog-actions");

        const cancelButton = buttonContainer.createEl("button", {
          text: t("common.cancel"),
        });
        cancelButton.onclick = () => {
          resolve(false);
          modal.close();
        };

        const confirmButton = buttonContainer.createEl("button", {
          text: t("common.confirm"),
          cls: "mod-warning",
        });
        confirmButton.onclick = () => {
          resolve(true);
          modal.close();
        };
      };
      modal.onClose = () => modal.contentEl.empty();
      modal.open();
    });
  }

  private setFilesTooltipForLayout(element: HTMLElement, layout: WindowLayout): void {
    const leaves = this.plugin?.manager ? this.plugin.manager.getSavedViewStates(layout) : [];
    const files: string[] = [];

    leaves.forEach((leaf: ViewState) => {
      const filePath = this.plugin?.manager ? this.plugin.manager.getFilePathFromLeafState(leaf) : null;
      if (filePath) {
        const fileName = filePath.split("/").pop() || filePath;
        if (!files.includes(fileName)) {
          files.push(fileName);
        }
      }
    });

    if (files.length > 0) {
      const displayFiles = files.slice(0, 15);
      let tooltipText = `${t("restoreModal.includedFiles")} (${files.length}):\n` +
        displayFiles.map((f) => `• ${f}`).join("\n");

      if (files.length > 15) {
        tooltipText += `\n... (+${files.length - 15})`;
      }

      setTooltip(element, tooltipText);
    }
  }

  public showSortMenu(event: MouseEvent): void {
    const menu = new Menu();
    const currentSort = this.plugin?.settings?.sortBy || "updated-desc";

    const addSortItem = (
      id: "updated-desc" | "updated-asc" | "created-desc" | "created-asc" | "name-asc" | "name-desc",
      label: string,
      icon: string
    ) => {
      menu.addItem((item) => {
        item
          .setTitle(label)
          .setIcon(icon)
          .setChecked(currentSort === id)
          .onClick(async () => {
            this.plugin.settings.sortBy = id;
            await this.plugin.saveSettings();
            WindowLayoutsModal.renderAllInstances();
          });
      });
    };

    addSortItem("updated-desc", t("manageModal.sortUpdatedDesc"), "history");
    addSortItem("updated-asc", t("manageModal.sortUpdatedAsc"), "history");
    addSortItem("created-desc", t("manageModal.sortCreatedDesc"), "calendar-days");
    addSortItem("created-asc", t("manageModal.sortCreatedAsc"), "calendar");
    addSortItem("name-asc", t("manageModal.sortNameAsc"), "sort-asc");
    addSortItem("name-desc", t("manageModal.sortNameDesc"), "sort-desc");

    menu.showAtMouseEvent(event);
  }

  public showPanelMenu(event: MouseEvent): void {
    const menu = new Menu();
    const openPanel = (location: "left" | "right" | "tab") => {
      this.closeHost();
      const targetWin =
        this.targetWindow ||
        (typeof this.plugin.manager?.getActiveWindow === "function"
          ? this.plugin.manager.getActiveWindow()
          : undefined);
      void this.plugin.openWindowLayoutsPanel(location, targetWin);
    };

    // 與命令面板的開啟命令共用相同名稱，確保兩處內容一致。
    // 「彈出視窗」直接使用 ribbon/命令的 openWindowLayoutsModal 入口。
    menu.addItem((item) => {
      item.setTitle(t("commands.openLayoutsPanel")).setIcon("layout").onClick(() => openPanel("tab"));
    });
    menu.addItem((item) => {
      item.setTitle(t("commands.openLayouts")).setIcon("layout").onClick(() => {
        this.closeHost();
        const targetWin =
          this.targetWindow ||
          (typeof this.plugin.manager?.getActiveWindow === "function"
            ? this.plugin.manager.getActiveWindow()
            : undefined);
        this.plugin.openWindowLayoutsModal(targetWin);
      });
    });
    menu.addItem((item) => {
      item.setTitle(t("commands.openLayoutsPanelLeft")).setIcon("panel-left").onClick(() => openPanel("left"));
    });
    menu.addItem((item) => {
      item.setTitle(t("commands.openLayoutsPanelRight")).setIcon("panel-right").onClick(() => openPanel("right"));
    });

    menu.showAtMouseEvent(event);
  }

  private showLayoutItemMenu(event: MouseEvent, layout: WindowLayout): void {
    const menu = new Menu();

    // 1. Auto-save (自動保存狀態切換)
    menu.addItem((item) => {
      item
        .setTitle(
          layout.autoSave
            ? t("manageModal.autoSaveEnabled")
            : t("manageModal.autoSaveDisabled")
        )
        .setIcon("refresh-cw")
        .setChecked(!!layout.autoSave)
        .onClick(async () => {
          layout.autoSave = !layout.autoSave;
          await this.plugin.saveSettings();
          new Notice(
            layout.autoSave
              ? `${layout.name}: ${t("manageModal.autoSaveEnabled")}`
              : `${layout.name}: ${t("manageModal.autoSaveDisabled")}`
          );
          WindowLayoutsModal.renderAllInstances();
        });
    });

    menu.addSeparator();

    // 2. Rename (重新命名)
    menu.addItem((item) => {
      item
        .setTitle(t("common.rename"))
        .setIcon("pencil")
        .onClick(() => {
          this.showRenameDialog(layout);
        });
    });

    // 3. Edit (編輯佈局與設定：開啟 Save Layout Modal)
    menu.addItem((item) => {
      item
        .setTitle(t("common.edit"))
        .setIcon("edit-3")
        .onClick(() => {
          this.closeHost();
          this.plugin.openSaveLayoutModal(layout);
        });
    });

    // 3.5 Archive / Unarchive (封存 / 取消封存)
    menu.addItem((item) => {
      const isArchived = layout.archived === true;
      item
        .setTitle(isArchived ? (t("manageModal.unarchiveSpace") || "Unarchive Space") : (t("manageModal.archiveSpace") || "Archive Space"))
        .setIcon("box")
        .onClick(() => {
          void this.plugin.manager.toggleArchiveSpace(layout.id);
        });
    });

    menu.addSeparator();

    // 4. Delete (刪除)
    menu.addItem((item) => {
      item
        .setTitle(t("common.delete"))
        .setIcon("trash-2")
        .setWarning(true)
        .onClick(() => {
          this.showDeleteDialog(layout);
        });
    });

    menu.showAtMouseEvent(event);
  }

  onClose() {
    WindowLayoutsModal.activeInstances.delete(this);
    this.removeKeydownListener();

    if (this.initialFocusTimer !== undefined) {
      const timerWindow = this.modalEl?.ownerDocument?.defaultView || window;
      timerWindow.clearTimeout(this.initialFocusTimer as number);
      this.initialFocusTimer = undefined;
    }

    this.contentEl.empty();
  }

  private removeKeydownListener(): void {
    if (this.keydownListener) {
      const target = this.keydownTarget || this.panelRootEl?.ownerDocument || this.modalEl?.ownerDocument || document;
      target.removeEventListener("keydown", this.keydownListener, true);
      target.removeEventListener("keydown", this.keydownListener, false);
      this.keydownListener = undefined;
      this.keydownTarget = undefined;
    }
  }


}

