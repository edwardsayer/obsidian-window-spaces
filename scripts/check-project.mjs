#!/usr/bin/env node
/**
 * check-project.mjs — Window Spaces 專案健康檢查
 * 執行：npm run check:project
 *
 * 檢查項目：
 *   1. 必要檔案/目錄存在（manifest、設定檔、src、tests、scripts、docs、assets）
 *   2. package.json 必要 devDependencies
 *   3. manifest.json 必要欄位
 *   4. 版本一致性：manifest.json ↔ package.json (及 versions.json 若存在)
 *   5. TypeScript 型別檢查（tsc --noEmit）
 *   6. Canonical shared engine 完整性驗證
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

let failures = 0;
const fail = (msg) => {
  console.error(`❌ ${msg}`);
  failures += 1;
};
const ok = (msg) => console.log(`✅ ${msg}`);

// ---------- 1. 必要檔案 ----------
console.log("🔍 檢查必要檔案/目錄...");
const requiredPaths = [
  "manifest.json",
  "package.json",
  "tsconfig.json",
  "esbuild.config.mjs",
  "styles.css",
  "LICENSE",
  "README.md",
  "README.zh-TW.md",
  "README.zh-CN.md",
  "src/main.ts",
  "src/manager.ts",
  "src/settings.ts",
  "src/settingsActivityBar.ts",
  "src/spaceVisuals.ts",
  "src/types.ts",
  "src/i18n/index.ts",
  "src/i18n/types.ts",
  "src/i18n/en.ts",
  "src/i18n/zh-TW.ts",
  "src/i18n/zh-CN.ts",
  "src/modals/saveModal.ts",
  "src/modals/restoreModal.ts",
  "src/popout/activityBar.ts",
  "src/popout/popoutLayout.ts",
  "src/popout/viewRegistry.ts",
  "src/popout/workspaceInterceptor.ts",
  "src/shared/popoutLayout.ts",
  "src/shared/sharedVersion.ts",
  "src/shared/popoutLayoutRegistry.ts",
  "src/shared/workspaceInterceptor.ts",
  "src/shared/windowActiveFileTracker.ts",
  "src/views/windowLayoutsView.ts",
  "scripts/deploy.mjs",
  "scripts/check-project.mjs",
  "scripts/test-build.mjs",
  "scripts/obsidian-debug.mjs",
  "tests/",
  "tests/integration/",
  "docs/user-guide.md",
  "docs/user-guide.zh-TW.md",
  "docs/user-guide.zh-CN.md",
  "assets/screenshots/multi-workspaces.png",
  "assets/screenshots/popup.png",
  "assets/screenshots/sidebar.png",
  "assets/screenshots/tab-panel.png",
];

for (const p of requiredPaths) {
  if (existsSync(join(root, p))) {
    ok(p);
  } else {
    fail(`缺少檔案/目錄: ${p}`);
  }
}

// ---------- 2. 依賴 ----------
console.log("\n📦 檢查 devDependencies...");
try {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const deps = pkg.devDependencies ?? {};
  for (const dep of ["obsidian", "typescript", "esbuild", "eslint", "vitest"]) {
    if (deps[dep]) {
      ok(`${dep}@${deps[dep]}`);
    } else {
      fail(`缺少 devDependency: ${dep}`);
    }
  }
} catch (e) {
  fail(`無法讀取 package.json: ${e.message}`);
}

// ---------- 3. manifest 欄位 ----------
console.log("\n📋 檢查 manifest.json...");
let manifest = null;
try {
  manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
  for (const field of ["id", "name", "version", "minAppVersion", "description"]) {
    if (manifest[field]) {
      ok(`${field}: ${manifest[field]}`);
    } else {
      fail(`manifest 缺少欄位: ${field}`);
    }
  }
} catch (e) {
  fail(`無法讀取 manifest.json: ${e.message}`);
}

// ---------- 4. 版本一致性 ----------
console.log("\n🔢 檢查版本一致性...");
try {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  if (manifest && pkg.version !== manifest.version) {
    fail(`版本不一致：package.json=${pkg.version} vs manifest.json=${manifest.version}`);
  } else if (manifest) {
    ok(`package.json ↔ manifest.json: ${pkg.version}`);
  }

  if (existsSync(join(root, "versions.json"))) {
    const versions = JSON.parse(readFileSync(join(root, "versions.json"), "utf8"));
    if (manifest && versions[manifest.version] === undefined) {
      fail(`versions.json 缺少目前版本 ${manifest.version} 的 minAppVersion 條目`);
    } else if (manifest) {
      const mapped = versions[manifest.version];
      if (mapped !== manifest.minAppVersion) {
        fail(`versions.json[${manifest.version}]=${mapped} 與 manifest.minAppVersion=${manifest.minAppVersion} 不一致`);
      } else {
        ok(`versions.json[${manifest.version}] = ${mapped}`);
      }
    }
  }
} catch (e) {
  fail(`版本檢查失敗: ${e.message}`);
}

// ---------- 5. TypeScript 型別檢查 ----------
console.log("\n🧪 TypeScript 型別檢查（tsc --noEmit）...");
{
  const r = spawnSync("npx", ["tsc", "--noEmit"], {
    cwd: root,
    shell: true,
    stdio: "inherit",
  });
  if (r.status === 0) {
    ok("tsc 型別檢查通過");
  } else {
    fail(`tsc 型別檢查失敗（exit ${r.status ?? "signal"}）`);
  }
}

// ---------- 6. Canonical Shared Engine 檢查 ----------
console.log("\n🔗 Canonical shared engine 完整性檢查...");
const sharedFiles = [
  "popoutLayout.ts",
  "sharedVersion.ts",
  "popoutLayoutRegistry.ts",
  "workspaceInterceptor.ts",
  "windowActiveFileTracker.ts",
];
for (const sf of sharedFiles) {
  const p = join(root, "src/shared", sf);
  if (existsSync(p)) {
    ok(`src/shared/${sf}`);
  } else {
    fail(`缺少 canonical shared 檔案: src/shared/${sf}`);
  }
}

// ---------- 總結 ----------
console.log("\n" + (failures === 0 ? "🎉 專案檢查全部通過！" : `❗ 專案檢查失敗：${failures} 項問題`));
process.exit(failures === 0 ? 0 : 1);
