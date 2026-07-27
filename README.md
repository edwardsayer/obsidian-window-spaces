# Window Spaces - Obsidian Plugin

Save and restore window layouts for Obsidian popout windows. Seamlessly manage multi-window workspaces with high performance and zero DOM jitter.

---

## 🌐 Language / 語言 / 言語 / Idioma / Langue / اللغة / Sprache / Язык

[ English ](#-english) | [ 繁體中文 ](#-繁體中文) | [ 簡體中文 ](#-簡體中文) | [ 日本語 ](#-日本語) | [ Español ](#-español) | [ Français ](#-français) | [ العربية ](#-العربية) | [ Deutsch ](#-deutsch) | [ Русский ](#-русский)

---

## 🇬🇧 English

### 💡 Why Window Spaces? (vs. Native Workspaces)

Obsidian's built-in **Workspaces** plugin is designed for **global application state**—restoring a workspace overwrites your entire Obsidian setup (closing all open windows and replacing your main layout).

**Window Spaces** is purpose-built for **individual popout windows**:
- 🎯 **Zero Main Window Interference**: Captures and restores layouts *only* within a target popout window without touching your main workspace or sidebars.
- 🖥️ **Multi-Monitor Friendly**: Keep separate reference windows, Kanban boards, or research notes on secondary displays and swap their layouts independently.
- 🚀 **Spawn New Windows on Demand**: Click normally (or press `Enter`) to restore any saved layout into a brand-new popout window instantly.
- 🔄 **Per-Layout Auto-Save**: Enable auto-save individually on specific layouts with 5s debounce protection and window-close instant snapshot.

| Feature | 🏛️ Native Workspaces | 🪟 Window Spaces |
| :--- | :--- | :--- |
| **Scope** | **Global**: Overwrites main window & all sidebars | **Window-Scoped**: Affects only the target popout window |
| **Multi-Monitor** | ❌ Destroys setups across all screens | ✅ Manages individual screens independently |
| **Spawn New Window** | ❌ Always overwrites current layout | ✅ Click normally or press `Enter` to open in a new window |
| **Auto-Save** | ❌ Global manual save / hard overwrite | ✅ **Per-layout 🔄 auto-save** with 5s debounce |
| **Smart Naming** | ❌ Manual typing only | ✅ **Pinned-first smart name** (`Pinned Note & Active Note`) |
| **Hover Preview** | ❌ No content preview | ✅ **File list tooltips** on hover before restoring |
| **Layout Integrity** | ❌ Missing files cause tab collapses | ✅ **Native empty tabs** preserve pane shapes |

### ✨ Key Features
- **Popout Window Preservation**: Captures splits, tabs, active file, view modes, and exact window dimensions/position.
- **Smart Layout Naming**: Automatically generates intuitive names based on pinned files and active notes (`Pinned Note & Active Note`).
- **Context-Aware Restoration**: Click normally (or press `Enter`) to spawn a new popout window; hold `Shift` (or press `Shift + Enter`) to restore directly into the current popout window.
- **Per-Layout Auto-Save**: Toggle 🔄 auto-save on specific layouts with a 5-second debounced background update and immediate save on window close.
- **Unified Quick-Switch & Management Modal**: Search layouts in real-time, view hover file tooltips, sort by 6 dimensions (gear menu ⚙️), rename, edit, auto-save, or delete.
- **Safe Placement & Guardrails**: Prevents off-screen windows on monitor changes and guards against accidental 0-file layout overwrites.

### 📥 Installation

#### From Community Plugins (Recommended — Application Pending)
1. Open Obsidian **Settings** > **Community plugins**.
2. Search for **Window Spaces**.
3. Click **Install** and then **Enable**.

#### Manual Installation
1. Download `main.js`, `styles.css`, and `manifest.json` from the latest GitHub Release.
2. Copy them to `<your-vault>/.obsidian/plugins/obsidian-window-spaces/`.
3. Reload Obsidian and enable **Window Spaces** in settings.

### 🚀 Usage

#### 1. Save Window Layout
- Open the command palette (`Ctrl/Cmd + P`) in any popout window.
- Run `Window Spaces: Save current window layout`.
- Enter a name or use the auto-generated smart name, then press `Enter`.

#### 2. Open Window Layouts
- Run `Window Spaces: Open window layouts`.
- Select a layout from the unified restore and management dialog.
- Click a layout normally, or press `Enter`, to restore it in a new popout window.
- Hold `Shift` while clicking a layout, or press `Shift + Enter`, to restore it in the current active popout window.
- Access dropdown options (∨) to toggle auto-save, rename, edit, or delete saved layouts.
- See [Use Cases & Workflows](doc/USE_CASES.md) for project, research, Canvas, Tasks, writing, meeting, and development workspace examples.

### ⌨️ Keyboard Shortcuts
- No default command shortcuts are assigned. You can assign an optional shortcut to `Window Spaces: Open window layouts` in Obsidian's Hotkeys settings.
- Within the layout list, `Enter` restores in a new popout and `Shift + Enter` restores in the current active popout.

### 💻 Compatibility
- **Obsidian Version**: `v0.15.0+`
- **Platform**: Desktop only (Windows, macOS, Linux)

---

## 🇹🇼 繁體中文

### 💡 為什麼選擇 Window Spaces？（與原生 Workspaces 比較）

Obsidian 原生內建的 **Workspaces** 外掛是針對 **「全域應用程式狀態」** 設計的——只要還原一個 Workspace，就會 **強制覆蓋整個 Obsidian 介面**（關閉目前所有浮動視窗，替換主視窗與左右側邊欄）。

而 **Window Spaces** 是專為 **「單一彈出視窗 (Popout Window)」** 打造的靈魂外掛：
- 🎯 **零干擾主視窗**：僅捕捉與還原指定 Popout 視窗內的狀態，完全不影響主視窗與側邊欄工作流。
- 🖥️ **多螢幕工作者救星**：可以在副螢幕、第二視窗中隨心放置參考文獻、Kanban 面板或任務筆記，隨時獨立切換佈局。
- 🚀 **彈性開新視窗**：一般點擊佈局（或按 `Enter`）即可隨時將任何保存好的 Space 在「全新 Popout 視窗」中開啟。
- 🔄 **Per-Layout 獨立自動保存**：針對特定佈局獨立開啟 🔄 自動儲存，享 5 秒靜默 Debounce 與關閉視窗實時快照。

| 功能項目 | 🏛️ Obsidian 原生 Workspaces | 🪟 Window Spaces (本外掛) |
| :--- | :--- | :--- |
| **作用範圍 (Scope)** | **全域 (Global)**：干擾並覆蓋主視窗與側邊欄 | **視窗級 (Window-Scoped)**：僅作用於單一彈出視窗，零干擾主視窗 |
| **多螢幕支援 (Multi-Monitor)** | ❌ 差。還原時會強制破壞所有螢幕佈局 | ✅ 極佳。各螢幕獨立視窗可保有專屬 Space 佈局 |
| **開新視窗還原 (Spawn New)** | ❌ 無法。永遠強行覆蓋當前視窗組合 | ✅ **一般點擊或按 `Enter` 即可在全新獨立視窗開啟** |
| **自動保存 (Auto-Save)** | ❌ 全域手動儲存或粗暴覆寫 | ✅ **Per-layout 🔄 獨立自動儲存** (5秒 Debounce) |
| **智慧命名 (Smart Naming)** | ❌ 僅能手動輸入名稱 | ✅ **Pinned 優先智慧命名** (`釘選筆記 & 焦點筆記`) |
| **懸停預覽 (Hover Preview)** | ❌ 無內容預覽 | ✅ **Hover Tooltip 檔案清單懸停預覽** |
| **缺失檔案保護 (Missing Files)** | ❌ 檔案刪除/改名時分頁崩塌 | ✅ **原生空 Tab 結構保持**，不破壞版面 |

### ✨ 核心功能
- **Popout 視窗完整捕捉**：精確保存分割區塊、Tab 頁面、焦點筆記、編輯模式與視窗幾何座標。
- **Pinned 優先智慧命名**：自動優先擷取釘選筆記 (`pinned: true`) 與焦點筆記生成直覺名稱。
- **情境感知還原 (Context-Aware)**：一般點擊（或按 `Enter`）會在全新獨立視窗中開啟；按住 `Shift`（或 `Shift + Enter`）則套用至目前 active Popout 視窗。
- **Per-Layout 獨立自動保存**：針對特定佈局開啟 🔄 自動儲存，具備 5 秒 Debounce 靜默更新與視窗關閉實時快照。
- **整合式快速切換與管理視窗**：即時搜尋、Hover 檔案清單懸停預覽、⚙️ 6 維度排序選單、重命名與刪除。
- **原生安全防護與邊界校正**：自動防止螢幕組態變更導致視窗失蹤，並阻絕 0 檔案空白佈局覆寫。

### 📥 安裝說明

#### 社群外掛商店安裝 (推薦，申請中)
1. 開啟 Obsidian **設定** > **社群外掛**。
2. 搜尋 **Window Spaces**。
3. 點擊 **安裝** 並啟用外掛。

#### 手動安裝
1. 至 GitHub Release 下載最新的 `main.js`、`styles.css` 與 `manifest.json`。
2. 解開至 `<你的 Vault>/.obsidian/plugins/obsidian-window-spaces/`。
3. 重新載入 Obsidian 並於設定中啟用。

### 🚀 使用指南

#### 1. 保存當前視窗佈局
- 在彈出視窗中開啟命令面板 (`Ctrl/Cmd + P`)。
- 搜尋並執行 `Window Spaces: 保存當前視窗佈局`。
- 使用預設智慧名稱或自行輸入名稱後按 `Enter`。

#### 2. 開啟視窗佈局
- 執行 `Window Spaces: 開啟視窗佈局`。
- 在清單中直接點擊佈局，或按 `Enter`，會在新的 Popout 視窗套用佈局。
- 按住 `Shift` 點擊佈局，或按 `Shift + Enter`，會套用至目前 active 的 Popout 視窗。
- 透過下拉選單 (∨) 切換自動保存、重命名、編輯或刪除佈局。
- 詳細案例與工作流請參閱 [Use Cases & Workflows](doc/USE_CASES.md)。

### ⌨️ 鍵盤操作
- 外掛沒有預設指令快捷鍵；可在 Obsidian 快捷鍵設定中自行為 `開啟視窗佈局` 指令指定快捷鍵。
- 清單中按 `Enter` 會在新 Popout 還原，按 `Shift + Enter` 會在目前 active Popout 還原。

### 💻 相容性
- **Obsidian 版本**: `v0.15.0+`
- **支援平台**: 僅限桌面版 (Windows, macOS, Linux)

---

## 🇨🇳 简体中文

### 简介
**Window Spaces** 是一款专为 Obsidian 独立弹窗（Popout Window）打造的高性能布局管理插件。与影响全局的 Workspaces 不同，Window Spaces 能精准捕捉并还原单个浮动窗口的完整状态——包含分屏标签、打开文件、视图模式、窗口大小与屏幕坐标。

### ✨ 核心特性
- **Popout 窗口完整捕捉**：精确保存分屏、Tab 页面、焦点笔记、编辑模式与窗口几何坐标。
- **Pinned 优先智慧命名**：自动优先提取置顶笔记 (`pinned: true`) 与焦点笔记生成直观名称。
- **情境感知还原 (Context-Aware)**：普通点击（或按 `Enter`）会在全新独立窗口中打开；按住 `Shift`（或 `Shift + Enter`）则应用至当前 active Popout 窗口。
- **Per-Layout 独立自动保存**：针对特定布局开启 🔄 自动保存，具备 5 秒 Debounce 静默更新与窗口关闭实时快照。
- **整合式快速切换与管理弹窗**：实时搜索、Hover 文件列表悬停预览、⚙️ 6 维度排序菜单、重命名与删除。
- **原生安全防护与边界校正**：自动防止显示器变更导致窗口遗失，并拦截 0 文件空白布局覆写。

### 📥 安装说明

#### 社区插件商店安装 (推荐，申请中)
1. 打开 Obsidian **设置** > **社区插件**。
2. 搜索 **Window Spaces**。
3. 点击 **安装** 并启用插件。

#### 手动安装
1. 至 GitHub Release 下载最新的 `main.js`、`styles.css` 与 `manifest.json`。
2. 复制到 `<你的 Vault>/.obsidian/plugins/obsidian-window-spaces/`。
3. 重新加载 Obsidian 并于设置中启用。

### 🚀 使用指南

#### 1. 保存当前窗口布局
- 在弹窗中打开命令面板 (`Ctrl/Cmd + P`)。
- 搜索并执行 `Window Spaces: 保存当前窗口布局`。
- 使用默认智慧名称或输入名称后按 `Enter`。

#### 2. 打开窗口布局
- 执行 `Window Spaces: 打开窗口布局`。
- 在列表中直接点击布局，或按 `Enter`，会在新的 Popout 窗口应用布局。
- 按住 `Shift` 点击布局，或按 `Shift + Enter`，会应用至当前 active Popout 窗口。
- 通过下拉菜单 (∨) 切换自动保存、重命名、编辑或删除布局。
- 更多项目、研究、Canvas、Tasks、写作、会议与开发工作流示例，请参阅 [Use Cases & Workflows](doc/USE_CASES.md)。

### ⌨️ 键盘操作
- 插件没有预设指令快捷键；可在 Obsidian 快捷键设置中自行为 `打开窗口布局` 指令指定快捷键。
- 列表中按 `Enter` 会在新 Popout 恢复，按 `Shift + Enter` 会在当前 active Popout 恢复。

### 💻 兼容性
- **Obsidian 版本**: `v0.15.0+`
- **支持平台**: 仅限桌面版 (Windows, macOS, Linux)

---

## 🇯🇵 日本語

### 概要
**Window Spaces** は、Obsidian のポップアウトウィンドウ（「新しいウィンドウで開く」）専用の高性能レイアウトマネージャープラグインです。全体に影響する標準の Workspaces とは異なり、個々のポップアウトウィンドウの分割、タブ、開いているファイル、表示モード、ウィンドウサイズ、画面座標を完全に保存・復元できます。

### ✨ 主な機能
- **ポップアウトウィンドウの完全保存**: 分割パネル、タブ、アクティブファイル、表示モード、サイズと位置を完璧に保存。
- **スマート命名機能**: ピン留めされたノート（`pinned: true`）やアクティブなノートから自動的に直感的な名前を生成。
- **コンテキストアウェア復元**: 通常クリック（または `Enter`）で新しいポップアウトウィンドウに復元。`Shift` キー（または `Shift + Enter`）を押すと現在のアクティブなウィンドウに復元。
- **レイアウトごとの自動保存**: 選択したレイアウトで 🔄 自動保存を有効化。5秒間のデバウンス更新とウィンドウ終了時の即時保存に対応。
- **統合クイック切替＆管理モーダル**: リアルタイム検索、ホバーファイルリストプレビュー、⚙️ 6次元ソート、名前変更、削除。
- **安全配置と保護ガイドレール**: マルチモニター環境の変化による画面外表示を防止し、ファイル数0の誤上書きをガード。

### 📥 インストール

#### コミュニティプラグインから（推奨・申請中）
1. Obsidian の **設定** > **コミュニティプラグイン** を開きます。
2. **Window Spaces** を検索します。
3. **インストール** をクリックし、**有効化** します。

### 🚀 使い方
- コマンドパレットから `Window Spaces: Open window layouts` を実行します。
- レイアウトを通常クリックするか `Enter` を押すと、新しい Popout ウィンドウに復元します。
- `Shift` を押しながらクリックするか `Shift + Enter` を押すと、現在のアクティブな Popout ウィンドウに復元します。
- 各レイアウトの下矢印メニュー (∨) から、自動保存、名前変更、編集、削除を実行できます。
- 詳細な使用例とワークフローは [Use Cases & Workflows](doc/USE_CASES.md) を参照してください。

### ⌨️ キーボード操作
- コマンドにデフォルトのショートカットはありません。必要に応じて Obsidian のホットキー設定で割り当ててください。

---

## 🇪🇸 Español

### Descripción general
**Window Spaces** es un potente administrador de diseños para ventanas emergentes (Popout Windows) en Obsidian. A diferencia de los espacios de trabajo globales, captura y restaura el estado completo de ventanas emergentes individuales: divisiones, pestañas, archivos abiertos, vista activa, tamaño y coordenadas de pantalla.

### ✨ Características principales
- **Preservación de ventanas emergentes**: Captura pestañas, divisiones, archivo activo, modo de vista y dimensiones exactas.
- **Nombres inteligentes**: Genera nombres basados en notas fijadas (`pinned: true`) y el archivo activo.
- **Restauración contextual**: Haz clic normalmente (o pulsa `Enter`) para abrir en una nueva ventana emergente; mantén presionado `Shift` (o pulsa `Shift + Enter`) para restaurar en la ventana Popout activa.
- **Auto-guardado por diseño**: Activa el auto-guardado 🔄 en diseños específicos con actualización en segundo plano (5s debounce) y guardado instantáneo al cerrar.
- **Modal de gestión e intercambio rápido**: Búsqueda en tiempo real, vista previa al pasar el ratón, menú de ordenación ⚙️, renombrar y eliminar.

### 📥 Instalación
#### Desde los complementos de la comunidad (recomendado; solicitud pendiente)
1. Abre **Ajustes** de Obsidian > **Complementos de la comunidad**.
2. Busca **Window Spaces**.
3. Haz clic en **Instalar** y después en **Activar**.

### 🚀 Uso
- Ejecuta `Window Spaces: Open window layouts` desde la paleta de comandos.
- Haz clic normalmente en un diseño o pulsa `Enter` para restaurarlo en una nueva ventana Popout.
- Mantén `Shift` al hacer clic o pulsa `Shift + Enter` para restaurarlo en la ventana Popout activa.
- Usa el menú desplegable (∨) de cada diseño para activar el guardado automático, renombrar, editar o eliminarlo.
- Consulta [Use Cases & Workflows](doc/USE_CASES.md) para ver ejemplos de proyectos, investigación, Canvas, Tasks y desarrollo.

### ⌨️ Operación con teclado
- No hay atajos de comando predeterminados; puedes asignarlos en la configuración de teclas rápidas de Obsidian.

---

## 🇫🇷 Français

### Vue d'ensemble
**Window Spaces** est un gestionnaire de disposition haute performance conçu spécifiquement pour les fenêtres surgissantes (Popout Windows) d'Obsidian. Il capture et restaure l'état complet d'une fenêtre individuelle : fenêtres divisées, onglets, fichiers ouverts, modes de vue, dimensions et coordonnées d'écran.

### ✨ Fonctionnalités clés
- **Preservation des fenêtres Popout** : Sauvegarde les onglets, séparations, fichier actif, mode de vue et géométrie exacte.
- **Noms intelligents** : Génère automatiquement des noms basés sur les notes épinglées (`pinned: true`) et le fichier actif.
- **Restauration contextuelle** : Cliquez normalement (ou appuyez sur `Enter`) pour ouvrir dans une nouvelle fenêtre Popout ; maintenez `Shift` (ou appuyez sur `Shift + Enter`) pour restaurer dans la fenêtre Popout active.
- **Sauvegarde automatique par disposition** : Activez la sauvegarde automatique 🔄 sur des dispositions spécifiques avec temporisation de 5s et sauvegarde à la fermeture.
- **Interface unifiée de gestion** : Recherche en temps réel, aperçu au survol, tri à 6 dimensions ⚙️, renommage et suppression.

### 📥 Installation
#### Depuis les plugins communautaires (recommandé ; demande en cours)
1. Ouvrez les **Paramètres** d’Obsidian > **Plugins communautaires**.
2. Recherchez **Window Spaces**.
3. Cliquez sur **Installer**, puis **Activer**.

### 🚀 Utilisation
- Exécutez `Window Spaces: Open window layouts` depuis la palette de commandes.
- Cliquez normalement sur une disposition ou appuyez sur `Enter` pour la restaurer dans une nouvelle fenêtre Popout.
- Maintenez `Shift` en cliquant ou appuyez sur `Shift + Enter` pour la restaurer dans la fenêtre Popout active.
- Utilisez le menu déroulant (∨) de chaque disposition pour activer la sauvegarde automatique, renommer, modifier ou supprimer.
- Consultez [Use Cases & Workflows](doc/USE_CASES.md) pour découvrir des exemples de projets, de recherche, de Canvas, de Tasks et de développement.

### ⌨️ Utilisation du clavier
- Aucun raccourci de commande n'est défini par défaut ; vous pouvez en attribuer un dans les raccourcis d'Obsidian.

---

## 🇦🇪 العربية

### نظرة عامة
إضافة **Window Spaces** هي مدير تخطيط عالي الأداء مخصص للنوافذ المنبثقة (Popout Windows) في Obsidian. تقوم الإضافة بحفظ واستعادة الحالة الكاملة للنوافذ المنبثقة الفردية بما في ذلك التقسيمات، التبويبات، الملفات المفتوحة، حجم النافذة، وإحداثيات الشاشة.

### ✨ الميزات الرئيسية
- **حفظ النوافذ المنبثقة بالكامل**: التقاط التبويبات، التقسيمات، الملف النشط، وضع العرض، وأبعاد النافذة بدقة.
- **تسمية ذكية للتخطيطات**: إنشاء أسماء تلقائية بناءً على الملاحظات المثبتة (`pinned: true`) والملف النشط.
- **استعادة ذكية للسياق**: انقر بشكل عادي (أو اضغط `Enter`) لفتح التخطيط في نافذة منبثقة جديدة؛ اضغط باستمرار على `Shift` (أو اضغط `Shift + Enter`) لاستعادته في نافذة Popout النشطة.
- **حفظ تلقائي مخصص**: تفعيل الحفظ التلقائي 🔄 لتخطيطات محددة مع تحديث مؤجل 5 ثوانٍ وحفظ فوري عند إغلاق النافذة.
- **واجهة إدارة وتبديل سريعة**: بحث فوري، معاينة الملفات عند التمرير، قائمة فرز ⚙️، إعادة تسمية وحذف.

### 📥 التثبيت
#### من الإضافات المجتمعية (موصى به؛ الطلب قيد المراجعة)
1. افتح **الإعدادات** في Obsidian > **الإضافات المجتمعية**.
2. ابحث عن **Window Spaces**.
3. انقر على **تثبيت** ثم **تفعيل**.

### 🚀 الاستخدام
- شغّل `Window Spaces: Open window layouts` من لوحة الأوامر.
- انقر على التخطيط بشكل عادي أو اضغط `Enter` لاستعادته في نافذة Popout جديدة.
- اضغط باستمرار على `Shift` أثناء النقر أو اضغط `Shift + Enter` لاستعادته في نافذة Popout النشطة.
- استخدم القائمة المنسدلة (∨) لكل تخطيط لتفعيل الحفظ التلقائي أو إعادة التسمية أو التعديل أو الحذف.
- راجع [Use Cases & Workflows](doc/USE_CASES.md) للاطلاع على أمثلة المشاريع والبحث وCanvas وTasks والتطوير.

### ⌨️ استخدام لوحة المفاتيح
- لا توجد اختصارات أوامر افتراضية؛ يمكنك تعيين اختصار من إعدادات مفاتيح Obsidian.

---

## 🇩🇪 Deutsch

### Übersicht
**Window Spaces** ist ein leistungsstarker Layout-Manager für Popout-Fenster in Obsidian. Im Gegensatz zu globalen Workspaces speichert und stellt Window Spaces den vollständigen Zustand einzelner Popout-Fenster wieder her – einschließlich geteilter Ansichten, Tabs, geöffneter Dateien, Ansichtsmodi, Fenstergröße und Bildschirmkoordinaten.

### ✨ Hauptmerkmale
- **Vollständige Popout-Erfassung**: Speichert Tabs, Splits, aktive Datei, Ansichtsmodus und genaue Fenstergeometrie.
- **Intelligente Benennung**: Generiert automatisch Namen basierend auf angehefteten Notizen (`pinned: true`) und aktiven Dateien.
- **Kontextsensitive Wiederherstellung**: Klicke normal oder drücke `Enter`, um das Layout in einem neuen Popout-Fenster wiederherzustellen; halte `Shift` gedrückt oder drücke `Shift + Enter`, um es im aktiven Popout-Fenster wiederherzustellen.
- **Automatische Speicherung pro Layout**: 🔄 Auto-Save für bestimmte Layouts aktivieren mit 5s Debounce und sofortiger Speicherung beim Schließen.
- **Kombinierter Schnellumschalter & Manager**: Echtzeitsuche, Hover-Dateivorschau, 6-Dimensionen-Sortierung ⚙️, Umbenennen und Löschen.

### 📥 Installation
#### Aus den Community-Plugins (empfohlen; Antrag ausstehend)
1. Öffne in Obsidian **Einstellungen** > **Community-Plugins**.
2. Suche nach **Window Spaces**.
3. Klicke auf **Installieren** und anschließend auf **Aktivieren**.

### 🚀 Verwendung
- Führe `Window Spaces: Open window layouts` über die Befehlspalette aus.
- Klicke ein Layout normal an oder drücke `Enter`, um es in einem neuen Popout-Fenster wiederherzustellen.
- Halte beim Klicken `Shift` gedrückt oder drücke `Shift + Enter`, um es im aktiven Popout-Fenster wiederherzustellen.
- Über das Dropdown-Menü (∨) jedes Layouts kannst du Auto-Save, Umbenennen, Bearbeiten oder Löschen ausführen.
- Weitere Beispiele und Arbeitsabläufe findest du unter [Use Cases & Workflows](doc/USE_CASES.md).

### ⌨️ Tastaturbedienung
- Es gibt keine standardmäßigen Befehls-Tastenkürzel; du kannst sie in den Obsidian-Hotkeys zuweisen.

---

## 🇷🇺 Русский

### Обзор
**Window Spaces** — это высокопроизводительный менеджер макетов для всплывающих окон (Popout Windows) в Obsidian. В отличие от глобальных рабочих областей, плагин сохраняет и восстанавливает полное состояние отдельных окон: разделения, вкладки, открытые файлы, режим просмотра, размеры и координаты окна.

### ✨ Ключевые возможности
- **Полный захват состояния окна**: Сохранение вкладок, разделений, активного файла, режима просмотра и геометрии окна.
- **Умное именование**: Автоматическое создание имен на основе закрепленных заметок (`pinned: true`) и активного файла.
- **Восстановление с учетом контекста**: Обычный щелчок или клавиша `Enter` открывает макет в новом всплывающем окне; удерживание `Shift` (`Shift + Enter`) восстанавливает его в активном окне Popout.
- **Автосохранение для отдельных макетов**: Включение 🔄 автосохранения с 5-секундной задержкой и мгновенным сохранением при закрытии.
- **Единое окно переключения и управления**: Поиск в реальном времени, предпросмотр файлов при наведении, ⚙️ сортировка по 6 параметрам, переименование и удаление.

### 📥 Установка
#### Из сообщества плагинов (рекомендуется; заявка на рассмотрении)
1. Откройте в Obsidian **Настройки** > **Плагины сообщества**.
2. Найдите **Window Spaces**.
3. Нажмите **Установить**, затем **Включить**.

### 🚀 Использование
- Запустите `Window Spaces: Open window layouts` из палитры команд.
- Обычный щелчок по макету или клавиша `Enter` восстановит его в новом окне Popout.
- Удерживайте `Shift` при щелчке или нажмите `Shift + Enter`, чтобы восстановить макет в активном окне Popout.
- В выпадающем меню (∨) каждого макета доступны автосохранение, переименование, редактирование и удаление.
- Примеры рабочих процессов доступны в [Use Cases & Workflows](doc/USE_CASES.md).

### ⌨️ Управление с клавиатуры
- Команды не имеют сочетаний клавиш по умолчанию; их можно назначить в настройках горячих клавиш Obsidian.
