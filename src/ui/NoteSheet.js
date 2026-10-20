import { COLOR, STAGE } from '../theme.js';
import { settings } from '../state.js';
import { makeText } from './text.js';
import { Button } from './Button.js';
import { card } from './widgets.js';

// A pop-up card for longer text, such as Paati's full instructions on a phone where the step card is small.
// Keyboard focus stays inside it until it closes (Close, Escape, or a tap outside).
export class NoteSheet {
  constructor(scene, { eyebrow = '', title, body, note = '' }) {
    this.scene = scene;
    scene.focus.pushLayer();
    const W = 760;
    const x = (STAGE.width - W) / 2;
    const shade = scene.add.rectangle(STAGE.width / 2, STAGE.height / 2, STAGE.width, STAGE.height, 0x0b0f2a, 0.45).setInteractive();
    shade.on('pointerup', () => this.close());

    const parts = [];
    let y = 0;
    if (eyebrow) {
      parts.push(makeText(scene, x + 44, y, eyebrow, 'b3', { weight: 700, color: 0xb35600 }));
      y += parts[parts.length - 1].height + 6;
    }
    parts.push(makeText(scene, x + 44, y, title, 'h4', { width: W - 88 }));
    y += parts[parts.length - 1].height + 14;
    parts.push(makeText(scene, x + 44, y, body, 's1', { width: W - 88 }));
    y += parts[parts.length - 1].height + 12;
    if (note) {
      parts.push(makeText(scene, x + 44, y, note, 'b3', { width: W - 88, color: COLOR.grey600 }));
      y += parts[parts.length - 1].height + 12;
    }
    const close = new Button(scene, STAGE.width / 2, 0, { label: 'Close', size: 'large', width: 240, dark: false, onClick: () => this.close() });
    const contentH = y + 16 + close.bh;
    const H = contentH + 72;
    const top = Math.max(16, (STAGE.height - H) / 2);
    parts.forEach((p) => (p.y += top + 36));
    close.y = top + 36 + y + 16 + close.bh / 2;
    const panel = card(scene, x, top, W, H, { kolam: true });
    const block = scene.add.zone(STAGE.width / 2, top + H / 2, W, H).setInteractive();

    this.root = scene.add.container(0, 0, [shade, panel, block, ...parts, close]).setDepth(1000);
    this.escape = () => this.close();
    scene.events.on('escape', this.escape);
    if (!settings.reduceMotion) {
      this.root.alpha = 0;
      scene.tweens.add({ targets: this.root, alpha: 1, duration: 160 });
    }
    if (scene.focus.visible) scene.focus.focus(close);
  }

  close() {
    if (!this.root) return;
    this.scene.events.off('escape', this.escape);
    this.root.destroy();
    this.root = null;
    this.scene.focus.popLayer();
  }
}
