#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Window Spaces 開發環境啟動');

// 檢查是否已構建
if (!fs.existsSync('main.js')) {
  console.log('📦 首次構建中...');
  spawn('npm', ['run', 'build'], { 
    stdio: 'inherit',
    shell: true 
  }).on('close', (code) => {
    if (code === 0) {
      console.log('✅ 構建完成，啟動開發模式...');
      startDevMode();
    } else {
      console.log('❌ 構建失敗');
    }
  });
} else {
  console.log('🔄 啟動開發模式...');
  startDevMode();
}

function startDevMode() {
  // 啟動 rollup 監視模式
  const devProcess = spawn('npm', ['run', 'watch'], {
    stdio: 'inherit',
    shell: true
  });

  devProcess.on('close', (code) => {
    console.log(`開發模式已結束，退出碼: ${code}`);
  });

  // 處理 Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 正在停止開發模式...');
    devProcess.kill('SIGINT');
  });

  console.log('📝 開發模式已啟動！');
  console.log('📁 監視文件變化，自動重新構建...');
  console.log('💡 提示：將構建的文件複製到 Obsidian 插件目錄進行測試');
  console.log('🔧 使用 Ctrl+C 停止開發模式');
}
