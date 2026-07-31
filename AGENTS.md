# AGENTS.md

This file provides guidance to ai agents when working with code in this repository.

## Project Overview

Window Spaces is a high-performance Obsidian plugin that saves and restores window layouts for popout windows (created via "New window" command). It captures the complete state of popout windows, including layout structure (split/tabs), files, view modes, window size, and screen coordinates, allowing users to seamlessly manage multi-window workspaces.

### Plugin Naming & Store Positioning

- **Plugin Name**: `Window Spaces`
- **Store Description**: "Save and restore window layouts for Obsidian popout windows. Seamlessly manage multi-window popout workspaces."
- **Positioning**: Distinguishes itself from native global `Workspaces` by focusing specifically on **popout window spaces and layouts**.

## Development & Testing Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build for production
npm run build

# Development mode (with watch)
npm run dev

# Run Vitest unit & integration test suite (38 tests)
npm run test

# Run tests in watch mode
npm run test:watch

# Lint TypeScript files
npm run lint

# Format code
npm run format

# Install plugin to specific vault (interactive)
npm run install:vault
```

## Local Test Vault Deployment

The local Obsidian test vaults are:

- `test-vault`: `E:\vaults\test-vault`
- `Note`: `E:\vaults\Note`

Their Window Spaces plugin directories are:

- `E:\vaults\test-vault\.obsidian\plugins\obsidian-window-spaces`
- `E:\vaults\Note\.obsidian\plugins\obsidian-window-spaces`

After every development task is complete and verified, deploy the latest build to both vaults so the user can test it. Run `npm run build`, then copy `main.js`, `main.js.map`, `manifest.json`, and `styles.css` from the repository root into both plugin directories. Ask the user to reload the plugin or restart Obsidian before testing.

## Architecture

### Core Components

- **main.ts**: Main plugin entry point - handles plugin lifecycle, command registration, ribbon icons, and global event delegation.
- **manager.ts**: `WindowLayoutManager` class - core engine for capturing, restoring, and validating popout window layouts, managing 5-second debounced per-layout auto-save, surgical Virtual DOM reference protection to prevent jitter, and cached snapshot guardrails.
- **settings.ts**: `WindowSpacesSettingTab` implementation - UI for plugin configuration, default sorting preferences, and ribbon icon visibility.
- **types.ts**: TypeScript interfaces defining `WindowLayout` (`createdAt`, `updatedAt`, `autoSave`), `WindowState`, `WorkspaceState`, `ViewState`, etc.
- **views/windowLayoutsView.ts**: Persistent `ItemView` registration for opening Window Spaces in the left sidebar, right sidebar, or editor tab area. It mounts the shared `WindowLayoutsModal` controller.

### Dialog & UI Components

- **modals/saveModal.ts**: Modal for saving/editing window layouts with smart layout name generation, unified position/size geometry option, and dynamic auto-save toggle.
- **modals/restoreModal.ts**: Unified Quick-Switch & Management Modal and persistent panel controller. Features real-time search, hover file list tooltip (start-aligned), view-options and sorting actions, panel-location menu, per-layout 🔄 badge, and dropdown (∨) menu (Auto-save, Rename, Edit, Delete, Archive).

### Persistent Panel UI Contract

- Window Spaces can be opened in the left sidebar, right sidebar, or editor tab area through the registered `window-spaces-layouts` `ItemView`.
- All three locations render the same `nav-header window-layouts-panel-header` and `nav-buttons-container window-layouts-header-actions` structure. Button order and centering must not vary by location.
- The standard Obsidian `.view-header` is hidden for this view. `styles.css` clears the panel's top padding with `padding-top: 0 !important` so the native toolbar starts at the same edge and uses the same vertical padding as File Explorer.
- When changing toolbar layout or spacing, manually compare a three-panel workspace containing File Explorer, an editor-tab Window Spaces panel, and a right-sidebar Window Spaces panel.

### Internationalization (i18n)

- **i18n/index.ts**: Realtime dynamic locale detection engine with multi-source fallback (`window.localStorage.getItem("language")`, `moment.locale()`, `app.vault.config`). Instant language switching support for `en`, `zh-TW`, `zh-CN`.
- **i18n/en.ts, zh-CN.ts, zh-TW.ts**: Comprehensive localization dictionary files.

### Testing Suite (`tests/`)

- **tests/__mocks__/obsidian.ts**: Lightweight mock suite for Obsidian API (`Notice`, `Modal`, `Setting`, `Menu`, `TFile`, `setIcon`).
- **tests/smartName.test.ts**: Tests smart layout name generation (pinned priority, active file, overflow formatting).
- **tests/sorting.test.ts**: Tests 6-dimension sorting (`updated-desc`, `updated-asc`, `created-desc`, `created-asc`, `name-asc`, `name-desc`) and timestamp reset on copy.
- **tests/validationAndGuardrails.test.ts**: Tests layout validation and 0-file overwrite interception guardrails.
- **tests/i18n.test.ts**: Tests realtime dynamic locale detection and parameter interpolation.
- **tests/layoutTree.test.ts**: Tests recursive leaf extraction from nested split/tabs layout trees.
- **tests/restoreModal.test.ts**: Tests target popout selection, enter/shift-enter keydown handling, and modal search filtering.

### Icon Standardization Policy

- **Restore Layout**: `history` (Lucene icon)
- **Manage Layouts**: `layout` (Lucene icon)
- **Save Layout**: `save` (Lucene icon)
- **Auto-Save Toggle / Badge**: `refresh-cw` (Lucene icon)

### Project Structure & Documents

- **src/**: TypeScript source code (`main.ts`, `manager.ts`, `settings.ts`, `types.ts`, `modals/`, `views/`, `i18n/`, `tools/`).
- **tests/**: Vitest test suites and Obsidian API mocks.
- **doc/**: Project plans, testing guides, store submission checklists, and agent-tracked tasks (`AGENT_TODO.md`, `STORE_SUBMISSION_CHECKLIST.md`, `TESTING_GUIDE.md`, `I18N_TESTING_GUIDE.md`, `USE_CASES.md`).
- **doc/done/**: Archive of completed project plans, UI update logs, code review plans, and session transcripts.
- **README.md**: Comprehensive multi-language documentation (English, 繁體中文, 簡體中文, 日本語, Español, Français, العربية, Deutsch, Русский).
- **main.js**, **main.js.map**, **manifest.json**, **styles.css**: Generated plugin bundle files at root.
