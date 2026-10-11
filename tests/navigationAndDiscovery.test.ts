import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { App, TFile, WorkspaceLeaf } from "obsidian";
import {
  acquireWorkspaceInterceptor,
  getWorkspaceActiveFileTracker,
  releaseWorkspaceInterceptor,
} from "../src/shared/workspaceInterceptor";

const participantId = "navigation-discovery-regression";
const globals = globalThis as unknown as { activeWindow?: Window };
let previousActiveWindow: Window | undefined;

beforeEach(() => {
  previousActiveWindow = globals.activeWindow;
  vi.spyOn(document, "hasFocus").mockReturnValue(false);
  const namespace = window as unknown as {
    __obsidian_workspace_interceptor_state_v1__?: unknown;
    __obsidian_window_active_file_tracker_state_v1__?: unknown;
  };
  delete namespace.__obsidian_workspace_interceptor_state_v1__;
  delete namespace.__obsidian_window_active_file_tracker_state_v1__;
});

function fixture() {
  const popout = {
    document: {
      body: { classList: { contains: (name: string) => name === "is-popout-window" } },
      hasFocus: () => true,
    },
  } as unknown as Window;
  const mainPanel = { id: "main-panel", containerEl: { ownerDocument: { defaultView: window } } };
  const sidePanel = { id: "sidebar-navigator", containerEl: { ownerDocument: { defaultView: popout } } };
  const editor = { id: "center-editor", containerEl: { ownerDocument: { defaultView: popout } } };
  const nativeFile = { path: "Main.md", name: "Main.md" } as TFile;
  const workspace = {
    // Native getLeaf can reuse the focused sidebar, which is represented by
    // a content column in a popout rather than a native sidebar split.
    getLeaf: vi.fn().mockReturnValue(sidePanel),
    getLeavesOfType: vi.fn().mockReturnValue([mainPanel, sidePanel]),
    getLeftLeaf: vi.fn().mockReturnValue(mainPanel),
    getRightLeaf: vi.fn().mockReturnValue(mainPanel),
    ensureSideLeaf: vi.fn().mockResolvedValue(mainPanel),
    getActiveFile: vi.fn().mockReturnValue(nativeFile),
    tryTrigger: vi.fn((subscription: { fn: (...args: unknown[]) => void; ctx: unknown }, args: unknown[]) => {
      subscription.fn.apply(subscription.ctx, args);
    }),
  };
  const native = { ...workspace };
  const engine = {
    getActiveLeafInWindow: vi.fn().mockReturnValue(sidePanel),
    isLeafInSideColumn: vi.fn().mockReturnValue(true),
    getCenterLeafSync: vi.fn().mockReturnValue(editor),
    openSideLeafSync: vi.fn().mockReturnValue(sidePanel),
  };
  const policy = { enabled: true };
  const app = { workspace } as unknown as App;
  globals.activeWindow = popout;
  acquireWorkspaceInterceptor(app, {
    id: participantId,
    engine: engine as never,
    isEnabled: () => policy.enabled,
  });
  return { app, workspace, native, policy, mainPanel, sidePanel, editor, popout, engine };
}

afterEach(() => {
  releaseWorkspaceInterceptor(participantId);
  vi.restoreAllMocks();
  if (previousActiveWindow === undefined) delete globals.activeWindow;
  else globals.activeWindow = previousActiveWindow;
});

describe("file navigation and global discovery together", () => {
  test.each([undefined, false, "tab"])("getLeaf(%s) opens in the editor while existing panels remain discoverable", (request) => {
    const f = fixture();
    // Navigation plugins often call getLeaf() without an argument.
    const target = request === undefined ? f.workspace.getLeaf() : f.workspace.getLeaf(request);
    expect(target).toBe(f.editor);
    expect(target).not.toBe(f.sidePanel);
    expect(f.workspace.getLeavesOfType("generic-navigator")).toEqual([f.mainPanel, f.sidePanel]);
    expect(f.workspace.getLeftLeaf(false)).toBe(f.mainPanel);
    expect(f.workspace.getRightLeaf(false)).toBe(f.mainPanel);
    expect(f.engine.getCenterLeafSync).toHaveBeenCalledWith(f.popout, request);
  });

  test.each([undefined, false, "tab", "left", "right"])(
    "turning routing off restores native getLeaf(%s) while discovery and sidebar getters remain native",
    async (request) => {
      const f = fixture();
      f.policy.enabled = false;

      const target = request === undefined ? f.workspace.getLeaf() : f.workspace.getLeaf(request);
      expect(target).toBe(f.sidePanel);
      expect(f.native.getLeaf).toHaveBeenCalledWith(request);
      expect(await f.workspace.ensureSideLeaf("outline", "right", { active: true })).toBe(f.mainPanel);
      expect(f.native.ensureSideLeaf).toHaveBeenCalledWith("outline", "right", { active: true });
      expect(f.engine.openSideLeafSync).not.toHaveBeenCalled();
      expect(f.engine.getCenterLeafSync).not.toHaveBeenCalled();
      expect(f.workspace.getLeavesOfType).toBe(f.native.getLeavesOfType);
      expect(f.workspace.getLeftLeaf).toBe(f.native.getLeftLeaf);
      expect(f.workspace.getRightLeaf).toBe(f.native.getRightLeaf);
    }
  );

  test("turning routing off keeps per-window note context and file-open isolation active", () => {
    const f = fixture();
    const file = { path: "Popout.md", name: "Popout.md" } as TFile;
    const tracker = getWorkspaceActiveFileTracker(f.app);
    tracker.trackActiveLeaf({ ...f.editor, view: { file } } as unknown as WorkspaceLeaf);
    f.policy.enabled = false;

    expect(f.workspace.getActiveFile()).toBe(file);
    const mainListener = vi.fn();
    const localListener = vi.fn();
    f.workspace.tryTrigger({ name: "file-open", ctx: { leaf: f.mainPanel }, fn: mainListener }, [file]);
    f.workspace.tryTrigger({ name: "file-open", ctx: { leaf: f.sidePanel }, fn: localListener }, [file]);
    expect(mainListener).not.toHaveBeenCalled();
    expect(localListener).toHaveBeenCalledWith(file);
  });
});
