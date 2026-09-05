# Window Spaces User Guide & Plugin Synergy Walkthrough

Language: **English** | [繁體中文](user-guide.zh-TW.md) | [简体中文](user-guide.zh-CN.md)

> **Window Spaces** delivers a lightweight, distraction-free, and efficient multi-window layout architecture for Obsidian power users. By isolating heavy plugins and complex pane splits into dedicated popout work cabins (Spaces), you can free up your crowded main workspace.

---

## Table of Contents

1. [Core Architecture & Philosophy](#1-core-architecture--philosophy)
2. [Interface Entry Points & Three Modes](#2-interface-entry-points--three-modes)
3. [Focus Interception & Keyboard-First Navigation](#3-focus-interception--keyboard-first-navigation)
4. [Per-Window Independent Auto-Save](#4-per-window-independent-auto-save)
5. [Community Plugin Synergy Walkthroughs](#5-community-plugin-synergy-walkthroughs)
   - [5.1 Excalidraw Visual Ideation Cabin](#51-excalidraw-visual-ideation-cabin)
   - [5.2 Excalibrain Interactive Knowledge Graph Cabin](#52-excalibrain-interactive-knowledge-graph-cabin)
   - [5.3 Obsidian Canvas Project Roadmap & Whiteboard](#53-obsidian-canvas-project-roadmap--whiteboard)
   - [5.4 Dataview / Projects Data Dashboard](#54-dataview--projects-data-dashboard)
   - [5.5 Notebook Navigator / GridExplorer Structured Navigation](#55-notebook-navigator--gridexplorer-structured-navigation)
6. [Space Customization, Visual Badges & Sorting](#6-space-customization-visual-badges--sorting)
7. [Backup, Export & Multi-Device Sync](#7-backup-export--multi-device-sync)
8. [Frequently Asked Questions (FAQ)](#8-frequently-asked-questions-faq)

---

## 1. Core Architecture & Philosophy

### Why Window Spaces?
Obsidian’s plugin ecosystem is vast and powerful, but as we enable more tools, the main application window quickly becomes overcrowded with sidebars, tab headers, and nested splits:
- **Crowded Main Window**: Canvas, Excalidraw, and Dataview each demand significant screen real estate.
- **Context Switching Friction**: Shifting between deep research, technical writing, and project triage disrupts your carefully arranged tabs and splits.
- **Underutilized Multi-Monitors**: Standard setups lack an effortless way to persistently preserve and restore distinct layouts across separate displays.

Window Spaces acts as an **organic extension of Obsidian**: it manages the layout lifecycle of each independent popout window, leaving the main window pristine while turning each popout into a dedicated task-specific cabin.

---

## 2. Interface Entry Points & Three Modes

Window Spaces provides three unified and consistent interfaces:

### 2.1 Sidebar Panel Mode
- **How to Open**: Run `Window Spaces: Open in left sidebar` or `Open in right sidebar` from the Command Palette.
- **Highlights**: Resides alongside your native File Explorer, ready for instant one-click space switching.

### 2.2 Tab Panel Mode
- **How to Open**: Run `Window Spaces: Open as tab panel`.
- **Highlights**: Expands into a full-page view inside the main editor area, ideal for large screens, bulk management, and renaming.

### 2.3 Quick Popup Modal
- **How to Open**: Click the ribbon layout icon on the left ribbon, or bind a hotkey to `Window Spaces: Open as popup window`.
- **Highlights**: A floating, keyboard-driven switcher designed for fast retrieval and dismissed on demand.

---

## 3. Focus Interception & Keyboard-First Navigation

Window Spaces employs **safe focus interception** so you can navigate and trigger spaces without touching the mouse:

| Key | Action | Description |
| :--- | :--- | :--- |
| `↑` / `↓` | Move Selection | Cycle through the list of saved spaces |
| `Enter` | **Open in New Window** | Spawns the highlighted space in a fresh popout window |
| `Shift + Enter` | **Apply to Current Window** | Restores the selected space layout directly into the current window |
| `Esc` | Dismiss / Unfocus | Closes the modal or releases search focus |

> **Safety Guarantee**: Arrow keys and action shortcuts are captured only when the Window Spaces panel is actively focused. They never interfere with editing markdown notes, searching your vault, or using other modals.

---

## 4. Per-Window Independent Auto-Save

Each Space can independently configure **`🔄 Auto-Save`**:

1. **5-Second Debounced Updates**: When you open new tabs or adjust horizontal/vertical split ratios inside a cabin, Window Spaces records the updated state in the background.
2. **Instant Snapshot on Window Close**: Closing a popout window triggers an immediate final snapshot so no subtle layout adjustment is lost.
3. **Manual Protection**: For fixed templates (e.g. Daily Review template), disable auto-save to ensure accidental edits do not alter the baseline preset.

---

## 5. Community Plugin Synergy Walkthroughs

### 5.1 Excalidraw Visual Ideation Cabin
- **Challenge**: Excalidraw benefits from large canvas dimensions; sharing space with markdown notes in the main window compresses text reading.
- **Workflow Setup**:
  - Create a popout space named `🎨 Sketch & Brainstorm`.
  - Dedicate 60% of the left side to the Excalidraw view and 40% on the right to markdown notes.
  - Draw diagrams on the canvas while capturing insights and bi-directional links side-by-side.

### 5.2 Excalibrain Interactive Knowledge Graph Cabin
- **Challenge**: Exploring expansive relationship graphs requires dynamic full-panel rendering, hogging the primary workspace.
- **Workflow Setup**:
  - Launch an `🧠 Excalibrain — Knowledge Graph` popout space on a secondary display.
  - As notes are focused in the main window, the auxiliary cabin displays surrounding context in real time.

### 5.3 Obsidian Canvas Project Roadmap & Whiteboard
- **Challenge**: Canvases contain numerous cards and connection lines; frequent zooming disrupts deep writing flows.
- **Workflow Setup**:
  - Configure a `🗺️ Project — Map & Workbench` space.
  - Pin the Canvas tab on the left and open implementation specs on the right.
  - Because the Canvas tab is pinned, clicking card links always opens the note on the right pane without overriding the whiteboard.

### 5.4 Dataview / Projects Data Dashboard
- **Challenge**: Complex Dataview tables or Kanban projects require wide tables for legible columns.
- **Workflow Setup**:
  - Set up a `📊 Dashboard — Metrics & Triage` window.
  - Top split hosts task queues and progress tables; bottom split hosts quick scratch capture.

### 5.5 Notebook Navigator / GridExplorer Structured Navigation
- **Challenge**: Deep hierarchical trees or grid browsers crowd narrow sidebars.
- **Workflow Setup**:
  - Create a dedicated dual-pane cabin balancing broad navigation on the left with deep reading on the right.

---

## 6. Space Customization, Visual Badges & Sorting

- **Custom Icons & Emojis**: Assign unique Emojis (e.g., 🗺️, 🧠, ✍️, ⚙️) or Lucide icons when saving or editing spaces.
- **Color Presets**: Use visual accent color tags to categorize work domains.
- **Tags & Categories**: Group spaces by project, research, or daily operational routines.
- **6 Sorting Dimensions**: Sort by custom order, title (A-Z / Z-A), tab count, or creation date via the settings menu (⚙️).

---

## 7. Backup, Export & Multi-Device Sync

- **Local Storage**: All plugin configurations and saved space states reside in `.obsidian/plugins/window-spaces/data.json`.
- **Export Spaces**: Click "Export Spaces" in settings to export layout schemas in standard JSON format.
- **Import Spaces**: Restore or replicate layout cabins on new devices or test vaults with a single click.

---

## 8. Frequently Asked Questions (FAQ)

### Q1: Why does clicking a space refocus an existing window instead of opening a duplicate?
**A**: Window Spaces includes smart duplicate prevention. If the space is already open in an existing popout window, clicking it smoothly focuses that window rather than opening redundant copies.

### Q2: Will popout windows spawn off-screen if I disconnect an external monitor?
**A**: No. Window Spaces includes a boundary correction algorithm that recalculates display geometry and centers windows safely onto the primary screen if the previous display is no longer available.

### Q3: What is the purpose of Empty Tabs?
**A**: If a file referenced by a space is renamed, deleted, or moved, Window Spaces gracefully renders a native empty tab placeholder to preserve your carefully designed multi-pane split layout.
