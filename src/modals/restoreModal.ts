import { App, Modal, Notice, Setting, setIcon, setTooltip, Menu } from "obsidian";
import { WindowLayout, ViewState } from "../types";
import { t, getI18n } from "../i18n";

export type WindowLayoutsMode = "restore" | "manage";

/**
 * Restore 與 Manage 共用的 Window Layouts 視窗。
 * Restore 模式專注於搜尋與恢復；Manage 模式提供完整管理操作。
 */
export class WindowLayoutsModal extends Modal {
  private plugin: any;
  private mode: WindowLayoutsMode;
  private targetWindow?: Window;
  private searchInput: HTMLInputElement;
  private listEl: HTMLElement;
  private filteredLayouts: WindowLayout[] = [];
  private selectedIndex = 0;

  private keydownListener?: (event: KeyboardEvent) => void;

  constructor(
    app: App,
    plugin: any,
    mode: WindowLayoutsMode = "manage",
    targetWindow?: Window
  ) {
    super(app);
    this.plugin = plugin;
    this.mode = mode;
    this.targetWindow = targetWindow;
  }

  onOpen() {
    this.modalEl.addClass("window-layouts-modal");

    this.setTitle(
      this.mode === "restore" ? t("restoreModal.title") : t("manageModal.title")
    );

    // 隱藏原生的 modal-close-button，避免觸發 Obsidian 原生 close()
    const nativeCloseBtn = this.containerEl.querySelector<HTMLElement>(".modal-close-button");
    if (nativeCloseBtn) {
      nativeCloseBtn.style.display = "none";
    }

    // 在 modal-title 內建立專屬的齒輪 (⚙️) 排序與選項按鈕
    const titleHeader = this.containerEl.querySelector<HTMLElement>(".modal-title");
    if (titleHeader) {
      titleHeader.style.display = "flex";
      titleHeader.style.alignItems = "center";
      titleHeader.style.justifyContent = "space-between";
      titleHeader.style.width = "100%";

      let gearBtn = titleHeader.querySelector<HTMLElement>(".window-layouts-gear-btn");
      if (!gearBtn) {
        gearBtn = titleHeader.createEl("div", {
          cls: "clickable-icon window-layouts-gear-btn",
        });
        setIcon(gearBtn, "gear");
        setTooltip(gearBtn, t("manageModal.sortDateDesc"));
        gearBtn.style.cursor = "pointer";
        gearBtn.style.marginLeft = "auto";
        gearBtn.onclick = (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          this.showSortMenu(e);
        };
      }
    }

    // 註冊 Obsidian Scope 鍵盤導覽
    this.scope.register([], "ArrowDown", (evt: KeyboardEvent) => {
      this.handleArrowKey(1);
      evt.preventDefault();
      return false;
    });

    this.scope.register([], "ArrowUp", (evt: KeyboardEvent) => {
      this.handleArrowKey(-1);
      evt.preventDefault();
      return false;
    });

    // 捕獲階段全域 Keydown 監聽（無論焦點在標題、空白處還是任何元素上均 100% 生效）
    const targetDoc = this.modalEl.ownerDocument || document;
    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        this.handleArrowKey(event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "Enter") {
        const activeEl = targetDoc.activeElement;
        if (activeEl && activeEl.tagName === "BUTTON") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const targetIndex = this.selectedIndex >= 0 ? this.selectedIndex : 0;
        const selectedLayout = this.filteredLayouts[targetIndex];
        if (selectedLayout) void this.restoreLayout(selectedLayout, event.shiftKey);
      }
    };
    targetDoc.addEventListener("keydown", this.keydownListener, true);

    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("window-spaces-modal");

    const toolbar = contentEl.createDiv("window-layouts-toolbar");
    this.searchInput = toolbar.createEl("input");
    this.searchInput.type = "search";
    this.searchInput.placeholder = t("manageModal.searchPlaceholder");
    this.searchInput.setAttribute("aria-label", t("manageModal.searchPlaceholder"));
    this.searchInput.addEventListener("input", () => {
      this.selectedIndex = 0;
      this.renderLayouts();
    });

    if (this.mode === "restore") {
      const newWinButton = toolbar.createEl("button", {
        text: `+ ${t("common.newWindow")}`,
        cls: "mod-cta qsp-action-btn",
      });
      setTooltip(newWinButton, t("common.newWindow"));
      newWinButton.onclick = () => {
        this.close();
        this.plugin.manager.openNewPopoutWindow();
      };
    }

    this.listEl = contentEl.createDiv("window-layouts-list");
    this.listEl.setAttribute("role", "listbox");
    this.renderLayouts();

    const instructionsEl = contentEl.createDiv("prompt-instructions window-layouts-instructions");

    const navInst = instructionsEl.createDiv("prompt-instruction");
    navInst.createEl("span", { text: "↑ ↓", cls: "prompt-instruction-command" });
    navInst.createEl("span", { text: t("instructions.navigate") });

    const useInst = instructionsEl.createDiv("prompt-instruction");
    useInst.createEl("span", { text: "↵", cls: "prompt-instruction-command" });
    useInst.createEl("span", { text: t("instructions.use") });

    const newWinInst = instructionsEl.createDiv("prompt-instruction");
    newWinInst.createEl("span", { text: "Shift ↵", cls: "prompt-instruction-command" });
    newWinInst.createEl("span", { text: t("instructions.useNewWindow") });

    const dismissInst = instructionsEl.createDiv("prompt-instruction");
    dismissInst.createEl("span", { text: "esc", cls: "prompt-instruction-command" });
    dismissInst.createEl("span", { text: t("instructions.dismiss") });

    window.setTimeout(() => this.searchInput?.focus(), 50);
  }

  private handleArrowKey(direction: number): void {
    if (this.filteredLayouts.length === 0) return;
    if (this.selectedIndex < 0) {
      this.selectedIndex = direction > 0 ? 0 : this.filteredLayouts.length - 1;
    } else {
      this.selectedIndex =
        (this.selectedIndex + direction + this.filteredLayouts.length) % this.filteredLayouts.length;
    }
    this.renderLayouts();
    this.scrollSelectedIntoView();
  }

  private renderLayouts(): void {
    if (!this.listEl) return;
    this.listEl.empty();

    const query = this.searchInput?.value.trim().toLowerCase() || "";
    this.filteredLayouts = this.plugin.manager
      .getSavedLayouts()
      .filter((layout: WindowLayout) => !query || layout.name.toLowerCase().includes(query));

    if (this.filteredLayouts.length > 0) {
      if (this.selectedIndex < 0 || this.selectedIndex >= this.filteredLayouts.length) {
        this.selectedIndex = 0;
      }
    } else {
      this.selectedIndex = -1;
    }

    if (this.filteredLayouts.length === 0) {
      this.listEl.createEl("p", {
        text: t("manageModal.noLayoutsMessage"),
        cls: "setting-item-description",
      });
      return;
    }

    this.filteredLayouts.forEach((layout: WindowLayout, index: number) => {
      this.renderLayoutItem(layout, index);
    });
  }

  private renderLayoutItem(layout: WindowLayout, index: number): void {
    const layoutEl = this.listEl.createDiv("suggestion-item window-layout-item");
    layoutEl.setAttribute("role", "option");
    layoutEl.setAttribute("aria-selected", String(index === this.selectedIndex));
    if (index === this.selectedIndex) layoutEl.addClass("is-selected");

    this.setFilesTooltipForLayout(layoutEl, layout);

    layoutEl.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const forceNewWindow = e.shiftKey;
      void this.restoreLayout(layout, forceNewWindow);
    });

    const itemContentEl = layoutEl.createDiv("suggestion-content qsp-content");
    const titleEl = itemContentEl.createDiv({
      cls: "suggestion-title qsp-title",
    });
    titleEl.createSpan({ text: layout.name });

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

    pathEl.createEl("span", {
      text: `${t("manageModal.updatedDate")}: ${i18n.formatDate(new Date(layout.updatedAt || layout.timestamp || layout.createdAt || Date.now()))}`,
      cls: "layout-date",
    });
    pathEl.createEl("span", {
      text: `${t("manageModal.fileCount")}: ${layout.metadata?.fileCount || 0}`,
      cls: "layout-files",
    });

    const actionsEl = layoutEl.createDiv("suggestion-aux qsp-aux layout-actions");
    const restoreButton = actionsEl.createEl("button", {
      text: t("common.restore"),
    });
    setTooltip(restoreButton, t("restoreModal.restoreHint"));

    let holdTimer: any = null;
    let isLongPress = false;

    restoreButton.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;
      isLongPress = false;
      holdTimer = setTimeout(() => {
        isLongPress = true;
        void this.restoreLayout(layout, true);
      }, 450);
    });

    const cancelHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    restoreButton.addEventListener("mouseup", cancelHold);
    restoreButton.addEventListener("mouseleave", cancelHold);

    restoreButton.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      if (isLongPress) return;
      const forceNewWindow = e.shiftKey;
      void this.restoreLayout(layout, forceNewWindow);
    };

    if (this.mode === "manage") {
      const moreButton = actionsEl.createEl("button", {
        cls: "clickable-icon layout-more-btn",
      });
      setIcon(moreButton, "chevron-down");
      setTooltip(moreButton, t("manageModal.actions"));
      moreButton.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        this.showLayoutItemMenu(e, layout);
      };
    }
  }

  private async restoreLayout(
    layout: WindowLayout,
    forceNewWindow = false
  ): Promise<void> {
    try {
      this.close();
      await this.plugin.manager.restoreLayout(layout, {
        targetWindow: forceNewWindow ? undefined : this.targetWindow,
        forceNewWindow,
      });
    } catch (error: any) {
      new Notice(`${t("errors.failedToRestore")}: ${error?.message || error}`);
    }
  }

  private scrollSelectedIntoView(): void {
    const selected = this.listEl.querySelector<HTMLElement>(".window-layout-item.is-selected");
    selected?.scrollIntoView({ block: "nearest" });
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

      const buttonContainer = modal.contentEl.createDiv();
      buttonContainer.style.textAlign = "right";
      buttonContainer.style.marginTop = "20px";

      const cancelButton = buttonContainer.createEl("button", {
        text: t("common.cancel"),
      });
      cancelButton.onclick = () => modal.close();

      const saveButton = buttonContainer.createEl("button", {
        text: t("common.save"),
        cls: "mod-cta",
      });
      saveButton.style.marginLeft = "10px";

      const submit = async () => {
        const newName = input.value.trim();
        if (!newName) {
          new Notice(t("saveModal.emptyNameError"));
          input.focus();
          return;
        }

        const duplicate = this.plugin.settings.layouts.some(
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
        this.renderLayouts();
        new Notice(t("notifications.layoutRenamed"));
      };

      saveButton.onclick = submit;
    };
    modal.onClose = () => modal.contentEl.empty();
    modal.open();
  }

  private showDeleteDialog(layout: WindowLayout): void {
    this.showConfirmDialog(
      `${t("manageModal.confirmDeleteMessage")}\n\n${layout.name}`,
      t("manageModal.confirmDeleteTitle")
    ).then(async (confirmed) => {
      if (!confirmed) return;

      try {
        await this.plugin.manager.deleteLayout(layout.id);
        this.renderLayouts();
      } catch (error: any) {
        new Notice(`${t("errors.failedToDelete")}: ${error?.message || error}`);
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

        const buttonContainer = modal.contentEl.createDiv();
        buttonContainer.style.textAlign = "right";
        buttonContainer.style.marginTop = "20px";

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
        confirmButton.style.marginLeft = "10px";
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
    const leaves = this.plugin.manager.getSavedViewStates(layout);
    const files: string[] = [];

    leaves.forEach((leaf: ViewState) => {
      const filePath = this.plugin.manager.getFilePathFromLeafState(leaf);
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

  private showSortMenu(event: MouseEvent): void {
    const menu = new Menu();
    const currentSort = this.plugin.settings.sortBy || "updated-desc";

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
            this.selectedIndex = 0;
            this.renderLayouts();
          });
      });
    };

    addSortItem("updated-desc", t("manageModal.sortUpdatedDesc"), "history");
    addSortItem("updated-asc", t("manageModal.sortUpdatedAsc"), "history");
    addSortItem("created-desc", t("manageModal.sortCreatedDesc"), "calendar-days");
    addSortItem("created-asc", t("manageModal.sortCreatedAsc"), "calendar");
    addSortItem("name-asc", t("manageModal.sortNameAsc"), "sort-asc");
    addSortItem("name-desc", t("manageModal.sortNameDesc"), "sort-desc");

    const targetEl = (event.currentTarget as HTMLElement) || this.modalEl;
    const rect = targetEl.getBoundingClientRect();

    menu.showAtPosition({
      x: Math.max(10, rect.right - 145),
      y: rect.bottom + 6,
    });
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
          this.renderLayouts();
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
          this.close();
          this.plugin.openSaveLayoutModal(layout);
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

    const targetEl = (event.currentTarget as HTMLElement) || this.modalEl;
    const rect = targetEl.getBoundingClientRect();
    menu.showAtPosition({
      x: Math.max(10, rect.right - 120),
      y: rect.bottom + 4,
    });
  }

  onClose() {
    if (this.keydownListener) {
      const targetDoc = this.modalEl.ownerDocument || document;
      targetDoc.removeEventListener("keydown", this.keydownListener, true);
    }
    this.contentEl.empty();
  }
}
