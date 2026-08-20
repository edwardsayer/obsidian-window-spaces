#!/usr/bin/env node

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 9333;
const VAULT_PATH = 'E:\\vaults\\quartz-vault';
const PROJECT_ROOT = 'D:\\GitDev\\ObsidianWindowSpaces';
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'screenshots');
const OBSIDIAN_CONFIG_PATH = path.join(process.env.APPDATA, 'obsidian', 'obsidian.json');

function resolveObsidianExe() {
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Obsidian', 'Obsidian.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Obsidian', 'Obsidian.exe'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

function endpointUp() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/json/version`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForEndpoint(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await endpointUp()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function getJSON(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(new Error(JSON.stringify(msg.error)));
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const msgId = ++this.id;
      this.pending.set(msgId, { res, rej });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    return r?.result?.value;
  }

  async captureScreenshot(outputPath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const r = await this.send('Page.captureScreenshot', params);
    const buf = Buffer.from(r.data, 'base64');
    fs.writeFileSync(outputPath, buf);
    console.log(`  📸 Screenshot saved: ${outputPath}`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log('🚀 Starting Screenshot Capture Workflow...');
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  let originalObsidianConfig = null;
  if (fs.existsSync(OBSIDIAN_CONFIG_PATH)) {
    originalObsidianConfig = fs.readFileSync(OBSIDIAN_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(originalObsidianConfig);
    let qKey = Object.keys(parsed.vaults || {}).find(k => parsed.vaults[k].path === VAULT_PATH);
    if (!qKey) {
      qKey = 'quartz' + Math.random().toString(16).slice(2, 10);
      parsed.vaults = parsed.vaults || {};
      parsed.vaults[qKey] = { path: VAULT_PATH, ts: Date.now() };
    }
    for (const k of Object.keys(parsed.vaults)) {
      parsed.vaults[k].open = (k === qKey);
    }
    fs.writeFileSync(OBSIDIAN_CONFIG_PATH, JSON.stringify(parsed, null, 2), 'utf8');
  }

  const exe = resolveObsidianExe();
  const child = spawn(exe, [`--remote-debugging-port=${PORT}`], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  const ok = await waitForEndpoint(15000);
  if (!ok) {
    console.error('❌ Failed to connect to Obsidian CDP.');
    if (originalObsidianConfig) fs.writeFileSync(OBSIDIAN_CONFIG_PATH, originalObsidianConfig, 'utf8');
    process.exit(1);
  }

  await new Promise((r) => setTimeout(r, 2500));

  let targets = (await getJSON('/json')).filter((t) => t.type === 'page');
  const starter = targets.find(t => t.url.includes('starter.html'));
  if (starter) {
    const sClient = new CDPClient(starter.webSocketDebuggerUrl);
    await sClient.connect();
    await sClient.eval(`(() => {
      const items = Array.from(document.querySelectorAll('.vault-item, .clickable-icon, [data-path]'));
      const q = items.find(el => el.textContent.includes('quartz') || el.dataset?.path?.includes('quartz'));
      if (q) q.click();
      else if (items[0]) items[0].click();
    })()`);
    sClient.close();
    await new Promise((r) => setTimeout(r, 4000));
  }

  targets = (await getJSON('/json')).filter((t) => t.type === 'page');
  const mainTarget = targets.find(t => t.url.includes('index.html') && !t.title.includes('starter')) || targets[0];

  const client = new CDPClient(mainTarget.webSocketDebuggerUrl);
  await client.connect();

  console.log('  Preparing clean layout in main window...');

  await client.eval(`(async () => {
    const app = window.app;

    const trustBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Trust author') || b.classList.contains('mod-cta')
    );
    if (trustBtn) {
      trustBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    if (app.plugins) {
      if (typeof app.plugins.setEnable === 'function') await app.plugins.setEnable(true);
      await app.plugins.loadManifests();
      if (!app.plugins.enabledPlugins.has('window-spaces')) {
        await app.plugins.enablePlugin('window-spaces');
      }
    }

    const plugin = app.plugins.plugins['window-spaces'];
    if (!plugin) return;

    // 清空舊的重複 leaves
    app.workspace.getLeavesOfType('window-spaces-layouts').forEach(l => l.detach());

    // 開啟 philosophy 筆記
    const filePhil = app.vault.getAbstractFileByPath('docs/philosophy.md');
    if (filePhil) {
      const leaf = app.workspace.getLeaf(false);
      await leaf.openFile(filePhil);
    }

    // 展開左側邊欄並打開 Window Spaces Panel
    const panelLeaf = await plugin.openWindowLayoutsPanel('left');
    if (panelLeaf) {
      app.workspace.revealLeaf(panelLeaf);
    }
    if (app.workspace.leftSplit && typeof app.workspace.leftSplit.expand === 'function') {
      app.workspace.leftSplit.expand();
    }
  })()`);

  await new Promise((r) => setTimeout(r, 2000));

  // 截圖 1: 側邊欄面板與主編輯區 (sidebar.png)
  console.log('  Capturing sidebar.png...');
  await client.captureScreenshot(path.join(SCREENSHOTS_DIR, 'sidebar.png'));

  // 截圖 2: 獨立 Popout 工作艙 (Canvas + Markdown 左右分割)
  console.log('  Creating dedicated Popout Workbench...');
  await client.eval(`(async () => {
    const app = window.app;
    const plugin = app.plugins.plugins['window-spaces'];
    if (!plugin) return;

    const spaces = plugin.settings.spaces || plugin.settings.layouts || [];
    const space = spaces[0];
    if (space) {
      await plugin.manager.restoreWindowLayout(space, { target: 'new-window' });
    }
  })()`);

  console.log('  Waiting 5s for Popout window to render...');
  await new Promise((r) => setTimeout(r, 5000));

  const updatedTargets = (await getJSON('/json')).filter((t) => t.type === 'page');
  const popoutTarget = updatedTargets.find((t) => t.id !== mainTarget.id && !t.title.includes('Settings') && !t.title.includes('starter'));
  if (popoutTarget) {
    console.log(`  Connecting to Popout window: ${popoutTarget.title}...`);
    const popoutClient = new CDPClient(popoutTarget.webSocketDebuggerUrl);
    await popoutClient.connect();

    // 在 Popout 視窗內優化排版：關閉多餘的 panel，只留下 Canvas + Markdown
    await popoutClient.eval(`(() => {
      const app = window.app;
      app.workspace.getLeavesOfType('window-spaces-layouts').forEach(l => {
        if (l.view?.containerEl?.ownerDocument === document) {
          l.detach();
        }
      });
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    console.log('  Capturing Popout workbench screenshot (multi-workspaces.png)...');
    await popoutClient.captureScreenshot(path.join(SCREENSHOTS_DIR, 'multi-workspaces.png'));
    popoutClient.close();
  }

  // 截圖 3: 標籤頁面板模式 (tab-panel.png)
  console.log('  Capturing Tab Panel mode...');
  await client.eval(`(async () => {
    const app = window.app;
    const plugin = app.plugins.plugins['window-spaces'];
    if (plugin) {
      const tabLeaf = await plugin.openWindowLayoutsPanel('tab');
      if (tabLeaf) app.workspace.revealLeaf(tabLeaf);
    }
  })()`);
  await new Promise((r) => setTimeout(r, 1500));
  await client.captureScreenshot(path.join(SCREENSHOTS_DIR, 'tab-panel.png'));

  client.close();

  if (originalObsidianConfig) {
    fs.writeFileSync(OBSIDIAN_CONFIG_PATH, originalObsidianConfig, 'utf8');
    console.log('  ✅ Restored original obsidian.json');
  }

  console.log('🎉 Screenshot capture complete!');
}

main().catch(console.error);
