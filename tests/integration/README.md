# Integration Tests（CDP runtime 驗證）

整合測試透過 Chrome DevTools Protocol 連到**真實 Obsidian** 驗證 runtime 行為（unit tests 的 jsdom mock 無法覆蓋的部分）。取代過往散落在 `/tmp` 的一次性 `cdp-verify*.js` script。

## 前提

1. Obsidian 需以 debug port 啟動：
   ```bash
   npm run obsidian:debug
   ```
   （預設 port 9222；可用 `WINDOW_SPACES_DEBUG_PORT` 或 `npm run obsidian:debug -- <port>` 指定）
2. 確認 Obsidian 已載入 window-spaces plugin。

## 執行

```bash
npm run test:integration
```

或指定單一檔案：

```bash
node --test tests/integration/popout.test.mjs
```

## 與 unit tests 的區別

| | unit tests (`npm run test`) | integration tests (`npm run test:integration`) |
|---|---|---|
| 環境 | jsdom + obsidian mock | 真實 Obsidian（debug port） |
| 依賴 | 無 | 需 Obsidian 啟動中 |
| 驗證範圍 | 純邏輯（sorting/i18n/validation…） | runtime DOM、popout、plugin 實例 |

## 檔案結構

- `helper.mjs` — CDP bridge（連線、選 target、evaluate、斷言、清理）
- `smoke.test.mjs` — 冒煙：port 可連、vault 名稱、plugin 載入、leaves
- `popout.test.mjs` — popout 場景：開 popout、開檔、plugin 在 popout 中可存取

## 新增測試場景

1. 在 `tests/integration/` 建 `xxx.test.mjs`，import `{ pickMain, pickPopout, evalOn, closeAllPopouts }`。
2. 動作寫成 async expression（`awaitPromise: true` 自動套用），斷言用 `node:assert`。
3. 需要開 popout 的測試務必在 `after` 中 `closeAllPopouts(main)` 清理。

## Security

測試會真實操控 Obsidian（開/關 popout）。僅限開發環境執行；結束後請關閉 Obsidian（`taskkill //IM Obsidian.exe //F`）。
