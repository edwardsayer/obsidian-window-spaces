import { afterEach, describe, expect, test, vi } from "vitest";
import { FileView } from "obsidian";
import { WindowLayoutManager } from "../src/manager";
import { initI18n } from "../src/i18n";

function makeManager() {
  const plugin = {
    app: { workspace: {}, vault: {} },
    settings: { spaces: [] },
    saveSettings: async () => {},
  } as any;
  initI18n(plugin.app);
  return new WindowLayoutManager(plugin);
}

function makeLeaf(view: unknown, state: Record<string, unknown>) {
  const containerEl = document.createElement("div");
  containerEl.appendChild(document.createElement("div")).className = "view-content";
  document.body.appendChild(containerEl);
  return {
    containerEl,
    view,
    working: false,
    isDeferred: false,
    getViewState: vi.fn(() => state),
    rebuildView: vi.fn().mockResolvedValue(undefined),
    loadIfDeferred: vi.fn().mockResolvedValue(undefined),
  };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("file loading and view maintenance", () => {
  test("leaves file views alone before their file property is populated", () => {
    const manager = makeManager();
    const leaf = makeLeaf(new FileView(null), { type: "custom-file-view", state: {} });

    manager.ensureViewRendered(leaf as any);
    manager.ensureViewRendered(leaf as any);

    expect(leaf.rebuildView).not.toHaveBeenCalled();
  });

  test("rapid activation retries do not rebuild two notes still loading", () => {
    const manager = makeManager();
    const first = makeLeaf(new FileView(null), { type: "markdown", state: { file: "first.md" } });
    const second = makeLeaf(new FileView(null), { type: "markdown", state: { file: "second.md" } });
    const callbacks: Array<() => void> = [];
    const popout = { closed: false, setTimeout: (fn: () => void) => callbacks.push(fn) } as any;

    for (const leaf of [first, second, first, second]) {
      manager.scheduleViewRenderAfterActivation(leaf as any, popout);
    }
    callbacks.forEach(callback => callback());

    expect(first.rebuildView).not.toHaveBeenCalled();
    expect(second.rebuildView).not.toHaveBeenCalled();
  });

  test("does not force-load a deferred file through sidebar maintenance", () => {
    const manager = makeManager();
    const leaf = makeLeaf({}, { type: "custom-file-view", state: { file: "example.data" } });
    leaf.isDeferred = true;

    manager.ensureViewRendered(leaf as any);

    expect(leaf.loadIfDeferred).not.toHaveBeenCalled();
    expect(leaf.rebuildView).not.toHaveBeenCalled();
  });

  test("does not rebuild a placeholder while native setViewState is still working", () => {
    const manager = makeManager();
    const leaf = makeLeaf({}, { type: "empty", state: {} });
    leaf.working = true;

    manager.ensureViewRendered(leaf as any);

    expect(leaf.rebuildView).not.toHaveBeenCalled();
  });

  test("rechecks the current view after an asynchronous deferred load", async () => {
    const manager = makeManager();
    const leaf = makeLeaf({}, { type: "search", state: {} });
    let finishLoad!: () => void;
    const pendingLoad = new Promise<void>(resolve => { finishLoad = resolve; });
    leaf.isDeferred = true;
    leaf.loadIfDeferred.mockReturnValue(pendingLoad);

    manager.ensureViewRendered(leaf as any);
    leaf.view = new FileView(null);
    leaf.getViewState.mockReturnValue({ type: "custom-file-view", state: {} });
    finishLoad();
    await pendingLoad;
    await Promise.resolve();

    expect(leaf.rebuildView).not.toHaveBeenCalled();
  });

  test("still repairs a sidebar that stores its associated note in state.file", () => {
    const manager = makeManager();
    const leaf = makeLeaf({}, { type: "outline", state: { file: "example.md" } });

    manager.ensureViewRendered(leaf as any);

    expect(leaf.rebuildView).toHaveBeenCalledTimes(1);
  });
});
