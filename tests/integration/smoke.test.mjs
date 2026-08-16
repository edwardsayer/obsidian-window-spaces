// 冒煙測試：確認 Obsidian debug port 可連、vault 存在、plugin 已載入、windows 清單正常。
// 執行：npm run test:integration（需先以 debug port 啟動 Obsidian）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PORT, listTargets, pickMain, evalOn, GET_ALL_LEAVES_EXPR } from './helper.mjs';

test('debug port 可連且至少有 page target', async () => {
  const targets = await listTargets();
  assert.ok(targets.length > 0, `應至少有 1 個 page target（現有 ${targets.length}）`);
  console.log(`targets: ${targets.map((t) => t.title).join(' | ')}`);
});

test('主視窗 target 存在且 vault 名稱正確', async () => {
  const main = await pickMain();
  const vault = await evalOn('app.vault.getName()', main);
  assert.ok(typeof vault === 'string' && vault.length > 0, `vault name 應為非空字串（got: ${vault}）`);
  console.log(`vault: ${vault}`);
});

test('window-spaces plugin 已載入', async () => {
  const main = await pickMain();
  const loaded = await evalOn('!!app.plugins.plugins["window-spaces"]', main);
  assert.equal(loaded, true, 'window-spaces plugin 應已載入');
  const version = await evalOn('app.plugins.plugins["window-spaces"].manifest?.version', main);
  console.log(`window-spaces version: ${version}`);
});

test('workspace 有 leaves 且可列舉（iterateAllLeaves）', async () => {
  const main = await pickMain();
  const leaves = await evalOn(GET_ALL_LEAVES_EXPR, main);
  console.log(`leaves: ${leaves.length}（例: ${leaves.slice(0, 3).map((l) => l.type).join(', ')}）`);
  assert.ok(leaves.length > 0, 'workspace 應有 leaves');
});
