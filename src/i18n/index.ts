import { App } from "obsidian";
import { TranslationStrings } from "./types";
import { en } from "./en";
import { zhTW } from "./zh-TW";
import { zhCN } from "./zh-CN";

/**
 * 支持的語言類型
 */
export type SupportedLocale = "en" | "zh-TW" | "zh-CN";

/**
 * 國際化管理器
 */
export class I18nManager {
  private app: App;
  private currentLocale: SupportedLocale = "en";
  private translations: Record<SupportedLocale, TranslationStrings> = {
    en: en,
    "zh-TW": zhTW,
    "zh-CN": zhCN,
  };

  constructor(app: App) {
    this.app = app;
    this.currentLocale = this.detectLocale();
  }

  /**
   * 檢測當前語言環境 (多重源實時動態求值)
   */
  public detectLocale(): SupportedLocale {
    try {
      // 1. 優先讀取 window.localStorage.getItem("language") (Obsidian 官方語言切換儲存位置)
      const langStorage = typeof window !== "undefined" ? window.localStorage.getItem("language") : null;

      // 2. 讀取 Obsidian 內建 moment.locale()
      const momentLocale = typeof window !== "undefined" && (window as any).moment?.locale ? (window as any).moment.locale() : null;

      // 3. 讀取 app.vault.config
      const vaultConfig = (this.app?.vault as any)?.config;
      const vaultLocale = vaultConfig?.locale || vaultConfig?.userLanguage;

      const rawLocale = String(langStorage || momentLocale || vaultLocale || "en").toLowerCase();

      if (rawLocale.startsWith("zh")) {
        if (
          rawLocale.includes("tw") ||
          rawLocale.includes("hk") ||
          rawLocale.includes("mo") ||
          rawLocale.includes("hant") ||
          rawLocale === "zh-cht"
        ) {
          return "zh-TW";
        }
        return "zh-CN";
      }
    } catch (e) {
      console.warn("[Window Spaces] Failed to detect locale, fallback to en:", e);
    }

    return "en";
  }

  /**
   * 獲取當前語言環境
   */
  getCurrentLocale(): SupportedLocale {
    return this.detectLocale();
  }

  /**
   * 設置語言環境
   */
  setLocale(locale: SupportedLocale): void {
    this.currentLocale = locale;
  }

  /**
   * 獲取翻譯字符串 (實時動態取得當前最新語系)
   */
  t(key: string): string {
    const activeLocale = this.detectLocale();
    const keys = key.split(".");
    let value: any = this.translations[activeLocale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻譯，回退到英文
        value = this.translations["en"];
        for (const fallbackKey of keys) {
          if (value && typeof value === "object" && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // 如果連英文都沒有，返回 key
          }
        }
        break;
      }
    }

    return typeof value === "string" ? value : key;
  }

  /**
   * 獲取帶參數的翻譯字符串
   */
  tWithParams(key: string, params: Record<string, string | number>): string {
    let translation = this.t(key);

    // 替換參數 {{param}}
    for (const [param, value] of Object.entries(params)) {
      translation = translation.replace(
        new RegExp(`{{${param}}}`, "g"),
        String(value)
      );
    }

    return translation;
  }

  /**
   * 獲取所有支持的語言
   */
  getSupportedLocales(): SupportedLocale[] {
    return Object.keys(this.translations) as SupportedLocale[];
  }

  /**
   * 獲取語言的顯示名稱
   */
  getLocaleDisplayName(locale: SupportedLocale): string {
    const displayNames: Record<SupportedLocale, string> = {
      en: "English",
      "zh-TW": "繁體中文",
      "zh-CN": "简体中文",
    };

    return displayNames[locale] || locale;
  }

  /**
   * 檢查是否為從右到左的語言
   */
  isRTL(): boolean {
    // 目前支持的語言都不是 RTL
    return false;
  }

  /**
   * 格式化日期
   */
  formatDate(date: Date): string {
    const localeMap: Record<SupportedLocale, string> = {
      en: "en-US",
      "zh-TW": "zh-TW",
      "zh-CN": "zh-CN",
    };

    try {
      return date.toLocaleDateString(localeMap[this.detectLocale()], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      // 如果格式化失敗，回退到 ISO 格式
      return date.toISOString();
    }
  }

  /**
   * 格式化數字
   */
  formatNumber(num: number): string {
    const localeMap: Record<SupportedLocale, string> = {
      en: "en-US",
      "zh-TW": "zh-TW",
      "zh-CN": "zh-CN",
    };

    try {
      return num.toLocaleString(localeMap[this.detectLocale()]);
    } catch (error) {
      return String(num);
    }
  }
}

/**
 * 全域 i18n 實例
 */
let i18nInstance: I18nManager | null = null;

/**
 * 初始化國際化系統
 */
export function initI18n(app: App): I18nManager {
  i18nInstance = new I18nManager(app);
  return i18nInstance;
}

/**
 * 獲取 i18n 實例
 */
export function getI18n(): I18nManager {
  if (!i18nInstance) {
    throw new Error("I18n not initialized. Call initI18n() first.");
  }
  return i18nInstance;
}

/**
 * 便捷的翻譯函數
 */
export function t(key: string): string {
  return getI18n().t(key);
}

/**
 * 便捷的帶參數翻譯函數
 */
export function tWithParams(
  key: string,
  params: Record<string, string | number>
): string {
  return getI18n().tWithParams(key, params);
}

// 導出類型和翻譯文件
export * from "./types";
export * from "./en";
export * from "./zh-TW";
export * from "./zh-CN";
