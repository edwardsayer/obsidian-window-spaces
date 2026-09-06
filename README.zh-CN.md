# Window Spaces — Obsidian 窗口工作区管理插件

<div align="center">

> **告别拥挤的主窗口。将重量级插件与多元工作流，无痛迁移至独立、专注的 Popout 弹出式窗口工作舱。**  
> *独立窗口布局 · Popout 原生活动栏 · Folder Spaces 协同 · 主题边框与视觉标识*

[![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=7C3AED&label=Downloads&query=%24%5B%27window-spaces%27%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)](https://obsidian.md/plugins?id=window-spaces)
[![GitHub Release](https://img.shields.io/github/v/release/edwardsayer/obsidian-window-spaces?color=blue&logo=github)](https://github.com/edwardsayer/obsidian-window-spaces/releases)
[![Obsidian Compatibility](https://img.shields.io/badge/Obsidian-v1.12.7%2B-purple.svg?logo=obsidian)](https://obsidian.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[ English ](README.md) | [ 繁體中文 ](README.zh-TW.md) | [ 简体中文 ](README.zh-CN.md)

---

</div>

## 💡 设计哲学：为你的“万物笔记库”打造无干扰的专注工作舱

Obsidian 灵活的布局与强大的插件生态，让许多人将其视为终极的**“Everything Notebook（万物笔记库）”**。然而，随着笔记库日益庞大与各类实用插件的加入，主窗口往往变得无比拥挤：

- 🗂️ **拥挤不堪的主窗口**：Canvas 白板、Excalidraw 绘图、Dataview 查询仪表板、关系图谱与多栏分屏笔记，都在争夺同一个主窗口的有限空间。
- ⚡ **繁重的语境切换成本**：在项目规划、深度文献研究、日常任务审查之间切换时，必须频繁打乱原有标签页与侧边栏排版。
- 🖥️ **未被充分发挥的多显示器优势**：在多屏或大屏环境下，缺乏一套能将不同窗口的独立布局各自持久保存与快速切换的机制。

**Window Spaces** 作为 Obsidian 的自然、无缝扩展而生。它不是要取代现有布局，而是通过**焦点拦截技术**、**Popout 专属活动栏引擎**与 **Per-Window 独立窗口布局生命周期管控**，让各类重量级插件与复合笔记分屏，无痛迁移至独立的 **Popout 弹出式窗口工作舱（Spaces）**。

主窗口保持简洁干净，不同任务在各自的独立窗口中自由协作、互不干扰。

---

## ⚖️ Obsidian 原生 Workspaces vs. Window Spaces

| 比较维度 | Obsidian 原生 Workspaces | Window Spaces |
| :--- | :--- | :--- |
| **排版管控范围** | 全局覆盖（连同主窗口全部替换） | **Per-Window（独立管理每一个 Popout 弹出式窗口）** |
| **Popout 侧边栏与活动栏** | ❌ 无（仅为简陋标签页窗口） | **✅ 完整原生级左右垂直活动栏与折叠侧边栏** |
| **窗口视觉识别** | ❌ 所有窗口外观一致无区别 | **✅ 4 边沉浸式主题边框、自定义 Logo 与状态栏徽章** |
| **目录脉络隔离** | ❌ 显示全库上万篇杂乱文件树 | **✅ 深度整合 [Folder Spaces](https://github.com/edwardsayer/obsidian-folder-spaces) 锁定特定子目录** |
| **开档路由保护** | 无，主窗口／弹出式窗口的文件标签页与功能检视互相影响 | **✅ 窗口锁定路由技术：开档智能导向中央区；内置（Outline / Backlinks）与社区 View（如 Grid Explorer）多实体独立共存、互不干扰** |
| **双重版面防坍塌保护** | ❌ 关闭最后标签页或视图时容器立即被销毁导致版面崩溃 | **✅ 双重版面防护网：中央关闭最后标签页原地转 New Tab 保留分栏；侧栏最后标签页防删保护** |
| **自动保存粒度** | 仅支持手动保存快照 | **✅ 独立 Per-Space Auto-Save（5 秒防抖 + 关闭即存）** |
| **多显示器几何坐标** | 多 DPI 环境易位移跑位 | **✅ 像素级精确还原坐标，内建显示器拔除防溢出保护** |

---

## 🖼️ 界面预览

| 🗺️ Quartz Studio 工作舱 | 📁 子目录聚焦项目工作舱 |
| :---: | :---: |
| ![Quartz Studio 主展示工作舱](assets/screenshots/01-hero-showcase.png) | ![子目录聚焦项目工作舱](assets/screenshots/02-folder-scoped-cabin.png) |
| *翠绿主题边框、Canvas、架构笔记与即时状态徽章的 Popout 工作舱* | *Folder Space Explorer 将 Apollo 项目文件树锁定在专属工作舱内* |

| 🧭 Popout 活动栏 | 🛡️ 双重版面防护 |
| :---: | :---: |
| ![Popout 活动栏右键菜单](assets/screenshots/03-popout-activity-bar.png) | ![双重版面防护](assets/screenshots/04-layout-guardrails.png) |
| *专属 Popout 中的原生风格活动栏与 View 上下文菜单* | *三栏布局完整保留：中央最后标签页转为 New Tab，侧栏显示防删 Notice* |

| ⚙️ 活动栏设置 | 🎨 Space 外观 |
| :---: | :---: |
| ![活动栏设置](assets/screenshots/05-settings-activity-bar.png) | ![Space 外观设置对话框](assets/screenshots/06-space-appearance-modal.png) |
| *拖拽排序控件与一键从主窗口导入* | *名称、图标、主题色与即时预览，一次建立清晰的 Space 身份* |

| 🧩 统一面板与切换器 |
| :---: |
| ![统一 Window Spaces 面板与切换器](assets/screenshots/07-unified-panels.png) |
| *左侧 Folder Space Explorer、中间与右侧 Window Spaces 面板，以及按 Project／Research／Writing 分组的七个 Space 切换器* |

---

## ✨ 核心特色与近期重磅亮点

### 🪟 1. Popout 弹出式窗口专属活动栏与双侧栏引擎 *(v1.1+ 重磅)*
Obsidian 原生 Popout 弹出式窗口完全没有侧边栏。Window Spaces 为弹出式窗口注入了**原生级左右垂直活动栏（Activity Bar）与折叠侧边栏容器**：
- **可折叠双侧栏**：通过顶部原生风格工具栏按钮或快捷键，自由展开/收合左右侧边栏。
- **右键视图上下文菜单**：直接在活动栏按钮上按右键，可呼出原生右键菜单快速切换/启用/停用各个 View，或切换侧栏与活动栏的可见性。
- **动态视图探索与预热**：直接在 Popout 侧栏嵌入 File Explorer、Bookmarks（书签）、Outline（大纲）、Search（搜索）或第三方插件视图。
- **极度平滑的侧栏调整**：采用精确的 `borderBoxSize` 测量与 1px 变动防护阈值，彻底消除侧边栏拖拽时的回弹与边框缩水现象。
- **设置页拖拽排序与一键导入**：在插件设置中通过直观的拖拽手柄（Drag-to-Reorder）自定义按钮顺序，支持从主窗口侧边栏一键导入常用视图配置；重置设置时安全保留所有已保存的 Spaces。

### 🚀 2. 深度生态协同：与 Folder Spaces 联手打造子目录聚焦工作舱
将 Window Spaces 与姐妹插件 **[Folder Spaces](https://github.com/edwardsayer/obsidian-folder-spaces)** 搭配，实现极佳的**“双层语境隔离（Double Context Isolation）”**：
- **窗口层级隔离**：Window Spaces 管理独立 Popout 弹出式窗口生命周期、多显示器坐标、Popout 活动栏与主题边框。
- **目录脉络锁定**：在 Popout 侧边栏中直接停靠 `Folder Space Explorer`，将文件树严格锁定于指定项目子目录（例如 `Projects/Apollo/`）。
- **智能开档路由**：在限定目录树中点选笔记，Window Spaces 自动拦截并于中央编辑区打开，绝不打乱侧栏排版。
- **项目微型库（Micro-Vault）**：打造宛如为该项目独立开启的专属 IDE，彻底告别全库杂乱。

### 🎨 3. 沉浸式窗口主题边框与标识 *(v1.1+ 核心)*
多显示器窗口堆叠时，再也不会迷失焦点：
- **4 边沉浸式边框（Accent Perimeter Frame）**：以该 Space 的专属主题色绘制窗口边框（窗口最大化时自动隐藏，保持极佳全屏体验）。
- **自定义 Logo 与折角装饰**：自由设定专属 Emoji 或 Lucide 图标，搭配左上角折页（Corner Fold）视觉点缀。
- **状态栏空间徽章**：于 Popout 左下角实时显示当前空间名称与快速存档状态。
- **氛围增强**：窗格调整分隔条带有主题色微光，左右活动栏注入柔和底色。

### 🎯 4. 窗口锁定路由与双重防坍塌保护（Window-Locked Routing & Dual Guardrails）*(v1.2+ 核心技术)*
Obsidian 原生架构以单一主窗口为中心，当在弹出式窗口中打开 Outline、Backlinks 或第三方插件检视（如 Grid Explorer、Notebook Navigator）时，往往会因为全局检索（`getLeavesOfType`）而跳回主窗口、抢夺焦点或互相覆盖。Window Spaces 深度研发了**窗口锁定路由与 Leaf 拦截技术（Window-Locked Routing）**，并加入全方位的版面防坍塌保护：
- **内置与社区 View 多实体独立共存**：突破官方单例限制，让原生核心视图（Outline 大纲、Backlinks 反向链接、Tags 标签、Search 搜索）与社区插件视图（如 Grid Explorer、Notebook Navigator 等）在主窗口与多个弹出式窗口中**同时存在多个独立实体（Multi-Instance Concurrency）**，各自运作、永不抢焦。
- **事件广播与活动文件窗口感知**：精确拦截 `file-open` 事件传递与 `workspace.getActiveFile()`。窗口 A 的大纲与反链只追踪窗口 A 当前阅读的笔记，窗口 B 只追踪窗口 B，彻底解决官方跨窗口联动错乱与画面跳动的陈年痛点。
- **双重版面崩溃防护网（Dual Layout Collapse Guardrails）**：
  - **中央最后标签页原地转 New Tab**：当关闭中央编辑区最后一个标签页时，Window Spaces 会拦截 `detach`，原地将其转换为 Obsidian 原生 New Tab (`empty` view)，防止所属的 `WorkspaceTabs` 容器被销毁导致分栏崩溃或窗口结构失衡。
  - **侧边栏最后标签页防删保护**：尝试关闭侧边栏上的最后一个标签页时，自动阻止关闭并弹出“侧边栏上最后一个标签页不可删除”原生提示，杜绝侧边栏被意外销毁。
- **不可导航视图与 Pinned 标签页智能开档**：中央标签页为不可导航视图（如 Outline 大纲、Canvas 白板、Graph 关系图等）或已 Pin（固定）时，点击文件自动于中央开启新标签页，避免覆盖既有画面或导航失败。
- **版面边界防崩溃**：标签页拖拽防护机制防止标签页在拖拽时误入活动栏而破坏结构；即便特定文件被移动或重命名，仍会以原生空白标签页占位，保留精心设计的分栏比例。

### ⚡ 5. 零抖动还原与多显示器记忆 *(v1.2+ 性能)*
- **Target-Only 局部协调**：还原或切换单一空间时，仅对目标窗口进行更新，绝不抖动或闪烁其他已打开的窗口。
- **几何坐标预定位**：精准记住跨屏幕的窗口像素坐标与尺寸。
- **屏幕溢出防护**：外接显示器拔除时自动校正窗口坐标，确保窗口永远在可视范围内生成。
- **启动自动对齐**：Obsidian 重启时自动重新配对既有弹出式窗口并还原空间名称与外观标记。

### 🔄 6. Per-Space 独立自动保存
- **无感后台同步**：可为特定 Space 开启 `🔄 自动保存`。工作过程中的分栏调整与打开标签页，会在后台以 5 秒防抖自动更新，并在关闭窗口时立即快照存档。
- **模板手动防护**：固定标准模板可关闭自动保存，避免临时微调污染模板结构。

### 🗂️ 7. 3+1 原生界面与 Section 分组管理
- **弹性停靠位置**：管理面板可自由停靠于**左侧边栏**、**右侧边栏**、**编辑区标签页（Tab）**，或通过 **Ribbon 图标与快捷键** 呼出快速浮动对话框。
- **Section 分组与归档**：支持将 Spaces 依照项目分类分组、拖拽排序、双击重命名，并支持一键归档（`📦 归档空间`）。
- **悬停内容预览**：光标悬停即可实时预览该空间收录的文件列表与固定结构。

---

## 🚀 典型工作空间场景（Space Workflows）

| 工作空间场景 | 布局与插件组合 | 核心优势与适用情境 |
| :--- | :--- | :--- |
| 🚀 **Scoped Project Cabin**<br>*(Folder Spaces 协同)* | **Popout 侧边栏**：`Folder Space Explorer` 锁定 `/Projects/Apollo/`<br>+ **中央编辑区**：固定 Canvas 白板与规格笔记双栏 | **零杂乱项目微型库**：侧栏仅展示该项目目录下的文件；开档自动路由至中央编辑区，打造项目专属 IDE。 |
| 🗺️ **Project Map & Workbench** | 左侧固定 Canvas 画布 / 总览 + 右侧项目规格笔记 | 架构设计、里程碑规划、交付项目实时追踪。 |
| 🧠 **Deep Research & Literature** | Popout 活动栏（Outline）+ 左侧文献阅读/PDF + 右侧双链卡片笔记 | 沉浸式学术研读、概念串联与知识萃取。 |
| ✍️ **Focus Writing & Showcase** | 纯净 Markdown 编辑区 + 实时样式预览 | 长篇创作、技术专栏写作、发布前校对排版。 |
| ⚙️ **Dev & System Maintenance** | Dataview 查询表格 + 系统设置模板与清单 | 笔记库定期维护、发行检查清单、任务分流。 |

---

## 📥 安装方式

### 从 Obsidian 社区插件市场安装（推荐）
1. 打开 Obsidian **设置** > **社区插件**。
2. 关闭“安全模式”，点击“浏览”。
3. 搜索 **Window Spaces**。
4. 点击“安装”，随后点击“启用”。

### 手动安装
1. 前往 [GitHub Releases](https://github.com/edwardsayer/obsidian-window-spaces/releases) 下载最新版的 `main.js`、`manifest.json` 与 `styles.css`。
2. 在您的 Vault 中建立目录：`<vault>/.obsidian/plugins/window-spaces/`。
3. 将下载的 3 个文件放入该目录中。
4. 重新加载 Obsidian 并在“社区插件”中启用 **Window Spaces**。

---

## 🛠️ 快速上手

### 1. 建立并保存你的第一个 Space
1. 建立一个新弹出式窗口（按 `Ctrl/Cmd + Shift + N` 或将任何标签页拖拽出来）。
2. 排版好你所需的分屏视图（例如：左侧 Canvas、右侧 Markdown 笔记，或展开侧边栏）。
3. 按 `Ctrl/Cmd + P` 打开命令面板，运行 **`Window Spaces: Save current Space`**。
4. 输入名称，挑选专属 Emoji/图标与主题边框颜色，并可开启自动保存。

### 2. 还原与管理 Space
- 通过左侧 **Ribbon 图标**、侧边栏或运行 **`Window Spaces: Open as popup window`** 打开面板。
- **`点击` 或 `Enter`**：立即在新弹出式窗口中打开该 Space。
- **`Shift + 点击` 或 `Shift + Enter`**：将该 Space 应用覆盖至当前的弹出式窗口。
- 点击右侧菜单（`...` 或右键）可随时开启 **自动保存 🔄**、重命名、编辑或删除。

---

## ⌨️ 快捷键一览

| 操作动作 | 快捷键 / 触发方式 | 说明 |
| :--- | :--- | :--- |
| **打开 Spaces 弹出式窗口** | 可于 Obsidian 快捷键设置 | 快速呼叫浮动切换与管理对话框 |
| **于新弹出式窗口打开** | `Enter` / 单击鼠标左键 | 于独立新窗口中还原选取的 Space |
| **应用至当前窗口** | `Shift + Enter` / `Shift + 单击` | 将选取的 Space 加载至当前弹出式窗口 |
| **快速选取导航** | `↑` / `↓` 方向键 | 在 Spaces 清单中上下移动选取项目 |
| **关闭 / 离开** | `Escape` | 关闭对话框或退出搜索焦点 |

---

## 🤝 大型社区插件协同工作指南

Window Spaces 与社区中许多强大且占空间的插件（如 **Excalidraw**、**Excalibrain**、**Canvas**、**Dataview**、**Notebook Navigator** 等）能达成良好的窗口隔离协同效果。

详细整合案例与多窗口工作流示范，请参阅：

📖 **[完整使用手册与插件协同工作指南](docs/user-guide.zh-CN.md)**

---

## 💻 系统兼容性

- **Obsidian 版本需求**：`v1.12.7` 或以上
- **支持平台**：桌面端（Windows, macOS, Linux）
- **开源协议**：MIT License
