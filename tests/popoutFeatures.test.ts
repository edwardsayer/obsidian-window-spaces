import { describe, expect, test, vi } from "vitest";
import { Menu } from "obsidian";
import { initI18n } from "../src/i18n";
import { WindowLayoutManager } from "../src/manager";
import {
  getDirectChildOf,
  getPaneContainerElement,
  isElementHidden,
  isPopoutWindow,
  PopoutLayoutEngine,
  setElementDisplay,
} from "../src/popout/popoutLayout";
import { WorkspaceInterceptor } from "../src/popout/workspaceInterceptor";
import {
  acquireWorkspaceInterceptor,
  releaseWorkspaceInterceptor,
} from "../src/shared/workspaceInterceptor";
import { PopoutActivityBarManager } from "../src/popout/activityBar";
import {
  applyViewIcon,
  ensureViewIcon,
  enumerateAvailableViews,
  getDefaultActivityBarItems,
  getViewsFromHostSplit,
  resolveViewIcon,
  resolveViewLabel,
  sortViewTypesByLabel,
} from "../src/popout/viewRegistry";
import { resolveSpaceIcon } from "../src/spaceVisuals";

describe("popoutLayout helpers", () => {
  test("isPopoutWindow detects popout via body class", () => {
    const win = {
      document: { body: { classList: { contains: (cls: string) => cls === "is-popout-window" } } },
    } as unknown as Window;
    expect(isPopoutWindow(win)).toBe(true);
    expect(isPopoutWindow(window)).toBe(false);
    expect(isPopoutWindow(null)).toBe(false);
  });

  test("getColumnElement returns sidebar-marked first/last top-level column (structural, no geometry)", () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");
    const leftTabsEl = document.createElement("div");
    leftTabsEl.classList.add("workspace-tabs");
    leftTabsEl.classList.add("window-spaces-sidebar-column");
    const leftLeafEl = document.createElement("div");
    leftTabsEl.appendChild(leftLeafEl);
    rootEl.appendChild(leftTabsEl);
    const rightTabsEl = document.createElement("div");
    rightTabsEl.classList.add("workspace-tabs");
    rightTabsEl.classList.add("window-spaces-sidebar-column");
    const rightLeafEl = document.createElement("div");
    rightTabsEl.appendChild(rightLeafEl);
    rootEl.appendChild(rightTabsEl);
    document.body.appendChild(rootEl);

    const leftLeaf = { containerEl: leftLeafEl, view: { containerEl: leftLeafEl } } as any;
    const rightLeaf = { containerEl: rightLeafEl, view: { containerEl: rightLeafEl } } as any;
    const workspace = {
      activeLeaf: leftLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(rightLeaf);
      },
    } as any;

    const engine = new PopoutLayoutEngine({ workspace } as any);
    expect(engine.getColumnElement(window, "left")).toBe(leftTabsEl);
    expect(engine.getColumnElement(window, "right")).toBe(rightTabsEl);

    document.body.removeChild(rootEl);
  });

  test("getColumnElement without hints requires the sidebar class marker (no class → null)", () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");
    const leftTabsEl = document.createElement("div");
    leftTabsEl.classList.add("workspace-tabs");
    const leftLeafEl = document.createElement("div");
    leftTabsEl.appendChild(leftLeafEl);
    rootEl.appendChild(leftTabsEl);
    const rightTabsEl = document.createElement("div");
    rightTabsEl.classList.add("workspace-tabs");
    const rightLeafEl = document.createElement("div");
    rightTabsEl.appendChild(rightLeafEl);
    rootEl.appendChild(rightTabsEl);
    document.body.appendChild(rootEl);

    const leftLeaf = { containerEl: leftLeafEl, view: { containerEl: leftLeafEl } } as any;
    const rightLeaf = { containerEl: rightLeafEl, view: { containerEl: rightLeafEl } } as any;
    const workspace = {
      activeLeaf: leftLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(rightLeaf);
      },
    } as any;

    const engine = new PopoutLayoutEngine({ workspace } as any);
    // 沒有 hints 也沒有 sidebar class：不得把最左/最右欄位當作 sidebar
    expect(engine.getColumnElement(window, "left")).toBeNull();
    expect(engine.getColumnElement(window, "right")).toBeNull();
    // 最外側欄位仍可透過 getEdgeColumnElement 定位（供 open-in-sidebar 主動定位）
    expect(engine.getEdgeColumnElement(window, "left")).toBe(leftTabsEl);
    expect(engine.getEdgeColumnElement(window, "right")).toBe(rightTabsEl);

    document.body.removeChild(rootEl);
  });

  test("getColumnElement treats nested-split column as a single sidebar column", () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");
    // 左側欄為巢狀水平 split（兩個 tab group）＝第一頂層欄位
    const leftNestedSplit = document.createElement("div");
    leftNestedSplit.classList.add("workspace-split", "mod-horizontal");
    leftNestedSplit.classList.add("window-spaces-sidebar-column");
    const leftTopTabsEl = document.createElement("div");
    leftTopTabsEl.classList.add("workspace-tabs");
    const leftTopLeafEl = document.createElement("div");
    leftTopTabsEl.appendChild(leftTopLeafEl);
    leftNestedSplit.appendChild(leftTopTabsEl);
    const leftBottomTabsEl = document.createElement("div");
    leftBottomTabsEl.classList.add("workspace-tabs");
    const leftBottomLeafEl = document.createElement("div");
    leftBottomTabsEl.appendChild(leftBottomLeafEl);
    leftNestedSplit.appendChild(leftBottomTabsEl);
    rootEl.appendChild(leftNestedSplit);
    const rightTabsEl = document.createElement("div");
    rightTabsEl.classList.add("workspace-tabs");
    rootEl.appendChild(rightTabsEl);
    document.body.appendChild(rootEl);

    const leftTopLeaf = { containerEl: leftTopLeafEl, view: { containerEl: leftTopLeafEl } } as any;
    const leftBottomLeaf = { containerEl: leftBottomLeafEl, view: { containerEl: leftBottomLeafEl } } as any;
    const workspace = {
      activeLeaf: leftTopLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftTopLeaf);
        cb(leftBottomLeaf);
      },
    } as any;

    const engine = new PopoutLayoutEngine({ workspace } as any);
    // 左側欄 = 巢狀 split（第一頂層欄），整個欄位視為側欄
    expect(engine.getColumnElement(window, "left")).toBe(leftNestedSplit);

    document.body.removeChild(rootEl);
  });

  test("getSidebarTabsInColumn resolves active pane's tabs for a nested-split sidebar", async () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");
    // 左側欄為巢狀水平 split（兩個 tab group）＝第一頂層欄位
    const leftNestedSplit = document.createElement("div");
    leftNestedSplit.classList.add("workspace-split", "mod-horizontal");
    const leftTopTabsEl = document.createElement("div");
    leftTopTabsEl.classList.add("workspace-tabs");
    const leftTopLeafEl = document.createElement("div");
    leftTopTabsEl.appendChild(leftTopLeafEl);
    leftNestedSplit.appendChild(leftTopTabsEl);
    const leftBottomTabsEl = document.createElement("div");
    leftBottomTabsEl.classList.add("workspace-tabs");
    const leftBottomLeafEl = document.createElement("div");
    leftBottomTabsEl.appendChild(leftBottomLeafEl);
    leftNestedSplit.appendChild(leftBottomTabsEl);
    rootEl.appendChild(leftNestedSplit);
    const rightTabsEl = document.createElement("div");
    rightTabsEl.classList.add("workspace-tabs");
    rootEl.appendChild(rightTabsEl);
    document.body.appendChild(rootEl);

    const leftTopTabs = { children: [] } as any;
    const leftBottomTabs = { children: [] } as any;
    const leftTopLeaf = { parent: leftTopTabs, containerEl: leftTopLeafEl, view: { containerEl: leftTopLeafEl }, getViewState: () => ({ type: "empty" }) } as any;
    const leftBottomLeaf = { parent: leftBottomTabs, containerEl: leftBottomLeafEl, view: { containerEl: leftBottomLeafEl }, getViewState: () => ({ type: "empty" }) } as any;
    const workspace = {
      activeLeaf: leftTopLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftTopLeaf);
        cb(leftBottomLeaf);
      },
      getMostRecentLeaf: () => leftTopLeaf,
      createLeafInParent: vi.fn().mockImplementation((parent: any, idx: number) => {
        const leaf = { parent, setViewState: vi.fn().mockResolvedValue(undefined), getViewState: () => ({ type: "empty" }) } as any;
        parent.children.push(leaf);
        return leaf;
      }),
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
    } as any;

    const engine = new PopoutLayoutEngine({ workspace } as any);
    // 模擬 managed popout：兩側皆有側欄 hints（originalCount 2 = 欄位數）
    engine.setSidebarSides(window, {
      left: true,
      right: true,
      originalCount: 2,
      initialLeft: true,
      initialRight: true,
    });
    // active leaf 在 top pane → ensureSideColumn 應在 top tabs 建立 leaf
    const leaf = await engine.ensureSideColumn(window, "left", "window-spaces-layouts");
    expect(leaf.parent).toBe(leftTopTabs);
    expect(workspace.createLeafInParent).toHaveBeenCalledWith(leftTopTabs, 0);

    document.body.removeChild(rootEl);
  });

  test("getDirectChildOf returns the element that is a direct child of root", () => {
    const root = document.createElement("div");
    root.classList.add("workspace-split", "mod-root");
    const column = document.createElement("div");
    const tabs = document.createElement("div");
    column.appendChild(tabs);
    root.appendChild(column);

    expect(getDirectChildOf(root, tabs)).toBe(column);
    expect(getDirectChildOf(root, column)).toBe(column);
  });

  test("setElementDisplay hides and restores via inline style", () => {
    const el = document.createElement("div");
    setElementDisplay(el, "none");
    expect(isElementHidden(el)).toBe(true);
    setElementDisplay(el, "");
    expect(isElementHidden(el)).toBe(false);
  });

  test("getPaneContainerElement returns direct child of the parent workspace-split", () => {
    const split = document.createElement("div");
    split.classList.add("workspace-split", "mod-root");
    const tabs = document.createElement("div");
    tabs.classList.add("workspace-tabs");
    const leafContainer = document.createElement("div");
    leafContainer.classList.add("workspace-leaf-content");
    tabs.appendChild(leafContainer);
    split.appendChild(tabs);

    const leaf = { containerEl: leafContainer, view: { containerEl: leafContainer } } as any;
    expect(getPaneContainerElement(leaf)).toBe(tabs);
  });

  test("remembers the last active content pane after focus moves to a sidebar", () => {
    const firstTabs = { children: [] as any[] } as any;
    const secondTabs = { children: [] as any[] } as any;
    const sidebarTabs = { children: [] as any[] } as any;
    const makeLeaf = (parent: any, type: string) => ({
      parent,
      containerEl: document.createElement("div"),
      getViewState: () => ({ type }),
    });
    const firstLeaf = makeLeaf(firstTabs, "markdown");
    const secondLeaf = makeLeaf(secondTabs, "markdown");
    const sidebarLeaf = makeLeaf(sidebarTabs, "file-explorer");
    firstTabs.children.push(firstLeaf);
    secondTabs.children.push(secondLeaf);
    sidebarTabs.children.push(sidebarLeaf);

    const workspace = {
      activeLeaf: sidebarLeaf,
      getMostRecentLeaf: () => sidebarLeaf,
      iterateAllLeaves: (callback: (leaf: any) => void) => {
        callback(firstLeaf);
        callback(secondLeaf);
        callback(sidebarLeaf);
      },
      createLeafInParent: vi.fn().mockImplementation((parent: any, index: number) => {
        const leaf = makeLeaf(parent, "empty");
        parent.children.splice(index, 0, leaf);
        return leaf;
      }),
    } as any;
    const engine = new PopoutLayoutEngine({ workspace } as any);
    const firstPane = { tabs: firstTabs, left: 0, width: 400, center: 200 };
    const secondPane = { tabs: secondTabs, left: 400, width: 400, center: 600 };
    vi.spyOn(engine, "getCenterPanes").mockReturnValue([firstPane, secondPane]);

    engine.rememberActiveContentPane(window, secondLeaf);
    const created = engine.getCenterLeafSync(window, "tab");

    expect(created.parent).toBe(secondTabs);
    expect(workspace.createLeafInParent).toHaveBeenCalledWith(secondTabs, 1);
  });

  test("falls back to a current center pane when the remembered pane was removed", () => {
    const firstTabs = { children: [] as any[] } as any;
    const secondTabs = { children: [] as any[] } as any;
    const firstLeaf = {
      parent: firstTabs,
      containerEl: document.createElement("div"),
      getViewState: () => ({ type: "markdown" }),
    } as any;
    const secondLeaf = {
      parent: secondTabs,
      containerEl: document.createElement("div"),
      getViewState: () => ({ type: "markdown" }),
    } as any;
    firstTabs.children.push(firstLeaf);
    secondTabs.children.push(secondLeaf);

    const workspace = {
      activeLeaf: secondLeaf,
      getMostRecentLeaf: () => secondLeaf,
      iterateAllLeaves: (callback: (leaf: any) => void) => callback(firstLeaf),
      createLeafInParent: vi.fn().mockImplementation((parent: any, index: number) => {
        const leaf = {
          parent,
          containerEl: document.createElement("div"),
          getViewState: () => ({ type: "empty" }),
        } as any;
        parent.children.splice(index, 0, leaf);
        return leaf;
      }),
    } as any;
    const engine = new PopoutLayoutEngine({ workspace } as any);
    const firstPane = { tabs: firstTabs, left: 0, width: 400, center: 200 };
    const secondPane = { tabs: secondTabs, left: 400, width: 400, center: 600 };
    const centerPanes = vi.spyOn(engine, "getCenterPanes").mockReturnValue([firstPane, secondPane]);

    engine.rememberActiveContentPane(window, secondLeaf);
    centerPanes.mockReturnValue([firstPane]);
    const created = engine.getCenterLeafSync(window, "tab");

    expect(created.parent).toBe(firstTabs);
    expect(workspace.createLeafInParent).toHaveBeenCalledWith(firstTabs, 1);
  });

  test("remembers the last active split independently for left and right sidebars", () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    const makeSidebarColumn = (side: "left" | "right") => {
      const column = document.createElement("div");
      column.classList.add(
        "workspace-split",
        "mod-horizontal",
        "window-spaces-sidebar-column",
        side === "left" ? "mod-left-split" : "mod-right-split"
      );
      const topTabsEl = document.createElement("div");
      topTabsEl.classList.add("workspace-tabs");
      const bottomTabsEl = document.createElement("div");
      bottomTabsEl.classList.add("workspace-tabs");
      column.append(topTabsEl, bottomTabsEl);
      rootEl.appendChild(column);
      return { column, topTabsEl, bottomTabsEl };
    };

    const left = makeSidebarColumn("left");
    const centerTabsEl = document.createElement("div");
    centerTabsEl.classList.add("workspace-tabs");
    rootEl.appendChild(centerTabsEl);
    const right = makeSidebarColumn("right");
    document.body.appendChild(rootEl);

    const makeTabs = (containerEl: HTMLElement) => ({
      containerEl,
      children: [] as any[],
    });
    const leftTopTabs = makeTabs(left.topTabsEl);
    const leftBottomTabs = makeTabs(left.bottomTabsEl);
    const centerTabs = makeTabs(centerTabsEl);
    const rightTopTabs = makeTabs(right.topTabsEl);
    const rightBottomTabs = makeTabs(right.bottomTabsEl);
    const makeLeaf = (parent: any, containerEl: HTMLElement, type: string) => ({
      parent,
      containerEl,
      view: { containerEl },
      getViewState: () => ({ type }),
    });
    const leftTopLeaf = makeLeaf(leftTopTabs, document.createElement("div"), "empty");
    const leftBottomLeaf = makeLeaf(leftBottomTabs, document.createElement("div"), "empty");
    const centerLeaf = makeLeaf(centerTabs, document.createElement("div"), "markdown");
    const rightTopLeaf = makeLeaf(rightTopTabs, document.createElement("div"), "empty");
    const rightBottomLeaf = makeLeaf(rightBottomTabs, document.createElement("div"), "empty");
    left.topTabsEl.appendChild(leftTopLeaf.containerEl);
    left.bottomTabsEl.appendChild(leftBottomLeaf.containerEl);
    centerTabsEl.appendChild(centerLeaf.containerEl);
    right.topTabsEl.appendChild(rightTopLeaf.containerEl);
    right.bottomTabsEl.appendChild(rightBottomLeaf.containerEl);
    leftTopTabs.children.push(leftTopLeaf);
    leftBottomTabs.children.push(leftBottomLeaf);
    centerTabs.children.push(centerLeaf);
    rightTopTabs.children.push(rightTopLeaf);
    rightBottomTabs.children.push(rightBottomLeaf);

    let activeLeaf = centerLeaf;
    const leaves = [leftTopLeaf, leftBottomLeaf, centerLeaf, rightTopLeaf, rightBottomLeaf];
    const workspace = {
      activeLeaf: centerLeaf,
      getMostRecentLeaf: () => activeLeaf,
      iterateAllLeaves: (callback: (leaf: any) => void) => leaves.forEach(callback),
      createLeafInParent: vi.fn().mockImplementation((parent: any, index: number) => {
        const leaf = makeLeaf(parent, document.createElement("div"), "empty");
        parent.children.splice(index, 0, leaf);
        return leaf;
      }),
      createLeafBySplit: vi.fn(),
    } as any;
    const engine = new PopoutLayoutEngine({ workspace } as any);

    engine.rememberActiveContentPane(window, leftBottomLeaf);
    engine.rememberActiveContentPane(window, rightBottomLeaf);
    activeLeaf = centerLeaf;

    const leftCreated = engine.openSideLeafSync(window, "left");
    const rightCreated = engine.openSideLeafSync(window, "right");

    expect(leftCreated?.parent).toBe(leftBottomTabs);
    expect(rightCreated?.parent).toBe(rightBottomTabs);
    expect(workspace.createLeafInParent).toHaveBeenNthCalledWith(1, leftBottomTabs, 1);
    expect(workspace.createLeafInParent).toHaveBeenNthCalledWith(2, rightBottomTabs, 1);

    // A removed remembered pane falls back to the first surviving pane on that side.
    left.bottomTabsEl.remove();
    const fallbackCreated = engine.openSideLeafSync(window, "left");
    expect(fallbackCreated?.parent).toBe(leftTopTabs);

    document.body.removeChild(rootEl);
  });
});

describe("PopoutLayoutEngine hide/show + persistence", () => {
  function buildEngine() {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    const leftTabsEl = document.createElement("div");
    leftTabsEl.classList.add("workspace-tabs");
    leftTabsEl.classList.add("window-spaces-sidebar-column");
    const leftLeafEl = document.createElement("div");
    leftTabsEl.appendChild(leftLeafEl);
    rootEl.appendChild(leftTabsEl);

    const rightTabsEl = document.createElement("div");
    rightTabsEl.classList.add("workspace-tabs");
    rightTabsEl.classList.add("window-spaces-sidebar-column");
    const rightLeafEl = document.createElement("div");
    rightTabsEl.appendChild(rightLeafEl);
    rootEl.appendChild(rightTabsEl);

    document.body.appendChild(rootEl);

    const leftLeaf = {
      id: "left-leaf",
      containerEl: leftLeafEl,
      view: { containerEl: leftLeafEl },
    } as any;
    const rightLeaf = {
      id: "right-leaf",
      containerEl: rightLeafEl,
      view: { containerEl: rightLeafEl },
    } as any;

    const workspace = {
      activeLeaf: leftLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(rightLeaf);
      },
    } as any;

    const win = window;

    const engine = new PopoutLayoutEngine({ workspace } as any);
    engine.collectPopoutPanes = () => [
      { tabs: { containerEl: leftTabsEl, children: [leftLeaf] }, left: 0, width: 300, center: 150 },
      { tabs: { containerEl: rightTabsEl, children: [rightLeaf] }, left: 300, width: 300, center: 450 },
    ];

    return { engine, win, leftTabsEl, rightTabsEl, leftLeaf, rightLeaf };
  }

  test("hideColumn / showColumn toggles top-level column visibility", () => {
    const { engine, win, leftTabsEl } = buildEngine();

    expect(engine.isColumnHidden(win, "left")).toBe(false);
    engine.hideColumn(win, "left");
    expect(engine.isColumnHidden(win, "left")).toBe(true);
    expect(leftTabsEl.style.display).toBe("none");
    expect(leftTabsEl.classList.contains("window-spaces-column-hidden")).toBe(true);

    engine.showColumn(win, "left");
    expect(engine.isColumnHidden(win, "left")).toBe(false);
    expect(leftTabsEl.classList.contains("window-spaces-column-hidden")).toBe(false);
  });

  test("getColumnElement is structural and still finds hidden columns", () => {
    const { engine, win, rightTabsEl } = buildEngine();

    // 隱藏右欄後，幾何測量會失效，但結構定位仍應找到它
    engine.hideColumn(win, "right");
    expect(engine.getColumnElement(win, "right")).toBe(rightTabsEl);
    expect(engine.isColumnHidden(win, "right")).toBe(true);
    expect(engine.getVisibleColumnCount(win)).toBe(1);

    engine.showColumn(win, "right");
    expect(engine.isColumnHidden(win, "right")).toBe(false);
    expect(engine.getVisibleColumnCount(win)).toBe(2);
  });

  test("getColumnElement finds hidden right column even when geometry excludes hidden panes", () => {
    const { engine, win, leftTabsEl, rightTabsEl } = buildEngine();
    engine.hideColumn(win, "right");
    // 模擬真實幾何測量：display:none 的欄位量不到尺寸，不會被列入
    engine.collectPopoutPanes = () => [
      { tabs: { containerEl: leftTabsEl, children: [] }, left: 0, width: 300, center: 150 },
    ];
    expect(engine.getColumnElement(win, "right")).toBe(rightTabsEl);
    expect(engine.isColumnHidden(win, "right")).toBe(true);
    engine.showColumn(win, "right");
    expect(engine.isColumnHidden(win, "right")).toBe(false);
  });

  test("captureHiddenState records hidden columns and leaf ids", () => {
    // 右欄為垂直分割（兩個 tab group），隱藏其中一個 group 不應視為整欄隱藏
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    const leftTabsEl = document.createElement("div");
    leftTabsEl.classList.add("workspace-tabs");
    leftTabsEl.classList.add("window-spaces-sidebar-column");
    const leftLeafEl = document.createElement("div");
    leftTabsEl.appendChild(leftLeafEl);
    rootEl.appendChild(leftTabsEl);

    const rightColumnEl = document.createElement("div");
    rightColumnEl.classList.add("workspace-split", "mod-vertical");
    rightColumnEl.classList.add("window-spaces-sidebar-column");
    const topTabsEl = document.createElement("div");
    topTabsEl.classList.add("workspace-tabs");
    const topLeafEl = document.createElement("div");
    topTabsEl.appendChild(topLeafEl);
    const bottomTabsEl = document.createElement("div");
    bottomTabsEl.classList.add("workspace-tabs");
    const bottomLeafEl = document.createElement("div");
    bottomTabsEl.appendChild(bottomLeafEl);
    rightColumnEl.appendChild(topTabsEl);
    rightColumnEl.appendChild(bottomTabsEl);
    rootEl.appendChild(rightColumnEl);
    document.body.appendChild(rootEl);

    const leftLeaf = { id: "left-leaf", containerEl: leftLeafEl, view: { containerEl: leftLeafEl } } as any;
    const topLeaf = { id: "top-leaf", containerEl: topLeafEl, view: { containerEl: topLeafEl } } as any;
    const bottomLeaf = { id: "bottom-leaf", containerEl: bottomLeafEl, view: { containerEl: bottomLeafEl } } as any;

    const workspace = {
      activeLeaf: leftLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(topLeaf);
        cb(bottomLeaf);
      },
    } as any;

    const engine = new PopoutLayoutEngine({ workspace } as any);
    engine.collectPopoutPanes = () => [
      { tabs: { containerEl: leftTabsEl, children: [leftLeaf] }, left: 0, width: 300, center: 150 },
      { tabs: { containerEl: topTabsEl, children: [topLeaf] }, left: 300, width: 300, center: 450 },
      { tabs: { containerEl: bottomTabsEl, children: [bottomLeaf] }, left: 300, width: 300, center: 450 },
    ];

    engine.hideColumn(window, "left");
    engine.hidePaneGroup(topLeaf);

    const state = engine.captureHiddenState(window);
    expect(state.leftSidebar).toBe(true);
    expect(state.rightSidebar).toBe(false);
    expect(state.hiddenLeafIds).toContain("top-leaf");
    expect(state.hiddenLeafIds).not.toContain("bottom-leaf");
  });

  test("applyHiddenState re-hides after restore", () => {
    const { engine, win, leftTabsEl, rightTabsEl } = buildEngine();
    engine.applyHiddenState(win, { leftSidebar: true });
    expect(leftTabsEl.style.display).toBe("none");
    engine.applyHiddenState(win, { hiddenLeafIds: ["right-leaf"] });
    expect(rightTabsEl.style.display).toBe("none");
  });
});

describe("WorkspaceInterceptor", () => {
  function buildMockApp() {
    const originalLeft = vi.fn(() => "main-left-leaf");
    const originalRight = vi.fn(() => "main-right-leaf");
    const workspace = {
      getLeftLeaf: originalLeft,
      getRightLeaf: originalRight,
      iterateAllLeaves: () => {},
    } as any;
    return { app: { workspace }, originalLeft, originalRight };
  }

  test("install patches methods but falls back when no popout active", () => {
    const { app, originalLeft, originalRight } = buildMockApp();
    const interceptor = new WorkspaceInterceptor(app);
    interceptor.install();

    const result = app.workspace.getLeftLeaf(false);
    expect(result).toBe("main-left-leaf");
    expect(originalLeft).toHaveBeenCalledWith(false);

    interceptor.uninstall();
    expect(app.workspace.getLeftLeaf).toBe(originalLeft);
    expect(app.workspace.getRightLeaf).toBe(originalRight);
  });

  test("disabled interceptor always falls back to original", () => {
    const { app, originalLeft } = buildMockApp();
    const interceptor = new WorkspaceInterceptor(app);
    interceptor.enabled = false;
    interceptor.install();

    expect(app.workspace.getLeftLeaf(false)).toBe("main-left-leaf");
    expect(originalLeft).toHaveBeenCalled();
    interceptor.uninstall();
  });

  test("install is idempotent and uninstall fully restores", () => {
    const { app, originalLeft } = buildMockApp();
    const interceptor = new WorkspaceInterceptor(app);
    interceptor.install();
    interceptor.install();

    app.workspace.getLeftLeaf(false);
    expect(originalLeft).toHaveBeenCalledTimes(1);

    interceptor.uninstall();
    expect(app.workspace.getLeftLeaf).toBe(originalLeft);
    // second uninstall is safe
    interceptor.uninstall();
    expect(app.workspace.getLeftLeaf).toBe(originalLeft);
  });

  test("install without getLeftLeaf/getRightLeaf is safe and restores absent methods", () => {
    const app = { workspace: {} } as any;
    const interceptor = new WorkspaceInterceptor(app);
    interceptor.install();
    interceptor.uninstall();
    expect("getLeftLeaf" in app.workspace).toBe(false);
    expect("getRightLeaf" in app.workspace).toBe(false);
    expect("getLeavesOfType" in app.workspace).toBe(false);
    expect("ensureSideLeaf" in app.workspace).toBe(false);
  });

  test("routes ensureSideLeaf through the shared Popout engine", async () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;
    const routedLeaf = {
      getViewState: () => ({ type: "empty" }),
      setViewState: vi.fn().mockResolvedValue(undefined),
      loadIfDeferred: vi.fn().mockResolvedValue(undefined),
    } as any;
    const originalEnsureSideLeaf = vi.fn().mockResolvedValue("main-side-leaf");
    const app = {
      workspace: {
        getLeftLeaf: vi.fn().mockReturnValue(null),
        getRightLeaf: vi.fn().mockReturnValue(null),
        ensureSideLeaf: originalEnsureSideLeaf,
        revealLeaf: vi.fn().mockResolvedValue(undefined),
        setActiveLeaf: vi.fn(),
        requestSaveLayout: vi.fn().mockResolvedValue(undefined),
      },
    } as any;
    const engine = {
      getColumnElement: vi.fn().mockReturnValue(null),
      findLeafOfTypeInColumn: vi.fn().mockReturnValue(null),
      openSideLeafSync: vi.fn().mockReturnValue(routedLeaf),
    } as any;
    const interceptor = new WorkspaceInterceptor(app, engine);
    interceptor.isManagedWindow = () => true;
    interceptor.install();
    (globalThis as any).activeWindow = popoutWin;

    try {
      const result = await app.workspace.ensureSideLeaf("search", "left", {
        active: true,
        reveal: true,
        state: { query: "path:\"Notes/\"" },
      });
      expect(result).toBe(routedLeaf);
      expect(engine.openSideLeafSync).toHaveBeenCalledWith(popoutWin, "left");
      expect(routedLeaf.setViewState).toHaveBeenCalledWith({
        type: "search",
        active: true,
        state: { query: "path:\"Notes/\"" },
      });
      expect(originalEnsureSideLeaf).not.toHaveBeenCalled();
    } finally {
      interceptor.uninstall();
      delete (globalThis as any).activeWindow;
    }
  });

  test("routes getLeaf away from side column in popout to center editor leaf", () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;

    const centerLeaf = { id: "center-editor-leaf", getViewState: () => ({ type: "markdown" }) } as any;
    const sideLeaf = { id: "file-explorer-leaf", getViewState: () => ({ type: "file-explorer" }) } as any;

    const originalGetLeaf = vi.fn().mockReturnValue("main-editor-leaf");
    const app = {
      workspace: {
        getLeftLeaf: vi.fn(),
        getRightLeaf: vi.fn(),
        getLeaf: originalGetLeaf,
        revealLeaf: vi.fn(),
        setActiveLeaf: vi.fn(),
      },
    } as any;

    const engine = {
      getActiveLeafInWindow: vi.fn().mockReturnValue(sideLeaf),
      isLeafInSideColumn: vi.fn().mockImplementation((win, leaf) => leaf === sideLeaf),
      getCenterLeafSync: vi.fn().mockReturnValue(centerLeaf),
      openSideLeafSync: vi.fn(),
    } as any;

    const interceptor = new WorkspaceInterceptor(app, engine);
    interceptor.isManagedWindow = () => true;
    interceptor.install();
    (globalThis as any).activeWindow = popoutWin;

    try {
      const leaf = app.workspace.getLeaf(false);
      expect(leaf).toBe(centerLeaf);
      expect(engine.isLeafInSideColumn).toHaveBeenCalledWith(popoutWin, sideLeaf);
      expect(engine.getCenterLeafSync).toHaveBeenCalledWith(popoutWin, false);
      expect(originalGetLeaf).not.toHaveBeenCalled();
    } finally {
      interceptor.uninstall();
      delete (globalThis as any).activeWindow;
    }
  });

  test("routes getLeaf('split') in popout to split the center leaf (not the side column)", () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;

    const centerLeaf = { id: "center-editor-leaf", getViewState: () => ({ type: "markdown" }) } as any;
    const sideLeaf = { id: "file-explorer-leaf", getViewState: () => ({ type: "file-explorer" }) } as any;
    const splitResult = { id: "split-leaf" } as any;

    const originalGetLeaf = vi.fn().mockReturnValue("main-split-leaf");
    const createLeafBySplit = vi.fn().mockReturnValue(splitResult);
    const app = {
      workspace: {
        getLeftLeaf: vi.fn(),
        getRightLeaf: vi.fn(),
        getLeaf: originalGetLeaf,
        createLeafBySplit,
        revealLeaf: vi.fn(),
        setActiveLeaf: vi.fn(),
      },
    } as any;

    const engine = {
      getActiveLeafInWindow: vi.fn().mockReturnValue(sideLeaf),
      isLeafInSideColumn: vi.fn().mockImplementation((win, leaf) => leaf === sideLeaf),
      getCenterLeafSync: vi.fn().mockReturnValue(centerLeaf),
      openSideLeafSync: vi.fn(),
    } as any;

    const interceptor = new WorkspaceInterceptor(app, engine);
    interceptor.isManagedWindow = () => true;
    interceptor.install();
    (globalThis as any).activeWindow = popoutWin;

    try {
      const leaf = app.workspace.getLeaf("split");
      expect(leaf).toBe(splitResult);
      expect(engine.getCenterLeafSync).toHaveBeenCalledWith(popoutWin);
      expect(createLeafBySplit).toHaveBeenCalledWith(centerLeaf);
      expect(originalGetLeaf).not.toHaveBeenCalled();
    } finally {
      interceptor.uninstall();
      delete (globalThis as any).activeWindow;
    }
  });

  test("routes getLeaf('split') from a content pane through the remembered center engine", () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;

    const contentLeaf = { id: "content-editor-leaf", getViewState: () => ({ type: "markdown" }) } as any;
    const splitResult = { id: "content-split-leaf" } as any;
    const originalGetLeaf = vi.fn().mockReturnValue("native-split-leaf");
    const createLeafBySplit = vi.fn().mockReturnValue(splitResult);
    const app = {
      workspace: {
        getLeftLeaf: vi.fn(),
        getRightLeaf: vi.fn(),
        getLeaf: originalGetLeaf,
        createLeafBySplit,
        revealLeaf: vi.fn(),
        setActiveLeaf: vi.fn(),
      },
    } as any;

    const engine = {
      getActiveLeafInWindow: vi.fn().mockReturnValue(contentLeaf),
      isLeafInSideColumn: vi.fn().mockReturnValue(false),
      getCenterLeafSync: vi.fn().mockReturnValue(contentLeaf),
      openSideLeafSync: vi.fn(),
    } as any;

    const interceptor = new WorkspaceInterceptor(app, engine);
    interceptor.isManagedWindow = () => true;
    interceptor.install();
    (globalThis as any).activeWindow = popoutWin;

    try {
      const leaf = app.workspace.getLeaf("split");
      expect(leaf).toBe(splitResult);
      expect(engine.getCenterLeafSync).toHaveBeenCalledWith(popoutWin);
      expect(createLeafBySplit).toHaveBeenCalledWith(contentLeaf);
      expect(originalGetLeaf).not.toHaveBeenCalled();
    } finally {
      interceptor.uninstall();
      delete (globalThis as any).activeWindow;
    }
  });

  test("getLeaf('split') in popout falls back to native when createLeafBySplit is unavailable", () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;

    const centerLeaf = { id: "center-editor-leaf", getViewState: () => ({ type: "markdown" }) } as any;
    const sideLeaf = { id: "file-explorer-leaf", getViewState: () => ({ type: "file-explorer" }) } as any;

    const originalGetLeaf = vi.fn().mockReturnValue("native-split-leaf");
    const app = {
      workspace: {
        getLeftLeaf: vi.fn(),
        getRightLeaf: vi.fn(),
        getLeaf: originalGetLeaf,
        revealLeaf: vi.fn(),
        setActiveLeaf: vi.fn(),
      },
    } as any;

    const engine = {
      getActiveLeafInWindow: vi.fn().mockReturnValue(sideLeaf),
      isLeafInSideColumn: vi.fn().mockImplementation((win, leaf) => leaf === sideLeaf),
      getCenterLeafSync: vi.fn().mockReturnValue(centerLeaf),
      openSideLeafSync: vi.fn(),
    } as any;

    const interceptor = new WorkspaceInterceptor(app, engine);
    interceptor.isManagedWindow = () => true;
    interceptor.install();
    (globalThis as any).activeWindow = popoutWin;

    try {
      const leaf = app.workspace.getLeaf("split");
      expect(leaf).toBe("native-split-leaf");
      expect(originalGetLeaf).toHaveBeenCalled();
    } finally {
      interceptor.uninstall();
      delete (globalThis as any).activeWindow;
    }
  });

  test("isLeafInSideColumn detects whether leaf is inside a sidebar-marked column", () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    const leftColEl = document.createElement("div");
    leftColEl.classList.add("workspace-tabs");
    leftColEl.classList.add("window-spaces-sidebar-column");
    const leftLeafEl = document.createElement("div");
    leftColEl.appendChild(leftLeafEl);

    const centerColEl = document.createElement("div");
    centerColEl.classList.add("workspace-tabs");
    const centerLeafEl = document.createElement("div");
    centerColEl.appendChild(centerLeafEl);

    const rightColEl = document.createElement("div");
    rightColEl.classList.add("workspace-tabs");
    rightColEl.classList.add("window-spaces-sidebar-column");
    const rightLeafEl = document.createElement("div");
    rightColEl.appendChild(rightLeafEl);

    rootEl.appendChild(leftColEl);
    rootEl.appendChild(centerColEl);
    rootEl.appendChild(rightColEl);
    document.body.appendChild(rootEl);

    const leftLeaf = { containerEl: leftLeafEl, view: { containerEl: leftLeafEl } } as any;
    const centerLeaf = { containerEl: centerLeafEl, view: { containerEl: centerLeafEl } } as any;
    const rightLeaf = { containerEl: rightLeafEl, view: { containerEl: rightLeafEl } } as any;

    const workspace = {
      activeLeaf: leftLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(centerLeaf);
        cb(rightLeaf);
      },
    } as any;

    const engine = new PopoutLayoutEngine({ workspace } as any);
    expect(engine.isLeafInSideColumn(window, leftLeaf)).toBe(true);
    expect(engine.isLeafInSideColumn(window, rightLeaf)).toBe(true);
    expect(engine.isLeafInSideColumn(window, centerLeaf)).toBe(false);

    document.body.removeChild(rootEl);
  });

  test("routes through the participant whose policy manages the active window", () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;
    const workspace = {
      getLeftLeaf: vi.fn().mockReturnValue("main-left-leaf"),
      getRightLeaf: vi.fn().mockReturnValue(null),
    } as any;
    const engineA = { openSideLeafSync: vi.fn().mockReturnValue("wrong-engine") } as any;
    const engineB = { openSideLeafSync: vi.fn().mockReturnValue("managed-engine") } as any;
    const app = { workspace } as any;
    (globalThis as any).activeWindow = popoutWin;

    acquireWorkspaceInterceptor(app, {
      id: "policy-test-a",
      engine: engineA,
      isManagedWindow: () => false,
    });
    acquireWorkspaceInterceptor(app, {
      id: "policy-test-b",
      engine: engineB,
      isManagedWindow: () => true,
    });

    try {
      expect(workspace.getLeftLeaf(false)).toBe("managed-engine");
      expect(engineA.openSideLeafSync).not.toHaveBeenCalled();
      expect(engineB.openSideLeafSync).toHaveBeenCalledWith(popoutWin, "left");
    } finally {
      releaseWorkspaceInterceptor("policy-test-a");
      releaseWorkspaceInterceptor("policy-test-b");
      delete (globalThis as any).activeWindow;
    }
  });

  test("keeps one coordinator patch while participants load and unload", () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;
    const originalLeft = vi.fn().mockReturnValue("main-left-leaf");
    const workspace = {
      getLeftLeaf: originalLeft,
      getRightLeaf: vi.fn().mockReturnValue(null),
    } as any;
    const engineA = { openSideLeafSync: vi.fn().mockReturnValue("participant-a") } as any;
    const engineB = { openSideLeafSync: vi.fn().mockReturnValue("participant-b") } as any;
    const app = { workspace } as any;
    (globalThis as any).activeWindow = popoutWin;

    acquireWorkspaceInterceptor(app, {
      id: "coordinator-test-a",
      engine: engineA,
      isManagedWindow: () => true,
    });
    acquireWorkspaceInterceptor(app, {
      id: "coordinator-test-b",
      engine: engineB,
      isManagedWindow: () => true,
    });

    try {
      expect(workspace.getLeftLeaf(false)).toBe("participant-a");
      expect(workspace.getRightLeaf(false)).toBe("participant-a");
      releaseWorkspaceInterceptor("coordinator-test-a");
      expect(workspace.getLeftLeaf(false)).toBe("participant-b");
      expect(workspace.getRightLeaf(false)).toBe("participant-b");
    } finally {
      releaseWorkspaceInterceptor("coordinator-test-b");
      delete (globalThis as any).activeWindow;
    }

    expect(workspace.getLeftLeaf).toBe(originalLeft);
  });

  test("shared interceptor preserves document.hasFocus receivers with Window Spaces loaded first", async () => {
    const globalObject = globalThis as unknown as { activeWindow?: Window };
    const previousActiveWindow = globalObject.activeWindow;
    const mainHasFocus = vi.spyOn(document, "hasFocus").mockImplementation(function (this: Document) {
      if (this !== document) throw new Error("document.hasFocus receiver was lost");
      return false;
    });
    const popoutDocument: {
      body: { classList: { contains: (name: string) => boolean } };
      defaultView?: Window;
      hasFocus: (this: unknown) => boolean;
    } = {
      body: { classList: { contains: (name) => name === "is-popout-window" } },
      hasFocus() {
        if (this !== popoutDocument) throw new Error("popout document.hasFocus receiver was lost");
        return true;
      },
    };
    const popoutWindow = { document: popoutDocument } as unknown as Window;
    popoutDocument.defaultView = popoutWindow;
    const leaf = {
      containerEl: { ownerDocument: popoutDocument },
      setViewState: vi.fn().mockResolvedValue(undefined),
      loadIfDeferred: vi.fn().mockResolvedValue(undefined),
    } as any;
    const originalGetLeavesOfType = vi.fn().mockReturnValue([leaf]);
    const originalLeft = vi.fn().mockReturnValue("main-left-leaf");
    const workspace = {
      getLeftLeaf: originalLeft,
      getLeavesOfType: originalGetLeavesOfType,
      iterateAllLeaves: (callback: (candidate: unknown) => void) => callback(leaf),
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
      requestSaveLayout: vi.fn().mockResolvedValue(undefined),
    } as any;
    const windowEngine = {
      getColumnElement: vi.fn().mockReturnValue(null),
      findLeafOfTypeInColumn: vi.fn().mockReturnValue(null),
      openSideLeafSync: vi.fn().mockReturnValue(leaf),
    } as any;
    const folderEngine = {
      openSideLeafSync: vi.fn().mockReturnValue("folder-engine"),
    } as any;
    const app = { workspace } as any;
    globalObject.activeWindow = popoutWindow;

    acquireWorkspaceInterceptor(app, {
      id: "window-spaces-load-order-regression",
      engine: windowEngine,
      isManagedWindow: (win) => win === popoutWindow,
    });
    acquireWorkspaceInterceptor(app, {
      id: "folder-spaces-load-order-regression",
      engine: folderEngine,
      isManagedWindow: () => false,
    });

    try {
      expect(workspace.getLeftLeaf(false)).toBe(leaf);
      expect(windowEngine.openSideLeafSync).toHaveBeenCalledWith(popoutWindow, "left");
      expect(workspace.getLeavesOfType("tag")).toEqual([leaf]);
      await workspace.ensureSideLeaf("tag", "left", { active: true });

      delete globalObject.activeWindow;
      expect(workspace.getLeavesOfType("tag")).toEqual([leaf]);
    } finally {
      releaseWorkspaceInterceptor("folder-spaces-load-order-regression");
      releaseWorkspaceInterceptor("window-spaces-load-order-regression");
      mainHasFocus.mockRestore();
      if (previousActiveWindow === undefined) delete globalObject.activeWindow;
      else globalObject.activeWindow = previousActiveWindow;
    }
  });

  test("getLeavesOfType filters leaves to the active window", () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;
    const otherWin = {
      document: { body: { classList: { contains: (cls: string) => cls === "is-popout-window" } } },
    } as unknown as Window;
    const leafInOtherWindow = {
      containerEl: { ownerDocument: { defaultView: otherWin } },
    } as any;
    const leafInPopout = {
      containerEl: { ownerDocument: { defaultView: popoutWin } },
    } as any;
    const originalGetLeavesOfType = vi.fn().mockReturnValue([leafInOtherWindow, leafInPopout]);
    const app = {
      workspace: {
        getLeftLeaf: vi.fn().mockReturnValue(null),
        getRightLeaf: vi.fn().mockReturnValue(null),
        getLeavesOfType: originalGetLeavesOfType,
      },
    } as any;
    const interceptor = new WorkspaceInterceptor(app);
    interceptor.install();
    (globalThis as any).activeWindow = popoutWin;

    try {
      const leaves = app.workspace.getLeavesOfType("grid-view");
      expect(leaves).toEqual([leafInPopout]);
      expect(originalGetLeavesOfType).toHaveBeenCalledWith("grid-view");
    } finally {
      interceptor.uninstall();
      delete (globalThis as any).activeWindow;
    }
  });

  test("does not route a main-window API call while a popout remains active", () => {
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as unknown as Window;
    const originalGetLeftLeaf = vi.fn().mockReturnValue("main-left-leaf");
    const app = {
      workspace: {
        getLeftLeaf: originalGetLeftLeaf,
        getRightLeaf: vi.fn().mockReturnValue(null),
      },
    } as any;
    const interceptor = new WorkspaceInterceptor(app);
    interceptor.isManagedWindow = () => true;
    interceptor.install();
    const openSideLeafSync = vi.spyOn((interceptor as any).engine, "openSideLeafSync");
    const hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(true);
    (globalThis as any).activeWindow = popoutWin;

    try {
      expect(app.workspace.getLeftLeaf(false)).toBe("main-left-leaf");
      expect(originalGetLeftLeaf).toHaveBeenCalledWith(false);
      expect(openSideLeafSync).not.toHaveBeenCalled();
    } finally {
      hasFocus.mockRestore();
      delete (globalThis as any).activeWindow;
      interceptor.uninstall();
    }
  });

  test("WorkspaceInterceptor ignores main window and only intercepts popout window sidebar leaves", () => {
    const popoutWin = {
      document: { body: { classList: { contains: (cls: string) => cls === "is-popout-window" } }, hasFocus: () => true },
    } as unknown as Window;

    const originalGetLeftLeaf = vi.fn().mockReturnValue(null);

    const app = {
      workspace: {
        getLeftLeaf: originalGetLeftLeaf,
        getRightLeaf: vi.fn().mockReturnValue(null),
      },
    } as any;

    const interceptor = new WorkspaceInterceptor(app);
    interceptor.isManagedWindow = () => true;
    interceptor.install();

    // 1. 當 activeWindow 為主視窗 (window) 時，禁止攔截
    (globalThis as any).activeWindow = window;
    app.workspace.getLeftLeaf(false);
    expect(originalGetLeftLeaf).toHaveBeenCalled();

    // 2. 當 activeWindow 為 Popout 時，進行攔截
    (globalThis as any).activeWindow = popoutWin;
    const openSideLeafSync = vi
      .spyOn((interceptor as any).engine, "openSideLeafSync")
      .mockReturnValue({ id: "popout-side-leaf" });
    const leaf = app.workspace.getLeftLeaf(false);
    expect(openSideLeafSync).toHaveBeenCalledWith(popoutWin, "left");
    expect(leaf).toEqual({ id: "popout-side-leaf" });

    interceptor.uninstall();
    delete (globalThis as any).activeWindow;
  });
});


describe("PopoutActivityBarManager toggle behavior", () => {
  function buildManager() {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    function makeColumn(leaves: any[]): HTMLElement {
      const colEl = document.createElement("div");
      colEl.classList.add("workspace-tabs");
      for (const leaf of leaves) {
        const contentEl = document.createElement("div");
        colEl.appendChild(contentEl);
        leaf.containerEl = contentEl;
        leaf.view = { containerEl: contentEl };
      }
      rootEl.appendChild(colEl);
      return colEl;
    }

    function makeTab(active: boolean): HTMLElement {
      const tabEl = document.createElement("div");
      tabEl.classList.add("workspace-tab-header");
      if (active) tabEl.classList.add("is-active");
      return tabEl;
    }

    const leftLeaf = { getViewState: () => ({ type: "file-explorer" }), tabEl: makeTab(false) };
    const centerLeaf = { getViewState: () => ({ type: "markdown" }), tabEl: makeTab(true) };
    const bookmarksLeaf = { getViewState: () => ({ type: "bookmarks" }), tabEl: makeTab(true) };
    const tagLeaf = { getViewState: () => ({ type: "tag" }), tabEl: makeTab(false) };

    const leftColEl = makeColumn([leftLeaf]);
    const centerColEl = makeColumn([centerLeaf]);
    const rightColEl = makeColumn([bookmarksLeaf, tagLeaf]);

    document.body.appendChild(rootEl);

    const workspace = {
      getMostRecentLeaf: () => centerLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(centerLeaf);
        cb(bookmarksLeaf);
        cb(tagLeaf);
      },
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
    };

    const app = { workspace } as any;
    const engine = new PopoutLayoutEngine(app);
    // 模擬 managed Popout：activityBar 已寫入物理側欄 hints（左右皆有）
    engine.setSidebarSides(window, { left: true, right: true });
    const manager = new PopoutActivityBarManager(
      {
        app,
        settings: {
          showActivityBars: true,
          activityBars: {
            left: [],
            right: [
              { viewType: "bookmarks", side: "right" },
              { viewType: "tag", side: "right" },
            ],
          },
        },
      } as any,
      engine
    );

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

    return {
      manager,
      engine,
      win: window,
      leftColEl,
      centerColEl,
      rightColEl,
      leftLeaf,
      centerLeaf,
      bookmarksLeaf,
      tagLeaf,
      workspace,
    };
  }

  test("right column toggle re-shows the hidden right column (not the center)", () => {
    const { manager, win, rightColEl } = buildManager();

    (manager as any).toggleColumn(win, "right");
    expect(rightColEl.style.display).toBe("none");

    (manager as any).toggleColumn(win, "right");
    expect(rightColEl.style.display).toBe("");
  });

  test("flex-grow columns fill released space automatically when a sidebar is hidden", async () => {
    const { manager, win, leftColEl, centerColEl, rightColEl } = buildManager();
    leftColEl.style.flexGrow = "20";
    centerColEl.style.flexGrow = "60";
    rightColEl.style.flexGrow = "20";

    // 隱藏側欄釋放的權重只轉給 content，保留另一側 sidebar 的寬度。
    await (manager as any).toggleColumn(win, "right");
    expect(rightColEl.style.display).toBe("none");
    expect(leftColEl.style.flexGrow).toBe("20");
    expect(centerColEl.style.flexGrow).toBe("80");

    await (manager as any).toggleColumn(win, "right");
    expect(rightColEl.style.display).toBe("");
    expect(rightColEl.style.flexGrow).toBe("20");
  });

  test("initial dual activity bars use 25/50/25 column weights", () => {
    const { manager, win, leftColEl, centerColEl, rightColEl } = buildManager();

    (manager as any).applyDefaultColumnSizing(win, true, true);

    expect(leftColEl.style.flexGrow).toBe("25");
    expect(centerColEl.style.flexGrow).toBe("50");
    expect(rightColEl.style.flexGrow).toBe("25");
  });

  test("refreshes Activity Bar controls without reapplying saved layout dimensions", () => {
    const { manager, win } = buildManager();
    const layout = {
      id: "saved-activity-controls",
      name: "Saved activity controls",
      activityBars: {
        left: { show: true, items: [{ viewType: "file-explorer", side: "left" }] },
        right: { show: true, items: [{ viewType: "bookmarks", side: "right" }] },
      },
      workspace: { layout: { type: "window", children: [] } },
    };
    (manager as any).plugin.settings.spaces = [layout];
    (win as any)._windowSpacesLayoutId = layout.id;

    const renderBar = vi.spyOn(manager as any, "renderBar").mockImplementation(() => {});
    const updateActiveStates = vi.spyOn(manager, "updateActiveStates").mockImplementation(() => {});
    const applySavedLayoutDimensions = vi
      .spyOn(manager as any, "applySavedLayoutDimensions")
      .mockImplementation(() => {});

    manager.refreshWindowActivityBars(win);

    expect(renderBar).toHaveBeenCalledTimes(2);
    expect(updateActiveStates).toHaveBeenCalledWith(win);
    expect(applySavedLayoutDimensions).not.toHaveBeenCalled();

    delete (win as any)._windowSpacesLayoutId;
  });

  test("hiding one sidebar transfers only its weight to content and restores it on show", async () => {
    const { manager, win, leftColEl, centerColEl, rightColEl } = buildManager();
    leftColEl.style.flexGrow = "25";
    centerColEl.style.flexGrow = "50";
    rightColEl.style.flexGrow = "25";

    await (manager as any).toggleSideSidebar(win, "right");

    expect(leftColEl.style.flexGrow).toBe("25");
    expect(centerColEl.style.flexGrow).toBe("75");
    expect(rightColEl.style.flexGrow).toBe("25");

    await (manager as any).toggleSideSidebar(win, "right");

    expect(leftColEl.style.flexGrow).toBe("25");
    expect(centerColEl.style.flexGrow).toBe("50");
    expect(rightColEl.style.flexGrow).toBe("25");
  });

  test("persists pre-hide weights and restores them after a Space reload", async () => {
    const { manager, win, leftColEl, centerColEl, rightColEl } = buildManager();
    const spaceLayout = {
      name: "Reloaded sidebar widths",
      hidden: {},
      workspace: { layout: {} },
    } as any;
    (manager as any).getLayoutForWindow = vi.fn(() => spaceLayout);
    leftColEl.style.flexGrow = "25";
    centerColEl.style.flexGrow = "50";
    rightColEl.style.flexGrow = "25";

    await (manager as any).toggleSideSidebar(win, "left");

    expect(spaceLayout.hidden.sidebarFlex).toEqual({
      left: 25,
      center: [50],
      right: 25,
    });
    expect(centerColEl.style.flexGrow).toBe("75");
    expect(rightColEl.style.flexGrow).toBe("25");

    // Simulate a newly restored Window: the WeakMap snapshot no longer exists.
    (manager as any).sidebarFlexSnapshots.delete(win);
    await (manager as any).toggleSideSidebar(win, "left");

    expect(leftColEl.style.flexGrow).toBe("25");
    expect(centerColEl.style.flexGrow).toBe("50");
    expect(rightColEl.style.flexGrow).toBe("25");
    expect(spaceLayout.hidden.sidebarFlex).toBeUndefined();
  });

  test("enforces a 200px re-shown sidebar minimum without changing the opposite sidebar", async () => {
    const { manager, win, leftColEl, centerColEl, rightColEl } = buildManager();
    const spaceLayout = {
      name: "Minimum sidebar width",
      hidden: {
        leftSidebar: true,
        sidebarFlex: { left: 5, center: [70], right: 25 },
      },
      workspace: { layout: {} },
    } as any;
    (manager as any).getLayoutForWindow = vi.fn(() => spaceLayout);
    leftColEl.style.flexGrow = "5";
    centerColEl.style.flexGrow = "70";
    rightColEl.style.flexGrow = "25";
    (manager as any).sidebarFlexSnapshots.delete(win);
    (manager as any).engine.hideColumn(win, "left");
    vi.spyOn(leftColEl, "getBoundingClientRect").mockReturnValue({ width: 100 } as DOMRect);

    await (manager as any).toggleSideSidebar(win, "left");

    // Current flex 5 renders as 100px, so 200px requires flex 10.
    expect(Number(leftColEl.style.flexGrow)).toBeCloseTo(10, 5);
    expect(Number(centerColEl.style.flexGrow)).toBeCloseTo(65, 5);
    expect(rightColEl.style.flexGrow).toBe("25");
  });

  test("enforces a 200px minimum for a newly appended sidebar after a multi-column content area", () => {
    const { manager, win, leftColEl, centerColEl, rightColEl } = buildManager();
    const appendedSidebar = document.createElement("div");
    appendedSidebar.classList.add("workspace-tabs");
    document.body.appendChild(appendedSidebar);

    const columns = [leftColEl, centerColEl, rightColEl, appendedSidebar];
    vi.spyOn(manager.engine, "getTopLevelColumnElements").mockReturnValue(columns);
    vi.spyOn(manager.engine, "getColumnElement").mockImplementation((_win, side) =>
      side === "left" ? leftColEl : appendedSidebar
    );

    leftColEl.style.flexGrow = "25";
    centerColEl.style.flexGrow = "50";
    rightColEl.style.flexGrow = "25";
    appendedSidebar.style.flexGrow = "1";
    vi.spyOn(appendedSidebar, "getBoundingClientRect").mockReturnValue({ width: 10 } as DOMRect);

    (manager as any).ensureSidebarMinimumWidth(win, "right");

    // The appended right sidebar starts at the neutral flex weight 1. Its
    // missing width is taken from content columns only; the left sidebar is
    // unchanged and the right side reaches the 200px-equivalent weight.
    expect(Number(appendedSidebar.style.flexGrow)).toBeCloseTo(20, 5);
    expect(leftColEl.style.flexGrow).toBe("25");
    expect(Number(centerColEl.style.flexGrow) + Number(rightColEl.style.flexGrow)).toBeCloseTo(56, 5);

    appendedSidebar.remove();
  });

  test("restore reapplies saved dimensions as flex-grow weights to top-level and nested splits", () => {
    document.body.replaceChildren();
    const { manager, win, leftColEl, centerColEl, rightColEl } = buildManager();
    const nestedSplitEl = document.createElement("div");
    nestedSplitEl.classList.add("workspace-split");
    const nestedTopEl = document.createElement("div");
    nestedTopEl.classList.add("workspace-tabs");
    const nestedBottomEl = document.createElement("div");
    nestedBottomEl.classList.add("workspace-tabs");
    nestedSplitEl.append(nestedTopEl, nestedBottomEl);
    rightColEl.replaceWith(nestedSplitEl);

    const plugin = (manager as any).plugin;
    plugin.settings.spaces = [{
      id: "saved-dimensions",
      name: "Saved dimensions",
      timestamp: 1,
      workspace: {
        layout: {
          type: "window",
          children: [
            { type: "tabs", dimension: 25 },
            { type: "tabs", dimension: 40 },
            {
              type: "split",
              dimension: 35,
              children: [
                { type: "tabs", dimension: 70 },
                { type: "tabs", dimension: 30 },
              ],
            },
          ],
        },
      },
    }];
    (win as any)._windowSpacesLayoutId = "saved-dimensions";

    (manager as any).applySavedLayoutDimensions(win);

    expect(leftColEl.style.flexGrow).toBe("25");
    expect(centerColEl.style.flexGrow).toBe("40");
    expect(nestedSplitEl.style.flexGrow).toBe("35");
    expect(nestedTopEl.style.flexGrow).toBe("70");
    expect(nestedBottomEl.style.flexGrow).toBe("30");

    delete (win as any)._windowSpacesLayoutId;
  });

  test("syncSidebarColumnClasses applies sidebar classes to nested-split container AND its tabs groups", () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    const leftColEl = document.createElement("div");
    leftColEl.classList.add("workspace-tabs");
    const leftLeafEl = document.createElement("div");
    leftColEl.appendChild(leftLeafEl);
    rootEl.appendChild(leftColEl);

    const centerColEl = document.createElement("div");
    centerColEl.classList.add("workspace-tabs");
    const centerLeafEl = document.createElement("div");
    centerColEl.appendChild(centerLeafEl);
    rootEl.appendChild(centerColEl);

    // 右側欄為巢狀水平 split（兩個 tab group）＝頂層欄位是 workspace-split（最後一個頂層欄）
    const rightSplitEl = document.createElement("div");
    rightSplitEl.classList.add("workspace-split", "mod-horizontal");
    const rightTopTabsEl = document.createElement("div");
    rightTopTabsEl.classList.add("workspace-tabs");
    const rightTopLeafEl = document.createElement("div");
    rightTopTabsEl.appendChild(rightTopLeafEl);
    const rightBottomTabsEl = document.createElement("div");
    rightBottomTabsEl.classList.add("workspace-tabs");
    const rightBottomLeafEl = document.createElement("div");
    rightBottomTabsEl.appendChild(rightBottomLeafEl);
    rightSplitEl.appendChild(rightTopTabsEl);
    rightSplitEl.appendChild(rightBottomTabsEl);
    rootEl.appendChild(rightSplitEl);
    document.body.appendChild(rootEl);

    const leftLeaf = { containerEl: leftLeafEl, view: { containerEl: leftLeafEl } } as any;
    const centerLeaf = { containerEl: centerLeafEl, view: { containerEl: centerLeafEl } } as any;
    const rightTopLeaf = { containerEl: rightTopLeafEl, view: { containerEl: rightTopLeafEl } } as any;
    const rightBottomLeaf = { containerEl: rightBottomLeafEl, view: { containerEl: rightBottomLeafEl } } as any;

    const workspace = {
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(centerLeaf);
        cb(rightTopLeaf);
        cb(rightBottomLeaf);
      },
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
    } as any;
    const app = { workspace } as any;
    const engine = new PopoutLayoutEngine(app);
    const manager = new PopoutActivityBarManager(
      {
        app,
        settings: { showActivityBars: true, activityBars: { left: [], right: [] } },
      } as any,
      engine
    );

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

    (manager as any).syncSidebarColumnClasses(window);

    // split 容器有 window-spaces-sidebar-column 與 mod-* class（resize handle 需要 mod-right-split）
    expect(rightSplitEl.classList.contains("mod-right-split")).toBe(true);
    expect(rightSplitEl.classList.contains("mod-sidedock")).toBe(true);
    expect(rightSplitEl.classList.contains("window-spaces-sidebar-column")).toBe(true);
    // 內部的每個 tab group 也套用 mod-right-split / mod-sidedock
    expect(rightTopTabsEl.classList.contains("mod-right-split")).toBe(true);
    expect(rightTopTabsEl.classList.contains("mod-sidedock")).toBe(true);
    expect(rightBottomTabsEl.classList.contains("mod-right-split")).toBe(true);
    expect(rightBottomTabsEl.classList.contains("mod-sidedock")).toBe(true);
    // 中央欄位不受影響
    expect(centerColEl.classList.contains("mod-sidedock")).toBe(false);

    document.body.removeChild(rootEl);
  });

  test("syncSidebarColumnClasses marks previous column when next column is hidden (no :has)", () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    const leftColEl = document.createElement("div");
    leftColEl.classList.add("workspace-tabs");
    const leftLeafEl = document.createElement("div");
    leftColEl.appendChild(leftLeafEl);
    rootEl.appendChild(leftColEl);

    const centerColEl = document.createElement("div");
    centerColEl.classList.add("workspace-tabs");
    const centerLeafEl = document.createElement("div");
    centerColEl.appendChild(centerLeafEl);
    rootEl.appendChild(centerColEl);

    // 右側欄為收合狀態（hidden class 由 engine.hideColumn 寫入）
    const rightColEl = document.createElement("div");
    rightColEl.classList.add("workspace-tabs", "window-spaces-column-hidden");
    const rightLeafEl = document.createElement("div");
    rightColEl.appendChild(rightLeafEl);
    rootEl.appendChild(rightColEl);
    document.body.appendChild(rootEl);

    const leftLeaf = { containerEl: leftLeafEl, view: { containerEl: leftLeafEl } } as any;
    const centerLeaf = { containerEl: centerLeafEl, view: { containerEl: centerLeafEl } } as any;
    const rightLeaf = { containerEl: rightLeafEl, view: { containerEl: rightLeafEl } } as any;

    const workspace = {
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(centerLeaf);
        cb(rightLeaf);
      },
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
    } as any;
    const app = { workspace } as any;
    const engine = new PopoutLayoutEngine(app);
    const manager = new PopoutActivityBarManager(
      {
        app,
        settings: { showActivityBars: true, activityBars: { left: [], right: [] } },
      } as any,
      engine
    );
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

    (manager as any).syncSidebarColumnClasses(window);

    // 中央欄的下一欄（右側欄）hidden → 中央欄被標記
    expect(centerColEl.classList.contains("window-spaces-has-hidden-next")).toBe(true);
    // 左欄的下一欄（中央欄）非 hidden → 不標記
    expect(leftColEl.classList.contains("window-spaces-has-hidden-next")).toBe(false);
    // 最後一欄永遠不標記（無下一欄）
    expect(rightColEl.classList.contains("window-spaces-has-hidden-next")).toBe(false);

    document.body.removeChild(rootEl);
  });

  test("deferred sync re-applies sidebar classes after Obsidian rebuilds a tab group", async () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    const leftColEl = document.createElement("div");
    leftColEl.classList.add("workspace-tabs");
    const leftLeafEl = document.createElement("div");
    leftColEl.appendChild(leftLeafEl);
    rootEl.appendChild(leftColEl);

    const centerColEl = document.createElement("div");
    centerColEl.classList.add("workspace-tabs");
    const centerLeafEl = document.createElement("div");
    centerColEl.appendChild(centerLeafEl);
    rootEl.appendChild(centerColEl);

    const rightSplitEl = document.createElement("div");
    rightSplitEl.classList.add("workspace-split", "mod-horizontal");
    const rightTabsEl = document.createElement("div");
    rightTabsEl.classList.add("workspace-tabs");
    const rightLeafEl = document.createElement("div");
    rightTabsEl.appendChild(rightLeafEl);
    rightSplitEl.appendChild(rightTabsEl);
    rootEl.appendChild(rightSplitEl);
    document.body.appendChild(rootEl);

    const leftLeaf = { containerEl: leftLeafEl, view: { containerEl: leftLeafEl } } as any;
    const centerLeaf = { containerEl: centerLeafEl, view: { containerEl: centerLeafEl } } as any;
    const rightLeaf = { containerEl: rightLeafEl, view: { containerEl: rightLeafEl } } as any;

    const workspace = {
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(centerLeaf);
        cb(rightLeaf);
      },
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
    } as any;
    const app = { workspace } as any;
    const engine = new PopoutLayoutEngine(app);
    const manager = new PopoutActivityBarManager(
      {
        app,
        settings: { showActivityBars: true, activityBars: { left: [], right: [] } },
      } as any,
      engine
    );

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

    // 透過 updateActiveStates 觸發首次 sync + 排程 deferred rAF sync
    (manager as any).updateActiveStates(window);
    expect(rightSplitEl.classList.contains("mod-right-split")).toBe(true);

    // 模擬 Obsidian 拖 tab 後重建：新增一個沒有 sidebar class 的 tab group，
    // 且不再手動呼叫 sync（只有先前排程的 deferred sync 會執行）
    const newTabsEl = document.createElement("div");
    newTabsEl.classList.add("workspace-tabs");
    const newLeafEl = document.createElement("div");
    newTabsEl.appendChild(newLeafEl);
    rightSplitEl.appendChild(newTabsEl);
    const newLeaf = { containerEl: newLeafEl, view: { containerEl: newLeafEl } } as any;
    (workspace.iterateAllLeaves as any) = (cb: (leaf: any) => void) => {
      cb(leftLeaf);
      cb(centerLeaf);
      cb(rightLeaf);
      cb(newLeaf);
    };

    // 等待 deferred rAF sync（2 幀後）執行完畢
    await new Promise((r) => setTimeout(r, 50));

    expect(newTabsEl.classList.contains("mod-sidedock")).toBe(true);
    expect(newTabsEl.classList.contains("mod-right-split")).toBe(true);

    document.body.removeChild(rootEl);
  });

  test("all splits in a multi-split sidebar column clear sidebar classes when activity bar is hidden", () => {
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");

    const leftSplitEl = document.createElement("div");
    leftSplitEl.classList.add("workspace-split", "mod-horizontal", "window-spaces-sidebar-column");
    const leftTopTabsEl = document.createElement("div");
    leftTopTabsEl.classList.add("workspace-tabs", "window-spaces-sidebar-column", "mod-sidedock", "mod-left-split");
    const leftTopLeafEl = document.createElement("div");
    leftTopTabsEl.appendChild(leftTopLeafEl);
    leftSplitEl.appendChild(leftTopTabsEl);

    const leftBottomTabsEl = document.createElement("div");
    leftBottomTabsEl.classList.add("workspace-tabs", "mod-sidedock", "mod-left-split");
    const leftBottomLeafEl = document.createElement("div");
    leftBottomTabsEl.appendChild(leftBottomLeafEl);
    leftSplitEl.appendChild(leftBottomTabsEl);
    rootEl.appendChild(leftSplitEl);

    const centerColEl = document.createElement("div");
    centerColEl.classList.add("workspace-tabs");
    const centerLeafEl = document.createElement("div");
    centerColEl.appendChild(centerLeafEl);
    rootEl.appendChild(centerColEl);

    document.body.appendChild(rootEl);

    const leftTopLeaf = { containerEl: leftTopLeafEl, view: { containerEl: leftTopLeafEl } } as any;
    const leftBottomLeaf = { containerEl: leftBottomLeafEl, view: { containerEl: leftBottomLeafEl } } as any;
    const centerLeaf = { containerEl: centerLeafEl, view: { containerEl: centerLeafEl } } as any;

    const workspace = {
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftTopLeaf);
        cb(leftBottomLeaf);
        cb(centerLeaf);
      },
    } as any;
    const app = { workspace } as any;
    const engine = new PopoutLayoutEngine(app);
    const manager = new PopoutActivityBarManager(
      {
        app,
        settings: { showActivityBars: false, activityBarDefaults: { left: false, right: false } },
      } as any,
      engine
    );

    (manager as any).syncSidebarColumnClasses(window);

    // 頂層 split 容器與內部所有的 tabs 皆必須完全清除 sidebar class
    expect(leftSplitEl.classList.contains("window-spaces-sidebar-column")).toBe(false);
    expect(leftSplitEl.classList.contains("mod-sidedock")).toBe(false);
    expect(leftSplitEl.classList.contains("mod-left-split")).toBe(false);

    expect(leftTopTabsEl.classList.contains("window-spaces-sidebar-column")).toBe(false);
    expect(leftTopTabsEl.classList.contains("mod-sidedock")).toBe(false);
    expect(leftTopTabsEl.classList.contains("mod-left-split")).toBe(false);

    expect(leftBottomTabsEl.classList.contains("window-spaces-sidebar-column")).toBe(false);
    expect(leftBottomTabsEl.classList.contains("mod-sidedock")).toBe(false);
    expect(leftBottomTabsEl.classList.contains("mod-left-split")).toBe(false);

    document.body.removeChild(rootEl);
  });

  test("view button hides the sidebar when its view is displayed even if another view is workspace-active", async () => {
    const { manager, win, rightColEl, bookmarksLeaf, tagLeaf } = buildManager();
    // 模擬：使用者先點擊側欄外的 view（center 為 workspace active），bookmarks 的 tab
    // 失去 is-active，但 bookmarks 仍是側欄 tab group 中顯示的內容（container 可見），
    // tag 為背景 tab（container 不可見）。
    bookmarksLeaf.tabEl.classList.remove("is-active");
    tagLeaf.containerEl.style.display = "none";

    await (manager as any).toggleView(win, { viewType: "bookmarks", side: "right" });
    expect(rightColEl.style.display).toBe("none");
  });

  test("view button switches to its view when sidebar shows a different view", async () => {
    const { manager, win, rightColEl, bookmarksLeaf, tagLeaf, workspace } = buildManager();
    // bookmarks 為背景 tab（container 不可見），tag 為側欄顯示中的 view
    bookmarksLeaf.tabEl.classList.remove("is-active");
    bookmarksLeaf.containerEl.style.display = "none";
    tagLeaf.tabEl.classList.add("is-active");

    await (manager as any).toggleView(win, { viewType: "bookmarks", side: "right" });
    expect(rightColEl.style.display).not.toBe("none");
    expect(workspace.revealLeaf).toHaveBeenCalledWith(bookmarksLeaf);
    expect(workspace.setActiveLeaf).toHaveBeenCalledWith(bookmarksLeaf, { focus: true });
  });

  test("view button shows a hidden sidebar and activates its view", async () => {
    const { manager, win, rightColEl, bookmarksLeaf, workspace } = buildManager();
    rightColEl.style.display = "none";

    await (manager as any).toggleView(win, { viewType: "bookmarks", side: "right" });
    expect(rightColEl.style.display).toBe("");
    expect(workspace.revealLeaf).toHaveBeenCalledWith(bookmarksLeaf);
  });

  test("view button ignores the view outside its own sidebar and opens it in its own sidebar", async () => {
    const { manager, engine, win, centerColEl, rightColEl, bookmarksLeaf, workspace } = buildManager();
    // 將 bookmarks 移到中央編輯區：右側欄內不再有 bookmarks
    rightColEl.removeChild(bookmarksLeaf.containerEl);
    centerColEl.appendChild(bookmarksLeaf.containerEl);

    const ensureSpy = vi.spyOn(engine, "ensureSideColumn").mockResolvedValue(bookmarksLeaf as any);

    await (manager as any).toggleView(win, { viewType: "bookmarks", side: "right" });
    expect(ensureSpy).toHaveBeenCalledWith(win, "right", "bookmarks");
    expect(rightColEl.style.display).not.toBe("none");
    expect(workspace.revealLeaf).not.toHaveBeenCalled();
  });
});

describe("view icon resolution", () => {
  test("Spaces without an icon use the configured default icon", () => {
    expect(resolveSpaceIcon()).toBe("square");
    expect(resolveSpaceIcon("🚀")).toBe("🚀");
  });

  test("view icon resolution no longer consults viewRegistry.getIcon (step A removed)", () => {
    const app = {
      viewRegistry: {
        getIcon: () => "registry-icon",
        viewByType: {},
      },
    } as any;
    const btn = document.createElement("button");
    applyViewIcon(btn, app, "no-builtin-no-file");
    expect(btn.getAttribute("data-icon")).toBe("layout");
  });

  test("applyViewIcon falls back to layout when no file/builtin icon and no dynamic allowed", () => {
    const btn = document.createElement("button");
    applyViewIcon(btn, { workspace: {} } as any, "plugin-unknown-view");
    expect(btn.getAttribute("data-icon")).toBe("layout");
  });

  test("applyViewIcon uses a known plugin icon before the generic layout fallback", () => {
    const btn = document.createElement("button");
    applyViewIcon(btn, { workspace: {} } as any, "recent-files");
    expect(btn.getAttribute("data-icon")).toBe("clock");
  });

  test("applyViewIcon lets an open plugin view override its known fallback icon", async () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    const app = {
      workspace: {
        iterateAllLeaves: (cb: (leaf: any) => void) => {
          cb({ view: { getViewType: () => "notebook-navigator", getIcon: () => "notebook-tabs" } });
        },
      },
    } as any;

    applyViewIcon(btn, app, "notebook-navigator", { allowDynamicIcon: true });
    expect(btn.getAttribute("data-icon")).toBe("notebook-navigator");
    await vi.waitFor(() => expect(btn.getAttribute("data-icon")).toBe("notebook-tabs"));
  });

  test("ensureViewIcon finds icon from an open leaf across all windows", async () => {
    const app = {
      workspace: {
        iterateAllLeaves: (cb: (leaf: any) => void) => {
          cb({ view: { getViewType: () => "folder-spaces-explorer", getIcon: () => "folder" } });
          cb({ view: { getViewType: () => "markdown", getIcon: () => "file-text" } });
        },
      },
    } as any;

    expect(await ensureViewIcon(app, "folder-spaces-explorer")).toBe("folder");
    expect(resolveViewIcon(app, "folder-spaces-explorer")).toBe("folder");
  });

  test("ensureViewIcon uses viewByType[type] directly when it is the creator function", async () => {
    const app = {
      workspace: { iterateAllLeaves: () => {} },
      viewRegistry: {
        viewByType: {
          "folder-spaces-direct": (leaf: any) => ({ getIcon: () => "folders" }),
        },
      },
    } as any;

    expect(await ensureViewIcon(app, "folder-spaces-direct")).toBe("folders");
  });

  test("ensureViewIcon creates an ephemeral instance when no leaf is open", async () => {
    const app = {
      workspace: { iterateAllLeaves: () => {} },
      viewRegistry: {
        getViewCreator: (type: string) =>
          (leaf: any) => ({
            getIcon: () => (type === "folder-spaces-ghost" ? "folder-tree" : ""),
          }),
      },
    } as any;

    expect(await ensureViewIcon(app, "folder-spaces-ghost")).toBe("folder-tree");
  });

  test("ensureViewIcon uses the registry entry getIcon when present", async () => {
    const app = {
      workspace: { iterateAllLeaves: () => {} },
      viewRegistry: {
        viewByType: {
          "entry-icon-view": { getIcon: () => "boxes" },
        },
      },
    } as any;

    expect(await ensureViewIcon(app, "entry-icon-view")).toBe("boxes");
  });

  test("ensureViewIcon falls back to a real leaf, hides its container, and detaches after reading", async () => {
    const container = document.createElement("div");
    const leaf = {
      containerEl: container,
      view: { getIcon: () => "folder-gear" },
      setViewState: vi.fn().mockResolvedValue(undefined),
      detach: vi.fn(),
    } as any;
    const app = {
      workspace: {
        iterateAllLeaves: () => {},
        getLeaf: (type: string) => (type === "tab" ? leaf : null),
      },
      viewRegistry: {},
    } as any;

    expect(await ensureViewIcon(app, "real-leaf-fallback")).toBe("folder-gear");
    expect(container.style.display).toBe("none");
    expect(leaf.setViewState).toHaveBeenCalledWith({ type: "real-leaf-fallback", active: false, state: {} });
    expect(leaf.detach).toHaveBeenCalled();
  });

  test("applyViewIcon with allowDynamicIcon detects and applies the dynamic icon", async () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    const app = {
      workspace: {
        iterateAllLeaves: (cb: (leaf: any) => void) => {
          cb({ view: { getViewType: () => "folder-spaces-async", getIcon: () => "folder" } });
        },
      },
    } as any;

    applyViewIcon(btn, app, "folder-spaces-async", { allowDynamicIcon: true });
    expect(btn.getAttribute("data-icon")).toBe("layout");
    await vi.waitFor(() => expect(btn.getAttribute("data-icon")).toBe("folder"));
  });

  test("applyViewIcon does not re-attempt dynamic detection after it failed", async () => {
    const btn = document.createElement("button");
    const app = { workspace: { iterateAllLeaves: () => {} } } as any;

    applyViewIcon(btn, app, "folder-spaces-fail", { allowDynamicIcon: true });
    await vi.waitFor(() => expect(btn.getAttribute("data-icon")).toBe("layout"));
    // 第二次渲染（cache 已標記 dynamicAttempted）不應再次觸發動態偵測
    const btn2 = document.createElement("button");
    applyViewIcon(btn2, app, "folder-spaces-fail", { allowDynamicIcon: true });
    expect(btn2.getAttribute("data-icon")).toBe("layout");
  });
});

describe("viewRegistry enumeration", () => {
  test("factory defaults follow native sidebar grouping and return detached items", () => {
    const left = getDefaultActivityBarItems("left");
    const right = getDefaultActivityBarItems("right");

    expect(left.map((item) => item.viewType)).toEqual([
      "file-explorer",
      "search",
      "bookmarks",
      "window-spaces-layouts",
    ]);
    expect(right.map((item) => item.viewType)).toEqual([
      "outline",
      "all-properties",
      "tag",
      "backlink",
    ]);
    expect(left.map((item) => item.icon)).toEqual([
      "folder-closed",
      "search",
      "bookmark",
      "layout",
    ]);
    expect(right.map((item) => item.icon)).toEqual([
      "list",
      "archive",
      "tags",
      "links-coming-in",
    ]);

    left[0].icon = "custom-icon";
    expect(getDefaultActivityBarItems("left")[0].icon).toBe("folder-closed");
  });

  test("imports ordered, unique, embeddable views from the requested host sidebar", () => {
    const app = {
      workspace: {
        leftSplit: {
          children: [
            {
              view: {
                getViewType: () => "file-explorer",
                getIcon: () => "lucide-folder-closed",
                getDisplayText: () => "Files",
              },
            },
            {
              children: [
                { view: { getViewType: () => "some-plugin-view" } },
                { view: { getViewType: () => "some-plugin-view" } },
              ],
            },
            { view: { getViewType: () => "empty" } },
          ],
        },
        rightSplit: {
          children: [
            { getViewState: () => ({ type: "outline" }) },
            { view: { getViewType: () => "markdown" } },
          ],
        },
      },
    } as any;

    expect(getViewsFromHostSplit(app, "left")).toEqual([
      { viewType: "file-explorer", side: "left", label: "Files", icon: "lucide-folder-closed" },
      { viewType: "some-plugin-view", side: "left" },
    ]);
    expect(getViewsFromHostSplit(app, "right")).toEqual([
      { viewType: "outline", side: "right" },
    ]);
  });

  test("enumerateAvailableViews includes builtin views and dedupes", () => {
    const app = {
      viewRegistry: {
        getIcon: (type: string) => `icon-${type}`,
        getDisplayText: (type: string) => `Label ${type}`,
        viewByType: {
          "file-explorer": {},
          "some-plugin-view": {},
        },
      },
    } as any;

    const { left, right } = enumerateAvailableViews(app);
    const all = [...left, ...right].map((item) => item.viewType);

    expect(all).toContain("file-explorer"); // builtin kept, not duplicated
    expect(all).toContain("some-plugin-view"); // registry view appended
    expect(new Set(all).size).toBe(all.length); // no duplicates
  });

  test("enumerateAvailableViews handles missing viewRegistry gracefully", () => {
    const app = {} as any;
    const { left, right } = enumerateAvailableViews(app);
    expect(left.length).toBeGreaterThan(0);
    expect(right.length).toBeGreaterThan(0);
  });

  test("resolveViewLabel formats unknown viewType ID into Title Case", () => {
    const app = {} as any;

    expect(resolveViewLabel(app, "folder-spaces-explorer")).toBe("Folder Spaces Explorer");
    expect(resolveViewLabel(app, "grid-view")).toBe("Grid View");
  });

  test("sortViewTypesByLabel sorts by display name with a stable type tie-breaker", () => {
    const app = {
      viewRegistry: {
        getDisplayText: (type: string) => ({
          "z-view": "Beta",
          "a-view": "Alpha",
          "b-view": "Beta",
        }[type] || type),
      },
    } as any;

    expect(sortViewTypesByLabel(app, ["z-view", "b-view", "a-view"])).toEqual([
      "a-view",
      "b-view",
      "z-view",
    ]);
  });
});

describe("2-column layout sidebar inference (legacy / non-standard spaces)", () => {
  /**
   * 建立 2-column 結構：column 0 = vertical split（左欄 sidebar views + 中間
   * markdown editor 同欄），column 1 = 純 sidebar views。模擬 Professional
   * 這類由主視窗區域另開 popout 而保存的非標準 layout。
   */
  function buildTwoColumn() {
    document.body.replaceChildren();
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");
    document.body.appendChild(rootEl);

    const col0 = document.createElement("div");
    col0.classList.add("workspace-split");
    const leftTabsEl = document.createElement("div");
    leftTabsEl.classList.add("workspace-tabs");
    const midTabsEl = document.createElement("div");
    midTabsEl.classList.add("workspace-tabs");
    col0.appendChild(leftTabsEl);
    col0.appendChild(midTabsEl);

    const col1 = document.createElement("div");
    col1.classList.add("workspace-tabs");
    rootEl.appendChild(col0);
    rootEl.appendChild(col1);

    const mkLeaf = (type: string) => {
      const containerEl = document.createElement("div");
      const leaf = {
        containerEl,
        view: { containerEl },
        getViewState: () => ({ type }),
        getViewType: () => type,
        tabEl: document.createElement("div"),
      };
      return leaf;
    };
    const leftLeaf = mkLeaf("folder-spaces-explorer");
    const midLeaf = mkLeaf("markdown");
    const rightLeaf = mkLeaf("bookmarks");
    leftTabsEl.appendChild(leftLeaf.containerEl);
    midTabsEl.appendChild(midLeaf.containerEl);
    col1.appendChild(rightLeaf.containerEl);

    const workspace = {
      getMostRecentLeaf: () => midLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(midLeaf);
        cb(rightLeaf);
      },
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
    };
    const app = { workspace } as any;
    const engine = new PopoutLayoutEngine(app);
    const manager = new PopoutActivityBarManager(
      {
        app,
        settings: {
          activityBarDefaults: { left: true, right: true },
          activityBars: {
            left: [{ viewType: "window-spaces-layouts", side: "left" }],
            right: [{ viewType: "bookmarks", side: "right" }],
          },
          spaces: [
            {
              id: "prof",
              name: "Professional",
              activityBars: {
                left: { show: true, items: [{ viewType: "window-spaces-layouts", side: "left" }] },
                right: { show: true, items: [{ viewType: "bookmarks", side: "right" }] },
              },
              workspace: { layout: { type: "window", children: [] } },
            },
          ],
        } as any,
      },
      engine
    );
    (window as any)._windowSpacesLayoutId = "prof";

    return { manager, engine, col0, leftTabsEl, midTabsEl, col1 };
  }

  test("editor-holding left column is a sidebar when an activity bar is adjacent", async () => {
    const { manager, engine, col0, leftTabsEl, midTabsEl, col1 } = buildTwoColumn();

    await (manager as any).ensureLayoutColumns(window);
    (manager as any).syncSidebarColumnClasses(window);

    // 規則：activity bar 旁的最外層欄位就是 sidebar（不看欄位內容）。
    // 左欄與中間 markdown 同欄 ⇒ 整個 column 0 是左側欄（即使含 editor）。
    expect(engine.getSidebarSides(window)).toMatchObject({ left: true, right: true });

    // column 0（含 editor）被標記成 sidebar 樣式
    expect(col0.classList.contains("mod-left-split")).toBe(true);
    expect(col0.classList.contains("mod-sidedock")).toBe(true);
    expect(leftTabsEl.classList.contains("mod-sidedock")).toBe(true);
    expect(midTabsEl.classList.contains("mod-sidedock")).toBe(true);
    expect(col1.classList.contains("mod-right-split")).toBe(true);
    expect(col1.classList.contains("mod-sidedock")).toBe(true);

    // 兩側欄都可定址（toggle / view 按鈕有效）
    expect(engine.getColumnElement(window, "right")).toBe(col1);
    expect(engine.getColumnElement(window, "left")).toBe(col0);
  });

  test("3-column standard layout still infers both sidebars", async () => {
    document.body.replaceChildren();
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");
    document.body.appendChild(rootEl);

    const mkLeaf = (type: string) => {
      const containerEl = document.createElement("div");
      const leaf = {
        containerEl,
        view: { containerEl },
        getViewState: () => ({ type }),
        getViewType: () => type,
        tabEl: document.createElement("div"),
      };
      return leaf;
    };
    const leftLeaf = mkLeaf("folder-spaces-explorer");
    const centerLeaf = mkLeaf("markdown");
    const rightLeaf = mkLeaf("bookmarks");

    const leftCol = document.createElement("div");
    leftCol.classList.add("workspace-tabs");
    leftCol.appendChild(leftLeaf.containerEl);
    const centerCol = document.createElement("div");
    centerCol.classList.add("workspace-tabs");
    centerCol.appendChild(centerLeaf.containerEl);
    const rightCol = document.createElement("div");
    rightCol.classList.add("workspace-tabs");
    rightCol.appendChild(rightLeaf.containerEl);
    rootEl.appendChild(leftCol);
    rootEl.appendChild(centerCol);
    rootEl.appendChild(rightCol);

    const workspace = {
      getMostRecentLeaf: () => centerLeaf,
      iterateAllLeaves: (cb: (leaf: any) => void) => {
        cb(leftLeaf);
        cb(centerLeaf);
        cb(rightLeaf);
      },
      revealLeaf: vi.fn().mockResolvedValue(undefined),
      setActiveLeaf: vi.fn(),
    };
    const app = { workspace } as any;
    const engine = new PopoutLayoutEngine(app);
    const manager = new PopoutActivityBarManager(
      {
        app,
        settings: {
          activityBarDefaults: { left: true, right: true },
          activityBars: {
            left: [{ viewType: "window-spaces-layouts", side: "left" }],
            right: [{ viewType: "bookmarks", side: "right" }],
          },
          spaces: [
            {
              id: "three",
              name: "Three",
              activityBars: {
                left: { show: true, items: [] },
                right: { show: true, items: [] },
              },
              workspace: { layout: { type: "window", children: [] } },
            },
          ],
        } as any,
      },
      engine
    );
    (window as any)._windowSpacesLayoutId = "three";

    await (manager as any).ensureLayoutColumns(window);
    (manager as any).syncSidebarColumnClasses(window);

    expect(engine.getSidebarSides(window)).toMatchObject({ left: true, right: true });
    expect(engine.getColumnElement(window, "left")).toBe(leftCol);
    expect(engine.getColumnElement(window, "right")).toBe(rightCol);
    expect(leftCol.classList.contains("mod-left-split")).toBe(true);
    expect(rightCol.classList.contains("mod-right-split")).toBe(true);
    expect(centerCol.classList.contains("mod-sidedock")).toBe(false);
  });

  test("updateDragHandleIcon applies popout accent classes according to settings and color", () => {
    const app = { workspace: { iterateAllLeaves: vi.fn() } } as any;
    const engine = new PopoutLayoutEngine(app);
    const spaceWithColor = {
      id: "colored-space",
      name: "Colored",
      color: "#10b981",
      workspace: { layout: {} },
    };
    const settings = {
      defaultIcon: "square",
      defaultShowFoldedCorner: true,
      popoutAccents: {
        enabled: true,
        splitter: true,
        activityBar: true,
      },
      spaces: [spaceWithColor],
    } as any;
    const manager = new PopoutActivityBarManager({ app, settings } as any, engine);

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => {
        el.innerHTML = "";
      };
      el.createDiv = (opts?: any) => {
        const child = createMockEl("div");
        if (typeof opts === "string") child.className = opts;
        else if (opts?.cls) child.className = opts.cls;
        el.appendChild(child);
        return child;
      };
      el.createSpan = (opts?: any) => {
        const child = createMockEl("span");
        if (typeof opts === "string") child.className = opts;
        else if (opts?.cls) child.className = opts.cls;
        if (opts?.text) child.textContent = opts.text;
        el.appendChild(child);
        return child;
      };
      return el;
    };

    const testDoc = document.implementation.createHTMLDocument("Test Popout");
    const testWin = {
      document: testDoc,
      _windowSpacesLayoutId: "colored-space",
    } as unknown as Window;

    const leftBar = createMockEl("div");
    leftBar.className = "window-spaces-activity-bar window-spaces-activity-left";
    const dragEl = createMockEl("div");
    dragEl.className = "window-spaces-activity-drag";
    leftBar.appendChild(dragEl);
    const spaceIdentity = createMockEl("div");
    spaceIdentity.className = "window-spaces-space-identity";

    const bars = {
      left: leftBar,
      right: createMockEl("div"),
      spaceIdentity,
      buttons: { left: document.createElement("button"), right: document.createElement("button") },
    };

    (manager as any).updateDragHandleIcon(bars, testWin);

    const body = testWin.document.body;
    expect(body.classList.contains("has-window-space-color")).toBe(true);
    expect(body.classList.contains("has-space-accents-tab")).toBe(true);
    expect(body.classList.contains("has-space-accents-splitter")).toBe(true);
    expect(body.classList.contains("has-space-accents-panel")).toBe(true);
    expect(body.classList.contains("has-space-accents-activity-bar")).toBe(true);

    // Disable popout accents master toggle
    settings.popoutAccents.enabled = false;
    (manager as any).updateDragHandleIcon(bars, testWin);
    expect(body.classList.contains("has-space-accents-tab")).toBe(false);
    expect(body.classList.contains("has-space-accents-splitter")).toBe(false);
    expect(body.classList.contains("has-space-accents-panel")).toBe(false);
    expect(body.classList.contains("has-space-accents-activity-bar")).toBe(false);

    // Re-enable master toggle, disable activityBar
    settings.popoutAccents.enabled = true;
    settings.popoutAccents.activityBar = false;
    (manager as any).updateDragHandleIcon(bars, testWin);
    // tab / panel accents are always-on when the master toggle is on
    expect(body.classList.contains("has-space-accents-tab")).toBe(true);
    expect(body.classList.contains("has-space-accents-splitter")).toBe(true);
    expect(body.classList.contains("has-space-accents-panel")).toBe(true);
    expect(body.classList.contains("has-space-accents-activity-bar")).toBe(false);

    // Cleanup removes all classes
    (manager as any).barsByWindow.set(testWin, bars);
    (manager as any).injectedWindows.add(testWin);
    manager.cleanupWindow(testWin);
    expect(body.classList.contains("has-space-accents-tab")).toBe(false);
    expect(body.classList.contains("has-space-accents-splitter")).toBe(false);
    expect(body.classList.contains("has-space-accents-panel")).toBe(false);
    expect(body.classList.contains("has-space-accents-activity-bar")).toBe(false);
    expect(body.classList.contains("has-window-space-color")).toBe(false);
  });

  test("refreshWindowActivityBars applies Space decorations without restoring dimensions", () => {
    const app = { workspace: { iterateAllLeaves: vi.fn() } } as any;
    const engine = new PopoutLayoutEngine(app);
    const space = {
      id: "decorated-space",
      name: "Decorated",
      icon: "🚀",
      color: "#f43f5e",
      borderInset: 3,
      showFoldedCorner: true,
      workspace: { layout: {} },
    };
    const settings = {
      defaultIcon: "square",
      defaultShowFoldedCorner: false,
      popoutAccents: { enabled: true, splitter: true, activityBar: true },
      spaces: [space],
    } as any;
    const manager = new PopoutActivityBarManager({ app, settings } as any, engine);

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.createDiv = (opts?: any) => {
        const child = createMockEl("div");
        if (typeof opts === "string") child.className = opts;
        else if (opts?.cls) child.className = opts.cls;
        el.appendChild(child);
        return child;
      };
      el.createSpan = (opts?: any) => {
        const child = createMockEl("span");
        if (typeof opts === "string") child.className = opts;
        else if (opts?.cls) child.className = opts.cls;
        if (opts?.text) child.textContent = opts.text;
        el.appendChild(child);
        return child;
      };
      return el;
    };

    const testDoc = document.implementation.createHTMLDocument("Decorated Popout");
    const testWin = {
      closed: false,
      document: testDoc,
      _windowSpacesLayoutId: "decorated-space",
    } as unknown as Window;
    const leftBar = createMockEl();
    const dragEl = createMockEl();
    dragEl.className = "window-spaces-activity-drag";
    leftBar.appendChild(dragEl);
    const bars = {
      left: leftBar,
      right: createMockEl(),
      spaceIdentity: createMockEl(),
      viewButtons: new Map(),
      columnButtons: {
        left: document.createElement("button"),
        right: document.createElement("button"),
      },
    };
    (manager as any).barsByWindow.set(testWin, bars);
    vi.spyOn(manager as any, "renderBar").mockImplementation(() => {});
    vi.spyOn(manager, "updateActiveStates").mockImplementation(() => {});

    manager.refreshWindowActivityBars(testWin);

    expect(testDoc.body.style.getPropertyValue("--window-space-color")).toBe("#f43f5e");
    expect(testDoc.body.style.getPropertyValue("--window-space-border-inset")).toBe("3px");
    expect(testDoc.body.classList.contains("has-window-space-border")).toBe(true);
    expect(testDoc.body.classList.contains("has-window-space-folded-corner")).toBe(true);
    expect(bars.spaceIdentity.querySelector(".window-spaces-drag-emoji")?.textContent).toBe("🚀");
  });

  test("showVisibilityMenu renders full 4-item menu on space logo and 2-item menu on toggle button", async () => {
    initI18n({} as any);
    let saved = false;
    const spaceLayout: WindowLayout = {
      id: "menu-test-space",
      name: "Menu Space",
      timestamp: Date.now(),
      windowState: { size: { width: 800, height: 600 } },
      workspace: { layout: {}, leaves: [] },
      metadata: { fileCount: 1, tabCount: 1, splitCount: 0, createdAt: "2026-08-17", obsidianVersion: "1.13.7", pluginVersion: "1.0.7" },
      activityBars: {
        left: { show: true, items: [] },
        right: { show: false, items: [] },
      },
    };

    const settings: WindowSettings = {
      spaces: [spaceLayout],
      autoSave: false,
      showNotifications: false,
      version: "1.0.7",
      showLayoutStatusBar: false,
      showWindowLayoutsRibbonIcon: false,
      activityBars: { left: [], right: [] },
    };

    let columnHidden = { left: false, right: false };
    const mockEngine = {
      isColumnHidden: (_w: any, side: "left" | "right") => columnHidden[side],
      showColumn: (_w: any, side: "left" | "right") => { columnHidden[side] = false; },
      hideColumn: (_w: any, side: "left" | "right") => { columnHidden[side] = true; },
      getVisibleColumnCount: () => 3,
      getColumnElement: () => document.createElement("div"),
      getLeavesForWindow: () => [],
      getTopLevelColumnElements: () => [],
    } as unknown as PopoutLayoutEngine;

    const manager = new PopoutActivityBarManager(
      { app: {} as any, settings, saveSettings: async () => { saved = true; } },
      mockEngine
    );

    const testDoc = document.implementation.createHTMLDocument("Menu Test Popout");
    const testWin = {
      document: testDoc,
      _windowSpacesLayoutId: "menu-test-space",
    } as unknown as Window;

    // 1. 測試 Space Logo 右鍵選單：應包含 4 個項目
    const capturedItems: any[] = [];
    const mockMouseEvent = { clientX: 10, clientY: 10, preventDefault: () => {}, stopPropagation: () => {} } as unknown as MouseEvent;

    const originalAddItem = (manager as any).app;
    // We can spy on Menu.prototype.addItem
    const itemsCreated: { title: string; checked: boolean; disabled: boolean; onClick: () => void }[] = [];
    const origAddItem = Menu.prototype.addItem;
    Menu.prototype.addItem = function (cb: any) {
      const item = {
        title: "",
        checked: false,
        disabled: false,
        setTitle: (t: string) => { item.title = t; return item; },
        setIcon: () => item,
        setChecked: (c: boolean) => { item.checked = c; return item; },
        setDisabled: (d: boolean) => { item.disabled = d; return item; },
        onClick: (fn: any) => { item.onClickHandler = fn; return item; },
        onClickHandler: () => {},
      };
      cb(item);
      itemsCreated.push({
        title: item.title,
        checked: item.checked,
        disabled: item.disabled,
        onClick: item.onClickHandler,
      });
      return this;
    };

    try {
      manager.showVisibilityMenu(testWin, mockMouseEvent);
      expect(itemsCreated.length).toBe(4);
      expect(itemsCreated[0].title).toBe("Left activity bar");
      expect(itemsCreated[0].checked).toBe(true);
      expect(itemsCreated[1].title).toBe("Left sidebar");
      expect(itemsCreated[1].disabled).toBe(false);
      expect(itemsCreated[1].checked).toBe(true);

      // Right activity bar is false -> Right sidebar must be disabled & checked: true (一律顯示)
      expect(itemsCreated[2].title).toBe("Right activity bar");
      expect(itemsCreated[2].checked).toBe(false);
      expect(itemsCreated[3].title).toBe("Right sidebar");
      expect(itemsCreated[3].disabled).toBe(true);
      expect(itemsCreated[3].checked).toBe(true);

      // 2. 測試 Left toggle 按鈕右鍵選單：只包含 2 個項目
      itemsCreated.length = 0;
      manager.showVisibilityMenu(testWin, mockMouseEvent, "left");
      expect(itemsCreated.length).toBe(2);
      expect(itemsCreated[0].title).toBe("Left activity bar");
      expect(itemsCreated[1].title).toBe("Left sidebar");

      // 3. 測試 Right toggle 按鈕右鍵選單：只包含 2 個項目
      itemsCreated.length = 0;
      manager.showVisibilityMenu(testWin, mockMouseEvent, "right");
      expect(itemsCreated.length).toBe(2);
      expect(itemsCreated[0].title).toBe("Right activity bar");
      expect(itemsCreated[1].title).toBe("Right sidebar");

      // 4. 測試切換 Right activity bar 為 true
      saved = false;
      await manager.toggleSideActivityBar(testWin, "right");
      expect(spaceLayout.activityBars?.right?.show).toBe(true);
      expect(saved).toBe(true);

      // 5. 測試切換 Left sidebar 為 hidden
      saved = false;
      await manager.toggleSideSidebar(testWin, "left");
      expect(columnHidden.left).toBe(true);
      expect(spaceLayout.hidden?.leftSidebar).toBe(true);
      expect(saved).toBe(true);

      // 6. 測試當 Activity Bar 關閉時，若 sidebar 原本隱藏，強制解除隱藏
      await manager.toggleSideActivityBar(testWin, "left");
      expect(spaceLayout.activityBars?.left?.show).toBe(false);
      expect(columnHidden.left).toBe(false); // 強制解除隱藏
      expect(spaceLayout.hidden?.leftSidebar).toBe(false);
    } finally {
      Menu.prototype.addItem = origAddItem;
    }
  });

  test("updateLayoutLabelElement attaches right-click visibility context menu to edit-settings button", () => {
    initI18n({} as any);
    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => {
        el.innerHTML = "";
      };
      el.createDiv = (opts?: any) => {
        const child = createMockEl("div");
        if (typeof opts === "string") child.className = opts;
        else if (opts?.cls) child.className = opts.cls;
        el.appendChild(child);
        return child;
      };
      el.createSpan = (opts?: any) => {
        const child = createMockEl("span");
        if (typeof opts === "string") child.className = opts;
        else if (opts?.cls) child.className = opts.cls;
        if (opts?.text) child.textContent = opts.text;
        el.appendChild(child);
        return child;
      };
      el.createEl = (childTag: string, opts?: any) => {
        const child = createMockEl(childTag);
        if (typeof opts === "string") child.className = opts;
        else if (opts?.cls) child.className = opts.cls;
        if (opts?.attr) {
          for (const [k, v] of Object.entries(opts.attr)) child.setAttribute(k, v as string);
        }
        el.appendChild(child);
        return child;
      };
      return el;
    };

    const hostEl = createMockEl("div");
    let visibilityMenuCalled = false;
    let visibilityTargetWin: any = null;

    const mockPlugin = {
      app: {} as any,
      settings: {
        spaces: [],
        autoSave: false,
        showNotifications: false,
        version: "1.0.7",
      },
      activityBars: {
        showVisibilityMenu: (win: Window, _evt: MouseEvent) => {
          visibilityMenuCalled = true;
          visibilityTargetWin = win;
        },
      },
      saveSettings: async () => {},
    };

    const manager = new WindowLayoutManager(mockPlugin as any);
    const testDoc = document.implementation.createHTMLDocument("Edit Button Test");
    const testWin = {
      document: testDoc,
      _windowSpacesLayoutId: "test-space",
    } as unknown as Window;

    manager.updateLayoutLabelElement(hostEl, "My Space", testWin);

    const editBtn = hostEl.querySelector<HTMLButtonElement>(".window-spaces-layout-edit-settings");
    expect(editBtn).not.toBeNull();
    expect(typeof editBtn?.oncontextmenu).toBe("function");

    const mockEvt = {
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as MouseEvent;

    editBtn?.oncontextmenu?.(mockEvt);
    expect(visibilityMenuCalled).toBe(true);
    expect(visibilityTargetWin).toBe(testWin);
  });
});

