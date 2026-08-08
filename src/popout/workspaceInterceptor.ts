import { App, WorkspaceLeaf } from "obsidian";
import {
  ExtendedWorkspaceWithInterceptor,
} from "../types";
import { getWindowOfLeaf, isPopoutWindow, PopoutLayoutEngine, PopoutSide } from "./popoutLayout";

/**
 * Workspace API 攔截器（Monkey Patch）。
 *
 * 攔截 `app.workspace.getLeftLeaf(split)` 與 `getRightLeaf(split)`：
 * 當呼叫發生於 Popout 視窗（active window 為 Popout）時，將結果路由至該
 * Popout 的模擬側欄，讓第三方外掛（AI Chatbox、Calendar 等）零修改地把 view
 * 開到 Popout 側欄，而非跳回主視窗。
 *
 * 安全要求（cheatsheet）：
 * - 薄補丁：僅做「判定 → 路由 → fallback」。
 * - `onunload()` 時精準還原原始方法；重載防呆避免重複 patch。
 * - 提供可關閉開關（由 plugin 設定驅動）。
 */
export class WorkspaceInterceptor {
  private app: App;
  private engine: PopoutLayoutEngine;
  private installed = false;
  private originalGetLeftLeaf: ((split: boolean) => WorkspaceLeaf | null) | null = null;
  private originalGetRightLeaf: ((split: boolean) => WorkspaceLeaf | null) | null = null;
  private originalGetLeavesOfType: ((type: string) => WorkspaceLeaf[]) | null = null;

  /** 是否啟用（由 plugin 設定動態讀取）。 */
  enabled = true;

  /**
   * 判斷指定視窗是否為「本外掛管理的 Popout」。
   * 僅對受管理的視窗進行攔截，避免影響 Obsidian 自己的 UI 視窗（如設定 popout）。
   */
  isManagedWindow: ((win: Window) => boolean) | null = null;

  constructor(app: App) {
    this.app = app;
    this.engine = new PopoutLayoutEngine(app);
  }

  install(): void {
    const ws = this.app.workspace as unknown as ExtendedWorkspaceWithInterceptor;
    if (!ws || this.installed) return;
    if (ws._windowSpacesInterceptorInstalled) {
      // 重載防呆：若上次卸載未完整還原，先還原再重新安裝
      this.forceRestore();
    }

    this.originalGetLeftLeaf = ws.getLeftLeaf ?? null;
    this.originalGetRightLeaf = ws.getRightLeaf ?? null;
    this.originalGetLeavesOfType = ws.getLeavesOfType ?? null;

    ws._windowSpacesOriginalGetLeftLeaf = ws.getLeftLeaf;
    ws._windowSpacesOriginalGetRightLeaf = ws.getRightLeaf;
    ws._windowSpacesOriginalGetLeavesOfType = ws.getLeavesOfType;

    const self = this;

    ws.getLeftLeaf = function (split: boolean): WorkspaceLeaf | null {
      const intercepted = self.tryIntercept("left");
      if (intercepted) return intercepted;
      const original = ws._windowSpacesOriginalGetLeftLeaf;
      return original ? original.call(ws, split) : null;
    } as typeof ws.getLeftLeaf;

    ws.getRightLeaf = function (split: boolean): WorkspaceLeaf | null {
      const intercepted = self.tryIntercept("right");
      if (intercepted) return intercepted;
      const original = ws._windowSpacesOriginalGetRightLeaf;
      return original ? original.call(ws, split) : null;
    } as typeof ws.getRightLeaf;

    ws.getLeavesOfType = function (type: string): WorkspaceLeaf[] {
      const original = ws._windowSpacesOriginalGetLeavesOfType;
      const leaves = original ? original.call(ws, type) : [];
      if (!self.enabled || !leaves || leaves.length === 0) return leaves;

      // 取得目前活動視窗 (activeWindow / window)
      const currentWin = typeof activeWindow !== "undefined" ? activeWindow : window;

      // 嚴格過濾：僅傳回與當前活動視窗相同的 leaves，避免外掛跨視窗取得並 active 異地頁籤
      return leaves.filter((leaf) => {
        const leafWin = getWindowOfLeaf(leaf);
        return leafWin === currentWin;
      });
    } as typeof ws.getLeavesOfType;

    ws._windowSpacesInterceptorInstalled = true;
    this.installed = true;
  }

  uninstall(): void {
    this.forceRestore();
    this.installed = false;
  }

  private forceRestore(): void {
    const ws = this.app.workspace as unknown as ExtendedWorkspaceWithInterceptor;
    if (!ws) return;

    if (ws._windowSpacesOriginalGetLeftLeaf) {
      ws.getLeftLeaf = ws._windowSpacesOriginalGetLeftLeaf;
    } else if (this.originalGetLeftLeaf) {
      ws.getLeftLeaf = this.originalGetLeftLeaf;
    }

    if (ws._windowSpacesOriginalGetRightLeaf) {
      ws.getRightLeaf = ws._windowSpacesOriginalGetRightLeaf;
    } else if (this.originalGetRightLeaf) {
      ws.getRightLeaf = this.originalGetRightLeaf;
    }

    if (ws._windowSpacesOriginalGetLeavesOfType) {
      ws.getLeavesOfType = ws._windowSpacesOriginalGetLeavesOfType;
    } else if (this.originalGetLeavesOfType) {
      ws.getLeavesOfType = this.originalGetLeavesOfType;
    }

    delete ws._windowSpacesOriginalGetLeftLeaf;
    delete ws._windowSpacesOriginalGetRightLeaf;
    delete ws._windowSpacesOriginalGetLeavesOfType;
    ws._windowSpacesInterceptorInstalled = false;
  }

  private tryIntercept(side: PopoutSide): WorkspaceLeaf | null {
    if (!this.enabled) return null;

    const activeWin = this.getActivePopoutWindow();
    if (!activeWin) return null;

    // 只攔截受本外掛管理的 Popout，避免誤攔 Obsidian 自己的 UI 視窗
    if (this.isManagedWindow && !this.isManagedWindow(activeWin)) {
      return null;
    }

    try {
      return this.engine.openSideLeafSync(activeWin, side);
    } catch {
      return null;
    }
  }

  /** 判定當前 active window 是否為 Popout（三級判定）。 */
  private getActivePopoutWindow(): Window | null {
    // 1. Obsidian 官方 activeWindow 全域
    if (typeof activeWindow !== "undefined" && activeWindow !== window && isPopoutWindow(activeWindow)) {
      return activeWindow;
    }

    // 2. mostRecentLeaf 的 owner window
    const ws = this.app.workspace as unknown as {
      getMostRecentLeaf?: () => WorkspaceLeaf | null;
    };
    const leaf = typeof ws.getMostRecentLeaf === "function" ? ws.getMostRecentLeaf() : null;
    if (leaf) {
      const win = getWindowOfLeaf(leaf);
      if (win && isPopoutWindow(win)) return win;
    }

    // 3. 遍歷 leaf 找 focus 的 Popout
    let focusedPopout: Window | null = null;
    (this.app.workspace as unknown as { iterateAllLeaves(cb: (l: WorkspaceLeaf) => void): void }).iterateAllLeaves?.(
      (candidate: WorkspaceLeaf) => {
        const win = getWindowOfLeaf(candidate);
        if (!focusedPopout && win && isPopoutWindow(win) && win.document?.hasFocus?.()) {
          focusedPopout = win;
        }
      }
    );
    return focusedPopout;
  }
}
