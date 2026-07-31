import { ItemView, WorkspaceLeaf } from "obsidian";
import { WindowLayoutsModal } from "../modals/restoreModal";
import { t } from "../i18n";

export const WINDOW_LAYOUTS_VIEW_TYPE = "window-spaces-layouts";

export type WindowLayoutsPanelLocation = "left" | "right" | "tab";

/**
 * Persistent version of the Window Layouts picker.
 *
 * The content is rendered by WindowLayoutsModal so both entry points keep the
 * same restore semantics. Unlike a modal, this view deliberately remains
 * mounted after a layout is restored.
 */
export class WindowLayoutsView extends ItemView {
  private plugin: any;
  private contentController?: WindowLayoutsModal;

  constructor(leaf: WorkspaceLeaf, plugin: any) {
    super(leaf);
    this.plugin = plugin;
    (this as any).navigation = false;
  }

  getViewType(): string {
    return WINDOW_LAYOUTS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return t("common.windowLayouts");
  }

  getIcon(): string {
    return "layout";
  }

  async onOpen(): Promise<void> {
    this.contentController = new WindowLayoutsModal(this.app, this.plugin);
    // The panel header is intentionally location-neutral. Obsidian applies
    // the same native nav-header treatment in editor tabs and sidebars.
    this.contentController.mountInContainer(this.contentEl);
  }

  async onClose(): Promise<void> {
    this.contentController?.unmountFromContainer();
    this.contentController = undefined;
  }
}
