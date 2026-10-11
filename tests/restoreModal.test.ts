import { beforeEach, describe, expect, test, vi } from "vitest";
import { Modal, Scope } from "obsidian";
import { WindowLayoutsModal } from "../src/modals/restoreModal";
import WindowSpacesPlugin from "../src/main";
import { WindowLayout } from "../src/types";
import { initI18n } from "../src/i18n";
import { collectPopoutColumns, PopoutLayoutEngine } from "../src/popout/popoutLayout";
import { WorkspaceInterceptor } from "../src/popout/workspaceInterceptor";

initI18n("en");

// jsdom always reports document.hasFocus() as false. The keydown guard
// requires the panel or popup's own window to hold focus, so default the
// mock to true and flip it in cross-window tests.
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
});

/**
 * 產生帶有 Obsidian Element helper 的真實 DOM 元素（沿用本檔既有的 mock 模式）。
 */
function createDomEl(tag = "div"): any {
  const el = document.createElement(tag) as any;
  el.empty = () => {
    el.innerHTML = "";
  };
  el.addClass = (c: any) => {
    if (typeof c !== "string") return;
    c.split(/\s+/)
      .filter(Boolean)
      .forEach((cls: string) => el.classList.add(cls));
  };
  el.createDiv = (cls?: string) => {
    const child = createDomEl("div");
    if (cls) child.addClass(cls);
    el.appendChild(child);
    return child;
  };
  el.createEl = (t: string, opts?: any) => {
    const child = createDomEl(t);
    if (typeof opts === "string") child.addClass(opts);
    else if (opts?.cls) child.addClass(opts.cls);
    if (opts?.text !== undefined) child.textContent = opts.text;
    el.appendChild(child);
    return child;
  };
  el.createSpan = (opts?: any) => el.createEl("span", opts);
  if (tag === "input") el.value = "";
  return el;
}

/**
 * 模擬 Obsidian keymap 對 scope 的派送：先派送真實 DOM 事件（讓 event.target 與
 * DOM 行為一致），再呼叫 Scope.handleKey；回傳 false 時 Obsidian 會 preventDefault。
 */
function pressKey(
  scope: Scope,
  key: string,
  target: EventTarget,
  init: KeyboardEventInit = {}
): { event: KeyboardEvent; consumed: boolean; result: unknown } {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  const result = scope.handleKey(event, { modifiers: "", key, vkey: key });
  const consumed = result === false;
  if (consumed) event.preventDefault();
  return { event, consumed, result };
}

describe("WindowLayoutsModal restore target", () => {
  test("keeps the source popout window when restoring in a new window", async () => {
    const sourceWindow = { document: {} } as Window;
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = { manager: { restoreLayout } };
    const modal = new WindowLayoutsModal({} as any, plugin, sourceWindow);
    const layout = { id: "layout-2", name: "Second layout" } as WindowLayout;

    await (modal as any).restoreLayout(layout, true);

    expect(restoreLayout).toHaveBeenCalledWith(layout, {
      targetWindow: sourceWindow,
      forceNewWindow: true,
      forceReload: false,
      focusExistingWindow: true,
    });
  });

  test("restores in the source popout window when forceNewWindow is false", async () => {
    const sourceWindow = { document: {} } as Window;
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = { manager: { restoreLayout } };
    const modal = new WindowLayoutsModal({} as any, plugin, sourceWindow);
    const layout = { id: "layout-1", name: "First layout" } as WindowLayout;

    await (modal as any).restoreLayout(layout, false);

    expect(restoreLayout).toHaveBeenCalledWith(layout, {
      targetWindow: sourceWindow,
      forceNewWindow: false,
      forceReload: true,
      focusExistingWindow: true,
    });
  });

  test("keeps a persistent panel open while restoring", async () => {
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = { manager: { restoreLayout } };
    const modal = new WindowLayoutsModal({} as any, plugin);
    const close = vi.spyOn(modal, "close");
    const layout = { id: "layout-panel", name: "Panel layout" } as WindowLayout;

    (modal as any).panelMode = true;
    await (modal as any).restoreLayout(layout, false);

    expect(close).not.toHaveBeenCalled();
    expect(restoreLayout).toHaveBeenCalledWith(layout, {
      targetWindow: undefined,
      forceNewWindow: false,
      forceReload: true,
      focusExistingWindow: true,
    });
  });

  test("uses the same native toolbar structure in tabs and sidebars", () => {
    const plugin = { manager: { getSavedLayouts: () => [] } };
    const modal = new WindowLayoutsModal({} as any, plugin);

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = (c: string) => {
        if (!c) return;
        c.split(/\s+/).filter(Boolean).forEach((cls) => el.classList.add(cls));
      };
      el.createDiv = (cls?: string) => {
        const child = createMockEl("div");
        if (cls) child.addClass(cls);
        el.appendChild(child);
        return child;
      };
      el.createEl = (t: string, opts?: any) => {
        const child = createMockEl(t);
        if (opts?.cls) child.addClass(opts.cls);
        el.appendChild(child);
        return child;
      };
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      el.style = {};
      return el;
    };

    const sidebarContainer = createMockEl();
    const tabContainer = createMockEl();
    modal.mountInContainer(sidebarContainer, true);
    const tabModal = new WindowLayoutsModal({} as any, plugin);
    tabModal.mountInContainer(tabContainer, false);

    const getToolbarSignature = (container: HTMLElement) => ({
      header: container.querySelector(".window-layouts-panel-header")?.className,
      actions: Array.from(container.querySelectorAll(".window-layouts-header-actions button"))
        .map((button) => button.className),
    });

    expect(getToolbarSignature(sidebarContainer)).toEqual(getToolbarSignature(tabContainer));
    expect(sidebarContainer.querySelector(".window-layouts-panel-header")?.classList.contains("nav-header")).toBe(true);

    modal.unmountFromContainer();
    tabModal.unmountFromContainer();
  });

  test("opens sort and panel menus via standard showAtMouseEvent", () => {
    const plugin = {
      settings: { sortBy: "updated-desc" },
      saveSettings: vi.fn(),
      openWindowLayoutsPanel: vi.fn(),
      openWindowLayoutsModal: vi.fn(),
    };
    const modal = new WindowLayoutsModal({} as any, plugin);
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as any;

    expect(() => (modal as any).showSortMenu(mockEvent)).not.toThrow();
    expect(() => (modal as any).showPanelMenu(mockEvent)).not.toThrow();
  });

  test("mounts the three header action buttons into a popup modal title bar", () => {
    const plugin = { manager: { getSavedLayouts: () => [] } };
    const modal = new WindowLayoutsModal({} as any, plugin);

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.createDiv = (cls?: string) => {
        const child = createMockEl("div");
        if (cls) child.className = cls;
        el.appendChild(child);
        return child;
      };
      el.createEl = (t: string, opts?: any) => {
        const child = createMockEl(t);
        if (opts?.cls) child.className = opts.cls;
        el.appendChild(child);
        return child;
      };
      return el;
    };

    const titleEl = createMockEl("div");
    modal.mountHeaderActions(titleEl);

    const buttons = Array.from(
      titleEl.querySelectorAll<HTMLElement>(".window-layouts-header-actions button")
    );
    expect(buttons).toHaveLength(3);
    expect(buttons[0].classList.contains("window-layouts-view-options-btn")).toBe(true);
    expect(buttons[1].classList.contains("window-layouts-sort-btn")).toBe(true);
    expect(buttons[2].classList.contains("window-layouts-panel-btn")).toBe(true);

    // Re-mounting must not duplicate the actions row.
    modal.mountHeaderActions(titleEl);
    expect(titleEl.querySelectorAll(".window-layouts-header-actions")).toHaveLength(1);
  });

  // ---------------------------------------------------------------------------
  // Scope 路線：Obsidian 以 activeLeaf（View scope）或 scope 堆疊（Modal scope）
  // 決定把按鍵交給誰。Window Spaces 只負責在 scope 被呼叫時處理，因此不再需要
  // activeElement / overlay / menu / hasFocus / active leaf 等啟發式條件。
  // ---------------------------------------------------------------------------

  test("mountInContainer 不註冊任何 window keydown listener", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = { manager: { getSavedLayouts: () => [], getSavedViewStates: () => [] } };
    const addListener = vi.spyOn(window, "addEventListener");
    const modal = new WindowLayoutsModal({} as any, plugin);

    modal.mountInContainer(createDomEl("div"));

    const keydownCalls = addListener.mock.calls.filter(([type]) => type === "keydown");
    expect(keydownCalls).toHaveLength(0);
    modal.unmountFromContainer();
    addListener.mockRestore();
  });

  test("綁定 Scope 後 ArrowUp / ArrowDown 會吃掉按鍵並移動選取", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };
    const modal = new WindowLayoutsModal({} as any, plugin);
    modal.mountInContainer(createDomEl("div"));
    const scope = new Scope();
    modal.bindScope(scope);

    expect(scope.registeredKeys().sort()).toEqual(["ArrowDown", "ArrowUp", "Enter", "Shift+Enter"]);

    const down = pressKey(scope, "ArrowDown", document.body);
    expect(down.consumed).toBe(true);
    expect((modal as any).selectedIndex).toBe(1);

    const up = pressKey(scope, "ArrowUp", document.body);
    expect(up.consumed).toBe(true);
    expect((modal as any).selectedIndex).toBe(0);

    modal.unbindScope();
    expect(scope.registeredKeys()).toHaveLength(0);
    modal.unmountFromContainer();
  });

  test("panel 取得 mouse focus（activeElement 在 panel 外）時方向鍵仍可操作", () => {
    // 實測情境（CDP）：點擊 panel 空白處後 document.activeElement 會變成 body，
    // 但 Obsidian 已把 panel 的 leaf 設為 activeLeaf → keymap 仍會查詢 view.scope。
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };
    const modal = new WindowLayoutsModal({} as any, plugin);
    modal.mountInContainer(createDomEl("div"));
    const scope = new Scope();
    modal.bindScope(scope);

    expect(document.activeElement).toBe(document.body);

    const down = pressKey(scope, "ArrowDown", document.body);
    expect(down.consumed).toBe(true);
    expect((modal as any).selectedIndex).toBe(1);

    modal.unmountFromContainer();
  });

  test("每個 instance 只在自己被呼叫的 scope 上反應（由 Obsidian 決定最上層）", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };
    const panel = new WindowLayoutsModal({} as any, plugin);
    panel.mountInContainer(createDomEl("div"));
    const popup = new WindowLayoutsModal({} as any, plugin);
    popup.mountInModalContainer(createDomEl("div"), () => {});

    const panelScope = new Scope();
    const popupScope = new Scope();
    panel.bindScope(panelScope);
    popup.bindScope(popupScope);

    // popup（Modal scope）在最上層時只由 popup 處理，背景 panel 不受影響。
    pressKey(popupScope, "ArrowDown", document.body);
    expect((popup as any).selectedIndex).toBe(1);
    expect((panel as any).selectedIndex).toBe(0);

    // popup 關閉後由 panel 接手（模擬 Obsidian popScope 後換 panel scope 被查詢）。
    pressKey(panelScope, "ArrowDown", document.body);
    expect((panel as any).selectedIndex).toBe(1);
    expect((popup as any).selectedIndex).toBe(1);

    panel.unmountFromContainer();
    popup.unmountFromContainer();
  });

  test("unmountFromContainer 會解除 scope 綁定（popup modal 關閉路徑）", () => {
    WindowLayoutsModal.activeInstances.clear();
    const popup = new WindowLayoutsModal({} as any, {
      manager: { getSavedLayouts: () => [], getSavedViewStates: () => [] },
    });
    popup.mountInModalContainer(createDomEl("div"), () => {});
    const scope = new Scope();
    popup.bindScope(scope);
    expect(scope.registeredKeys()).toHaveLength(4);

    popup.unmountFromContainer();

    expect(scope.registeredKeys()).toHaveLength(0);
  });

  test("bindScope 會取代先前的綁定（避免重複處理同一個鍵）", () => {
    WindowLayoutsModal.activeInstances.clear();
    const modal = new WindowLayoutsModal({} as any, {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    });
    modal.mountInContainer(createDomEl("div"));

    const first = new Scope();
    const second = new Scope();
    modal.bindScope(first);
    modal.bindScope(second);

    expect(first.registeredKeys()).toHaveLength(0);
    expect(second.registeredKeys()).toHaveLength(4);

    pressKey(second, "ArrowDown", document.body);
    expect((modal as any).selectedIndex).toBe(1);

    modal.unmountFromContainer();
  });

  test("openWindowLayoutsModal 把 popup picker 綁定到 host modal 的 scope", () => {
    WindowLayoutsModal.activeInstances.clear();
    const before = Modal.instances.length;
    const plugin = new WindowSpacesPlugin({} as any, {} as any);
    plugin.manager = {
      getActiveWindow: () => undefined,
      getSavedLayouts: () => [],
      getSavedViewStates: () => [],
    } as any;

    plugin.openWindowLayoutsModal();

    const hostModal = Modal.instances
      .slice(before)
      .find((instance) => typeof instance.onOpen === "function");
    expect(hostModal).toBeDefined();

    hostModal.onOpen?.();
    expect(hostModal.scope.registeredKeys().sort()).toEqual([
      "ArrowDown",
      "ArrowUp",
      "Enter",
      "Shift+Enter",
    ]);

    hostModal.onClose?.();
    expect(hostModal.scope.registeredKeys()).toHaveLength(0);
  });
  test("openWindowLayoutsPanel detects popout window and creates simulated left sidebar", async () => {
    const popoutWin = {
      document: {
        body: {
          classList: {
            contains: (cls: string) => cls === "is-popout-window" || cls === "mod-popout",
          },
        },
      },
    } as any;

    const mockLeaf = {
      setViewState: vi.fn().mockResolvedValue(undefined),
      getViewState: () => ({ type: "empty" }),
      view: { containerEl: { ownerDocument: { defaultView: popoutWin } } },
    } as any;

    const newPanelLeaf = {
      setViewState: vi.fn().mockResolvedValue(undefined),
      getViewState: () => ({ type: "window-spaces-layouts" }),
      view: { containerEl: { ownerDocument: { defaultView: popoutWin } } },
    } as any;

    const revealLeaf = vi.fn().mockResolvedValue(undefined);
    const setActiveLeaf = vi.fn();
    const createLeafBySplit = vi.fn().mockReturnValue(newPanelLeaf);

    const app = {
      workspace: {
        activeLeaf: mockLeaf,
        iterateAllLeaves: (cb: any) => cb(mockLeaf),
        revealLeaf,
        setActiveLeaf,
        createLeafBySplit,
      },
    } as any;

    const plugin = Object.assign(Object.create(WindowSpacesPlugin.prototype), {
      app,
      manager: { getActiveWindow: () => popoutWin },
      popoutLayout: new PopoutLayoutEngine(app as any),
    });

    const leaf = await plugin.openWindowLayoutsPanel("left", popoutWin);

    expect(createLeafBySplit).toHaveBeenCalledWith(mockLeaf, "vertical", true);
    expect(newPanelLeaf.setViewState).toHaveBeenCalledWith({
      type: "window-spaces-layouts",
      active: false,
      state: {},
    });
    expect(revealLeaf).toHaveBeenCalledWith(newPanelLeaf);
    expect(setActiveLeaf).toHaveBeenCalledWith(newPanelLeaf, { focus: true });
    expect(leaf).toBe(newPanelLeaf);
  });

  test("openWindowLayoutsPanel keeps a main-window panel in the main window while a popout is focused", async () => {
    // mainWindow must report "not focused" so the interceptor genuinely sees the
    // popout as the active window; otherwise the routing under test is inert.
    const mainWindow = {
      document: { body: { classList: { contains: () => false } }, hasFocus: () => false },
    } as any;
    const popoutWin = {
      document: {
        body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
        hasFocus: () => true,
      },
    } as any;

    const newPanelLeaf = {
      setViewState: vi.fn().mockResolvedValue(undefined),
      getViewState: () => ({ type: "window-spaces-layouts" }),
      view: { containerEl: { ownerDocument: { defaultView: mainWindow } } },
    } as any;

    const getLeftLeaf = vi.fn().mockReturnValue(newPanelLeaf);
    const revealLeaf = vi.fn().mockResolvedValue(undefined);
    const setActiveLeaf = vi.fn();
    const workspace = {
      leftSplit: { children: [] },
      rightSplit: { children: [] },
      iterateAllLeaves: () => {},
      revealLeaf,
      setActiveLeaf,
      getLeftLeaf,
      getRightLeaf: vi.fn().mockReturnValue(null),
    } as any;

    const app = { workspace } as any;
    const engine = new PopoutLayoutEngine(app);
    const openSideLeafSync = vi.spyOn(engine, "openSideLeafSync");
    const interceptor = new WorkspaceInterceptor(app, engine);
    interceptor.install();
    const globals = globalThis as unknown as { activeWindow?: Window };
    const previousActiveWindow = globals.activeWindow;
    globals.activeWindow = popoutWin;
    vi.mocked(document.hasFocus).mockReturnValue(false);

    try {
      const plugin = Object.assign(Object.create(WindowSpacesPlugin.prototype), {
        app,
        manager: { getActiveWindow: () => popoutWin },
        popoutLayout: engine,
      });

      const leaf = await plugin.openWindowLayoutsPanel("left", mainWindow);

      // A focused managed popout must not divert the main window's own panel:
      // the native main-sidebar getter runs and no popout side leaf is created.
      expect(getLeftLeaf).toHaveBeenCalledWith(false);
      expect(openSideLeafSync).not.toHaveBeenCalled();
      expect(newPanelLeaf.setViewState).toHaveBeenCalledWith({
        type: "window-spaces-layouts",
        state: {},
      });
      expect(revealLeaf).toHaveBeenCalledWith(newPanelLeaf);
      expect(setActiveLeaf).toHaveBeenCalledWith(newPanelLeaf, { focus: true });
      expect(leaf).toBe(newPanelLeaf);
    } finally {
      interceptor.uninstall();
      if (previousActiveWindow === undefined) delete globals.activeWindow;
      else globals.activeWindow = previousActiveWindow;
    }
  });

  test("openWindowLayoutsPanel reuses existing panel in target split and creates new tab if in different split", async () => {
    const popoutWin = {
      document: {
        body: {
          classList: {
            contains: (cls: string) => cls === "is-popout-window",
          },
        },
      },
    } as any;

    // 建立結構化 DOM：root split -> [leftTabs, rightTabs]，模擬第一/最後頂層欄位為側欄
    const rootEl = document.createElement("div");
    rootEl.classList.add("workspace-split", "mod-root");
    const leftTabsEl = document.createElement("div");
    leftTabsEl.classList.add("workspace-tabs");
    const leftContentEl = document.createElement("div");
    leftTabsEl.appendChild(leftContentEl);
    rootEl.appendChild(leftTabsEl);
    const rightTabsEl = document.createElement("div");
    rightTabsEl.classList.add("workspace-tabs");
    const rightContentEl = document.createElement("div");
    rightTabsEl.appendChild(rightContentEl);
    rootEl.appendChild(rightTabsEl);
    document.body.appendChild(rootEl);

    // 讓 DOM leaf 的 ownerDocument 指向 popoutWin（getWindowOfLeaf 依此判定視窗）
    const overrideOwner = (el: HTMLElement) =>
      Object.defineProperty(el, "ownerDocument", { value: { defaultView: popoutWin }, configurable: true });
    overrideOwner(leftContentEl);
    overrideOwner(rightContentEl);

    const leftTabs = { children: [] as any[] };
    const rightTabs = { children: [] as any[] };

    const leftPanelLeaf = {
      setViewState: vi.fn().mockResolvedValue(undefined),
      getViewState: () => ({ type: "window-spaces-layouts" }),
      parent: leftTabs,
      containerEl: leftContentEl,
      view: { containerEl: leftContentEl },
    };
    leftTabs.children.push(leftPanelLeaf);

    const rightLeaf = {
      setViewState: vi.fn().mockResolvedValue(undefined),
      getViewState: () => ({ type: "file-properties" }),
      parent: rightTabs,
      containerEl: rightContentEl,
      view: { containerEl: rightContentEl },
    };
    rightTabs.children.push(rightLeaf);

    const revealLeaf = vi.fn().mockResolvedValue(undefined);
    const setActiveLeaf = vi.fn();
    const createLeafInParent = vi.fn().mockImplementation((parent, idx) => {
      const created = {
        setViewState: vi.fn().mockResolvedValue(undefined),
        getViewState: () => ({ type: "window-spaces-layouts" }),
        parent,
        view: { containerEl: { ownerDocument: { defaultView: popoutWin } } },
      };
      parent.children.push(created);
      return created;
    });

    const app = {
      workspace: {
        activeLeaf: leftPanelLeaf,
        iterateAllLeaves: (cb: any) => {
          cb(leftPanelLeaf);
          cb(rightLeaf);
        },
        revealLeaf,
        setActiveLeaf,
        createLeafInParent,
      },
    } as any;

    const plugin = Object.assign(Object.create(WindowSpacesPlugin.prototype), {
      app,
      manager: { getActiveWindow: () => popoutWin },
      popoutLayout: (() => {
        const engine = new PopoutLayoutEngine(app as any);
        // 模擬 managed popout：兩側皆有側欄 hints（originalCount 2 = 欄位數）
        engine.setSidebarSides(popoutWin, {
          left: true,
          right: true,
          originalCount: 2,
          initialLeft: true,
          initialRight: true,
        });
        return engine;
      })(),
    });

    // 1. 開啟在 Left Sidebar -> 已有 leftPanelLeaf 在 leftTabs 中，重用該 panel
    const leafLeft = await plugin.openWindowLayoutsPanel("left", popoutWin);
    expect(leafLeft).toBe(leftPanelLeaf);
    expect(revealLeaf).toHaveBeenCalledWith(leftPanelLeaf);

    // 2. 開啟在 Right Sidebar -> rightTabs 中尚無 window-spaces panel，在 rightTabs 建立 panel
    const leafRight = await plugin.openWindowLayoutsPanel("right", popoutWin);
    expect(createLeafInParent).toHaveBeenCalledTimes(1);
    expect(createLeafInParent.mock.calls[0][0]).toBe(rightTabs);
    expect(leafRight).not.toBe(leftPanelLeaf);
    expect(revealLeaf).toHaveBeenCalledWith(leafRight);

    document.body.removeChild(rootEl);
  });

  test("collectPopoutColumns groups vertically stacked panes into a single column", () => {
    const topTabs = { children: [] };
    const bottomTabs = { children: [] };
    const rightTabs = { children: [] };

    const columns = collectPopoutColumns([
      { tabs: topTabs, left: 0, width: 400, center: 200 },
      { tabs: bottomTabs, left: 0, width: 400, center: 200 },
      { tabs: rightTabs, left: 400, width: 400, center: 600 },
    ]);
    expect(columns.length).toBe(2);
    expect(columns[0].panes.length).toBe(2); // topTabs & bottomTabs grouped in column 0
    expect(columns[1].panes.length).toBe(1); // rightTabs in column 1
  });

  test("panel 內的非搜尋框可編輯元素（inline section rename）不被攔截，Enter 交還 DOM", () => {
    // 這是原本 DOM listener 路線漏掉的案例（CDP 實測：Enter 會被拿去做 restoreLayout，
    // 導致 rename 無法 commit）。Scope 路線對 root 內「搜尋框以外」的可編輯元素一律放行。
    WindowLayoutsModal.activeInstances.clear();
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = {
      manager: { restoreLayout, getSavedLayouts: () => [{ id: "1", name: "A" }], getSavedViewStates: () => [] },
    };
    const modal = new WindowLayoutsModal({} as any, plugin);
    const root = createDomEl("div");
    document.body.appendChild(root);
    modal.mountInContainer(root);
    const scope = new Scope();
    modal.bindScope(scope);

    const renameInput = createDomEl("input");
    renameInput.className = "space-section-rename-input";
    root.appendChild(renameInput);
    renameInput.focus();

    const enter = pressKey(scope, "Enter", renameInput);

    expect(enter.consumed).toBe(false);
    expect(restoreLayout).not.toHaveBeenCalled();

    modal.unmountFromContainer();
    document.body.removeChild(root);
  });

  test("IME 組字中的 Enter 放行（不攔截候選字確認）", () => {
    WindowLayoutsModal.activeInstances.clear();
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const modal = new WindowLayoutsModal({} as any, {
      manager: { restoreLayout, getSavedLayouts: () => [{ id: "1", name: "A" }], getSavedViewStates: () => [] },
    });
    modal.mountInContainer(createDomEl("div"));
    const scope = new Scope();
    modal.bindScope(scope);

    const composing = pressKey(scope, "Enter", document.body, { isComposing: true });

    expect(composing.consumed).toBe(false);
    expect(restoreLayout).not.toHaveBeenCalled();

    modal.unmountFromContainer();
  });

  test("焦點在按鈕上時 Enter 放行（保留原生按鈕行為）", () => {
    WindowLayoutsModal.activeInstances.clear();
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const modal = new WindowLayoutsModal({} as any, {
      manager: { restoreLayout, getSavedLayouts: () => [{ id: "1", name: "A" }], getSavedViewStates: () => [] },
    });
    const root = createDomEl("div");
    document.body.appendChild(root);
    modal.mountInContainer(root);
    const scope = new Scope();
    modal.bindScope(scope);

    const button = createDomEl("button");
    root.appendChild(button);
    button.focus();

    const enter = pressKey(scope, "Enter", button);

    expect(enter.consumed).toBe(false);
    expect(restoreLayout).not.toHaveBeenCalled();

    modal.unmountFromContainer();
    document.body.removeChild(root);
  });

  test("分組檢視下 Enter 開啟高亮項（renderedLayoutEntries 渲染順序）而非 filteredLayouts 排序順序", () => {
    WindowLayoutsModal.activeInstances.clear();
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = {
      manager: { restoreLayout, getSavedLayouts: () => [], getSavedViewStates: () => [] },
    };

    const modal = new WindowLayoutsModal({} as any, plugin);
    modal.mountInContainer(createDomEl("div"));
    const scope = new Scope();
    modal.bindScope(scope);

    // 模擬分組檢視渲染後的狀態：renderedLayoutEntries（分組渲染順序）
    // 與 filteredLayouts（排序順序）不同。
    const layoutA = { id: "a", name: "A" };
    const layoutB = { id: "b", name: "B" };
    const layoutC = { id: "c", name: "C" };
    (modal as any).filteredLayouts = [layoutA, layoutB, layoutC];
    (modal as any).renderedLayoutEntries = [
      { layout: layoutB, element: createDomEl("div") },
      { layout: layoutC, element: createDomEl("div") },
      { layout: layoutA, element: createDomEl("div") },
    ];
    // 方向鍵把高亮移到 renderedLayoutEntries[1] = layoutC
    (modal as any).selectedIndex = 1;

    const enter = pressKey(scope, "Enter", document.body);

    expect(enter.consumed).toBe(true);
    // 必須開啟高亮項 C，而非 filteredLayouts[1]（B）
    expect(restoreLayout).toHaveBeenCalledTimes(1);
    expect(restoreLayout).toHaveBeenCalledWith(layoutC, expect.anything());

    modal.unmountFromContainer();
  });
});
