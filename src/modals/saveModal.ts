import { App, Modal, Setting, Notice, ToggleComponent, setIcon } from "obsidian";
import { WindowLayout, DEFAULT_COLOR_PRESETS } from "../types";
import { t, getI18n } from "../i18n";
import WindowSpacesPlugin from "../main";
import { setIconWithCheck } from "../popout/viewRegistry";

export class SaveLayoutModal extends Modal {
  private plugin: WindowSpacesPlugin;
  private layout: WindowLayout;
  private onSubmit: (layout: WindowLayout) => void;

  constructor(
    app: App,
    plugin: WindowSpacesPlugin,
    layout: WindowLayout,
    onSubmit: (layout: WindowLayout) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.layout = layout;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    this.setTitle(t("saveModal.title"));
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("window-layouts-modal");

    let selectedSections: string[] = Array.from(this.layout.sections || []);

    // 名稱輸入與動態同名提示
    let nameInput!: HTMLInputElement;
    const nameSetting = new Setting(contentEl)
      .setName(t("saveModal.nameLabel"))
      .addText((text) => {
        nameInput = text.inputEl;
        text.inputEl.value = this.layout.name || this.generateDefaultName();
        text.inputEl.focus();
        text.inputEl.select();
        text.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void this.submitForm(nameInput, includeGeometry, autoSave, selectedSections, archived, currentIcon, currentColor);
          }
        });
      });
    nameSetting.settingEl.addClass("window-spaces-setting-full-width");

    // Icon / Emoji 輸入框與預覽
    let currentIcon = this.layout.icon || "";
    let currentColor = this.layout.color || "";

    const iconSetting = new Setting(contentEl)
      .setName(t("saveModal.iconLabel"))
      .addText((text) => {
        text.setPlaceholder(t("saveModal.iconPlaceholder"));
        text.setValue(currentIcon);
        text.onChange((val) => {
          currentIcon = val.trim();
          updateIconPreview();
        });
      });

    const iconPreviewEl = iconSetting.controlEl.createDiv({ cls: "window-space-icon-preview" });
    const updateIconPreview = () => {
      iconPreviewEl.empty();
      const val = currentIcon || this.plugin.settings.defaultIcon || "layout";
      const isEmoji = /\p{Extended_Pictographic}/u.test(val) || !/^[a-zA-Z0-9-]+$/.test(val);
      if (isEmoji) {
        iconPreviewEl.createSpan({ text: val });
      } else {
        const iconDiv = iconPreviewEl.createDiv();
        if (!setIconWithCheck(iconDiv, val)) {
          setIcon(iconDiv, "layout");
        }
      }
    };
    updateIconPreview();

    // 邊框顏色選擇器與 Swatches
    const presets = this.plugin.settings.colorPresets || DEFAULT_COLOR_PRESETS;
    const colorSetting = new Setting(contentEl)
      .setName(t("saveModal.colorLabel"));

    const colorPickerContainer = colorSetting.controlEl.createDiv({ cls: "window-space-color-picker-container" });
    const colorInput = colorPickerContainer.createEl("input", {
      attr: { type: "color" },
      value: currentColor || "#3b82f6",
    });

    const swatchesContainer = colorPickerContainer.createDiv({ cls: "window-space-color-swatches" });
    const renderSwatches = () => {
      swatchesContainer.empty();
      presets.forEach((hex) => {
        const swatch = swatchesContainer.createDiv({
          cls: `window-space-color-swatch${currentColor === hex ? " is-selected" : ""}`,
        });
        swatch.style.backgroundColor = hex;
        swatch.onclick = () => {
          currentColor = hex;
          colorInput.value = hex;
          renderSwatches();
        };
      });
      if (currentColor) {
        const clearBtn = swatchesContainer.createEl("button", {
          text: "✖",
          cls: "clickable-icon",
          attr: { title: t("saveModal.clearColor") },
        });
        clearBtn.onclick = () => {
          currentColor = "";
          renderSwatches();
        };
      }
    };
    colorInput.onchange = () => {
      currentColor = colorInput.value;
      renderSwatches();
    };
    renderSwatches();

    const noticeContainer = contentEl.createDiv("save-overwrite-notice");

    let autoSave = this.layout.autoSave ?? false;
    let autoSaveToggleComponent: ToggleComponent | null = null;

    // 佈局資訊顯示
    const i18n = getI18n();
    const infoEl = contentEl.createDiv();
    infoEl.createDiv({
      text: t("saveModal.infoSection"),
      cls: "setting-item-name ws-info-title",
    });

    const infoList = infoEl.createEl("ul");
    const totalTabs = this.layout.metadata?.tabCount || this.layout.workspace?.leaves?.length || 0;
    infoList.createEl("li", {
      text: `${t("manageModal.tabCount")}: ${totalTabs}`,
    });
    infoList.createEl("li", {
      text: `${t("manageModal.createdDate")}: ${i18n.formatDate(new Date(this.layout.timestamp))}`,
    });
    infoList.createEl("li", {
      text: `${t("saveModal.windowSize")}: ${this.layout.windowState.size.width} x ${this.layout.windowState.size.height}`,
    });

    // 選項
    let includeGeometry = this.layout.includeGeometry ?? (
      this.layout.windowState.position !== undefined ||
      (this.layout.windowState.size && this.layout.windowState.size.width > 0)
    );
    let geometryToggleComponent: ToggleComponent | null = null;

    let archived = this.layout.archived ?? false;

    new Setting(contentEl)
      .setName(t("saveModal.includeGeometry"))
      .setDesc(t("saveModal.includeGeometryDesc"))
      .addToggle((toggle) => {
        geometryToggleComponent = toggle;
        toggle.setValue(includeGeometry);
        toggle.onChange((value) => {
          includeGeometry = value;
        });
      });

    new Setting(contentEl)
      .setName(t("saveModal.autoSaveToggle"))
      .addToggle((toggle) => {
        autoSaveToggleComponent = toggle;
        toggle.setValue(autoSave);
        toggle.onChange((value) => {
          autoSave = value;
        });
      });

    new Setting(contentEl)
      .setName(t("manageModal.archiveSpace") || "Archive Space")
      .addToggle((toggle) => {
        toggle.setValue(archived);
        toggle.onChange((value) => {
          archived = value;
        });
      });

    // Section 分組標籤選單與 Tag-Pills 輸入框
    selectedSections = Array.from(this.layout.sections || []);
    
    // 獲取目前全域已存在的所有 Sections
    const allSpaces: WindowLayout[] = this.plugin.manager.getSavedLayouts();
    const existingSectionsSet = new Set<string>();
    (this.plugin.settings?.sectionsOrder || []).forEach((s: string) => existingSectionsSet.add(s));
    allSpaces.forEach((s) => (s.sections || []).forEach((sec) => existingSectionsSet.add(sec)));
    const existingSections = Array.from(existingSectionsSet);

    // 1. 上方 Setting 列：左側 Sections 標籤，右側 新標籤輸入欄 (對齊 Space Name 樣式與大小)
    const sectionsSetting = new Setting(contentEl)
      .setName(t("manageModal.sectionsLabel") || "Sections")
      .addText((text) => {
        text.setPlaceholder(t("manageModal.sectionsPlaceholder") || "Add section...");
        text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const val = text.inputEl.value.trim().replace(/^,+|,+$/g, "");
            if (val && !selectedSections.includes(val)) {
              selectedSections.push(val);
              text.inputEl.value = "";
              renderPills();
            }
          }
        });
      });
    sectionsSetting.settingEl.addClass("window-spaces-setting-full-width");

    // 2. 底下：Section 列表選擇器 (Pills Container)
    const pillsContainer = contentEl.createDiv("space-sections-pills");

    const renderPills = () => {
      pillsContainer.empty();
      selectedSections.forEach((sec) => {
        const pill = pillsContainer.createDiv("space-section-pill");

        pill.createSpan({ text: sec });
        const closeSpan = pill.createSpan({ text: "✖", cls: "space-section-pill-close" });
        closeSpan.onclick = (e) => {
          e.stopPropagation();
          selectedSections = selectedSections.filter((s) => s !== sec);
          renderPills();
        };
      });

      // 呈現在 settings 中但未勾選的既有標籤
      existingSections.forEach((sec) => {
        if (selectedSections.includes(sec)) return;
        const unselectedPill = pillsContainer.createDiv("space-section-pill-unselected");
        unselectedPill.setText(`+ ${sec}`);
        unselectedPill.onclick = () => {
          selectedSections.push(sec);
          renderPills();
        };
      });
    };

    renderPills();

    const checkDuplicateName = () => {
      const currentName = nameInput?.value.trim() || "";
      if (!currentName) {
        noticeContainer.setText("");
        return;
      }
      const existingLayouts = this.plugin.manager.getSavedLayouts();
      const match = existingLayouts.find((l) => l.name === currentName);
      if (match) {
        noticeContainer.setText(`ℹ️ ${t("saveModal.overwriteNotice")}「${currentName}」`);
        if (autoSaveToggleComponent && match.autoSave !== undefined) {
          autoSave = !!match.autoSave;
          autoSaveToggleComponent.setValue(autoSave);
        }
        if (geometryToggleComponent && match.includeGeometry !== undefined) {
          includeGeometry = !!match.includeGeometry;
          geometryToggleComponent.setValue(includeGeometry);
        }
        if (match.sections && Array.isArray(match.sections) && selectedSections.length === 0) {
          selectedSections = Array.from(match.sections);
          renderPills();
        }
      } else {
        noticeContainer.setText("");
      }
    };

    nameInput.addEventListener("input", checkDuplicateName);
    checkDuplicateName();

    // 按鈕
    const buttonContainer = contentEl.createDiv("ws-dialog-actions");

    const cancelButton = buttonContainer.createEl("button", {
      text: t("common.cancel"),
    });
    cancelButton.onclick = () => this.close();

    const saveButton = buttonContainer.createEl("button", {
      text: t("common.save"),
      cls: "mod-cta",
    });
    saveButton.onclick = () => {
      void this.submitForm(nameInput, includeGeometry, autoSave, selectedSections, archived, currentIcon, currentColor);
    };

    window.setTimeout(() => nameInput?.focus(), 50);
  }

  private async submitForm(
    nameInput: HTMLInputElement,
    includeGeometry: boolean,
    autoSave: boolean,
    selectedSections: string[],
    archived: boolean,
    icon?: string,
    color?: string
  ): Promise<void> {
    const name = nameInput.value.trim();
    if (!name) {
      new Notice(t("saveModal.emptyNameError"));
      nameInput.focus();
      return;
    }

    // 更新佈局數據
    this.layout.name = name;
    this.layout.autoSave = autoSave;
    this.layout.includeGeometry = includeGeometry;
    this.layout.sections = selectedSections;
    this.layout.archived = archived;
    this.layout.icon = icon ? icon.trim() : undefined;
    this.layout.color = color ? color.trim() : undefined;
    if (!includeGeometry) {
      this.layout.windowState.position = undefined;
    }

    this.onSubmit(this.layout);
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private generateDefaultName(): string {
    if (this.plugin.manager?.generateSmartLayoutName) {
      return this.plugin.manager.generateSmartLayoutName(this.layout);
    }
    const now = new Date();
    const i18n = getI18n();
    const dateStr = i18n.formatDate(now);
    return `${t("saveModal.title")} ${dateStr}`;
  }
}

