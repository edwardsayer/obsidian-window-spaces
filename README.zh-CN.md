# Window Spaces - Obsidian 插件

为 Obsidian 弹出窗口（Popout Window）保存与还原窗口布局。以高性能与零 DOM 抖动，无缝管理多窗口工作区。

---

## 🌐 Language / 语言

[ English ](README.md) | [ 繁體中文 ](README.zh-TW.md) | [ 简体中文 ](README.zh-CN.md)

---

### 💡 为什么选择 Window Spaces？（与原生 Workspaces 比较）

Obsidian 内置的 **Workspaces** 插件是针对 **「全局应用状态」** 设计的——只要还原一个 Workspace，就会 **强制覆盖整个 Obsidian 界面**（关闭当前所有浮动窗口，替换主窗口与左右侧边栏）。

而 **Window Spaces** 是专为 **「单个弹出窗口 (Popout Window)」** 打造的布局管理插件：
- 🎯 **零干扰主窗口**：仅捕捉与还原指定 Popout 窗口内的状态，完全不干扰主窗口与侧边栏工作流。
- 🖥️ **多显示器工作者福音**：可在副显示器、第二窗口中随心放置参考文献、Kanban 面板或任务笔记，随时独立切换布局。
- 🚀 **弹性开启新窗口**：普通点击布局（或按 `Enter`）即可随时将任何保存好的 Space 在「全新 Popout 窗口」中打开。
- 🔄 **Per-Layout 独立自动保存**：针对特定布局独立开启 🔄 自动保存，享有 5 秒静默 Debounce 与关闭窗口实时快照。

| 功能项目 | 🏛️ Obsidian 原生 Workspaces | 🪟 Window Spaces (本插件) |
| :--- | :--- | :--- |
| **作用范围 (Scope)** | **全局 (Global)**：干扰并覆盖主窗口与侧边栏 | **窗口级 (Window-Scoped)**：仅作用于单个弹出窗口，零干扰主窗口 |
| **多屏支持 (Multi-Monitor)** | ❌ 差。还原时会强制破坏所有屏幕布局 | ✅ 极佳。各屏幕独立窗口可保有专属 Space 布局 |
| **新窗口还原 (Spawn New)** | ❌ 无法。永远强行覆盖当前窗口组合 | ✅ **普通点击或按 `Enter` 即可在全新独立窗口打开** |
| **自动保存 (Auto-Save)** | ❌ 全局手动保存或粗暴覆盖 | ✅ **Per-layout 🔄 独立自动保存** (5秒 Debounce) |
| **智能命名 (Smart Naming)** | ❌ 仅能手动输入名称 | ✅ **Pinned 优先智能命名** (`置顶笔记 & 焦点笔记`) |
| **悬停预览 (Hover Preview)** | ❌ 无内容预览 | ✅ **Hover Tooltip 文件列表悬停预览** |
| **缺失文件保护 (Missing Files)** | ❌ 文件删除/改名时标签页崩塌 | ✅ **原生空 Tab 结构保持**，不破坏版面 |

### ✨ 核心特性
- **Popout 窗口完整捕捉**：精确保存分屏、Tab 页面、焦点笔记、编辑模式与窗口几何坐标。
- **Pinned 优先智能命名**：自动优先提取置顶笔记 (`pinned: true`) 与焦点笔记生成直观名称。
- **情境感知还原 (Context-Aware)**：普通点击（或按 `Enter`）会在全新独立窗口中打开；按住 `Shift`（或 `Shift + Enter`）则应用至当前 active Popout 窗口。
- **Per-Layout 独立自动保存**：针对特定布局开启 🔄 自动保存，具备 5 秒 Debounce 静默更新与窗口关闭实时快照。
- **整合式快速切换与管理弹窗**：实时搜索、Hover 文件列表悬停预览、⚙️ 6 维度排序菜单、重命名与删除。
- **原生安全防护与边界校正**：自动防止显示器变更导致窗口丢失，并拦截 0 文件空白布局覆盖。

### 🖼️ 界面截图

| 多窗口工作区 | 弹出窗口 | 侧边栏面板 |
| :---: | :---: | :---: |
| ![多窗口工作区](screenshots/multi-workspaces.png) | ![弹出窗口](screenshots/popup.png) | ![侧边栏面板](screenshots/sidebar.png) |

### 📥 安装说明

#### 社区插件商店安装 (推荐，申请中)
1. 打开 Obsidian **设置** > **社区插件**。
2. 搜索 **Window Spaces**。
3. 点击 **安装** 并启用插件。

#### 手动安装
1. 至 GitHub Release 下载最新的 `main.js`、`styles.css` 与 `manifest.json`。
2. 复制到 `<你的 Vault>/.obsidian/plugins/window-spaces/`。
3. 重新加载 Obsidian 并于设置中启用。

### 🚀 使用指南

#### 1. 保存当前窗口布局
- 在弹窗中打开命令面板 (`Ctrl/Cmd + P`)。
- 搜索并执行 `Window Spaces: 保存当前窗口布局`。
- 使用默认智能名称或输入名称后按 `Enter`。

#### 2. 打开窗口布局
- 执行 `Window Spaces: 打开窗口布局`。
- 在列表中直接点击布局，或按 `Enter`，会在新的 Popout 窗口应用布局。
- 按住 `Shift` 点击布局，或按 `Shift + Enter`，会应用至当前 active Popout 窗口。
- 通过下拉菜单 (∨) 切换自动保存、重命名、编辑或删除布局。
- 下方「[使用案例与工作流](#使用案例与工作流)」提供项目、研究、Canvas、Tasks、写作、会议与开发工作区完整示例。

### 🚀 使用案例与工作流

把每个已保存的 Space 视为可重复召回的 **「工作舱」(Work Cabin)**，用于项目、研究主题、工作阶段或周期性流程：

- **基本模式**：左侧置顶导航视图（Base、Canvas 或 Tasks），右侧放置正在处理的文件；置顶导航视图后，点击文件不会替换导航视图。以项目或流程名称保存此配置。
- **项目控制中心** (`Project — Map & Workbench`)：左侧为置顶的 Base 地图，右侧为项目首页、规格与会议记录。
- **研究文献工作舱** (`Research — Literature Review`)：左侧为文献 Base，右侧为阅读笔记与待解决的研究问题。
- **Canvas 视觉规划** (`Planning — Canvas & Notes`)：左侧 Canvas 掌握整体关系与概念地图，右侧编辑规格与决策文件。
- **Tasks 周期管理** (`Weekly Review — Tasks & Notes`、`Daily Focus`)：左侧为 Tasks 查询（今日、逾期或本周任务），右侧为日记、周回顾与任务来源文件。
- **写作与内容制作** (`Writing — Draft & References`)：左侧为内容 Base，中间为当前草稿，右侧为参考资料与编辑检查清单。
- **会议与决策** (`Meeting — Agenda & Actions`)：左侧为会议 Base 与议程，右侧为会议记录，另设 Tasks 分屏追踪后续行动项目。
- **软件开发** (`Dev — Issue Triage`、`Dev — Implementation`、`Dev — Code Review`、`Dev — Release`)：左侧为 Issue / Feature Base，右侧为技术规格、实现笔记与测试记录。

保存后，单击（或按 `Enter`）即可在全新 Popout 窗口还原整个工作舱；按住 `Shift` 点击（或按 `Shift + Enter`）则应用至当前 active 的 Popout 窗口。

### ⌨️ 键盘操作
- 插件没有预设指令快捷键；可在 Obsidian 快捷键设置中自行为 `打开窗口布局` 指令指定快捷键。
- 列表中按 `Enter` 会在新 Popout 恢复，按 `Shift + Enter` 会在当前 active Popout 恢复。

### 💻 兼容性
- **Obsidian 版本**: `v0.15.0+`
- **支持平台**: 仅限桌面版 (Windows, macOS, Linux)
