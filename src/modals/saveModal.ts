import { App, Modal, Setting, Notice } from "obsidian";
import { WindowLayout } from "../types";
import { t, getI18n } from "../i18n";

export class SaveLayoutModal extends Modal {
  private plugin: any;
  private layout: WindowLayout;
  private onSubmit: (layout: WindowLayout) => void;

  constructor(
    app: App,
    plugin: any,
    layout: WindowLayout,
    onSubmit: (layout: WindowLayout) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.layout = layout;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    this.modalEl.addClass("window-layouts-modal");
    this.setTitle(t("saveModal.title"));

    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("window-spaces-modal");

    // 名稱輸入與動態同名提示
    let nameInput: HTMLInputElement;
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
            void this.submitForm(nameInput, includeGeometry, autoSave);
          }
        });
      });
    nameSetting.settingEl.addClass("window-spaces-setting-full-width");

    const noticeContainer = contentEl.createDiv("save-overwrite-notice");
    noticeContainer.style.fontSize = "var(--font-ui-smaller, 12px)";
    noticeContainer.style.color = "var(--text-accent, #70a7ff)";
    noticeContainer.style.marginTop = "-8px";
    noticeContainer.style.marginBottom = "12px";
    noticeContainer.style.paddingLeft = "2px";

    let autoSave = this.layout.autoSave ?? false;
    let autoSaveToggleComponent: any = null;

    // 佈局資訊顯示
    const i18n = getI18n();
    const infoEl = contentEl.createDiv();
    infoEl.createEl("h3", { text: t("saveModal.infoSection") });

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
    let includeGeometry = this.layout.windowState.position !== undefined ||
      (this.layout.windowState.size && this.layout.windowState.size.width > 0);

    new Setting(contentEl)
      .setName(t("saveModal.includeGeometry"))
      .setDesc(t("saveModal.includeGeometryDesc"))
      .addToggle((toggle) => {
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

    const checkDuplicateName = () => {
      const currentName = nameInput?.value.trim() || "";
      if (!currentName) {
        noticeContainer.setText("");
        return;
      }
      const existingLayouts = this.plugin?.manager?.getSavedLayouts() || [];
      const match = existingLayouts.find((l: any) => l.name === currentName);
      if (match) {
        noticeContainer.setText(`ℹ️ ${t("saveModal.overwriteNotice")}「${currentName}」`);
        if (autoSaveToggleComponent && match.autoSave !== undefined) {
          autoSave = !!match.autoSave;
          autoSaveToggleComponent.setValue(autoSave);
        }
      } else {
        noticeContainer.setText("");
      }
    };

    nameInput!.addEventListener("input", checkDuplicateName);
    checkDuplicateName();

    // 按鈕
    const buttonContainer = contentEl.createDiv();
    buttonContainer.style.textAlign = "right";
    buttonContainer.style.marginTop = "20px";

    const cancelButton = buttonContainer.createEl("button", {
      text: t("common.cancel"),
    });
    cancelButton.onclick = () => this.close();

    const saveButton = buttonContainer.createEl("button", {
      text: t("common.save"),
      cls: "mod-cta",
    });
    saveButton.style.marginLeft = "10px";
    saveButton.onclick = () => {
      void this.submitForm(nameInput, includeGeometry, autoSave);
    };

    setTimeout(() => nameInput?.focus(), 50);
  }

  private async submitForm(
    nameInput: HTMLInputElement,
    includeGeometry: boolean,
    autoSave: boolean
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
    if (this.plugin?.manager?.generateSmartLayoutName) {
      return this.plugin.manager.generateSmartLayoutName(this.layout);
    }
    const now = new Date();
    const i18n = getI18n();
    const dateStr = i18n.formatDate(now);
    return `${t("saveModal.title")} ${dateStr}`;
  }
}
