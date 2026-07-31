# Window Spaces - Obsidian 外掛

為 Obsidian 彈出視窗（Popout Window）保存與還原視窗佈局。以高效能與零 DOM 抖動，無縫管理多視窗工作區。

---

## 🌐 Language / 語言

[ English ](README.md) | [ 繁體中文 ](README.zh-TW.md) | [ 简体中文 ](README.zh-CN.md)

---

### 💡 為什麼選擇 Window Spaces？（與原生 Workspaces 比較）

Obsidian 原生內建的 **Workspaces** 外掛是針對 **「全域應用程式狀態」** 設計的——只要還原一個 Workspace，就會 **強制覆蓋整個 Obsidian 介面**（關閉目前所有浮動視窗，替換主視窗與左右側邊欄）。

而 **Window Spaces** 是專為 **「單一彈出視窗 (Popout Window)」** 打造的靈魂外掛：
- 🎯 **零干擾主視窗**：僅捕捉與還原指定 Popout 視窗內的狀態，完全不影響主視窗與側邊欄工作流。
- 🖥️ **多螢幕工作者救星**：可以在副螢幕、第二視窗中隨心放置參考文獻、Kanban 面板或任務筆記，隨時獨立切換佈局。
- 🚀 **彈性開新視窗**：一般點擊佈局（或按 `Enter`）即可隨時將任何保存好的 Space 在「全新 Popout 視窗」中開啟。
- 🔄 **Per-Layout 獨立自動保存**：針對特定佈局獨立開啟 🔄 自動儲存，享 5 秒靜默 Debounce 與關閉視窗實時快照。

| 功能項目 | 🏛️ Obsidian 原生 Workspaces | 🪟 Window Spaces (本外掛) |
| :--- | :--- | :--- |
| **作用範圍 (Scope)** | **全域 (Global)**：干擾並覆蓋主視窗與側邊欄 | **視窗級 (Window-Scoped)**：僅作用於單一彈出視窗，零干擾主視窗 |
| **多螢幕支援 (Multi-Monitor)** | ❌ 差。還原時會強制破壞所有螢幕佈局 | ✅ 極佳。各螢幕獨立視窗可保有專屬 Space 佈局 |
| **開新視窗還原 (Spawn New)** | ❌ 無法。永遠強行覆蓋當前視窗組合 | ✅ **一般點擊或按 `Enter` 即可在全新獨立視窗開啟** |
| **自動保存 (Auto-Save)** | ❌ 全域手動儲存或粗暴覆寫 | ✅ **Per-layout 🔄 獨立自動儲存** (5秒 Debounce) |
| **智慧命名 (Smart Naming)** | ❌ 僅能手動輸入名稱 | ✅ **Pinned 優先智慧命名** (`釘選筆記 & 焦點筆記`) |
| **懸停預覽 (Hover Preview)** | ❌ 無內容預覽 | ✅ **Hover Tooltip 檔案清單懸停預覽** |
| **缺失檔案保護 (Missing Files)** | ❌ 檔案刪除/改名時分頁崩塌 | ✅ **原生空 Tab 結構保持**，不破壞版面 |

### ✨ 核心功能
- **Popout 視窗完整捕捉**：精確保存分割區塊、Tab 頁面、焦點筆記、編輯模式與視窗幾何座標。
- **Pinned 優先智慧命名**：自動優先擷取釘選筆記 (`pinned: true`) 與焦點筆記生成直覺名稱。
- **情境感知還原 (Context-Aware)**：一般點擊（或按 `Enter`）會在全新獨立視窗中開啟；按住 `Shift`（或 `Shift + Enter`）則套用至目前 active Popout 視窗。若某個 Space 已在 Popout 視窗中開啟，再次還原時會直接聚焦該視窗，不會產生重複視窗。
- **Per-Layout 獨立自動保存**：針對特定佈局開啟 🔄 自動儲存，具備 5 秒 Debounce 靜默更新與視窗關閉實時快照。
- **整合式快速切換與管理視窗**：即時搜尋、Hover 檔案清單懸停預覽、⚙️ 6 維度排序選單、重命名與刪除。可開啟為彈出視窗（標題列具備相同工具列）、編輯區面板或側邊欄面板。
- **原生安全防護與邊界校正**：自動防止螢幕組態變更導致視窗失蹤，並阻絕 0 檔案空白佈局覆寫。

### 🖼️ 畫面截圖

| 多視窗工作區 | 彈出視窗 | 側邊欄面板 |
| :---: | :---: | :---: |
| ![多視窗工作區](screenshots/multi-workspaces.png) | ![彈出視窗](screenshots/popup.png) | ![側邊欄面板](screenshots/sidebar.png) |

### 📥 安裝說明

#### 社群外掛商店安裝 (推薦，申請中)
1. 開啟 Obsidian **設定** > **社群外掛**。
2. 搜尋 **Window Spaces**。
3. 點擊 **安裝** 並啟用外掛。

#### 手動安裝
1. 至 GitHub Release 下載最新的 `main.js`、`styles.css` 與 `manifest.json`。
2. 複製至 `<你的 Vault>/.obsidian/plugins/window-spaces/`。
3. 重新載入 Obsidian 並於設定中啟用。

### 🚀 使用指南

#### 1. 保存當前視窗佈局
- 在彈出視窗中開啟命令面板 (`Ctrl/Cmd + P`)。
- 搜尋並執行 `Window Spaces: 儲存目前空間`。
- 使用預設智慧名稱或自行輸入名稱後按 `Enter`。

#### 2. 開啟視窗佈局
- 執行 `Window Spaces: 開啟為彈出視窗` 以彈出視窗開啟，`開啟為標籤面板` 以主工作區分頁開啟，或 `開啟在左側邊欄` / `開啟在右側邊欄` 停靠於側邊欄。
- 在清單中直接點擊佈局，或按 `Enter`，會在新的 Popout 視窗套用佈局。
- 按住 `Shift` 點擊佈局，或按 `Shift + Enter`，會套用至目前 active 的 Popout 視窗。
- 若某個 Space 已在 Popout 視窗中開啟，再次還原時會直接聚焦該視窗，不會產生重複視窗。
- 透過下拉選單 (∨) 切換自動保存、重命名、編輯或刪除佈局，並可用面板選單移動選擇器至其他位置。
- 下方「[使用案例與工作流](#使用案例與工作流)」提供專案、研究、Canvas、Tasks、寫作、會議與開發工作區完整示例。

### 🚀 使用案例與工作流

把每個已儲存的 Space 視為可重複召回的 **「工作艙」(Work Cabin)**，用於專案、研究主題、工作階段或週期性流程：

- **基本模式**：左側釘選導航視圖（Base、Canvas 或 Tasks），右側放置正在處理的檔案；釘選導航視圖後，點擊檔案不會替換導航視圖。以專案或流程名稱保存此配置。
- **專案控制中心** (`Project — Map & Workbench`)：左側為釘選的 Base 地圖，右側為專案首頁、規格與會議紀錄。
- **研究文獻工作艙** (`Research — Literature Review`)：左側為文獻 Base，右側為閱讀筆記與待解決的研究問題。
- **Canvas 視覺規劃** (`Planning — Canvas & Notes`)：左側 Canvas 掌握整體關係與概念地圖，右側編輯規格與決策文件。
- **Tasks 週期管理** (`Weekly Review — Tasks & Notes`、`Daily Focus`)：左側為 Tasks 查詢（今日、逾期或本週任務），右側為日記、週回顧與任務來源文件。
- **寫作與內容製作** (`Writing — Draft & References`)：左側為內容 Base，中間為目前草稿，右側為參考資料與編輯檢查清單。
- **會議與決策** (`Meeting — Agenda & Actions`)：左側為會議 Base 與議程，右側為會議紀錄，另設 Tasks 分割區追蹤後續行動項目。
- **軟體開發** (`Dev — Issue Triage`、`Dev — Implementation`、`Dev — Code Review`、`Dev — Release`)：左側為 Issue / Feature Base，右側為技術規格、實作筆記與測試紀錄。

保存後，單擊（或按 `Enter`）即可在全新 Popout 視窗還原整個工作艙；按住 `Shift` 點擊（或按 `Shift + Enter`）則套用至目前 active 的 Popout 視窗。

### ⌨️ 鍵盤操作
- 外掛沒有預設指令快捷鍵；可在 Obsidian 快捷鍵設定中自行為 `開啟為彈出視窗`（或標籤面板 / 側邊欄指令）指定快捷鍵。
- 清單中按 `Enter` 會在新 Popout 還原，按 `Shift + Enter` 會在目前 active Popout 還原。

### 💻 相容性
- **Obsidian 版本**: `v0.15.0+`
- **支援平台**: 僅限桌面版 (Windows, macOS, Linux)
