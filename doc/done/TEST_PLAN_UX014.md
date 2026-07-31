# UX-014 可測試性與測試覆蓋規劃書 (Test Plan)

本文件詳細規劃 **Obsidian Window Spaces** 外掛程式的單元測試與整合測試涵蓋範圍，旨在降低 Obsidian 官方 Popout API 變更或後續功能疊加時產生的迴歸（Regression）風險。

---

## 🛠️ 測試環境與技術選型

- **測試框架**：`vitest` (兼具極速 ES Module 編譯與 TypeScript 原生支援)
- **環境模擬**：`jsdom` (模擬 Browser Window, DOM, LocalStorage)
- **測試命令**：
  ```bash
  npm run test        # 執行單元測試
  npm run test:watch  # 觀察模式執行測試
  npm run test:coverage # 產生測試涵蓋率報告
  ```

---

## 📋 五大核心模組測試涵蓋規劃

### 1. 🧠 智慧佈局命名機制 (`tests/smartName.test.ts`)
驗證 `generateSmartLayoutName(layout)` 依據視窗狀態自動生成標題的正確性：
- [x] **Pinned 優先權**：釘選 (Pinned) 的筆記檔名必須優先放置在名稱最前面。
- [x] **Active 檔名次優先**：若無 Pinned 檔案，焦點啟用 (Active) 的筆記檔名置頂。
- [x] **無副檔名乾淨化**：自動去除 `.md` 檔案字尾。
- [x] **多檔案與截斷格式**：
  - 1 個檔案：`[檔名]`
  - 2 個檔案：`[檔名 1] & [檔名 2]`
  - 3 個以上檔案：`[檔名 1] & [檔名 2] (+N)`

### 2. 🕒 多維度動態排序機制 (`tests/sorting.test.ts`)
驗證 `getSavedLayouts()` 在 6 大維度下的排序結果：
- [x] **`updated-desc` (預設)**：最後修改更新時間最新的排在最上方。
- [x] **`updated-asc`**：最後修改更新時間較舊的排在最上方。
- [x] **`created-desc`**：建立時間最新的排在最上方。
- [x] **`created-asc`**：建立時間較舊的排在最上方。
- [x] **`name-asc`**：名稱依字母/自然數 A-Z 順序。
- [x] **`name-desc`**：名稱依字母 Z-A 順序。
- [x] **複製另存新時間戳**：從 A Layout 複製/改名另存為全新 B Layout 時，B 的 `createdAt` 與 `updatedAt` 均重置為當時時間。

### 3. 🛡️ 佈局驗證與防呆機制 (`tests/validationAndGuardrails.test.ts`)
驗證系統資料結構的健全防呆保護：
- [x] **`validateLayout`**：過濾缺失 `name`, `workspace`, `id` 或非法的 Layout 結構。
- [x] **0 檔案清空覆寫攔截**：當視窗關閉導致現場 DOM/Leaf 銷毀 (0 個檔案) 時，自動攔截覆寫，並退回使用 `lastValidSnapshots` 備份。
- [x] **Per-Layout Auto-Save**：獨立 `autoSave: true/false` 屬性正確寫入與持久化。

### 4. 🌐 國際化多語系動態求值 (`tests/i18n.test.ts`)
驗證 `I18nManager` 即時動態求值與語系切換：
- [x] **多源動態求值**：正確讀取 `window.localStorage.getItem("language")` 的即時設定。
- [x] **語系映射**：
  - `zh-TW`, `zh-HK`, `zh-MO`, `zh-Hant` 均正確映射至 `zh-TW` (繁體中文)。
  - `zh`, `zh-CN` 正確映射至 `zh-CN` (簡體中文)。
  - `en`, `en-US` 映射至 `en` (英文)。
- [x] **Fallback 退回機制**：若缺失語系或 key 找不到，自動降級退回英文或回傳原生 key。
- [x] **參數化替換 `tWithParams`**：正確替換 `{{param}}` 佔位符。

### 5. 🛠️ Layout Tree 提取與解析 (`tests/layoutTree.test.ts`)
驗證從 Obsidian 複雜 Workspace Layout Tree 提取 Leaf 狀態的正確性：
- [x] 從嵌套的 `split` / `tabs` / `leaf` 節點中正確遞迴提取所有開立的分頁。
- [x] 相容 Obsidian 舊版本曾出現的 `leaves` 陣列模式。

---

## 🎯 測試驗收目標 (Acceptance Criteria)

- ✅ 通過率：**100% Pass**
- ✅ 核心模組 (Manager, i18n, Modals Logic) 邏輯覆蓋率 **> 85%**
