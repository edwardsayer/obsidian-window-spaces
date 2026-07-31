import { describe, expect, test, vi } from "vitest";
import { WindowLayoutsModal } from "../src/modals/restoreModal";
import { WindowLayout } from "../src/types";
import { initI18n } from "../src/i18n";

initI18n("en");

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
});
