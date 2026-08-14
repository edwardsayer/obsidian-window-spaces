import { describe, expect, test, vi } from "vitest";
import { PopoutLayoutEngine } from "../src/popout/popoutLayout";
import { PopoutActivityBarManager } from "../src/popout/activityBar";

/**
 * 佈局完整性守護測試：
 * - 補足缺失的側欄欄位（兩側 activity bar 可見 → 頂層維持三欄）
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

  const makeColumn = (tag: string, leaf: MockLeaf): HTMLElement => {
    const colEl = document.createElement("div");
    colEl.classList.add(tag);
    colEl.appendChild(leaf.containerEl);
    rootEl.appendChild(colEl);
    return colEl;
  };

  const createLeafBySplit = vi.fn((target: unknown, direction: string, before?: boolean) => {
    // 在 root 最左/最右建立新的空欄位（模擬 Obsidian createLeafBySplit）
    const leaf = makeLeaf(`new-${leaves.length}`, "empty");
    const colEl = document.createElement("div");
    colEl.classList.add("workspace-tabs");
    colEl.appendChild(leaf.containerEl);
    if (before) {
      rootEl.insertBefore(colEl, rootEl.firstChild);
    } else {
      rootEl.appendChild(colEl);
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
  // 預設模擬「原本 3 欄」的標準空間（情境 B：close all 破壞後需補欄）
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

  // barsByWindow：updateActiveStates / setColumnActive 需要
  const bars = {
    left: document.createElement("div"),
    right: document.createElement("div"),
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
  document.body.removeChild(env.rootEl);
}

/** 建立三欄：[左(empty), 中(markdown), 右(search)] */
function buildThreeColumns(env: MockEnv): { leftCol: HTMLElement; centerCol: HTMLElement; rightCol: HTMLElement } {
  const leftLeaf = env.leaves.find((l) => l.getViewState().type === "empty") as MockLeaf;
  void leftLeaf;
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
  // 左欄（empty）
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
    // 中、右欄有真實 view；左欄只有 empty leaf
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
    // 左欄放入真實 view（file-explorer）
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

  test("fills a missing left sidebar column back to three columns", async () => {
    const env = buildEnv();
    // 頂層只有兩欄：[中(markdown), 右(search)]，左側欄被 close all 移除
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

    await (env.manager as any).ensureLayoutIntegrity(window);

    // 補了左側欄（createLeafBySplit with before=true）
    expect(env.createLeafBySplit).toHaveBeenCalledWith(
      expect.anything(),
      "vertical",
      true
    );
    // 頂層回到三欄，且新欄位在最左
    const topEls = Array.from(env.rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );
    expect(topEls).toHaveLength(3);
    expect(topEls[0].contains(env.leaves.find((l) => l.id.startsWith("new-"))!.containerEl)).toBe(true);

    teardown(env);
  });

  test("does not fill a sidebar when its activity bar is hidden (content area has no sidebar)", async () => {
    const env = buildEnv();
    // 左 activity bar 隱藏 → 左側不是 sidebar → 不補；右側仍顯示 → 補右欄
    (env.manager as any).plugin.settings.activityBarDefaults = { left: false, right: true };
    // engine hints 與 activityBarDefaults 保持一致（ensureSidebarHints 會依此重建）
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

    // 只有右側被補欄（before=false），左側不補
    expect(env.createLeafBySplit).toHaveBeenCalledTimes(1);
    expect(env.createLeafBySplit).toHaveBeenCalledWith(expect.anything(), "vertical", false);

    teardown(env);
  });

  test("does not auto-hide a sidebar the user just expanded via toggle", async () => {
    const env = buildEnv();
    const { leftCol } = buildThreeColumns(env);

    // 模擬使用者點 toggle 展開（showColumn + blocked）
    env.engine.showColumn(window, "left");
    (env.manager as any).markColumnAutoHideBlocked(window, "left", 3000);

    await (env.manager as any).ensureLayoutIntegrity(window);

    // 使用者剛展開，即使只有 New Tab 也不藏起
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
    // legacy 2-column space：左 activity bar 隱藏 → 左側是 content area，不是 sidebar
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

    // 左側 activity bar 隱藏 → 不補左欄；右側欄位已存在 → 也不需要補
    expect(env.createLeafBySplit).not.toHaveBeenCalled();

    teardown(env);
  });

  test("skips filling when the edge column is a nested split (createLeafBySplit would build at the wrong level)", async () => {
    const env = buildEnv();
    // 頂層：[nested-split(左, 含 editor), tabs(右)]；原始 3 欄 → 左側欄位缺失需補欄，
    // 但 edge 是巢狀 split → 跳過補欄
    (env.manager as any).plugin.settings.activityBarDefaults = { left: true, right: false };
    env.engine.setSidebarSides(window, {
      left: true,
      right: false,
      originalCount: 3,
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

    // 最左欄位是 nested split → 不補欄（避免 createLeafBySplit 建在 split 內部）
    expect(env.createLeafBySplit).not.toHaveBeenCalled();

    teardown(env);
  });

  test("does not retry a failed column fill within the guard window", async () => {
    const env = buildEnv();
    // 頂層 2 欄：[中, 右]，缺左欄；原始 3 欄（情境 B）→ 需補左欄
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

    // 第一次：補欄（成功，欄位數 2 → 3）
    await (env.manager as any).ensureLayoutIntegrity(window);
    expect(env.createLeafBySplit).toHaveBeenCalledTimes(1);

    // 第二次（模擬 layout-change 再次觸發）：欄位已存在 → 不再補
    await (env.manager as any).ensureLayoutIntegrity(window);
    expect(env.createLeafBySplit).toHaveBeenCalledTimes(1);

    teardown(env);
  });

  test("professional-style 2-column space with both activity bars stays untouched", async () => {
    const env = buildEnv();
    // Professional 型：原始 2 欄、兩側 activity bar 顯示 → 兩欄皆 sidebar，不補欄
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

    // 原始 2 欄 → 不補欄；最左/最右欄位皆為側欄（activity bar 旁）
    expect(env.createLeafBySplit).not.toHaveBeenCalled();
    expect(env.engine.getColumnElement(window, "left")).toBe(leftCol);
    expect(env.engine.getColumnElement(window, "right")).toBe(rightCol);
    // 即使左欄含 editor，也被標記為 sidebar（activity bar 旁優先）
    (env.manager as any).syncSidebarColumnClasses(window);
    expect(leftCol.classList.contains("window-spaces-sidebar-column")).toBe(true);
    expect(rightCol.classList.contains("window-spaces-sidebar-column")).toBe(true);

    teardown(env);
  });

  test("hides sidebar then hides activity bar → column is force-shown as content area", async () => {
    const env = buildEnv();
    const { leftCol } = buildThreeColumns(env);
    // 側欄被 toggle 隱藏（狀態 2）
    env.engine.hideColumn(window, "left");
    expect(env.engine.isColumnHidden(window, "left")).toBe(true);
    // 使用者接著隱藏左 activity bar → 左側變 content area（狀態 4→3：強制解除隱藏）
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
    // 該側已非 sidebar → 樣式回歸 content
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

    // 多次排程只執行一次（debounce）
    expect(integritySpy).toHaveBeenCalledTimes(1);

    // 未注入 activity bar 的視窗（barsByWindow 無此 win）不排程
    const foreignWin = { closed: false, setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window) } as unknown as Window;
    env.manager.scheduleLayoutIntegrityCheck(foreignWin);
    await new Promise((r) => setTimeout(r, 450));
    expect(integritySpy).toHaveBeenCalledTimes(1);

    integritySpy.mockRestore();
    teardown(env);
  });

  test("toggleView shows a hidden sidebar after opening its view", async () => {
    const env = buildEnv();
    const { leftCol } = buildThreeColumns(env);
    // 左欄被藏起（只有 New Tab）
    env.engine.hideColumn(window, "left");

    const engineSpy = vi
      .spyOn(env.engine, "ensureSideColumn")
      .mockResolvedValue(env.leaves.find((l) => l.getViewState().type === "empty") as any);

    await (env.manager as any).toggleView(window, { viewType: "file-explorer", side: "left" });

    // 開啟 view 後側欄自動顯示
    expect(engineSpy).toHaveBeenCalledWith(window, "left", "file-explorer");
    expect(env.engine.isColumnHidden(window, "left")).toBe(false);

    engineSpy.mockRestore();
    teardown(env);
  });
});
