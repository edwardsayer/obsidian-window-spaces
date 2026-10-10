import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "obsidian";
import {
  acquireWorkspaceInterceptor,
  releaseWorkspaceInterceptor,
} from "../src/shared/workspaceInterceptor";

/**
 * Window-locked view discovery 的**刻意語意**與**逃生開關**。
 *
 * 背景：Window Spaces 會把「從 popout 發起的路由」視窗化，這對部分第三方外掛
 * （它們用全域 `getLeavesOfType()` 對帳既有面板）造成副作用。社群有人提議移除
 * 這些覆寫；我們的決定是**保留**這個差異化能力，並以設定項
 * `workspaceInterceptorEnabled`（UI 標籤「Route views to their popout windows」）
 * 作為 opt-out。
 *
 * 本檔的價值有兩層：
 * 1. 把「刻意視窗化」寫成可執行的規格（避免日後被當成 bug 移除）。
 * 2. 證明**逃生開關確實有效** —— 使用者取消勾選後，`getLeavesOfType` 回全域、
 *    `getLeftLeaf` / `getRightLeaf` 走原生主側欄。這是回覆相容性問題的正解，
 *    而不是移除整個路由層。
 */

const POPOUT_ID = "view-discovery-test";

function makePopoutWindow(): Window {
  return {
    document: {
      body: { classList: { contains: (cls: string) => cls === "is-popout-window" } },
      hasFocus: () => true,
    },
  } as unknown as Window;
}

interface Fixture {
  app: App;
  workspace: any;
  popoutWin: Window;
  leafInPopout: unknown;
  leafInMain: unknown;
  originalGetLeavesOfType: ReturnType<typeof vi.fn>;
  originalLeft: ReturnType<typeof vi.fn>;
  engine: { openSideLeafSync: ReturnType<typeof vi.fn> };
}

function buildFixture(): Fixture {
  const popoutWin = makePopoutWindow();
  const mainWin = {
    document: { body: { classList: { contains: () => false } } },
  } as unknown as Window;

  const leafInPopout = { containerEl: { ownerDocument: { defaultView: popoutWin } } };
  const leafInMain = { containerEl: { ownerDocument: { defaultView: mainWin } } };

  const originalGetLeavesOfType = vi.fn().mockReturnValue([leafInMain, leafInPopout]);
  const originalLeft = vi.fn().mockReturnValue("native-left-leaf");
  const workspace = {
    getLeftLeaf: originalLeft,
    getRightLeaf: vi.fn().mockReturnValue("native-right-leaf"),
    getLeavesOfType: originalGetLeavesOfType,
  } as any;
  const engine = { openSideLeafSync: vi.fn().mockReturnValue("popout-side-leaf") };

  (globalThis as any).activeWindow = popoutWin;
  return {
    app: { workspace } as unknown as App,
    workspace,
    popoutWin,
    leafInPopout,
    leafInMain,
    originalGetLeavesOfType,
    originalLeft,
    engine,
  };
}

afterEach(() => {
  releaseWorkspaceInterceptor(POPOUT_ID);
  delete (globalThis as any).activeWindow;
});

describe("window-locked view discovery（刻意語意）", () => {
  test("受管理 popout 為焦點時，getLeavesOfType 僅回傳該視窗的 leaf", () => {
    const f = buildFixture();
    acquireWorkspaceInterceptor(f.app, {
      id: POPOUT_ID,
      engine: f.engine as never,
      isEnabled: () => true,
    });

    expect(f.workspace.getLeavesOfType("outline")).toEqual([f.leafInPopout]);
    // 原生實作仍被呼叫（我們在其結果上過濾，不改寫列舉來源）。
    expect(f.originalGetLeavesOfType).toHaveBeenCalledWith("outline");
  });

  test("popout 為焦點時，getLeftLeaf / getRightLeaf 路由到該 popout 的引擎", () => {
    const f = buildFixture();
    acquireWorkspaceInterceptor(f.app, {
      id: POPOUT_ID,
      engine: f.engine as never,
      isEnabled: () => true,
    });

    expect(f.workspace.getLeftLeaf(false)).toBe("popout-side-leaf");
    expect(f.workspace.getRightLeaf(false)).toBe("popout-side-leaf");
    expect(f.engine.openSideLeafSync).toHaveBeenCalledWith(f.popoutWin, "left");
    expect(f.engine.openSideLeafSync).toHaveBeenCalledWith(f.popoutWin, "right");
    expect(f.originalLeft).not.toHaveBeenCalled();
  });
});

describe("逃生開關：取消「Route views to their popout windows」", () => {
  test("getLeavesOfType 回傳全域清單（不再視窗化）", () => {
    const f = buildFixture();
    acquireWorkspaceInterceptor(f.app, {
      id: POPOUT_ID,
      engine: f.engine as never,
      isEnabled: () => false,
    });

    // 這正是第三方外掛（MAKE.md Navigator、Vertical Tabs 等）需要的全域語意。
    expect(f.workspace.getLeavesOfType("outline")).toEqual([f.leafInMain, f.leafInPopout]);
  });

  test("getLeftLeaf / getRightLeaf 走原生主側欄，不再路由到 popout", () => {
    const f = buildFixture();
    acquireWorkspaceInterceptor(f.app, {
      id: POPOUT_ID,
      engine: f.engine as never,
      isEnabled: () => false,
    });

    expect(f.workspace.getLeftLeaf(false)).toBe("native-left-leaf");
    expect(f.workspace.getRightLeaf(false)).toBe("native-right-leaf");
    expect(f.engine.openSideLeafSync).not.toHaveBeenCalled();
  });

  test("逃生開關不影響 uninstall 的精確還原", () => {
    const f = buildFixture();
    acquireWorkspaceInterceptor(f.app, {
      id: POPOUT_ID,
      engine: f.engine as never,
      isEnabled: () => false,
    });
    releaseWorkspaceInterceptor(POPOUT_ID);

    expect(f.workspace.getLeavesOfType).toBe(f.originalGetLeavesOfType);
    expect(f.workspace.getLeftLeaf).toBe(f.originalLeft);
    expect(f.workspace.getLeavesOfType("outline")).toEqual([f.leafInMain, f.leafInPopout]);
  });
});
