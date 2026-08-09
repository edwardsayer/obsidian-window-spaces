import { App } from "obsidian";
import { PopoutLayoutEngine } from "../shared/popoutLayout";
import { acquirePopoutLayoutEngine } from "../shared/popoutLayoutRegistry";
import {
  SHARED_API_VERSION,
  SHARED_COMPATIBLE_FROM_VERSION,
  SHARED_IMPLEMENTATION_REVISION,
} from "../shared/sharedVersion";
import {
  acquireWorkspaceInterceptor,
  releaseWorkspaceInterceptor,
} from "../shared/workspaceInterceptor";

/**
 * Window Spaces compatibility wrapper for the shared Workspace coordinator.
 * The actual monkey patch is installed once per workspace by the shared
 * coordinator, so Folder Spaces and Window Spaces cannot overwrite each other.
 */
export class WorkspaceInterceptor {
  private readonly app: App;
  private readonly engine: PopoutLayoutEngine;
  private installed = false;

  enabled = true;
  isManagedWindow: ((win: Window) => boolean) | null = null;

  constructor(app: App, engine?: PopoutLayoutEngine) {
    this.app = app;
    this.engine =
      engine ??
      acquirePopoutLayoutEngine({
        id: "window-spaces",
        apiVersion: SHARED_API_VERSION,
        compatibleFrom: SHARED_COMPATIBLE_FROM_VERSION,
        implementationRevision: SHARED_IMPLEMENTATION_REVISION,
        create: () => new PopoutLayoutEngine(app),
      });
  }

  install(): void {
    if (this.installed) return;
    acquireWorkspaceInterceptor(this.app, {
      id: "window-spaces",
      engine: this.engine,
      isEnabled: () => this.enabled,
      isManagedWindow: (win) => this.isManagedWindow?.(win) ?? true,
    });
    this.installed = true;
  }

  uninstall(): void {
    if (!this.installed) return;
    releaseWorkspaceInterceptor("window-spaces");
    this.installed = false;
  }
}
