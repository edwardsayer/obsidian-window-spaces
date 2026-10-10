export class Notice {
  constructor(public message: string, public timeout?: number) {}
  setMessage(msg: string) {
    this.message = msg;
  }
  hide() {}
}

// Obsidian 在 Node prototype 上注入的 instanceOf（cross-window instanceof，jsdom 沒有）。
if (typeof Node.prototype.instanceOf !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Node.prototype as unknown as { instanceOf: (type: abstract new (...args: never[]) => unknown) => boolean }).instanceOf =
    function instanceOf(this: Node, type: abstract new (...args: never[]) => unknown) {
      return this instanceof type;
    };
}

// Obsidian 在 runtime 對 HTMLElement prototype 加入的 helper，jsdom 沒有；
// setIconWithCheck 依賴 el.empty()，在此補上以貼近真實環境。
if (typeof HTMLElement.prototype.empty !== "function") {
  HTMLElement.prototype.empty = function empty() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  };
}

// Obsidian 對 Element 注入的建立／class helper（專案程式碼大量使用，jsdom 沒有）。
// 只補上 src 實際使用的子集，行為對齊 Obsidian：
//   createEl(tag, cls|{cls,text,attr,type,value,href})
//   createDiv(cls|o)、createSpan(o)、setText(text)、setAttr(name, value)
function obsidianCreateHelper(tagName: string) {
  return function create(this: HTMLElement, arg?: unknown, opts?: unknown) {
    const el = this.ownerDocument.createElement(tagName) as HTMLElement & {
      value?: string;
      addClass?: (c: string) => void;
    };
    const options = (
      typeof arg === "string" ? { cls: arg, ...(opts as object) } : arg ?? {}
    ) as {
      cls?: string;
      text?: string;
      type?: string;
      value?: string;
      attr?: Record<string, unknown>;
    };
    if (options.cls) (el as unknown as { addClass: (c: string) => void }).addClass(options.cls);
    // 真實 <input> 的 value 預設為空字串（虛擬 DOM 不會自動給，靠這裡補上）
    if (tagName === "input" || tagName === "textarea") el.value = "";
    if (options.text !== undefined) el.textContent = options.text;
    if (options.type) el.setAttribute("type", options.type);
    if (options.href) el.setAttribute("href", options.href);
    if (options.value !== undefined) el.value = options.value;
    for (const [name, value] of Object.entries(options.attr ?? {})) {
      el.setAttribute(name, String(value));
    }
    this.appendChild(el);
    return el;
  };
}

if (typeof HTMLElement.prototype.addClass !== "function") {
  HTMLElement.prototype.addClass = function addClass(this: HTMLElement, ...classes: string[]) {
    for (const cls of classes) {
      if (cls) this.classList.add(...cls.split(/\s+/).filter(Boolean));
    }
  };
  HTMLElement.prototype.removeClass = function removeClass(this: HTMLElement, ...classes: string[]) {
    for (const cls of classes) {
      if (cls) this.classList.remove(...cls.split(/\s+/).filter(Boolean));
    }
  };
  HTMLElement.prototype.toggleClass = function toggleClass(
    this: HTMLElement,
    cls: string,
    value?: boolean
  ) {
    this.classList.toggle(cls, value);
  };
  // createEl(tag, ...) 由呼叫端指定 tag；createDiv/createSpan 的 tag 固定。
  (HTMLElement.prototype as unknown as Record<string, unknown>).createEl = function createEl(
    this: HTMLElement,
    tag: string,
    arg?: unknown,
    opts?: unknown
  ) {
    return obsidianCreateHelper(tag).call(this, arg, opts);
  };
  (HTMLElement.prototype as unknown as Record<string, unknown>).createDiv = obsidianCreateHelper("div");
  (HTMLElement.prototype as unknown as Record<string, unknown>).createSpan = obsidianCreateHelper("span");
  HTMLElement.prototype.setText = function setText(this: HTMLElement, text: string) {
    this.textContent = text;
  };
  HTMLElement.prototype.setAttr = function setAttr(this: HTMLElement, name: string, value: unknown) {
    this.setAttribute(name, String(value));
  };
}

// jsdom 沒有 scrollIntoView（實際 Obsidian 有），補上 no-op 以免使用真實元素時踩坑。
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// Obsidian 在 Document 上注入的 createDiv/createEl helper（jsdom 沒有）。
function obsidianDocumentCreateHelper(tagName: string) {
  return function create(this: Document, cls?: string) {
    const el = this.createElement(tagName);
    if (cls) el.className = cls;
    return el;
  };
}
if (typeof (document as unknown as { createDiv?: unknown }).createDiv !== "function") {
  const docExt = document as unknown as { createDiv: unknown; createEl: unknown };
  docExt.createDiv = obsidianDocumentCreateHelper("div");
  docExt.createEl = obsidianDocumentCreateHelper("div");
}

export class WorkspaceLeaf {
  detach() {}
}

/**
 * Obsidian Keymap 的最小可用 mock。
 *
 * 行為依 Obsidian 1.13.7 runtime（`keymap.onKeyEvent` ↔ `Scope.handleKey`）：
 * - 一個 scope 一張表；`handleKey` 依註冊順序找第一個 key 相符的 handler。
 * - handler 回傳非 undefined 就立刻回傳（回傳 false ⇒ keymap 會 preventDefault + stopPropagation）。
 * - 若相符的 handler 明確註冊了 key/modifiers（非 null），回傳 undefined 也代表到此為止。
 * - 最後才往上問 parent scope。
 */
export class Scope {
  private handlers: any[] = [];

  constructor(public parent?: Scope) {}

  register(modifiers: string[] | null, key: string | null, func: any): any {
    const handler = { modifiers, key, func, scope: this };
    this.handlers.push(handler);
    return handler;
  }

  unregister(handler: any): void {
    const idx = this.handlers.indexOf(handler);
    if (idx >= 0) this.handlers.splice(idx, 1);
  }

  /** 測試輔助：目前註冊的鍵（`Shift+Enter` 形式）。 */
  registeredKeys(): string[] {
    return this.handlers.map((h) => [...(h.modifiers ?? []), h.key].join("+"));
  }

  handleKey(event: KeyboardEvent, ctx: { modifiers: string; key: string; vkey: string }): unknown {
    const pressed = modifiersOf(event);
    for (const handler of [...this.handlers]) {
      if (!matches(handler, ctx.key, pressed)) continue;
      const result = handler.func(event, ctx);
      if (result !== undefined) return result;
      if (handler.key !== null || handler.modifiers !== null) return result;
    }
    return this.parent?.handleKey(event, ctx);
  }
}

/** 依 event 推導 Obsidian 形式的修飾鍵清單。 */
function modifiersOf(event: KeyboardEvent): string[] {
  const mods: string[] = [];
  if (event.ctrlKey) mods.push("Ctrl");
  if (event.metaKey) mods.push("Meta");
  if (event.altKey) mods.push("Alt");
  if (event.shiftKey) mods.push("Shift");
  return mods;
}

function matches(handler: any, key: string, pressed: string[]): boolean {
  if (handler.key !== null && handler.key !== key) return false;
  if (handler.modifiers === null) return true;
  return (handler.modifiers as string[]).length === pressed.length && (handler.modifiers as string[]).every((m) => pressed.includes(m));
}

export class TFile {
  path: string = "";
  name: string = "";
}

export function setIcon(el: HTMLElement, iconId: string) {
  el.setAttribute("data-icon", iconId);
}

export function setTooltip(el: HTMLElement, tooltipText: string) {
  el.setAttribute("title", tooltipText);
}

export class Modal {
  /** 測試輔助：記錄建立過的 Modal，方便斷言 host modal 的 scope 綁定。 */
  static instances: Modal[] = [];

  scope = new Scope();
  modalEl = document.createElement("div");
  contentEl = document.createElement("div");
  containerEl = document.createElement("div");
  titleEl = document.createElement("div");
  onOpen?: () => void;
  onClose?: () => void;

  constructor(public app: any) {
    this.containerEl.appendChild(this.modalEl);
    this.modalEl.appendChild(this.contentEl);
    Modal.instances.push(this);
  }

  setTitle(_title: string) { return this; }
  open() {}
  close() {}
}

export class Plugin {
  constructor(public app: any, public manifest: any) {}
}

export class PluginSettingTab {
  constructor(public app: any, public plugin: any) {}
}

export class ItemView {
  constructor(public leaf: any) {}
}

export class FileView extends ItemView {
  file: TFile | null = null;
}

export class Setting {
  constructor(public containerEl: HTMLElement) {}
  setName(name: string) { return this; }
  setDesc(desc: string) { return this; }
  addText(cb: any) { cb({ inputEl: document.createElement("input"), setValue: () => this, onChange: () => this }); return this; }
  addToggle(cb: any) { cb({ setValue: () => this, onChange: () => this }); return this; }
  addButton(cb: any) { cb({ setButtonText: () => this, onClick: () => this }); return this; }
}

export class Menu {
  domEl: HTMLElement = document.createElement("div");

  addItem(cb: any) {
    const item = {
      setTitle: () => item,
      setIcon: () => item,
      setChecked: () => item,
      setDisabled: () => item,
      setWarning: () => item,
      onClick: (fn: any) => { fn(); return item; }
    };
    cb(item);
    return this;
  }
  addSeparator() { return this; }
  showAtPosition(pos: { x: number; y: number }, _doc?: any) {
    this.domEl.style.left = `${pos.x}px`;
    this.domEl.style.top = `${pos.y}px`;
    return this;
  }
  showAtMouseEvent(_evt: any) {
    return this;
  }
}
