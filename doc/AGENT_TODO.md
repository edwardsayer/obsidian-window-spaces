# Window Spaces Agent TODO

這份清單把使用性改善拆成可由 Agent 逐項執行、驗證與交付的工作。

## 狀態規則

- `[ ]` 待處理
- `[-]` 進行中
- `[x]` 已完成
- `[blocked]` 需要外部條件或使用者決策

每個項目完成後，Agent 應同步更新狀態、修改檔案、驗收結果與測試日期。

## P0：降低誤操作與資料遺失風險

### UX-001 Context-Aware Restore 目標視窗選擇與點擊/長按/Shift 操作

- [x] **目標**：讓使用者透過不同點擊與鍵盤操作，明確選擇還原至目前 active Popout 視窗或開新 Popout 視窗，避免無預期暴增 Popout。
- **實作方案**：
  - **操作規則**：一般點擊或按 `Enter` 在新 Popout 視窗還原；長按 layout 項目（包含 Restore 按鈕，> 450ms）、Shift+點擊或按 `Shift + Enter`，在目前 active Popout 視窗還原。
  - **來源視窗辨識**：從 Popout 視窗開啟 `Window Layouts` 時，Shift 操作會精確套用至該 active Popout；從主視窗開啟時則依 manager 的安全 fallback 處理。
  - **底部 Hint**：Prompt 底部明確顯示 `↵ 在新視窗開啟` 與 `Shift ↵ 套用至目前視窗`。
- **主要檔案**：`src/manager.ts`、`src/modals/restoreModal.ts`、`src/i18n/*`。
- **完成日期**：2026-07-27

### UX-002 Restore 結果與遺失檔案原生空 Tab 及 Notice 提示

- [x] **目標**：讓使用者在檔案不存在時保持版面分頁結構不坍塌，並顯示原生空 Tab 頁面與輕量通知。
- **實作方案**：
  - **版面結構保持 (Layout Integrity)**：保留該分頁與分割區塊 (Splits / Tabs) 在 Popout 視窗中的位置與形狀不變形。
  - **原生 New tab 頁面**：若檔案不存在（外部已被刪除/改名），將該 Leaf 重置為 Obsidian 原生空分頁 `type: "empty"` ("New tab")，自帶「Create new note」與「Go to file」功能。
  - **輕量 Notice 警告**：復原完成時發送單行 Notice 提醒（例如：`⚠️ 佈局已復原，但包含不存在的檔案`）。
- **主要檔案**：`src/manager.ts`、`src/i18n/*`。
- **完成日期**：2026-07-27

### UX-003 還原 active file / tab / focus

- [x] **目標**：還原完成後回到保存時正在使用的檔案、分頁與檢視模式，並聚焦目標視窗。
- **實作方案**：
  - **Active File 啟用**：在完成檔案載入後，比對 `layout.workspace.activeFile` 並顯式呼叫 `setActiveLeaf(targetActiveLeaf, { focus: true })` 切換至保存時正在閱讀/編輯的檔案。
  - **檢視模式還原**：開啟檔案時傳入原 Leaf 的編輯/預覽模式（`mode: "source"` 或 `"preview"`）。
  - **Popout 視窗聚焦 (Focus)**：在還原流程結尾顯式調用 `targetWin.focus()`，確保浮動視窗自動浮出並取得鍵盤焦點。
- **主要檔案**：`src/manager.ts`、`src/types.ts`。
- **完成日期**：2026-07-27

### UX-004 穩定的視窗識別 (File-Set Matching 多級比對)

- [x] **目標**：Obsidian 重啟後仍能正確找到原本對應的 Popout 視窗，避免開錯或重複開窗。
- **實作方案**：
  - **4 層多級備援比對 (Multi-Tier Fallback Matching)**：結合記憶體視窗指標、Leaf ID 比對，以及 `findWindowForSavedLeaves` 視窗檔案集合與版面結構特徵比對。重啟後即使 DOM ID 重新洗牌，外掛依然能依據視窗內的檔案組合精確鎖定正確的 Popout。
- **主要檔案**：`src/manager.ts`。
- **完成日期**：2026-07-27

### UX-005 還原位置安全修正 (Native Obsidian Safe Placement)

- [x] **目標**：避免螢幕配置變更後，Popout 被還原到螢幕外。
- **實作方案**：
  - **原生邊界校正 (Native Handled)**：經實務驗證，Obsidian 底層 (`Electron BrowserWindow` / `moveTo`) 原生即包含螢幕邊界越界校正機制。當螢幕組態變更導致視窗原座標位於可見範圍外時，Obsidian 會自動將還原的 Popout 視窗重定位于當前可用螢幕可見區域內。
- **主要檔案**：`src/manager.ts`。
- **完成日期**：2026-07-27

## P1：提升日常操作效率

### UX-006 更有意義的預設名稱 (Pinned 優先智慧命名)

- [x] **目標**：讓預設名稱能反映視窗中的關鍵筆記與檔案主題，不用靠時間戳猜測。
- **實作方案**：
  - **Pinned 檔案優先**：優先選取被釘選 (`pinned: true`) 的筆記檔名，其次為焦點檔名 (Active File)，最後為其他開立檔案。
  - **智慧組合公式**：
    - 單檔：`檔名`
    - 雙檔：`檔名A & 檔名B`
    - 多檔 (>= 3)：`檔名A, 檔名B 及其他`
  - **長度保護與多語化**：提供 55 字元上限截斷保護與完整多語字典支援。
- **主要檔案**：`src/manager.ts`、`src/modals/saveModal.ts`、`src/types.ts`。
- **完成日期**：2026-07-27

### UX-007 Restore 清單預覽 (Hover Tooltip 檔案清單預覽)

- [x] **目標**：在還原前即可清晰辨識各個 Layout 所收錄的具體筆記檔案。
- **實作方案**：
  - **Hover Tooltip 懸停預覽**：當滑鼠懸停在 Window Layouts 清單項目上時，動態生成原生 Tooltip，條列顯示該佈局所收錄的所有檔案檔名（例如 `收錄檔案 (3): • Welcome.md • Dev.md`）。
  - **數量統計與截斷保護**：超過 15 個檔案時自動提供 `... (+N)` 統計保護。
- **主要檔案**：`src/modals/restoreModal.ts`、`src/i18n/*`。
- **完成日期**：2026-07-27

### UX-008 Restore 進度與動態幾分之幾提示 (Fraction Progress Notice)

- [x] **目標**：多檔案還原期間提供清晰的幾分之幾動態進度提示。
- **實作方案**：
  - **動態 Notice 進度**：當還原多個檔案 (>= 2 個) 時，自動開啟持續型進度 Notice，實時更新開檔進度（例如 `🔄 正在復原佈局... (2/5)`）。
  - **自動隱藏與成就通知**：所有檔案開立完成後自動隱藏進度 Notice，隨後觸發最終成就或缺失檔案 Notice 提醒。
- **主要檔案**：`src/manager.ts`、`src/i18n/*`。
- **完成日期**：2026-07-27

### UX-009 同名 layout 的覆寫策略 (無阻礙秒存 + Modal 內透明感知)

- [x] **目標**：保持流暢的同名覆寫體驗，同時提供手滑誤觸的動態透明提醒。
- **實作方案**：
  - **零阻礙秒存**：無中斷性 Confirm 彈窗，輸入名稱後按 `Enter` 即可直接完成覆寫。
  - **Modal 內動態提示**：在 `Save window layout` 輸入框下方，當輸入的檔名與既有 Layout 同名時，即時顯示淡色提醒：`ℹ️ 將覆蓋更新既有佈局「XXX」`。若改為不同名則提醒自動消失。
  - **覆寫 Notice 提示**：儲存成功後若為覆寫，發送 Notice 提醒：`已覆蓋更新佈局：XXX`。
- **主要檔案**：`src/modals/saveModal.ts`、`src/manager.ts`、`src/i18n/*`。
- **完成日期**：2026-07-27

### UX-010 管理頁面操作增強 (多維度動態排序)

- [x] **目標**：讓大量 Layout 能夠輕鬆搜尋、依時間與名稱自由排序。
- **實作方案**：
  - **多維度排序選單 (Sorting Options)**：在 `Restore` / `Manage` Modal 頂部 Toolbar 搜尋列旁加入動態 Dropdown 選擇框，支援：
    - `日期 (最新)` (Date - Newest)
    - `日期 (較舊)` (Date - Oldest)
    - `名稱 (A-Z)` (Name - A to Z)
    - `名稱 (Z-A)` (Name - Z to A)
  - **設定持久化與即時反應**：排序設定自動儲存至 `settings.sortBy`，切換時清單即時重繪反應，體驗流暢。
- **主要檔案**：`src/modals/restoreModal.ts`、`src/manager.ts`、`src/types.ts`、`styles.css`、`src/i18n/*`。
- **完成日期**：2026-07-27

### UX-015 Accessibility 與全視窗鍵盤導覽

- [x] **目標**：讓不使用滑鼠的使用者也能無縫完成視窗選擇、搜尋、還原與管理。
- **主要檔案**：`src/modals/restoreModal.ts`、`src/modals/saveModal.ts`。
- **驗收條件與成果**：
  - Modal 開啟時焦點預設聚焦輸入框。
  - 採用 `this.scope` 註冊與 Capture 階段全域 keydown 監聽（`useCapture = true`），即使點擊標題或空白區域致焦點離焦，按下 `↑`/`↓` 鍵仍 100% 可切換項目，按 `Enter` 可直接執行復原。
  - 所有按鈕具備明確圖示、文字標示或 `setTooltip` / `aria-label` 供螢幕閱讀器識別。
- **完成日期**：2026-07-26

### UX-016 Popout 內容區顯示已儲存 layout 名稱

- [x] **目標**：讓使用者在 Popout Window 內直接知道目前套用的是哪個已儲存 layout。
- **建議方案**：使用 Obsidian `window-open` 事件取得 Popout 的 DOM Window，在該視窗的內容區顯示 plugin-owned label；不修改原生視窗標題，也不把自訂欄位寫入 Obsidian layout tree。
- **主要檔案**：`src/main.ts`、`src/manager.ts`、`styles.css`、`src/i18n/*`。
- **驗收條件**：
  - 儲存 layout 後，來源 Popout 顯示該 layout 名稱。
  - Restore 完成後，目標 Popout 顯示該 layout 名稱。
  - 主視窗不會誤顯示 Popout layout label。
  - Popout 關閉後不會留下 plugin 的視窗追蹤狀態。
  - 不依賴修改原生視窗標題列。
- **驗收結果**：已完成 save、restore、window-close 與 plugin unload 的 label 生命週期處理；`npm run build` 通過。
- **完成日期**：2026-07-26

### UX-017 Popout layout 名稱以狀態列顯示

- [x] **目標**：在 Popout 左下角以狀態列樣式顯示 layout 名稱。
- **主要檔案**：`src/types.ts`、`src/main.ts`、`src/settings.ts`、`src/manager.ts`、`src/i18n/*`、`styles.css`。
- **驗收結果**：保留「顯示佈局狀態列」設定且預設啟用；所有新開啟的 Popout 都會顯示狀態列，狀態列提供儲存按鈕可直接開啟儲存佈局對話框。
- **完成日期**：2026-07-26

### UX-018 統一 Window Layouts 視窗、原生對齊與極簡風格

- [x] **目標**：以單一 Window Layouts 視窗整合還原與管理功能，並完成精緻的原生視窗視覺與互動對齊。
- **主要檔案**：`src/modals/restoreModal.ts`、`styles.css`、`src/i18n/*`。
- **驗收結果**：
  - 使用單一 `WindowLayoutsModal`，同時提供還原與管理功能，不再區分 Restore／Manage 模式。
  - 標題與關閉 (X) 按鈕完全採用 Obsidian 原生 `setTitle`（仿照 obsidian-tasks-plugin Task Modal）。
  - 清單項目採用 Quick Switcher++ 樣式，簡化選中高亮背景，移除左側邊框輔色。
  - 搜尋框與工具列按鈕邊界與頂部 Title ("Window Layouts") 左緣及關閉按鈕右緣精確垂直對齊。
  - 刪除按鈕改為與內建 Manage workspace layout 一致的 `✕` 圖示 (`clickable-icon`)，滑鼠懸停顯示 "Delete layout" 提示；Restore / Rename 按鈕改為預設灰框按鈕。
  - 視窗底部加入置中無分割線的 Prompt 提示欄 (`↑ ↓ 選擇項目` `↵ 新視窗` `Shift ↵ 目前視窗` `esc 關閉`)，且覆蓋 `.modal` 最外層容器預設 24px 大 Padding 留空。
- **完成日期**：2026-07-26

### UX-019 主視窗左側 Ribbon 按鈕與組態開關

- [x] **目標**：主視窗左側 Ribbon 按鈕列提供單一 Window Layouts 入口，並於設定中提供動態開關。
- **主要檔案**：`src/types.ts`、`src/main.ts`、`src/settings.ts`、`src/i18n/*`。
- **驗收結果**：
  - 支援 Window Layouts (`layout` 圖示) Ribbon 按鈕，還原與管理共用同一入口。
  - 設定頁面提供 `showWindowLayoutsRibbonIcon` Toggle 開關，預設顯示。
  - 切換 Toggle 可即時動態更新 Ribbon 列。
- **完成日期**：2026-07-26

### UX-020 Save Window Layout Modal 原生 Title 樣式與全介面多語化 (i18n)

- [x] **目標**：將 "Save window layout" 對話窗標題樣式統一，並將所有硬編碼中文進行多語化 (i18n)。
- **主要檔案**：`src/modals/saveModal.ts`、`src/i18n/*`。
- **驗收結果**：
  - 改用 Obsidian 原生 `setTitle(t("saveModal.title"))`，與 Window Layouts 標題視覺 100% 一致。
  - 將所有硬編碼中文（檔案數量、建立時間、視窗大小、包含視窗位置/大小選項）抽離至 `src/i18n` 翻譯檔，完整支援 en, zh-TW, zh-CN。
  - 名稱輸入框支援 `Enter` 快捷鍵提交。
- **完成日期**：2026-07-26

## P2：可攜性、維護性與品質

### UX-011 Layout 匯出與匯入

- [cancelled] **目標**：支援換 Vault、換電腦與備份。
- **結論與原因**：Obsidian 以 Vault 為單位（包含 `.obsidian/plugins/` 目錄）進行備份，同步工具（Obsidian Sync, Git 等）會自動同步 `data.json` 插件狀態，因此不需要獨立的 JSON 匯出/匯入功能，決定取消。

### UX-012 Layout schema 版本與 migration (防禦性相容解析)

- [x] **目標**：讓舊版資料在未來 API/schema 變更後仍可使用。
- **實作方案**：採用防禦性容錯與彈性解析 (Defensive Parsing)，直接借用 Obsidian 官方 Layout Tree 容錯與向下相容，並維護 `metadata.pluginVersion`。多層級路徑自動平滑解析，無需額外遷移腳本。
- **主要檔案**：`src/types.ts`、`src/manager.ts`。
- **完成日期**：2026-07-27

### UX-013 自動保存防干擾 (Per-Layout 5 秒 Debounce 及視窗關閉自動存)

- [x] **目標**：讓使用者為特定的已命名 Layout 分別勾選啟用自動保存，避開舊有全域盲目自動保存產生的干擾與大量重複版本。
- **實作規格與方案**：
  - **Per-Layout 獨立開關**：自動保存開關依附於各個已命名的 `WindowLayout` (`autoSave?: boolean`)，可在 `Save Modal` 開啟時勾選，或在 `Manage Modal` 中點擊 🔄 按鈕自由切換。
  - **清晰視覺圖示識別 (UI Icon Indicator)**：啟用了自動保存的 Layout，在 `Restore` 與 `Manage` 對話框的名稱旁會顯示顯眼的 🔄 (`refresh-cw`) 高亮圖示。
  - **5 秒 Debounce 智慧防手震**：當開啟自動保存的 Popout 視窗發生分頁變動時，自動套用 5 秒 (5000ms) 防手震靜默覆寫，不干擾使用者操作。
  - **視窗關閉時自動存 (On Window Close)**：當 Popout 視窗關閉時，若該 Popout 套用了啟用自動保存的 Layout，無需等待立刻發動一次實時快照保存，100% 保障最新狀態。
- **主要檔案**：`src/types.ts`、`src/manager.ts`、`src/main.ts`、`src/modals/saveModal.ts`、`src/modals/restoreModal.ts`、`styles.css`、`src/i18n/*`。
- **完成日期**：2026-07-27

### UX-014 可測試性與測試覆蓋 (Unit Tests & Integration Tests)

- [x] **目標**：配置 Vitest 測試環境並補齊 5 大核心模組之單元測試涵蓋率。
- **實作成果**：
  - ✅ 配置 `Vitest` + `jsdom` + `obsidian` API Mock 環境。
  - ✅ 完成 6 個測試套件，**35 個測試個案 100% 全數通過 (PASS)**：
    1. `tests/smartName.test.ts` (智慧命名 Pinned 優先、Active 次優先、格式化)
    2. `tests/sorting.test.ts` (6 大維度排序與複製另存新時間戳)
    3. `tests/validationAndGuardrails.test.ts` (0 檔案覆寫攔截、智慧 Focus 比對與資料結構驗證)
    4. `tests/i18n.test.ts` (實時多源語系檢測與 fallback)
    5. `tests/layoutTree.test.ts` (Layout Tree 樹狀結構遞迴提取)
    6. `tests/restoreModal.test.ts` (目標視窗還原、Enter / Shift+Enter 事件與搜尋過濾)
- **專案規劃文件**：[doc/done/TEST_PLAN_UX014.md](file:///D:/GitDev/ObsidianWindowSpaces/doc/done/TEST_PLAN_UX014.md)
- **完成日期**：2026-07-27

### UX-022 已開啟佈局智慧切換與 Focus (Smart Focus for Open Window Layouts)

- [x] **目標**：當使用者欲復原的 Layout 已經在某個浮動 Popout 視窗中開啟時，自動切換並聚焦 (Focus) 該既有視窗，避免重複建立相同的 Popout 視窗。
- **實作方案**：
  - **`getOpenWindowForLayout` 多層智慧辨識**：結合 `layoutWindows` 記憶體指標、`data-layout-name` DOM 屬性與 `findWindowForSavedLeaves(..., requirePositiveScore=true)` 高精確度檔案特徵比對，避免單一 Popout 視窗開立時誤將其他無關 Layout 通通判定為開啟。
  - **視窗自動聚焦與標籤保護**：若佈局已開啟，預設 (Click / Enter) 自動觸發 `focusTargetWindow()`，將該浮動視窗移至最前景並給予鍵盤焦點，發出 Notice 提醒 (`已切換至「XXX」之已開啟視窗`)；若按住 `Shift` 則可強制將佈局重載套用至目前視窗。
  - **Window Layouts 清單動態標籤 (🟢 視窗開啟中)**：清單項目副標題列精確為「真正運行該 Layout 的 Popout 視窗」動態顯示 `🟢 視窗開啟中` (Active) 微型標籤，讓使用者一目瞭然。
- **主要檔案**：`src/manager.ts`、`src/modals/restoreModal.ts`、`styles.css`、`src/i18n/*`。
- **完成日期**：2026-07-28

### UX-023 跨視窗與 Sidebar Panel 即時自動廣播同步 (Real-time Panel Sync)

- [x] **目標**：無論在主視窗側邊欄 (Sidebar Panel)、主視窗 Tab 或任何 Popout 視窗中開啟 Window Layouts Panel/Modal，當有新增、刪除、重命名、背景 Auto-Save 或視窗開關時，所有開啟中的 Panel 畫面均會即時自動重繪同步更新。
- **實作方案**：
  - **全域變更廣播機制 (`renderAllInstances`)**：在 `manager.saveLayout()`, `deleteLayout()`, `autoSaveWindowLayout()`, `restoreLayoutInternal()`, `saveSettings()` 以及 `window-open` / `window-close` 事件中，全面加入 `WindowLayoutsModal.renderAllInstances()` 觸發點。
  - **搜尋與選取狀態保留**：重繪時完美保留使用者在搜尋框輸入的 Query 與選取狀態，流暢度與反應達 100%。
- **主要檔案**：`src/manager.ts`、`src/main.ts`、`src/modals/restoreModal.ts`、`src/settings.ts`。
- **完成日期**：2026-07-28

### UX-024 全站用語大統一 (Window Spaces / Space 術語精簡重構)

- [x] **目標**：全面統一 UI、命令、選單、標籤與通知中的外掛術語，貫徹品牌「Window Spaces」（複數/標題）與「Space / 空間」（單數/操作/按鈕）之簡潔設計。
- **實作方案**：
  - **複數/標題全對齊**：主面板、對話框標題、設定頁面、開啟指令全面統一為 `Window Spaces`。
  - **單數/操作精簡化**：命令（`儲存目前空間` / `Save current Space`）、按鈕（`儲存空間` / `復原空間` / `刪除空間`）、標籤（`空間名稱` / `空間資訊`）與 Notice 全面精簡為 `Space / 空間`。
  - **語系同步更新**：同步更新 `en.ts`、`zh-TW.ts`、`zh-CN.ts` 與 `types.ts`。
- **主要檔案**：`src/i18n/*`、`src/main.ts`、`tests/i18n.test.ts`。
- **完成日期**：2026-07-28

### UX-025 Space list 組織性增強 (Section 標籤分類、拖曳重排、雙擊改名與封存功能)

- [x] **目標**：提升 Space list 清單之組織能力，支援多重 Section 標籤、清單分組拖曳重排、Section 雙擊內聯改名、與「📦 封存 (Archived)」功能。
- **實作方案**：
  - **Tag-Pills 標籤編輯**：於 `Save Space` / `Edit Space` Modal 中提供 Front-matter 風格 Tag Pills 輸入框，支援點選既存標籤與動態鍵入新增。
  - **Toolbar 👁️ 顯示選項下拉選單**：於 ⚙️ 排序選單前新增「顯示選項」按鈕，提供「依 Section 分組 / 不分組」及「顯示 / 隱藏封存空間」開關。
  - **Edit Space 封存切換與內聯渲染**：Edit Space Modal 中新增「封存空間」開關；取消獨立的 Archived Section，顯示封存時直接內聯於原 Section 底部，以 muted 停用顏色 (`color: var(--text-muted); opacity: 0.55`) 與 `📦` 標籤呈現。
  - **多 Section 鍵盤上下鍵導覽修正**：建立 DOM 實時渲染對映表 (`renderedLayoutEntries`)，徹底解決跨 Section 重複 Space 導致向下鍵卡住選不到底部項目的問題。
- **主要檔案**：`src/types.ts`、`src/manager.ts`、`src/modals/saveModal.ts`、`src/modals/restoreModal.ts`、`src/i18n/*`、`tests/validationAndGuardrails.test.ts`。
- **完成日期**：2026-07-28

### UX-026 Window Spaces Panel Toolbar 原生對齊 (Sidebar / Editor Tab Parity)

- [x] **目標**：讓 Window Spaces 出現在左側欄、右側欄與 Editor Tab Area 時，工具列的 DOM 結構、按鈕排列、邊框與上下留白一致，並與 Obsidian 內建 File Explorer 對齊。
- **實作方案**：
  - **共用 Persistent ItemView**：由 `src/views/windowLayoutsView.ts` 註冊 `window-spaces-layouts`，支援 `left`、`right`、`tab` 三種位置，三者共用 `WindowLayoutsModal` controller。
  - **共用原生 Toolbar 結構**：`src/modals/restoreModal.ts` 在所有 Panel 位置建立相同的 `nav-header window-layouts-panel-header` 與 `nav-buttons-container window-layouts-header-actions`，固定按鈕順序與置中方式，不再使用 sidebar 專用分支。
  - **原生邊界對齊**：`styles.css` 隱藏 Window Spaces 的標準 `.view-header`，並以 `.window-layouts-panel { padding: 0 8px 6px 8px !important; }` 清除 `view-content` 上方留白，使 toolbar 從與 File Explorer 相同的 leaf 頂端開始。
  - **回歸測試**：`tests/restoreModal.test.ts` 比對 sidebar 與 tab 的 toolbar header class 及按鈕結構一致。
- **主要檔案**：`src/views/windowLayoutsView.ts`、`src/modals/restoreModal.ts`、`styles.css`、`tests/restoreModal.test.ts`。
- **驗收結果**：使用三欄畫面實測 File Explorer、Editor Tab Window Spaces、Right Sidebar Window Spaces；中、右兩個 Window Spaces toolbar 已與 File Explorer 的 padding/margin 對齊。`npm run test` 38/38 通過，`npm run lint` 與 `npm run build` 通過，並已部署至 `test-vault` 與 `Note`。
- **完成日期**：2026-07-31

---

## 🏆 專案階段總結 (Project Summary)

- **UX-001 ~ UX-026 核心需求**：**100% 大滿貫竣工 Pass** 🎉
- **全站 Icon 大一統**：`Restore (history)`, `Manage (layout)`, `Save (save)`, `Auto-Save (refresh-cw)`
- **UI 精簡重構**：Window Layouts Modal `+ 新視窗` 按鈕、Tasks 齒輪 ⚙️ 排序選單、項目向下箭頭 `∨` 下拉選單 (Auto-save, Rename, Edit, Delete, Archive)。
- **動態幾分之幾進度 Notice**：Restore 過程中呈現實時進度（例如 `🔄 正在復原空間... (2/5)`）。
- **底層優化與安全防呆**：
  - 旁觀 Popout 視窗 Virtual DOM 記憶體引用微創保護（消弭 90% 視窗閃爍抖動）。
  - Auto-Save 0 檔案覆寫動態攔截與 `lastValidSnapshots` 備份退回保護。
  - Save Modal 動態繼承與連動 `autoSave` 及 `includeGeometry` 狀態。
  - 視窗幾何屬性精簡合併為單一「包含視窗位置與大小」選項。
  - `createdAt` 與 `updatedAt` 獨立時間戳記錄（複製另存時重置 B 的建立時間）。
  - 實時多源動態 i18n 語系檢測（`zh-TW`, `zh-CN`, `en` 切換零延遲）。
  - 已開啟佈局智慧 Focus 切換與 `🟢 視窗開啟中` 狀態感知。
  - 跨視窗與 Sidebar Panel 即時自動廣播重繪與同步。
  - 全站術語大統一（`Window Spaces` 標題 / `Space (空間)` 操作）。
  - Space list 組織性增強（Tag-Pills 編輯、拖曳重排 Section、雙擊內聯改名 Section、👁️ 顯示選項選單、📦 封存獨立分組）。
  - Panel toolbar 統一（Sidebar / Editor Tab 共用原生 `nav-header` 結構，與 File Explorer 對齊）。

---

## P3：Obsidian Community Plugin Store 上架準備

### UX-015 Community Plugin Store 上架發布

- [x] **目標**：完成所有上架合規要求，提交 PR 至 `obsidianmd/obsidian-releases` 並順利於 Community Plugin Store 上架。
- **已完成工作 (本地端與儲存庫準備)**：
  - [x] **中頭資料更新**：更新 `manifest.json` 與 `package.json` 的 `author`、`authorUrl` 與 `description` SEO 關鍵字
  - [x] **授權文件**：根目錄創建標準 MIT `LICENSE` 檔案 (Copyright (c) 2026)
  - [x] **文件多語系化**：擴充 `README.md` 包含 9 國語言說明與英文審核主文件
  - [x] **代碼修飾與驗證**：清理 4 個 ESLint warnings (`npm run lint` 達 0 errors, 0 warnings)，`npm run build` 與 `npm test` 31 項測試全數通過
- **待執行工作 (GitHub 平台與 PR 提交)**：
  - [ ] **GitHub Release**：創建 `1.0.0` Tag 並上傳 `manifest.json`, `main.js`, `styles.css` Assets
  - [ ] **PR 提交**：Fork `obsidianmd/obsidian-releases` 並更新 `community-plugins.json` 發起 PR
- **落成文件**：[doc/STORE_SUBMISSION_CHECKLIST.md](file:///D:/GitDev/ObsidianWindowSpaces/doc/STORE_SUBMISSION_CHECKLIST.md)

---

## P4：未來擴充功能 (Future Enhancements)

### UX-021 清單自訂拖拽排序 (Custom Layout Reordering)

- [ ] **目標**：允許使用者在 Window Layouts 視窗中透過拖拽 (Drag & Drop) 或上下按鈕手動調整 Layout 顯示順序。
- **說明**：目前清單支援 6 大動態排序維度 (`updated-desc`, `updated-asc`, `created-desc`, `created-asc`, `name-asc`, `name-desc`)。未來可增加 `custom` 自訂排序維度與拖拽手勢支援。
- **主要檔案**：`src/modals/restoreModal.ts`, `src/types.ts`, `styles.css`

---

## 部署紀錄

- **測試庫 (Test Vault)**：`E:\vaults\test-vault\.obsidian\plugins\obsidian-window-spaces` (✅ 已同步發布)
- **正式庫 (Note Vault)**：`E:\vaults\Note\.obsidian\plugins\obsidian-window-spaces` (✅ 已同步發布)

## 交付規則

每次 Agent 處理本清單項目時，應在 PR/commit 或工作紀錄中提供：

1. 執行的 TODO 編號。
2. 修改的檔案。
3. 使用者可觀察到的行為變化。
4. 驗收步驟與結果。
5. 若未完成，留下阻塞原因與下一步。

## 建議執行順序

`UX-001` → `UX-002` → `UX-003` → `UX-004` → `UX-005` → `UX-007` → `UX-011` → `UX-012` → `UX-014` → `UX-015`
