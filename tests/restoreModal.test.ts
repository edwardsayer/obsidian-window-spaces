import { beforeEach, describe, expect, test, vi } from "vitest";
import { WindowLayoutsModal } from "../src/modals/restoreModal";
import WindowSpacesPlugin from "../src/main";
import { WindowLayout } from "../src/types";
import { initI18n } from "../src/i18n";
import { collectPopoutColumns, PopoutLayoutEngine } from "../src/popout/popoutLayout";

initI18n("en");

// jsdom always reports document.hasFocus() as false. The keydown guard
// requires the panel or popup's own window to hold focus, so default the
// mock to true and flip it in cross-window tests.
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
});

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

  test("an open popup modal owns arrow navigation while background panels yield", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = () => {};
      el.createDiv = () => createMockEl("div");
      el.createEl = (t: string) => createMockEl(t);
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      return el;
    };

    // Background panel whose leaf reports active while the popup overlays it.
    const panel = new WindowLayoutsModal({} as any, plugin);
    const panelRoot = createMockEl();
    panel.mountInContainer(panelRoot);
    (panel as any).isPanelActive = () => true;
    (panel as any).handleArrowKey(1);

    // Popup modal host, mounted before the panel in registration order would
    // have made the panel swallow the keys (capture phase).
    const popup = new WindowLayoutsModal({} as any, plugin);
    const popupRoot = createMockEl();
    popup.mountInModalContainer(popupRoot, () => {});
    document.body.appendChild(popupRoot);
    const input = document.createElement("input");
    popupRoot.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    // Focus inside the popup: only the popup may handle the arrow.
    const focusedArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(focusedArrow);

    expect((popup as any).selectedIndex).toBe(1);
    expect((panel as any).selectedIndex).toBe(1);
    expect(focusedArrow.defaultPrevented).toBe(true);

    // Focus outside every instance: the open popup still owns the arrow.
    input.blur();
    const blurredArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(blurredArrow);

    expect((popup as any).selectedIndex).toBe(0);
    expect((panel as any).selectedIndex).toBe(1);
    expect(blurredArrow.defaultPrevented).toBe(true);

    panel.unmountFromContainer();
    popup.unmountFromContainer();
    document.body.removeChild(popupRoot);
  });

  test("maintains independent selected index and focus navigation across active panel instances", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };
    const modal1 = new WindowLayoutsModal({} as any, plugin);
    const modal2 = new WindowLayoutsModal({} as any, plugin);

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = () => {};
      el.createDiv = () => createMockEl("div");
      el.createEl = (t: string) => createMockEl(t);
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      if (tag === "input") el.value = "";
      return el;
    };
    const div1 = createMockEl();
    const div2 = createMockEl();

    modal1.mountInContainer(div1);
    modal2.mountInContainer(div2);

    (modal1 as any).handleArrowKey(1);

    expect((modal1 as any).selectedIndex).toBe(1);
    expect((modal2 as any).selectedIndex).toBe(0);

    // Hovering without clicking must NOT steal arrow keys: a panel only owns
    // navigation when it is the active leaf or contains the focus.
    div1.dispatchEvent(new Event("pointerenter"));
    const hoverArrowEvent = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(hoverArrowEvent);

    expect((modal1 as any).selectedIndex).toBe(1);
    expect((modal2 as any).selectedIndex).toBe(0);
    expect(hoverArrowEvent.defaultPrevented).toBe(false);

    // When the panel is the active leaf, Window capture delivers navigation.
    (modal1 as any).isPanelActive = () => true;
    const activeArrowEvent = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(activeArrowEvent);

    expect((modal1 as any).selectedIndex).toBe(0);
    expect((modal2 as any).selectedIndex).toBe(0);
    expect(activeArrowEvent.defaultPrevented).toBe(true);

    // Test new panel initial independence
    const div3 = createMockEl();
    const modal3 = new WindowLayoutsModal({} as any, plugin);
    modal3.mountInContainer(div3);

    expect((modal3 as any).selectedIndex).toBe(0);

    modal1.unmountFromContainer();
    modal2.unmountFromContainer();
    modal3.unmountFromContainer();
  });

  test("triggers createAndSaveLayout when Enter is pressed and no layout matches query", async () => {
    const saveLayout = vi.fn().mockResolvedValue(undefined);
    const captureCurrentLayout = vi.fn().mockResolvedValue({ id: "new-id", name: "" });
    const fakeWin = { document: { body: { classList: { contains: () => true } } } } as any;
    const plugin = {
      manager: {
        getSavedLayouts: () => [],
        saveLayout,
        captureCurrentLayout,
      },
    };
    const modal = new WindowLayoutsModal({ workspace: { iterateAllLeaves: vi.fn() } } as any, plugin, fakeWin);
    (modal as any).searchInput = { value: "New Workspace" };

    await (modal as any).createAndSaveLayout("New Workspace");

    expect(captureCurrentLayout).toHaveBeenCalled();
    expect(saveLayout).toHaveBeenCalledWith(expect.objectContaining({ name: "New Workspace" }));
  });
  test("panel yields arrow navigation while a native modal (Quick Switcher / Command Palette) is open", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = () => {};
      el.createDiv = () => createMockEl("div");
      el.createEl = (t: string) => createMockEl(t);
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      return el;
    };

    const panel = new WindowLayoutsModal({} as any, plugin);
    const panelRoot = createMockEl();
    panel.mountInContainer(panelRoot);
    (panel as any).isPanelActive = () => true;
    expect((panel as any).selectedIndex).toBe(0);

    // Simulate Quick Switcher / Command Palette: a native .modal-container
    // overlay is present in the same window.
    const modalContainer = document.createElement("div");
    modalContainer.className = "modal-container";
    document.body.appendChild(modalContainer);
    const modalInput = document.createElement("input");
    modalContainer.appendChild(modalInput);
    modalInput.focus();

    const arrowWhileModal = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(arrowWhileModal);

    // The panel must NOT consume the arrow while the modal is open.
    expect(arrowWhileModal.defaultPrevented).toBe(false);
    expect((panel as any).selectedIndex).toBe(0);

    // Enter while the modal is open must also pass through untouched.
    const enterWhileModal = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(enterWhileModal);
    expect(enterWhileModal.defaultPrevented).toBe(false);

    // Closing the modal restores the panel's ownership of arrow keys.
    document.body.removeChild(modalContainer);
    const arrowAfterModal = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(arrowAfterModal);
    expect(arrowAfterModal.defaultPrevented).toBe(true);
    expect((panel as any).selectedIndex).toBe(1);

    panel.unmountFromContainer();
  });

  test("panel yields arrow navigation while a dropdown menu is open", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = () => {};
      el.createDiv = () => createMockEl("div");
      el.createEl = (t: string) => createMockEl(t);
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      return el;
    };

    const panel = new WindowLayoutsModal({} as any, plugin);
    const panelRoot = createMockEl();
    panel.mountInContainer(panelRoot);
    (panel as any).isPanelActive = () => true;
    expect((panel as any).selectedIndex).toBe(0);

    const menu = document.createElement("div");
    menu.className = "menu";
    document.body.appendChild(menu);

    const arrowWhileMenu = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(arrowWhileMenu);
    expect(arrowWhileMenu.defaultPrevented).toBe(false);
    expect((panel as any).selectedIndex).toBe(0);

    // A hidden menu (closing animation) must not keep the panel disabled.
    menu.classList.add("is-hidden");
    const arrowAfterMenuHidden = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(arrowAfterMenuHidden);
    expect(arrowAfterMenuHidden.defaultPrevented).toBe(true);
    expect((panel as any).selectedIndex).toBe(1);

    document.body.removeChild(menu);
    panel.unmountFromContainer();
  });

  test("popup picker yields when a different native modal is stacked above it", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = () => {};
      el.createDiv = () => createMockEl("div");
      el.createEl = (t: string) => createMockEl(t);
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      return el;
    };

    // Host modal container that Obsidian's native Modal creates.
    const hostContainer = document.createElement("div");
    hostContainer.className = "modal-container";
    document.body.appendChild(hostContainer);
    const hostContent = createMockEl();
    hostContainer.appendChild(hostContent);

    const popup = new WindowLayoutsModal({} as any, plugin);
    popup.mountInModalContainer(hostContent, () => {});
    const popupInput = document.createElement("input");
    hostContent.appendChild(popupInput);
    popupInput.focus();

    // Only the picker's own modal is open: it owns the arrow keys.
    const ownArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(ownArrow);
    expect(ownArrow.defaultPrevented).toBe(true);
    expect((popup as any).selectedIndex).toBe(1);

    // Another modal (rename dialog, Command Palette, ...) is stacked above
    // the picker: the picker must yield.
    const otherContainer = document.createElement("div");
    otherContainer.className = "modal-container";
    document.body.appendChild(otherContainer);
    const otherInput = document.createElement("input");
    otherContainer.appendChild(otherInput);
    otherInput.focus();

    const stackedArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(stackedArrow);
    expect(stackedArrow.defaultPrevented).toBe(false);
    expect((popup as any).selectedIndex).toBe(1);

    document.body.removeChild(otherContainer);
    document.body.removeChild(hostContainer);
    popup.unmountFromContainer();
  });
  test("panel yields to key events forwarded from another window (popout)", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = () => {};
      el.createDiv = () => createMockEl("div");
      el.createEl = (t: string) => createMockEl(t);
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      return el;
    };

    const panel = new WindowLayoutsModal({} as any, plugin);
    const panelRoot = createMockEl();
    panel.mountInContainer(panelRoot);
    (panel as any).isPanelActive = () => true;
    expect((panel as any).selectedIndex).toBe(0);

    // A real key in THIS window: the panel owns navigation.
    const normalArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(normalArrow);
    expect(normalArrow.defaultPrevented).toBe(true);
    expect((panel as any).selectedIndex).toBe(1);

    // Obsidian forwards the ORIGINAL event object from the popout window:
    // event.view is the popout window and event.target lives in the popout
    // document. The main-window panel must yield.
    const otherDoc = { nodeType: 9 } as any;
    const otherTarget = { ownerDocument: otherDoc } as any;
    const forwardedArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(forwardedArrow, "view", { value: { isPopout: true } });
    Object.defineProperty(forwardedArrow, "target", { value: otherTarget });
    window.dispatchEvent(forwardedArrow);
    expect(forwardedArrow.defaultPrevented).toBe(false);
    expect((panel as any).selectedIndex).toBe(1);

    // Obsidian rebuilt the event in this window (view/target look local) but
    // the popout still holds OS focus: document.hasFocus() is false.
    vi.mocked(document.hasFocus).mockReturnValue(false);
    const blurredArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(blurredArrow);
    expect(blurredArrow.defaultPrevented).toBe(false);
    expect((panel as any).selectedIndex).toBe(1);

    // Focus returns to this window: navigation resumes.
    vi.mocked(document.hasFocus).mockReturnValue(true);
    const refocusedArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(refocusedArrow);
    expect(refocusedArrow.defaultPrevented).toBe(true);
    expect((panel as any).selectedIndex).toBe(0);

    panel.unmountFromContainer();
  });

  test("popup picker yields when a different window holds the keyboard focus", () => {
    WindowLayoutsModal.activeInstances.clear();
    const plugin = {
      manager: {
        getSavedLayouts: () => [{ id: "1", name: "A" }, { id: "2", name: "B" }],
        getSavedViewStates: () => [],
      },
    };

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = () => {};
      el.createDiv = () => createMockEl("div");
      el.createEl = (t: string) => createMockEl(t);
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      return el;
    };

    const hostContainer = document.createElement("div");
    hostContainer.className = "modal-container";
    document.body.appendChild(hostContainer);
    const hostContent = createMockEl();
    hostContainer.appendChild(hostContent);

    const popup = new WindowLayoutsModal({} as any, plugin);
    popup.mountInModalContainer(hostContent, () => {});
    const input = document.createElement("input");
    hostContent.appendChild(input);
    input.focus();

    // The popup's own window is focused: it owns the arrow keys.
    const ownArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(ownArrow);
    expect(ownArrow.defaultPrevented).toBe(true);
    expect((popup as any).selectedIndex).toBe(1);

    // The user switches to a popout window: this document loses OS focus and
    // the popup must not steal keys that belong to the popout.
    vi.mocked(document.hasFocus).mockReturnValue(false);
    const popoutArrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(popoutArrow);
    expect(popoutArrow.defaultPrevented).toBe(false);
    expect((popup as any).selectedIndex).toBe(1);

    vi.mocked(document.hasFocus).mockReturnValue(true);
    document.body.removeChild(hostContainer);
    popup.unmountFromContainer();
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
      getViewState: () => ({ type: "markdown" }),
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

  test("panel ignores Enter keydown when Command Palette / prompt input outside panel is focused", () => {
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = {
      manager: { getSavedLayouts: () => [{ id: "l1", name: "L1" }], getSavedViewStates: () => [], restoreLayout },
    };
    const modal = new WindowLayoutsModal({} as any, plugin);

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = (c: any) => {
        if (!c || typeof c !== "string") return;
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

    const panelContainer = createMockEl();
    document.body.appendChild(panelContainer);
    modal.mountInContainer(panelContainer, false, () => true);

    const promptContainer = document.createElement("div");
    promptContainer.className = "prompt";
    const promptInput = document.createElement("input");
    promptInput.className = "prompt-input";
    promptContainer.appendChild(promptInput);
    document.body.appendChild(promptContainer);
    promptInput.focus();

    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(enterEvent);

    expect(enterEvent.defaultPrevented).toBe(false);
    expect(restoreLayout).not.toHaveBeenCalled();

    modal.unmountFromContainer();
    document.body.removeChild(panelContainer);
    document.body.removeChild(promptContainer);
  });
});  test("分組檢視下 Enter 開啟高亮項（renderedLayoutEntries 渲染順序）而非 filteredLayouts 排序順序", () => {
    WindowLayoutsModal.activeInstances.clear();
    const restoreLayout = vi.fn().mockResolvedValue(undefined);
    const plugin = {
      manager: { restoreLayout, getSavedLayouts: () => [], getSavedViewStates: () => [] },
    };

    const createMockEl = (tag = "div") => {
      const el = document.createElement(tag) as any;
      el.empty = () => { el.innerHTML = ""; };
      el.addClass = () => {};
      el.createDiv = () => createMockEl("div");
      el.createEl = (t: string) => createMockEl(t);
      el.createSpan = () => createMockEl("span");
      el.setAttribute = () => {};
      if (tag === "input") el.value = "";
      return el;
    };

    const modal = new WindowLayoutsModal({} as any, plugin);
    const root = createMockEl();
    modal.mountInContainer(root);
    (modal as any).panelMode = true;
    (modal as any).isPanelActive = () => true;

    // 模擬分組檢視渲染後的狀態：renderedLayoutEntries（分組渲染順序）
    // 與 filteredLayouts（排序順序）不同。
    const layoutA = { id: "a", name: "A" };
    const layoutB = { id: "b", name: "B" };
    const layoutC = { id: "c", name: "C" };
    (modal as any).filteredLayouts = [layoutA, layoutB, layoutC];
    (modal as any).renderedLayoutEntries = [
      { layout: layoutB, element: createMockEl() },
      { layout: layoutC, element: createMockEl() },
      { layout: layoutA, element: createMockEl() },
    ];
    // 方向鍵把高亮移到 renderedLayoutEntries[1] = layoutC
    (modal as any).selectedIndex = 1;

    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(enterEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
    // 必須開啟高亮項 C，而非 filteredLayouts[1]（B）
    expect(restoreLayout).toHaveBeenCalledTimes(1);
    expect(restoreLayout).toHaveBeenCalledWith(layoutC, expect.anything());

    modal.unmountFromContainer();
  });
