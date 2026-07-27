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

export class Setting {
  constructor(public containerEl: HTMLElement) {}
  setName(name: string) { return this; }
  setDesc(desc: string) { return this; }
  addText(cb: any) { cb({ inputEl: document.createElement("input"), setValue: () => this, onChange: () => this }); return this; }
  addToggle(cb: any) { cb({ setValue: () => this, onChange: () => this }); return this; }
  addButton(cb: any) { cb({ setButtonText: () => this, onClick: () => this }); return this; }
}

export class Menu {
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
  showAtPosition() { return this; }
}
