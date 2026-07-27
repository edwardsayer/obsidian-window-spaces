#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🧪 測試 Window Spaces 插件...');

// 檢查生成的文件
const checkGeneratedFile = (filename) => {
  const absolutePath = path.join(projectRoot, filename);
  if (fs.existsSync(absolutePath)) {
    const stats = fs.statSync(absolutePath);
    console.log(`✅ ${filename} (${stats.size} bytes)`);
    
    // 檢查文件內容
    if (filename.endsWith('.js')) {
      const content = fs.readFileSync(absolutePath, 'utf8');
      if (content.includes('WindowSpacesPlugin')) {
        console.log('  ✅ 包含插件主類');
      }
      if (content.includes('WindowLayoutManager')) {
        console.log('  ✅ 包含佈局管理器');
      }
      if (content.includes('saveCurrentLayout')) {
        console.log('  ✅ 包含保存功能');
      }
      if (content.includes('restoreLayout')) {
        console.log('  ✅ 包含恢復功能');
      }
    }
  } else {
    console.log(`❌ 缺少文件: ${filename}`);
  }
};

console.log('\n📁 檢查生成的文件:');
checkGeneratedFile('main.js');
checkGeneratedFile('main.js.map');
checkGeneratedFile('styles.css');
checkGeneratedFile('manifest.json');

// 檢查插件清單
console.log('\n📋 檢查插件清單:');
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'manifest.json'), 'utf8'));
  console.log(`✅ 插件 ID: ${manifest.id}`);
  console.log(`✅ 插件名稱: ${manifest.name}`);
  console.log(`✅ 版本: ${manifest.version}`);
  console.log(`✅ 最低 Obsidian 版本: ${manifest.minAppVersion}`);
  console.log(`✅ 描述: ${manifest.description}`);
} catch (error) {
  console.log('❌ 無法讀取 manifest.json');
}

// 檢查主文件大小
console.log('\n📊 文件大小統計:');
const mainJsStats = fs.statSync(path.join(projectRoot, 'main.js'));
console.log(`main.js: ${mainJsStats.size} bytes`);

if (mainJsStats.size > 100000) {
  console.log('⚠️  文件較大，考慮優化');
} else if (mainJsStats.size < 10000) {
  console.log('ℹ️  文件較小，功能可能不完整');
} else {
  console.log('✅ 文件大小合理');
}

// 檢查依賴
console.log('\n📦 檢查依賴:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const devDeps = packageJson.devDependencies;
  
  if (devDeps.obsidian) {
    console.log(`✅ Obsidian API: ${devDeps.obsidian}`);
  }
  
  if (devDeps.typescript) {
    console.log(`✅ TypeScript: ${devDeps.typescript}`);
  }
  
  if (devDeps.rollup) {
    console.log(`✅ Rollup: ${devDeps.rollup}`);
  }
} catch (error) {
  console.log('❌ 無法讀取 package.json');
}

console.log('\n🚀 構建完成！');
console.log('\n📝 安裝說明：');
console.log('1. 將以下文件複製到你的 Obsidian 插件目錄：');
console.log('   - main.js');
console.log('   - main.js.map');
console.log('   - manifest.json');
console.log('   - styles.css');
console.log('');
console.log('2. 插件目錄範例：');
console.log('   Windows: %APPDATA%\\Obsidian\\{vault-name}\\.obsidian\\plugins\\obsidian-window-spaces\\');
console.log('   macOS: ~/Library/Application Support/Obsidian/{vault-name}/.obsidian/plugins/obsidian-window-spaces/');
console.log('   Linux: ~/.config/obsidian/{vault-name}/.obsidian/plugins/obsidian-window-spaces/');
console.log('');
console.log('3. 重新啟動 Obsidian 並在設置中啟用插件');
