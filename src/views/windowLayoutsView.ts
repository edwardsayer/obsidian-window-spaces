import { ItemView, WorkspaceLeaf } from "obsidian";
import { WindowLayoutsModal } from "../modals/restoreModal";
import { t } from "../i18n";
import WindowSpacesPlugin from "../main";
import { ExtendedWorkspace } from "../types";

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
  private plugin: WindowSpacesPlugin;
  private contentController?: WindowLayoutsModal;
  navigation = false;

  constructor(leaf: WorkspaceLeaf, plugin: WindowSpacesPlugin) {
    super(leaf);
    this.plugin = plugin;
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
    // The panel is considered active when Obsidian marks its leaf as the
    // active leaf. Clicking the panel (or its tab) and opening it via a
    // command all activate the leaf natively, so arrow-key ownership follows
    // the same rule as every other Obsidian panel.
    this.contentController.mountInContainer(this.contentEl, undefined, () => {
      const ws = this.app.workspace as unknown as ExtendedWorkspace & { getMostRecentLeaf?: () => WorkspaceLeaf | null };
      return ws.getMostRecentLeaf?.() === this.leaf || ws.activeLeaf === this.leaf;
    });
  }

  async onClose(): Promise<void> {
    this.contentController?.unmountFromContainer();
    this.contentController = undefined;
  }
}

