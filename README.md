# Window Spaces - Obsidian Plugin

> **Declutter your main workspace. Transform heavy plugins and multifaceted notes into lightweight, isolated popout work cabins.**

---

## 🌐 Language / 語言

[ English ](README.md) | [ 繁體中文 ](README.zh-TW.md) | [ 简体中文 ](README.zh-CN.md)

---

## 💡 The Philosophy: Free Your Main Workspace

Obsidian’s vibrant plugin ecosystem and malleable layout make it the ultimate **"Everything Notebook"**. But as our vaults grow, so does the chaos:

- 🗂️ **The Crowded Main Window**: Canvas whiteboards, Excalidraw sketches, Dataview dashboards, graph views, and complex note splits all compete for the exact same screen real estate.
- ⚡ **Context Switching Overhead**: Switching between project planning, deep literature research, and daily task review constantly disrupts open tabs, sidebar configurations, and pane splits.
- 🖥️ **Underutilized Multi-Monitors**: Modern workstations have multiple displays, yet managing distinct, persistent layouts across separate windows is difficult.

**Window Spaces** is built as an organic, seamless extension of Obsidian. Instead of cramming everything into a single main window, Window Spaces lets you isolate distinct workflows into dedicated **Popout Work Cabins (Spaces)**.

With **focus interception technology** and **per-window layout lifecycle management**, your heavy plugins, complex splits, and research setups effortlessly transition into independent windows—letting you focus on one task at a time with zero clutter.

---

## 🖼️ Visual Showcase

| 🗺️ Dedicated Popout Workbench | 🗂️ Native Sidebar Panel | 📑 Editor Tab Management |
| :---: | :---: | :---: |
| ![Dedicated Popout Workbench](assets/screenshots/multi-workspaces.png) | ![Sidebar Panel](assets/screenshots/sidebar.png) | ![Tab Panel Mode](assets/screenshots/tab-panel.png) |
| *Visual Canvas + Markdown Split with Status Bar indicator* | *Unified Spaces Picker with Active indicators & Quick Search* | *Full-page Workspace Management inside Editor Tabs* |

---

## ✨ Key Features

### 🪟 Dedicated Popout Work Cabins (Per-Window Layouts)
- **True Window Isolation**: Saves and restores layout splits, active files, pinned tabs, view modes, and exact window coordinates for popout windows without altering your main window.
- **Smart Window Focusing**: Restoring a Space that is already open smoothly focuses its existing window rather than creating a duplicate.
- **Empty-Tab Pane Protection**: Preserves your intended pane layout structures even if some files are temporarily unavailable.

### 🔄 Per-Space Auto-Save
- **Effortless Synchronization**: Toggle `🔄 Auto-save` on any Space. Modifications made during your work session are automatically saved in the background with a 5-second debounce and an instant snapshot on window close.

### ⚡ Context-Aware Rapid Navigation
- **Keyboard-First Navigation**: Press `↑` / `↓` to navigate, `Enter` to spawn in a new popout window, `Shift + Enter` to restore into the active window, and `Esc` to dismiss.
- **Safe Focus Interception**: Keyboard events are cleanly handled when the Spaces panel is focused and never interfere with typing inside notes, search bars, or external modals.

### 🎨 Native 3-in-1 Interface & Visual Customization
- **Flexible Management Locations**: Access your Spaces seamlessly from the **Left/Right Sidebar**, as an **Editor Tab**, or via the **Quick-Popup Modal** (`Ribbon Icon` or `Hotkeys`).
- **Visual Identity**: Personalize each Space with custom emojis or Lucide icons, color badges, tags/categories, and 6 sorting dimensions.
- **Hover Content Preview**: Hover over any Space to instantly preview its included files, active tab, and pinned document structure.

### 🔒 Privacy & Safety Guardrails
- **100% Local & Safe**: All configurations and spaces are stored locally in your vault's plugin directory.
- **Off-Screen Prevention**: Automatically recalculates window coordinates if an external monitor is disconnected, ensuring windows never spawn out of view.
- **JSON Import / Export**: Easily back up or share your workspace presets across multiple devices.

---

## 🚀 Typical Space Workflows

Each Space acts as a specialized **work cabin** tailored to your tasks:

| Space Workflow | Layout Composition | Primary Use Case |
| :--- | :--- | :--- |
| 🗺️ **Project Map & Workbench** | Pinned Canvas/Base on the left + Project specs on the right | High-level system architecture, milestone planning, and active deliverables. |
| 🧠 **Deep Research & Literature** | PDF reader / Literature note + Outline & Zettelkasten splits | Distraction-free academic reading, concept linking, and knowledge synthesis. |
| ✍️ **Focus Writing & Showcase** | Clean markdown editor + Rendered preview / CSS showcase | Deep long-form writing, technical documentation, and publishing workflows. |
| ⚙️ **Dev & System Maintenance** | Dataview queries + Configuration templates & check-lists | Task reviews, vault maintenance, release checklists, and issue triage. |

---

## 📥 Installation

### From Obsidian Community Plugins *(Recommended)*
1. Open Obsidian **Settings** > **Community plugins**.
2. Turn off Restricted mode and click **Browse**.
3. Search for **Window Spaces**.
4. Click **Install**, then click **Enable**.

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub Release](https://github.com/edwardsayer/obsidian-window-spaces/releases).
2. Create a folder named `window-spaces` inside your vault: `<vault>/.obsidian/plugins/window-spaces/`.
3. Move the downloaded files into this folder.
4. Reload Obsidian and enable **Window Spaces** under **Community plugins**.

---

## 🛠️ Quick Start Guide

### 1. Save Your First Space
1. Open a new window (`Ctrl/Cmd + Shift + N` or drag any tab out to pop out).
2. Arrange your split panes (e.g. Canvas on the left, notes on the right).
3. Open the Command Palette (`Ctrl/Cmd + P`) and run **`Window Spaces: Save current Space`**.
4. Give it a name (or use the smart auto-generated suggestion) and assign an icon/color.

### 2. Restore and Manage Spaces
- Open the Spaces panel from the **Ribbon Icon**, the left/right sidebar, or run **`Window Spaces: Open as popup window`**.
- **`Click` or `Enter`**: Instantly launches the Space in a fresh popout window.
- **`Shift + Click` or `Shift + Enter`**: Restores the layout directly into the current window.
- Click the dropdown menu (`...` or right-click) to toggle **Auto-save 🔄**, rename, edit, or delete.

---

## ⌨️ Shortcuts & Hotkeys

| Action | Shortcut / Trigger | Description |
| :--- | :--- | :--- |
| **Open Spaces Modal** | Configurable via Hotkeys | Quick floating modal to switch or launch Spaces |
| **Open in New Window** | `Enter` / Single Click | Spawns the highlighted Space in a new popout window |
| **Apply to Current Window** | `Shift + Enter` / `Shift + Click` | Overwrites the active popout window with the selected Space |
| **Quick Navigate** | `↑` / `↓` Arrow Keys | Move selection up or down within the list |
| **Dismiss / Close** | `Escape` | Closes the modal or search focus |

---

## 🤝 Ecosystem Synergy & Heavy Plugins

Window Spaces works harmoniously with heavy and canvas-like community plugins. For detailed integration patterns with **Excalidraw**, **Excalibrain**, **Canvas**, **Dataview**, and **Notebook Navigator**, check out our community guide:

📖 **[Full User Guide & Plugin Synergy Walkthrough](docs/user-guide.md)**

---

## 💻 System Compatibility

- **Obsidian Version**: `v1.12.7` or newer
- **Platform**: Desktop (Windows, macOS, Linux)
- **License**: MIT License
