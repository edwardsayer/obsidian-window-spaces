import { App, WorkspaceLeaf } from "obsidian";
import { getWindowOfLeaf, ExtendedWorkspaceLeaf } from "../shared/popoutLayout";
import { PopoutPolicyMode, WindowSettings } from "../types";

const DOCUMENT_VIEW_TYPES = new Set([
  "markdown",
  "canvas",
  "graph",
  "file-explorer",
  "tag",
  "search",
  "backlink",
  "outgoing-link",
  "outline",
  "bookmarks",
  "all-properties",
  "file-properties",
  "sync-history",
  "window-spaces-layouts",
]);

/**
 * 檢查輸入是否為 http 或 https 網址字串。
 */
export function isHttpOrHttpsUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed);
}

/**
 * 檢查特定 Leaf 是否為 URL 視圖（如 Web Viewer、Surfing、OAuth 登入頁等）。
 */
export function isUrlLeaf(leaf: WorkspaceLeaf): boolean {
  if (!leaf) return false;
  const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
  const viewState = typeof extLeaf.getViewState === "function" ? extLeaf.getViewState() : undefined;
  const viewType = viewState?.type || (leaf.view as { getViewType?: () => string })?.getViewType?.();
  const state = viewState?.state;

  // 已知常見瀏覽器/網頁視圖型別
  if (
    viewType === "webviewer" ||
    viewType === "surfing-view" ||
    viewType === "custom-frames-view"
  ) {
    return true;
  }

  // viewState 的 state 含有 URL
  if (isHttpOrHttpsUrl(state?.url)) {
    return true;
  }

  // view 實例屬性
  const viewObj = leaf.view as unknown as {
    url?: unknown;
    getState?: () => Record<string, unknown>;
    webview?: unknown;
  };
  if (isHttpOrHttpsUrl(viewObj?.url)) {
    return true;
  }
  const s = typeof viewObj?.getState === "function" ? viewObj.getState() : undefined;
  if (isHttpOrHttpsUrl(s?.url)) {
    return true;
  }
  if (viewObj?.webview) {
    return true;
  }

  // DOM 容器檢查（webview 或外部 iframe）
  const container = extLeaf.containerEl || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl;
  if (container) {
    if (container.querySelector("webview")) {
      return true;
    }
    const iframe = container.querySelector("iframe");
    if (iframe && isHttpOrHttpsUrl(iframe.getAttribute("src") || iframe.src)) {
      return true;
    }
  }

  return false;
}

/**
 * 判斷一個 Popout 視窗是否為 URL 視窗（例如 OpenID / OAuth 登入、網頁檢視等）。
 */
export function isUrlPopoutWindow(win: Window, app?: App): boolean {
  if (!win || win.closed) return false;

  // 1. 跨來源檢查與 window.location 協定檢查：
  // 當 Popout 導向第三方 OpenID / OAuth 服務時，存取 location.href 或 protocol
  // 會拋出 SecurityError，此時 100% 確定為外部 URL 視窗。
  try {
    const protocol = win.location?.protocol;
    if (protocol === "http:" || protocol === "https:") {
      return true;
    }
    const href = win.location?.href;
    if (isHttpOrHttpsUrl(href)) {
      return true;
    }
  } catch {
    // 跨來源安全性異常，表示已導向外部網域（如 OpenID / OAuth 登入頁面）
    return true;
  }

  // 2. 檢查視窗 DOM 是否包含 Electron <webview>
  try {
    const doc = win.document;
    if (doc) {
      const webview = doc.querySelector("webview");
      if (webview) {
        return true;
      }
    }
  } catch {
    // DOM 存取防禦
  }

  // 3. 檢查視窗內的 Leaves 與 Views
  if (app?.workspace && typeof app.workspace.iterateAllLeaves === "function") {
    try {
      let foundUrlView = false;
      let foundNormalDoc = false;

      app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
        const extLeaf = leaf as unknown as ExtendedWorkspaceLeaf;
        const leafWin = getWindowOfLeaf(leaf);
        const leafDoc = extLeaf.containerEl?.ownerDocument || (leaf.view as { containerEl?: HTMLElement } | null)?.containerEl?.ownerDocument;
        if (leafWin ? leafWin !== win : (leafDoc && leafDoc !== win.document)) return;

        const viewState = typeof extLeaf.getViewState === "function" ? extLeaf.getViewState() : undefined;
        const viewType = viewState?.type || (leaf.view as { getViewType?: () => string })?.getViewType?.();

        if (viewType && DOCUMENT_VIEW_TYPES.has(viewType)) {
          foundNormalDoc = true;
          return;
        }

        if (isUrlLeaf(leaf)) {
          foundUrlView = true;
        }
      });

      // 若視窗含有 URL view 且不是一般的筆記文件視窗，判定為 URL popout
      if (foundUrlView && !foundNormalDoc) {
        return true;
      }
    } catch {
      // workspace iteration 防禦
    }
  }

  return false;
}

/**
 * 依據開窗管道與目前設定，判定該視窗的 Window Space 介入策略。
 *
 * @param win 目標視窗
 * @param settings 外掛設定
 * @param app Obsidian 應用實例
 * @param isExplicitSpace 是否為明確指定/還原的 Window Space（管道 A）
 */
export function getWindowPopoutPolicy(
  win: Window,
  settings: WindowSettings,
  app?: App,
  isExplicitSpace?: boolean
): PopoutPolicyMode {
  if (!win || win.closed) return "disabled";

  // 管道 A：由 Window Spaces Switcher / 還原發起的 Space 視窗，永遠完整開啟
  if (isExplicitSpace) {
    return "full";
  }

  // 管道 C：URL / 外部認證 / 網頁檢視彈窗
  if (isUrlPopoutWindow(win, app)) {
    if (settings.urlPopoutPolicy) {
      return settings.urlPopoutPolicy;
    }
    // 舊版相容標記
    if (settings.disableOnUrlPopouts === false) {
      return "full";
    }
    return "disabled";
  }

  // 管道 B：Obsidian 原生檔案/分頁開窗（Move to new window、右鍵開窗、Tab tear-off 等）
  return settings.nativePopoutPolicy ?? "status-bar-only";
}

/**
 * 該視窗是否允許自動注入側邊欄與 Activity Bar（只有 "full" 允許）。
 */
export function canInjectSidebars(
  win: Window,
  settings: WindowSettings,
  app?: App,
  isExplicitSpace?: boolean
): boolean {
  return getWindowPopoutPolicy(win, settings, app, isExplicitSpace) === "full";
}

/**
 * 該視窗是否允許顯示狀態列指示器（"full" 與 "status-bar-only" 均允許，但仍受全域 showLayoutStatusBar 否決）。
 */
export function canInjectStatusBar(
  win: Window,
  settings: WindowSettings,
  app?: App,
  isExplicitSpace?: boolean
): boolean {
  if (settings.showLayoutStatusBar !== true) return false;
  const policy = getWindowPopoutPolicy(win, settings, app, isExplicitSpace);
  return policy === "full" || policy === "status-bar-only";
}

/**
 * 該視窗是否完全禁用 Window Spaces（"disabled" 策略）。
 */
export function isWindowDisabledByPolicy(
  win: Window,
  settings: WindowSettings,
  app?: App,
  isExplicitSpace?: boolean
): boolean {
  return getWindowPopoutPolicy(win, settings, app, isExplicitSpace) === "disabled";
}
