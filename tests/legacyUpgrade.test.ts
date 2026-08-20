import { describe, expect, test, vi } from "vitest";
import { PopoutLayoutEngine } from "../src/popout/popoutLayout";
import { PopoutActivityBarManager } from "../src/popout/activityBar";

/**
 * 舊 space 升級測試：legacy space（無 activityBars 設定）首次 turn on
 * activity bar 時，把所有既有頂層欄位視為 content area，只補出新的
 * left/right sidebar；補出的 sidebar 以該側第一個 view 按鈕為預設 view，
 * 無則 New Tab。
 */

interface MockLeaf {
  id: string;
  containerEl: HTMLElement;
  view: { containerEl: HTMLElement };
  getViewState: () => { type: string };
  setViewState?: (s: any) => Promise<void>;
}

interface MockEnv {
  manager: PopoutActivityBarManager;
  engine: PopoutLayoutEngine;
  rootEl: HTMLElement;
  leaves: MockLeaf[];
  createLeafBySplit: ReturnType<typeof vi.fn>;
  topEls: () => HTMLElement[];
  layout: any;
}

function buildEnv(): MockEnv {
  const rootEl = document.createElement("div");
  rootEl.classList.add("workspace-split", "mod-root");
  document.body.appendChild(rootEl);

  const leaves: MockLeaf[] = [];
  const makeLeaf = (id: string, type: string): MockLeaf => {
    const containerEl = document.createElement("div");
    containerEl.classList.add("workspace-leaf");
    const leaf: MockLeaf = {
      id,
      containerEl,
      view: { containerEl },
      getViewState: () => ({ type }),
      setViewState: vi.fn().mockResolvedValue(undefined),
    };
    leaves.push(leaf);
    return leaf;
  };

  const topEls = () =>
    Array.from(rootEl.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.classList.contains("workspace-tabs") || el.classList.contains("workspace-split"))
    );

  const createLeafBySplit = vi.fn((target: unknown, direction: string, before?: boolean) => {
    const leaf = makeLeaf(`new-${leaves.length}`, "empty");
    const colEl = document.createElement("div");
    colEl.classList.add("workspace-tabs");
    colEl.appendChild(leaf.containerEl);
    const targetLeaf = target as MockLeaf;
    let targetCol: HTMLElement | null = null;
    if (targetLeaf && targetLeaf.containerEl) {
      let node: HTMLElement | null = targetLeaf.containerEl;
      while (node && node.parentElement !== rootEl) node = node.parentElement;
      targetCol = node;
    }
    if (before) {
      targetCol ? rootEl.insertBefore(colEl, targetCol) : rootEl.insertBefore(colEl, rootEl.firstChild);
    } else {
      targetCol && targetCol.nextSibling
        ? rootEl.insertBefore(colEl, targetCol.nextSibling)
        : rootEl.appendChild(colEl);
    }
    return leaf;
  });

  const workspace = {
    iterateAllLeaves: (cb: (leaf: MockLeaf) => void) => leaves.forEach((l) => cb(l)),
    createLeafBySplit,
    getMostRecentLeaf: () => leaves[0] ?? null,
    getLeaf: () => makeLeaf("fresh", "empty"),
    revealLeaf: vi.fn().mockResolvedValue(undefined),
    setActiveLeaf: vi.fn(),
  } as any;
  const app = { workspace } as any;
  const engine = new PopoutLayoutEngine(app);

  // 舊 space layout：無 activityBars（legacy）
  const layout: any = { id: "L1", name: "Legacy", workspace: { layout: {} }, activityBars: undefined };

  const manager = new PopoutActivityBarManager(
    {
      app,
      settings: {
        activityBarDefaults: { left: true, right: true },
        activityBars: {
          left: [
            { viewType: "file-explorer", side: "left" },
            { viewType: "search", side: "left" },
          ],
          right: [{ viewType: "bookmarks", side: "right" }],
        },
      },
      saveSettings: vi.fn().mockResolvedValue(undefined),
    } as any,
    engine
  );
  const bars = {
    left: document.createElement("div"),
    right: document.createElement("div"),
    viewButtons: new Map(),
    columnButtons: { left: document.createElement("button"), right: document.createElement("button") },
  } as any;
  (manager as any).barsByWindow.set(window, bars);
  // mock getLayoutForWindow 回傳舊 space layout；阻斷 renderWindow 副作用，
  // 單獨驗證 ensureLayoutColumns 的升級補欄路徑。
  vi.spyOn(manager, "getLayoutForWindow").mockReturnValue(layout);
  vi.spyOn(manager as any, "renderWindow").mockImplementation(() => {});
  vi.spyOn(manager as any, "renderWindowNow").mockImplementation(() => {});

  return { manager, engine, rootEl, leaves, createLeafBySplit, topEls, layout };
}

function addContentColumns(env: MockEnv, types: string[]): HTMLElement[] {
  const cols: HTMLElement[] = [];
  types.forEach((type, i) => {
    const leaf = {
      id: `c${i}`,
      containerEl: document.createElement("div"),
      view: { containerEl: document.createElement("div") },
      getViewState: () => ({ type }),
      setViewState: vi.fn().mockResolvedValue(undefined),
    } as MockLeaf;
    env.leaves.push(leaf);
    const colEl = document.createElement("div");
    colEl.classList.add("workspace-tabs");
    colEl.appendChild(leaf.containerEl);
    env.rootEl.appendChild(colEl);
    cols.push(colEl);
  });
  return cols;
}

describe("legacy space upgrade (first turn-on of activity bar)", () => {
  test("anchors hints as all-content, then fills a NEW left sidebar keeping original columns as content", async () => {
    const env = buildEnv();
    const originalCols = addContentColumns(env, ["markdown", "markdown", "markdown"]);

    // 第一次 turn on left（舊 space：activityBars undefined → 升級起點）
    await (env.manager as any).toggleSideActivityBar(window, "left");
    await (env.manager as any).ensureLayoutColumns(window);

    // 1. 升級錨定：initial* = false（原始欄位全為 content area）
    const hints = env.engine.getSidebarSides(window);
    expect(hints?.originalCount).toBe(3);
    expect(hints?.initialLeft).toBe(false);
    expect(hints?.initialRight).toBe(false);

    // 2. 補出新的 left sidebar → 頂層 4 欄
    const after = env.topEls();
    expect(after).toHaveLength(4);

    // 3. 新欄在最左；原有 3 欄全數保留且位置不變（未被當成 sidebar）
    expect(after[1]).toBe(originalCols[0]);
    expect(after[2]).toBe(originalCols[1]);
    expect(after[3]).toBe(originalCols[2]);
    expect(originalCols[0].classList.contains("mod-left-split")).toBe(false);
    expect(originalCols[0].classList.contains("window-spaces-sidebar-column")).toBe(false);

    // 4. 補出的新 left sidebar 以該側第一個 view 按鈕為預設 view（items[0]）
    const newLeaf = env.leaves.find((l) => l.id.startsWith("new-"));
    expect(newLeaf).toBeDefined();
    expect(newLeaf!.setViewState).toHaveBeenCalledWith(
      expect.objectContaining({ type: "file-explorer" })
    );
  });

  test("turn on LEFT then RIGHT builds two new sidebars outside the original content columns", async () => {
    const env = buildEnv();
    const originalCols = addContentColumns(env, ["markdown", "markdown"]);

    await (env.manager as any).toggleSideActivityBar(window, "left");
    await (env.manager as any).toggleSideActivityBar(window, "right");
    await (env.manager as any).ensureLayoutColumns(window);

    const after = env.topEls();
    expect(after).toHaveLength(4);
    // [S_left, c0, c1, S_right]
    expect(after[1]).toBe(originalCols[0]);
    expect(after[2]).toBe(originalCols[1]);
    expect(originalCols[0].classList.contains("window-spaces-sidebar-column")).toBe(false);
    expect(originalCols[1].classList.contains("window-spaces-sidebar-column")).toBe(false);
  });

  test("clears residual sidebar marks on legacy columns so they stay content (not re-used as sidebar)", async () => {
    const env = buildEnv();
    const originalCols = addContentColumns(env, ["markdown", "markdown", "markdown"]);
    // 模擬舊欄位殘留 sidebar 標記（例如曾 sync 過 / native sidebar 樣式）：
    // 升級時必須把它們清除並視為 content，補出新的 sidebar。
    originalCols[0].classList.add("mod-left-split", "window-spaces-sidebar-column", "mod-sidedock");
    originalCols[2].classList.add("mod-right-split", "window-spaces-sidebar-column", "mod-sidedock");

    await (env.manager as any).toggleSideActivityBar(window, "left");
    await (env.manager as any).toggleSideActivityBar(window, "right");
    await (env.manager as any).ensureLayoutColumns(window);

    const after = env.topEls();
    expect(after).toHaveLength(5);
    // 殘留標記被清除，原欄位維持 content 語意
    expect(originalCols[0].classList.contains("mod-left-split")).toBe(false);
    expect(originalCols[0].classList.contains("window-spaces-sidebar-column")).toBe(false);
    expect(originalCols[2].classList.contains("mod-right-split")).toBe(false);
    // 原有欄位仍保留在原本中間位置 [S_left, c0, c1, c2, S_right]
    expect(after[1]).toBe(originalCols[0]);
    expect(after[2]).toBe(originalCols[1]);
    expect(after[3]).toBe(originalCols[2]);
  });

  test("sidebar default view falls back to New Tab when the side has no view buttons", async () => {
    const env = buildEnv();
    addContentColumns(env, ["markdown"]);
    // 右側 activity bar 無任何 view 按鈕（items 空）
    (env.manager as any).plugin.settings.activityBars.right = [];

    await (env.manager as any).toggleSideActivityBar(window, "right");
    await (env.manager as any).ensureLayoutColumns(window);

    // 補出新的 right sidebar（頂層 2 欄）
    const after = env.topEls();
    expect(after).toHaveLength(2);
    const newLeaf = env.leaves.find((l) => l.id.startsWith("new-"));
    expect(newLeaf).toBeDefined();
    // 無 view 按鈕 → 不設定任何 view（leaf 維持 New Tab/empty）
    expect(newLeaf!.setViewState).not.toHaveBeenCalled();
  });
});
