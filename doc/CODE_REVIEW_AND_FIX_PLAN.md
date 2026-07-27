# Window Spaces Codebase 全面審查與修正計劃報告

## 📌 審查概述

本報告針對 `obsidian-window-spaces` 插件現有程式碼進行全方位的 Code Review，識別潛在的嚴重錯誤、型別隱患、UI/UX 瑕疵與 CSS DOM 洩漏問題，並提出具體的修復方案。

---

## 🚨 識別到的主要問題與潛在風險

### 1. 嚴重邏輯錯誤 (Critical / High Severity)

#### 🔴 [CRITICAL] 建立新 popout 視窗時會清空主視窗佈局
* **位置**：`src/manager.ts` (L123 - L131)
* **現象**：當要恢復的佈局找不到現有目標視窗時，程式會呼叫 `openPopoutLeaf()` 並套用 `floatingState`：
  ```typescript
  const floatingState = {
    main: null,
    left: null,
    right: null,
    "left-ribbon": null,
    floating: [layout.workspace.layout]
  };
  await this.app.workspace.changeLayout(floatingState);
  ```
* **風險**：`changeLayout(floatingState)` 傳入 `main: null` 及 `left: null` 等，會將用戶 Obsidian 主視窗的全部標籤頁與側邊欄**全部清空**！這會引發嚴重的資料遺失錯覺與主視窗損壞。
* **解決方案**：應取得目前的完整工作區 `currentLayout`，並將新的 `layout.workspace.layout` 追加到 `currentLayout.floating` 陣列中，再執行 `changeLayout(currentLayout)`。

#### 🔴 [HIGH] ManageLayoutsModal 恢復按鈕標籤文字錯誤
* **位置**：`src/modals/restoreModal.ts` (L145)
* **現象**：在管理視窗對話框中，恢復按鈕的文字被誤寫為 `t("common.save")`（保存）：
  ```typescript
  const restoreBtn = actionsEl.createEl("button", {
    text: t("common.save"), // 誤顯示為「保存」
    cls: "mod-cta",
  });
  ```
* **風險**：按鈕顯示為「保存」，點擊後實際發動的卻是「恢復佈局」，造成極大的用戶誤解與不確定感。
* **解決方案**：修改為 `t("common.restore")`（恢復）。

---

### 2. UI / UX 瑕疵與設定誤導 (Medium Severity)

#### 🟠 [MEDIUM] 設定頁面通知切換項標籤誤用
* **位置**：`src/settings.ts` (L22 - L32)
* **現象**：控制 `showNotifications` 的第一個 Setting 項目，其名稱與描述誤用了 `settings.autoSaveEnabled` 及 `settings.autoSaveDescription`：
  ```typescript
  new Setting(containerEl)
    .setName(t("settings.autoSaveEnabled"))
    .setDesc(t("settings.autoSaveDescription"))
    .addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.showNotifications !== false); ...
    });
  ```
* **風險**：設定頁面上連續出現兩個「啟用自動保存」切換鈕，功能極易混淆。
* **解決方案**：將第一個設定名稱修正為 `t("settings.showNotifications")`。

#### 🟠 [MEDIUM] 動態 `<style>` 注入導致 DOM Leaks
* **位置**：`src/settings.ts` (L301), `src/modals/restoreModal.ts` (L52, L84), `src/modals/restoreModal.ts` (L214)
* **現象**：每次打開 Modal 或顯示 SettingTab 時都重新建立 `<style>` 並 `document.head.appendChild()`；Modal 關閉時僅粗暴地 `removeChild(lastChild)`。
* **風險**：頻繁開啟/關閉會累積重複 DOM 節點，且 `lastChild` 容易誤刪其他外掛或 Obsidian 主程式的 DOM 樣式。
* **解決方案**：將所有 UI 樣式統一移至 `styles.css` 中維護，移除動態 `<style>` 注入。

---

### 3. 型別警告與代碼健壯性 (Type Safety & Code Quality)

#### 🟡 [LOW-MEDIUM] TypeScript 編譯警告
* **位置**：`src/i18n/index.ts` (L34), `src/manager.ts` (L94, L107)
* **現象**：
  1. `this.app.vault.config` 被 TS 警告屬性不存在。
  2. `currentLayout.floating` 被推導為 `unknown` 類型，未先驗證 `Array.isArray` 就進行 `for...of` 循環與 `indexOf`。
* **解決方案**：加入適當的轉型型別斷言與安全陣列判斷。

#### 🟡 [LOW] 硬編碼文字缺漏 i18n
* **位置**：`src/settings.ts`, `src/modals/saveModal.ts` 中的中文字串（如 `"個文件"`, `"危險操作"`, `"包含視窗位置"` 等）。
* **解決方案**：補充至 i18n 語系檔 (`en.ts`, `zh-TW.ts`, `zh-CN.ts`) 進行統一呼叫。

---

## 🛠️ 修正實施計劃 (Action Plan)

| 步驟 | 修正內容 | 目標檔案 | 優先級 |
|---|---|---|---|
| Step 1 | 修復 `restoreLayout` 追加 floating 視窗邏輯，防止主視窗被清空 | `src/manager.ts` | P0 (Critical) |
| Step 2 | 修正 `ManageLayoutsModal` 恢復按鈕標籤為 `t("common.restore")` | `src/modals/restoreModal.ts` | P1 (High) |
| Step 3 | 修正 Setting 頁面中通知開關的標籤與語意 | `src/settings.ts` | P1 (High) |
| Step 4 | 消除 TS 編譯警告 (Vault.config 存取與 `floating` 陣列安全檢查) | `src/i18n/index.ts`, `src/manager.ts` | P2 (Medium) |
| Step 5 | 整理全域 CSS 樣式至 `styles.css`，移除動態 `<style>` 注入 | `styles.css`, `src/settings.ts`, `src/modals/restoreModal.ts` | P2 (Medium) |
| Step 6 | 補充缺漏的 i18n 詞條，替換硬編碼字串 | `src/i18n/*`, `src/modals/*`, `src/settings.ts` | P3 (Low) |
| Step 7 | 重新執行 `npm run build` 並更新部署至 `E:\vaults\test-vault\` 驗證 | 全局 | P0 (Critical) |

---
*報告產生時間：2026-07-26*
