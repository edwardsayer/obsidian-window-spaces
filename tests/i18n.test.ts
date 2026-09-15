import { describe, test, expect, beforeEach } from "vitest";
import { I18nManager, initI18n } from "../src/i18n";

describe("Internationalization & Dynamic Locale Detection (i18n.test.ts)", () => {
  let i18n: I18nManager;
  let mockApp: { vault: { config: { locale?: string } } };

  beforeEach(() => {
    mockApp = { vault: { config: {} } };
    i18n = initI18n(mockApp as never);
  });

  test("should detect zh-TW dynamically from the Obsidian vault locale", () => {
    mockApp.vault.config.locale = "zh-TW";
    expect(i18n.detectLocale()).toBe("zh-TW");
    expect(i18n.t("common.save")).toBe("儲存");

    mockApp.vault.config.locale = "zh-HK";
    expect(i18n.detectLocale()).toBe("zh-TW");

    mockApp.vault.config.locale = "zh-Hant";
    expect(i18n.detectLocale()).toBe("zh-TW");
  });

  test("should detect zh-CN dynamically from the Obsidian vault locale", () => {
    mockApp.vault.config.locale = "zh-CN";
    expect(i18n.detectLocale()).toBe("zh-CN");
    expect(i18n.t("common.save")).toBe("保存");
  });

  test("should fallback to en for unsupported or English locales", () => {
    mockApp.vault.config.locale = "en-US";
    expect(i18n.detectLocale()).toBe("en");
    expect(i18n.t("common.save")).toBe("Save");

    mockApp.vault.config.locale = "fr";
    expect(i18n.detectLocale()).toBe("en");
  });

  test("should replace parameters correctly in tWithParams", () => {
    mockApp.vault.config.locale = "en";
    const result = i18n.tWithParams("saveModal.overwriteNotice", { name: "MyLayout" });
    expect(result).toBe("Will overwrite existing space");
  });
});
