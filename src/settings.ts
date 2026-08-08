import { App, PluginSettingTab, Setting, Notice, Modal, setIcon } from "obsidian";
import * as obsidian from "obsidian";
import { t } from "./i18n";
import { ActivityBarItem, SettingGroupLike } from "./types";
import {
  ICON_CHOICES,
  enumerateAvailableViews,
  ensureViewIcon,
  resolveViewIcon,
  resolveViewLabel,
  setIconWithCheck,
} from "./popout/viewRegistry";
import WindowSpacesPlugin from "./main";

type SettingContainer = HTMLElement | SettingGroupLike;

/** Obsidian `SettingGroup` 建構式（1.12.7+；舊版為 undefined）。 */
const SettingGroupCtor = (obsidian as unknown as {
  SettingGroup?: new (containerEl: HTMLElement) => SettingGroupLike;
}).SettingGroup;

/** 多欄 + 捲軸的 icon 選擇器 Modal。 */
export class IconPickerModal extends Modal {
  private onSelect: (icon: string) => void;

  constructor(app: App, onSelect: (icon: string) => void) {
    super(app);
    this.onSelect = onSelect;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("window-spaces-icon-picker");
    contentEl.createEl("h3", { text: t("settings.pickIcon") });
    const grid = contentEl.createDiv({ cls: "window-spaces-icon-grid" });
    ICON_CHOICES.forEach((iconName) => {
      const btn = grid.createEl("button", {
        cls: "clickable-icon",
        attr: { type: "button", title: iconName },
      });
      setIcon(btn, iconName);
      btn.onclick = () => {
        this.onSelect(iconName);
        this.close();
      };
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

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

  /** 建立 SettingGroup（若當前 Obsidian 版本支援）；不支援則回傳 null。 */
  private createGroup(containerEl: HTMLElement): SettingGroupLike | null {
    if (SettingGroupCtor) {
      try {
        return new SettingGroupCtor(containerEl);
      } catch {
        return null;
      }
    }
    return null;
  }

  /** 在 SettingGroup 或 HTMLElement 容器中建立並設定一個 Setting。 */
  private createSettingIn(
    container: SettingContainer,
    configure: (setting: Setting) => void
  ): Setting {
    const group = container as SettingGroupLike;
    if (group && typeof group.addSetting === "function") {
      let result: Setting | null = null;
      group.addSetting((setting) => {
        result = setting;
        configure(setting);
      });
      return result as Setting;
    }
    const setting = new Setting(container as HTMLElement);
    configure(setting);
    return setting;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName(t("settings.title")).setHeading();

    // ===== 一般設定（單一 panel） =====
    const generalGroup = this.createGroup(containerEl) ?? containerEl;
    this.createSettingIn(generalGroup, (s) => s.setName(t("settings.autoSaveSection")).setHeading());

    this.createSettingIn(generalGroup, (s) => {
      s.setName(t("settings.showNotifications")).setDesc(t("settings.showNotificationsDesc"));
      s.addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showNotifications !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.showNotifications = value;
          await this.plugin.saveSettings();
        });
      });
    });

    this.createSettingIn(generalGroup, (s) => {
      s.setName(t("settings.autoSaveEnabled")).setDesc(t("settings.autoSaveDescription"));
      s.addToggle((toggle) => {
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
    });

    // ===== Popout 空間顯示（單一 panel） =====
    const displayGroup = this.createGroup(containerEl) ?? containerEl;
    this.createSettingIn(displayGroup, (s) => s.setName(t("settings.layoutDisplaySection")).setHeading());

    this.createSettingIn(displayGroup, (s) => {
      s.setName(t("settings.showLayoutStatusBar")).setDesc(t("settings.showLayoutStatusBarDesc"));
      s.addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showLayoutStatusBar === true);
        toggle.onChange(async (value) => {
          this.plugin.settings.showLayoutStatusBar = value;
          await this.plugin.saveSettings();
          this.plugin.manager.refreshLayoutLabels();
        });
      });
    });

    this.createSettingIn(displayGroup, (s) => {
      s.setName(t("settings.showWindowLayoutsRibbonIcon")).setDesc(t("settings.showWindowLayoutsRibbonIconDesc"));
      s.addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showWindowLayoutsRibbonIcon !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.showWindowLayoutsRibbonIcon = value;
          await this.plugin.saveSettings();
          this.plugin.refreshRibbonIcons();
        });
      });
    });

    this.createSettingIn(displayGroup, (s) => {
      s.setName(t("settings.maxLayouts")).setDesc(t("settings.maxLayoutsDesc"));
      s.addSlider((slider) => {
        slider
          .setLimits(0, 50, 1)
          .setValue(this.plugin.settings.maxLayouts || 20)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxLayouts = value;
            await this.plugin.saveSettings();
          });
      });
    });

    // ===== Popout 側欄（Activity Bars） =====
    this.renderActivityBarSection(containerEl);

    // ===== 視窗外觀與圖示 (Accent & Icons) =====
    const accentGroup = this.createGroup(containerEl) ?? containerEl;
    this.createSettingIn(accentGroup, (s) => s.setName(t("settings.accentSection")).setHeading());

    this.createSettingIn(accentGroup, (s) => {
      s.setName(t("settings.defaultIcon")).setDesc(t("settings.defaultIconDesc"));
      s.controlEl.addClass("window-space-icon-setting-control");

      let currentIcon = this.plugin.settings.defaultIcon || "layout";
      let iconInputEl!: HTMLInputElement;

      s.addText((text) => {
        iconInputEl = text.inputEl;
        text.setPlaceholder(t("saveModal.iconPlaceholder"));
        text.setValue(currentIcon);
        text.onChange(async (val) => {
          currentIcon = val.trim() || "layout";
          this.plugin.settings.defaultIcon = currentIcon;
          await this.plugin.saveSettings();
          updatePreview();
          this.plugin.activityBars.refreshAll();
        });
      });

      const pickIconBtn = s.controlEl.createEl("button", {
        cls: "clickable-icon",
        attr: { type: "button", title: t("settings.pickIcon") },
      });
      setIcon(pickIconBtn, "image");
      pickIconBtn.onclick = () => {
        new IconPickerModal(this.app, async (selected) => {
          currentIcon = selected;
          iconInputEl.value = selected;
          this.plugin.settings.defaultIcon = selected;
          await this.plugin.saveSettings();
          updatePreview();
          this.plugin.activityBars.refreshAll();
        }).open();
      };

      const previewEl = s.controlEl.createDiv({ cls: "window-space-icon-preview" });
      const updatePreview = () => {
        previewEl.empty();
        const val = currentIcon || "layout";
        const isEmoji = /\p{Extended_Pictographic}/u.test(val) || !/^[a-zA-Z0-9-]+$/.test(val);
        if (isEmoji) {
          previewEl.createSpan({ text: val });
        } else {
          const iconDiv = previewEl.createDiv();
          if (!setIconWithCheck(iconDiv, val)) {
            setIcon(iconDiv, "layout");
          }
        }
      };
      updatePreview();
    });

    // ===== 危險操作（單一 panel） =====
    const dangerGroup = this.createGroup(containerEl) ?? containerEl;
    this.createSettingIn(dangerGroup, (s) => s.setName(t("settings.resetSettings")).setHeading());

    this.createSettingIn(dangerGroup, (s) => {
      s.setName(t("settings.resetSettings")).setDesc(t("settings.resetSettingsDescription"));
      s.addButton((button) => {
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
    });
  }

  /** 渲染 Popout 側欄（Activity Bars）設定區塊（每個子區塊各自一個 SettingGroup panel）。 */
  private renderActivityBarSection(section: HTMLElement): void {
    const mainGroup = this.createGroup(section) ?? section;
    this.createSettingIn(mainGroup, (s) => s.setName(t("settings.popoutSidebarSection")).setHeading());

    this.createSettingIn(mainGroup, (s) => {
      s.setName(t("settings.enableInterceptor")).setDesc(t("settings.enableInterceptorDesc"));
      s.addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.workspaceInterceptorEnabled !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.workspaceInterceptorEnabled = value;
          this.plugin.workspaceInterceptor.enabled = value;
          await this.plugin.saveSettings();
        });
      });
    });

    this.createSettingIn(mainGroup, (s) => {
      s.setName(t("settings.enableActivityBars")).setDesc(t("settings.enableActivityBarsDesc"));
      s.addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showActivityBars !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.showActivityBars = value;
          await this.plugin.saveSettings();
          this.plugin.activityBars.refreshAll();
          this.display();
        });
      });
    });

    this.renderActivityBarSide(section, "left", t("settings.leftBar"));
    this.renderActivityBarSide(section, "right", t("settings.rightBar"));
  }

  /** 渲染單一側欄 view 項目列，回傳用於 surgical 更新的 handle。 */
  private renderSideItemRow(
    container: SettingContainer,
    side: "left" | "right",
    item: ActivityBarItem,
    onChanged?: () => void
  ): {
    row: Setting;
    updateIcon: (icon: string) => void;
  } {
    let iconBtn: { setIcon: (icon: string) => unknown } | null = null;

    const row = this.createSettingIn(container, (s) => {
      const resolvedLabel = resolveViewLabel(this.app, item.viewType);
      s.setName(item.label || resolvedLabel);
      s.setDesc(item.viewType);

      s.addButton((button) => {
        iconBtn = button;
        button.setIcon(item.icon || resolveViewIcon(this.app, item.viewType)).setTooltip(t("settings.pickIcon"));
        button.onClick(() => {
          const modal = new IconPickerModal(this.app, (iconName) => {
            item.icon = iconName;
            void this.plugin.saveSettings().then(() => {
              this.plugin.activityBars.refreshAll();
              iconBtn?.setIcon(iconName);
            });
          });
          modal.open();
        });
      });

      s.addButton((button) => {
        button.setIcon("rotate-ccw").setTooltip(t("settings.restoreDefaultIcon"));
        button.onClick(() => {
          item.icon = undefined;
          void this.plugin.saveSettings().then(() => {
            this.plugin.activityBars.refreshAll();
            // 先以既有快取顯示；再重新動態偵測預設 icon（不持久化，維持「還原預設」語義）
            iconBtn?.setIcon(resolveViewIcon(this.app, item.viewType));
            void ensureViewIcon(this.app, item.viewType).then((icon) => {
              if (!icon || item.icon) return;
              iconBtn?.setIcon(icon);
            });
          });
        });
      });

      s.addButton((button) => {
        button.setButtonText(t("settings.removeView")).setWarning().onClick(() => {
          const current = this.plugin.settings.activityBars?.[side] ?? [];
          const idx = current.indexOf(item);
          if (idx >= 0) {
            current.splice(idx, 1);
            this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
            this.plugin.settings.activityBars[side] = current;
          }
          void this.plugin.saveSettings().then(() => {
            this.plugin.activityBars.refreshAll();
            row.settingEl.remove();
            onChanged?.();
          });
        });
      });
    });

    return { row, updateIcon: (icon) => iconBtn?.setIcon(icon) };
  }

  /** 重建「新增 view」下拉選單的選項（排除已加入的 view type）。 */
  private rebuildViewSelect(selectEl: HTMLSelectElement, side: "left" | "right"): void {
    selectEl.empty();
    const available = enumerateAvailableViews(this.app);
    const allTypes = Array.from(
      new Set([...available.left, ...available.right].map((item) => item.viewType))
    );
    const current = this.plugin.settings.activityBars?.[side] ?? [];
    allTypes.forEach((viewType) => {
      if (current.some((item) => item.viewType === viewType)) return;
      const label = resolveViewLabel(this.app, viewType);
      const option = selectEl.createEl("option", {
        value: viewType,
        text: label,
      });
      option.setAttr("data-icon", resolveViewIcon(this.app, viewType));
    });
  }

  private renderActivityBarSide(section: HTMLElement, side: "left" | "right", heading: string): void {
    // 每個側欄是一個 SettingGroup（單一 panel）
    const group = this.createGroup(section) ?? section;
    this.createSettingIn(group, (s) => s.setName(heading).setHeading());

    const items = this.plugin.settings.activityBars?.[side] ?? [];

    if (items.length === 0) {
      this.createSettingIn(group, (s) => s.setDesc(t("settings.addView")));
    }

    // 先建立 add-row（capture selectEl 供 callback 使用），最後再移到底部
    let selectEl!: HTMLSelectElement;
    let customInput!: HTMLInputElement;
    const addRow = this.createSettingIn(group, (s) => {
      selectEl = s.controlEl.createEl("select", {
        cls: "dropdown",
      });
      customInput = s.controlEl.createEl("input", {
        type: "text",
        placeholder: t("settings.viewTypePlaceholder"),
      });
      customInput.addClass("window-spaces-view-type-input");

      s.addButton((button) => {
        button.setButtonText(t("settings.addView")).onClick(() => {
          const selected = selectEl.value.trim();
          const custom = customInput.value.trim();
          const viewType = custom || selected;
          if (!viewType) return;

          const current = this.plugin.settings.activityBars?.[side] ?? [];
          if (current.some((item: ActivityBarItem) => item.viewType === viewType)) return;

          const newItem: ActivityBarItem = {
            viewType,
            side,
            label: undefined,
            icon: resolveViewIcon(this.app, viewType),
          };
          current.push(newItem);
          this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
          this.plugin.settings.activityBars[side] = current;
          void this.plugin.saveSettings().then(() => {
            this.plugin.activityBars.refreshAll();
            // surgical：在 add-row 前插入新列，並重建下拉（移除已加入的 type）
            const { row, updateIcon } = this.renderSideItemRow(group, side, newItem);
            addRow.settingEl.before(row.settingEl);
            customInput.value = "";
            refreshSelect();

            // 該 view 之前未找到/設定 icon（落入通用 fallback）→ 重新動態偵測並補上真實 icon
            if (newItem.icon === "layout") {
              void ensureViewIcon(this.app, viewType).then((icon) => {
                if (!icon || icon === newItem.icon) return;
                newItem.icon = icon;
                updateIcon(icon);
                void this.plugin.saveSettings();
              });
            }
          });
        });
      });
    });

    const refreshSelect = () => this.rebuildViewSelect(selectEl, side);

    items.forEach((item) => {
      this.renderSideItemRow(group, side, item, refreshSelect);
    });

    // 把 add-row 移到 items 之後（保持「view 列 → add-row」順序）
    addRow.settingEl.parentElement?.appendChild(addRow.settingEl);
    refreshSelect();
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

