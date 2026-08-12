import { App, PluginSettingTab, Setting, Notice, Modal, setIcon } from "obsidian";
import * as obsidian from "obsidian";
import { t } from "./i18n";
import { SettingGroupLike } from "./types";
import {
  ICON_CHOICES,
  enumerateAvailableViews,
  ensureViewIcon,
  resolveViewIcon,
  resolveViewLabel,
  setIconWithCheck,
  sortViewTypesByLabel,
} from "./popout/viewRegistry";
import {
  ACTIVITY_BAR_DRAG_DATA_TYPE,
  canRemoveActivityBarItem,
  reorderActivityBarItems,
} from "./settingsActivityBar";
import WindowSpacesPlugin from "./main";
import { DEFAULT_SPACE_ICON, isSpaceEmoji } from "./spaceVisuals";

type SettingContainer = HTMLElement | SettingGroupLike;
import type { ActivityBarItem } from "./types";

function isActivityBarItem(value: ActivityBarItem | null | undefined): value is ActivityBarItem {
  return !!value && typeof value.viewType === "string" && value.viewType.trim().length > 0;
}

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

    // ===== 一般設定（單一 panel） =====
    new Setting(containerEl).setName(t("settings.autoSaveSection")).setHeading();
    const generalGroup = this.createGroup(containerEl) ?? containerEl;

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
    new Setting(containerEl).setName(t("settings.layoutDisplaySection")).setHeading();
    const displayGroup = this.createGroup(containerEl) ?? containerEl;

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

    // ===== Popout 側欄（Activity Bars） =====
    this.renderActivityBarSection(containerEl);

    // ===== 視窗外觀與圖示 (Accent & Icons) =====
    new Setting(containerEl).setName(t("settings.accentSection")).setHeading();
    const accentGroup = this.createGroup(containerEl) ?? containerEl;

    this.createSettingIn(accentGroup, (s) => {
      s.setName(t("settings.defaultIcon")).setDesc(t("settings.defaultIconDesc"));
      s.controlEl.addClass("window-space-icon-setting-control");

      let currentIcon = this.plugin.settings.defaultIcon || DEFAULT_SPACE_ICON;
      let iconInputEl!: HTMLInputElement;

      s.addText((text) => {
        iconInputEl = text.inputEl;
        text.setPlaceholder(t("saveModal.iconPlaceholder"));
        text.setValue(currentIcon);
        text.onChange(async (val) => {
          currentIcon = val.trim() || DEFAULT_SPACE_ICON;
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
        const val = currentIcon || DEFAULT_SPACE_ICON;
        const isEmoji = isSpaceEmoji(val);
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

    this.createSettingIn(accentGroup, (s) => {
      s.setName(t("settings.defaultBorderInset")).setDesc(t("settings.defaultBorderInsetDesc"));
      s.addSlider((slider) => {
        slider
          .setLimits(0, 20, 1)
          .setValue(this.getDefaultBorderInset())
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.defaultBorderInset = value;
            await this.plugin.saveSettings();
            this.plugin.activityBars.refreshAll();
          });
      });
    });

    this.createSettingIn(accentGroup, (s) => {
      s.setName(t("settings.defaultFoldedCorner")).setDesc(t("settings.defaultFoldedCornerDesc"));
      s.addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.defaultShowFoldedCorner !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.defaultShowFoldedCorner = value;
          await this.plugin.saveSettings();
          this.plugin.activityBars.refreshAll();
        });
      });
    });

    // ===== 危險操作（單一 panel） =====
    new Setting(containerEl).setName(t("settings.resetSettings")).setHeading();
    const dangerGroup = this.createGroup(containerEl) ?? containerEl;

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

  private getDefaultBorderInset(): number {
    const value = this.plugin.settings.defaultBorderInset;
    return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(20, value)) : 1;
  }

  /** 渲染 Popout 側欄（Activity Bars）設定區塊（每個子區塊各自一個 SettingGroup panel）。 */
  private renderActivityBarSection(section: HTMLElement): void {
    new Setting(section).setName(t("settings.popoutSidebarSection")).setHeading();
    const mainGroup = this.createGroup(section) ?? section;

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

    this.renderActivityBarSide(section, "left", t("settings.leftBar"));
    this.renderActivityBarSide(section, "right", t("settings.rightBar"));
  }

  /** 渲染單一側欄 view 項目列，回傳用於 surgical 更新的 handle。 */
  private renderSideItemRow(
    container: SettingContainer,
    side: "left" | "right",
    item: ActivityBarItem,
    index: number,
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
          if (!canRemoveActivityBarItem(current, enumerateAvailableViews(this.app)[side])) {
            new Notice(t("settings.keepOneActivityBarView"));
            return;
          }
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

    row.settingEl.setAttr("data-window-spaces-activity-item", side);
    row.settingEl.setAttr("data-drag-index", String(index));
    row.settingEl.setAttr("data-drag-view-type", item.viewType);
    row.settingEl.setAttr("draggable", "true");

    row.settingEl.addEventListener("dragstart", (e: DragEvent) => {
      row.settingEl.classList.add("drag-source");
      if (!e.dataTransfer) return;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(ACTIVITY_BAR_DRAG_DATA_TYPE, item.viewType);
    });

    row.settingEl.addEventListener("dragend", () => {
      row.settingEl.classList.remove("drag-source");
    });

    row.settingEl.querySelectorAll("button, input, select, .checkbox-container, .slider").forEach((el) => {
      el.setAttribute("draggable", "false");
    });

    const gripEl = row.settingEl.createDiv({ cls: "window-spaces-activity-drag-handle" });
    gripEl.setAttr("aria-label", t("settings.dragToReorder"));
    setIcon(gripEl, "grip-vertical");
    row.settingEl.insertBefore(gripEl, row.settingEl.firstChild);

    return { row, updateIcon: (icon) => iconBtn?.setIcon(icon) };
  }

  /** 重建「新增 view」下拉選單的選項（排除已加入的 view type）。 */
  private rebuildViewSelect(selectEl: HTMLSelectElement, side: "left" | "right"): void {
    selectEl.empty();
    const available = enumerateAvailableViews(this.app);
    const allTypes = sortViewTypesByLabel(this.app, Array.from(
      new Set([...available.left, ...available.right].map((item) => item.viewType))
    ));
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
    new Setting(section).setName(heading).setHeading();
    const group = this.createGroup(section) ?? section;
    this.createSettingIn(group, (s) => {
      s.setName(t("settings.defaultActivityBarVisibility"));
      s.setDesc(t("settings.defaultActivityBarVisibilityDesc"));
      s.addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.activityBarDefaults?.[side] !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.activityBarDefaults = this.plugin.settings.activityBarDefaults ?? { left: true, right: true };
          this.plugin.settings.activityBarDefaults[side] = value;
          await this.plugin.saveSettings();
          this.plugin.activityBars.refreshAll();
        });
      });
    });

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
            renderItemRows();
            customInput.value = "";

            if (newItem.icon === "layout") {
              void ensureViewIcon(this.app, viewType).then((icon) => {
                if (!icon || icon === newItem.icon) return;
                newItem.icon = icon;
                renderItemRows();
                void this.plugin.saveSettings();
              });
            }
          });
        });
      });
    });

    const refreshSelect = () => this.rebuildViewSelect(selectEl, side);

    const renderItemRows = () => {
      const current = this.plugin.settings.activityBars?.[side];
      const items = Array.isArray(current) ? current : [];
      const validItems = items.filter(isActivityBarItem);

      // Repair malformed entries left by an interrupted/old reorder instead of
      // allowing one bad item to throw after the existing DOM is removed.
      if (validItems.length !== items.length) {
        this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
        this.plugin.settings.activityBars[side] = validItems;
        void this.plugin.saveSettings().catch((error: unknown) => {
          console.warn("Failed to repair activity bar settings:", error);
        });
      }

      const existingRows = new Map<string, HTMLElement>();
      section.querySelectorAll<HTMLElement>(`[data-window-spaces-activity-item="${side}"]`).forEach((el) => {
        const viewType = el.getAttribute("data-drag-view-type");
        if (viewType) existingRows.set(viewType, el);
      });

      const activeTypes = new Set(validItems.map((item) => item.viewType));
      existingRows.forEach((row, viewType) => {
        if (!activeTypes.has(viewType)) row.remove();
      });

      // Reuse existing rows when reordering. This avoids a transient empty
      // SettingGroup DOM and prevents the whole list disappearing after drop.
      validItems.forEach((item, index) => {
        const existingRow = existingRows.get(item.viewType);
        if (existingRow) {
          existingRow.setAttr("data-drag-index", String(index));
          addRow.settingEl.before(existingRow);
          return;
        }
        const handle = this.renderSideItemRow(group, side, item, index, () => {
          renderItemRows();
          refreshSelect();
          this.plugin.activityBars.refreshAll();
        });
        addRow.settingEl.before(handle.row.settingEl);
      });

      refreshSelect();
    };

    renderItemRows();

    // 把 add-row 移到 items 之後（保持「view 列 → add-row」順序）
    addRow.settingEl.parentElement?.appendChild(addRow.settingEl);

    section.addEventListener("dragover", (e) => {
      e.preventDefault();
      section.querySelectorAll(
        `[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`
      ).forEach((el) => { el.classList.remove("drag-over-top", "drag-over-bottom"); });

      const target = (e.target as HTMLElement).closest(`[data-window-spaces-activity-item="${side}"]`);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const isBottom = e.clientY > rect.top + rect.height / 2;
      target.classList.add(isBottom ? "drag-over-bottom" : "drag-over-top");
    });

    section.addEventListener("drop", (e: DragEvent) => {
      e.preventDefault();

      const indicatorEl = section.querySelector(
        `[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`
      );

      const isBottom = indicatorEl?.classList.contains("drag-over-bottom") ?? false;

      section.querySelectorAll(
        `[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`
      ).forEach((el) => { el.classList.remove("drag-over-top", "drag-over-bottom"); });

      if (!indicatorEl) return;

      const draggedViewType = e.dataTransfer?.getData(ACTIVITY_BAR_DRAG_DATA_TYPE) ?? "";
      const targetViewType = indicatorEl.getAttribute("data-drag-view-type") ?? "";
      if (!draggedViewType || !targetViewType) return;

      const current = this.plugin.settings.activityBars?.[side];
      if (!Array.isArray(current)) return;

      const reordered = reorderActivityBarItems(current, draggedViewType, targetViewType, isBottom);
      if (!reordered) return;

      this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
      this.plugin.settings.activityBars[side] = reordered;

      void this.plugin.saveSettings().then(() => {
        this.plugin.activityBars.refreshAll();
        renderItemRows();
      }).catch((error: unknown) => {
        console.warn("Failed to save activity bar order:", error);
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

