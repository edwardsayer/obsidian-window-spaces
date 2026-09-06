# Window Spaces Visual Showcase & Screenshot Guide

This document is the official screenshot and visual asset guide for **Window Spaces** (`obsidian-window-spaces`). It outlines guidelines for developers and community maintainers to capture, produce, and update standardized visual assets for GitHub READMEs, the Obsidian Community Plugins Store, and user documentation.

---

## 🎨 Design & Style Guidelines

To convey a polished, professional look consistent with top-tier open-source tools, all showcase screenshots should adhere to the following standards:

| Item | Standard | Description |
| :--- | :--- | :--- |
| **Theme** | Obsidian Default Dark Theme | Use the official Default Dark theme for clear contrast and consistency across devices |
| **Interface Zoom** | 100% (Standard Scale) | If capturing on HiDPI/Retina screens (e.g., 4K or Mac), export at 2x native resolution for crisp typography |
| **Window Frame** | Native OS shadow or clean rect | Keep a 16–24px outer padding around captured windows, ideally on a subtle dark backdrop |
| **Theme Accents** | Vibrant, harmonious presets | Use the built-in preset palettes:<br>• Project Cabins: **Emerald Green (`#10B981`)** or **Electric Blue (`#3B82F6`)**<br>• Research Cabins: **Violet Purple (`#8B5CF6`)**<br>• Writing Cabins: **Amber Orange (`#F59E0B`)** |
| **Sample Data** | Clean, professional mock vault | **Never include private or messy notes**. Use realistic, neutral technical domains (e.g. `Apollo Project`, `Quantum Computing Review`, `Design System Specs`) |
| **Synergy Plugins** | Core plugins + Folder Spaces | Combine Canvas and Markdown splits, with **Folder Spaces Explorer** docked in the sidebar to showcase contextual scoping |

---

## 📸 Planned Showcase Assets (6 Core Screenshots)

```
assets/screenshots/
├── 01-hero-showcase.png            # [Hero] Multi-window Popout Workstation (Flagship Hero Banner)
├── 02-folder-scoped-cabin.png      # [Feature] Folder Spaces Synergy: Scoped Project Cabin
├── 03-popout-activity-bar.png      # [Core] Popout Activity Bar & Collapsible Sidebar in Action
├── 04-settings-activity-bar.png    # [Settings] Drag-and-Drop Activity Bar Reordering in Settings
├── 05-space-appearance-modal.png   # [Management] Space Configuration Dialog (Colors, Logos, Auto-Save)
└── 06-unified-panels.png           # [Interface] 3-in-1 Native Panels (Sidebar, Tab, & Quick Popup)
```

---

### 1. `01-hero-showcase.png` — Flagship Workstation Hero Banner
* **Purpose**: Top visual anchor of README; communicates the transformation of bare popouts into high-end workstations within 3 seconds.
* **Composition (1920 × 1080 or 16:9)**:
  * **Background Center**: Main Obsidian window acting as a high-level hub/dashboard.
  * **Foreground Left (Apollo Project Cabin)**:
    * **Emerald Green (`#10B981`) 4-side accent border** with folded corner.
    * Left Popout sidebar open with **Folder Spaces Explorer** locked to `/Projects/Apollo/`.
    * Center split: Pinned `apollo-roadmap.canvas` on left, `apollo-specs.md` note on right.
    * Status bar badge: `🚀 Apollo Project [Auto-Save 🔄]`.
  * **Foreground Right (Deep Research Cabin)**:
    * **Violet Purple (`#8B5CF6`) 4-side accent border** with folded corner.
    * Left Popout activity bar (Outline) with PDF reader + literature notes.
* **Visual Focus**: Vibrant theme borders, independent activity bars, and double-context isolation.

---

### 2. `02-folder-scoped-cabin.png` — Folder Spaces Synergy (Scoped Project Cabin)
* **Purpose**: Demonstrates the flagship workflow of **Window Spaces + Folder Spaces** ("Double Context Isolation").
* **Composition (Single Popout window, 1400 × 900)**:
  * **Window Frame**: Electric Blue accent border with folded corner decoration.
  * **Left Sidebar**:
    * Activity bar highlights the Folder Space icon.
    * Sidebar displays **Folder Space Explorer**, rooted at `📁 /Projects/WindowSpaces/`.
    * File list shows only 4–5 clean project documents (`architecture.md`, `release-plan.canvas`, `tasks.md`).
  * **Center Editor**:
    * Dual-pane split: Canvas roadmap on left, active `architecture.md` on right.
  * **Callouts**:
    * Callout 1 (Pointing to sidebar): *"Folder Spaces Explorer — Scoped strictly to project directory"*
    * Callout 2 (Pointing to editor): *"Smart Leaf Routing — Clicking files opens cleanly in center"*
    * Callout 3 (Pointing to border): *"Accent Theme Frame — Instant visual recognition"*

---

### 3. `03-popout-activity-bar.png` — Popout Activity Bar & Sidebar Feature
* **Purpose**: Shows the native-like Activity Bar and collapsible sidebar in a popout window.
* **Composition (Single Popout window, 1200 × 800)**:
  * Vertical activity bar on the left with sidebar toggle button, File Explorer, Bookmarks, Outline, and Search.
  * Pane splitter highlighting space accent glow (`popout-accents-splitter`).

---

### 4. `04-settings-activity-bar.png` — Activity Bar Customization in Settings
* **Purpose**: Shows deep customization of popout views with drag-and-drop reordering.
* **Composition (Settings panel close-up, 900 × 650)**:
  * Open the Window Spaces settings tab under "Popout Views & Activity Bars".
  * Displays "Import from Main Window Sidebar" button.
  * Left/Right Activity Bar lists showing **Drag-to-Reorder handles**, dynamic icon discovery, and view removal/addition.

---

### 5. `05-space-appearance-modal.png` — Space Customization Modal
* **Purpose**: Highlights rich styling options.
* **Composition (Modal dialog, 720 × 750)**:
  * Space Name, Logo Picker (Emoji/Lucide), Preset Palette, Border Inset, Folded Corner toggle, Auto-Save toggle, and Activity Bar overrides.

---

### 6. `06-unified-panels.png` — 3-in-1 Management Panels
* **Purpose**: Displays flexible UI integration across workflows.
* **Composition (Triptych or comparison layout, 1600px wide)**:
  * Left: Sidebar panel with Section grouping.
  * Center: Full editor tab panel.
  * Right: Floating Quick Popup modal with keyboard shortcut hints.
