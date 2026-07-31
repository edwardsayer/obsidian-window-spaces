#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const projectRoot = path.resolve(__dirname, '..', '..');
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'manifest.json'), 'utf8'));

console.log('🚀 Window Spaces 插件安裝向導');

// 獲取操作系統類型
const platform = os.platform();
console.log(`🖥️  檢測到操作系統: ${platform}`);

// 提示用戶輸入 vault 名稱
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('請輸入你的 Obsidian vault 名稱: ', (vaultName) => {
  if (!vaultName.trim()) {
    console.log('❌ Vault 名稱不能為空');
    rl.close();
    return;
  }

  // 根據操作系統確定插件目錄
  let pluginDir;
  switch (platform) {
    case 'win32':
      pluginDir = path.join(process.env.APPDATA, 'Obsidian', vaultName, '.obsidian', 'plugins', manifest.id);
      break;
    case 'darwin':
      pluginDir = path.join(os.homedir(), 'Library', 'Application Support', 'Obsidian', vaultName, '.obsidian', 'plugins', manifest.id);
      break;
    default: // linux
      pluginDir = path.join(os.homedir(), '.config', 'obsidian', vaultName, '.obsidian', 'plugins', manifest.id);
      break;
  }

  console.log(`📁 目標目錄: ${pluginDir}`);

  // 檢查源文件是否存在
  const requiredFiles = ['main.js', 'manifest.json', 'styles.css'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(projectRoot, file)));
  
  if (missingFiles.length > 0) {
    console.log('❌ 缺少以下文件，請先運行 npm run build:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    rl.close();
    return;
  }

  // 創建目標目錄
  try {
    fs.mkdirSync(pluginDir, { recursive: true });
    console.log('✅ 目標目錄已創建');
  } catch (error) {
    console.log('❌ 無法創建目標目錄:', error.message);
    rl.close();
    return;
  }

  // 複製文件
  let successCount = 0;
  requiredFiles.forEach(file => {
    try {
      const targetPath = path.join(pluginDir, file);
      fs.copyFileSync(path.join(projectRoot, file), targetPath);
      console.log(`✅ 已複製: ${file}`);
      successCount++;
    } catch (error) {
      console.log(`❌ 複製失敗 ${file}:`, error.message);
    }
  });

  // 複製 source map（可選）
  try {
    fs.copyFileSync(path.join(projectRoot, 'main.js.map'), path.join(pluginDir, 'main.js.map'));
    console.log('✅ 已複製: main.js.map');
  } catch (error) {
    console.log('⚠️  無法複製 source map（不影響功能）');
  }

  console.log(`\n🎉 安裝完成！成功複製 ${successCount}/${requiredFiles.length} 個文件`);
  console.log('\n📝 下一步：');
  console.log('1. 重新啟動 Obsidian');
  console.log('2. 打開設置 > 第三方插件');
  console.log('3. 啟用 "Window Spaces" 插件');
  console.log('4. 使用命令面板 (Ctrl/Cmd + P) 搜索 "Window Spaces"');

  rl.close();
});
