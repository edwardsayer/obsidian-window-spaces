import { App, PluginSettingTab, Setting, Notice, Modal } from "obsidian";
import { t, tWithParams } from "./i18n";
import { WindowLayoutsModal } from "./modals/restoreModal";

export class WindowSpacesSettingTab extends PluginSettingTab {
  private plugin: any;
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: t("settings.title") });

    // 一般設定
    containerEl.createEl("h3", { text: t("settings.autoSaveSection") });

    new Setting(containerEl)
      .setName(t("settings.showNotifications"))
      .setDesc(t("settings.showNotificationsDesc"))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showNotifications !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.showNotifications = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t("settings.autoSaveEnabled"))
      .setDesc(t("settings.autoSaveDescription"))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoSave === true);
        toggle.onChange(async (value) => {
          this.plugin.settings.autoSave = value;
          await this.plugin.saveSettings();

          if (value) {
            this.setupAutoSave();
          } else {
            this.removeAutoSave();
          }
        });
      });

    containerEl.createEl("h3", { text: t("settings.layoutDisplaySection") });

    new Setting(containerEl)
      .setName(t("settings.showLayoutStatusBar"))
      .setDesc(t("settings.showLayoutStatusBarDesc"))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showLayoutStatusBar === true);
        toggle.onChange(async (value) => {
          this.plugin.settings.showLayoutStatusBar = value;
          await this.plugin.saveSettings();
          this.plugin.manager.refreshLayoutLabels();
        });
      });

    new Setting(containerEl)
      .setName(t("settings.showWindowLayoutsRibbonIcon"))
      .setDesc(t("settings.showWindowLayoutsRibbonIconDesc"))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showWindowLayoutsRibbonIcon !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.showWindowLayoutsRibbonIcon = value;
          await this.plugin.saveSettings();
          this.plugin.refreshRibbonIcons();
        });
      });

    new Setting(containerEl)
      .setName(t("settings.maxLayouts"))
      .setDesc(t("settings.maxLayoutsDesc"))
      .addSlider((slider) => {
        slider
          .setLimits(0, 50, 1)
          .setValue(this.plugin.settings.maxLayouts || 20)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxLayouts = value;
            await this.plugin.saveSettings();
          });
      });

    // 佈局管理
    containerEl.createEl("h3", { text: t("settings.layoutsSection") });

    const layouts = this.plugin.manager.getSavedLayouts();

    if (layouts.length === 0) {
      containerEl.createEl("p", {
        text: t("settings.noLayouts"),
        cls: "setting-item-description",
      });
    } else {
      // 顯示佈局統計
      const statsEl = containerEl.createDiv();
      statsEl.addClass("layout-stats");
      statsEl.createEl("p", {
        text: tWithParams("settings.layoutStats", { count: layouts.length }),
        cls: "setting-item-description",
      });

      // 顯示每個佈局
      layouts.forEach((layout: any) => {
        const layoutContainer = containerEl.createDiv();
        layoutContainer.addClass("layout-setting-item");

        // 佈局名稱和基本信息
        const headerEl = layoutContainer.createDiv();
        headerEl.addClass("layout-header");

        headerEl.createEl("div", {
          text: layout.name,
          cls: "layout-name",
        });

        const infoEl = headerEl.createEl("div", {
          cls: "layout-info",
        });
        const fileCountText = tWithParams("settings.includesFiles", { count: layout.metadata?.fileCount || 0 });
        infoEl.createEl("span", {
          text: fileCountText,
          cls: "layout-file-count",
        });
        infoEl.createEl("span", {
          text: new Date(layout.timestamp).toLocaleDateString(),
          cls: "layout-date",
        });

        // 操作按鈕
        const actionsEl = layoutContainer.createDiv();
        actionsEl.addClass("layout-actions");

        const restoreBtn = actionsEl.createEl("button", {
          text: t("common.restore"),
          cls: "mod-cta",
        });
        restoreBtn.onclick = async () => {
          try {
            await this.plugin.manager.restoreLayout(layout);
          } catch (error: any) {
            new Notice(`${t("errors.failedToRestore")}: ${error.message}`);
          }
        };

        const renameBtn = actionsEl.createEl("button", {
          text: t("common.rename"),
        });
        renameBtn.onclick = () => {
          this.showRenameDialog(layout);
        };

        const deleteBtn = actionsEl.createEl("button", {
          text: t("common.delete"),
          cls: "mod-warning",
        });
        deleteBtn.onclick = () => {
          this.showDeleteDialog(layout);
        };
      });
    }

    // 危險操作
    containerEl.createEl("h3", { text: t("settings.resetSettings") });

    new Setting(containerEl)
      .setName(t("settings.resetSettings"))
      .setDesc(t("settings.resetSettingsDescription"))
      .addButton((button) => {
        button
          .setButtonText(t("settings.resetButton"))
          .setWarning()
          .onClick(async () => {
            const confirmed = await this.showConfirmDialog(
              t("settings.resetConfirmMessage"),
              t("settings.resetConfirmTitle")
            );
            if (confirmed) {
              this.plugin.settings.spaces = [];
              await this.plugin.saveSettings();
              this.display(); // 重新顯示設定頁面
              new Notice(t("settings.resetSuccess"));
            }
          });
      });
  }

  private setupAutoSave() {
    this.plugin.registerEvent(
      this.app.workspace.on("layout-change", () => {
        if (this.plugin.settings.autoSave) {
          if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
          }
          this.autoSaveTimeout = setTimeout(async () => {
            try {
              const layout = await this.plugin.manager.captureCurrentLayout({
                name: t("settings.autoSaveEnabled"),
              });
              await this.plugin.manager.saveLayout(layout);
            } catch (error) {
              console.warn("Auto save failed:", error);
            }
          }, 2000);
        }
      })
    );
  }

  private removeAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  private showRenameDialog(layout: any) {
    const modal = new Modal(this.app);
    modal.setTitle(t("manageModal.renameButton"));
    modal.onOpen = () => {
      let input: HTMLInputElement;
      const setting = new Setting(modal.contentEl).setName(t("saveModal.nameLabel")).addText((text) => {
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

      const cancelBtn = buttonContainer.createEl("button", {
        text: t("common.cancel"),
      });
      cancelBtn.onclick = () => modal.close();

      const saveBtn = buttonContainer.createEl("button", {
        text: t("common.save"),
        cls: "mod-cta",
      });
      saveBtn.style.marginLeft = "10px";

      const submit = async () => {
        const newName = input.value.trim();
        if (newName && newName !== layout.name) {
          layout.name = newName;
          await this.plugin.saveSettings();
          WindowLayoutsModal.renderAllInstances();
          this.display();
          new Notice(t("notifications.layoutRenamed"));
        }
        modal.close();
      };

      saveBtn.onclick = submit;
    };
    modal.open();
  }

  private showDeleteDialog(layout: any) {
    this.showConfirmDialog(
      tWithParams("settings.confirmDelete", { name: layout.name }),
      t("manageModal.confirmDeleteTitle")
    ).then(async (confirmed) => {
      if (confirmed) {
        try {
          await this.plugin.manager.deleteLayout(layout.id);
          this.display();
          new Notice(t("notifications.layoutDeleted"));
        } catch (error: any) {
          new Notice(`${t("errors.failedToDelete")}: ${error.message}`);
        }
      }
    });
  }

  private async showConfirmDialog(
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

        const cancelBtn = buttonContainer.createEl("button", {
          text: t("common.cancel"),
          cls: "mod-cta",
        });
        cancelBtn.onclick = () => {
          resolve(false);
          modal.close();
        };

        const confirmBtn = buttonContainer.createEl("button", {
          text: t("common.confirm"),
          cls: "mod-warning",
        });
        confirmBtn.style.marginLeft = "10px";
        confirmBtn.onclick = () => {
          resolve(true);
          modal.close();
        };
      };
      modal.open();
    });
  }
}
