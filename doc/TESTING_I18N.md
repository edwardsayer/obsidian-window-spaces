# Window Spaces 多語系測試

Window Spaces 支援：

- English (`en`)
- 繁體中文 (`zh-TW`)
- 简体中文 (`zh-CN`)

語系由 `localStorage.language`、`moment.locale()` 與 Vault 設定即時偵測；切換語系後不應依賴 plugin reload 才能重新計算 `t()`、日期與數字格式。

## 測試項目

### English

- Command、Save Modal、Window Layouts panel、settings、Notice 全部顯示英文。
- Sorting menu 顯示 updated/created/name 六種排序。
- Auto-save、missing file、zero-file guardrail 訊息可讀。

### 繁體中文

- Command、Save Modal、Window Layouts panel、settings、Notice 全部顯示繁體中文。
- 檢查「儲存」、「重新命名」、「刪除」、「自動保存」等文字。
- 檢查日期、檔案數量與進度 Notice 的參數插值。

### 简体中文

- Command、Save Modal、Window Layouts panel、settings、Notice 全部顯示簡體中文。
- 檢查「保存」、「重命名」、「删除」等文字。
- 檢查日期、檔案數量與進度 Notice 的參數插值。

### Fallback

切換至未支援的語系（例如日文或法文）後，確認 UI fallback 至英文，且找不到 key 時不會顯示空白文字。

## 自動化測試

`tests/i18n.test.ts` 應涵蓋：

- 即時 localStorage 語系變更。
- `zh-TW`、`zh-HK`、`zh-MO`、`zh-Hant` 映射。
- `zh`、`zh-CN` 映射。
- 英文 fallback。
- `tWithParams` 參數插值。
