import { App, Modal, Setting, Notice, ToggleComponent, setIcon } from "obsidian";
import * as obsidian from "obsidian";
import {
  ActivityBarItem,
  WindowLayout,
  WindowSpaceActivityBarSettings,
  DEFAULT_COLOR_PRESETS,
  SettingGroupLike,
} from "../types";
import { t, getI18n } from "../i18n";
import WindowSpacesPlugin from "../main";
import {
  enumerateAvailableViews,
  ensureViewIcon,
  resolveViewIcon,
  resolveViewLabel,
  setIconWithCheck,
  sortViewTypesByLabel,
} from "../popout/viewRegistry";
import { IconPickerModal } from "../settings";
import {
  ACTIVITY_BAR_DRAG_DATA_TYPE,
  canRemoveActivityBarItem,
  reorderActivityBarItems,
} from "../settingsActivityBar";
import { DEFAULT_SPACE_ICON, isSpaceEmoji } from "../spaceVisuals";

type SettingContainer = HTMLElement | SettingGroupLike;

const SettingGroupCtor = (obsidian as unknown as {
  SettingGroup?: new (containerEl: HTMLElement) => SettingGroupLike;
}).SettingGroup;

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

  private createGroup(containerEl: HTMLElement): SettingGroupLike | null {
    if (!SettingGroupCtor) return null;
    try {
      return new SettingGroupCtor(containerEl);
    } catch {
      return null;
    }
  }

  private createSettingIn(
    container: SettingContainer,
    configure: (setting: Setting) => void
  ): Setting {
    const group = container as SettingGroupLike;
    if (typeof group.addSetting === "function") {
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

  /**
   * Obsidian's SettingGroup has changed its internal DOM property across
   * versions. Resolve the rendered panel from the group when possible and
   * fall back to the most recently-created panel in this modal.
   */
  private getGroupElement(group: SettingContainer, fallback: HTMLElement): HTMLElement {
    const candidate = (group as SettingGroupLike).settingEl;
    if (candidate && typeof candidate.querySelectorAll === "function") return candidate;

    const groups = fallback.querySelectorAll<HTMLElement>(".setting-group");
    return groups[groups.length - 1] ?? fallback;
  }

  onOpen() {
    this.setTitle(t("saveModal.title"));
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("window-layouts-modal");

    let selectedSections: string[] = Array.from(this.layout.sections || []);
    const isExistingSpace = this.plugin.settings.spaces.some(
      (space) => space.id === this.layout.id || (!!this.layout.name && space.name === this.layout.name)
    );
    let borderInset = this.getEffectiveBorderInset();
    let borderInsetOverride: number | undefined = this.layout.borderInset;
    let showFoldedCorner = this.getEffectiveFoldedCorner();
    let showFoldedCornerOverride: boolean | undefined = this.layout.showFoldedCorner;
    const activityBarSettings = {
      left: this.createActivityBarDraft("left", isExistingSpace),
      right: this.createActivityBarDraft("right", isExistingSpace),
    };

    new Setting(contentEl).setName(t("saveModal.spaceSection")).setHeading();
    const identityGroup = this.createGroup(contentEl) ?? contentEl;

    // 名稱輸入與動態同名提示
    let nameInput!: HTMLInputElement;
    const nameSetting = this.createSettingIn(identityGroup, (setting) => {
      setting.setName(t("saveModal.nameLabel"));
      setting.addText((text) => {
        nameInput = text.inputEl;
        text.inputEl.value = this.layout.name || this.generateDefaultName();
        text.inputEl.focus();
        text.inputEl.select();
        text.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void this.submitForm(
              nameInput,
              includeGeometry,
              autoSave,
              selectedSections,
              archived,
              currentIcon,
              currentColor,
              borderInsetOverride,
              showFoldedCornerOverride,
              activityBarSettings
            );
          }
        });
      });
    });
    nameSetting.settingEl.addClass("window-spaces-setting-full-width");

    // Icon / Emoji 輸入框與預覽
    let currentIcon = this.layout.icon || "";
    let currentColor = this.layout.color || "";

    let iconInputEl!: HTMLInputElement;
    const iconSetting = this.createSettingIn(identityGroup, (setting) => {
      setting.setName(t("saveModal.iconLabel"));
      setting.addText((text) => {
        iconInputEl = text.inputEl;
        text.setPlaceholder(t("saveModal.iconPlaceholder"));
        text.setValue(currentIcon);
        text.onChange((val) => {
          currentIcon = val.trim();
          updateIconPreview();
        });
      });
    });

    iconSetting.controlEl.addClass("window-space-icon-setting-control");

    const pickIconBtn = iconSetting.controlEl.createEl("button", {
      cls: "clickable-icon",
      attr: { type: "button", title: t("settings.pickIcon") },
    });
    setIcon(pickIconBtn, "image");
    pickIconBtn.onclick = () => {
      new IconPickerModal(this.app, (selected) => {
        currentIcon = selected;
        iconInputEl.value = selected;
        updateIconPreview();
      }).open();
    };

    const iconPreviewEl = iconSetting.controlEl.createDiv({ cls: "window-space-icon-preview" });
    const updateIconPreview = () => {
      iconPreviewEl.empty();
      const val = currentIcon || this.plugin.settings.defaultIcon || DEFAULT_SPACE_ICON;
      const isEmoji = isSpaceEmoji(val);
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
    const colorSetting = this.createSettingIn(identityGroup, (setting) => {
      setting.setName(t("saveModal.colorLabel"));
    });

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

    new Setting(contentEl).setName(t("saveModal.windowAppearanceSection")).setHeading();
    const windowGroup = this.createGroup(contentEl) ?? contentEl;

    // 視窗外觀與位置
    let includeGeometry = this.layout.includeGeometry ?? (
      this.layout.windowState.position !== undefined ||
      (this.layout.windowState.size && this.layout.windowState.size.width > 0)
    );
    let geometryToggleComponent: ToggleComponent | null = null;

    this.createSettingIn(windowGroup, (setting) => {
      setting.setName(t("saveModal.includeGeometry")).setDesc(t("saveModal.includeGeometryDesc"));
      setting.addToggle((toggle) => {
        geometryToggleComponent = toggle;
        toggle.setValue(includeGeometry);
        toggle.onChange((value) => {
          includeGeometry = value;
        });
      });
    });

    this.createSettingIn(windowGroup, (setting) => {
      setting.setName(t("saveModal.borderInset")).setDesc(t("saveModal.borderInsetDesc"));
      setting.addSlider((slider) => {
        slider
          .setLimits(0, 20, 1)
          .setValue(borderInset)
          .setDynamicTooltip()
          .onChange((value) => {
            borderInset = value;
            borderInsetOverride = value;
          });
      });
    });

    this.createSettingIn(windowGroup, (setting) => {
      setting.setName(t("saveModal.foldedCorner")).setDesc(t("saveModal.foldedCornerDesc"));
      setting.addToggle((toggle) => {
        toggle.setValue(showFoldedCorner);
        toggle.onChange((value) => {
          showFoldedCorner = value;
          showFoldedCornerOverride = value;
        });
      });
    });

    new Setting(contentEl).setName(t("saveModal.behaviorSection")).setHeading();
    const behaviorGroup = this.createGroup(contentEl) ?? contentEl;
    let archived = this.layout.archived ?? false;

    this.createSettingIn(behaviorGroup, (setting) => {
      setting.setName(t("saveModal.autoSaveToggle"));
      setting.addToggle((toggle) => {
        autoSaveToggleComponent = toggle;
        toggle.setValue(autoSave);
        toggle.onChange((value) => {
          autoSave = value;
        });
      });
    });

    this.createSettingIn(behaviorGroup, (setting) => {
      setting.setName(t("manageModal.archiveSpace") || "Archive Space");
      setting.addToggle((toggle) => {
        toggle.setValue(archived);
        toggle.onChange((value) => {
          archived = value;
        });
      });
    });

    this.renderActivityBarSettings(contentEl, "left", activityBarSettings.left);
    this.renderActivityBarSettings(contentEl, "right", activityBarSettings.right);

    // Section 分組標籤選單與 Tag-Pills 輸入框
    new Setting(contentEl).setName(t("saveModal.sectionsSection")).setHeading();
    const sectionsGroup = this.createGroup(contentEl) ?? contentEl;
    selectedSections = Array.from(this.layout.sections || []);
    
    // 獲取目前全域已存在的所有 Sections
    const allSpaces: WindowLayout[] = this.plugin.manager.getSavedLayouts();
    const existingSectionsSet = new Set<string>();
    (this.plugin.settings?.sectionsOrder || []).forEach((s: string) => existingSectionsSet.add(s));
    allSpaces.forEach((s) => (s.sections || []).forEach((sec) => existingSectionsSet.add(sec)));
    const existingSections = Array.from(existingSectionsSet);

    // 1. 上方 Setting 列：左側 Sections 標籤，右側 新標籤輸入欄 (對齊 Space Name 樣式與大小)
    const sectionsSetting = this.createSettingIn(sectionsGroup, (setting) => {
      setting.setName(t("manageModal.sectionsLabel") || "Sections");
      setting.addText((text) => {
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
    });
    sectionsSetting.settingEl.addClass("window-spaces-setting-full-width");

    // 2. 底下：Section 列表選擇器 (Pills Container)
    const sectionsGroupEl = this.getGroupElement(sectionsGroup, contentEl);
    const pillsContainer = sectionsGroupEl.createDiv("space-sections-pills");

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
      void this.submitForm(
        nameInput,
        includeGeometry,
        autoSave,
        selectedSections,
        archived,
        currentIcon,
        currentColor,
        borderInsetOverride,
        showFoldedCornerOverride,
        activityBarSettings
      );
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
    color?: string,
    borderInset?: number,
    showFoldedCorner?: boolean,
    activityBars?: { left: WindowSpaceActivityBarSettings; right: WindowSpaceActivityBarSettings }
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
    this.layout.borderInset = borderInset;
    this.layout.showFoldedCorner = showFoldedCorner;
    this.layout.activityBars = activityBars;
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

  private getDefaultBorderInset(): number {
    const value = this.plugin.settings.defaultBorderInset;
    return typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, Math.min(20, value))
      : 1;
  }

  private getEffectiveBorderInset(): number {
    const value = this.layout.borderInset ?? this.getDefaultBorderInset();
    return Math.max(0, Math.min(20, Number.isFinite(value) ? value : 1));
  }

  private getEffectiveFoldedCorner(): boolean {
    return this.layout.showFoldedCorner ?? this.plugin.settings.defaultShowFoldedCorner !== false;
  }

  private createActivityBarDraft(
    side: "left" | "right",
    isExistingSpace: boolean
  ): WindowSpaceActivityBarSettings {
    const globalItems = this.plugin.settings.activityBars?.[side] ?? [];
    const saved = this.layout.activityBars?.[side];
    const savedItems = saved?.items
      ? saved.items
      : saved?.viewTypes
        ? globalItems.filter((item) => saved.viewTypes?.includes(item.viewType))
        : globalItems;
    return {
      // Legacy spaces without a per-space setting are intentionally unchecked.
      show: saved?.show ?? (isExistingSpace ? false : this.plugin.settings.activityBarDefaults?.[side] !== false),
      items: savedItems.map((item) => ({ ...item })),
    };
  }

  private renderActivityBarSettings(
    contentEl: HTMLElement,
    side: "left" | "right",
    draft: WindowSpaceActivityBarSettings
  ): void {
    new Setting(contentEl).setName(
      side === "left" ? t("settings.leftBar") : t("settings.rightBar")
    ).setHeading();
    const activityGroup = this.createGroup(contentEl) ?? contentEl;
    const groupEl = this.getGroupElement(activityGroup, contentEl);
    this.createSettingIn(activityGroup, (setting) => {
      setting.setName(t("settings.defaultActivityBarVisibility"));
      setting.setDesc(t("settings.defaultActivityBarVisibilityDesc"));
      setting.addToggle((toggle) => {
        toggle.setValue(draft.show);
        toggle.onChange((value) => {
          draft.show = value;
        });
      });
    });

    let selectEl!: HTMLSelectElement;
    let customInput!: HTMLInputElement;
    const addRow = this.createSettingIn(activityGroup, (setting) => {
      selectEl = setting.controlEl.createEl("select", { cls: "dropdown" });
      customInput = setting.controlEl.createEl("input", {
        type: "text",
        placeholder: t("settings.viewTypePlaceholder"),
      });
      customInput.addClass("window-spaces-view-type-input");
    });
    addRow.addButton((button) => {
      button.setButtonText(t("settings.addView")).onClick(() => {
        const viewType = customInput.value.trim() || selectEl.value.trim();
        if (!viewType || draft.items?.some((item) => item.viewType === viewType)) return;
        draft.items = draft.items ?? [];
        const newItem: ActivityBarItem = { viewType, side, icon: resolveViewIcon(this.app, viewType) };
        draft.items.push(newItem);
        customInput.value = "";
        renderItems();
        if (newItem.icon === "layout") {
          void ensureViewIcon(this.app, viewType).then((icon) => {
            if (!icon || icon === newItem.icon) return;
            newItem.icon = icon;
            renderItems();
          });
        }
      });
    });

    const renderItems = () => {
      const existingRows = new Map<string, HTMLElement>();
      groupEl.querySelectorAll<HTMLElement>("[data-window-spaces-save-activity-item]").forEach((el) => {
        const viewType = el.getAttribute("data-view-type");
        if (viewType) existingRows.set(viewType, el);
      });

      const items = draft.items ?? [];
      const activeTypes = new Set(items.map((item) => item.viewType));
      existingRows.forEach((row, viewType) => {
        if (!activeTypes.has(viewType)) row.remove();
      });

      items.forEach((item, index) => {
        const existing = existingRows.get(item.viewType);
        if (existing) {
          existing.setAttr("data-drag-index", String(index));
          addRow.settingEl.before(existing);
          return;
        }

        let iconButton: { setIcon: (icon: string) => unknown } | null = null;
        const row = this.createSettingIn(activityGroup, (setting) => {
          setting.setName(item.label || resolveViewLabel(this.app, item.viewType));
          setting.setDesc(item.viewType);
        });
        row.settingEl.setAttr("data-window-spaces-save-activity-item", "true");
        row.settingEl.setAttr("data-view-type", item.viewType);
        row.settingEl.setAttr("data-drag-index", String(index));
        row.settingEl.setAttr("draggable", "true");

        row.addButton((button) => {
          iconButton = button;
          button.setIcon(item.icon || resolveViewIcon(this.app, item.viewType)).setTooltip(t("settings.pickIcon"));
          button.onClick(() => {
            new IconPickerModal(this.app, (icon) => {
              item.icon = icon;
              iconButton?.setIcon(icon);
            }).open();
          });
        });
        row.addButton((button) => {
          button.setIcon("rotate-ccw").setTooltip(t("settings.restoreDefaultIcon"));
          button.onClick(() => {
            item.icon = undefined;
            iconButton?.setIcon(resolveViewIcon(this.app, item.viewType));
          });
        });
        row.addButton((button) => {
          button.setButtonText(t("settings.removeView")).setWarning().onClick(() => {
            const items = draft.items ?? [];
            if (!canRemoveActivityBarItem(items, enumerateAvailableViews(this.app)[side])) {
              new Notice(t("settings.keepOneActivityBarView"));
              return;
            }
            draft.items = items.filter((entry) => entry !== item);
            renderItems();
          });
        });

        row.settingEl.addEventListener("dragstart", (event: DragEvent) => {
          if (!event.dataTransfer) return;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(ACTIVITY_BAR_DRAG_DATA_TYPE, item.viewType);
        });
        row.settingEl.addEventListener("dragover", (event) => event.preventDefault());
        row.settingEl.addEventListener("drop", (event: DragEvent) => {
          event.preventDefault();
          const source = event.dataTransfer?.getData(ACTIVITY_BAR_DRAG_DATA_TYPE) ?? "";
          const target = item.viewType;
          const reordered = reorderActivityBarItems(
            draft.items ?? [],
            source,
            target,
            event.clientY > row.settingEl.getBoundingClientRect().top + row.settingEl.offsetHeight / 2
          );
          if (reordered) {
            draft.items = reordered;
            renderItems();
          }
        });
        addRow.settingEl.before(row.settingEl);
      });

      selectEl.empty();
      const available = enumerateAvailableViews(this.app);
      const availableTypes = sortViewTypesByLabel(this.app, Array.from(
        new Set([...available.left, ...available.right].map((item) => item.viewType))
      ));
      availableTypes.forEach((viewType) => {
        if (activeTypes.has(viewType)) return;
        selectEl.createEl("option", { value: viewType, text: resolveViewLabel(this.app, viewType) });
      });
    };

    renderItems();
    addRow.settingEl.parentElement?.appendChild(addRow.settingEl);
  }
}

