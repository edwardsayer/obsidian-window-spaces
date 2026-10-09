import { App, PluginSettingTab, Setting, Notice, Modal, setIcon } from "obsidian";
import type { SettingDefinition, SettingDefinitionItem } from "obsidian";
import { t } from "./i18n";
import {
  ICON_CHOICES,
  applyItemIcon,
  enumerateAvailableViews,
  ensureViewIcon,
  getViewsFromHostSplit,
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

import type { ActivityBarItem } from "./types";

function isActivityBarItem(value: ActivityBarItem | null | undefined): value is ActivityBarItem {
  return !!value && typeof value.viewType === "string" && value.viewType.trim().length > 0;
}

function getSettingPath(source: Record<string, unknown>, path: string): unknown {
  let value: unknown = source;
  for (const part of path.split(".")) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

function setSettingPath(source: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  const last = parts.pop();
  if (!last) return;
  let cursor = source;
  for (const part of parts) {
    const next = cursor[part];
    if (next === null || typeof next !== "object") {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[last] = value;
}

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

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: "group",
        heading: t("settings.generalSection"),
        items: [
          {
            name: t("settings.showNotifications"),
            desc: t("settings.showNotificationsDesc"),
            control: { type: "toggle", key: "showNotifications" }
          },
          {
            name: t("settings.showWindowLayoutsRibbonIcon"),
            desc: t("settings.showWindowLayoutsRibbonIconDesc"),
            control: { type: "toggle", key: "showWindowLayoutsRibbonIcon" }
          },
          {
            name: t("settings.showLayoutStatusBar"),
            desc: t("settings.showLayoutStatusBarDesc"),
            control: { type: "toggle", key: "showLayoutStatusBar" }
          },
          {
            name: t("settings.popoutAccentsEnable"),
            desc: t("settings.popoutAccentsEnableDesc"),
            control: { type: "toggle", key: "popoutAccents.enabled" }
          },
          {
            name: t("settings.popoutAccentsSplitter"),
            desc: t("settings.popoutAccentsSplitterDesc"),
            visible: () => this.plugin.settings.popoutAccents?.enabled !== false,
            control: { type: "toggle", key: "popoutAccents.splitter" }
          },
          {
            name: t("settings.popoutAccentsActivityBar"),
            desc: t("settings.popoutAccentsActivityBarDesc"),
            visible: () => this.plugin.settings.popoutAccents?.enabled !== false,
            control: { type: "toggle", key: "popoutAccents.activityBar" }
          },
          {
            name: t("settings.enableInterceptor"),
            desc: t("settings.enableInterceptorDesc"),
            control: { type: "toggle", key: "workspaceInterceptorEnabled" }
          }
        ]
      },
      {
        type: "group",
        heading: t("settings.popoutDefaultsSection"),
        items: [
          {
            name: t("settings.nativePopoutPolicy"),
            desc: t("settings.nativePopoutPolicyDesc"),
            control: {
              type: "dropdown",
              key: "nativePopoutPolicy",
              options: {
                "status-bar-only": t("settings.policyStatusBarOnly"),
                full: t("settings.policyFull"),
                disabled: t("settings.policyDisabled"),
              },
            },
          },
          {
            name: t("settings.urlPopoutPolicy"),
            desc: t("settings.urlPopoutPolicyDesc"),
            control: {
              type: "dropdown",
              key: "urlPopoutPolicy",
              options: {
                disabled: t("settings.policyDisabled"),
                "status-bar-only": t("settings.policyStatusBarOnly"),
                full: t("settings.policyFull"),
              },
            },
          },
          {
            name: t("settings.autoSaveEnabled"),
            desc: t("settings.autoSaveDescription"),
            control: { type: "toggle", key: "autoSave" }
          },
          {
            name: t("settings.defaultIcon"),
            desc: t("settings.defaultIconDesc"),
            render: (setting) => this.renderDefaultIconSetting(setting)
          },
          {
            name: t("settings.defaultBorderInset"),
            desc: t("settings.defaultBorderInsetDesc"),
            control: {
              type: "slider",
              key: "defaultBorderInset",
              min: 0,
              max: 5,
              step: 1,
              defaultValue: 1
            }
          },
          {
            name: t("settings.defaultFoldedCorner"),
            desc: t("settings.defaultFoldedCornerDesc"),
            control: { type: "toggle", key: "defaultShowFoldedCorner" }
          }
        ]
      },
      {
        type: "group",
        heading: t("settings.leftBar"),
        items: this.getActivityBarItems("left")
      },
      {
        type: "group",
        heading: t("settings.rightBar"),
        items: this.getActivityBarItems("right")
      },
      {
        name: t("settings.resetSettings"),
        desc: t("settings.resetSettingsDescription"),
        render: (setting) => this.renderResetSetting(setting)
      }
    ];
  }

  getControlValue(key: string): unknown {
    return getSettingPath(this.plugin.settings as unknown as Record<string, unknown>, key);
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    setSettingPath(this.plugin.settings as unknown as Record<string, unknown>, key, value);
    await this.plugin.saveSettings();

    if (key === "autoSave") {
      if (value === true) this.setupAutoSave();
      else this.removeAutoSave();
    } else if (key === "workspaceInterceptorEnabled") {
      this.plugin.workspaceInterceptor.enabled = value !== false;
    } else if (key === "nativePopoutPolicy" || key === "urlPopoutPolicy") {
      this.plugin.handlePopoutPolicyChange();
    } else if (key === "showWindowLayoutsRibbonIcon") {
      this.plugin.refreshRibbonIcons();
    } else if (
      key === "showLayoutStatusBar" ||
      key === "popoutAccents.enabled" ||
      key === "popoutAccents.splitter" ||
      key === "popoutAccents.activityBar" ||
      key === "defaultBorderInset" ||
      key === "defaultShowFoldedCorner"
    ) {
      this.plugin.activityBars.refreshAll();
      if (key === "showLayoutStatusBar" || key.startsWith("popoutAccents.")) {
        this.plugin.manager.refreshLayoutLabels();
      }
    }
  }

  private renderDefaultIconSetting(s: Setting): void {
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
      attr: { type: "button", title: t("settings.pickIcon") }
    });
    setIcon(pickIconBtn, "image");
    pickIconBtn.onclick = () => {
      new IconPickerModal(this.app, (selected) => {
        currentIcon = selected;
        iconInputEl.value = selected;
        this.plugin.settings.defaultIcon = selected;
        void this.plugin.saveSettings().then(() => {
          updatePreview();
          this.plugin.activityBars.refreshAll();
        });
      }).open();
    };

    const previewEl = s.controlEl.createDiv({ cls: "window-space-icon-preview" });
    const updatePreview = () => {
      previewEl.empty();
      const val = currentIcon || DEFAULT_SPACE_ICON;
      if (isSpaceEmoji(val)) {
        previewEl.createSpan({ text: val });
      } else {
        const iconDiv = previewEl.createDiv();
        if (!setIconWithCheck(iconDiv, val)) setIcon(iconDiv, "layout");
      }
    };
    updatePreview();
  }

  private renderResetSetting(s: Setting): void {
    s.addButton((button) => {
      button
        .setButtonText(t("settings.resetButton"))
        .setDestructive()
        .onClick(async () => {
          const confirmed = await this.showConfirmDialog(
            t("settings.resetConfirmMessage"),
            t("settings.resetConfirmTitle")
          );
          if (!confirmed) return;
          try {
            await this.plugin.resetSettingsPreservingSpaces();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn("Failed to reset Window Spaces settings:", error);
            new Notice(`${t("errors.failedToSave")}: ${message}`);
            return;
          }
          this.removeAutoSave();
          this.plugin.refreshRibbonIcons();
          this.plugin.workspaceInterceptor.enabled =
            this.plugin.settings.workspaceInterceptorEnabled !== false;
          this.plugin.manager?.refreshLayoutLabels();
          this.plugin.activityBars?.refreshAll();
          this.update();
          new Notice(t("settings.resetSuccess"));
        });
    });
  }

  private getDefaultBorderInset(): number {
    const value = this.plugin.settings.defaultBorderInset;
    return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 1;
  }

  /**
   * Activity Bar 區段的宣告式項目。
   *
   * 每一列都是一個 declarative setting（原生 `.setting-item`，滿寬兩欄），因此不會再出現
   * 「把整段區塊塞進單列 `.setting-item-control`」而半寬擠壓、互相嵌套的破版（v1.2.5 起的問題）。
   * 拖曳排序沿用原生 HTML5 drag events，由卡片上的 drop handler 統一處理。
   */
  private getActivityBarItems(side: "left" | "right"): SettingDefinition[] {
    const stored = this.plugin.settings.activityBars?.[side];
    const items = Array.isArray(stored) ? stored : [];
    const validItems = items.filter(isActivityBarItem);

    // Repair malformed entries left by an interrupted/old reorder instead of
    // letting one bad item break the declarative list.
    if (validItems.length !== items.length) {
      this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
      this.plugin.settings.activityBars[side] = validItems;
      void this.plugin.saveSettings().catch((error: unknown) => {
        console.warn("Failed to repair activity bar settings:", error);
      });
    }

    const definitionItems: SettingDefinition[] = [
      {
        name: t("settings.importFromHost"),
        desc: t("settings.importFromHostDesc"),
        render: (setting) => this.renderActivityBarImport(setting, side),
      },
      {
        name: t("settings.defaultActivityBarVisibility"),
        desc: t("settings.defaultActivityBarVisibilityDesc"),
        render: (setting) => this.renderActivityBarVisibility(setting, side),
      },
    ];

    validItems.forEach((item) => {
      definitionItems.push({
        name: item.label || resolveViewLabel(this.app, item.viewType),
        render: (setting) => this.renderActivityBarRow(setting, side, item),
      });
    });

    definitionItems.push({
      name: t("settings.addView"),
      render: (setting) => this.renderActivityBarAddRow(setting, side),
    });

    return definitionItems;
  }

  /** 「從主側欄匯入」列。 */
  private renderActivityBarImport(setting: Setting, side: "left" | "right"): void {
    // Keep host adoption explicit. A live mirror would overwrite a Space's
    // independent view selection whenever the main window changes.
    setting.addButton((button) => {
      button.setButtonText(t("settings.importFromHost")).onClick(async () => {
        const imported = getViewsFromHostSplit(this.app, side);
        if (imported.length === 0) {
          new Notice(t("settings.importFromHostEmpty"));
          return;
        }

        const previousActivityBars = this.plugin.settings.activityBars;
        this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
        this.plugin.settings.activityBars[side] = imported;
        try {
          await this.plugin.saveSettings();
          this.plugin.activityBars.refreshAll();
          this.update();
          new Notice(t("settings.importFromHostSuccess"));
        } catch (error: unknown) {
          this.plugin.settings.activityBars = previousActivityBars;
          console.warn("Failed to import Activity Bar views from host sidebar:", error);
        }
      });
    });
  }

  /** 「預設顯示此 Activity Bar」列。 */
  private renderActivityBarVisibility(setting: Setting, side: "left" | "right"): void {
    setting.addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.activityBarDefaults?.[side] !== false);
      toggle.onChange(async (value) => {
        this.plugin.settings.activityBarDefaults = this.plugin.settings.activityBarDefaults ?? { left: true, right: true };
        this.plugin.settings.activityBarDefaults[side] = value;
        await this.plugin.saveSettings();
        this.plugin.activityBars.refreshAll();
      });
    });
  }

  /** 單一 view 列：icon 選擇、還原預設 icon、移除，以及拖曳排序標記。 */
  private renderActivityBarRow(setting: Setting, side: "left" | "right", item: ActivityBarItem): void {
    let iconBtn: { setIcon: (icon: string) => unknown } | null = null;

    setting.addButton((button) => {
      iconBtn = button;
      // 動態套用 icon（見 saveModal）：避免同步 fallback("layout") 蓋過社群 view 的真實 icon。
      applyItemIcon(button.buttonEl, this.app, item);
      button.setTooltip(t("settings.pickIcon"));
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

    setting.addButton((button) => {
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

    setting.addButton((button) => {
      button.setButtonText(t("settings.removeView")).setDestructive().onClick(() => {
        const current = this.plugin.settings.activityBars?.[side] ?? [];
        if (!canRemoveActivityBarItem(current, enumerateAvailableViews(this.app)[side])) {
          new Notice(t("settings.keepOneActivityBarView"));
          return;
        }
        const idx = current.indexOf(item);
        if (idx >= 0) current.splice(idx, 1);
        this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
        this.plugin.settings.activityBars[side] = current;
        void this.plugin.saveSettings().then(() => {
          this.plugin.activityBars.refreshAll();
          this.update();
        });
      });
    });

    setting.settingEl.setAttr("data-window-spaces-activity-item", side);
    setting.settingEl.setAttr("data-drag-view-type", item.viewType);
    setting.settingEl.setAttr("draggable", "true");

    // 宣告式框架會重用同一列元素再跑一次 render（例如新增／移除／匯入後呼叫 update()），
    // 但不會清掉我們自己插入的節點，因此這裡必須 idempotent：先移除舊的拖曳把手，
    // 監聽器則用 flag 只掛一次（避免每次重繪都累加一個 grip）。
    setting.settingEl.querySelectorAll(":scope > .window-spaces-activity-drag-handle").forEach((el) => {
      el.remove();
    });

    if (setting.settingEl.dataset.windowSpacesRowWired !== "1") {
      setting.settingEl.dataset.windowSpacesRowWired = "1";

      setting.settingEl.addEventListener("dragstart", (e: DragEvent) => {
        // 事件時才讀取 viewType：列元素可能被重用給其他 view，closure 會過期。
        const viewType = setting.settingEl.getAttribute("data-drag-view-type") ?? "";
        setting.settingEl.classList.add("drag-source");
        if (!e.dataTransfer || !viewType) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(ACTIVITY_BAR_DRAG_DATA_TYPE, viewType);
      });

      setting.settingEl.addEventListener("dragend", () => {
        setting.settingEl.classList.remove("drag-source");
      });
    }

    setting.settingEl.querySelectorAll("button, input, select, .checkbox-container, .slider").forEach((el) => {
      el.setAttribute("draggable", "false");
    });

    const gripEl = setting.settingEl.createDiv({ cls: "window-spaces-activity-drag-handle" });
    gripEl.setAttr("aria-label", t("settings.dragToReorder"));
    setIcon(gripEl, "grip-vertical");
    setting.settingEl.insertBefore(gripEl, setting.settingEl.firstChild);

    const card = setting.settingEl.closest<HTMLElement>(".setting-items");
    if (card) this.wireActivityBarDropTarget(card, side);
  }

  /** 「新增 view」列：下拉選單（排除已加入者）＋ Add view 按鈕。 */
  private renderActivityBarAddRow(setting: Setting, side: "left" | "right"): void {
    const selectEl = setting.controlEl.createEl("select", { cls: "dropdown" });
    this.rebuildViewSelect(selectEl, side);

    setting.addButton((button) => {
      button.setButtonText(t("settings.addView")).onClick(() => {
        const viewType = selectEl.value.trim();
        if (!viewType) return;

        const current = this.plugin.settings.activityBars?.[side] ?? [];
        if (current.some((item: ActivityBarItem) => item.viewType === viewType)) return;

        const newItem: ActivityBarItem = {
          viewType,
          side,
          label: undefined,
          // 見 saveModal.Add：不把 resolveViewIcon 的 fallback（"layout"）寫死——
          // 社群 view（notebook-navigator 等）的實 icon 需動態偵測，寫死會蓋過
          // 正確 icon；一律以動態（applyItemIcon）+ ensureViewIcon 補正。
          icon: undefined,
        };
        current.push(newItem);
        this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
        this.plugin.settings.activityBars[side] = current;
        void this.plugin.saveSettings().then(() => {
          this.plugin.activityBars.refreshAll();
          this.update();

          void ensureViewIcon(this.app, viewType).then((icon) => {
            if (!icon) return;
            newItem.icon = icon;
            this.plugin.activityBars.refreshAll();
            void this.plugin.saveSettings();
            this.update();
          });
        });
      });
    });
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

  /** 在卡片上掛一次 drag & drop handler（列本身只帶 data-* 標記）。 */
  private wireActivityBarDropTarget(card: HTMLElement, side: "left" | "right"): void {
    if (card.dataset.windowSpacesDropWired === side) return;
    card.dataset.windowSpacesDropWired = side;

    const rowSelector = `[data-window-spaces-activity-item="${side}"]`;
    const indicatorSelector = `${rowSelector}.drag-over-top, ${rowSelector}.drag-over-bottom`;
    const clearIndicators = () => {
      card.querySelectorAll(indicatorSelector).forEach((el) => {
        el.classList.remove("drag-over-top", "drag-over-bottom");
      });
    };

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      clearIndicators();

      const target = (e.target as HTMLElement).closest<HTMLElement>(rowSelector);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const isBottom = e.clientY > rect.top + rect.height / 2;
      target.classList.add(isBottom ? "drag-over-bottom" : "drag-over-top");
    });

    card.addEventListener("drop", (e: DragEvent) => {
      e.preventDefault();

      const indicatorEl = card.querySelector<HTMLElement>(indicatorSelector);
      const isBottom = indicatorEl?.classList.contains("drag-over-bottom") ?? false;
      clearIndicators();

      if (!indicatorEl) return;

      const draggedViewType = e.dataTransfer?.getData(ACTIVITY_BAR_DRAG_DATA_TYPE) ?? "";
      const targetViewType = indicatorEl.getAttribute("data-drag-view-type") ?? "";
      if (!draggedViewType || !targetViewType) return;

      const current = this.plugin.settings.activityBars?.[side];
      if (!Array.isArray(current)) return;

      const reordered = reorderActivityBarItems(current.filter(isActivityBarItem), draggedViewType, targetViewType, isBottom);
      if (!reordered) return;

      this.plugin.settings.activityBars = this.plugin.settings.activityBars ?? { left: [], right: [] };
      this.plugin.settings.activityBars[side] = reordered;

      void this.plugin.saveSettings().then(() => {
        this.plugin.activityBars.refreshAll();
        this.update();
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
          this.autoSaveTimeout = window.setTimeout(() => {
            void (async () => {
              try {
                const layout = await this.plugin.manager.captureCurrentLayout({
                  name: t("settings.autoSaveEnabled"),
                });
                await this.plugin.manager.saveLayout(layout);
              } catch (error: unknown) {
                console.warn("Auto save failed:", error);
              }
            })();
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

