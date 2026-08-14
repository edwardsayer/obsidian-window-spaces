#!/usr/bin/env node
/**
 * CDP 檢查輔助：對指定 target 執行 JS，輸出結果。
 * 用法: node src/tools/cdp-inspect.js <title-substring> <js-expression>
 * 例: node src/tools/cdp-inspect.js "test-vault - Obsidian" "document.title"
 */
const http = require('http');

const targetSub = process.argv[2] || '';
const expr = process.argv[3] || '1';

function getTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const targets = await getTargets();
  const pages = targets.filter((t) => t.type === 'page');
  const target = pages.find((t) => t.title.includes(targetSub)) || pages[0];
  if (!target) throw new Error('no target');
  console.error(`TARGET: ${target.title}`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Runtime.enable');
  const res = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  console.log(JSON.stringify(res.result?.result?.value ?? res, null, 2));
  ws.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
