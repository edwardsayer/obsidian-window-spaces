// Popout 場景整合測試：開新 popout → 等 mount → 驗證 plugin 作用於 popout → 開檔驗證 → 清理。
// 執行：npm run test:integration（需先以 debug port 啟動 Obsidian）
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { listTargets, pickMain, pickPopout, evalOn, closeAllPopouts, sleep, GET_ALL_LEAVES_EXPR } from './helper.mjs';

let main;

before(async () => {
  main = await pickMain();
  await closeAllPopouts(main); // 確保乾淨起點
});

after(async () => {
  if (main) await closeAllPopouts(main);
  console.log('cleanup: popouts closed');
});

/** 輪詢等待新 popout target 出現（title 含 substr）。 */
async function waitForPopout(substr, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const targets = await listTargets();
    const hit = targets.find((t) => t.type === 'page' && t.title.includes(substr) && !t.url.includes('index.html'));
    if (hit) return hit;
    await sleep(500);
  }
  throw new Error(`等待 popout (title 含 "${substr}") 逾時 ${timeoutMs}ms`);
}

test('主視窗可開啟新 popout 並載入 markdown 檔案', async () => {
  const fileName = await evalOn(
    `(async () => {
      const files = app.vault.getMarkdownFiles();
      if (files.length === 0) return null;
      const leaf = app.workspace.openPopoutLeaf();
      await leaf.setViewState({ type: 'markdown', state: { file: files[0].path } });
      return files[0].basename;
    })()`,
    main
  );
  assert.ok(fileName, 'vault 應有 markdown 檔案可開');

  const popout = await waitForPopout(fileName);
  console.log(`popout target: ${popout.title}`);

  // popout 中應有 markdown leaf
  const leafInfo = await evalOn(GET_ALL_LEAVES_EXPR, popout);
  assert.ok(
    leafInfo.some((l) => l.type === 'markdown'),
    `popout 應有 markdown leaf（got: ${JSON.stringify(leafInfo)}）`
  );
  console.log(`popout leaves: ${JSON.stringify(leafInfo)}`);
});

test('popout 中 window-spaces plugin 實例可存取', async () => {
  const fileName = await evalOn(
    `(async () => {
      const files = app.vault.getMarkdownFiles();
      if (files.length === 0) return null;
      const leaf = app.workspace.openPopoutLeaf();
      await leaf.setViewState({ type: 'markdown', state: { file: files[0].path } });
      return files[0].basename;
    })()`,
    main
  );
  const popout = await waitForPopout(fileName);

  const info = await evalOn(
    `(() => {
      const p = app.plugins.plugins['window-spaces'];
      return { loaded: !!p, hasManager: !!p?.manager, hasSettings: !!p?.settings };
    })()`,
    popout
  );
  console.log(`plugin in popout: ${JSON.stringify(info)}`);
  assert.equal(info.loaded, true, 'popout 中 plugin 應已載入');
  assert.equal(info.hasManager, true, 'popout 中 manager 應存在');
});
