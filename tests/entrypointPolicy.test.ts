import { describe, expect, test, vi } from "vitest";
import { App } from "obsidian";
import { canInjectSidebars, canInjectStatusBar, getWindowPopoutPolicy } from "../src/popout/entrypointPolicy";
import { WindowSettings } from "../src/types";
import WindowSpacesPlugin from "../src/main";
import { PopoutActivityBarManager } from "../src/popout/activityBar";
import { WindowLayoutManager } from "../src/manager";
import { PopoutLayoutEngine } from "../src/shared/popoutLayout";
import { WorkspaceInterceptor } from "../src/popout/workspaceInterceptor";
import { initI18n } from "../src/i18n";

initI18n("en");

function createWindow(protocol = "app:"): Window {
  const doc = document.implementation.createHTMLDocument();
  doc.body.classList.add("is-popout-window");
  return {
    location: { protocol, href: protocol === "https:" ? "https://login.example.com/auth" : "app://obsidian.md/index.html" },
    document: doc,
    closed: false,
    setTimeout: vi.fn((fn) => setTimeout(fn, 0)),
    clearTimeout: vi.fn(),
  } as unknown as Window;
}

function createSettings(overrides: Partial<WindowSettings> = {}): WindowSettings {
  return {
    spaces: [],
    autoSave: false,
    showNotifications: false,
    version: "1.0.0",
    showLayoutStatusBar: true,
    showWindowLayoutsRibbonIcon: true,
    workspaceInterceptorEnabled: true,
    nativePopoutPolicy: "status-bar-only",
    urlPopoutPolicy: "disabled",
    activityBars: { left: [], right: [] },
    activityBarDefaults: { left: true, right: true },
    ...overrides,
  };
}

function createPlugin(settings: WindowSettings) {
  const workspace = {
    iterateAllLeaves: vi.fn(),
    on: vi.fn(() => ({})),
  };
  const app = { workspace } as unknown as App;
  const plugin = Object.assign(Object.create(WindowSpacesPlugin.prototype), {
    app,
    settings,
    saveSettings: vi.fn().mockResolvedValue(undefined),
  }) as WindowSpacesPlugin;
  const engine = new PopoutLayoutEngine(app);
  plugin.popoutLayout = engine as any;
  plugin.activityBars = new PopoutActivityBarManager(plugin, engine);
  plugin.manager = new WindowLayoutManager(plugin);
  plugin.workspaceInterceptor = new WorkspaceInterceptor(app, engine);
  return { plugin, app, engine };
}

describe("popout entrypoint policies", () => {
  test("resolves native popouts to each configured mode", () => {
    const win = createWindow();
    expect(getWindowPopoutPolicy(win, createSettings({ nativePopoutPolicy: "full" }))).toBe("full");
    expect(getWindowPopoutPolicy(win, createSettings({ nativePopoutPolicy: "status-bar-only" }))).toBe("status-bar-only");
    expect(getWindowPopoutPolicy(win, createSettings({ nativePopoutPolicy: "disabled" }))).toBe("disabled");
  });

  test("resolves URL popouts to each configured mode", () => {
    const win = createWindow("https:");
    expect(getWindowPopoutPolicy(win, createSettings({ urlPopoutPolicy: "full" }))).toBe("full");
    expect(getWindowPopoutPolicy(win, createSettings({ urlPopoutPolicy: "status-bar-only" }))).toBe("status-bar-only");
    expect(getWindowPopoutPolicy(win, createSettings({ urlPopoutPolicy: "disabled" }))).toBe("disabled");
  });

  test("explicit Window Space launch always resolves to full", () => {
    const win = createWindow("https:");
    expect(getWindowPopoutPolicy(win, createSettings({ urlPopoutPolicy: "disabled" }), undefined, true)).toBe("full");
  });

  test("allows sidebars only in full mode", () => {
    const win = createWindow();
    expect(canInjectSidebars(win, createSettings({ nativePopoutPolicy: "full" }))).toBe(true);
    expect(canInjectSidebars(win, createSettings({ nativePopoutPolicy: "status-bar-only" }))).toBe(false);
    expect(canInjectSidebars(win, createSettings({ nativePopoutPolicy: "disabled" }))).toBe(false);
  });

  test("status bar follows the global setting in full and status-bar-only modes", () => {
    const win = createWindow();
    expect(canInjectStatusBar(win, createSettings({ nativePopoutPolicy: "full", showLayoutStatusBar: true }))).toBe(true);
    expect(canInjectStatusBar(win, createSettings({ nativePopoutPolicy: "status-bar-only", showLayoutStatusBar: true }))).toBe(true);
    expect(canInjectStatusBar(win, createSettings({ nativePopoutPolicy: "disabled", showLayoutStatusBar: true }))).toBe(false);
  });

  test("global status bar switch vetoes both otherwise-enabled modes", () => {
    const win = createWindow();
    expect(canInjectStatusBar(win, createSettings({ nativePopoutPolicy: "full", showLayoutStatusBar: false }))).toBe(false);
    expect(canInjectStatusBar(win, createSettings({ nativePopoutPolicy: "status-bar-only", showLayoutStatusBar: false }))).toBe(false);
  });

  test("URL mode resolves independently from native mode", () => {
    const win = createWindow("https:");
    expect(getWindowPopoutPolicy(win, createSettings({ nativePopoutPolicy: "full", urlPopoutPolicy: "disabled" }))).toBe("disabled");
  });

  test("delegated popout initialization follows nativePopoutPolicy", async () => {
    for (const mode of ["status-bar-only", "full"] as const) {
      const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: mode }));
      const win = createWindow();
      const spy = vi
        .spyOn(plugin.activityBars, "initializeNewWindow")
        .mockResolvedValue(undefined);
      await plugin.initializeNewPopoutWindowFor(win);
      // 委託開窗（Folder Spaces 等）：force 必須為 false，交由政策決定裝飾。
      // 換句話說，nativePopoutPolicy=full 時仍会建立側欄，status-bar-only
      // 時 initializeNewWindow 自己依 canInjectSidebars 跳過。
      expect(spy).toHaveBeenCalledWith(win, false);
    }
  });

  test("delegated popout initialization is skipped entirely under disabled policy", async () => {
    const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: "disabled" }));
    const win = createWindow();
    const spy = vi
      .spyOn(plugin.activityBars, "initializeNewWindow")
      .mockResolvedValue(undefined);
    await plugin.initializeNewPopoutWindowFor(win);
    expect(spy).not.toHaveBeenCalled();
    expect(plugin.isWindowDisabled(win)).toBe(true);
  });

  test("dedicated Space launch forces full initialization and marks the window explicit", async () => {
    const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: "status-bar-only" }));
    const win = createWindow();
    expect(plugin.isExplicitSpaceWindow(win)).toBe(false);

    plugin.beginDedicatedSpacePopout();
    const spy = vi
      .spyOn(plugin.activityBars, "initializeNewWindow")
      .mockResolvedValue(undefined);
    await plugin.initializeNewPopoutWindowFor(win);

    expect(spy).toHaveBeenCalledWith(win, true);
    // 取得 Space 名稱前即視為 explicit Space，否則開窗當下的政策檢查
    // （window-open / URL 檢查排程）會拆掉剛建立的側欄。
    expect(plugin.isExplicitSpaceWindow(win)).toBe(true);
    expect(plugin.getWindowPolicy(win)).toBe("full");
  });

  test("dedicated launch intent is consumed once per creation", async () => {
    const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: "status-bar-only" }));
    plugin.beginDedicatedSpacePopout();

    const first = createWindow();
    const spy = vi
      .spyOn(plugin.activityBars, "initializeNewWindow")
      .mockResolvedValue(undefined);
    await plugin.initializeNewPopoutWindowFor(first);
    expect(spy).toHaveBeenLastCalledWith(first, true);

    // 意圖已消費：後續由其他外掛委託開的視窗不得被誤升級為完整 Space。
    const second = createWindow();
    await plugin.initializeNewPopoutWindowFor(second);
    expect(spy).toHaveBeenLastCalledWith(second, false);
    expect(plugin.isExplicitSpaceWindow(second)).toBe(false);
  });
});

describe("policy integration with Activity Bar and Manager", () => {
  test("Activity Bar refuses injection for status-bar-only and disabled policies", () => {
    for (const mode of ["status-bar-only", "disabled"] as const) {
      const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: mode }));
      const win = createWindow();
      plugin.activityBars.injectForWindow(win);
      expect(plugin.activityBars.isInjected(win)).toBe(false);
      expect(win.document.body.querySelector(".window-spaces-activity-bar")).toBeNull();
    }
  });

  test("Activity Bar injects under full policy", () => {
    const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: "full" }));
    const win = createWindow();
    plugin.activityBars.injectForWindow(win);
    expect(plugin.activityBars.isInjected(win)).toBe(true);
    expect(win.document.body.querySelector(".window-spaces-activity-bar")).not.toBeNull();
    plugin.activityBars.cleanupWindow(win);
  });

  test("Manager renders status bar for status-bar-only but not disabled", () => {
    for (const [mode, expected] of [["status-bar-only", true], ["disabled", false]] as const) {
      const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: mode, showLayoutStatusBar: true }));
      const win = createWindow();
      plugin.manager.registerPopoutWindow(win);
      expect(Boolean(win.document.body.querySelector(".window-spaces-layout-status"))).toBe(expected);
      plugin.manager.unregisterPopoutWindow(win);
    }
  });

  test("Manager removes existing status bar when global switch is off", () => {
    const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: "full", showLayoutStatusBar: false }));
    const win = createWindow();
    plugin.manager.registerPopoutWindow(win);
    expect(win.document.body.querySelector(".window-spaces-layout-status")).toBeNull();
    plugin.manager.unregisterPopoutWindow(win);
  });

  test("changing policies re-evaluates current popouts", () => {
    const { plugin, engine } = createPlugin(createSettings({ nativePopoutPolicy: "full" }));
    const win = createWindow();
    vi.spyOn(engine, "getLivePopoutWindows").mockReturnValue([win]);
    plugin.activityBars.injectForWindow(win);
    expect(plugin.activityBars.isInjected(win)).toBe(true);

    plugin.settings.nativePopoutPolicy = "disabled";
    plugin.handlePopoutPolicyChange();
    expect(plugin.activityBars.isInjected(win)).toBe(false);
    expect(win.document.body.querySelector(".window-spaces-layout-status")).toBeNull();
  });

  test("native popout transitions to named space automatically injects Activity Bar", () => {
    const { plugin } = createPlugin(createSettings({ nativePopoutPolicy: "status-bar-only" }));
    const win = createWindow();
    // 初始為 status-bar-only：不注入 Activity Bar
    plugin.manager.registerPopoutWindow(win);
    expect(plugin.activityBars.isInjected(win)).toBe(false);

    // 使用者或還原流程將該視窗標記為 Space
    plugin.manager.setLayoutLabelForWindow(win, "Work Space", true);

    // renderWindow 應自動偵測並補上 Activity Bar 注入
    plugin.activityBars.renderWindow(win);
    expect(plugin.activityBars.isInjected(win)).toBe(true);
    expect(win.document.body.querySelector(".window-spaces-activity-bar")).not.toBeNull();
  });

  test("composite window with markdown and webviewer is not misclassified as pure URL popout", () => {
    const win = createWindow();
    const mdContainer = win.document.createElement("div");
    const webContainer = win.document.createElement("div");
    win.document.body.appendChild(mdContainer);
    win.document.body.appendChild(webContainer);

    const mdLeaf = {
      containerEl: mdContainer,
      getViewState: () => ({ type: "markdown", state: { file: "notes.md" } }),
    } as any;
    const webLeaf = {
      containerEl: webContainer,
      getViewState: () => ({ type: "webviewer", state: { url: "https://reference.org" } }),
    } as any;

    const app = {
      workspace: {
        iterateAllLeaves: (cb: (l: any) => void) => {
          cb(mdLeaf);
          cb(webLeaf);
        },
      },
    } as any;

    // 含有 markdown 文件視圖，不應被誤判為 URL popout
    expect(getWindowPopoutPolicy(win, createSettings({ nativePopoutPolicy: "status-bar-only", urlPopoutPolicy: "disabled" }), app)).toBe("status-bar-only");
  });
});
