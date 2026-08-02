import { App, Modal, Setting, Notice, ToggleComponent } from "obsidian";
import { WindowLayout } from "../types";
import { t, getI18n } from "../i18n";
import WindowSpacesPlugin from "../main";

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
            void this.submitForm(nameInput, includeGeometry, autoSave, selectedSections, archived);
          }
        });
      });
    nameSetting.settingEl.addClass("window-spaces-setting-full-width");

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
    infoList.createEl("li", {
      text: `${t("manageModal.fileCount")}: ${this.layout.metadata.fileCount}`,
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
      void this.submitForm(nameInput, includeGeometry, autoSave, selectedSections, archived);
    };

    window.setTimeout(() => nameInput?.focus(), 50);
  }

  private async submitForm(
    nameInput: HTMLInputElement,
    includeGeometry: boolean,
    autoSave: boolean,
    selectedSections: string[],
    archived: boolean
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

