import { describe, expect, test, vi } from "vitest";
import { App, WorkspaceLeaf } from "obsidian";
import { isHttpOrHttpsUrl, isUrlLeaf, isUrlPopoutWindow } from "../src/popout/urlPopout";
import WindowSpacesPlugin from "../src/main";
import { PopoutLayoutEngine } from "../src/shared/popoutLayout";
import { PopoutActivityBarManager } from "../src/popout/activityBar";
import { WindowLayoutManager } from "../src/manager";
import { WorkspaceInterceptor } from "../src/popout/workspaceInterceptor";

describe("URL popout detection", () => {
  describe("isHttpOrHttpsUrl", () => {
    test("accepts valid http and https URLs", () => {
      expect(isHttpOrHttpsUrl("http://example.com")).toBe(true);
      expect(isHttpOrHttpsUrl("https://example.com/oauth/authorize?client_id=123")).toBe(true);
      expect(isHttpOrHttpsUrl("  https://auth.openid.net/login  ")).toBe(true);
      expect(isHttpOrHttpsUrl("HTTP://UPPERCASE.COM")).toBe(true);
    });

    test("rejects invalid or non-http URLs", () => {
      expect(isHttpOrHttpsUrl("")).toBe(false);
      expect(isHttpOrHttpsUrl(null)).toBe(false);
      expect(isHttpOrHttpsUrl(undefined)).toBe(false);
      expect(isHttpOrHttpsUrl(123)).toBe(false);
      expect(isHttpOrHttpsUrl("app://obsidian.md/index.html")).toBe(false);
      expect(isHttpOrHttpsUrl("file:///C:/test.md")).toBe(false);
      expect(isHttpOrHttpsUrl("about:blank")).toBe(false);
    });
  });

  describe("isUrlLeaf", () => {
    test("recognizes native webviewer leaf", () => {
      const leaf = {
        getViewState: () => ({ type: "webviewer", state: {} }),
        containerEl: document.createElement("div"),
      } as unknown as WorkspaceLeaf;
      expect(isUrlLeaf(leaf)).toBe(true);
    });

    test("recognizes third-party browser view types", () => {
      const leafSurfing = {
        getViewState: () => ({ type: "surfing-view", state: {} }),
        containerEl: document.createElement("div"),
      } as unknown as WorkspaceLeaf;
      expect(isUrlLeaf(leafSurfing)).toBe(true);

      const leafCustomFrames = {
        getViewState: () => ({ type: "custom-frames-view", state: {} }),
        containerEl: document.createElement("div"),
      } as unknown as WorkspaceLeaf;
      expect(isUrlLeaf(leafCustomFrames)).toBe(true);
    });

    test("recognizes leaf with url in viewState.state", () => {
      const leaf = {
        getViewState: () => ({ type: "custom-view", state: { url: "https://accounts.google.com/login" } }),
        containerEl: document.createElement("div"),
      } as unknown as WorkspaceLeaf;
      expect(isUrlLeaf(leaf)).toBe(true);
    });

    test("recognizes leaf with webview in containerEl", () => {
      const container = document.createElement("div");
      const webview = document.createElement("webview");
      container.appendChild(webview);
      const leaf = {
        getViewState: () => ({ type: "custom-auth", state: {} }),
        containerEl: container,
      } as unknown as WorkspaceLeaf;
      expect(isUrlLeaf(leaf)).toBe(true);
    });

    test("rejects standard markdown leaf", () => {
      const leaf = {
        getViewState: () => ({ type: "markdown", state: { file: "note.md" } }),
        containerEl: document.createElement("div"),
      } as unknown as WorkspaceLeaf;
      expect(isUrlLeaf(leaf)).toBe(false);
    });
  });

  describe("isUrlPopoutWindow", () => {
    test("detects cross-origin popout window (SecurityError on location access)", () => {
      const crossOriginWin = {} as Window;
      Object.defineProperty(crossOriginWin, "location", {
        get() {
          throw new Error("SecurityError: Blocked a frame with origin from accessing a cross-origin frame.");
        },
      });
      expect(isUrlPopoutWindow(crossOriginWin)).toBe(true);
    });

    test("detects window with http/https location", () => {
      const httpWin = {
        location: {
          protocol: "https:",
          href: "https://auth0.com/login",
        },
      } as unknown as Window;
      expect(isUrlPopoutWindow(httpWin)).toBe(true);
    });

    test("detects window containing a webview DOM element", () => {
      const doc = document.implementation.createHTMLDocument();
      const wv = doc.createElement("webview");
      doc.body.appendChild(wv);
      const win = {
        location: { protocol: "app:", href: "app://obsidian.md/index.html" },
        document: doc,
      } as unknown as Window;
      expect(isUrlPopoutWindow(win)).toBe(true);
    });

    test("detects window containing a webviewer WorkspaceLeaf", () => {
      const doc = document.implementation.createHTMLDocument();
      const win = {
        location: { protocol: "app:", href: "app://obsidian.md/index.html" },
        document: doc,
      } as unknown as Window;

      const containerEl = doc.createElement("div");
      doc.body.appendChild(containerEl);

      const leaf = {
        containerEl,
        getViewState: () => ({ type: "webviewer", state: { url: "https://login.live.com" } }),
      } as unknown as WorkspaceLeaf;

      const app = {
        workspace: {
          iterateAllLeaves: (cb: (l: WorkspaceLeaf) => void) => cb(leaf),
        },
      } as unknown as App;

      expect(isUrlPopoutWindow(win, app)).toBe(true);
    });

    test("does not flag regular markdown popout window", () => {
      const doc = document.implementation.createHTMLDocument();
      const win = {
        location: { protocol: "app:", href: "app://obsidian.md/index.html" },
        document: doc,
      } as unknown as Window;

      const containerEl = doc.createElement("div");
      doc.body.appendChild(containerEl);

      const leaf = {
        containerEl,
        getViewState: () => ({ type: "markdown", state: { file: "test.md" } }),
      } as unknown as WorkspaceLeaf;

      const app = {
        workspace: {
          iterateAllLeaves: (cb: (l: WorkspaceLeaf) => void) => cb(leaf),
        },
      } as unknown as App;

      expect(isUrlPopoutWindow(win, app)).toBe(false);
    });
  });
});

describe("WindowSpaces URL popout integration", () => {
  function createMockPlugin(disableOnUrlPopouts?: boolean) {
    const doc = document.implementation.createHTMLDocument();
    doc.body.classList.add("is-popout-window");
    const mockWin = {
      location: { protocol: "https:", href: "https://openid.provider.com/auth" },
      document: doc,
      closed: false,
      setTimeout: vi.fn((fn) => setTimeout(fn, 0)),
      clearTimeout: vi.fn(),
    } as unknown as Window;

    const leaves: WorkspaceLeaf[] = [];
    const app = {
      workspace: {
        iterateAllLeaves: (cb: (l: WorkspaceLeaf) => void) => leaves.forEach(cb),
        on: vi.fn(() => ({})),
      },
    } as unknown as App;

    const plugin = Object.assign(Object.create(WindowSpacesPlugin.prototype), {
      app,
      settings: {
        disableOnUrlPopouts,
        spaces: [],
        activityBars: { left: [], right: [] },
        activityBarDefaults: { left: true, right: true },
      },
      saveSettings: vi.fn().mockResolvedValue(undefined),
    }) as WindowSpacesPlugin;

    const engine = new PopoutLayoutEngine(app);
    plugin.popoutLayout = engine as any;
    plugin.activityBars = new PopoutActivityBarManager(plugin, engine);
    plugin.manager = new WindowLayoutManager(plugin);
    plugin.workspaceInterceptor = new WorkspaceInterceptor(app, engine);

    return { plugin, mockWin, leaves };
  }

  test("isWindowDisabled returns true for URL popouts by default", () => {
    const { plugin, mockWin } = createMockPlugin(undefined); // legacy undefined
    expect(plugin.isWindowDisabled(mockWin)).toBe(true);
  });

  test("isWindowDisabled returns true when explicitly enabled", () => {
    const { plugin, mockWin } = createMockPlugin(true);
    expect(plugin.isWindowDisabled(mockWin)).toBe(true);
  });

  test("isWindowDisabled returns false when user disables the setting", () => {
    const { plugin, mockWin } = createMockPlugin(false);
    expect(plugin.isWindowDisabled(mockWin)).toBe(false);
  });

  test("activityBars.injectForWindow does not inject into URL popout when disabled", () => {
    const { plugin, mockWin } = createMockPlugin(true);
    plugin.activityBars.injectForWindow(mockWin);

    expect(plugin.activityBars.isInjected(mockWin)).toBe(false);
    expect(mockWin.document.body.querySelector(".window-spaces-activity-bar")).toBeNull();
  });

  test("manager.registerPopoutWindow does not register URL popout when disabled", () => {
    const { plugin, mockWin } = createMockPlugin(true);
    plugin.manager.registerPopoutWindow(mockWin);

    expect(plugin.manager.getLivePopoutWindows()).not.toContain(mockWin);
    expect(mockWin.document.body.querySelector(".window-spaces-layout-status")).toBeNull();
  });

  test("workspaceInterceptor does not manage URL popout window", () => {
    const { plugin, mockWin } = createMockPlugin(true);
    plugin.workspaceInterceptor.isManagedWindow = (win) => {
      if (plugin.isWindowDisabled(win)) return false;
      return true;
    };
    expect(plugin.workspaceInterceptor.isManagedWindow(mockWin)).toBe(false);
  });

  test("checkAndHandleUrlPopout cleans up window if it transitions to URL popout", () => {
    const { plugin, mockWin } = createMockPlugin(true);

    // Force an injection first as if it opened blank
    plugin.activityBars.injectForWindow = vi.fn();
    (plugin.activityBars as any).barsByWindow.set(mockWin, {
      left: mockWin.document.createElement("div"),
      right: mockWin.document.createElement("div"),
      spaceIdentity: mockWin.document.createElement("div"),
      viewButtons: new Map(),
      columnButtons: { left: null, right: null },
    });
    (plugin.activityBars as any).injectedWindows.add(mockWin);
    expect(plugin.activityBars.isInjected(mockWin)).toBe(true);

    // Calling checkAndHandleUrlPopout cleans it up
    const handled = plugin.checkAndHandleUrlPopout(mockWin);
    expect(handled).toBe(true);
    expect(plugin.activityBars.isInjected(mockWin)).toBe(false);
  });
});
