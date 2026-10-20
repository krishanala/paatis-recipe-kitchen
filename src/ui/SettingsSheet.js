import { BUTTON_HEIGHT, COLOR, MIN_HIT, STAGE } from '../theme.js';
import { settings, saveSettings, resetProgress } from '../state.js';
import { makeText } from './text.js';
import { Button } from './Button.js';
import { silkTrim } from './widgets.js';

const TEXT_SIZES = [
  { label: 'A', value: 1 },
  { label: 'A+', value: 1.15 },
  { label: 'A++', value: 1.3 },
];

// A toggle row: label (and an optional hint) on the left, switch on the right, with On/Off in words so colour
// is not the only signal.
function toggleRow(scene, x, y, w, h, label, key, { hint, onChange } = {}) {
  const sw = scene.add.graphics();
  const state = makeText(scene, w / 2 - 96, 0, '', 'b1', { weight: 600, origin: [1, 0.5] });
  const text = makeText(scene, -w / 2 + 20, 0, label, 's1', { origin: [0, 0.5] });
  const content = [text, state, sw];
  if (hint) {
    const sub = makeText(scene, -w / 2 + 20, 0, hint, 'b3', { color: COLOR.grey600, origin: [0, 0.5] });
    text.y = -sub.height / 2 - 1;
    sub.y = text.height / 2 + 1;
    content.push(sub);
  }
  const draw = () => {
    const on = settings[key];
    sw.clear();
    sw.fillStyle(on ? COLOR.green600 : COLOR.grey300, 1);
    sw.fillRoundedRect(w / 2 - 84, -18, 64, 36, 18);
    sw.fillStyle(COLOR.white, 1);
    sw.fillCircle(on ? w / 2 - 38 : w / 2 - 66, 0, 14);
    state.setText(on ? 'On' : 'Off');
  };
  draw();
  return new Button(scene, x, y, {
    variant: 'bare',
    width: w,
    height: h,
    dark: false,
    content,
    onClick: () => {
      settings[key] = !settings[key];
      saveSettings();
      draw();
      onChange?.();
    },
  });
}

// A label with a small note under it, left-aligned and centred on row y. Returns both texts.
function labelWithNote(scene, x, y, label, note) {
  const a = makeText(scene, x, y, label, 's1', { origin: [0, 1] });
  const b = makeText(scene, x, y + 2, note, 'b3', { color: COLOR.grey600, origin: [0, 0] });
  const shift = (a.height - b.height) / 2;
  a.y += shift;
  b.y += shift;
  return [a, b];
}

// Help and settings, as an Action Sheet from the bottom. Opened from the header's Help button.
// Rows stack by their real height, so the sheet grows on phones where text is larger.
export class SettingsSheet {
  constructor(scene, onClose) {
    this.scene = scene;
    this.onClose = onClose;
    scene.focus.pushLayer();
    const W = 760;
    const x = (STAGE.width - W) / 2;
    const cx = STAGE.width / 2;
    const rowW = W - 80;
    const rowH = Math.max(64, MIN_HIT);
    const parts = [];
    const add = (o) => (parts.push(o), o);

    // Everything is laid out from y = 0, then the whole sheet moves up to sit on the bottom edge.
    const title = add(makeText(scene, x + 40, 40, 'Help & settings', 'h4'));
    add(new Button(scene, x + W - 56, title.y + title.height / 2, { variant: 'icon', icon: 'close', dark: false, onClick: () => this.close() }));
    const howTo = add(
      makeText(scene, x + 40, title.y + title.height + 8, 'Tap to choose. On a keyboard, Tab moves and Enter picks. Every line Paati says is shown as text.', 'b1', {
        width: W - 140,
        color: COLOR.grey600,
      }),
    );
    let y = howTo.y + howTo.height + 12;
    const row = () => {
      const mid = y + rowH / 2;
      y += rowH + 4;
      return mid;
    };

    add(toggleRow(scene, cx, row(), rowW, rowH, 'Sound', 'sound', { onChange: () => scene.events.emit('settings-changed') }));
    add(toggleRow(scene, cx, row(), rowW, rowH, 'Reduce motion', 'reduceMotion', { hint: 'No sparkles or fireworks' }));

    const sizeY = row();
    labelWithNote(scene, x + 60, sizeY, 'Text size', 'Applies from the next screen').forEach(add);
    const sizeButtons = TEXT_SIZES.map((t, i) =>
      add(
        new Button(scene, x + W - 300 + i * 104, sizeY, {
          label: t.label,
          size: 'medium',
          variant: 'outline',
          width: 92,
          dark: false,
          onClick: () => {
            settings.textScale = t.value;
            saveSettings();
            sizeButtons.forEach((b, j) => b.setLook(TEXT_SIZES[j].value === settings.textScale ? 'selected' : 'default'));
          },
        }).setLook(t.value === settings.textScale ? 'selected' : 'default'),
      ),
    );

    const langY = row();
    labelWithNote(scene, x + 60, langY, 'Language', 'More languages after review').forEach(add);
    add(new Button(scene, x + W - 196, langY, { label: 'English  ▾', size: 'medium', variant: 'outline', width: 300, dark: false }).setEnabled(false));

    const buttonsY = y + 12 + BUTTON_HEIGHT.large / 2;
    add(
      new Button(scene, x + 160, buttonsY, {
        label: 'Start over',
        size: 'large',
        variant: 'outline',
        width: 240,
        dark: false,
        onClick: () => {
          resetProgress();
          this.close();
          scene.go('Title');
        },
      }),
    );
    const done = add(new Button(scene, x + W - 160, buttonsY, { label: 'Done', size: 'large', width: 240, dark: false, onClick: () => this.close() }));
    const H = buttonsY + BUTTON_HEIGHT.large / 2 + 24;
    const top = Math.max(8, STAGE.height - H);

    const panel = scene.add.graphics();
    panel.fillStyle(COLOR.white, 1);
    panel.fillRoundedRect(x, 0, W, H + 24, { tl: 24, tr: 24, bl: 0, br: 0 });
    // Stop clicks on the panel from reaching the shade.
    const block = scene.add.zone(cx, H / 2, W, H).setInteractive();
    const trim = silkTrim(scene, 14, COLOR.marigold500, x + 28, W - 56);
    const sheet = scene.add.container(0, top, [panel, block, trim, ...parts]);

    const shade = scene.add.rectangle(cx, STAGE.height / 2, STAGE.width, STAGE.height, 0x0b0f2a, 0.55).setInteractive();
    shade.on('pointerup', () => this.close());
    this.root = scene.add.container(0, 0, [shade, sheet]).setDepth(1000);
    this.escape = () => this.close();
    scene.events.on('escape', this.escape);
    if (!settings.reduceMotion) {
      sheet.y = top + 40;
      this.root.alpha = 0;
      scene.tweens.add({ targets: sheet, y: top, duration: 200, ease: 'Cubic.Out' });
      scene.tweens.add({ targets: this.root, alpha: 1, duration: 200 });
    }
    if (scene.focus.visible) scene.focus.focus(done);
  }

  close() {
    if (!this.root) return;
    this.scene.events.off('escape', this.escape);
    this.root.destroy();
    this.root = null;
    this.scene.focus.popLayer();
    this.onClose?.();
  }
}
