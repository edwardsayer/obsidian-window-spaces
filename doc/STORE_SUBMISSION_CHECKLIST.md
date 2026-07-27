# Obsidian Community Plugin Store 上架準備與工作清單

本文件記錄將 **Window Spaces** 外掛上架至 Obsidian 社群外掛商店 (Community Plugin Directory) 所需的完整準備工作與檢核清單。

---

## 📊 現狀評估與總覽

目前 **Window Spaces** 的核心功能、UI 體驗、自動化測試（17 個測試全數通過）與 Rollup 建置皆已達到高品質標準。在上架審核前，我們主要需要補齊**中頭資料（Metadata）**、**開源授權文件（License）**、**英文說明文檔（README）** 以及完成 **GitHub Release 流程**。

---

## 📋 上架工作清單 (Submission Checklist)

### 階段一：補齊專案基礎資料 (Project Metadata & Legal)

- [x] **1. 更新 `manifest.json` 與 `package.json`**
  - [x] 將 `manifest.json` 中的 `"author": "Your Name"` 替換為實際作者姓名 (`Window Spaces Contributors`)。
  - [x] 補齊 `manifest.json` 中的 `"authorUrl"` (`https://github.com/obsidian-window-spaces`)。
  - [x] 強化 `description` SEO 關鍵字涵蓋 (Popout window layout manager)。
  - [x] 將 `package.json` 中的 `"author"` 與 `"keywords"` 同步更新。

- [x] **2. 補齊 `LICENSE` 檔案**
  - [x] 在專案根目錄創建標準 MIT `LICENSE` 檔案 (Copyright (c) 2026)。

- [x] **3. `README.md` 雙語化 / 多國語言支援**
  - [x] 將 `README.md` 擴充至包含 9 國語系（English 英文主說明、繁體中文、簡體中文、日本語、Español、Français、العربية、Deutsch、Русский），並配置頂部快捷語言選擇選單。

---

### 階段二：程式碼修飾與衛生檢查 (Code Hygiene & Verification)

- [x] **1. 清理 ESLint 警告**
  - [x] 已清理所有未使用的變數與引用 (`src/main.ts`, `src/manager.ts`, `src/modals/saveModal.ts`)。

- [x] **2. 執行完整驗證**
  - [x] `npm run lint` 已達 0 errors, 0 warnings。
  - [x] `npm run build` 建置成功（產生最終 `main.js` 與 `styles.css`）。
  - [x] `npm test` 17 項單元與整合測試 100% 全數通過。

---

### 階段三：GitHub 倉庫與 Release 準備 (GitHub Release Setup)

- [ ] **1. 推送至 GitHub 公開倉庫**
  - [ ] 確保 GitHub Repository 設為 **Public**。
  - [ ] 專案 README、manifest.json、LICENSE 等均已 Commit 完備。

- [ ] **2. 建立 GitHub Release**
  - [ ] 創建 Git Tag `1.0.0` (必須與 `manifest.json` 的 `"version"` 完全一致)。
  - [ ] 建立 Release `1.0.0`。
  - [ ] 附加以下 3 個獨立檔案至 Release Assets（**切勿壓縮成 zip**）：
    1. `manifest.json`
    2. `main.js`
    3. `styles.css`

---

### 階段四：提交至 Obsidian Releases (PR Submission)

- [ ] **1. Fork 官方倉庫**
  - [ ] Fork [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases)。

- [ ] **2. 編輯 `community-plugins.json`**
  - [ ] 將外掛資訊加入至陣列末端：
    ```json
    {
      "id": "obsidian-window-spaces",
      "name": "Window Spaces",
      "author": "edwardsayer",
      "description": "Save and restore window layouts for Obsidian popout windows. Seamlessly manage multi-window popout workspaces.",
      "repo": "edwardsayer/obsidian-window-spaces"
    }
    ```

- [ ] **3. 發起 Pull Request**
  - [ ] 開立 PR 至 `obsidianmd/obsidian-releases` 的 `master` 分支。
  - [ ] 標題建議：`Add Window Spaces plugin`
  - [ ] 勾選並填寫 PR 範本中的檢核項目（確認未包含私有/惡意 API、未違反社群規範等）。
  - [ ] 追蹤官方 Reviewer (如 @licat, @kepano 等) 的審核回饋。

---

*建立日期：2026-07-27*
