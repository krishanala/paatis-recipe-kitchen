import { COLOR, RADIUS, BUTTON_HEIGHT, MIN_HIT, css } from '../theme.js';
import { makeText } from './text.js';

// Design-system button with Default, Hover, Focus, Press and Disabled states.
// variant: 'filled' (the one main action, Marigold) | 'outline' | 'clear' | 'icon' | 'bare' (wraps custom content)
// look (outline answers): 'default' | 'selected' | 'correct' | 'setAside'. Never red.
// Pass onHoldStart/onHoldEnd instead of onClick for press-and-hold actions (pour, knead, twist).
export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);
    const {
      label = '',
      size = 'giant',
      variant = 'filled',
      width,
      height,
      dark = scene.dark,
      radius,
      icon,
      content,
      align = 'center',
      inset = 76, // left-aligned labels start this far in from the left edge
      labelColor, // overrides the variant's text colour in every state
      font, // overrides the label's font family
      fills, // filled variant: { base, hover, press } colours instead of the Marigold ones
      onClick,
      onHoldStart,
      onHoldEnd,
    } = opts;
    Object.assign(this, { variant, dark, icon, labelColor, fills, onClick, onHoldStart, onHoldEnd });
    this.bh = height ?? BUTTON_HEIGHT[size] ?? BUTTON_HEIGHT.giant;
    this.bw = width ?? (variant === 'icon' ? this.bh : 280);
    this.br = radius ?? (variant === 'icon' ? this.bh / 2 : RADIUS.button);
    this.enabled = true;
    this.hover = false;
    this.pressed = false;
    this.focused = false;
    this.holding = false;
    this.look = 'default';

    this.ring = scene.add.graphics();
    this.bg = scene.add.graphics();
    this.add([this.ring, this.bg]);
    if (content) this.add(content);
    if (label) {
      const role = size === 'giant' ? 'h5' : size === 'large' ? 's1' : 'b1';
      const left = align === 'left';
      this.label = makeText(scene, left ? -this.bw / 2 + inset : 0, 0, label, role, {
        weight: 600,
        width: this.bw - (left ? inset + 22 : 32),
        align: left ? 'left' : 'center',
        origin: [left ? 0 : 0.5, 0.5],
      });
      if (font) this.label.setFontFamily(font);
      this.add(this.label);
    }
    if (icon) {
      this.iconG = scene.add.graphics();
      this.add(this.iconG);
      if (icon === 'help') {
        this.iconText = makeText(scene, 0, 0, '?', 'h5', { weight: 700, origin: 0.5 });
        this.add(this.iconText);
      }
    }

    // The touch area can be larger than the drawn button (phones), never smaller.
    this.setSize(Math.max(this.bw, MIN_HIT), Math.max(this.bh, MIN_HIT));
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => {
      this.hover = true;
      this.draw();
    });
    this.on('pointerout', () => {
      this.hover = false;
      if (this.pressed) {
        this.pressed = false;
        this.endHold();
      }
      this.draw();
    });
    this.on('pointerdown', () => {
      if (!this.enabled) return;
      this.pressed = true;
      this.draw();
      this.startHold();
    });
    this.on('pointerup', () => {
      if (!this.pressed) return;
      this.pressed = false;
      this.draw();
      if (this.isHold) this.endHold();
      else if (!this.dragMode) this.fire();
    });
    scene.add.existing(this);
    scene.focus?.add(this);
    this.draw();
  }

  get isHold() {
    return Boolean(this.onHoldStart || this.onHoldEnd);
  }

  startHold() {
    if (this.isHold && !this.holding) {
      this.holding = true;
      this.onHoldStart?.(this);
    }
  }

  endHold() {
    if (this.holding) {
      this.holding = false;
      this.onHoldEnd?.(this);
    }
  }

  fire() {
    if (this.enabled) this.onClick?.(this);
  }

  // Called by FocusManager for Enter / Space.
  keyPress(down) {
    if (!this.enabled) return;
    this.pressed = down;
    this.draw();
    if (this.isHold) {
      if (down) this.startHold();
      else this.endHold();
    } else if (!down) {
      this.fire();
    }
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.input) this.input.cursor = on ? 'pointer' : 'default';
    if (!on) {
      this.pressed = false;
      this.endHold();
    }
    this.draw();
    return this;
  }

  setLook(look) {
    this.look = look;
    if (look === 'setAside') this.setEnabled(false);
    else this.draw();
    return this;
  }

  setFocused(f) {
    this.focused = f;
    this.draw();
  }

  setLabel(str) {
    this.label?.setText(str);
    return this;
  }

  colors() {
    const { dark, hover, pressed, look } = this;
    switch (this.variant) {
      case 'filled':
        return {
          fill: pressed ? (this.fills?.press ?? COLOR.marigoldPress) : hover ? (this.fills?.hover ?? COLOR.marigoldHover) : (this.fills?.base ?? COLOR.marigold500),
          fillAlpha: this.enabled ? 1 : 0.35,
          text: COLOR.grey900,
          shadow: this.enabled,
        };
      case 'outline':
        if (dark) {
          if (look === 'correct') return { fill: COLOR.green600, fillAlpha: 0.35, stroke: 0x7fdc95, strokeWidth: 3, text: COLOR.white };
          if (look === 'selected') return { fill: COLOR.white, fillAlpha: 0.14, stroke: COLOR.yellow300, strokeWidth: 3, text: COLOR.white };
          if (look === 'setAside') return { fill: COLOR.white, fillAlpha: 0.03, stroke: COLOR.white, strokeAlpha: 0.2, text: COLOR.white };
          return { fill: COLOR.white, fillAlpha: pressed ? 0.2 : hover ? 0.14 : 0.07, stroke: COLOR.white, strokeAlpha: hover ? 0.9 : 0.55, text: COLOR.white };
        }
        if (look === 'correct') return { fill: 0xe8f6ec, stroke: COLOR.green600, strokeWidth: 3, text: COLOR.grey900 };
        if (look === 'selected') return { fill: COLOR.yellow50, stroke: COLOR.marigold500, strokeWidth: 3, text: COLOR.grey900 };
        if (look === 'setAside') return { fill: COLOR.grey100, stroke: COLOR.grey300, text: COLOR.grey600 };
        return {
          fill: pressed ? 0xeceffe : hover ? 0xf6f7ff : COLOR.white,
          stroke: hover || pressed ? COLOR.primary500 : COLOR.grey300,
          text: COLOR.grey900,
        };
      case 'icon':
        return dark
          ? { fill: COLOR.white, fillAlpha: pressed ? 0.24 : hover ? 0.18 : 0.1, text: COLOR.white }
          : { fill: pressed ? 0xeceffe : hover ? 0xf6f7ff : COLOR.white, stroke: hover ? COLOR.primary500 : COLOR.grey300, text: COLOR.grey900 };
      case 'clear':
        return {
          fill: hover || pressed ? (dark ? COLOR.white : COLOR.primary500) : null,
          fillAlpha: dark ? 0.1 : 0.08,
          text: dark ? COLOR.yellow300 : COLOR.primary700,
        };
      default: // bare
        return { fill: hover || pressed ? (dark ? COLOR.white : COLOR.grey900) : null, fillAlpha: pressed ? 0.12 : 0.06, text: dark ? COLOR.white : COLOR.grey900 };
    }
  }

  draw() {
    const { bw: w, bh: h, br: r } = this;
    const c = this.colors();
    const g = this.bg;
    g.clear();
    if (c.shadow) {
      g.fillStyle(0x000000, 0.16);
      g.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, r);
    }
    if (c.fill != null) {
      g.fillStyle(c.fill, c.fillAlpha ?? 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    }
    if (c.stroke != null) {
      g.lineStyle(c.strokeWidth ?? 2, c.stroke, c.strokeAlpha ?? 1);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    }
    const dim = !this.enabled ? 0.5 : 1;
    this.label?.setColor(css(this.labelColor ?? c.text)).setAlpha(dim);
    this.iconText?.setColor(css(c.text)).setAlpha(dim);
    this.drawIcon(c.text, dim);

    this.ring.clear();
    if (this.focused && this.scene.focus?.visible) {
      this.ring.lineStyle(4, this.dark ? COLOR.yellow300 : COLOR.primary500, 1);
      this.ring.strokeRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, r + 6);
    }
  }

  drawIcon(color, alpha) {
    const g = this.iconG;
    if (!g) return;
    g.clear();
    g.lineStyle(4, color, alpha);
    g.fillStyle(color, alpha);
    switch (this.icon) {
      case 'back':
        g.beginPath();
        g.moveTo(5, -12);
        g.lineTo(-7, 0);
        g.lineTo(5, 12);
        g.strokePath();
        break;
      case 'fullscreen':
      case 'fullscreen-exit': {
        // Four corner brackets, pointing out (enter) or in (exit).
        const s = 12;
        const k = this.icon === 'fullscreen' ? 1 : -1;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const cx = sx * s;
          const cy = sy * s;
          g.beginPath();
          g.moveTo(cx, cy - sy * 7 * k);
          g.lineTo(cx, cy);
          g.lineTo(cx - sx * 7 * k, cy);
          g.strokePath();
        }
        break;
      }
      case 'close':
        g.lineBetween(-10, -10, 10, 10);
        g.lineBetween(10, -10, -10, 10);
        break;
      case 'sound-on':
      case 'sound-off':
        g.fillPoints(
          [
            { x: -15, y: -6 },
            { x: -7, y: -6 },
            { x: 3, y: -14 },
            { x: 3, y: 14 },
            { x: -7, y: 6 },
            { x: -15, y: 6 },
          ],
          true,
        );
        g.lineStyle(3, color, alpha);
        if (this.icon === 'sound-on') {
          g.beginPath();
          g.arc(4, 0, 9, -0.8, 0.8);
          g.strokePath();
          g.beginPath();
          g.arc(4, 0, 15, -0.8, 0.8);
          g.strokePath();
        } else {
          g.lineBetween(8, -7, 18, 7);
          g.lineBetween(18, -7, 8, 7);
        }
        break;
      default:
        break;
    }
  }

  setIcon(icon) {
    this.icon = icon;
    this.draw();
  }
}
