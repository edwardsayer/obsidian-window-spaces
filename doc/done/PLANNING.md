# Obsidian Window Spaces Plugin - 開發規劃文檔

## 1. 項目概述

### 1.1 功能描述
開發一個 Obsidian 外掛，專門用於保存和恢復通過 "New window" 命令開啟的獨立視窗佈局。

### 1.2 核心需求
- ✅ 保存當前活動視窗的完整狀態（佈局、文件、視圖）
- ✅ 用戶手動命名保存的佈局
- ✅ 通過命令面板（Quick Command）恢復保存的佈局
- ✅ 僅保存當前活動視窗，而非所有視窗

### 1.3 使用場景
- 研究：同時開啟多個相關文獻進行對比
- 寫作：分離草稿和參考資料
- 多任務：不同項目的獨立工作環境
- 演示：預設特定的佈局進行展示

## 2. 技術研究總結

### 2.1 Obsidian API 分析
- **"New window" = popout window**：通過 "New window" quick command 和 "Open in new window" 開啟的視窗都是 popout window
- **核心 API**：
  - `app.workspace.getLayout()` - 獲取完整工作區佈局
  - `app.workspace.changeLayout()` - 應用保存的佈局
  - `app.workspace.openPopoutLeaf()` - 創建新視窗
  - `app.workspace.activeLeaf` - 獲取當前活動 leaf
- **事件監聽**：
  - `app.workspace.on('layout-change')` - 佈局變化
  - `app.workspace.on('window-open')` - 新視窗開啟

### 2.2 新視窗限制
- **無 ribbon 區**：新視窗預設沒有 ribbon、side panel 等 UI 元素
- **操作限制**：無法通過 ribbon 圖標觸發，需要命令面板或快捷鍵
- **識別挑戰**：需要通過 API 準確識別當前活動視窗

### 2.3 現有外掛案例分析
基於 obsidian-workspaces-plus 的研究：
- 使用 monkey-around 技術攔截原生工作區 API
- 通過 `app.internalPlugins.getPluginById("workspaces")` 獲取原生工作區插件
- 使用 debounce 技術避免過度保存
- 支持文件覆蓋和模板變數

## 3. 系統架構設計

### 3.1 數據結構定義

```typescript
interface WindowLayout {
  id: string;
  name: string;
  timestamp: number;
  windowState: {
    size: { width: number; height: number };
    position?: { x: number; y: number };
  };
  workspace: {
    layout: Record<string, unknown>;
    activeFile?: string;
    leaves: ViewState[];
  };
  metadata: {
    fileCount: number;
    createdAt: string;
    obsidianVersion: string;
  };
}

interface ViewState {
  id: string;
  type: string;
  state: {
    file?: string;
    mode?: string;
    // 其他視圖狀態
  };
}

interface WindowSettings {
  layouts: WindowLayout[];
  autoSave: boolean;
  showNotifications: boolean;
}
```

### 3.2 核心類別設計

```typescript
class WindowLayoutManager {
  private plugin: WindowSpacesPlugin;
  private settings: WindowSettings;

  constructor(plugin: WindowSpacesPlugin) {
    this.plugin = plugin;
  }

  // 核心功能
  async saveCurrentLayout(name: string): Promise<WindowLayout>
  async restoreLayout(layoutId: string): Promise<void>
  getSavedLayouts(): WindowLayout[]
  deleteLayout(layoutId: string): Promise<void>
  
  // 輔助功能
  private getCurrentWindowState(): WindowState
  private captureLayoutData(): Record<string, unknown>
  private applyLayoutData(layout: WindowLayout): Promise<void>
  private validateLayout(layout: WindowLayout): boolean
}

class WindowSpacesPlugin extends Plugin {
  manager: WindowLayoutManager;
  settings: WindowSettings;

  async onload() {
    await this.loadSettings();
    this.manager = new WindowLayoutManager(this);
    this.registerCommands();
    this.addSettingTab(new WindowSpacesSettingTab(this));
  }
}
```

### 3.3 存儲策略
- **主要存儲**：使用 Obsidian 的 `plugin.loadData()` 和 `plugin.saveData()`
- **數據格式**：JSON 格式，包含版本信息以便未來升級
- **備份機制**：自動備份最近 N 個佈局

## 4. 詳細實現計劃

### 4.1 階段一：核心功能實現（1-2週）

#### 4.1.1 開發環境設置
```bash
# 創建項目結構
mkdir obsidian-window-spaces
cd obsidian-window-spaces
npm init -y
npm install --save-dev obsidian typescript rollup @rollup/plugin-typescript
```

#### 4.1.2 項目文件結構
```
obsidian-window-spaces/
├── src/
│   ├── main.ts              # 主插件文件
│   ├── manager.ts           # 佈局管理器
│   ├── types.ts             # 類型定義
│   ├── settings.ts          # 設定頁面
│   ├── modals/
│   │   ├── saveModal.ts     # 保存佈局對話框
│   │   └── restoreModal.ts # 恢復佈局對話框
│   └── utils/
│       ├── capture.ts       # 佈局捕獲工具
│       └── apply.ts         # 佈局應用工具
├── manifest.json           # 插件清單
├── package.json           # 依賴配置
├── tsconfig.json         # TypeScript 配置
├── src/tools/rollup.config.js # 打包配置
└── styles.css            # 樣式文件
```

#### 4.1.3 核心功能實現
1. **佈局捕獲功能**
   ```typescript
   async captureCurrentLayout(): Promise<WindowLayout> {
     const layout = this.app.workspace.getLayout();
     const activeLeaf = this.app.workspace.activeLeaf;
     const windowInfo = this.getCurrentWindowInfo();
     
     return {
       id: generateId(),
       name: '', // 用戶稍後輸入
       timestamp: Date.now(),
       windowState: windowInfo,
       workspace: {
         layout,
         activeFile: activeLeaf?.view?.file?.path,
         leaves: this.extractLeavesFromLayout(layout)
       },
       metadata: {
         fileCount: this.countOpenFiles(layout),
         createdAt: new Date().toISOString(),
         obsidianVersion: this.app.version
       }
     };
   }
   ```

2. **佈局恢復功能**
   ```typescript
   async restoreLayout(layout: WindowLayout): Promise<void> {
     // 創建新視窗
     const newLeaf = this.app.workspace.openPopoutLeaf({
       width: layout.windowState.size.width,
       height: layout.windowState.size.height,
       position: layout.windowState.position
     });
     
     // 應用佈局
     await this.app.workspace.changeLayout(layout.workspace.layout);
     
     // 恢復文件狀態
     await this.restoreFileStates(layout.workspace.leaves);
     
     // 調整視窗位置
     if (layout.windowState.position) {
       this.adjustWindowPosition(layout.windowState.position);
     }
   }
   ```

### 4.2 階段二：用戶界面開發（1週）

#### 4.2.1 命令面板集成
```typescript
registerCommands() {
  // 保存當前視窗佈局
  this.addCommand({
    id: 'save-current-window-layout',
    name: 'Save current window layout',
    callback: () => this.showSaveLayoutModal()
  });

  // 恢復視窗佈局
  this.addCommand({
    id: 'restore-window-layout',
    name: 'Restore window layout',
    callback: () => this.showRestoreLayoutModal()
  });

  // 快速恢復特定佈局（動態生成）
  this.generateRestoreCommands();
}
```

#### 4.2.2 設定頁面
```typescript
class WindowSpacesSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 佈局管理區域
    this.createLayoutManagementSection(containerEl);
    
    // 一般設定區域
    this.createGeneralSettingsSection(containerEl);
    
    // 快捷鍵設定區域
    this.createHotkeySection(containerEl);
  }

  private createLayoutManagementSection(containerEl: HTMLElement) {
    containerEl.createEl('h2', { text: 'Saved Layouts' });
    
    this.plugin.manager.getSavedLayouts().forEach(layout => {
      const setting = new Setting(containerEl)
        .setName(layout.name)
        .setDesc(`Created: ${new Date(layout.timestamp).toLocaleString()}`)
        .addButton(button => button
          .setButtonText('Restore')
          .onClick(() => this.plugin.manager.restoreLayout(layout.id)))
        .addButton(button => button
          .setButtonText('Delete')
          .onClick(() => this.deleteLayout(layout.id)));
    });
  }
}
```

#### 4.2.3 快捷鍵支持
```typescript
// 建議快捷鍵
// Ctrl/Cmd + Shift + S: 保存當前視窗
// Ctrl/Cmd + Shift + R: 恢復視窗佈局
// Ctrl/Cmd + Shift + L: 顯示佈局列表
```

### 4.3 階段三：進階功能（1-2週）

#### 4.3.1 佈局預覽功能
- 顯示佈局的縮略圖或文字描述
- 展示包含的文件列表
- 顯示視窗大小和位置信息

#### 4.3.2 導入/導出功能
```typescript
async exportLayout(layoutId: string): Promise<void> {
  const layout = this.manager.getLayout(layoutId);
  const exportData = {
    version: '1.0',
    layout,
    exportedAt: new Date().toISOString()
  };
  
  const content = JSON.stringify(exportData, null, 2);
  await this.app.vault.create(`layout-${layout.name}.json`, content);
}

async importLayout(filePath: string): Promise<void> {
  const content = await this.app.vault.read(filePath);
  const importData = JSON.parse(content);
  
  if (this.validateImportData(importData)) {
    await this.manager.saveLayout(importData.layout);
    new Notice('Layout imported successfully');
  }
}
```

#### 4.3.3 錯誤處理和用戶提示
- 佈局驗證機制
- 友好的錯誤訊息
- 操作確認對話框
- 自動修復常見問題

## 5. 技術挑戰與解決方案

### 5.1 新視窗操作限制
**問題**：新視窗沒有 ribbon 區，無法通過圖標觸發保存

**解決方案**：
- 主要通過快捷鍵 `Ctrl/Cmd + Shift + S` 觸發
- 命令面板搜索 "save window layout"
- 考慮添加右鍵菜單選項（如果 API 支持）

### 5.2 視窗識別問題
**問題**：如何準確識別當前活動視窗

**解決方案**：
```typescript
getCurrentActiveWindow(): Window {
  const activeLeaf = this.app.workspace.activeLeaf;
  const allLeaves = this.app.workspace.getLeaves();
  
  // 通過比較 leaf 對象的 window 引用來確定當前視窗
  for (const leaf of allLeaves) {
    if (leaf === activeLeaf) {
      return leaf.containerEl.ownerDocument.defaultView;
    }
  }
  
  return window; // fallback to main window
}
```

### 5.3 佈局數據完整性
**問題**：確保保存的佈局數據完整且可恢復

**解決方案**：
- 保存完整的 `getLayout()` 數據
- 記錄視窗大小、位置和狀態
- 驗證文件路徑的有效性
- 添加版本檢查和兼容性處理

### 5.4 跨平台兼容性
**問題**：不同操作系統的視窗管理差異

**解決方案**：
- 檢測操作系統類型
- 調整視窗位置計算方式
- 處理不同系統的快捷鍵差異

## 6. 開發環境與工具鏈

### 6.1 開發工具配置
```json
// package.json
{
  "scripts": {
    "dev": "rollup -c -w",
    "build": "rollup -c",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src/**/*.ts"
  },
  "devDependencies": {
    "@rollup/plugin-typescript": "^8.0.0",
    "@types/node": "^16.0.0",
    "eslint": "^8.0.0",
    "obsidian": "latest",
    "prettier": "^2.0.0",
    "rollup": "^2.0.0",
    "typescript": "^4.0.0"
  }
}
```

### 6.2 TypeScript 配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": false,
    "moduleResolution": "node",
    "importHelpers": true,
    "declaration": true,
    "outDir": "lib",
    "typeRoots": ["node_modules/@types"]
  },
  "include": ["**/*.ts"]
}
```

### 6.3 測試策略
```typescript
// 單元測試示例
describe('WindowLayoutManager', () => {
  let manager: WindowLayoutManager;
  let mockPlugin: jest.Mocked<WindowSpacesPlugin>;

  beforeEach(() => {
    mockPlugin = createMockPlugin();
    manager = new WindowLayoutManager(mockPlugin);
  });

  test('should capture current layout correctly', async () => {
    const layout = await manager.captureCurrentLayout();
    expect(layout).toHaveProperty('id');
    expect(layout).toHaveProperty('windowState');
    expect(layout).toHaveProperty('workspace');
  });

  test('should restore layout successfully', async () => {
    const mockLayout = createMockLayout();
    await expect(manager.restoreLayout(mockLayout)).resolves.not.toThrow();
  });
});
```

## 7. 時間線與里程碑

### 7.1 開發階段
| 階段 | 時間 | 主要交付物 | 成功標準 |
|------|------|------------|----------|
| 階段一 | 第1-2週 | 核心保存/恢復功能 | 能夠保存和恢復基本佈局 |
| 階段二 | 第3週 | 用戶界面 | 完整的命令面板和設定頁面 |
| 階段三 | 第4-5週 | 進階功能 | 預覽、導入/導出、錯誤處理 |
| 測試 | 第6週 | 全面測試 | 通過所有測試用例 |
| 發布 | 第7週 | 發布準備 | 文檔、打包、提交 |

### 7.2 風險評估
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| API 變更 | 高 | 中 | 使用穩定的 API，添加版本檢查 |
| 視窗識別問題 | 中 | 高 | 多種識別方法，fallback 機制 |
| 性能問題 | 中 | 低 | 異步處理，debounce 技術 |
| 兼容性問題 | 高 | 低 | 多平台測試，漸進式功能 |

## 8. 附錄

### 8.1 參考資源
- [Obsidian API 文檔](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [obsidian-workspaces-plus 源碼](https://github.com/jsmorabito/obsidian-workspaces-plus)
- [Obsidian 插件開發最佳實踐](https://publish.obsidian.md/plugins)

### 8.2 API 清單
```typescript
// 關鍵 API 使用清單
✅ app.workspace.getLayout()
✅ app.workspace.changeLayout()
✅ app.workspace.openPopoutLeaf()
✅ app.workspace.activeLeaf
✅ app.workspace.getLeaves()
✅ app.workspace.on('layout-change')
✅ plugin.loadData()
✅ plugin.saveData()
✅ plugin.addCommand()
✅ plugin.addSettingTab()
```

### 8.3 最佳實踐清單
- ✅ 使用 TypeScript 進行類型安全
- ✅ 實現適當的錯誤處理
- ✅ 添加用戶友好的通知
- ✅ 使用 debounce 避免過度操作
- ✅ 實現數據驗證
- ✅ 添加單元測試
- ✅ 編寫清晰的文檔
- ✅ 遵循 Obsidian 插件指南

---

## 下一步行動

1. **確認規劃**：審查並確認這份開發規劃
2. **環境設置**：創建項目結構和開發環境
3. **開始實現**：從階段一的核心功能開始
4. **持續測試**：每個階段完成後進行充分測試

這份規劃提供了完整的技術路線圖和實現細節。有任何需要調整或補充的地方嗎？
