# Window Layouts Modal UI 樣式升級紀錄

## 統一 Window Layouts 入口

- Restore 與 Manage 已合併為單一 `Window Layouts` dialog。
- Command ID 改為 `open-window-layouts`；同一清單支援一般點擊／Enter 在新視窗還原、長按／Shift+點擊／Shift+Enter 在目前 active 視窗還原，以及 Auto-save、Rename、Edit、Delete。
- Ribbon 與 Popout 狀態列各只保留一個 `layout` 圖示入口；設定合併為 `showWindowLayoutsRibbonIcon`。

## 變更概述
參考 `obsidian-tasks-plugin` 及 `darlal-switcher-plus` (Quick Switcher++) 的介面風格，對統一後的 **Window Layouts** 視窗進行 UI 樣式優化。

## 主要修改項目

### 1. Title 與右上角關閉 (X) 按鈕樣式
- **參考標的**：`obsidian-tasks-plugin` 的 "Create or Edit Task" Modal
- **重構內容**：
  - 移除原本自訂的 `window-layouts-modal-header` 自建 DOM 結構與相關的 CSS 定位覆蓋。
  - 改為直接呼叫 Obsidian 原生 Modal API `this.setTitle(...)`。
  - Modal 的 Title 與右上角 Close Button（X 按鈕）完全採用 Obsidian 標準原生 Modal 視覺排版與互動樣式，與 obsidian-tasks-plugin Modal 保持一致。

### 2. Window Layout 清單 (Items List) 樣式
- **參考標的**：`darlal-switcher-plus` (Quick Switcher++) 項目清單
- **重構內容**：
  - 清單項目 DOM 結構調整為 `suggestion-item window-layout-item` 結構。
  - 左側內容區區分為標題 `suggestion-title qsp-title` 與備註說明 `suggestion-note qsp-note`。
  - 日期標示與檔案數量採用 `qsp-path` 以及微型膠囊框 `qsp-tag` 樣式展現。
  - 右側動作按鈕區採用 `suggestion-aux qsp-aux layout-actions` 結構，搭配精緻按鈕樣式。
  - 移除項目間粗重的底框線，改為 Switcher++ 式的 hover 高亮與鍵盤選擇指示 (`box-shadow: inset 3px 0 0 var(--interactive-accent)`)。

## 相關修改檔案
- [restoreModal.ts](file:///D:/GitDev/ObsidianWindowSpaces/src/modals/restoreModal.ts)
- [styles.css](file:///D:/GitDev/ObsidianWindowSpaces/styles.css)

## 測試環境部署狀態
- **部署目標**：`E:\vaults\test-vault\.obsidian\plugins\obsidian-window-spaces`
- **部署檔案**：`main.js`, `manifest.json`, `styles.css`, `main.js.map`
- **對齊與極簡化修復（仿照原生 Manage workspace layouts）**：
  1. **按鈕簡化**：將 "Save current layout" 簡化為 "Save"，並改為標準按鈕樣式。
  2. **輸入框 focus 框完整顯示**：微調 `modal-content` 與 `window-layouts-toolbar` 內邊距，解決搜尋框 focus 時左側邊框被裁切的問題。
  3. **選中項目高亮簡化**：移除項目左側紫色/藍色輔色邊框 (`box-shadow: none`)，改為簡潔淡灰色 hover/select 背景。
  4. **副標題簡化與切齊**：移除 `Created Date` 與 `Files` 的背景色框，變為乾淨 muted 文字，並精確與 Layout 名稱左側對齊。
  5. **Delete 按鈕圖示化**：改為與原生 Manage workspace layout 一致的 `✕` 圖示按鈕 (`clickable-icon`)，滑鼠懸停顯示 "Delete layout" 提示。
  6. **Restore / Rename 按鈕簡化**：改為與原生 Load 按鈕相同的 Obsidian 預設灰框按鈕。
  7. **預設選中第一個項目**：清單數量 > 0 時或搜尋過濾後預設自動選中第 1 個項目 (`selectedIndex = 0`)，按 Enter 可直接執行復原。
  8. **對話視窗底部提示 (Prompt Footer Instructions)**：在對話視窗內層底部加入極簡提示欄 (`↑ ↓ 選擇項目` `↵ 新視窗` `Shift ↵ 目前視窗` `esc 關閉`)。樣式設為置中對齊 (`justify-content: center`)、移除上方水平分割線，並覆蓋 Modal 最外層容器的預設底內邊距 (`padding-bottom: 8px !important`)，使 Footer Hint 底部到對話視窗邊框的間距極小，完全對齊 Obsidian 內建對話視窗風格。
  9. **全對話視窗範圍與 Capture 階段 Keydown 監聽**：採用 Obsidian 原生 `this.scope` 註冊與 `useCapture = true` 捕獲階段 Keydown 事件監聽。即使滑鼠點擊標題 ("Window Layouts")、背景或任何區域導致焦點離焦，按下 **`↑` / `↓` 鍵** 依然 100% 能進行清單選擇切換；按下 **`Enter`** 在新 Popout 還原，按下 **`Shift + Enter`** 則精確套用至目前 active Popout。
  10. **主視窗左側 Ribbon 按鈕與組態開關**：
      - 在主視窗左側邊欄 (Ribbon) 提供單一 **Window Layouts**（`layout` 圖示）快速入口，同時支援還原與管理。
      - 在 plugin 組態設定中提供 `showWindowLayoutsRibbonIcon` 顯示／隱藏開關，預設顯示。
  11. **"Save Window Layout" 對話窗標題與 i18n 統一**：
      - 改用 Obsidian 原生 `this.setTitle(t("saveModal.title"))`，使 Title 樣式、字體與排版與 **Window Layouts** 完全一致。
      - 將所有硬編碼中文訊息（如「檔案數量」、「建立時間」、「視窗大小」、「包含視窗位置/大小」等）完全重構並抽離至 `src/i18n` 多語字典中，支援英文、繁體中文、簡體中文。
  12. **Context-Aware Restore 與 Restore 按鈕長按/Shift 目標切換**：
      - **一般操作**：清單一般點擊或按 `Enter` 在新 Popout 視窗還原。
      - **目前視窗操作**：長按 layout 項目（包含 Restore 按鈕，> 450ms）、`Shift + 點擊` 或鍵盤 `Shift + Enter`，套用至目前 active Popout 視窗。
      - **底部 Hint**：Prompt Instructions 底部加入 `↵ 在新視窗開啟` 與 `Shift ↵ 套用至目前視窗` 提示。
  13. **缺失檔案之原生空 Tab 展現與輕量 Notice 警示 (UX-002)**：
      - **版面結構忠實保留**：若 Layout 中的檔案在外部被刪除或改名，保留其原本的分頁 (Tab) 與視窗分割 (Splits) 結構不塌陷。
      - **原生 New tab 頁面**：缺失檔案的 Tab 重置為 Obsidian 原生 `type: "empty"` ("New tab")，使用者可直接點擊內建的 Create new note 或 Go to file 操作。
      - **單行 Notice 警告**：復原完成後發送單行 Notice 提醒（例如：`⚠️ 佈局已復原，但包含不存在的檔案`）。
  14. **還原 Active File / 檢視模式與視窗聚焦 Focus (UX-003)**：
      - **Active File 啟用**：完成分頁與檔案開立後，比對 `layout.workspace.activeFile` 並顯式執行 `setActiveLeaf(activeLeaf, { focus: true })`，精確還原保存時正在閱讀/編輯的分頁與檔案。
      - **檢視模式復原**：開啟檔案時還原其原始 Mode（原始碼編輯模式 `source` 或預覽模式 `preview`）。
      - **視窗自動聚焦**：還原結束時調用 `targetWin.focus()`，確保 Popout 視窗自動獲得鍵盤與視窗焦點。
  15. **Pinned 釘選檔案優先之智慧預設命名 (UX-006)**：
      - **Pinned 檔名優先級**：儲存時優先提取已被釘選 (`pinned: true`) 的分頁檔名，其次提取當前 Active File 檔名。
      - **智慧組合名稱**：自動依據檔案數量組合（單檔 `檔名`、雙檔 `檔名A & 檔名B`、多檔 `>=3` `檔名A, 檔名B 及其他`），附帶 55 字元上限優雅截斷。
  16. **同名覆寫無阻礙秒存與 Modal 內動態透明感知 (UX-009)**：
      - **零阻礙流暢覆寫**：無中斷性 Confirm 彈窗，輸入同名後按 `Enter` 即可直接完成覆寫更新。
      - **Modal 內動態提示**：當輸入框名稱與既有 Layout 重名時，下方動態顯示淡色提示 `ℹ️ 將覆蓋更新既有佈局「XXX」`；若修改檔名提醒自動消失。
      - **獨立 Notice 提醒**：同名覆寫成功發送 Notice 提醒（`已覆蓋更新佈局: XXX`）。
  17. **全 Modal 標題對齊與原生規範化 (Modal Title Normalization)**：
      - 全盤巡檢 `src/` 中所有對話視窗（包含 `showRenameDialog` 與 `showConfirmDialog`），將原先寫死的 `<h3>` 自訂標籤全面改用 Obsidian 原生 `modal.setTitle(...)` API。
      - 標題字體大小、Margin、Padding 與右上角關閉 (✕) 按鈕 100% 垂直對齊一致，並為 Rename 輸入框補上 `Enter` 快捷鍵提交。
  18. **表單對話視窗全寬延伸與固定 Label 樣式 (Full-Width Form Input Layout)**：
      - 為 Rename Modal 與 Save Modal 加入 `.window-spaces-setting-full-width` 樣式。
      - 左側 Label 固定適當寬度，右側 `input[type="text"]` 100% 延伸填滿整個 Modal 橫幅區域，大幅提升檢視與編輯長名稱的體驗。
  19. **全站與 Popout 圖示大一統 (Icon Consistency Standard)**：
      - 統一全專案圖示規範：Restore 類別全面使用 `history` 圖示；Manage 類別全面使用 `layout` 圖示；Save 類別全面使用 `save` 圖示。
      - 修正 Popout 左下角狀態列按鈕圖示（原本 Restore 誤使用 `rotate-ccw`，Manage 誤使用 `list`）統一為 `history` 與 `layout`。
      - 替換 Popout 狀態列前綴舊有 Unicode 符號 `▣` 為原生 `history` Lucide Icon，達成全站極致一致視覺。
      - 為 Command Palette 命令列全數補上對應 Icon。
  20. **Window Layouts Toolbar 頂部按鈕 UX 重構 (Toolbar UX Polish)**：
      - **Window Layouts 視窗新增 `+ 新視窗 (+ New Window)`**：搜尋框右側新增專屬按鈕，找不到既有 Layout 時可秒點建立全新的獨立 Popout 空白視窗，流程極致順暢。
      - 還原與管理功能共用同一個 Toolbar，不再維護兩套視窗或重複按鈕。
  21. **Restore / Manage 清單 Hover Tooltip 檔案細節預覽 (UX-007)**：
      - 滑鼠懸停於清單項目時，動態顯示原生 Tooltip，詳細條列該 Layout 收錄的所有筆記檔案檔名（含檔案總數統計與超過 15 個檔時的 `... (+N)` 保護）。
      - **靠前對齊與多語系適應 (Start Alignment)**：Tooltip 設定 `text-align: start !important;`，確保清單符號 `•` 與檔案名稱在從左至右 (LTR) 及各語系環境下完美左對齊、視覺排版極度舒適整齊。
  22. **Restore / Manage 多維度動態排序 (UX-010)**：
      - 頂部 Toolbar 搜尋列右側加入原生下拉選單 Dropdown，支援依「日期 (最新 / 較舊)」與「名稱 (A-Z / Z-A)」進行動態切換。
      - 切換時清單即時重繪反應，並自動持久化至 `settings.sortBy` 設定中。
  23. **Tasks Plugin 風格之右上角齒輪 (⚙️) 原生排序選單與 UI 徹底重構**：
      - 仿照 `obsidian-tasks-plugin` 對話視窗設計，**移除 Modal 右上角傳統關閉 `✕` 按鈕**，將其改造為 Obsidian 原生齒輪 `⚙️` 圖示按鈕 (`gear`)。
      - 點擊右上角齒輪 `⚙️` 按鈕，動態彈出 Obsidian 原生功能選單 (`new Menu()`)，提供條理分明的排序維度（`📅 日期 (最新)`、`📅 日期 (較舊)`、`🔤 名稱 (A-Z)`、`🔤 名稱 (Z-A)`），並帶有原生 Checkmark `✓` 標記當前選項。
      - 徹底解決舊有 Dropdown 控件與系統箭頭/文字重疊問題，Toolbar 恢復極致潔淨大方。
  24. **Per-Layout 獨立自動保存機制、5 秒 Debounce 與視窗關閉自動存 (UX-013)**：
      - 自動保存改為針對各個 Window Layout 個別設定 (`layout.autoSave`)。
      - 儲存視窗加入「啟用此佈局的自動保存」Toggle 開關；Manage 視窗加入 🔄 快捷切換按鈕。
      - 啟用了自動保存的 Layout，名稱旁顯示高亮的 🔄 (`refresh-cw`) 圖示標籤。
      - 運作時自動套用 5 秒 (5000ms) 防手震 Debounce，且在 Popout 視窗關閉時強制實施最後一次實時快照儲存。
  25. **Window Layouts 清單項目按鈕下拉選單化重構 (Menu Dropdown UI)**：
      - 移除清單項目右側原本散亂的多個按鈕（Auto-Save 🔄、Rename、Delete ✕），替換為極簡的向下箭頭 `∨` (`chevron-down`) 下拉選單按鈕。
      - 點擊向下箭頭 `∨` 按鈕彈出 Obsidian 原生選單 (`new Menu()`)，內含四項功能：
        1. 🔄 **Auto-Save 切換**：帶 Checkmark `✓` 顯示當前狀態，點擊即可切換開啟/關閉。
        2. ✏️ **Rename (重新命名)**
        3. ⚙️ **Edit (編輯佈局與設定)**：開啟 Save Modal，並自動載入與當前項目一致的 `autoSave` 狀態與設定。
        4. 🗑️ **Delete (刪除佈局)**
  26. **Popout 視窗狀態列 Auto-Save 快捷切換**：
      - Popout 左下角狀態列動作按鈕區加入 `Auto-Save` 圖示按鈕 (`refresh-cw`)。
      - 啟用時自動亮起 (`is-active`)，點擊可秒切 Auto-Save 開關狀態並跳出 Notice。
  27. **Restore 多檔案動態幾分之幾進度 Notice 提示 (UX-008)**：
      - 當還原包含多個檔案 (>= 2 個) 的 Layout 時，畫面會顯示實時幾分之幾進度通知（例如 `🔄 正在復原佈局... (2/5)`）。
      - 開檔完成後自動隱藏進度 Notice 並展現結果通知，簡單乾淨。
  28. **微創 Tree 引用保護與 Focus 延遲防抖優化 (Prevent Window Jitter)**：
      - **微創引用保護 (Surgical Tree Reference)**：在執行全域 `changeLayout` 時，對未參與變動的其他浮動 Popout 視窗 100% 保持原始記憶體物件引用，使 Obsidian 底層比對演算法跳過無關視窗的 DOM 重構，消弭旁觀視窗的閃爍抖動。
      - **Focus 延遲防抖**：在多檔案還原開檔過程中傳入 `{ active: false }` 避免開檔中途頻繁搶焦，直到整個還原完畢的最末端才發動一次性視窗 Focus 聚焦。
  29. **Auto-Save 視窗關閉時檔案清單清空之三重防呆機制 (Auto-Save Guardrails)**：
      - **記憶體合法快照備份 (`lastValidSnapshots`)**：在視窗存活期間持續為 `autoSave` 的 Popout 視窗維護最新的合法 Layout 快照。
      - **視窗關閉退回保護 (On-Close Fallback)**：當視窗關閉時，Obsidian 已將內部 DOM/Leaves 解綁，`autoSaveWindowLayout` 會自動優先使用視窗關閉前最後一次備份的合法快照進行寫入。
      - **零檔案覆寫攔截 (Zero-File Overwrite Protection)**：當偵測到快照中的檔案數為 0，但原始已儲存佈局中含有檔案時，發動防呆門檻，**堅決拒絕覆寫**並發出警告，徹底防止視窗關閉導致檔案清單遭抹除的悲劇。
  30. **Save Modal 自動繼承與動態連動 Auto-Save 狀態 (Save Modal Sync)**：
      - 從 Popout 左下角/右上角點擊 Save 按鈕時，儲存對話視窗自動繼承並反顯該視窗目前套用 Layout 的真實 `autoSave` 開開狀態。
      - 在 Save Modal 輸入檔名時，若輸入的名稱等於某個既有 Layout，內部的 `autoSaveToggle` 會即時動態連動同步為該既有 Layout 的 `autoSave` 狀態。
  31. **Save Window Layout 視窗位置與大小選項簡化合併 (Unified Position & Size Option)**：
      - 將原先獨立的「包含視窗位置」與「包含視窗大小」兩個 Setting 項目，合併為單一精簡的的 **「包含視窗位置與大小 (Include window position & size)」** Toggle。
      - 大幅縮減對話視窗高度，介面視覺更加簡潔俐落。
  32. **獨立保存 Created Date / Updated Date、另存重置與預設更新時間倒序 (Timestamp & Sort Refactoring)**：
      - **獨立時間戳記錄**：`WindowLayout` 現包含 `createdAt` (建立時間) 與 `updatedAt` (最後更新時間)。
      - **覆寫 vs 另存/複製分開處理**：
        - 覆寫既有同名 Layout 時：保留原有的 `createdAt`，更新 `updatedAt = Date.now()`。
        - 從 A layout 複製/改名另存為全新的 B layout 時：**B Layout 的 `createdAt` 與 `updatedAt` 均自動重置為當時複製另存的時間**。
      - **多維度排序選單**：齒輪 ⚙️ 排序 Menu 升級為包含「更新時間 (最新)」、「更新時間 (較舊)」、「建立時間 (最新)」、「建立時間 (較舊)」、「名稱 (A-Z)」、「名稱 (Z-A)」。
      - **全站預設排序變更**：全站預設排序統一升級為 **`updated-desc` (`更新時間 (最新)`)**，清單視圖預設展示 `更新時間`。
  33. **動態語系即時求值 (Realtime Dynamic i18n Detection)**：
      - **多重源動態求值**：`detectLocale()` 升級為包含 `window.localStorage.getItem("language")` (Obsidian 官方語言選項位置)、`moment.locale()` 與 `app.vault.config.userLanguage` 的即時動態檢測。
      - **零延遲即時切換**：`t(key)`、`formatDate()` 及 `formatNumber()` 改為在調用時實時動態求值，解決了在 Obsidian 設定中切換語言時外掛介面文字無法同步更新的 Bug。
  34. **UX-014 單元測試與自動化測試涵蓋率完成 (Vitest Test Suite Integration)**：
      - 成功整合 `Vitest` + `jsdom` + `obsidian` Mock 測試環境。
      - 完成 6 個測試套件（智慧命名、6 大維度動態排序、0 檔案覆寫防呆攔截、實時語系檢測、Layout Tree 樹狀結構提取、Window Layouts restore 目標），全數 **25 個測試個案 100% PASS** 通過！
  35. **Window Layouts 目標匹配強化與舊視窗標籤鎖定保護 (TargetWindow Matching & Label Guard)**：
      - **多層次 DOM 反查匹配**：重構 `restoreLayout` 中的 `targetIndex` 搜尋邏輯，新增 Leaf ID 比對 ➔ DOM Document `defaultView` 比對 ➔ 浮動索引鎖定三層保障。確保按 `Shift + Enter` 時 **100% 精確套用至當前的 Popout 視窗，絕對不誤取代其他視窗**。
      - **舊視窗標籤鎖定**：使用一般 `Enter` 在新 Popout 視窗還原時，原先舊 Popout 視窗的 Layout 名稱與狀態列 **100% 保持鎖定維持**，解決了新視窗還原後舊視窗被誤置為 `No layout applied` 的問題。
  36. **Command Palette 命令感知與雙重拒絕開新視窗防護 (Command Capture & Strict Non-Popout Fallback)**：
      - **命令發起視窗實時感知**：修正 `openWindowLayoutsModal` 在透過快捷鍵/命令面板 (`Ctrl+P`) 發動時，未帶入 `targetWindow` 參數導致視窗被判斷為 `undefined` 的死穴。現已實施 `manager.getActiveWindow()` 實時 DOM 反查，確保命令面板開啟對話視窗時 100% 準確抓住當前 Popout 視窗。
      - **目標視窗防護**：在 `restoreLayout` 流程中依據 `forceNewWindow` 與 `targetWindow` 判斷目標；Shift 操作可套用至目前 active Popout，一般 Enter 則建立新的 Popout，避免錯誤取代其他視窗。
  37. **Popout DOM 級別雙重標籤持久化 (`data-layout-name`)**：
      - **全性命週期標籤保護**：揭露了 `changeLayout` 過程重構 DOM 時，記憶體 `Map<Window, string>` 因 Window 物件解綁導致舊視窗標籤被強行降級寫入 `No layout applied` 的致命原因。
      - **DOM 屬性備份與回溯**：在 Popout `body` 上寫入 `data-layout-name` 屬性。當記憶體 Map 找不到時，自動從 DOM 屬性恢復 `layoutName`，並防止無標籤情況下隨意清除舊視窗名稱。一般 `Enter` 在新視窗還原時，原視窗標籤 100% 免疫刷新，永不抹除！
- **部署狀態**：
  - ✅ 已成功構建並部署至測試 Vault：`E:\vaults\test-vault\.obsidian\plugins\obsidian-window-spaces`
  - ✅ 已成功構建並部署至正式 Vault：`E:\vaults\Note\.obsidian\plugins\obsidian-window-spaces`
