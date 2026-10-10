import { describe, expect, test, vi } from "vitest";
import WindowSpacesPlugin from "../src/main";


/**
 * F3：`loadSettings()` 的開窗管道策略遷移覆蓋。
 *
 * 對應 pre-release reviewer 的 Round 2 finding —— `tests/` 內原本對
 * `loadSettings` 零命中，而這段遷移正是「既有使用者升級後，原生 popout 從
 * 完整裝飾變成僅狀態列」的可見行為轉換，必須有測試鎖住。
 *
 * 關聯原始碼（`src/main.ts`）：
 *  - `createDefaultSettings()` 已內建 `nativePopoutPolicy: "status-bar-only"`
 *    與 `urlPopoutPolicy: "disabled"`（第 78–79 行）。
 *  - `loadSettings()` 以 `Object.assign(createDefaultSettings(), savedSettings)`
 *    合併，因此**真實 data.json 缺鍵時兩者仍會被預設值填滿** ——
 *    這是 defect-1 的根因：舊版遷移以 `this.settings` 判定缺鍵，在合併後必為
 *    truthy，故整段為死碼，舊版 `disableOnUrlPopouts: false` 的使用者會被靜默
 *    降級為 `"disabled"`。現在改以 `savedSettings` 判定（defect-1 修復）。
 *  - 鑑別力來源：`M2` / `M4` / `M5` 的期望值 ≠ 預設值，把遷移區塊註解掉即失敗；
 *    `M1` / `M3` 的期望值恰與預設值一致（缺鍵 = 預設值），屬**結果正確性**測試，
 *    無法也無需鑑別遷移是否執行。
 */

interface SavedData {
  nativePopoutPolicy?: unknown;
  urlPopoutPolicy?: unknown;
  disableOnUrlPopouts?: unknown;
}

interface MigrationHarness {
  plugin: WindowSpacesPlugin;
  /** 每次 saveSettings 呼叫當下寫出的策略值，用來證明沒有被覆寫成預設值。 */
  savedPolicySnapshots: Array<{ nativePopoutPolicy?: unknown; urlPopoutPolicy?: unknown }>;
}

/**
 * 只掛上 `loadData` / `saveSettings` 兩個持久化相依，其餘 prototype 方法
 * （含 `loadSettings` 本身）沿用真實實作 —— 不呼叫 `onload()`。
 */
function createMigrationHarness(saved: SavedData | null): MigrationHarness {
  const savedPolicySnapshots: MigrationHarness["savedPolicySnapshots"] = [];
  const plugin = Object.assign(Object.create(WindowSpacesPlugin.prototype), {
    loadData: async () => saved,
    saveSettings: async function (this: WindowSpacesPlugin) {
      savedPolicySnapshots.push({
        nativePopoutPolicy: this.settings?.nativePopoutPolicy,
        urlPopoutPolicy: this.settings?.urlPopoutPolicy,
      });
    },
  }) as WindowSpacesPlugin;
  return { plugin, savedPolicySnapshots };
}

describe("loadSettings 開窗管道策略遷移", () => {
  test("M1: 舊版資料完全缺兩個策略鍵 → 兩者皆由預設值補齊", async () => {
    const { plugin } = createMigrationHarness({});

    await plugin.loadSettings();

    // 預設即為 status-bar-only / disabled —— 升級後使用者看到的行為。
    expect(plugin.settings.nativePopoutPolicy).toBe("status-bar-only");
    expect(plugin.settings.urlPopoutPolicy).toBe("disabled");
    // 其他舊資料仍由預設值補齊，避免 undefined 滲漏到策略判定。
    expect(plugin.settings.disableOnUrlPopouts).toBe(true);
    expect(plugin.settings.showLayoutStatusBar).toBe(true);
  });

  test("M2: 缺策略鍵 + disableOnUrlPopouts:false → status-bar-only / full", async () => {
    // defect-1 修復驗收：舊資料只帶 disableOnUrlPopouts:false（不帶策略鍵）時，
    // URL 彈窗策略必須對映為 "full"（等於舊旗標「不要停用」的原意），
    // 而非被預設值帶成 "disabled"。把遷移區塊註解掉本測試即失敗。
    const { plugin } = createMigrationHarness({ disableOnUrlPopouts: false });

    await plugin.loadSettings();

    expect(plugin.settings.nativePopoutPolicy).toBe("status-bar-only");
    expect(plugin.settings.disableOnUrlPopouts).toBe(false);
    expect(plugin.settings.urlPopoutPolicy).toBe("full");
  });

  test("M3: 已含兩個策略鍵的資料不被覆寫（idempotent）", async () => {
    const { plugin, savedPolicySnapshots } = createMigrationHarness({
      nativePopoutPolicy: "full",
      urlPopoutPolicy: "status-bar-only",
    });

    await plugin.loadSettings();

    expect(plugin.settings.nativePopoutPolicy).toBe("full");
    expect(plugin.settings.urlPopoutPolicy).toBe("status-bar-only");
    // 其他遷移（visualDefaultsVersion、status bar 預設值）仍會呼叫 saveSettings，
    // 但任何一次寫出都不得把這兩個策略鍵變成預設值。
    expect(savedPolicySnapshots.length).toBeGreaterThan(0);
    for (const snapshot of savedPolicySnapshots) {
      expect(snapshot.nativePopoutPolicy).toBe("full");
      expect(snapshot.urlPopoutPolicy).toBe("status-bar-only");
    }
  });

  test("M4: 缺策略鍵 + disableOnUrlPopouts:false，且儲存值為 falsy（null）時遷移必執行", async () => {
    // 鑑別力：註解掉 src/main.ts 的遷移區塊後本測試必失敗（null 不會被填成預設值）。
    const { plugin } = createMigrationHarness({
      nativePopoutPolicy: null,
      urlPopoutPolicy: null,
      disableOnUrlPopouts: false,
    } as SavedData);

    await plugin.loadSettings();

    expect(plugin.settings.nativePopoutPolicy).toBe("status-bar-only");
    // disableOnUrlPopouts === false → 對映到 full（分支語義）。
    expect(plugin.settings.urlPopoutPolicy).toBe("full");
  });

  test("M5: 缺策略鍵 + disableOnUrlPopouts:true → status-bar-only / disabled", async () => {
    // defect-1 期望表第 3 列：舊版維持預設停用的使用者，升級後維持 disabled。
    // 純缺鍵形狀（第一組）的期望值恰等於預設值，屬結果正確性驗證；
    // 第二組以 null 作為 falsy 儲存值，使本測試具備鑑別力
    // （遷移區塊被註解時 urlPopoutPolicy 會殘留 null 而非 "disabled"）。
    const plain = createMigrationHarness({ disableOnUrlPopouts: true });
    await plain.plugin.loadSettings();
    expect(plain.plugin.settings.nativePopoutPolicy).toBe("status-bar-only");
    expect(plain.plugin.settings.urlPopoutPolicy).toBe("disabled");

    const falsy = createMigrationHarness({
      nativePopoutPolicy: null,
      urlPopoutPolicy: null,
      disableOnUrlPopouts: true,
    } as SavedData);
    await falsy.plugin.loadSettings();
    expect(falsy.plugin.settings.nativePopoutPolicy).toBe("status-bar-only");
    expect(falsy.plugin.settings.urlPopoutPolicy).toBe("disabled");
  });
});
