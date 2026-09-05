#!/usr/bin/env node

/**
 * 以遠端偵錯模式啟動 Obsidian（開啟 Chrome DevTools Protocol port），
 * 讓 AI agent 可以透過 chrome-devtools-mcp 連接、檢視 Obsidian runtime 與元素 style。
 *
 * 用法：
 *   npm run obsidian:debug
 *   npm run obsidian:debug -- 9222
 *   OBSIDIAN_EXE="<路徑>" npm run obsidian:debug
 *
 * 預設 debug port 為 9222（與 opencode.json 的 chrome-devtools MCP 設定一致），
 * 可用 `-- <port>` 或環境變數 WINDOW_SPACES_DEBUG_PORT 覆寫。
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { get } from "node:http";
import { join } from "node:path";
import { platform } from "node:os";

const rawArgs = process.argv.slice(2);
const portArg = rawArgs.find((a) => /^\d+$/.test(a));
const PORT = Number(portArg || process.env.WINDOW_SPACES_DEBUG_PORT || 9222);
const vaultIdx = rawArgs.indexOf("--vault");
const VAULT_PATH = vaultIdx >= 0 ? rawArgs[vaultIdx + 1] : null;

/** 依平台找出 Obsidian 執行檔。 */
function resolveObsidianExe() {
  if (process.env.OBSIDIAN_EXE) {
    return process.env.OBSIDIAN_EXE;
  }
  if (platform() === "win32") {
    const candidates = [
      join(process.env.LOCALAPPDATA || "", "Programs", "Obsidian", "Obsidian.exe"),
      join(process.env.LOCALAPPDATA || "", "Obsidian", "Obsidian.exe"),
    ];
    return candidates.find((p) => existsSync(p)) || candidates[0];
  }
  if (platform() === "darwin") {
    return "/Applications/Obsidian.app/Contents/MacOS/Obsidian";
  }
  return "obsidian";
}

function endpointUp() {
  return new Promise((resolve) => {
    const req = get(`http://127.0.0.1:${PORT}/json/version`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForEndpoint(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await endpointUp()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  if (await endpointUp()) {
    console.log(`ℹ️  CDP 埠已在 http://127.0.0.1:${PORT} 運行中，跳過啟動新行程。`);
    return;
  }

  const exe = resolveObsidianExe();
  if (!existsSync(exe) && !process.env.OBSIDIAN_EXE) {
    console.error(`❌ 找不到 Obsidian 執行檔: ${exe}`);
    console.error("   請設定環境變數 OBSIDIAN_EXE 指向 Obsidian 執行檔路徑。");
    process.exit(1);
  }

  const args = [`--remote-debugging-port=${PORT}`];
  if (VAULT_PATH) {
    args.push(`obsidian://open?path=${encodeURIComponent(VAULT_PATH)}`);
  }

  console.log(`🚀 啟動 Obsidian (port ${PORT})...`);
  console.log(`   執行檔: ${exe}`);
  if (VAULT_PATH) console.log(`   Vault: ${VAULT_PATH}`);

  const child = spawn(exe, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  const up = await waitForEndpoint(15000);
  if (!up) {
    console.error(`⚠️  等待 15 秒後仍未偵測到 http://127.0.0.1:${PORT}/json/version。`);
    console.error("   若 Obsidian 正在啟動中，請稍候片刻再試；");
    console.error("   若已有另一份未開 debug port 的 Obsidian 在跑，請先完全關閉該 Obsidian 行程。");
    process.exit(1);
  }

  console.log(`✅ Obsidian 已於 debug 模式就緒 (http://127.0.0.1:${PORT})。`);
  console.log("   - 每個分頁 / popout window 各自是獨立 target：http://127.0.0.1:" + PORT + "/json");
  console.log("   - 可使用 Chrome DevTools 或本專案的 npm run probe 進行即時檢查。");
  console.log("   - 測試結束後請執行 Stop-Process -Name Obsidian -Force 關閉除錯實體。");
}

main().catch((err) => {
  console.error("❌ 啟動失敗:", err);
  process.exit(1);
});
