# Obsidian Community Store Review Fixes Report

本文件紀錄方針 Obsidian 官方審核（Community Plugin Review）清單中待修正項目的修復細節。

---

## 修正項目與處理方式對照表

| 分類 | 檢核項目 (Rule ID) | 觸發位置 | 修正方案與處理說明 |
| :--- | :--- | :--- | :--- |
| **Error** | `obsidianmd/no-unsupported-api` | `src/main.ts`<br>`src/manager.ts` (`revealLeaf`) | 更新 `manifest.json` 中之 `minAppVersion` 至 `"1.7.2"`。Obsidian `revealLeaf` API 係於 v1.7.2 引入，聲明對應 minAppVersion 後錯誤完全清除。 |
| **Error** | `obsidianmd/no-static-styles-assignment` | `src/main.ts:740` (`style.flex = ...`) | 移除直接賦值 `.style.flex` 語法，改以自建之 Obsidian API helper `setElementCssStyles(el, styles)` 透過 `setCssStyles` / `setCssProps` 或 `style.setProperty` 設定，相容官方規範。 |
| **Warning** | `obsidianmd/prefer-create-el` | `src/manager.ts`<br>`src/modals/restoreModal.ts`<br>`src/modals/saveModal.ts` | 將原生/非標準 `createEl("div", ...)` 與 `createEl("span", ...)` 替換為 Obsidian 原生 Element Helper (`createDiv(...)`, `createSpan(...)`) 及標準 `classList.add(...)`。 |
| **Warning** | `Union type constituent is duplicated with number` | `src/manager.ts:334`<br>`src/modals/restoreModal.ts:23, 906`<br>`src/settings.ts:7` | 定義定時器型別時簡化 `number | ReturnType<typeof window.setTimeout>` 為 `number` / `number | null`，消除重複之 number 聯類型別。 |
| **Warning** | `This assertion is unnecessary` | `src/main.ts:364`<br>`src/manager.ts:198, 200, 358, 432, 1417`<br>`src/modals/restoreModal.ts:344, 914, 1334`<br>`src/settings.ts:125, 144` | 清除冗餘之 `as number` 與 `!` 非空斷言。 |
| **Warning** | `@typescript-eslint/no-unsafe-*` & `Unexpected any` | `src/main.ts`<br>`src/manager.ts`<br>`src/types.ts` | 擴充 `types.ts` 中的介面（如 `ExtendedWorkspace`, `ExtendedWorkspaceLeaf`, `WorkspaceParent`, `WorkspaceItem`），消除全域與區域程式碼中顯式 `any` 型別及不安全成型呼叫。 |
| **Recommendation** | `activeLeaf is deprecated` | `src/main.ts:528`<br>`src/manager.ts:528` | 使用 recommended API `app.workspace.getMostRecentLeaf()` 取代已棄用之 `activeLeaf` 屬性，並加上對舊版/Mock 環境之安全相容備援。 |
| **CSS Warning** | `Avoid :has` | `styles.css:440, 888, 893` | 移除 CSS 中之 `:has()` 選擇器。於 JS 端 View (`windowLayoutsView.ts`) 與 Modal (`restoreModal.ts`) 開啟時動態加入標記 class (`mod-window-spaces-leaf`, `has-header-actions`)，改以純階層選擇器控制樣式，消除效能預警。 |

---

## 驗證結果

1. **語法與 Lint 檢測 (`npm run lint`)**：
   - 執行結果：`0 errors, 0 warnings`（全數通過）。
2. **單元與整合測試套件 (`npm run test`)**：
   - 執行結果：`6 passed (6 test files), 52 passed (52 tests)`。
3. **生產環境構建 (`npm run build`)**：
   - 執行結果：TypeScript 構建無任何 warning，成功產出 `main.js`。
4. **測試庫部署 (Local Test Vault Deployment)**：
   - 已同步最新構建產物 (`main.js`, `main.js.map`, `manifest.json`, `styles.css`) 至：
     - `E:\vaults\test-vault\.obsidian\plugins\window-spaces`
     - `E:\vaults\Note\.obsidian\plugins\window-spaces`
