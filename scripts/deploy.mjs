#!/usr/bin/env node

/**
 * 一鍵部署 Window Spaces 至本地測試 vault（quartz-vault / Note）並做 byte-identical 驗證。
 *
 * 用法：
 *   node scripts/deploy.mjs                 # build + 部署雙 vault + byte-identical 驗證
 *   node scripts/deploy.mjs --vault quartz-vault
 *   node scripts/deploy.mjs --vault Note
 *   node scripts/deploy.mjs --skip-build    # 已 build 過，只複製驗證
 *
 * 環境變數：
 *   WS_VAULTS_ROOT   自訂 vault 根目錄（預設 E:\vaults）
 *   OBSIDIAN_PLUGIN_DIR_NAME   自訂插件目錄名（預設取 manifest.id）
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const manifest = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'manifest.json'), 'utf8')
);

const PLUGIN_DIR_NAME = process.env.OBSIDIAN_PLUGIN_DIR_NAME || manifest.id;
const VAULTS_ROOT = process.env.WS_VAULTS_ROOT || 'E:/vaults';

// 部署檔案（不含 styles.css 以外的產物；source map 亦納入 byte 驗證）
const DEPLOY_FILES = ['main.js', 'main.js.map', 'manifest.json', 'styles.css'];

const VAULTS = {
  'quartz-vault': {
    dir: path.join(path.resolve(VAULTS_ROOT), 'quartz-vault'),
  },
  Note: {
    dir: path.join(path.resolve(VAULTS_ROOT), 'Note'),
  },
};

function parseArgs(argv) {
  const args = { vaults: [], skipBuild: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--skip-build') {
      args.skipBuild = true;
    } else if (arg === '--vault') {
      const name = argv[++i];
      if (!name || !VAULTS[name]) {
        console.error(
          `❌ 未知 vault: ${name}（可用: ${Object.keys(VAULTS).join(' / ')}）`
        );
        process.exit(1);
      }
      args.vaults.push(name);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`用法:
  node scripts/deploy.mjs                 # build + 部署雙 vault + byte-identical 驗證
  node scripts/deploy.mjs --vault quartz-vault
  node scripts/deploy.mjs --vault Note
  node scripts/deploy.mjs --skip-build    # 已 build 過，只複製驗證`);
      process.exit(0);
    } else {
      console.error(`❌ 未知參數: ${arg}（使用 --help 查看用法）`);
      process.exit(1);
    }
  }
  return args;
}

function ensureProjectFiles() {
  const missing = DEPLOY_FILES.filter((f) => !fs.existsSync(path.join(projectRoot, f)));
  if (missing.length > 0) {
    console.error('❌ 缺少以下產物檔案，請先執行 npm run build:');
    missing.forEach((f) => console.error(`   - ${f}`));
    process.exit(1);
  }
}

function pluginDirOf(vaultName) {
  const vault = VAULTS[vaultName];
  return path.join(vault.dir, '.obsidian', 'plugins', PLUGIN_DIR_NAME);
}

function deployToVault(vaultName) {
  const targetDir = pluginDirOf(vaultName);
  console.log(`\n📁 目標 vault: ${vaultName}`);
  console.log(`   插件目錄: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ 目標目錄不存在: ${targetDir}`);
    console.error('   請確認 vault 路徑與 Obsidian 插件目錄結構（可能有誤，不會自動建立）');
    return { ok: false, error: 'target dir missing' };
  }

  const copied = [];
  for (const file of DEPLOY_FILES) {
    const src = path.join(projectRoot, file);
    const dest = path.join(targetDir, file);
    try {
      fs.copyFileSync(src, dest);
      copied.push(file);
      console.log(`   ✅ 已複製: ${file}`);
    } catch (error) {
      console.error(`   ❌ 複製失敗 ${file}: ${error.message}`);
      return { ok: false, error: `copy ${file} failed` };
    }
  }

  // byte-identical 驗證
  let verified = true;
  for (const file of DEPLOY_FILES) {
    const src = path.join(projectRoot, file);
    const dest = path.join(targetDir, file);
    try {
      const srcBuf = fs.readFileSync(src);
      const destBuf = fs.readFileSync(dest);
      const same = srcBuf.equals(destBuf);
      console.log(`   ${same ? '✅' : '❌'} byte-identical: ${file}`);
      if (!same) verified = false;
    } catch (error) {
      console.error(`   ❌ 驗證讀取失敗 ${file}: ${error.message}`);
      verified = false;
    }
  }
  return { ok: verified, vaultName, targetDir };
}

// ---- 主流程 ----
const args = parseArgs(process.argv.slice(2));
const targetNames = args.vaults.length > 0 ? args.vaults : Object.keys(VAULTS);

console.log('🚀 Window Spaces 部署工具');
console.log(`📦 插件: ${manifest.name} (${manifest.id}) v${manifest.version}`);

if (!args.skipBuild) {
  console.log('\n🔨 執行 npm run build ...');
  try {
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  } catch (error) {
    console.error('❌ build 失敗，中止部署');
    process.exit(1);
  }
} else {
  console.log('\n⏭️  --skip-build：跳過 build，直接複製驗證');
}

ensureProjectFiles();

let allOk = true;
for (const name of targetNames) {
  const result = deployToVault(name);
  if (!result.ok) allOk = false;
}

console.log('\n' + '='.repeat(52));
if (allOk) {
  console.log('🎉 部署完成！全部檔案 byte-identical 驗證通過。');
  console.log('📝 請 reload plugin 或重啟 Obsidian 後測試。');
} else {
  console.log('❌ 部署流程有失敗項目，請檢查上方輸出。');
  process.exit(1);
}