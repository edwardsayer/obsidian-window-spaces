# Window Spaces 用户手册与插件协同工作指南

Language: [English](user-guide.md) | [繁體中文](user-guide.zh-TW.md) | **简体中文**

> **Window Spaces** 旨在为 Obsidian“万物笔记库（Everything Notebook）”的用户提供一套无干扰、轻量且高效的多窗口管理架构。通过独立的 Popout 弹出式窗口工作舱（Spaces），你可以将重量级插件与繁复的排版分离至独立窗口，彻底释放拥挤的主画面。

---

## 目录

1. [核心架构与设计哲学](#1-核心架构与设计哲学)
2. [界面入口与四大互动模式](#2-界面入口与四大互动模式)
   - [2.1 侧边栏模式（Sidebar Panel）](#21-侧边栏模式sidebar-panel)
   - [2.2 标签页模式（Tab Panel）](#22-标签页模式tab-panel)
   - [2.3 快速弹出式对话框（Quick Popup Modal）](#23-快速弹出式对话框quick-popup-modal)
   - [2.4 Popout 弹出式窗口活动栏与右键视图管理](#24-popout-弹出式窗口活动栏与右键视图管理)
3. [焦点拦截与全键盘操作流](#3-焦点拦截与全键盘操作流)
4. [Per-Window 自动保存与双重版面防坍塌保护](#4-per-window-自动保存与双重版面防坍塌保护)
   - [4.1 独立自动保存（5 秒防抖 + 关闭即存）](#41-独立自动保存5-秒防抖--关闭即存)
   - [4.2 双重版面崩溃防护网（Dual Layout Collapse Guardrails）](#42-双重版面崩溃防护网dual-layout-collapse-guardrails)
   - [4.3 不可导航视图与 Pinned 标签页智能开档](#43-不可导航视图与-pinned-标签页智能开档)
5. [社区重量级插件协同工作流示范](#5-社区重量级插件协同工作流示范)
   - [5.1 Folder Spaces 子目录聚焦工作舱（双层语境隔离）](#51-folder-spaces-子目录聚焦工作舱双层语境隔离)
   - [5.2 Excalidraw 视觉构思工作舱](#52-excalidraw-视觉构思工作舱)
   - [5.3 Excalibrain 互动式知识图谱工作舱](#53-excalibrain-互动式知识图谱工作舱)
   - [5.4 Obsidian Canvas 项目看板与白板](#54-obsidian-canvas-项目看板与白板)
   - [5.5 Dataview / Projects 数据仪表板](#55-dataview--projects-数据仪表板)
   - [5.6 Notebook Navigator / GridExplorer 结构化导航](#56-notebook-navigator--gridexplorer-结构化导航)
6. [空间自订、视觉标签与排序](#6-空间自订视觉标签与排序)
7. [备份、导出与跨设备同步](#7-备份导出与跨设备同步)
8. [常见问题与故障排除（FAQ）](#8-常见问题与故障排除faq)

---

## 1. 核心架构与设计哲学

### 为什么需要 Window Spaces？
Obsidian 的生态极为蓬勃，但当我们开启越来越多功能时，主窗口往往被各种边栏、标签页和画布挤满。
- **主窗口拥挤**：Canvas、Excalidraw、Dataview 各自都需要很大的屏幕空间。
- **情境切换干扰**：在研究、写作、项目管理之间切换时，往往必须重新排列窗口与标签页。
- **多屏幕浪费**：多屏幕环境下，缺乏一套能将不同窗口的独立布局各自持久保存与快速切换的机制。

Window Spaces 的定位是 **Obsidian 的自然扩展**：它专注于管理每一个独立 Popout 弹出式窗口（Popout Window）的布局生命周期，不干扰主窗口，让每个窗口成为专属的“工作舱”。

![Quartz Studio 主展示工作舱](../assets/screenshots/01-hero-showcase.png)
*Quartz Studio 以翠绿主题边框、Canvas、架构笔记与即时状态徽章组成完整的 Popout 工作舱。*

---

## 2. 界面入口与四大互动模式

Window Spaces 提供高度整合且一致的操作界面：

### 2.1 侧边栏模式（Sidebar Panel）
- **开启方式**：在命令面板执行 `Window Spaces: Open in left sidebar` 或 `Open in right sidebar`。
- **特点**：常驻于侧边栏，紧贴文件清单，随时点击切换不同工作空间。

![统一 Window Spaces 面板与切换器](../assets/screenshots/07-unified-panels.png)
*统一示例中，左侧是 Folder Space Explorer，中间与右侧都可使用 Window Spaces 面板。*

### 2.2 标签页模式（Tab Panel）
- **开启方式**：执行 `Window Spaces: Open as tab panel`。
- **特点**：在主编辑区以一个独立标签页展开，适合大屏幕综览所有已保存的 Spaces、进行批量整理与重新命名。

### 2.3 快速弹出式对话框（Quick Popup Modal）
- **开启方式**：点击左侧功能列的 Ribbon 图标（版面图标），或自定义快捷键触发 `Window Spaces: Open as popup window`。
- **特点**：轻量级浮动窗口，支持键盘快速搜索，用完即走。

*统一示例前景的切换器提供七个 Space，并按 Project、Research、Writing 分组，适合快速键盘检索。*

### 2.4 Popout 弹出式窗口活动栏与右键视图管理
Window Spaces 为每一个独立的 Popout 弹出式窗口注入了原生级活动栏与侧边栏引擎：
- **可折叠双侧栏与平滑调整**：点击活动栏顶部的折叠按钮或使用快捷键即可展开/收合左右侧边栏；调整宽度时采用 `borderBoxSize` 精准测量与 1px 变动防护阈值，彻底解决拖拽回弹与边框缩水。
- **活动栏右键上下文菜单**：直接在活动栏图标上按鼠标右键，即可呼出菜单快速切换/启用/停用各个 View，或控制左右侧栏与活动栏的可见性。
- **设置页一键导入与安全重置**：在插件设置中可通过拖拽手柄（Drag-to-Reorder）调整活动栏顺序，并支持点击“从主窗口侧边栏导入”一键同步主窗口侧栏布局；“重置设置”仅还原设置选项为出厂默认值，完整保留使用者已保存的所有 Spaces。

![Popout 活动栏右键菜单](../assets/screenshots/03-popout-activity-bar.png)
*在 Popout 活动栏图标上点击右键，即可使用原生风格的 View 与侧栏控制。*

![活动栏设置](../assets/screenshots/05-settings-activity-bar.png)
*设置页提供拖拽排序与一键从主窗口导入的控件。*

---

## 3. 焦点拦截与全键盘操作流

Window Spaces 采用**精确焦点拦截技术**，让你在完全不使用鼠标的情况下极速切换工作空间：

| 按键 | 操作效果 | 说明 |
| :--- | :--- | :--- |
| `↑` / `↓` | 移动选取项目 | 在工作空间清单中快速上下游走 |
| `Enter` | **于新窗口开启** | 将选取的 Space 于全新的 Popout 弹出式窗口中展开 |
| `Shift + Enter` | **应用至当前窗口** | 将选取的 Space 直接载入至当前的窗口中 |
| `Esc` | 关闭面板 / 退出焦点 | 关闭浮动窗口或退出搜索焦点 |

> **安全机制**：方向键与快捷操作仅在 Window Spaces 面板获得焦点时生效；当你在编辑笔记、搜索笔记库或使用其他插件时，Window Spaces 绝不拦截任何键盘事件。

---

## 4. Per-Window 自动保存与双重版面防坍塌保护

### 4.1 独立自动保存（5 秒防抖 + 关闭即存）
每一个 Space 都可以独立设定是否开启 **`🔄 自动保存（Auto-Save）`**：
1. **5 秒防抖（Debounce）更新**：当你在工作舱内开启新标签页、调整垂直/水平分割比例时，Window Spaces 会在背景自动记录最新状态。
2. **关闭窗口即时快照**：当你关闭 Popout 弹出式窗口时，系统会立即进行最后一次状态快照，确保任何细微调整都不会遗失。
3. **手动模式保护**：若某些 Space 是固定的标准范本（例如：每日审查样板），可关闭自动保存，避免临时的操作改动了范本。

### 4.2 双重版面崩溃防护网（Dual Layout Collapse Guardrails）
在复杂的多分栏或侧边栏环境下，Obsidian 原生机制容易因为标签页关闭而连带摧毁容器，导致版面崩溃。Window Spaces 深度研发了双重拦截防护机制：
- **中央内容区最后标签页原地转换为 New Tab (`empty` view)**：
  在中央内容区中，若某个分割窗格只剩最后一个标签页，当使用者点击关闭标签页（或通过快捷键关闭）时，Window Spaces 会拦截 `WorkspaceLeaf.prototype.detach`，在该标签页原地将其 view 替换为 Obsidian 原生的 New Tab（空白标签页），完整保留该分栏的 `WorkspaceTabs` 容器与分割比例，防止整个分栏或相邻布局崩溃。
- **侧边栏最后标签页防删保护**：
  在 Popout 侧边栏（Left / Right Sidebar）中，若使用者尝试关闭最后一个标签页，系统会拦截 `detach` 动作并主动阻止关闭，同时在画面右上角弹出原生 Notice 提示：**“侧边栏上最后一个标签页不可删除”**，彻底杜绝侧栏容器被销毁造成布局结构异常。

![双重版面防护](../assets/screenshots/04-layout-guardrails.png)
*同一个三栏 Popout 中，中央最后标签页转为原生 New Tab，右侧侧栏保持完整并显示防删 Notice。*

### 4.3 不可导航视图与 Pinned 标签页智能开档
在弹出式窗口的侧边栏（如 File Explorer、Bookmarks 或 Folder Spaces Explorer）点击文件时，Window Spaces 会执行智能开档路由：
- **中央编辑区优先**：点选笔记永远精准导向至中央内容区，永不覆盖或破坏侧边栏既有的功能视图。
- **不可导航与固定保护（Navigation Fallback）**：若中央当前活动中的标签页为**不可导航视图**（如 Outline 大纲、Canvas 白板、Graph 关系图等）或是已被**固定（Pinned）**的笔记标签页，直接在其上载入文件会导致导航失败或画面被洗掉。Window Spaces 会自动侦测并于中央编辑区**新建独立标签页（New Tab）**打开文件，兼顾操作流畅性与画面安全。

---

## 5. 社区重量级插件协同工作流示范

### 5.1 Folder Spaces 子目录聚焦工作舱（双层语境隔离）
- **痛点**：即使将笔记拖至 Popout 弹出式窗口，左侧的原生 File Explorer 依然充斥着整个笔记库数万篇文件与深层文件夹，极易造成视觉干扰与分心。
- **工作流配置**：
  - 安装并启用 **[Folder Spaces](https://github.com/edwardsayer/obsidian-folder-spaces)** 插件。
  - 在 Popout 弹出式窗口的 Left Activity Bar 中，将视图设定为 `Folder Space Explorer`，并锁定于特定项目子目录（例如 `Projects/Apollo/`）。
  - 中央编辑区排版为 Canvas 白板与 Markdown 规格笔记。
  - 命名为 `🚀 Apollo Project`，挑选翠绿色边框与火箭 Emoji，并开启自动保存。
- **协同优势**：
  - **双层语境隔离**：窗口层级独立排版，文件层级仅呈现该项目所需的目录树。
  - **智能开档路由**：在 Folder Space 树状列表中点击任何文件，皆会自动于中央编辑区打开，绝不替换或打乱侧栏视图。

![子目录聚焦项目工作舱](../assets/screenshots/02-folder-scoped-cabin.png)
*Folder Space Explorer 将可见文件树限制在 Apollo 项目，同时保留 Window Spaces 的完整工作舱布局。*

### 5.2 Excalidraw 视觉构思工作舱
- **痛点**：Excalidraw 需要宽广的画布，若与笔记挤在主窗口，笔记阅读区会被压缩得极小。
- **工作流配置**：
  - 建立一个名为 `🎨 Sketch & Brainstorm` 的 Popout Space。
  - 左侧 60% 开启 Excalidraw 画布，右侧 40% 分割为文字笔记。
  - 画布上绘制架构图，右侧直接记录关联想法与双向链接。

### 5.3 Excalibrain 互动式知识图谱工作舱
- **痛点**：Excalibrain 在导航庞大关联时需要动态渲染全局与局部关系图，占用大量主窗口面板。
- **工作流配置**：
  - 建立 `🧠 Excalibrain — Knowledge Graph` 独立窗口。
  - 将其放置于副屏幕，随着主窗口聚焦不同笔记，副屏幕的工作舱即时呈现周边脉络。

### 5.4 Obsidian Canvas 项目看板与白板
- **痛点**：Canvas 包含大量卡片与连接线，频繁放大缩小容易打乱工作节奏。
- **工作流配置**：
  - 建立 `🗺️ Project — Map & Workbench` 工作舱。
  - 左侧钉选 Canvas（包含需求分组、颜色标签、任务卡片），右侧开启正在执行的具体规格笔记。
  - 通过钉选（Pin）保护 Canvas 标签页，在右侧点击卡片链接时，永远在右侧标签页开启，不覆盖画布。

### 5.5 Dataview / Projects 数据仪表板
- **痛点**：复杂的 Dataview 表格或 Projects 看板需要较大宽度才能完整展示字段。
- **工作流配置**：
  - 建立 `📊 Dashboard — Metrics & Triage` 窗口。
  - 上半部为 Dataview 待办与进度查询表，下半部为快速记录区。

### 5.6 Notebook Navigator / GridExplorer 结构化导航
- **痛点**：多层级树状结构或网格目录插件在侧边栏往往过于拥挤。
- **工作流配置**：
  - 建立专属的导航工作空间，将导航检索与深度内容阅读双栏并列。

---

## 6. 空间自订、视觉标签与排序

- **自定义图标与 Emoji**：可在建立或编辑 Space 时指定专属 Emoji（如 🗺️、🧠、✍️、⚙️）或 Lucide 图标。
- **颜色预设集（Color Presets）**：支持多种主题颜色标记，便于在清单中快速辨识工作类型。
- **分类与标签（Tags / Folders）**：可将 Spaces 依照项目、日常、研究等分类归纳。
- **6 种维度排序**：通过齿轮菜单（⚙️）可依自定义顺序、名称（A-Z / Z-A）、标签页数量、建立时间等维度即时排序。

![Space 外观设置对话框](../assets/screenshots/06-space-appearance-modal.png)
*外观对话框将 Space 名称、图标、主题色与即时预览集中在同一处。*

---

## 7. 备份、导出与跨设备同步

- **本地配置文件**：Window Spaces 的所有设定与空间数据均存放于 `.obsidian/plugins/window-spaces/data.json`。
- **批量导出**：在插件设定中点击“Export Spaces”，可导出标准 JSON 格式。
- **批量导入**：在不同电脑或新笔记库中，可通过“Import Spaces”一键导入预设的工作舱布局。

---

## 8. 常见问题与故障排除（FAQ）

### Q1: 为什么点击 Space 没有开新窗口，而是跳转到已有窗口？
**A**: 这是 Window Spaces 的智能防重复机制。若该 Space 已经在某个 Popout 弹出式窗口中开启，再次点击会直接聚焦至该窗口，避免在画面上产生多个重复的工作窗口。

### Q2: 如果我拔除外接屏幕，窗口会不会跑到屏幕外面去？
**A**: 不会。Window Spaces 内置屏幕边界安全校正算法，当侦测到屏幕分辨率改变或外接屏幕中断时，会自动将窗口安全置中于主显示器。

### Q3: 空白标签页（Empty Tab）的作用是什么？
**A**: 若某个 Space 包含的文件被移动或重命名，Window Spaces 会以 Obsidian 原生空白标签页占位，保留原本精心设计的分栏布局架构，避免版面直接崩塌。

### Q4: 为什么关闭中央编辑区的最后一个标签页时，会原地变成 New Tab 而不是直接关闭分栏？
**A**: 这是 Window Spaces 的版面防崩溃保护机制（Central Tab Guard）。Obsidian 原生架构在关闭分栏中最后一个标签页时，会直接销毁整个 `WorkspaceTabs` 容器，导致原本精心调校的多栏分割排版瞬间瓦解。Window Spaces 拦截 detach 并原地转换为干净的 New Tab，完整保全窗口布局结构。

### Q5: 为什么在侧边栏尝试关闭最后一个标签页时会提示“侧边栏上最后一个标签页不可删除”？
**A**: 这是侧边栏防删保护（Sidebar Guard）。Obsidian 原生侧边栏若被移除了所有 Leaf，侧栏容器可能陷入无效状态。Window Spaces 通过主动拦截保护侧栏容器的完整性。若暂时不需要侧边栏，只需点击顶部活动栏的折叠按钮收合即可。

### Q6: 为什么在 Outline 大纲或 Canvas 画布活动中时，点选侧栏文件会自动开新标签页？
**A**: 像 Outline、Canvas 或已 Pin（固定）的标签页属于“不可导航或受保护”的视图，原生直接在其中导航文件可能会失败或破坏当前的工作画面。Window Spaces 会自动辨识并智能引导至中央内容区新开标签页。
