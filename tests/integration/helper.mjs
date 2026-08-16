// Integration test 共用 bridge：連 Obsidian debug port，選 target，執行 evaluate，斷言。
// 零依賴（Node 20+ 全域 WebSocket）。用法見 README.md。
import http from 'node:http';

export const PORT = Number(process.env.WINDOW_SPACES_DEBUG_PORT || 9222);

export function getJSON(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${PORT}${path}`, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

export async function listTargets() {
  const targets = await getJSON('/json');
  return targets.filter((t) => t.type === 'page');
}

/** 連 WebSocket 並回傳 { ws, send(method, params) }。 */
export function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const msgId = ++id;
        pending.set(msgId, { res, rej });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    ws.onopen = () =>
      resolve({
        ws,
        send,
        close: () => ws.close(),
      });
    ws.onerror = (e) => reject(new Error(`WS connect failed: ${e.message ?? 'unknown'}`));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      }
    };
  });
}

/** 對連線執行 expression，回傳 value；有 exception 時丟錯。 */
export async function evaluate(client, expression, { timeoutMs = 15000 } = {}) {
  const timer = setTimeout(() => {
    throw new Error(`evaluate timeout after ${timeoutMs}ms`);
  }, timeoutMs);
  try {
    const res = await client.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    const r = res?.result ?? {};
    if (r.exceptionDetails) {
      throw new Error(
        `EXC: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description ?? ''}`
      );
    }
    if (r.subtype === 'error') throw new Error(`JS error: ${r.description}`);
    return r.value;
  } finally {
    clearTimeout(timer);
  }
}

/** 取得所有 leaves 的 expression（Obsidian 1.13.7 無 getLeaves，用 iterateAllLeaves）。 */
export const GET_ALL_LEAVES_EXPR = `(() => {
  const ws = app.workspace;
  const all = [];
  const collect = (l) => {
    const vs = l.getViewState?.() ?? {};
    all.push({
      type: vs.type ?? '?',
      file: vs.state?.file ?? '',
      title: l.view?.getDisplayText?.() ?? '',
      pinned: vs.pinned ?? false,
      win: l.containerEl?.ownerDocument?.defaultView === window ? 'this' : 'other',
    });
  };
  if (typeof ws.iterateAllLeaves === 'function') ws.iterateAllLeaves(collect);
  else (ws.getLeaves?.() ?? []).forEach(collect);
  return all;
})()`;

/** 便捷：對指定 target 執行並關閉連線。 */
export async function evalOn(expr, target) {
  const client = await connect(target.webSocketDebuggerUrl);
  try {
    return await evaluate(client, expr);
  } finally {
    client.close();
  }
}

/** 主視窗 target：url 含 index.html 的 page target（Obsidian 主視窗 title 可能顯示為 "data - <vault>"）。 */
export async function pickMain() {
  const targets = await listTargets();
  const mains = targets.filter((t) => t.url.includes('index.html'));
  const main = mains[0];
  if (!main) {
    const all = targets.map((t) => `${t.title} (${t.url})`).join(' | ');
    throw new Error(`找不到主視窗 target（url 含 index.html）。現有 targets: ${all}`);
  }
  return main;
}

/** 依 title 子字串找 popout target；找不到或重複時丟錯。 */
export async function pickPopout(substr) {
  const targets = await listTargets();
  const hits = targets.filter((t) => t.title.includes(substr));
  if (hits.length === 0) throw new Error(`找不到 title 含 "${substr}" 的 popout target。現有：${targets.map((t) => t.title).join(' | ')}`);
  if (hits.length > 1) throw new Error(`title 含 "${substr}" 有多個 target：${hits.map((t) => t.title).join(' | ')}`);
  return hits[0];
}

export async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 清理：關閉所有 popout 視窗（主視窗以外的 window）。 */
export async function closeAllPopouts(main) {
  await evalOn(
    `(async () => {
      let closed = 0;
      app.workspace.getLeavesOfType?.('markdown')?.forEach?.((l) => {
        const w = l.containerEl?.ownerDocument?.defaultView;
        if (w && w !== window && typeof w.close === 'function') { try { w.close(); closed++; } catch {} }
      });
      return closed;
    })()`,
    main
  );
}
