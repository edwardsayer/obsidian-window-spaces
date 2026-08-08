# Window Space Popout 視窗自訂 Icon/Emoji 與邊框顏色實作計畫 (Implementation Plan)

## 1. 需求與設計目標 (Overview & Goals)

為提升不同 Window Space Popout 視窗的視覺可識別性 (Visual Distinguishability)，本功能引進類似 VSCode (如 Peacock / Window Colors 外掛) 的視窗自訂視覺樣式機制：

1. **左上角 Drag Handle 圖示/Emoji**：在 Popout 視窗左側 Activity Bar 頂端的拖曳區塊中，呈現該 Space 的自訂 Icon 或 Emoji，並維持純視覺與全區塊拖曳視窗功能 (`-webkit-app-region: drag`)。
2. **彩色視窗邊框與強調線 (Border Frame & Accent Line)**：為 Popout 視窗套用 3px 醒目的彩色內邊框 (inset border/box-shadow)，並在頂端標題列/Activity Bar 邊緣加上同色強調線。
3. **視覺邊框與 Layout 隔離防護**：邊框繪製採用 CSS `box-shadow: inset 0 0 0 3px var(--window-space-color)` 或 `::after` 擬似元素覆蓋，不佔用任何 DOM 實體佈局空間 (0px layout impact)，確保頁籤與按鈕的物理對齊與邊距不受任何干擾。
4. **Activity Bar 底色一致性對齊**：Activity Bar 底色與 sidebar 區 tabbar / editor tab area tabbar 的 non-active 底色一致（對齊 Obsidian 原生 `var(--background-secondary)`）。
5. **全域與單一 Space 層級雙重支援**：
   - 全域設定 (`WindowSettings`)：設定預設 Icon 以及快捷主題調色盤 (`colorPresets`)。
   - 單一 Space 設定 (`WindowLayout`)：每個 Space 可獨立保存/覆寫專屬 `icon` 與 `color`。
6. **側欄中控台與 Quick Switcher 同步標示**：在側欄列表與 Quick Switcher (Restore Modal) 中，同步於每個 Space 項目左側顯示其 Icon/Emoji 與顏色圓點 (Color Badge)。

---

## 2. 資料結構與介面變更 (Data Models & Interfaces)

### 2.1 `src/types.ts`
```typescript
export interface WindowLayout {
  // ...既有欄位
  icon?: string;  // Lucide icon ID (如 "star") 或 Emoji 字元 (如 "🚀")
  color?: string; // CSS 顏色 Hex/HSL 字串 (如 "#3b82f6")
}

export interface WindowSettings {
  // ...既有欄位
  defaultIcon?: string;   // 全域預設圖示 (預設: "layout")
  colorPresets?: string[]; // 全域快捷主題色塊列表 (預設 7 色調色盤)
}
```

### 2.2 預設全域快捷色板 (Default Color Presets)
- 藍色 (Blue): `#3b82f6`
- 紫色 (Purple): `#8b5cf6`
- 翡翠綠 (Emerald): `#10b981`
- 琥珀黃 (Amber): `#f59e0b`
- 玫瑰紅 (Rose): `#f43f5e`
- 青色 (Cyan): `#06b6d4`
- 靛藍 (Indigo): `#6366f1`

---

## 3. Popout 視窗渲染機制 (Popout UI & CSS Rendering)

### 3.1 `src/popout/activityBar.ts`
- **拖曳區 Icon 渲染 (`.window-spaces-activity-drag`)**：
  - 在 `PopoutActivityBarManager.renderWindow` 中，取得該 Popout 視窗對應之 `WindowLayout` 的 `icon`（若無則使用全域 `defaultIcon`）。
  - 若為 Lucide icon ID（如 `star`），呼叫 `setIcon` 渲染 SVG。
  - 若為 Emoji 字元（如 `🚀`），建立文字節點或 `span.window-spaces-drag-emoji` 並居中呈現。
  - 維持 `-webkit-app-region: drag`，不干擾視窗拖曳行為。

- **視窗顏色主題注入**：
  - 當 Popout 視窗開啟或 Restore Space 時，取得 layout 的 `color` 屬性。
  - 將顏色寫入 Popout 視窗 `body.is-popout-window` 的 CSS 自訂變數：`win.document.body.style.setProperty("--window-space-color", color)`。

### 3.2 `styles.css`
- **Activity Bar 底色修正**：
  ```css
  .window-spaces-activity-bar {
    background-color: var(--background-secondary); /* 對齊 sidebar & tabbar non-active 底色 */
    border-color: var(--background-modifier-border);
  }
  ```
- **左上角 Drag Area Icon / Emoji 樣式**：
  ```css
  .window-spaces-activity-drag {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 16px;
  }
  .window-spaces-activity-drag svg {
    width: 16px;
    height: 16px;
    color: var(--window-space-color, var(--text-muted));
  }
  ```
- **純視覺無偏移行性 3px 彩色內邊框**：
  ```css
  body.is-popout-window[style*="--window-space-color"] {
    box-shadow: inset 0 0 0 3px var(--window-space-color) !important;
  }
  /* 頂端拖曳區與 Activity Bar 高亮 Accent 線條 */
  body.is-popout-window[style*="--window-space-color"] .window-spaces-activity-left {
    border-left: 2px solid var(--window-space-color);
  }
  ```

---

## 4. 對話框與控制介面變更 (Modal & UI Components)

### 4.1 `src/modals/saveModal.ts` (儲存與編輯 Space 對話框)
- 新增 **Icon / Emoji 輸入欄位**：
  - 文字輸入框與即時預覽圖案區。
  - 支援輸入 Emoji 或 Lucide icon 名稱。
- 新增 **邊框顏色選擇器 (Color Picker & Swatches)**：
  - 原生 HTML `<input type="color">` 選擇器。
  - 一列可點選的快捷 Preset 色塊 (Swatches)，點選即完成色碼帶入與預覽。
  - 清除顏色按鈕（重置為無邊框）。

### 4.2 `src/modals/restoreModal.ts` & `src/views/windowLayoutsView.ts` (側欄與列表)
- 列表項目 (`.window-layout-item`) 左側：
  - 渲染 Space 的專屬 Icon/Emoji。
  - 若有指定 `color`，於 Icon 旁或名稱左側渲染直徑 8px 的色彩圓點 (`.window-space-color-badge`)。

---

## 5. 多國語言與單元測試 (i18n & Testing)

### 5.1 i18n (`src/i18n/`)
- `en.ts`, `zh-TW.ts`, `zh-CN.ts` 新增語系條目：
  - `saveModal.iconLabel`: Icon / Emoji
  - `saveModal.iconPlaceholder`: e.g. 🚀 or star
  - `saveModal.colorLabel`: Window Frame Color
  - `saveModal.colorPresetLabel`: Preset Colors
  - `settings.defaultIcon`: Default Popout Icon
  - `settings.colorPresets`: Preset Color Palette

### 5.2 測試套件 (`tests/`)
- `tests/validationAndGuardrails.test.ts`: 驗證 `icon` 與 `color` 的序列化、預設值帶入與相容性測試。
- `tests/sorting.test.ts`: 驗證帶有自訂 Icon/Color 的 Space 複製與排序行為不被破壞。

---

## 6. 執行步驟與驗證清單 (Implementation Checklist)

1. [ ] **Step 1**: 更新 `src/types.ts` 中的 `WindowLayout` 與 `WindowSettings` 介面。
2. [ ] **Step 2**: 更新 `src/i18n/` 的語系檔案 (`en.ts`, `zh-TW.ts`, `zh-CN.ts`)。
3. [ ] **Step 3**: 於 `styles.css` 加入 Activity Bar `var(--background-secondary)` 底色對齊、Drag handle 圖示樣式與 `box-shadow: inset` 彩色邊框。
4. [ ] **Step 4**: 修改 `src/popout/activityBar.ts`，實作 Drag handle Icon/Emoji 渲染與 `--window-space-color` 變數注入。
5. [ ] **Step 5**: 修改 `src/modals/saveModal.ts`，加入 Icon/Emoji 輸入框與 Color Picker + Swatches 元件。
6. [ ] **Step 6**: 修改 `src/modals/restoreModal.ts` 與 `src/views/windowLayoutsView.ts`，使列表項目呈現 Icon 與 Color Badge。
7. [ ] **Step 7**: 於 `src/settings.ts` 加入「Window Accent & Icons」設定區塊。
8. [ ] **Step 8**: 執行 `npm run lint` 與 `npm run test`，確保 0 Error, 0 Warning。
9. [ ] **Step 9**: 執行 `npm run build` 並部署至本地測試 Vault (`test-vault` 與 `Note`)。
