# Window Spaces 使用案例與工作流

Window Spaces 的核心概念不是單純保存視窗大小，而是把每個 Obsidian Popout Window 變成一個可隨時召回的「主題工作艙」。

每個工作艙可以代表一個專案、研究主題、工作階段或固定流程。使用者只需要先整理好視窗結構，之後即可從 `Window Spaces: Open window layouts` 重新開啟同一個工作環境。

## 基本工作艙模式

最推薦的基本結構是：

- 左側固定一個導航或索引視圖，例如 Base、Embedded Base 或 Canvas。
- 右側分割閱讀、編輯、參考資料或任務視圖。
- 將導航視圖 pin 住，避免點擊檔案時被替換。
- 以專案或流程命名並保存 layout。

在 layout 清單中：

- 一般點擊或按 `Enter`：在新的 Popout Window restore。
- 按住 `Shift` 點擊或按 `Shift + Enter`：將 layout restore 至目前的 active Popout Window。
- 每個 layout 的下拉選單可執行 Auto-save、Rename、Edit 與 Delete。

## 1. Base 專案控制中心

### 適用情境

以一個 Obsidian Base 或 Embedded Base 作為專案檔案地圖，集中處理同一個專案的文件、決策、任務與參考資料。

### 建議配置

- 左側：釘選的 Project Base，顯示檔案狀態、類型、標籤或最後修改時間。
- 右側：專案首頁、規格文件或目前正在處理的筆記。
- 右側其他分頁：會議紀錄、決策紀錄與參考資料。

### 工作流

1. 從 Base 篩選目前專案或「進行中」文件。
2. 點擊 Base 中的檔案，讓內容在右側工作區開啟。
3. 保留 Base 在左側作為穩定的導航地圖。
4. 完成配置後保存為 `Project Alpha — Map & Workbench`。
5. 每次回到專案時 restore 這個 layout，立即恢復專案上下文。

## 2. 研究文獻工作艙

### 適用情境

適合研究主題、論文閱讀、資料整理與長期知識累積。

### 建議配置

- 左側：Literature Base，顯示閱讀狀態、作者、年份、主題與引用狀態。
- 右側：文獻筆記或 PDF 閱讀筆記。
- 右側另一分割：研究問題、摘要或引用整理。

### 工作流

1. 從 Base 篩選「未閱讀」、「本週新增」或特定研究問題的資料。
2. 點擊文獻後在右側閱讀與記錄摘要。
3. 將研究問題與暫時結論維持在另一個分割區。
4. 保存為 `Research — Literature Review`。
5. 下次以同一 layout 回到研究主題，而不必重新整理檔案與分割區。

## 3. Canvas 視覺規劃工作艙

### 適用情境

適合軟體架構、文章大綱、商業企劃、課程設計與複雜問題拆解。

### 建議配置

- 左側：Canvas，負責顯示整體關係與概念地圖。
- 右側：目前深入處理的筆記、規格或決策文件。
- 右側另一分割：Tasks、待確認事項或參考資料。

### 工作流

1. 在 Canvas 上確認整體結構與待處理節點。
2. 點選或開啟目前節點對應的筆記。
3. 在右側完成深入編輯，左側保留全局視角。
4. 保存為 `Planning — Canvas & Notes`。

這種配置讓 Canvas 負責「看全局」，右側文件負責「做深入處理」。

## 4. Tasks 週期管理工作艙

### 適用情境

適合每日工作、每週回顧、專案追蹤與跨專案任務整理。

### 建議配置

- 左側：Tasks 查詢，顯示今日、逾期或本週任務。
- 右側：Daily Note、週回顧或目前專案頁面。
- 右側另一分割：任務來源文件或執行中的工作筆記。

### 工作流

1. 從 Tasks 查詢選擇目前要處理的任務。
2. 在右側開啟任務來源文件，保留任務清單作為上下文。
3. 完成工作後更新任務狀態與工作紀錄。
4. 保存為 `Weekly Review — Tasks & Notes` 或 `Daily Focus`。

## 5. 寫作與內容製作工作艙

### 適用情境

適合文章、電子報、教學內容、影片腳本與長篇文件製作。

### 建議配置

- 左側：文章或內容 Base，顯示狀態、類型、截止日期與編輯階段。
- 右側：目前草稿。
- 右側另一分割：參考資料、素材或編輯檢查清單。

### 工作流

1. 從 Base 找到「撰寫中」或「待編輯」內容。
2. 在右側編寫草稿，另一分割保留參考資料。
3. 使用 Tasks 記錄需要補充的段落或待查證內容。
4. 保存為 `Writing — Draft & References`。
5. 可另外保存 `Writing — Review` 作為編輯階段的另一種 layout。

## 6. 會議與決策工作艙

### 適用情境

適合定期會議、專案同步、客戶訪談與決策追蹤。

### 建議配置

- 左側：會議或專案 Base，列出相關人員、日期、專案與前次會議。
- 右側：本次議程與會議紀錄。
- 右側另一分割：Tasks 或行動項目清單。

### 工作流

1. 從 Base 開啟前次紀錄與相關專案文件。
2. 在右側記錄本次決策與討論內容。
3. 將 follow-up 立即轉成 Tasks。
4. 保存為 `Meeting — Agenda & Actions`。
5. 會後重新 restore 同一 layout，追蹤行動項目完成情況。

## 7. 軟體開發工作艙

### 適用情境

適合需求分析、實作、Code Review、技術文件與版本發布。

### 建議配置

- 左側：Issue、Feature 或 Task Base。
- 右側：技術規格、API 文件或實作筆記。
- 右側另一分割：測試紀錄、決策紀錄或 changelog。

### 建議保存的 layout

- `Dev — Issue Triage`
- `Dev — Implementation`
- `Dev — Code Review`
- `Dev — Release`

同一批檔案可以依照工作階段切換不同視窗結構，而不必每次重新打開文件與排列分割區。

## Layout 命名建議

建議使用「主題 — 工作階段」格式：

- `Project Alpha — Control Tower`
- `Research — Literature Review`
- `Writing — Draft & References`
- `Weekly Review — Tasks & Notes`
- `Dev — Code Review`

如果同一主題有多種工作方式，可以保存多個 layout；例如 `Project Alpha — Planning`、`Project Alpha — Execution` 與 `Project Alpha — Review`。

## 建議使用原則

- 將穩定的導航視圖 pin 住，例如 Base 或 Canvas。
- 一個 Popout 專注一個主題或一個工作階段，避免混合不相關內容。
- 對會持續變動的工作艙開啟 Auto-save。
- 對重要但不常變動的 layout 手動保存，避免自動更新覆蓋預期狀態。
- 使用一般 Enter 建立平行工作艙，使用 Shift+Enter 在目前視窗切換。
