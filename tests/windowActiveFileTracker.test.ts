import assert from "node:assert/strict";
import { describe, it, beforeEach } from "vitest";
import type { App, WorkspaceLeaf, TFile } from "obsidian";
import {
  WindowActiveFileTracker,
  type PatchableViewOnFileOpen,
} from "../src/shared/windowActiveFileTracker";
import {
  acquireWorkspaceInterceptor,
  releaseWorkspaceInterceptor,
  getWorkspaceActiveFileTracker,
} from "../src/shared/workspaceInterceptor";
import { PopoutLayoutEngine } from "../src/shared/popoutLayout";

function createMockWindow(id: string): Window {
  return { id, isMockWindow: true } as unknown as Window;
}

function createMockFile(path: string): TFile {
  return { path, name: path.split("/").pop() ?? path } as unknown as TFile;
}

function createMockLeaf(win: Window, file?: TFile): WorkspaceLeaf {
  const containerEl = {
    ownerDocument: {
      defaultView: win,
    },
  };
  return {
    view: {
      containerEl,
      file: file ?? null,
    },
    containerEl,
    getContainer: () => ({ win }),
  } as unknown as WorkspaceLeaf;
}

describe("WindowActiveFileTracker", () => {
  let mockApp: App;

  beforeEach(() => {
    // Clear global shared states between tests if present
    const ns = globalThis as {
      __obsidian_window_active_file_tracker_state_v1__?: unknown;
      __obsidian_workspace_interceptor_state_v1__?: unknown;
    };
    delete ns.__obsidian_window_active_file_tracker_state_v1__;
    delete ns.__obsidian_workspace_interceptor_state_v1__;

    mockApp = {
      workspace: {
        activeLeaf: null,
        getActiveFile: () => null,
      },
    } as unknown as App;
  });

  it("tracks active file per window and updates lastActiveWindow", () => {
    const tracker = new WindowActiveFileTracker(mockApp);
    const win1 = createMockWindow("win1");
    const win2 = createMockWindow("win2");

    const file1 = createMockFile("Docs/Note1.md");
    const file2 = createMockFile("Projects/Plan.md");

    const leaf1 = createMockLeaf(win1, file1);
    const leaf2 = createMockLeaf(win2, file2);

    // Focus leaf 1 in window 1
    tracker.trackActiveLeaf(leaf1);
    assert.equal(tracker.getActiveFileForWindow(win1), file1);
    assert.equal(tracker.getActiveFileForWindow(win2), null);
    assert.equal(tracker.getLastActiveWindow(), win1);

    // Focus leaf 2 in window 2
    tracker.trackActiveLeaf(leaf2);
    assert.equal(tracker.getActiveFileForWindow(win1), file1);
    assert.equal(tracker.getActiveFileForWindow(win2), file2);
    assert.equal(tracker.getLastActiveWindow(), win2);
  });

  it("tracks file-open with sourceLeaf or fallback activeLeaf", () => {
    const tracker = new WindowActiveFileTracker(mockApp);
    const win1 = createMockWindow("win1");
    const file1 = createMockFile("Note1.md");
    const leaf1 = createMockLeaf(win1);

    tracker.trackFileOpen(file1, leaf1);
    assert.equal(tracker.getActiveFileForWindow(win1), file1);
    assert.equal(tracker.getLastActiveWindow(), win1);
  });

  it("getActiveFileForWindow falls back to global workspace active file when appropriate", () => {
    const globalFile = createMockFile("Global.md");
    const win1 = createMockWindow("win1");
    const leaf1 = createMockLeaf(win1, globalFile);

    const appWithActive: App = {
      workspace: {
        activeLeaf: leaf1,
        getActiveFile: () => globalFile,
      },
    } as unknown as App;

    const tracker = new WindowActiveFileTracker(appWithActive);
    // When no specific window file is recorded, checking win1 falls back to global activeLeaf if in win1
    assert.equal(tracker.getActiveFileForWindow(win1), globalFile);

    // When checking without a window, returns getActiveFile()
    assert.equal(tracker.getActiveFileForWindow(null), globalFile);
  });

  it("shouldProcessFileOpen suppresses cross-window file open", () => {
    const tracker = new WindowActiveFileTracker(mockApp);
    const win1 = createMockWindow("win1");
    const win2 = createMockWindow("win2");

    const file1 = createMockFile("Note1.md");
    const leaf1 = createMockLeaf(win1, file1);
    const leaf2 = createMockLeaf(win2);

    // Focus window 1
    tracker.trackActiveLeaf(leaf1);

    // View in window 1 should process file-open
    assert.equal(tracker.shouldProcessFileOpen(leaf1), true);

    // View in window 2 should NOT process file-open
    assert.equal(tracker.shouldProcessFileOpen(leaf2), false);

    // Direct Window object support
    assert.equal(tracker.shouldProcessFileOpen(win1), true);
    assert.equal(tracker.shouldProcessFileOpen(win2), false);

    // View with no leaf / no window should fallback to true
    assert.equal(tracker.shouldProcessFileOpen(null), true);
  });

  it("patchViewInstance intercepts onFileOpen and blocks cross-window calls", () => {
    const tracker = new WindowActiveFileTracker(mockApp);

    const winMain = createMockWindow("main");
    const winPopout = createMockWindow("popout");

    const noteInPopout = createMockFile("PopoutNote.md");
    const popoutEditorLeaf = createMockLeaf(winPopout, noteInPopout);

    const mainExplorerLeaf = createMockLeaf(winMain);
    const popoutExplorerLeaf = createMockLeaf(winPopout);

    let mainReceived: TFile | null = null;
    let popoutReceived: TFile | null = null;

    const mainView: PatchableViewOnFileOpen = {
      leaf: mainExplorerLeaf,
      onFileOpen: (f) => {
        mainReceived = f;
      },
    };

    const popoutView: PatchableViewOnFileOpen = {
      leaf: popoutExplorerLeaf,
      onFileOpen: (f) => {
        popoutReceived = f;
      },
    };

    tracker.patchViewInstance(mainView);
    tracker.patchViewInstance(popoutView);

    // User activates file in popout window
    tracker.trackActiveLeaf(popoutEditorLeaf);
    tracker.trackFileOpen(noteInPopout, popoutEditorLeaf);

    // Global event broadcast triggers onFileOpen on both views
    mainView.onFileOpen!(noteInPopout);
    popoutView.onFileOpen!(noteInPopout);

    // Main window explorer must have ignored the event
    assert.equal(mainReceived, null, "Main window explorer should ignore popout file open");

    // Popout explorer must have processed the event
    assert.equal(popoutReceived, noteInPopout, "Popout explorer should process popout file open");
  });

  it("patchViewInstance ignores views already patched or without onFileOpen", () => {
    const tracker = new WindowActiveFileTracker(mockApp);
    const win = createMockWindow("main");
    const leaf = createMockLeaf(win);

    const view: PatchableViewOnFileOpen = {
      leaf,
      onFileOpen: (_f) => {},
    };

    tracker.patchViewInstance(view);
    const patchedFn = view.onFileOpen;

    // Second call should be a no-op and not double patch
    tracker.patchViewInstance(view);
    assert.equal(view.onFileOpen, patchedFn);

    // View without onFileOpen
    const viewWithoutFn: PatchableViewOnFileOpen = { leaf };
    tracker.patchViewInstance(viewWithoutFn);
    assert.equal(viewWithoutFn.onFileOpen, undefined);
  });

  it("restoreViewInstance and restoreAll cleanly restore original onFileOpen", () => {
    const tracker = new WindowActiveFileTracker(mockApp);
    const win = createMockWindow("main");
    const leaf = createMockLeaf(win);

    let callCount = 0;
    const originalHandler = (_file: TFile | null) => {
      callCount += 1;
    };

    const view: PatchableViewOnFileOpen = {
      leaf,
      onFileOpen: originalHandler,
    };

    tracker.patchViewInstance(view);
    assert.notEqual(view.onFileOpen, originalHandler);
    assert.equal(view.__sharedOriginalOnFileOpen, originalHandler);
    assert.equal(view._fsOriginalOnFileOpen, originalHandler);

    // Teardown
    tracker.restoreAll();
    assert.equal(view.onFileOpen, originalHandler);
    assert.equal(view.__sharedOriginalOnFileOpen, undefined);
    assert.equal(view._fsOriginalOnFileOpen, undefined);

    // Calling original handler directly works normally
    view.onFileOpen!(createMockFile("Test.md"));
    assert.equal(callCount, 1);
  });

  it("supports multi-instance cross-plugin shared state coordination", () => {
    // Simulate Window Spaces instance and Folder Spaces instance sharing globalThis
    const wsTracker = new WindowActiveFileTracker(mockApp);
    const fsTracker = new WindowActiveFileTracker(mockApp);

    const win1 = createMockWindow("win1");
    const file1 = createMockFile("SharedNote.md");
    const leaf1 = createMockLeaf(win1, file1);

    // WindowSpaces tracks active leaf
    wsTracker.trackActiveLeaf(leaf1);

    // FolderSpaces tracker immediately observes the active file and lastActiveWindow
    assert.equal(fsTracker.getActiveFileForWindow(win1), file1);
    assert.equal(fsTracker.getLastActiveWindow(), win1);

    // Explicit setters
    const win2 = createMockWindow("win2");
    const file2 = createMockFile("DirectFile.md");
    wsTracker.setWindowActiveFile(win2, file2);
    wsTracker.setLastActiveWindow(win2);

    assert.equal(fsTracker.getActiveFileForWindow(win2), file2);
    assert.equal(fsTracker.getLastActiveWindow(), win2);
  });

  it("workspaceInterceptor tryTrigger gatekeeper isolates universal file-open event broadcast across windows", () => {
    const listeners: { [name: string]: Array<(...args: any[]) => void> } = {};
    const winMain = createMockWindow("main");
    const winPopout = createMockWindow("popout");

    const mockWorkspace: any = {
      activeLeaf: null,
      getActiveFile: () => null,
      on: (name: string, cb: (...args: any[]) => void) => {
        listeners[name] = listeners[name] || [];
        listeners[name].push(cb);
        return cb;
      },
      offref: (ref: any) => {
        for (const k of Object.keys(listeners)) {
          listeners[k] = listeners[k].filter((l) => l !== ref);
        }
      },
      tryTrigger: (sub: any, args: any[]) => {
        sub.fn.apply(sub.ctx, args);
      },
    };

    const testApp = { workspace: mockWorkspace } as unknown as App;
    const engine = new PopoutLayoutEngine(testApp);

    acquireWorkspaceInterceptor(testApp, {
      id: "test-interceptor",
      engine,
    });

    const mainLeaf = createMockLeaf(winMain);
    const popoutLeaf = createMockLeaf(winPopout);

    let mainFileOpenCount = 0;
    let popoutFileOpenCount = 0;

    const mainSub = {
      name: "file-open",
      ctx: { leaf: mainLeaf },
      fn: () => {
        mainFileOpenCount++;
      },
    };

    const popoutSub = {
      name: "file-open",
      ctx: { leaf: popoutLeaf },
      fn: () => {
        popoutFileOpenCount++;
      },
    };

    const tracker = getWorkspaceActiveFileTracker(testApp);
    const popoutFile = createMockFile("PopoutDoc.md");

    // 1. User activates editor in Popout Window
    tracker.trackActiveLeaf(createMockLeaf(winPopout, popoutFile));

    // 2. Dispatch file-open via workspace.tryTrigger to both main and popout view subscriptions
    mockWorkspace.tryTrigger(mainSub, [popoutFile]);
    mockWorkspace.tryTrigger(popoutSub, [popoutFile]);

    // Main window view must NOT receive popout's file-open event
    assert.equal(mainFileOpenCount, 0, "Main window view should be suppressed");
    // Popout window view MUST receive the file-open event
    assert.equal(popoutFileOpenCount, 1, "Popout window view should process the event");

    // 3. User activates editor in Main Window
    const mainFile = createMockFile("MainDoc.md");
    tracker.trackActiveLeaf(createMockLeaf(winMain, mainFile));

    mockWorkspace.tryTrigger(mainSub, [mainFile]);
    mockWorkspace.tryTrigger(popoutSub, [mainFile]);

    assert.equal(mainFileOpenCount, 1, "Main window view should process main window event");
    assert.equal(popoutFileOpenCount, 1, "Popout window view should NOT process main window event");

    // Teardown
    releaseWorkspaceInterceptor("test-interceptor");
  });
});
