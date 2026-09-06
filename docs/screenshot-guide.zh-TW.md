# Window Spaces 視覺展示截圖規劃與拍攝指南

本文件為 **Window Spaces**（`obsidian-window-spaces`）的官方視覺展示資產規劃指南。用於指引開發者與社群維護者拍攝、製作與更新外掛在 GitHub README、Obsidian 社群外掛市場（Community Plugins Store）及使用者手冊中的標準化截圖與展示圖。

---

## 🎨 視覺風格規範（Design & Style Guide）

為確保視覺展示呈現頂級開源專案的專業質感與一致性，所有展示截圖必須遵守以下規範：

| 項目 | 規範標準 | 說明 |
| :--- | :--- | :--- |
| **主題外觀** | Obsidian 官方預設 Dark Theme | 採用官方深色主題（Default Dark），確保在不同螢幕與社群商店中對比清晰 |
| **介面縮放** | 100%（標準縮放，避免過大或過小） | 若在高 DPI 螢幕（如 4K 或 Retina）拍攝，請輸出 2x 原生解析度以保持字型銳利 |
| **視窗外框** | 保留作業系統原生視窗陰影或乾淨直角 | 截圖四周建議保留適當邊界（Padding 16~24px），可搭配半透明暗色背景襯托 |
| **主題色呈現** | 醒目且和諧的預設色系 | 建議使用外掛內建的顏色預設集：<br>• 專案艙：**翠綠色（#10B981）** 或 **蔚藍色（#3B82F6）**<br>• 研究艙：**紫羅蘭（#8B5CF6）**<br>• 寫作艙：**琥珀橘（#F59E0B）** |
| **範例資料** | 專業、乾淨的展示用知識庫範例 | **嚴格禁止**露出個人隱私、個人日記或雜亂真實筆記。統一使用中性專業範例（如：`Apollo Project`、`Quantum Computing Review`、`Design System Specs`） |
| **協同外掛** | 搭配官方核心外掛與 Folder Spaces | 善用 Canvas、Markdown 雙欄分割，並**在側邊欄啟用 Folder Spaces Explorer** 突顯子目錄脈絡聚焦 |

---

## 📸 6 大核心展示截圖清單與場景拆解

```
assets/screenshots/
├── 01-hero-showcase.png            # [Hero] 多螢幕/多視窗工作站全景（旗艦展示大圖）
├── 02-folder-scoped-cabin.png      # [特色] Folder Spaces 協同：子目錄脈絡專屬工作艙
├── 03-popout-activity-bar.png      # [核心] Popout 原生活動列與側邊欄折疊特寫
├── 04-settings-activity-bar.png    # [設定] 設定頁活動列拖曳排序與視圖管理
├── 05-space-appearance-modal.png   # [管理] 空間設定對話框（邊框色、Logo、折角、獨立 Auto-Save）
└── 06-unified-panels.png           # [介面] 3+1 原生管理面板（側欄、分頁標籤、快捷浮動視窗）
```

---

### 1. `01-hero-showcase.png` —— 旗艦全景工作站展示（Hero Showcase）
* **定位**：README 最頂端的視覺錨點，3 秒內震撼讀者，傳遞「將陽春 Popout 升級為高階獨立工作站」的價值。
* **場景構圖（1920 × 1080 或 16:9）**：
  * **背景中央偏後**：Obsidian 主視窗（純粹作為總覽，可顯示簡潔的儀表板或首頁）。
  * **前景左視窗（Apollo 專案艙）**：
    * 帶有 **翠綠色（Emerald Green）沉浸式 4 邊邊框** 與左上角折頁。
    * 左側開啟 Popout 側邊欄，展示 **Folder Spaces Explorer**（鎖定在 `/Projects/Apollo/`）。
    * 中央分割：左側釘選 `apollo-roadmap.canvas` 白板，右側為 `apollo-specs.md` 筆記。
    * 左下角狀態列徽章：`🚀 Apollo Project [Auto-Save 🔄]`。
  * **前景右視窗（量子計算研究艙）**：
    * 帶有 **紫羅蘭（Violet Purple）4 邊邊框** 與紫色折頁。
    * 左側開啟 Popout 活動列（Outline 大綱），中央為 PDF 閱讀器與雙鏈筆記。
* **視覺焦點**：色彩豐富的視窗邊框、獨立活動列、雙層語境隔離（子目錄檔案樹 + 畫布）。

---

### 2. `02-folder-scoped-cabin.png` —— Folder Spaces 協同特寫（子目錄聚焦艙）
* **定位**：專門展示 **Window Spaces + Folder Spaces** 的「雙層語境隔離（Double Context Isolation）」旗艦工作流。
* **場景構圖（單一 Popout 彈出式視窗特寫，建議 1400 × 900）**：
  * **視窗外框**：蔚藍色（Electric Blue）邊框，左上角折頁裝飾。
  * **左側 Popout 活動列與側欄**：
    * 活動列中高亮顯示 Folder Space 圖示。
    * 展開的側邊欄為 **Folder Space Explorer**，根目錄標籤顯示為 `📁 /Projects/WindowSpaces/`。
    * 檔案清單僅呈現乾淨的 4~5 個專案文件（如 `architecture.md`、`release-plan.canvas`、`tasks.md`），無其他雜項目錄。
  * **中央編輯區**：
    * 雙欄分割：左側為 Canvas 白板，右側為正在編輯的 `architecture.md`。
  * **推薦視覺標註（Callouts）**：
    * 標註 1（指向側欄）：*"Folder Spaces Explorer — Scoped strictly to project directory"*
    * 標註 2（指向中央編輯區）：*"Smart Leaf Routing — Clicking files opens cleanly in center"*
    * 標註 3（指向視窗邊緣）：*"Accent Theme Frame — Instant visual recognition"*

---

### 3. `03-popout-activity-bar.png` —— Popout 活動列與側邊欄折疊特寫
* **定位**：展示 Obsidian 官方原生 Popout 彈出式視窗做不到的「完整活動列與側欄容器」。
* **場景構圖（單一 Popout 彈出式視窗，建議 1200 × 800）**：
  * **左側垂直活動列**：
    * 最上方：側邊欄摺疊/展開按鈕（Toggle Sidebar Button）。
    * 下方按鈕清單：檔案清單（File Explorer）、書籤（Bookmarks）、大綱（Outline）、搜尋（Search）。
    * 拖曳移動手柄（Window Drag Handle）。
  * **分割線微光**：窗格分隔線帶有主題色微光（Popout Accent Splitter Glow）。
  * **操作動態感**：滑鼠游標停留在活動列按鈕上，呈現 native hover 效果。

---

### 4. `04-settings-activity-bar.png` —— 設定頁活動列拖曳自訂
* **定位**：展示外掛在設定頁中對 Popout 側欄的極致客製化能力。
* **場景構圖（設定頁視圖特寫，建議 900 × 650）**：
  * 開啟外掛設定分頁中的「Popout 彈出式視窗 View 設定」。
  * 呈現「從主視窗側欄匯入」按鈕。
  * 左右側 Activity Bar View 清單中，展示 **拖曳排序手柄（Drag-to-Reorder）**、動態探索圖示與新增按鈕。

---

### 5. `05-space-appearance-modal.png` —— 空間設定與外觀自訂對話框
* **定位**：呈現外掛豐富且直覺的視覺客製化功能。
* **場景構圖（居中 Modal 對話框特寫，建議 720 × 750）**：
  * 開啟「空間設定（Save/Edit Space）」對話框：
    * **空間名稱**：`🚀 Apollo Project`
    * **空間 Logo**：展示 Emoji / Lucide 圖示選擇器
    * **視窗邊框顏色**：展示圓形快捷調色盤（Color Presets）選中綠色
    * **邊框 Inset 厚度**：`2px`
    * **左上角折頁裝飾**：Toggle 切換開啟
    * **獨立自動儲存（Auto-Save）**：Toggle 切換開啟
    * **Activity Bars 設定**：顯示左側/右側活動列個別控制選項

---

### 6. `06-unified-panels.png` —— 3+1 原生管理面板三合一
* **定位**：證明外掛高度融入 Obsidian 原生架構，支援多種使用習慣。
* **場景構圖（三聯拼圖或並列比較，寬度 1600px）**：
  * **左圖（側邊欄模式）**：停靠於左側邊欄，展示 Section 分組（如 `📌 Active Projects`、`📦 Archived`）、未分類、快速搜尋。
  * **中圖（編輯區標籤頁模式）**：在中央主編輯區以獨立 Tab 展開，大螢幕綜覽與批次管理。
  * **右圖（快速浮動視窗模式）**：透過快捷鍵呼出的輕量 Modal，鍵盤高亮選中項目，底部顯示快速導航按鍵提示（`Enter` 新開 / `Shift+Enter` 套用）。

---

## 🛠️ 拍攝前準備環境與 Checklist

1. **建立乾淨的展示 Vault（或於 `quartz-vault` 中建立隔離展示資料夾）**：
   - 建立資料夾：`Projects/Apollo/`、`Research/Quantum-Computing/`、`Writing/Essays/`。
   - 準備 1 份展示用 Canvas（`apollo-roadmap.canvas`），內含 3~4 張彩色卡片與連接線。
   - 準備 2~3 篇具排版格式的 Markdown 筆記（含標題、引言、清單與雙向連結）。
2. **安裝外掛**：
   - 確認已啟用最新版 **Window Spaces**（`v1.2.1+`）。
   - 確認已啟用 **Folder Spaces**。
3. **建立示範 Spaces**：
   - `🚀 Apollo Project`：設定綠色邊框，左側嵌入 Folder Space Explorer（鎖定 `/Projects/Apollo/`），中央開 Canvas。
   - `🧠 Deep Research`：設定紫色邊框，左側開 Outline，中央開雙鏈筆記。
   - `✍️ Focus Writing`：設定琥珀橘邊框，純淨 Markdown 編輯區。
4. **輸出檢查**：
   - 檔案格式：PNG（無失真壓縮，建議使用 `tinypng` 或 `oxipng` 最佳化大小）。
   - 存檔路徑：存入專案目錄 [assets/screenshots/](file:///D:/GitDev/obsidian-plugins/WindowSpaces/assets/screenshots/)。
