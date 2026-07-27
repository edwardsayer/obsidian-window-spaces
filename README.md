# Window Spaces - Obsidian Plugin

Save and restore window layouts for Obsidian popout windows. Seamlessly manage multi-window workspaces with high performance and zero DOM jitter.

---

## 🌐 Language / 語言 / 言語 / Idioma / Langue / اللغة / Sprache / Язык

[ English ](#-english) | [ 繁體中文 ](#-繁體中文) | [ 簡體中文 ](#-簡體中文) | [ 日本語 ](#-日本語) | [ Español ](#-español) | [ Français ](#-français) | [ العربية ](#-العربية) | [ Deutsch ](#-deutsch) | [ Русский ](#-русский)

---

## 🇬🇧 English

### Overview
**Window Spaces** is a dedicated layout manager plugin for Obsidian popout windows (created via "New window" or "Open in new window"). Unlike global workspace savers, Window Spaces captures and restores the complete state of individual popout windows—including split panes, tabs, open files, active note, view modes, window size, and screen coordinates.

### ✨ Key Features
- **Popout Window Preservation**: Captures splits, tabs, active file, view modes, and exact window dimensions/position.
- **Smart Layout Naming**: Automatically generates intuitive names based on pinned files and active notes (`Pinned Note & Active Note`).
- **Context-Aware Restoration**: Restores directly into the current popout window, or hold `Shift` (or `Shift + Enter`) to spawn in a new popout window.
- **Per-Layout Auto-Save**: Toggle 🔄 auto-save on specific layouts with a 5-second debounced background update and immediate save on window close.
- **Unified Quick-Switch & Management Modal**: Search layouts in real-time, view hover file tooltips, sort by 6 dimensions (gear menu ⚙️), rename, copy, or delete.
- **Safe Placement & Guardrails**: Prevents off-screen windows on monitor changes and guards against accidental 0-file layout overwrites.

### 📥 Installation

#### From Community Plugins (Recommended)
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
- Run `Window Spaces: Save current window layout` (Shortcut: `Ctrl/Cmd + Shift + S`).
- Enter a name or use the auto-generated smart name, then press `Enter`.

#### 2. Restore Window Layout
- Run `Window Spaces: Restore window layout` (Shortcut: `Ctrl/Cmd + Shift + R`).
- Select a layout from the quick-switch modal.
- Press `Enter` to apply to the current window, or hold `Shift + Enter` to restore in a new popout window.

#### 3. Manage Layouts
- Run `Window Spaces: Manage window layouts` (Shortcut: `Ctrl/Cmd + Shift + L`).
- Access dropdown options (∨) to toggle auto-save, rename, edit, or delete saved layouts.

### ⌨️ Default Shortcuts
- `Ctrl/Cmd + Shift + S`: Save current window layout
- `Ctrl/Cmd + Shift + R`: Quick-switch / Restore layout
- `Ctrl/Cmd + Shift + L`: Manage layouts

### 💻 Compatibility
- **Obsidian Version**: `v0.15.0+`
- **Platform**: Desktop only (Windows, macOS, Linux)

---

## 🇹🇼 繁體中文

### 簡介
**Window Spaces** 是一款專為 Obsidian 獨立彈出視窗（Popout Window）打造的高效能佈局管理外掛。與影響全域的 Workspaces 不同，Window Spaces 能精準捕捉並還原單一浮動視窗的完整狀態——包含分割分頁、開啟檔案、檢視模式、視窗大小與螢幕座標。

### ✨ 核心功能
- **Popout 視窗完整捕捉**：精確保存分割區塊、Tab 頁面、焦點筆記、編輯模式與視窗幾何座標。
- **Pinned 優先智慧命名**：自動優先擷取釘選筆記 (`pinned: true`) 與焦點筆記生成直覺名稱。
- **情境感知還原 (Context-Aware)**：預設還原至當前 Popout 視窗；按住 `Shift`（或 `Shift + Enter`）可在全新獨立視窗中開啟。
- **Per-Layout 獨立自動保存**：針對特定佈局開啟 🔄 自動儲存，具備 5 秒 Debounce 靜默更新與視窗關閉實時快照。
- **整合式快速切換與管理視窗**：即時搜尋、Hover 檔案清單懸停預覽、⚙️ 6 維度排序選單、重命名與刪除。
- **原生安全防護與邊界校正**：自動防止螢幕組態變更導致視窗失蹤，並阻絕 0 檔案空白佈局覆寫。

### 📥 安裝說明

#### 社群外掛商店安裝 (推薦)
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
- 搜尋並執行 `Window Spaces: 保存當前視窗佈局` (快捷鍵: `Ctrl/Cmd + Shift + S`)。
- 使用預設智慧名稱或自行輸入名稱後按 `Enter`。

#### 2. 恢復視窗佈局
- 執行 `Window Spaces: 恢復視窗佈局` (快捷鍵: `Ctrl/Cmd + Shift + R`)。
- 在清單中選擇佈局，按 `Enter` 套用至當前視窗，或按 `Shift + Enter` 在新視窗開啟。

#### 3. 管理佈局
- 執行 `Window Spaces: 管理視窗佈局` (快捷鍵: `Ctrl/Cmd + Shift + L`)。
- 透過下拉選單 (∨) 切換自動保存、重命名、編輯或刪除佈局。

### ⌨️ 預設快捷鍵
- `Ctrl/Cmd + Shift + S`: 保存當前視窗佈局
- `Ctrl/Cmd + Shift + R`: 快速切換 / 復原佈局
- `Ctrl/Cmd + Shift + L`: 顯示佈局管理選單

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
- **情境感知还原 (Context-Aware)**：默认还原至当前 Popout 窗口；按住 `Shift`（或 `Shift + Enter`）可在全新独立窗口中打开。
- **Per-Layout 独立自动保存**：针对特定布局开启 🔄 自动保存，具备 5 秒 Debounce 静默更新与窗口关闭实时快照。
- **整合式快速切换与管理弹窗**：实时搜索、Hover 文件列表悬停预览、⚙️ 6 维度排序菜单、重命名与删除。
- **原生安全防护与边界校正**：自动防止显示器变更导致窗口遗失，并拦截 0 文件空白布局覆写。

### 📥 安装说明

#### 社区插件商店安装 (推荐)
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
- 搜索并执行 `Window Spaces: 保存当前窗口布局` (快捷键: `Ctrl/Cmd + Shift + S`)。
- 使用默认智慧名称或输入名称后按 `Enter`。

#### 2. 恢复窗口布局
- 执行 `Window Spaces: 恢复窗口布局` (快捷键: `Ctrl/Cmd + Shift + R`)。
- 在列表中选择布局，按 `Enter` 应用至当前窗口，或按 `Shift + Enter` 在新窗口打开。

#### 3. 管理布局
- 执行 `Window Spaces: 管理窗口布局` (快捷键: `Ctrl/Cmd + Shift + L`)。
- 通过下拉菜单 (∨) 切换自动保存、重命名、编辑或删除布局。

### ⌨️ 默认快捷键
- `Ctrl/Cmd + Shift + S`: 保存当前窗口布局
- `Ctrl/Cmd + Shift + R`: 快速切换 / 恢复布局
- `Ctrl/Cmd + Shift + L`: 显示布局管理菜单

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
- **コンテキストアウェア復元**: 現在のポップアウトウィンドウに直接復元。`Shift` キー（または `Shift + Enter`）を押すと新しいウィンドウで復元。
- **レイアウトごとの自動保存**: 選択したレイアウトで 🔄 自動保存を有効化。5秒間のデバウンス更新とウィンドウ終了時の即時保存に対応。
- **統合クイック切替＆管理モーダル**: リアルタイム検索、ホバーファイルリストプレビュー、⚙️ 6次元ソート、名前変更、削除。
- **安全配置と保護ガイドレール**: マルチモニター環境の変化による画面外表示を防止し、ファイル数0の誤上書きをガード。

### 📥 インストール

#### コミュニティプラグインから（推奨）
1. Obsidian の **設定** > **コミュニティプラグイン** を開きます。
2. **Window Spaces** を検索します。
3. **インストール** をクリックし、**有効化** します。

### ⌨️ ショートカット
- `Ctrl/Cmd + Shift + S`: 現在のウィンドウレイアウトを保存
- `Ctrl/Cmd + Shift + R`: クイック切替 / レイアウト復元
- `Ctrl/Cmd + Shift + L`: レイアウト管理モーダルを表示

---

## 🇪🇸 Español

### Descripción general
**Window Spaces** es un potente administrador de diseños para ventanas emergentes (Popout Windows) en Obsidian. A diferencia de los espacios de trabajo globales, captura y restaura el estado completo de ventanas emergentes individuales: divisiones, pestañas, archivos abiertos, vista activa, tamaño y coordenadas de pantalla.

### ✨ Características principales
- **Preservación de ventanas emergentes**: Captura pestañas, divisiones, archivo activo, modo de vista y dimensiones exactas.
- **Nombres inteligentes**: Genera nombres basados en notas fijadas (`pinned: true`) y el archivo activo.
- **Restauración contextual**: Restaura en la ventana actual, o mantén presionado `Shift` (o `Shift + Enter`) para abrir en una nueva ventana emergente.
- **Auto-guardado por diseño**: Activa el auto-guardado 🔄 en diseños específicos con actualización en segundo plano (5s debounce) y guardado instantáneo al cerrar.
- **Modal de gestión e intercambio rápido**: Búsqueda en tiempo real, vista previa al pasar el ratón, menú de ordenación ⚙️, renombrar y eliminar.

### ⌨️ Atajos de teclado
- `Ctrl/Cmd + Shift + S`: Guardar diseño de la ventana actual
- `Ctrl/Cmd + Shift + R`: Restauración rápida de diseño
- `Ctrl/Cmd + Shift + L`: Administrar diseños

---

## 🇫🇷 Français

### Vue d'ensemble
**Window Spaces** est un gestionnaire de disposition haute performance conçu spécifiquement pour les fenêtres surgissantes (Popout Windows) d'Obsidian. Il capture et restaure l'état complet d'une fenêtre individuelle : fenêtres divisées, onglets, fichiers ouverts, modes de vue, dimensions et coordonnées d'écran.

### ✨ Fonctionnalités clés
- **Preservation des fenêtres Popout** : Sauvegarde les onglets, séparations, fichier actif, mode de vue et géométrie exacte.
- **Noms intelligents** : Génère automatiquement des noms basés sur les notes épinglées (`pinned: true`) et le fichier actif.
- **Restauration contextuelle** : Appliquez directement dans la fenêtre actuelle, ou maintenez `Shift` (`Shift + Enter`) pour ouvrir dans une nouvelle fenêtre.
- **Sauvegarde automatique par disposition** : Activez la sauvegarde automatique 🔄 sur des dispositions spécifiques avec temporisation de 5s et sauvegarde à la fermeture.
- **Interface unifiée de gestion** : Recherche en temps réel, aperçu au survol, tri à 6 dimensions ⚙️, renommage et suppression.

### ⌨️ Raccourcis clavier
- `Ctrl/Cmd + Shift + S` : Sauvegarder la disposition de la fenêtre
- `Ctrl/Cmd + Shift + R` : Restauration rapide
- `Ctrl/Cmd + Shift + L` : Gérer les dispositions

---

## 🇦🇪 العربية

### نظرة عامة
إضافة **Window Spaces** هي مدير تخطيط عالي الأداء مخصص للنوافذ المنبثقة (Popout Windows) في Obsidian. تقوم الإضافة بحفظ واستعادة الحالة الكاملة للنوافذ المنبثقة الفردية بما في ذلك التقسيمات، التبويبات، الملفات المفتوحة، حجم النافذة، وإحداثيات الشاشة.

### ✨ الميزات الرئيسية
- **حفظ النوافذ المنبثقة بالكامل**: التقاط التبويبات، التقسيمات، الملف النشط، وضع العرض، وأبعاد النافذة بدقة.
- **تسمية ذكية للتخطيطات**: إنشاء أسماء تلقائية بناءً على الملاحظات المثبتة (`pinned: true`) والملف النشط.
- **استعادة ذكية للسياق**: الاستعادة المباشرة في النافذة الحالية، أو الضغط على `Shift` (`Shift + Enter`) لفتح في نافذة منبثقة جديدة.
- **حفظ تلقائي مخصص**: تفعيل الحفظ التلقائي 🔄 لتخطيطات محددة مع تحديث مؤجل 5 ثوانٍ وحفظ فوري عند إغلاق النافذة.
- **واجهة إدارة وتبديل سريعة**: بحث فوري، معاينة الملفات عند التمرير، قائمة فرز ⚙️، إعادة تسمية وحذف.

### ⌨️ اختصارات لوحة المفاتيح
- `Ctrl/Cmd + Shift + S`: حفظ تخطيط النافذة الحالية
- `Ctrl/Cmd + Shift + R`: التبديل السريع / استعادة التخطيط
- `Ctrl/Cmd + Shift + L`: إدارة التخطيطات

---

## 🇩🇪 Deutsch

### Übersicht
**Window Spaces** ist ein leistungsstarker Layout-Manager für Popout-Fenster in Obsidian. Im Gegensatz zu globalen Workspaces speichert und stellt Window Spaces den vollständigen Zustand einzelner Popout-Fenster wieder her – einschließlich geteilter Ansichten, Tabs, geöffneter Dateien, Ansichtsmodi, Fenstergröße und Bildschirmkoordinaten.

### ✨ Hauptmerkmale
- **Vollständige Popout-Erfassung**: Speichert Tabs, Splits, aktive Datei, Ansichtsmodus und genaue Fenstergeometrie.
- **Intelligente Benennung**: Generiert automatisch Namen basierend auf angehefteten Notizen (`pinned: true`) und aktiven Dateien.
- **Kontextsensitive Wiederherstellung**: Stellt das Layout im aktuellen Fenster wieder her oder öffnet es mit `Shift + Enter` in einem neuen Popout-Fenster.
- **Automatische Speicherung pro Layout**: 🔄 Auto-Save für bestimmte Layouts aktivieren mit 5s Debounce und sofortiger Speicherung beim Schließen.
- **Kombinierter Schnellumschalter & Manager**: Echtzeitsuche, Hover-Dateivorschau, 6-Dimensionen-Sortierung ⚙️, Umbenennen und Löschen.

### ⌨️ Tastenkombinationen
- `Ctrl/Cmd + Shift + S`: Aktuelles Fensterlayout speichern
- `Ctrl/Cmd + Shift + R`: Schnellumschaltung / Layout wiederherstellen
- `Ctrl/Cmd + Shift + L`: Layouts verwalten

---

## 🇷🇺 Русский

### Обзор
**Window Spaces** — это высокопроизводительный менеджер макетов для всплывающих окон (Popout Windows) в Obsidian. В отличие от глобальных рабочих областей, плагин сохраняет и восстанавливает полное состояние отдельных окон: разделения, вкладки, открытые файлы, режим просмотра, размеры и координаты окна.

### ✨ Ключевые возможности
- **Полный захват состояния окна**: Сохранение вкладок, разделений, активного файла, режима просмотра и геометрии окна.
- **Умное именование**: Автоматическое создание имен на основе закрепленных заметок (`pinned: true`) и активного файла.
- **Восстановление с учетом контекста**: Применение в текущем окне или удерживание `Shift` (`Shift + Enter`) для открытия в новом всплывающем окне.
- **Автосохранение для отдельных макетов**: Включение 🔄 автосохранения с 5-секундной задержкой и мгновенным сохранением при закрытии.
- **Единое окно переключения и управления**: Поиск в реальном времени, предпросмотр файлов при наведении, ⚙️ сортировка по 6 параметрам, переименование и удаление.

### ⌨️ Сочетания клавиш
- `Ctrl/Cmd + Shift + S`: Сохранить макет текущего окна
- `Ctrl/Cmd + Shift + R`: Быстрое переключение / Восстановление макета
- `Ctrl/Cmd + Shift + L`: Управление макетами
