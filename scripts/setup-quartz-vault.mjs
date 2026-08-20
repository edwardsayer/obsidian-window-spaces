#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = 'D:/GitDev/ObsidianWindowSpaces';
const vaultDir = 'E:/vaults/quartz-vault';
const obsidianDir = path.join(vaultDir, '.obsidian');
const pluginDir = path.join(obsidianDir, 'plugins', 'window-spaces');

console.log('📁 Setting up Quartz Vault at:', vaultDir);

fs.mkdirSync(pluginDir, { recursive: true });

// 複製產物
const filesToCopy = ['main.js', 'main.js.map', 'manifest.json', 'styles.css'];
for (const file of filesToCopy) {
  const src = path.join(projectRoot, file);
  const dest = path.join(pluginDir, file);
  fs.copyFileSync(src, dest);
  console.log(`  ✅ Copied: ${file}`);
}

// community-plugins.json
const communityPluginsPath = path.join(obsidianDir, 'community-plugins.json');
fs.writeFileSync(communityPluginsPath, JSON.stringify(['window-spaces'], null, 2), 'utf8');

// core-plugins.json
const corePluginsPath = path.join(obsidianDir, 'core-plugins.json');
const corePlugins = [
  'file-explorer',
  'global-search',
  'switcher',
  'graph',
  'backlink',
  'canvas',
  'outgoing-link',
  'tag-pane',
  'page-preview',
  'command-palette',
  'markdown-importer',
  'editor-status',
  'bookmarks'
];
fs.writeFileSync(corePluginsPath, JSON.stringify(corePlugins, null, 2), 'utf8');

// appearance.json
const appearancePath = path.join(obsidianDir, 'appearance.json');
fs.writeFileSync(appearancePath, JSON.stringify({
  baseFontSize: 16,
  theme: 'obsidian',
  accentColor: ''
}, null, 2), 'utf8');

// app.json
const appConfigPath = path.join(obsidianDir, 'app.json');
const appConfig = {
  theme: 'obsidian',
  baseFontSize: 16,
  readableLineLength: true,
  showLineNumber: true,
  communityPlugin: true,
  livePreview: true
};
fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2), 'utf8');

// 產生 data.json
const spacesData = {
  spaces: [
    {
      id: "space-project-workbench",
      name: "🗺️ Project — Map & Workbench",
      timestamp: Date.now() - 3600000,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000,
      autoSave: true,
      windowState: {
        size: { width: 1240, height: 820 },
        position: { x: 200, y: 120 }
      },
      metadata: {
        activeFile: "docs/advanced/architecture.md"
      },
      workspace: {
        activeFile: "docs/advanced/architecture.md",
        leaves: [
          {
            type: "canvas",
            state: { file: "docs/Canvas.canvas" },
            pinned: true
          },
          {
            type: "markdown",
            state: { file: "docs/advanced/architecture.md", mode: "source", source: false },
            pinned: false
          }
        ],
        layout: {
          id: "layout-split-1",
          type: "split",
          dimension: 100,
          direction: "horizontal",
          children: [
            {
              id: "tab-group-1",
              type: "tabs",
              dimension: 50,
              children: [
                {
                  id: "leaf-canvas-1",
                  type: "leaf",
                  state: {
                    type: "canvas",
                    state: { file: "docs/Canvas.canvas" },
                    pinned: true,
                    title: "Canvas.canvas"
                  }
                }
              ]
            },
            {
              id: "tab-group-2",
              type: "tabs",
              dimension: 50,
              children: [
                {
                  id: "leaf-md-1",
                  type: "leaf",
                  state: {
                    type: "markdown",
                    state: { file: "docs/advanced/architecture.md", mode: "source", source: false },
                    pinned: false,
                    title: "Architecture"
                  }
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: "space-research-literature",
      name: "🧠 Research — Literature & Philosophy",
      timestamp: Date.now() - 7200000,
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 7200000,
      autoSave: false,
      windowState: {
        size: { width: 1150, height: 780 },
        position: { x: 260, y: 150 }
      },
      metadata: {
        activeFile: "docs/philosophy.md"
      },
      workspace: {
        activeFile: "docs/philosophy.md",
        leaves: [
          {
            type: "markdown",
            state: { file: "docs/philosophy.md", mode: "preview", source: false },
            pinned: false
          },
          {
            type: "markdown",
            state: { file: "docs/community.md", mode: "source", source: false },
            pinned: false
          }
        ],
        layout: {
          id: "layout-split-2",
          type: "split",
          dimension: 100,
          direction: "horizontal",
          children: [
            {
              id: "tab-group-3",
              type: "tabs",
              dimension: 55,
              children: [
                {
                  id: "leaf-md-2",
                  type: "leaf",
                  state: {
                    type: "markdown",
                    state: { file: "docs/philosophy.md", mode: "preview", source: false },
                    pinned: false,
                    title: "Philosophy of Quartz"
                  }
                }
              ]
            },
            {
              id: "tab-group-4",
              type: "tabs",
              dimension: 45,
              children: [
                {
                  id: "leaf-md-3",
                  type: "leaf",
                  state: {
                    type: "markdown",
                    state: { file: "docs/community.md", mode: "source", source: false },
                    pinned: false,
                    title: "Community"
                  }
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: "space-writing-showcase",
      name: "✍️ Writing — Components & Showcase",
      timestamp: Date.now() - 14400000,
      createdAt: Date.now() - 259200000,
      updatedAt: Date.now() - 14400000,
      autoSave: true,
      windowState: {
        size: { width: 1180, height: 800 },
        position: { x: 300, y: 180 }
      },
      metadata: {
        activeFile: "docs/layout-components.md"
      },
      workspace: {
        activeFile: "docs/layout-components.md",
        leaves: [
          {
            type: "markdown",
            state: { file: "docs/layout-components.md", mode: "source", source: false },
            pinned: false
          },
          {
            type: "markdown",
            state: { file: "docs/showcase.md", mode: "preview", source: false },
            pinned: false
          }
        ],
        layout: {
          id: "layout-split-3",
          type: "split",
          dimension: 100,
          direction: "horizontal",
          children: [
            {
              id: "tab-group-5",
              type: "tabs",
              dimension: 50,
              children: [
                {
                  id: "leaf-md-4",
                  type: "leaf",
                  state: {
                    type: "markdown",
                    state: { file: "docs/layout-components.md", mode: "source", source: false },
                    pinned: false,
                    title: "Layout Components"
                  }
                }
              ]
            },
            {
              id: "tab-group-6",
              type: "tabs",
              dimension: 50,
              children: [
                {
                  id: "leaf-md-5",
                  type: "leaf",
                  state: {
                    type: "markdown",
                    state: { file: "docs/showcase.md", mode: "preview", source: false },
                    pinned: false,
                    title: "Showcase"
                  }
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: "space-dev-config",
      name: "⚙️ Dev — Configuration & Release",
      timestamp: Date.now() - 86400000,
      createdAt: Date.now() - 345600000,
      updatedAt: Date.now() - 86400000,
      autoSave: false,
      windowState: {
        size: { width: 1100, height: 750 },
        position: { x: 340, y: 200 }
      },
      metadata: {
        activeFile: "docs/configuration.md"
      },
      workspace: {
        activeFile: "docs/configuration.md",
        leaves: [
          {
            type: "markdown",
            state: { file: "docs/configuration.md", mode: "source", source: false },
            pinned: false
          },
          {
            type: "markdown",
            state: { file: "docs/troubleshooting.md", mode: "source", source: false },
            pinned: false
          }
        ],
        layout: {
          id: "layout-split-4",
          type: "split",
          dimension: 100,
          direction: "horizontal",
          children: [
            {
              id: "tab-group-7",
              type: "tabs",
              dimension: 50,
              children: [
                {
                  id: "leaf-md-6",
                  type: "leaf",
                  state: {
                    type: "markdown",
                    state: { file: "docs/configuration.md", mode: "source", source: false },
                    pinned: false,
                    title: "Configuration"
                  }
                }
              ]
            },
            {
              id: "tab-group-8",
              type: "tabs",
              dimension: 50,
              children: [
                {
                  id: "leaf-md-7",
                  type: "leaf",
                  state: {
                    type: "markdown",
                    state: { file: "docs/troubleshooting.md", mode: "source", source: false },
                    pinned: false,
                    title: "Troubleshooting"
                  }
                }
              ]
            }
          ]
        }
      }
    }
  ]
};

const dataJsonPath = path.join(pluginDir, 'data.json');
fs.writeFileSync(dataJsonPath, JSON.stringify(spacesData, null, 2), 'utf8');
console.log('  ✅ Created data.json with 4 curated Spaces');

console.log('🎉 Setup complete!');
