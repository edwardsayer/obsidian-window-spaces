#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

// 確保必要的目錄存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 檢查文件是否存在
const checkFile = (filePath) => {
  const absolutePath = path.join(projectRoot, filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ 缺少文件: ${filePath}`);
    return false;
  }
  console.log(`✅ ${filePath}`);
  return true;
};

// 檢查項目結構
console.log('🔍 檢查項目結構...');

const requiredFiles = [
  'manifest.json',
  'package.json',
  'tsconfig.json',
  'src/tools/rollup.config.js',
  'src/main.ts',
  'src/types.ts',
  'src/manager.ts',
  'src/settings.ts',
  'src/modals/saveModal.ts',
  'src/modals/restoreModal.ts',
  'styles.css',
  'README.md',
  'doc/PLANNING.md',
  'doc/AGENT_TODO.md'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (!checkFile(file)) {
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('✅ 所有必需文件都存在！');
} else {
  console.log('❌ 有文件缺失，請檢查項目結構');
  process.exit(1);
}

// 檢查 package.json 的依賴
console.log('\n📦 檢查依賴...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const requiredDeps = ['obsidian', 'typescript', 'rollup'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ 缺少依賴: ${dep}`);
    }
  });
} catch (error) {
  console.log('❌ 無法讀取 package.json');
}

// 檢查 manifest.json
console.log('\n📋 檢查 manifest.json...');
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'manifest.json'), 'utf8'));
  const requiredFields = ['id', 'name', 'version', 'minAppVersion', 'description'];
  
  requiredFields.forEach(field => {
    if (manifest[field]) {
      console.log(`✅ ${field}: ${manifest[field]}`);
    } else {
      console.log(`❌ 缺少字段: ${field}`);
    }
  });
} catch (error) {
  console.log('❌ 無法讀取 manifest.json');
}

console.log('\n🚀 項目檢查完成！');
console.log('\n📝 下一步：');
console.log('1. 運行 npm install 安裝依賴');
console.log('2. 運行 npm run dev 開始開發');
console.log('3. 將構建的文件複製到 Obsidian 插件目錄進行測試');
