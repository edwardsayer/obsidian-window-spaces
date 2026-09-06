import { describe, expect, test, vi } from "vitest";
import { Notice, WorkspaceLeaf } from "obsidian";
import { initI18n } from "../src/i18n";
import { PopoutLayoutEngine } from "../src/popout/popoutLayout";
import { PopoutActivityBarManager } from "../src/popout/activityBar";

initI18n("zh-TW");

/**
 * 佈局完整性守護測試：
 * - 維持側欄與 content 欄位的穩定性（不因使用者拖曳/合併 splits 而誤補欄位）
 * - 只剩 New Tab（empty leaf）的側欄 → 藏起（模仿 Obsidian 主視窗）
 * - 使用者手動展開後短時間內不自動藏起
 */

interface MockLeaf {
  id: string;
  containerEl: HTMLElement;
  view: { containerEl: HTMLElement };
  getViewState: () => { type: string };
  parent?: { id?: string; children?: unknown[] };
}

interface MockEnv {
  manager: PopoutActivityBarManager;
  engine: PopoutLayoutEngine;
  rootEl: HTMLElement;
  leaves: MockLeaf[];
  createLeafBySplit: ReturnType<typeof vi.fn>;
  getColumnEl: (side: "left" | "right") => HTMLElement | null;
}

function buildEnv(): MockEnv {
  const rootEl = document.createElement("div");
  rootEl.classList.add("workspace-split", "mod-root");
  document.body.appendChild(rootEl);

  const leaves: MockLeaf[] = [];

  const makeLeaf = (id: string, type: string): MockLeaf => {
    const containerEl = document.createElement("div");
    containerEl.classList.add("workspace-leaf");
    const leaf: MockLeaf = {
      id,
      containerEl,
      view: { containerEl },
      getViewState: () => ({ type }),
    };
    leaves.push(leaf);
    return leaf;
  };

  const createLeafBySplit = vi.fn((target: unknown, direction: string, before?: boolean) => {
    const leaf = makeLeaf(`new-${leaves.length}`, "empty");
    const colEl = document.createElement("div");
    colEl.classList.add("workspace-tabs");
    colEl.appendChild(leaf.containerEl);
    const targetLeaf = target as MockLeaf;
    let targetCol: HTMLElement | null = null;
    if (targetLeaf && targetLeaf.containerEl) {
      let node: HTMLElement | null = targetLeaf.containerEl;
      while (node && node.parentElement !== rootEl) {
        node = node.parentElement;
      }
      targetCol = node;
    }
    if (before) {
      if (targetCol) {
        rootEl.insertBefore(colEl, targetCol);
      } else {
        rootEl.insertBefore(colEl, rootEl.firstChild);
      }
    } else {
      if (targetCol && targetCol.nextSibling) {
        rootEl.insertBefore(colEl, targetCol.nextSibling);
      } else {
        rootEl.appendChild(colEl);
      }
    }
    return leaf;
  });

  const workspace = {
    iterateAllLeaves: (cb: (leaf: MockLeaf) => void) => {
      leaves.forEach((leaf) => cb(leaf));
    },
    createLeafBySplit,
    getMostRecentLeaf: () => leaves[0] ?? null,
    getLeaf: () => makeLeaf("fresh", "empty"),
    revealLeaf: vi.fn().mockResolvedValue(undefined),
    setActiveLeaf: vi.fn(),
  } as any;

  const app = { workspace } as any;
  const engine = new PopoutLayoutEngine(app);
  engine.setSidebarSides(window, {
    left: true,
    right: true,
    originalCount: 3,
    initialLeft: true,
    initialRight: true,
  });

  const manager = new PopoutActivityBarManager(
    {
      app,
      settings: {
        activityBarDefaults: { left: true, right: true },
        activityBars: { left: [], right: [] },
      },
    } as any,
    engine
  );

  const bars = {
    left: document.createElement("div"),
    right: document.createElement("div"),
    spaceIdentity: document.createElement("div"),
    viewButtons: new Map(),
    columnButtons: {
      left: document.createElement("button"),
      right: document.createElement("button"),
    },
  } as any;
  (manager as any).barsByWindow.set(window, bars);

  const getColumnEl = (side: "left" | "right"): HTMLElement | null => {
    const topEls = Array.from(rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );
    if (topEls.length === 0) return null;
    return side === "left" ? topEls[0] : topEls[topEls.length - 1];
  };

  return { manager, engine, rootEl, leaves, createLeafBySplit, getColumnEl };
}

function teardown(env: MockEnv): void {
  if (env.rootEl.parentElement) {
    env.rootEl.parentElement.removeChild(env.rootEl);
  }
}

/** 建立三欄：[左(empty), 中(markdown), 右(search)] */
function buildThreeColumns(env: MockEnv): { leftCol: HTMLElement; centerCol: HTMLElement; rightCol: HTMLElement } {
  const centerLeaf: MockLeaf = {
    id: "center",
    containerEl: document.createElement("div"),
    view: { containerEl: document.createElement("div") },
    getViewState: () => ({ type: "markdown" }),
  };
  const rightLeaf: MockLeaf = {
    id: "right",
    containerEl: document.createElement("div"),
    view: { containerEl: document.createElement("div") },
    getViewState: () => ({ type: "search" }),
  };
  const emptyLeaf = {
    id: "left-empty",
    containerEl: document.createElement("div"),
    view: { containerEl: document.createElement("div") },
    getViewState: () => ({ type: "empty" }),
  } as MockLeaf;
  env.leaves.push(emptyLeaf, centerLeaf, rightLeaf);

  const leftCol = document.createElement("div");
  leftCol.classList.add("workspace-tabs");
  leftCol.appendChild(emptyLeaf.containerEl);
  const centerCol = document.createElement("div");
  centerCol.classList.add("workspace-tabs");
  centerCol.appendChild(centerLeaf.containerEl);
  const rightCol = document.createElement("div");
  rightCol.classList.add("workspace-tabs");
  rightCol.appendChild(rightLeaf.containerEl);
  env.rootEl.appendChild(leftCol);
  env.rootEl.appendChild(centerCol);
  env.rootEl.appendChild(rightCol);

  return { leftCol, centerCol, rightCol };
}

describe("layout integrity guard", () => {
  test("hides a sidebar column that only contains a New Tab (empty leaf)", async () => {
    const env = buildEnv();
    const { leftCol, centerCol, rightCol } = buildThreeColumns(env);
    void centerCol;
    void rightCol;

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(leftCol.style.display).toBe("none");
    expect(leftCol.classList.contains("window-spaces-column-hidden")).toBe(true);

    teardown(env);
  });

  test("keeps a sidebar visible when it contains a real view", async () => {
    const env = buildEnv();
    const { leftCol } = buildThreeColumns(env);
    const explorerLeaf = {
      id: "explorer",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "file-explorer" }),
    } as MockLeaf;
    env.leaves.push(explorerLeaf);
    leftCol.appendChild(explorerLeaf.containerEl);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(leftCol.style.display).not.toBe("none");

    teardown(env);
  });

  test("does not perform reactive split during layout-change (protected by detach guard)", async () => {
    const env = buildEnv();
    const leftLeaf = {
      id: "left",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    const rightLeaf = {
      id: "right",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as MockLeaf;
    env.leaves.push(leftLeaf, rightLeaf);
    const leftCol = document.createElement("div");
    leftCol.classList.add("workspace-tabs");
    leftCol.appendChild(leftLeaf.containerEl);
    const rightCol = document.createElement("div");
    rightCol.classList.add("workspace-tabs");
    rightCol.appendChild(rightLeaf.containerEl);
    env.rootEl.appendChild(leftCol);
    env.rootEl.appendChild(rightCol);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();
    const topEls = Array.from(env.rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );
    expect(topEls).toHaveLength(2);

    teardown(env);
  });

  test("does not fill a sidebar when its activity bar is hidden (content area has no sidebar)", async () => {
    const env = buildEnv();
    (env.manager as any).plugin.settings.activityBarDefaults = { left: false, right: true };
    env.engine.setSidebarSides(window, {
      left: false,
      right: true,
      originalCount: 1,
      initialLeft: false,
      initialRight: true,
    });
    const centerLeaf = {
      id: "center",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    env.leaves.push(centerLeaf);
    const centerCol = document.createElement("div");
    centerCol.classList.add("workspace-tabs");
    centerCol.appendChild(centerLeaf.containerEl);
    env.rootEl.appendChild(centerCol);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();

    teardown(env);
  });

  test("does not auto-hide a sidebar the user just expanded via toggle", async () => {
    const env = buildEnv();
    const { leftCol } = buildThreeColumns(env);

    env.engine.showColumn(window, "left");
    (env.manager as any).markColumnAutoHideBlocked(window, "left", 3000);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(leftCol.style.display).not.toBe("none");

    teardown(env);
  });

  test("auto-hides again after the manual-expand block expires", async () => {
    const env = buildEnv();
    const { leftCol } = buildThreeColumns(env);

    (env.manager as any).markColumnAutoHideBlocked(window, "left", 0);
    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(leftCol.style.display).toBe("none");

    teardown(env);
  });

  test("does not fill a sidebar when the activity bar is hidden (legacy space without sidebar)", async () => {
    const env = buildEnv();
    (env.manager as any).plugin.settings.activityBarDefaults = { left: false, right: true };
    env.engine.setSidebarSides(window, {
      left: false,
      right: true,
      originalCount: 2,
      initialLeft: false,
      initialRight: true,
    });
    const leftLeaf = {
      id: "left-editor",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    const rightLeaf = {
      id: "right-view",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as MockLeaf;
    env.leaves.push(leftLeaf, rightLeaf);
    const leftCol = document.createElement("div");
    leftCol.classList.add("workspace-tabs");
    leftCol.appendChild(leftLeaf.containerEl);
    const rightCol = document.createElement("div");
    rightCol.classList.add("workspace-tabs");
    rightCol.appendChild(rightLeaf.containerEl);
    env.rootEl.appendChild(leftCol);
    env.rootEl.appendChild(rightCol);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();

    teardown(env);
  });

  test("preserves split column as left sidebar without duplicate column insertion", async () => {
    const env = buildEnv();
    (env.manager as any).plugin.settings.activityBarDefaults = { left: true, right: false };
    env.engine.setSidebarSides(window, {
      left: true,
      right: false,
      originalCount: 2,
      initialLeft: true,
      initialRight: false,
    });
    const nestedSplitEl = document.createElement("div");
    nestedSplitEl.classList.add("workspace-split", "mod-horizontal");
    const innerTabsEl = document.createElement("div");
    innerTabsEl.classList.add("workspace-tabs");
    const innerLeaf = {
      id: "inner",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    innerTabsEl.appendChild(innerLeaf.containerEl);
    nestedSplitEl.appendChild(innerTabsEl);
    env.rootEl.appendChild(nestedSplitEl);
    const rightLeaf = {
      id: "right",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as MockLeaf;
    env.leaves.push(innerLeaf, rightLeaf);
    const rightCol = document.createElement("div");
    rightCol.classList.add("workspace-tabs");
    rightCol.appendChild(rightLeaf.containerEl);
    env.rootEl.appendChild(rightCol);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();
    const topEls = Array.from(env.rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );
    expect(topEls).toHaveLength(2);
    expect(topEls[0]).toBe(nestedSplitEl);
    expect(topEls[1]).toBe(rightCol);

    teardown(env);
  });

  test("does not retry a failed column fill within the guard window", async () => {
    const env = buildEnv();
    // 頂層 2 欄：[中, 右]，缺左欄；原始 3 欄
    env.engine.setSidebarSides(window, {
      left: true,
      right: true,
      originalCount: 3,
      initialLeft: true,
      initialRight: true,
    });
    const centerLeaf = {
      id: "center",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    const rightLeaf = {
      id: "right",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as MockLeaf;
    env.leaves.push(centerLeaf, rightLeaf);
    const centerCol = document.createElement("div");
    centerCol.classList.add("workspace-tabs");
    centerCol.appendChild(centerLeaf.containerEl);
    const rightCol = document.createElement("div");
    rightCol.classList.add("workspace-tabs");
    rightCol.appendChild(rightLeaf.containerEl);
    env.rootEl.appendChild(centerCol);
    env.rootEl.appendChild(rightCol);

    // ensureLayoutIntegrity 不再進行即時補欄（由 detach guard 於刪除時防護）
    await (env.manager as any).ensureLayoutIntegrity(window);
    expect(env.createLeafBySplit).not.toHaveBeenCalled();

    teardown(env);
  });

  test("preserves existing columns without reactive splitting during layout-change", async () => {
    const env = buildEnv();
    env.engine.setSidebarSides(window, {
      left: true,
      right: true,
      originalCount: 2,
      initialLeft: true,
      initialRight: true,
    });
    const leftLeaf = {
      id: "left-editor",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    const rightLeaf = {
      id: "right-view",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as MockLeaf;
    env.leaves.push(leftLeaf, rightLeaf);
    const leftCol = document.createElement("div");
    leftCol.classList.add("workspace-tabs");
    leftCol.appendChild(leftLeaf.containerEl);
    const rightCol = document.createElement("div");
    rightCol.classList.add("workspace-tabs");
    rightCol.appendChild(rightLeaf.containerEl);
    env.rootEl.appendChild(leftCol);
    env.rootEl.appendChild(rightCol);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();
    const topEls = Array.from(env.rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );
    expect(topEls).toHaveLength(2);

    teardown(env);
  });

  test("hides sidebar then hides activity bar → column is force-shown as content area", async () => {
    const env = buildEnv();
    const { leftCol } = buildThreeColumns(env);
    env.engine.hideColumn(window, "left");
    expect(env.engine.isColumnHidden(window, "left")).toBe(true);
    (env.manager as any).plugin.settings.activityBarDefaults = { left: false, right: true };
    env.engine.setSidebarSides(window, {
      left: false,
      right: true,
      originalCount: 3,
      initialLeft: true,
      initialRight: true,
    });

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(leftCol.style.display).not.toBe("none");
    expect(leftCol.classList.contains("window-spaces-column-hidden")).toBe(false);
    expect(leftCol.classList.contains("window-spaces-sidebar-column")).toBe(false);

    teardown(env);
  });

  test("scheduleLayoutIntegrityCheck is debounced and skips closed/unmanaged windows", async () => {
    const env = buildEnv();
    const integritySpy = vi.spyOn(env.manager as any, "ensureLayoutIntegrity").mockResolvedValue(undefined);

    env.manager.scheduleLayoutIntegrityCheck(window);
    env.manager.scheduleLayoutIntegrityCheck(window);
    env.manager.scheduleLayoutIntegrityCheck(window);

    await new Promise((r) => setTimeout(r, 500));

    expect(integritySpy).toHaveBeenCalledTimes(1);

    const foreignWin = { closed: false, setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window) } as unknown as Window;
    env.manager.scheduleLayoutIntegrityCheck(foreignWin);
    await new Promise((r) => setTimeout(r, 450));
    expect(integritySpy).toHaveBeenCalledTimes(1);

    integritySpy.mockRestore();
    teardown(env);
  });

  test("does not reconcile columns while a target layout rebuild is in progress", async () => {
    const env = buildEnv();
    const ensureHintsSpy = vi.spyOn(env.manager as any, "ensureSidebarHints");
    vi.spyOn(env.manager as any, "getLayoutForWindow").mockReturnValue({
      workspace: { layout: { type: "window", children: [] } },
    });
    (env.manager as any).plugin.manager = { isRebuildingPopoutLayout: true };

    await (env.manager as any).ensureLayoutColumns(window);

    expect(ensureHintsSpy).not.toHaveBeenCalled();
    teardown(env);
  });

  test("rebuilds missing sidebars before createLeafBySplit for a restored Space", async () => {
    const env = buildEnv();
    vi.spyOn(env.manager as any, "getLayoutForWindow").mockReturnValue({
      activityBars: {
        left: { show: true },
        right: { show: true },
      },
      workspace: { layout: { type: "window", children: [] } },
    });
    const rebuildSpy = vi
      .spyOn(env.manager as any, "rebuildMissingSidebars")
      .mockResolvedValue(true);

    await (env.manager as any).ensureLayoutColumns(window);

    expect(rebuildSpy).toHaveBeenCalledWith(
      window,
      expect.objectContaining({ activityBars: expect.any(Object) }),
    );
    teardown(env);
  });

  test("does not rebuild missing sidebars while a Space restore is still materializing views", async () => {
    const env = buildEnv();
    vi.spyOn(env.manager as any, "getLayoutForWindow").mockReturnValue({
      activityBars: {
        left: { show: true },
        right: { show: true },
      },
      workspace: { layout: { type: "window", children: [] } },
    });
    const rebuildSpy = vi
      .spyOn(env.manager as any, "rebuildMissingSidebars")
      .mockResolvedValue(true);
    (env.manager as any).plugin.manager = { isRestoringLayout: true };

    await (env.manager as any).ensureLayoutColumns(window);

    expect(rebuildSpy).not.toHaveBeenCalled();
    teardown(env);
  });

  test("keeps an unlabeled restore target hidden before a legacy Space is identified", () => {
    const env = buildEnv();
    (env.manager as any).plugin.manager = { isRestoringLayout: true };

    (env.manager as any).renderWindow(window);

    const bars = (env.manager as any).barsByWindow.get(window);
    expect(bars.left.classList.contains("window-spaces-activity-hidden")).toBe(true);
    expect(bars.right.classList.contains("window-spaces-activity-hidden")).toBe(true);
    expect(document.body.classList.contains("window-spaces-has-left-activity")).toBe(false);
    expect(document.body.classList.contains("window-spaces-has-right-activity")).toBe(false);

    env.manager.cleanupWindow(window);
    teardown(env);
  });

  test("does not rebuild a marked sidebar when its current view is not the default view", async () => {
    const env = buildEnv();
    const { leftCol, rightCol } = buildThreeColumns(env);
    leftCol.classList.add("window-spaces-sidebar-column", "mod-sidedock", "mod-left-split");
    rightCol.classList.add("window-spaces-sidebar-column", "mod-sidedock", "mod-right-split");

    vi.spyOn(env.manager as any, "getLayoutForWindow").mockReturnValue({
      activityBars: {
        left: {
          show: true,
          items: [{ viewType: "folder-spaces-explorer", side: "left" }],
        },
        right: {
          show: true,
          items: [{ viewType: "backlink", side: "right" }],
        },
      },
      workspace: { layout: { type: "window", children: [] } },
    });
    const rebuildSpy = vi.fn().mockResolvedValue(undefined);
    (env.manager as any).plugin.manager = {
      rebuildPopoutLayoutWithSidebars: rebuildSpy,
    };

    await (env.manager as any).ensureLayoutColumns(window);

    expect(rebuildSpy).not.toHaveBeenCalled();
    teardown(env);
  });

  test("toggleView shows a hidden sidebar after opening its view", async () => {
    const env = buildEnv();
    const { leftCol } = buildThreeColumns(env);
    env.engine.hideColumn(window, "left");

    const engineSpy = vi
      .spyOn(env.engine, "ensureSideColumn")
      .mockResolvedValue(env.leaves.find((l) => l.getViewState().type === "empty") as any);

    await (env.manager as any).toggleView(window, { viewType: "file-explorer", side: "left" });

    expect(engineSpy).toHaveBeenCalledWith(window, "left", "file-explorer");
    expect(env.engine.isColumnHidden(window, "left")).toBe(false);

    engineSpy.mockRestore();
    teardown(env);
  });

  test("preserves 2 sidebar columns stably without reactive splitting", async () => {
    const env = buildEnv();
    (env.manager as any).plugin.settings.activityBarDefaults = { left: true, right: true };
    env.engine.setSidebarSides(window, {
      left: true,
      right: true,
      originalCount: 3,
      initialLeft: true,
      initialRight: true,
    });
    const leftLeaf = {
      id: "left",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as MockLeaf;
    const rightLeaf = {
      id: "right",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as MockLeaf;
    env.leaves.push(leftLeaf, rightLeaf);
    const leftCol = document.createElement("div");
    leftCol.classList.add("workspace-tabs");
    leftCol.appendChild(leftLeaf.containerEl);
    const rightCol = document.createElement("div");
    rightCol.classList.add("workspace-tabs");
    rightCol.appendChild(rightLeaf.containerEl);
    env.rootEl.appendChild(leftCol);
    env.rootEl.appendChild(rightCol);
    (env.manager as any).syncSidebarColumnClasses(window);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();
    const topEls = Array.from(env.rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );
    expect(topEls).toHaveLength(2);

    teardown(env);
  });

  test("preserves nested vertical splits in left sidebar (Column 0) when 3 columns exist", async () => {
    const env = buildEnv();
    (env.manager as any).plugin.settings.activityBarDefaults = { left: true, right: true };
    env.engine.setSidebarSides(window, {
      left: true,
      right: true,
      originalCount: 3,
      initialLeft: true,
      initialRight: true,
    });

    // 建立 Column 0（workspace-split.mod-horizontal，包含上下兩個 tabs：Note + 00 Journal）
    const col0Split = document.createElement("div");
    col0Split.classList.add("workspace-split", "mod-horizontal");

    const topTabs = document.createElement("div");
    topTabs.classList.add("workspace-tabs");
    const topLeaf = {
      id: "top-note",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "folder-spaces-explorer" }),
    } as MockLeaf;
    topTabs.appendChild(topLeaf.containerEl);

    const bottomTabs = document.createElement("div");
    bottomTabs.classList.add("workspace-tabs");
    const bottomLeaf = {
      id: "bottom-journal",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "folder-spaces-explorer" }),
    } as MockLeaf;
    bottomTabs.appendChild(bottomLeaf.containerEl);

    col0Split.appendChild(topTabs);
    col0Split.appendChild(bottomTabs);
    env.rootEl.appendChild(col0Split);

    // 建立 Column 1（workspace-tabs，Center Editor）
    const centerCol = document.createElement("div");
    centerCol.classList.add("workspace-tabs");
    const centerLeaf = {
      id: "center-editor",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    centerCol.appendChild(centerLeaf.containerEl);
    env.rootEl.appendChild(centerCol);

    // 建立 Column 2（workspace-tabs，Right Sidebar）
    const rightCol = document.createElement("div");
    rightCol.classList.add("workspace-tabs");
    const rightLeaf = {
      id: "right-sidebar",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as MockLeaf;
    rightCol.appendChild(rightLeaf.containerEl);
    env.rootEl.appendChild(rightCol);

    env.leaves.push(topLeaf, bottomLeaf, centerLeaf, rightLeaf);

    // 觸發完整性檢查
    await (env.manager as any).ensureLayoutIntegrity(window);

    // 3 欄皆具備，不應插入任何新欄位
    expect(env.createLeafBySplit).not.toHaveBeenCalled();

    const topEls = Array.from(env.rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );
    expect(topEls).toHaveLength(3);
    expect(topEls[0]).toBe(col0Split);
    expect(topEls[1]).toBe(centerCol);
    expect(topEls[2]).toBe(rightCol);

    // 驗證 Column 0 及其子 tabs 均獲得側欄 class
    expect(col0Split.classList.contains("window-spaces-sidebar-column")).toBe(true);
    expect(col0Split.classList.contains("mod-left-split")).toBe(true);
    expect(topTabs.classList.contains("mod-left-split")).toBe(true);
    expect(bottomTabs.classList.contains("mod-left-split")).toBe(true);

    // 驗證 Column 2 獲得右側欄 class
    expect(rightCol.classList.contains("window-spaces-sidebar-column")).toBe(true);
    expect(rightCol.classList.contains("mod-right-split")).toBe(true);

    teardown(env);
  });

  test("does not perform reactive split when only 2 columns exist", async () => {
    const env = buildEnv();
    (env.manager as any).plugin.settings.activityBarDefaults = { left: true, right: true };
    (env.manager as any).plugin.settings.activityBars.right = [
      { viewType: "outline", side: "right" },
      { viewType: "all-properties", side: "right" },
    ];
    env.engine.setSidebarSides(window, {
      left: true,
      right: true,
      originalCount: 2,
      initialLeft: true,
      initialRight: true,
    });
    const leftLeaf = {
      id: "left",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "bookmarks" }),
    } as MockLeaf;
    const centerLeaf = {
      id: "center",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    env.leaves.push(leftLeaf, centerLeaf);
    const leftCol = document.createElement("div");
    leftCol.classList.add("workspace-tabs");
    leftCol.appendChild(leftLeaf.containerEl);
    const centerCol = document.createElement("div");
    centerCol.classList.add("workspace-tabs");
    centerCol.appendChild(centerLeaf.containerEl);
    env.rootEl.appendChild(leftCol);
    env.rootEl.appendChild(centerCol);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();
    const topEls = Array.from(env.rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );
    expect(topEls).toHaveLength(2);

    teardown(env);
  });

  test("keeps existing content column untouched when count already meets bar count", async () => {
    const env = buildEnv();
    (env.manager as any).plugin.settings.activityBarDefaults = { left: true, right: true };
    env.engine.setSidebarSides(window, {
      left: true,
      right: true,
      originalCount: 3,
      initialLeft: true,
      initialRight: true,
    });
    buildThreeColumns(env);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();

    teardown(env);
  });

  test("legacy space without activity bar settings treats all columns as content (no guard refill)", async () => {
    const env = buildEnv();
    (env.manager as any).plugin.settings.activityBarDefaults = { left: false, right: false };
    env.engine.setSidebarSides(window, {
      left: false,
      right: false,
      originalCount: 2,
      initialLeft: false,
      initialRight: false,
    });
    const c1Leaf = {
      id: "c1",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    const c2Leaf = {
      id: "c2",
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as MockLeaf;
    env.leaves.push(c1Leaf, c2Leaf);
    const c1Col = document.createElement("div");
    c1Col.classList.add("workspace-tabs");
    c1Col.appendChild(c1Leaf.containerEl);
    const c2Col = document.createElement("div");
    c2Col.classList.add("workspace-tabs");
    c2Col.appendChild(c2Leaf.containerEl);
    env.rootEl.appendChild(c1Col);
    env.rootEl.appendChild(c2Col);

    await (env.manager as any).ensureLayoutIntegrity(window);

    expect(env.createLeafBySplit).not.toHaveBeenCalled();
    (env.manager as any).syncSidebarColumnClasses(window);
    expect(c1Col.classList.contains("window-spaces-sidebar-column")).toBe(false);
    expect(c2Col.classList.contains("window-spaces-sidebar-column")).toBe(false);

    teardown(env);
  });
});

describe("sidebar tab detach guard and navigation fallback", () => {
  test("isLastTabOnSidebar returns true only when leaf is the sole tab in sidebar column of popout", () => {
    const env = buildEnv();
    const popoutDoc = document.implementation.createHTMLDocument("popout");
    popoutDoc.body.classList.add("is-popout-window");
    const popoutWin = {
      document: popoutDoc,
      closed: false,
    } as unknown as Window;
    Object.defineProperty(popoutDoc, "defaultView", { value: popoutWin });

    // 建立 left sidebar 欄位，含 1 個 tab
    const leftCol = popoutDoc.createElement("div");
    leftCol.classList.add("workspace-tabs", "window-spaces-sidebar-column", "mod-left-split");
    const leaf1 = {
      id: "leaf1",
      win: popoutWin,
      containerEl: popoutDoc.createElement("div"),
      view: { containerEl: popoutDoc.createElement("div") },
      getViewState: () => ({ type: "file-explorer" }),
    } as unknown as MockLeaf;
    leftCol.appendChild(leaf1.containerEl);
    popoutDoc.body.appendChild(env.rootEl);
    env.rootEl.appendChild(leftCol);

    // 建立 center 欄位，含 1 個 tab
    const centerCol = popoutDoc.createElement("div");
    centerCol.classList.add("workspace-tabs");
    const centerLeaf = {
      id: "center-leaf",
      win: popoutWin,
      containerEl: popoutDoc.createElement("div"),
      view: { containerEl: popoutDoc.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as unknown as MockLeaf;
    centerCol.appendChild(centerLeaf.containerEl);
    env.rootEl.appendChild(centerCol);

    env.leaves.push(leaf1, centerLeaf);

    // 1. 只有 1 個 tab 的側欄 leaf → 是最後一個 tab
    expect(env.manager.isLastTabOnSidebar(leaf1 as unknown as WorkspaceLeaf)).toBe(true);

    // 2. 中央編輯區的 leaf → 不是側欄 tab
    expect(env.manager.isLastTabOnSidebar(centerLeaf as unknown as WorkspaceLeaf)).toBe(false);

    // 3. 在同一側欄欄位加入第 2 個 tab
    const leaf2 = {
      id: "leaf2",
      win: popoutWin,
      containerEl: popoutDoc.createElement("div"),
      view: { containerEl: popoutDoc.createElement("div") },
      getViewState: () => ({ type: "search" }),
    } as unknown as MockLeaf;
    leftCol.appendChild(leaf2.containerEl);
    env.leaves.push(leaf2);

    // 現在該側欄有 2 個 tab，任一 tab 都不再是「最後一個 tab」
    expect(env.manager.isLastTabOnSidebar(leaf1 as unknown as WorkspaceLeaf)).toBe(false);
    expect(env.manager.isLastTabOnSidebar(leaf2 as unknown as WorkspaceLeaf)).toBe(false);

    teardown(env);
  });

  test("detach guard prevents closing the last sidebar tab and calls originalDetach when multiple tabs exist", () => {
    const env = buildEnv();
    const popoutDoc = document.implementation.createHTMLDocument("popout");
    popoutDoc.body.classList.add("is-popout-window");
    const popoutWin = {
      document: popoutDoc,
      closed: false,
    } as unknown as Window;
    Object.defineProperty(popoutDoc, "defaultView", { value: popoutWin });

    const leftCol = popoutDoc.createElement("div");
    leftCol.classList.add("workspace-tabs", "window-spaces-sidebar-column", "mod-left-split");
    const leaf = Object.create(WorkspaceLeaf.prototype);
    leaf.id = "sole-sidebar-leaf";
    leaf.win = popoutWin;
    leaf.containerEl = popoutDoc.createElement("div");
    leaf.view = { containerEl: popoutDoc.createElement("div") };
    leaf.getViewState = () => ({ type: "file-explorer" });

    leftCol.appendChild(leaf.containerEl);
    popoutDoc.body.appendChild(env.rootEl);
    env.rootEl.appendChild(leftCol);
    env.leaves.push(leaf);

    const originalDetachSpy = vi.fn();
    (env.manager as any).originalDetach = originalDetachSpy;

    // 呼叫 detach
    leaf.detach();

    // 側欄只有 1 個 tab，不應呼叫 originalDetach
    expect(originalDetachSpy).not.toHaveBeenCalled();

    // 加進第 2 個 tab
    const leaf2 = Object.create(WorkspaceLeaf.prototype);
    leaf2.id = "leaf2";
    leaf2.win = popoutWin;
    leaf2.containerEl = popoutDoc.createElement("div");
    leaf2.view = { containerEl: popoutDoc.createElement("div") };
    leaf2.getViewState = () => ({ type: "search" });
    leftCol.appendChild(leaf2.containerEl);
    env.leaves.push(leaf2);

    // 有 2 個 tab 時，呼叫 detach 應該正常執行
    leaf.detach();
    expect(originalDetachSpy).toHaveBeenCalledTimes(1);

    teardown(env);
  });

  test("canLeafAcceptNavigation rejects navigation for outline/non-navigable/pinned views", () => {
    const env = buildEnv();

    // 1. Normal unpinned markdown view -> can accept navigation
    const normalLeaf = {
      getViewState: () => ({ type: "markdown", pinned: false }),
      view: { navigation: true },
    } as unknown as WorkspaceLeaf;
    expect(env.engine.canLeafAcceptNavigation(normalLeaf)).toBe(true);

    // 2. Pinned markdown view -> cannot accept navigation
    const pinnedLeaf = {
      getViewState: () => ({ type: "markdown", pinned: true }),
      view: { navigation: true },
    } as unknown as WorkspaceLeaf;
    expect(env.engine.canLeafAcceptNavigation(pinnedLeaf)).toBe(false);

    // 3. Outline view (navigation === false) -> cannot accept navigation
    const outlineLeaf = {
      getViewState: () => ({ type: "outline", pinned: false }),
      view: { navigation: false },
    } as unknown as WorkspaceLeaf;
    expect(env.engine.canLeafAcceptNavigation(outlineLeaf)).toBe(false);

    // 4. canNavigate() returns false
    const nonNavLeaf = {
      getViewState: () => ({ type: "outline" }),
      canNavigate: () => false,
      view: { navigation: true },
    } as unknown as WorkspaceLeaf;
    expect(env.engine.canLeafAcceptNavigation(nonNavLeaf)).toBe(false);

    teardown(env);
  });

  test("isLastTabInCenter returns true only when leaf is the sole remaining tab in center area", () => {
    const env = buildEnv();
    const popoutDoc = document.implementation.createHTMLDocument("popout");
    popoutDoc.body.classList.add("is-popout-window");
    const popoutWin = {
      document: popoutDoc,
      closed: false,
    } as unknown as Window;
    Object.defineProperty(popoutDoc, "defaultView", { value: popoutWin });

    // 建立 left sidebar 欄位，含 1 個 tab
    const leftCol = popoutDoc.createElement("div");
    leftCol.classList.add("workspace-tabs", "window-spaces-sidebar-column", "mod-left-split");
    const sidebarLeaf = {
      id: "sidebar-leaf",
      win: popoutWin,
      containerEl: popoutDoc.createElement("div"),
      view: { containerEl: popoutDoc.createElement("div") },
      getViewState: () => ({ type: "file-explorer" }),
    } as unknown as MockLeaf;
    leftCol.appendChild(sidebarLeaf.containerEl);
    popoutDoc.body.appendChild(env.rootEl);
    env.rootEl.appendChild(leftCol);

    // 建立 center 欄位，含 1 個 tab
    const centerCol = popoutDoc.createElement("div");
    centerCol.classList.add("workspace-tabs");
    const centerLeaf1 = {
      id: "center-leaf1",
      win: popoutWin,
      containerEl: popoutDoc.createElement("div"),
      view: { containerEl: popoutDoc.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as unknown as MockLeaf;
    centerCol.appendChild(centerLeaf1.containerEl);
    env.rootEl.appendChild(centerCol);

    env.leaves.push(sidebarLeaf, centerLeaf1);

    // 1. 側邊欄 leaf → 不是中央分頁
    expect(env.manager.isLastTabInCenter(sidebarLeaf as unknown as WorkspaceLeaf)).toBe(false);

    // 2. 只有 1 個中央分頁 → 是中央最後一個分頁
    expect(env.manager.isLastTabInCenter(centerLeaf1 as unknown as WorkspaceLeaf)).toBe(true);

    // 3. 增加第 2 個中央分頁
    const centerLeaf2 = {
      id: "center-leaf2",
      win: popoutWin,
      containerEl: popoutDoc.createElement("div"),
      view: { containerEl: popoutDoc.createElement("div") },
      getViewState: () => ({ type: "markdown" }),
    } as unknown as MockLeaf;
    centerCol.appendChild(centerLeaf2.containerEl);
    env.leaves.push(centerLeaf2);

    // 現在中央有 2 個分頁，任一分頁都不再是「最後一個分頁」
    expect(env.manager.isLastTabInCenter(centerLeaf1 as unknown as WorkspaceLeaf)).toBe(false);
    expect(env.manager.isLastTabInCenter(centerLeaf2 as unknown as WorkspaceLeaf)).toBe(false);

    teardown(env);
  });

  test("detach guard replaces the last center tab with empty view in-place without detaching", async () => {
    const env = buildEnv();
    const popoutDoc = document.implementation.createHTMLDocument("popout");
    popoutDoc.body.classList.add("is-popout-window");
    const popoutWin = {
      document: popoutDoc,
      closed: false,
    } as unknown as Window;
    Object.defineProperty(popoutDoc, "defaultView", { value: popoutWin });

    const centerCol = popoutDoc.createElement("div");
    centerCol.classList.add("workspace-tabs");
    const centerLeaf = Object.create(WorkspaceLeaf.prototype);
    centerLeaf.id = "only-center-leaf";
    centerLeaf.win = popoutWin;
    centerLeaf.containerEl = popoutDoc.createElement("div");
    centerLeaf.view = { containerEl: popoutDoc.createElement("div") };
    let currentState = { type: "markdown" };
    centerLeaf.getViewState = () => currentState;
    centerLeaf.setViewState = vi.fn(async (state: any) => {
      currentState = state;
    });

    centerCol.appendChild(centerLeaf.containerEl);
    popoutDoc.body.appendChild(env.rootEl);
    env.rootEl.appendChild(centerCol);
    env.leaves.push(centerLeaf);

    const originalDetachSpy = vi.fn();
    (env.manager as any).originalDetach = originalDetachSpy;

    // 呼叫 detach
    centerLeaf.detach();

    // 不應呼叫 originalDetach（阻止容器被銷毀）
    expect(originalDetachSpy).not.toHaveBeenCalled();
    // 應原地替換為 empty (New Tab)
    expect(centerLeaf.setViewState).toHaveBeenCalledWith({ type: "empty", active: true, state: {} });

    teardown(env);
  });
});

