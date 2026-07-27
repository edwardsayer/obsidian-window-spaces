import { describe, test, expect, beforeEach } from "vitest";
import { I18nManager, initI18n } from "../src/i18n";

describe("Internationalization & Dynamic Locale Detection (i18n.test.ts)", () => {
  let i18n: I18nManager;

  beforeEach(() => {
    const mockApp: any = { vault: { config: {} } };
    i18n = initI18n(mockApp);
    window.localStorage.clear();
  });

  test("should detect zh-TW dynamically from localStorage 'zh-TW', 'zh-HK', 'zh-Hant'", () => {
    window.localStorage.setItem("language", "zh-TW");
    expect(i18n.detectLocale()).toBe("zh-TW");
    expect(i18n.t("common.save")).toBe("儲存");

    window.localStorage.setItem("language", "zh-HK");
    expect(i18n.detectLocale()).toBe("zh-TW");

    window.localStorage.setItem("language", "zh-Hant");
    expect(i18n.detectLocale()).toBe("zh-TW");
  });

  test("should detect zh-CN dynamically from localStorage 'zh-CN'", () => {
    window.localStorage.setItem("language", "zh-CN");
    expect(i18n.detectLocale()).toBe("zh-CN");
    expect(i18n.t("common.save")).toBe("保存");
  });

  test("should fallback to en for unsupported or English locales", () => {
    window.localStorage.setItem("language", "en-US");
    expect(i18n.detectLocale()).toBe("en");
    expect(i18n.t("common.save")).toBe("Save");

    window.localStorage.setItem("language", "fr");
    expect(i18n.detectLocale()).toBe("en");
  });

  test("should replace parameters correctly in tWithParams", () => {
    window.localStorage.setItem("language", "en");
    const result = i18n.tWithParams("saveModal.overwriteNotice", { name: "MyLayout" });
    expect(result).toBe("Will overwrite existing layout");
  });
});
