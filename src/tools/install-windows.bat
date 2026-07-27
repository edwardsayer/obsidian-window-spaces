@echo off
chcp 65001 >nul
echo 正在安裝 Window Spaces 插件到測試環境...

REM 設置目標目錄（請根據你的實際路徑修改）
set TARGET_DIR=E:\vaults\test-vault\.obsidian\plugins\obsidian-window-spaces
set ROOT_DIR=%~dp0..\..

REM 創建目標目錄
if not exist "%TARGET_DIR%" (
    echo 創建目標目錄: %TARGET_DIR%
    mkdir "%TARGET_DIR%"
)

REM 複製必要文件
echo 複製插件文件...
copy "%ROOT_DIR%main.js" "%TARGET_DIR%\" >nul 2>&1 && echo ✅ main.js
copy "%ROOT_DIR%manifest.json" "%TARGET_DIR%\" >nul 2>&1 && echo ✅ manifest.json  
copy "%ROOT_DIR%styles.css" "%TARGET_DIR%\" >nul 2>&1 && echo ✅ styles.css
copy "%ROOT_DIR%main.js.map" "%TARGET_DIR%\" >nul 2>&1 && echo ✅ main.js.map

echo.
echo 🎉 安裝完成！
echo.
echo 📝 下一步：
echo 1. 打開 Obsidian
echo 2. 打開你的 test-vault（或實際的 vault）
echo 3. 前往 設置 > 第三方插件
echo 4. 找到 "Window Spaces" 並啟用它
echo 5. 使用 Ctrl+P 打開命令面板，搜索 "Window Spaces"
echo.
pause
