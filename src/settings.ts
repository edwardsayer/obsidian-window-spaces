import { App, PluginSettingTab, Setting, Notice, Modal } from "obsidian";
import { t } from "./i18n";
import WindowSpacesPlugin from "./main";

export class WindowSpacesSettingTab extends PluginSettingTab {
  private plugin: WindowSpacesPlugin;
  private autoSaveTimeout: number | null = null;

  constructor(app: App, plugin: WindowSpacesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): unknown[] {
    return [];
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName(t("settings.title")).setHeading();

    // 一般設定
    new Setting(containerEl).setName(t("settings.autoSaveSection")).setHeading();

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

    new Setting(containerEl).setName(t("settings.layoutDisplaySection")).setHeading();

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

    // 危險操作
    new Setting(containerEl).setName(t("settings.resetSettings")).setHeading();

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
          if (this.autoSaveTimeout !== null) {
            window.clearTimeout(this.autoSaveTimeout);
          }
          this.autoSaveTimeout = window.setTimeout(async () => {
            try {
              const layout = await this.plugin.manager.captureCurrentLayout({
                name: t("settings.autoSaveEnabled"),
              });
              await this.plugin.manager.saveLayout(layout);
            } catch (error: unknown) {
              console.warn("Auto save failed:", error);
            }
          }, 2000);
        }
      })
    );
  }

  private removeAutoSave() {
    if (this.autoSaveTimeout !== null) {
      window.clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
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

        const buttonContainer = modal.contentEl.createDiv("ws-dialog-actions");

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
        confirmBtn.onclick = () => {
          resolve(true);
          modal.close();
        };
      };
      modal.open();
    });
  }
}

