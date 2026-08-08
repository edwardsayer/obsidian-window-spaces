import { describe, expect, test, vi } from "vitest";
import {
  getDirectChildOf,
  getPaneContainerElement,
  isElementHidden,
  isPopoutWindow,
  PopoutLayoutEngine,
  setElementDisplay,
} from "../src/popout/popoutLayout";
import { WorkspaceInterceptor } from "../src/popout/workspaceInterceptor";
import { PopoutActivityBarManager } from "../src/popout/activityBar";
import {
  applyViewIcon,
  ensureViewIcon,
  enumerateAvailableViews,
  resolveViewIcon,
  resolveViewLabel,
} from "../src/popout/viewRegistry";

describe("popoutLayout helpers", () => {
  test("isPopoutWindow detects popout via body class", () => {
    const win = {
      document: { body: { classList: { contains: (cls: string) => cls === "is-popout-window" } } },
    } as unknown as Window;
    expect(isPopoutWindow(win)).toBe(true);
    expect(isPopoutWindow(window)).toBe(false);
    expect(isPopoutWindow(null)).toBe(false);
  });

  test("getColumnElement returns first/last top-level column (structural, no geometry)", () => {
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
    expect(engine.getColumnElement(window, "left")).toBe(leftTabsEl);
    expect(engine.getColumnElement(window, "right")).toBe(rightTabsEl);

    document.body.removeChild(rootEl);
  });

  test("getColumnElement treats nested-split column as a single sidebar column", () => {
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
});

describe("PopoutLayoutEngine hide/show + persistence", () => {
  function buildEngine() {
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

    engine.showColumn(win, "left");
    expect(engine.isColumnHidden(win, "left")).toBe(false);
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
    const leftLeafEl = document.createElement("div");
    leftTabsEl.appendChild(leftLeafEl);
    rootEl.appendChild(leftTabsEl);

    const rightColumnEl = document.createElement("div");
    rightColumnEl.classList.add("workspace-split", "mod-vertical");
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

  test("install without getLeftLeaf/getRightLeaf is safe", () => {
    const app = { workspace: {} } as any;
    const interceptor = new WorkspaceInterceptor(app);
    interceptor.install();
    interceptor.uninstall();
    expect(true).toBe(true);
  });

  test("getLeavesOfType strictly filters leaves to current active window", () => {
    const popoutWin = {
      document: { body: { classList: { contains: (cls: string) => cls === "is-popout-window" } } },
    } as unknown as Window;

    const otherWin = {
      document: { body: { classList: { contains: (cls: string) => cls === "is-popout-window" } } },
    } as unknown as Window;

    const leaf1InOtherWin = {
      containerEl: { ownerDocument: { defaultView: otherWin } },
    } as any;

    const leaf2InPopoutWin = {
      containerEl: { ownerDocument: { defaultView: popoutWin } },
    } as any;

    const originalGetLeavesOfType = vi.fn().mockReturnValue([leaf1InOtherWin, leaf2InPopoutWin]);

    const app = {
      workspace: {
        getLeavesOfType: originalGetLeavesOfType,
        getMostRecentLeaf: () => leaf2InPopoutWin,
      },
    } as any;

    const interceptor = new WorkspaceInterceptor(app);
    interceptor.isManagedWindow = () => true;
    interceptor.install();

    // Mock activeWindow global to simulate focus in popoutWin
    (globalThis as any).activeWindow = popoutWin;

    const leaves = app.workspace.getLeavesOfType("grid-view");
    expect(leaves.length).toBe(1);
    expect(leaves[0]).toBe(leaf2InPopoutWin);

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
});
