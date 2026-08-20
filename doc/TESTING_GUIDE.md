# Window Spaces 測試指南

## 自動化檢查

```bash
npm run lint
npm run test
npm run build
npm run check
```

`npm run check` 只檢查專案結構與 manifest；若因環境或文件問題失敗，必須記錄實際原因，不得用過時的 archive 文件掩蓋問題。

目前測試套件涵蓋 **107 tests**。每次程式碼變更至少執行 `npm run lint` 與 `npm run test`。

## 本地 Vault 部署

完成 build 後，將以下檔案複製到兩個測試 Vault：

- `main.js`
- `main.js.map`
- `manifest.json`
- `styles.css`

目標路徑：

```text
E:/vaults/quartz-vault/.obsidian/plugins/window-spaces/
E:/vaults/Note/.obsidian/plugins/window-spaces/
```

部署後請 reload plugin 或完全重新啟動 Obsidian。

## 核心手動測試

### 1. Popout scope

- 從 `New window` 開啟 Popout。
- 在 Popout 內建立 tabs、split、File Explorer 或第三方 view。
- 儲存 Window Space。
- 確認保存內容只包含目前 Popout，不包含主視窗或其他 Popout。
- 還原時確認主視窗 layout、主視窗 sidebar 與其他 Popout 均不被清空或重建。

### 2. Restore target

- 一般點擊或 `Enter`：建立新的 Popout。
- `Shift` 點擊或 `Shift + Enter`：套用至目前 active Popout。
- 已開啟的 Space 再次還原：聚焦既有視窗，而不是重複建立。
- 確認一般 restore 不會清除原本 Popout 的 layout label。

### 3. Workspace interceptor regression

- 在主視窗 File Explorer 單擊檔案，確認只開啟/啟用一次且 click 不被吞掉。
- 在 Popout 中開啟 Window Spaces panel，確認 panel 只建立於 focused Popout。
- 測試 left sidebar、right sidebar、editor tab 與 popup window 四種 panel location。
- 同時啟用其他 shared participant 時，確認 participant 可以共存。
- 停用 plugin 後確認原始 Workspace API 恢復。

### 4. Layout integrity and guardrails

- 缺失檔案仍保留原本 tab/split 結構，並轉為原生 empty tab。
- active file 與 source/preview mode 正確恢復。
- 開啟 auto-save 的 Space 在變更後以 5 秒 debounce 保存。
- 關閉 Popout 時使用最後合法 snapshot。
- 0-file snapshot 不得覆寫原本含有檔案的 layout。
- 螢幕座標變更後，視窗不得恢復到不可見位置。

### 5. Panel rendering

建立包含以下三個區域的 workspace：

- File Explorer
- editor-tab Window Spaces panel
- right-sidebar Window Spaces panel

確認三者 toolbar 的起始位置、padding、按鈕順序與 active/hover 外觀一致。再將 panel 移至 left sidebar 重複測試。

## 問題回報

回報時請附上：

1. Obsidian 版本（目前最低支援 `1.12.7`）。
2. 作業系統與 Vault 名稱。
3. 操作所在視窗：主視窗或哪個 Popout。
4. 最小重現步驟。
5. Console error/warn 與相關 layout JSON（移除敏感資料後）。
6. `npm run lint`、`npm run test`、`npm run build` 結果。
