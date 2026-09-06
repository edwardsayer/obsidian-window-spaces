# Window Spaces — Obsidian 視窗工作空間管理外掛

<div align="center">

> **解放擁擠的主視窗。將重量級外掛與多元工作流，無痛遷移至獨立、專注的 Popout 彈出式視窗工作艙。**  
> *獨立視窗佈局 · Popout 原生活動列 · Folder Spaces 協同 · 主題邊框與視覺標識*

[![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=7C3AED&label=Downloads&query=%24%5B%27window-spaces%27%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)](https://obsidian.md/plugins?id=window-spaces)
[![GitHub Release](https://img.shields.io/github/v/release/edwardsayer/obsidian-window-spaces?color=blue&logo=github)](https://github.com/edwardsayer/obsidian-window-spaces/releases)
[![Obsidian Compatibility](https://img.shields.io/badge/Obsidian-v1.12.7%2B-purple.svg?logo=obsidian)](https://obsidian.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[ English ](README.md) | [ 繁體中文 ](README.zh-TW.md) | [ 简体中文 ](README.zh-CN.md)

---

</div>

## 💡 設計哲學：為你的「萬物筆記庫」打造無干擾的專注工作艙

Obsidian 靈活的佈局與強大的外掛生態，讓許多人將其視為終極的**「Everything Notebook（萬物筆記庫）」**。然而，隨著筆記庫日益龐大與各類實用外掛的加入，主視窗往往變得無比擁擠：

- 🗂️ **擁擠不堪的主視窗**：Canvas 畫布、Excalidraw 繪圖、Dataview 查詢儀表板、關係圖譜與多欄分割筆記，都在爭奪同一個主視窗的有限空間。
- ⚡ **繁重的語境切換成本**：在專案規劃、深度文獻研究、日常任務審查之間切換時，必須頻繁打亂原有分頁與側邊欄排版。
- 🖥️ **未被充分發揮的多螢幕優勢**：在多螢幕或大螢幕環境下，缺乏一套能將不同視窗的獨立佈局各自持久保存與快速切換的機制。

**Window Spaces** 作為 Obsidian 的自然、無縫擴展而生。它不是要取代現有佈局，而是透過**焦點攔截技術**、**Popout 專屬活動列引擎**與 **Per-Window 獨立視窗佈局生命週期控管**，讓各類重量級外掛與複合筆記分割，無痛遷移至獨立的 **Popout 彈出式視窗工作艙（Spaces）**。

主視窗保持簡潔乾淨，不同任務在各自的獨立視窗中自由協作、互不干擾。

---

## ⚖️ Obsidian 原生 Workspaces vs. Window Spaces

| 比較維度 | Obsidian 原生 Workspaces | Window Spaces |
| :--- | :---: | :---: |
| **排版控管範圍** | 全域覆蓋（連同主視窗全部替換） | **Per-Window（獨立管理每一個 Popout 彈出式視窗）** |
| **Popout 側邊欄與活動列** | ❌ 無（僅為陽春分頁視窗） | **✅ 完整原生級左右垂直活動列與折疊側邊欄** |
| **視窗視覺識別** | ❌ 所有視窗外觀一致無區別 | **✅ 4 邊沉浸式主題邊框、自訂 Logo 與狀態列徽章** |
| **目錄脈絡隔離** | ❌ 顯示全庫上萬篇雜亂檔案樹 | **✅ 深度整合 [Folder Spaces](https://github.com/edwardsayer/obsidian-folder-spaces) 鎖定特定子目錄** |
| **自動儲存粒度** | 僅支援手動儲存快照 | **✅ 獨立 Per-Space Auto-Save（5 秒防抖 + 關閉即存）** |
| **多螢幕幾何座標** | 多 DPI 環境易位移跑位 | **✅ 像素級精確還原座標，內建螢幕拔除防溢出保護** |
| **視窗鎖定與路由隔離** | 無，主視窗／彈出式視窗的檔案分頁與功能檢視互相影響 | **✅ 視窗鎖定路由技術：開檔智慧導向中央區；內建（Outline / Backlinks）與社群 View（如 Grid Explorer）多實體獨立共存、互不干擾** |

---

## 🖼️ 介面預覽

| 🗺️ 獨立 Popout 彈出式視窗工作艙 | 🗂️ 側邊欄原生管理面板 |
| :---: | :---: |
| ![獨立 Popout 工作艙](assets/screenshots/multi-workspaces.png) | ![側邊欄面板](assets/screenshots/sidebar.png) |
| *Canvas 視覺畫布 + Markdown 雙欄分割與狀態列識別* | *整合式 Spaces 選擇器、啟用狀態提示與快速搜尋* |

| 📑 編輯區標籤頁管理模式 | ⚡ 快速彈出對話框 |
| :---: | :---: |
| ![標籤頁管理模式](assets/screenshots/tab-panel.png) | ![快速彈出對話框](assets/screenshots/popup.png) |
| *在主編輯區分頁中進行完整工作空間管理與檢視* | *輕量級浮動切換視窗，支援全鍵盤高速瀏覽* |

> 📷 *如需查看規劃中的全新視覺資產（包含 Popout 活動列、側欄折疊與主題邊框），請參閱 [視覺展示截圖規劃指南](docs/screenshot-guide.zh-TW.md)。*

---

## ✨ 核心特色與近期重磅亮點

### 🪟 1. Popout 彈出式視窗專屬活動列與雙側欄引擎 *(v1.1+ 重磅)*
Obsidian 原生 Popout 彈出式視窗完全沒有側邊欄。Window Spaces 為彈出式視窗注入了**原生級左右垂直活動列（Activity Bar）與折疊側邊欄容器**：
- **可折疊雙側欄**：透過頂部原生風格工具列按鈕或快捷鍵，自由展開/收合左右側邊欄。
- **動態視圖探索**：直接在 Popout 側欄嵌入 File Explorer、Bookmarks（書籤）、Outline（大綱）、Search（搜尋）或第三方外掛視圖。
- **設定頁拖曳排序**：在外掛設定中透過直覺的拖曳手柄（Drag-to-Reorder）自訂按鈕順序。
- **一鍵側欄同步**：支援從主視窗側邊欄一鍵匯入常用視圖配置。

### 🚀 2. 深度生態協同：與 Folder Spaces 聯手打造子目錄聚焦工作艙
將 Window Spaces 與姊妹外掛 **[Folder Spaces](https://github.com/edwardsayer/obsidian-folder-spaces)** 搭配，實現極致的**「雙層語境隔離（Double Context Isolation）」**：
- **視窗層級隔離**：Window Spaces 管理獨立 Popout 彈出式視窗生命週期、多螢幕座標、Popout 活動列與主題邊框。
- **目錄脈絡鎖定**：在 Popout 側邊欄中直接停靠 `Folder Space Explorer`，將檔案樹嚴格鎖定於指定專案子目錄（例如 `Projects/Apollo/`）。
- **智慧開檔路由**：在限定目錄樹中點選筆記，Window Spaces 自動攔截並於中央編輯區開啟，永不打亂側欄排版。
- **專案微型庫（Micro-Vault）**：打造宛如為該專案獨立開啟的專屬 IDE，徹底告別全庫雜訊。

### 🎨 3. 沉浸式視窗主題邊框與標識 *(v1.1+ 核心)*
多螢幕視窗堆疊時，再也不會迷失焦點：
- **4 邊沉浸式邊框（Accent Perimeter Frame）**：以該 Space 的專屬主題色繪製視窗邊框（視窗最大化時自動隱藏，保持極致全螢幕體驗）。
- **自訂 Logo 與折頁裝飾**：自由設定專屬 Emoji 或 Lucide 圖示，搭配左上角折頁（Corner Fold）視覺點綴。
- **狀態列空間徽章**：於 Popout 左下角即時顯示目前空間名稱與快速存檔狀態。
- **氛圍增強**：窗格調整分隔條帶有主題色微光，左右活動列注入柔和底色。

### 🎯 4. 視窗鎖定路由與多實體視圖隔離（Window-Locked Routing & View Isolation）*(v1.2+ 核心技術)*
Obsidian 原生架構以單一主視窗為中心，當在彈出式視窗中開啟 Outline、Backlinks 或第三方外掛檢視（如 Grid Explorer、Notebook Navigator）時，往往會因為全域檢索（`getLeavesOfType`）而跳回主視窗、搶奪焦點或互相覆蓋。Window Spaces 深度研發了**視窗鎖定路由與 Leaf 攔截技術（Window-Locked Routing）**：
- **內建與社群 View 多實體獨立共存**：突破官方單例限制，讓原生核心視圖（Outline 大綱、Backlinks 反向連結、Tags 標籤、Search 搜尋）與社群外掛視圖（如 Grid Explorer、Notebook Navigator 等）在主視窗與多個彈出式視窗中**同時存在多個獨立實體（Multi-Instance Concurrency）**，各自運作、永不搶焦。
- **事件廣播與作用檔案視窗感知**：精確攔截 `file-open` 事件傳遞與 `workspace.getActiveFile()`。視窗 A 的大綱與反鏈只追蹤視窗 A 當前閱讀的筆記，視窗 B 只追蹤視窗 B，徹底解決官方跨視窗連動錯亂與畫面跳動的陳年痛點。
- **中央編輯區智慧開檔**：從側邊欄點選檔案，永遠智慧導向至該視窗的中央編輯區，新開分頁自動導向最後作用之內容窗格，不覆蓋側欄視圖。
- **版面邊界防崩塌**：分頁拖曳防護機制防止分頁在拖曳時誤入活動列而破壞結構；即便特定檔案被移動或更名，仍會以原生空白分頁佔位，保留精心設計的分欄比例。

### ⚡ 5. 零抖動還原與多螢幕記憶 *(v1.2+ 效能)*
- **Target-Only 局部協調**：還原或切換單一空間時，僅對目標視窗進行更新，絕不抖動或閃爍其他已開啟的視窗。
- **幾何座標預定位**：精準記住跨螢幕的視窗像素座標與尺寸。
- **螢幕溢出防護**：外接螢幕拔除時自動校正視窗座標，確保視窗永遠在可視範圍內生成。
- **啟動自動對齊**：Obsidian 重啟時自動重新配對既有彈出式視窗並還原空間名稱與外觀標記。

### 🔄 6. Per-Space 獨立自動儲存
- **無感背景同步**：可為特定 Space 開啟 `🔄 自動儲存`。工作過程中的分欄調整與開啟分頁，會在背景以 5 秒防抖自動更新，並在關閉視窗時立即快照存檔。
- **範本手動防護**：固定標準範本可關閉自動儲存，避免臨時微調污染範本結構。

### 🗂️ 7. 3+1 原生介面與 Section 分組管理
- **彈性停靠位置**：管理面板可自由停靠於**左側邊欄**、**右側邊欄**、**編輯區標籤頁（Tab）**，或透過 **Ribbon 圖示與快捷鍵** 呼叫快速浮動對話框。
- **Section 分組與封存**：支援將 Spaces 依照專案分類分組、拖曳排序、雙擊重新命名，並支援一鍵封存（`📦 封存空間`）。
- **懸停內容預覽**：游標懸停即可即時預覽該空間收錄的檔案清單與釘選結構。

---

## 🚀 典型工作空間場景（Space Workflows）

| 工作空間場景 | 佈局與外掛組合 | 核心優勢與適用情境 |
| :--- | :--- | :--- |
| 🚀 **Scoped Project Cabin**<br>*(Folder Spaces 協同)* | **Popout 側邊欄**：`Folder Space Explorer` 鎖定 `/Projects/Apollo/`<br>+ **中央編輯區**：釘選 Canvas 白板與規格筆記雙欄 | **零雜訊專案微型庫**：側欄僅展示該專案目錄下的檔案；開檔自動路由至中央編輯區，打造專案專屬 IDE。 |
| 🗺️ **Project Map & Workbench** | 左側釘選 Canvas 畫布 / 總覽 + 右側專案規格筆記 | 架構設計、里程碑規劃、交付項目即時追蹤。 |
| 🧠 **Deep Research & Literature** | Popout 活動列（Outline）+ 左側文獻閱讀/PDF + 右側雙鏈卡片筆記 | 沉浸式學術研讀、概念串聯與知識萃取。 |
| ✍️ **Focus Writing & Showcase** | 純淨 Markdown 編輯區 + 即時樣式預覽 | 長篇創作、技術專欄寫作、發布前校對排版。 |
| ⚙️ **Dev & System Maintenance** | Dataview 查詢表格 + 系統設定範本與清單 | 筆記庫定期維護、發行檢查清單、任務分流。 |

---

## 📥 安裝方式

### 從 Obsidian 社群外掛市場安裝（推薦）
1. 開啟 Obsidian **設定** > **社群外掛程式**。
2. 關閉「安全模式」，點擊「瀏覽」。
3. 搜尋 **Window Spaces**。
4. 點擊「安裝」，隨後點擊「啟用」。

### 手動安裝
1. 前往 [GitHub Releases](https://github.com/edwardsayer/obsidian-window-spaces/releases) 下載最新版的 `main.js`、`manifest.json` 與 `styles.css`。
2. 在您的 Vault 中建立目錄：`<vault>/.obsidian/plugins/window-spaces/`。
3. 將下載的 3 個檔案放入該目錄中。
4. 重新載入 Obsidian 並在「社群外掛程式」中啟用 **Window Spaces**。

---

## 🛠️ 快速上手

### 1. 建立並儲存你的第一個 Space
1. 建立一個新彈出式視窗（按 `Ctrl/Cmd + Shift + N` 或將任何標籤頁拖曳出來）。
2. 排版好你所需的分割視圖（例如：左側 Canvas、右側 Markdown 筆記，或展開側邊欄）。
3. 按 `Ctrl/Cmd + P` 開啟指令面板，執行 **`Window Spaces: Save current Space`**。
4. 輸入名稱，挑選專屬 Emoji/圖示與主題邊框顏色，並可開啟自動儲存。

### 2. 還原與管理 Space
- 透過左側 **Ribbon 圖示**、側邊欄或執行 **`Window Spaces: Open as popup window`** 開啟面板。
- **`點擊` 或 `Enter`**：立即在新彈出式視窗中開啟該 Space。
- **`Shift + 點擊` 或 `Shift + Enter`**：將該 Space 套用覆蓋至目前的彈出式視窗。
- 點擊右側選單（`...` 或右鍵）可隨時開啟 **自動儲存 🔄**、重新命名、編輯或刪除。

---

## ⌨️ 快捷鍵一覽

| 操作動作 | 快捷鍵 / 觸發方式 | 說明 |
| :--- | :--- | :--- |
| **開啟 Spaces 彈出式視窗** | 可於 Obsidian 快捷鍵設定 | 快速呼叫浮動切換與管理對話框 |
| **於新彈出式視窗開啟** | `Enter` / 單擊滑鼠左鍵 | 於獨立新視窗中還原選取的 Space |
| **套用至目前視窗** | `Shift + Enter` / `Shift + 單擊` | 將選取的 Space 載入至當前彈出式視窗 |
| **快速選取導航** | `↑` / `↓` 方向鍵 | 在 Spaces 清單中上下移動選取項目 |
| **關閉 / 離開** | `Escape` | 關閉對話框或退出搜尋焦點 |

---

## 🤝 大型社群外掛協同工作指南

Window Spaces 與社群中許多強大且佔空間的外掛（如 **Excalidraw**、**Excalibrain**、**Canvas**、**Dataview**、**Notebook Navigator** 等）能達成完美的視窗隔離協同效果。

詳細整合案例與多視窗工作流示範，請參閱：

📖 **[完整使用手冊與外掛協同工作指南](docs/user-guide.zh-TW.md)**

---

## 💻 系統相容性

- **Obsidian 版本需求**：`v1.12.7` 或以上
- **支援平台**：桌面端（Windows, macOS, Linux）
- **授權協議**：MIT License
