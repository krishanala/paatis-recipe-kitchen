// Keyboard access for every interactive element: Tab / Shift+Tab move focus, Enter or Space activates
// (and holds, for hold-to-pour style buttons). The focus ring only shows after the keyboard is used.
// Overlays push a layer so focus stays inside them until they close.

const ACTIVATE = new Set(['Enter', ' ']);

function isShown(obj) {
  for (let o = obj; o; o = o.parentContainer) {
    if (!o.visible || o.alpha === 0) return false;
  }
  return true;
}

export class FocusManager {
  constructor(scene) {
    this.scene = scene;
    this.layers = [[]];
    this.current = null;
    this.visible = false;
    const kb = scene.input.keyboard;
    kb.addCapture('TAB,SPACE,ENTER');
    const down = (e) => this.onDown(e);
    const up = (e) => this.onUp(e);
    kb.on('keydown', down);
    kb.on('keyup', up);
    scene.input.on('pointerdown', () => this.setVisible(false));
    scene.events.once('shutdown', () => {
      kb.off('keydown', down);
      kb.off('keyup', up);
    });
  }

  get items() {
    return this.layers[this.layers.length - 1];
  }

  add(item) {
    this.items.push(item);
    item.once('destroy', () => this.remove(item));
    return item;
  }

  remove(item) {
    for (const layer of this.layers) {
      const i = layer.indexOf(item);
      if (i !== -1) layer.splice(i, 1);
    }
    if (this.current === item) this.current = null;
  }

  pushLayer() {
    this.blur();
    this.layers.push([]);
  }

  popLayer() {
    this.blur();
    if (this.layers.length > 1) this.layers.pop();
  }

  usable() {
    return this.items.filter((i) => i.active && i.enabled !== false && isShown(i));
  }

  setVisible(v) {
    if (this.visible === v) return;
    this.visible = v;
    this.current?.setFocused(true);
  }

  focus(item) {
    if (this.current && this.current !== item) this.current.setFocused(false);
    this.current = item;
    this.visible = true;
    item.setFocused(true);
  }

  blur() {
    this.current?.setFocused(false);
    this.current = null;
  }

  move(dir) {
    const list = this.usable();
    if (!list.length) return;
    let i = list.indexOf(this.current);
    i = i === -1 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
    this.focus(list[i]);
  }

  onDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      this.move(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      this.scene.events.emit('escape');
    } else if (ACTIVATE.has(e.key) && !e.repeat && this.current && this.usable().includes(this.current)) {
      this.current.keyPress(true);
    }
  }

  onUp(e) {
    if (ACTIVATE.has(e.key) && this.current?.active) this.current.keyPress(false);
  }
}
