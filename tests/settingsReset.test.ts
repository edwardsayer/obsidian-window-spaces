import { describe, expect, test, vi } from "vitest";
import WindowSpacesPlugin from "../src/main";
import { DEFAULT_COLOR_PRESETS, WindowLayout, WindowSettings } from "../src/types";
import { DEFAULT_SPACE_ICON } from "../src/spaceVisuals";
import { getDefaultActivityBarItems } from "../src/popout/viewRegistry";

function makeSettings(spaces: WindowLayout[]): WindowSettings {
  const settings = {
    spaces,
    autoSave: true,
    showNotifications: true,
    version: "legacy",
    showLayoutStatusBar: false,
    layoutStatusBarDefaultApplied: true,
    showWindowLayoutsRibbonIcon: false,
    sortBy: "name-asc",
    sectionsOrder: ["custom"],
    groupBySection: false,
    showArchived: true,
    defaultIcon: "star",
    colorPresets: ["#000000"],
    defaultBorderInset: 4,
    visualDefaultsVersion: 99,
    defaultShowFoldedCorner: false,
    activityBars: {
      left: [{ viewType: "custom-left", side: "left", label: "Custom" }],
      right: [{ viewType: "custom-right", side: "right", label: "Custom" }],
    },
    activityBarDefaults: { left: false, right: false },
    popoutAccents: { enabled: false, splitter: false, activityBar: false },
    workspaceInterceptorEnabled: false,
  } as WindowSettings & { legacyOption: string };
  settings.legacyOption = "remove-me";
  return settings;
}

function makePlugin(settings: WindowSettings, saveSettings: () => Promise<void>): WindowSpacesPlugin {
  return Object.assign(Object.create(WindowSpacesPlugin.prototype), {
    settings,
    saveSettings,
  }) as WindowSpacesPlugin;
}

describe("Window Spaces settings reset", () => {
  test("restores factory options while keeping the saved Spaces intact", async () => {
    const spaces = [{ id: "keep-me" }] as WindowLayout[];
    const settings = makeSettings(spaces);
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const plugin = makePlugin(settings, saveSettings);

    await plugin.resetSettingsPreservingSpaces();

    expect(plugin.settings.spaces).toBe(spaces);
    expect(plugin.settings.autoSave).toBe(false);
    expect(plugin.settings.showNotifications).toBe(false);
    expect(plugin.settings.showLayoutStatusBar).toBe(true);
    expect(plugin.settings.showWindowLayoutsRibbonIcon).toBe(true);
    expect(plugin.settings.sortBy).toBe("updated-desc");
    expect(plugin.settings.sectionsOrder).toEqual([]);
    expect(plugin.settings.groupBySection).toBe(true);
    expect(plugin.settings.showArchived).toBe(false);
    expect(plugin.settings.defaultIcon).toBe(DEFAULT_SPACE_ICON);
    expect(plugin.settings.colorPresets).toEqual(DEFAULT_COLOR_PRESETS);
    expect(plugin.settings.colorPresets).not.toBe(DEFAULT_COLOR_PRESETS);
    expect(plugin.settings.defaultBorderInset).toBe(1);
    expect(plugin.settings.defaultShowFoldedCorner).toBe(true);
    expect(plugin.settings.activityBars?.left).toEqual(getDefaultActivityBarItems("left"));
    expect(plugin.settings.activityBars?.right).toEqual(getDefaultActivityBarItems("right"));
    expect(plugin.settings.activityBarDefaults).toEqual({ left: true, right: true });
    expect(plugin.settings.popoutAccents).toEqual({ enabled: true, splitter: true, activityBar: true });
    expect(plugin.settings.workspaceInterceptorEnabled).toBe(true);
    expect((plugin.settings as WindowSettings & { legacyOption?: unknown }).legacyOption).toBeUndefined();
    expect(saveSettings).toHaveBeenCalledTimes(1);
  });

  test("rolls back the in-memory settings when saving the reset fails", async () => {
    const spaces = [{ id: "keep-me" }] as WindowLayout[];
    const settings = makeSettings(spaces);
    const saveError = new Error("disk full");
    const saveSettings = vi.fn().mockRejectedValue(saveError);
    const plugin = makePlugin(settings, saveSettings);

    await expect(plugin.resetSettingsPreservingSpaces()).rejects.toBe(saveError);

    expect(plugin.settings).toBe(settings);
    expect(plugin.settings.spaces).toBe(spaces);
    expect(plugin.settings.autoSave).toBe(true);
  });
});
