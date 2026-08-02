export class Notice {
  constructor(public message: string, public timeout?: number) {}
  setMessage(msg: string) {
    this.message = msg;
  }
  hide() {}
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
  constructor(public app: any) {}
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
