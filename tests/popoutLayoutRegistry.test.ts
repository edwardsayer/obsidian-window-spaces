import { afterEach, describe, expect, test } from "vitest";
import { PopoutLayoutEngine } from "../src/shared/popoutLayout";
import {
  acquirePopoutLayoutEngine,
  releasePopoutLayoutEngine,
} from "../src/shared/popoutLayoutRegistry";

function fakeEngine(marker: string): PopoutLayoutEngine {
  return {
    marker,
    getMarker: () => marker,
  } as unknown as PopoutLayoutEngine;
}

describe("Popout layout registry", () => {
  const ids = [
    "test-window",
    "test-folder",
    "test-breaking",
    "test-compatible",
    "test-broad",
    "test-narrow",
  ];

  afterEach(() => {
    ids.forEach((id) => releasePopoutLayoutEngine(id));
  });

  test("returns a stable proxy and upgrades its delegate", () => {
    const stable = acquirePopoutLayoutEngine({
      id: "test-window",
      apiVersion: 1,
      compatibleFrom: 1,
      implementationRevision: "2026-01-01T00:00:00Z",
      create: () => fakeEngine("window-v1"),
    });

    const lowerPriority = acquirePopoutLayoutEngine({
      id: "test-folder",
      apiVersion: 1,
      compatibleFrom: 1,
      implementationRevision: "2025-01-01T00:00:00Z",
      create: () => fakeEngine("folder-v1"),
    });
    expect(lowerPriority).toBe(stable);
    expect((stable as unknown as { marker: string }).marker).toBe("window-v1");
    const getMarker = (stable as unknown as { getMarker: () => string }).getMarker;

    const upgraded = acquirePopoutLayoutEngine({
      id: "test-folder",
      apiVersion: 2,
      compatibleFrom: 1,
      implementationRevision: "2026-02-01T00:00:00Z",
      create: () => fakeEngine("folder-v2"),
    });
    expect(upgraded).toBe(stable);
    expect((stable as unknown as { marker: string }).marker).toBe("folder-v2");
    expect(getMarker()).toBe("folder-v2");

    releasePopoutLayoutEngine("test-folder");
    expect((stable as unknown as { marker: string }).marker).toBe("window-v1");
  });

  test("keeps the first candidate when metadata priority is identical", () => {
    const stable = acquirePopoutLayoutEngine({
      id: "test-window",
      apiVersion: 1,
      compatibleFrom: 1,
      implementationRevision: "2026-04-01T00:00:00Z",
      create: () => fakeEngine("first"),
    });

    acquirePopoutLayoutEngine({
      id: "test-folder",
      apiVersion: 1,
      compatibleFrom: 1,
      implementationRevision: "2026-04-01T00:00:00Z",
      create: () => fakeEngine("second"),
    });

    expect((stable as unknown as { marker: string }).marker).toBe("first");
  });

  test("rejects a breaking upgrade but accepts a backward-compatible one", () => {
    const stable = acquirePopoutLayoutEngine({
      id: "test-window",
      apiVersion: 1,
      compatibleFrom: 1,
      implementationRevision: "2026-01-01T00:00:00Z",
      create: () => fakeEngine("v1"),
    });

    acquirePopoutLayoutEngine({
      id: "test-breaking",
      apiVersion: 2,
      compatibleFrom: 2,
      implementationRevision: "2026-02-01T00:00:00Z",
      create: () => fakeEngine("v2-breaking"),
    });
    expect((stable as unknown as { marker: string }).marker).toBe("v1");

    acquirePopoutLayoutEngine({
      id: "test-compatible",
      apiVersion: 2,
      compatibleFrom: 1,
      implementationRevision: "2026-03-01T00:00:00Z",
      create: () => fakeEngine("v2-compatible"),
    });
    expect((stable as unknown as { marker: string }).marker).toBe("v2-compatible");

    releasePopoutLayoutEngine("test-compatible");
    expect((stable as unknown as { marker: string }).marker).toBe("v1");
  });

  test("prefers the broadest compatible range before revision", () => {
    const stable = acquirePopoutLayoutEngine({
      id: "test-narrow",
      apiVersion: 3,
      compatibleFrom: 2,
      implementationRevision: "2026-02-01T00:00:00Z",
      create: () => fakeEngine("narrow"),
    });
    acquirePopoutLayoutEngine({
      id: "test-broad",
      apiVersion: 3,
      compatibleFrom: 1,
      implementationRevision: "2026-01-01T00:00:00Z",
      create: () => fakeEngine("broad"),
    });

    expect((stable as unknown as { marker: string }).marker).toBe("broad");
  });

  test("openNewPopoutWindow opens a popout, waits for mount, and broadcasts initializers", async () => {
    const popoutWindow = {
      document: {
        body: { classList: { contains: (c: string) => c === "is-popout-window" } },
      },
      focus: vi.fn(),
    } as unknown as Window;
    const leaf: any = {
      containerEl: { ownerDocument: { defaultView: null } },
      setViewState: vi.fn(async () => {
        await Promise.resolve();
        leaf.containerEl.ownerDocument.defaultView = popoutWindow;
      }),
    };
    const initializer = vi.fn();
    const stable = acquirePopoutLayoutEngine({
      id: "test-window",
      apiVersion: 5,
      compatibleFrom: 1,
      implementationRevision: "2026-08-14T17:00:00Z",
      create: () =>
        ({ workspace: { openPopoutLeaf: () => leaf } }) as unknown as PopoutLayoutEngine,
      initializeNewPopoutWindow: initializer,
    });

    const result = await stable.openNewPopoutWindow();

    expect(leaf.setViewState).toHaveBeenCalledWith({ type: "empty" });
    expect(initializer).toHaveBeenCalledWith(popoutWindow);
    expect(result?.win).toBe(popoutWindow);
    expect(popoutWindow.focus).toHaveBeenCalled();
  });

  test("openNewPopoutWindow resolves null when the popout window never mounts", async () => {
    const leaf: any = {
      containerEl: { ownerDocument: { defaultView: null } },
      setViewState: vi.fn(async () => {
        await Promise.resolve();
      }),
    };
    const stable = acquirePopoutLayoutEngine({
      id: "test-window",
      apiVersion: 5,
      compatibleFrom: 1,
      implementationRevision: "2026-08-14T17:00:00Z",
      create: () =>
        ({ workspace: { openPopoutLeaf: () => leaf } }) as unknown as PopoutLayoutEngine,
    });

    const result = await stable.openNewPopoutWindow();
    expect(result).toBeNull();
  });
});
