import { PopoutLayoutEngine } from "./popoutLayout";

/** Fixed cross-bundle key. Both plugins must use this exact namespace. */
export const POPOUT_LAYOUT_REGISTRY_KEY = "__obsidian_popout_layout_registry_v1__";

export interface PopoutLayoutEngineCandidate {
  id: string;
  apiVersion: number;
  compatibleFrom: number;
  implementationRevision: string;
  create: () => PopoutLayoutEngine;
}

interface StoredCandidate extends Omit<PopoutLayoutEngineCandidate, "create"> {
  engine: PopoutLayoutEngine;
}

interface PopoutLayoutRegistryState {
  candidates: Map<string, StoredCandidate>;
  activeId: string | null;
  activeEngine: PopoutLayoutEngine | null;
  methodWrappers: Map<PropertyKey, (...args: unknown[]) => unknown>;
  proxy: PopoutLayoutEngine;
}

type GlobalNamespace = typeof globalThis & {
  [POPOUT_LAYOUT_REGISTRY_KEY]?: PopoutLayoutRegistryState;
};

function compareRevisions(left: string, right: string): number {
  return left === right ? 0 : left > right ? 1 : -1;
}

function compareCandidatePriority(left: StoredCandidate, right: StoredCandidate): number {
  // Prefer the newest API, then the implementation that supports the broadest
  // compatible range, and finally the newest implementation revision.
  if (left.apiVersion !== right.apiVersion) {
    return right.apiVersion - left.apiVersion;
  }
  if (left.compatibleFrom !== right.compatibleFrom) {
    return left.compatibleFrom - right.compatibleFrom;
  }
  const revisionOrder = compareRevisions(left.implementationRevision, right.implementationRevision);
  return revisionOrder === 0 ? 0 : -revisionOrder;
}

function compareCandidates(left: StoredCandidate, right: StoredCandidate): number {
  const priorityOrder = compareCandidatePriority(left, right);
  if (priorityOrder !== 0) return priorityOrder;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function supportsApiVersion(candidate: StoredCandidate, apiVersion: number): boolean {
  return candidate.compatibleFrom <= apiVersion && apiVersion <= candidate.apiVersion;
}

/**
 * A candidate may become active only when it can serve every older API version
 * currently registered. Registered candidates represent active consumers: this
 * prevents a v2 implementation with compatibleFrom=2 from replacing the v1
 * implementation that an already-loaded plugin still requires.
 */
function isBackwardCompatibleWithRegisteredConsumers(
  candidate: StoredCandidate,
  candidates: StoredCandidate[]
): boolean {
  return candidates
    .filter((consumer) => consumer.apiVersion < candidate.apiVersion)
    .every((consumer) => supportsApiVersion(candidate, consumer.apiVersion));
}

function selectActiveCandidate(state: PopoutLayoutRegistryState): void {
  // acquirePopoutLayoutEngine validates each candidate's own range. Selection
  // must now evaluate it against the other registered API consumers.
  const candidates = Array.from(state.candidates.values());
  const compatibleCandidates = candidates
    .filter((candidate) => isBackwardCompatibleWithRegisteredConsumers(candidate, candidates))
    .sort(compareCandidates);
  const currentActive = state.activeId ? state.candidates.get(state.activeId) ?? null : null;
  const currentRemainsBest =
    currentActive !== null &&
    compatibleCandidates.some((candidate) => candidate.id === currentActive.id) &&
    compatibleCandidates.every((candidate) => compareCandidatePriority(currentActive, candidate) <= 0);
  const active = currentRemainsBest ? currentActive : compatibleCandidates[0] ?? null;
  state.activeId = active?.id ?? null;
  state.activeEngine = active?.engine ?? null;
}

function createStableProxy(state: PopoutLayoutRegistryState): PopoutLayoutEngine {
  const target = Object.create(null) as PopoutLayoutEngine;

  return new Proxy(target, {
    get(proxyTarget, property, receiver) {
      // Let test instrumentation or an explicitly attached property behave
      // normally without changing the delegate held by the registry.
      if (property in proxyTarget) {
        return Reflect.get(proxyTarget, property, receiver);
      }

      const delegate = state.activeEngine;
      if (!delegate) return undefined;

      const value = Reflect.get(delegate, property, delegate);
      if (typeof value !== "function") return value;

      let wrapper = state.methodWrappers.get(property);
      if (!wrapper) {
        wrapper = (...args: unknown[]) => {
          const current = state.activeEngine;
          if (!current) throw new Error("No active Popout layout engine candidate");
          const currentMethod = Reflect.get(current, property, current);
          if (typeof currentMethod !== "function") {
            throw new Error(`Active Popout layout engine has no method '${String(property)}'`);
          }
          return currentMethod.apply(current, args);
        };
        state.methodWrappers.set(property, wrapper);
      }
      return wrapper;
    },
    has(proxyTarget, property) {
      return property in proxyTarget || Boolean(state.activeEngine && property in state.activeEngine);
    },
    getOwnPropertyDescriptor(proxyTarget, property) {
      const own = Reflect.getOwnPropertyDescriptor(proxyTarget, property);
      if (own) return own;

      const delegate = state.activeEngine;
      if (delegate && property in delegate) {
        return {
          configurable: true,
          enumerable: false,
          writable: true,
          value: Reflect.get(delegate, property, delegate),
        };
      }
      return undefined;
    },
    set(proxyTarget, property, value, receiver) {
      return Reflect.set(proxyTarget, property, value, receiver);
    },
  });
}

function getRegistryState(): PopoutLayoutRegistryState {
  const namespace = globalThis as GlobalNamespace;
  const existing = namespace[POPOUT_LAYOUT_REGISTRY_KEY];
  if (existing) return existing;

  const state = {
    candidates: new Map<string, StoredCandidate>(),
    activeId: null,
    activeEngine: null,
    methodWrappers: new Map<PropertyKey, (...args: unknown[]) => unknown>(),
    proxy: undefined as unknown as PopoutLayoutEngine,
  };
  state.proxy = createStableProxy(state);
  namespace[POPOUT_LAYOUT_REGISTRY_KEY] = state;
  return state;
}

/**
 * Register an implementation candidate and return the cross-bundle stable
 * singleton proxy. A later compatible candidate only changes the proxy's
 * delegate; existing references therefore remain valid after an upgrade.
 */
export function acquirePopoutLayoutEngine(candidate: PopoutLayoutEngineCandidate): PopoutLayoutEngine {
  if (!candidate.id) throw new Error("Popout layout candidate id is required");
  if (!Number.isInteger(candidate.apiVersion) || candidate.apiVersion < 1) {
    throw new Error("Popout layout candidate apiVersion must be a positive integer");
  }
  if (!Number.isInteger(candidate.compatibleFrom) || candidate.compatibleFrom < 1) {
    throw new Error("Popout layout candidate compatibleFrom must be a positive integer");
  }
  if (candidate.compatibleFrom > candidate.apiVersion) {
    throw new Error("Popout layout candidate compatibleFrom cannot exceed apiVersion");
  }
  if (typeof candidate.create !== "function") {
    throw new Error("Popout layout candidate create must be a function");
  }

  const state = getRegistryState();
  const engine = candidate.create();
  if (!engine) throw new Error(`Popout layout candidate '${candidate.id}' returned no engine`);

  state.candidates.set(candidate.id, {
    id: candidate.id,
    apiVersion: candidate.apiVersion,
    compatibleFrom: candidate.compatibleFrom,
    implementationRevision: candidate.implementationRevision,
    engine,
  });
  selectActiveCandidate(state);
  return state.proxy;
}

/** Remove a candidate and fall back to the best remaining implementation. */
export function releasePopoutLayoutEngine(id: string): void {
  const state = getRegistryState();
  state.candidates.delete(id);
  selectActiveCandidate(state);
}
