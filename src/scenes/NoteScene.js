import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, bokeh, garland, glow, lampGlow, paati, sparkle } from '../ui/widgets.js';
import { NOTE, PAATI } from '../content.js';
import { COLOR, RES, STAGE, pick } from '../theme.js';
import { progress, settings } from '../state.js';

const INK = '#4a2a14';
const HAND = 'Kalam, "Segoe Print", "Bradley Hand", cursive';
const CORD = 0xb3261e;
const CORD_SHINE = 0xffc654;

// The parchment (art 480×380) on the right of the stage, and the writing area on it.
const SHEET = { x: 860, y: 341, w: 560 };
SHEET.h = (SHEET.w * 380) / 480;
SHEET.top = SHEET.y - SHEET.h / 2;
SHEET.bottom = SHEET.y + SHEET.h / 2;
const WRITE = { x0: 642, x1: 1078, dearY: 150, msgTop: 210, msgBottom: 452 };

// The remembrance note at the end of the game. The day before Deepavali, many families set out the favourite
// foods of loved ones who have passed away. The player writes a note on parchment, rolls it up, ties it with a
// string, and a pigeon carries it away. The note is never saved or sent: it lives only in this screen.
export class NoteScene extends BaseScene {
  constructor() {
    super('Note');
  }

  create() {
    this.setStage('festive');
    this.buttons = [];
    this.fields = [];
    bokeh(this, 22, { seed: 'note' });
    garland(this);

    // Left: Paati with a lit lamp at her feet. Her lines are kept short so the bubble always clears her head.
    const h = pick(400, 330);
    glow(this, 260, 704 - h * 0.62, h * 0.5);
    paati(this, 260, 704, PAATI.welcome, h);
    this.lamp(412, 672, 60);
    this.bubble = new PaatiBubble(this, 40, 116, 520, { avatar: false }).setDepth(15).say(NOTE.intro);

    // Right: the favourite foods set out on a banana leaf between two lamps, until the parchment takes its place.
    this.offering = this.add.container(0, 0, [
      art(this, 860, 410, 'banana-leaf', 460).setAngle(-4),
      art(this, 772, 404, 'muruku-golden', 128),
      art(this, 930, 388, 'muruku-golden', 120),
      art(this, 860, 456, 'muruku-golden', 108),
      ...[[690, 330, 'marigold-orange'], [1010, 316, 'marigold-yellow'], [1040, 486, 'marigold-orange'], [700, 500, 'marigold-yellow']].map(([x, y, k]) => art(this, x, y, k, 30)),
      art(this, 1062, 402, 'rose', 20),
      art(this, 660, 418, 'rose', 20),
      ...this.lamp(590, 520, 76),
      ...this.lamp(1130, 520, 76),
    ]);
    this.actions([{ label: 'Next', onClick: () => this.writePage() }]);

    // DOM text fields sit over the canvas, so they must be removed when the screen closes.
    this.events.once('shutdown', () => this.removeFields());
  }

  // A lit clay lamp with warm light that breathes.
  lamp(x, y, size) {
    const light = lampGlow(this, x, y - size * 0.2, size * 1.15);
    if (!settings.reduceMotion) this.tweens.add({ targets: light, scale: { from: 0.9, to: 1.08 }, alpha: { from: 0.8, to: 1 }, duration: 1300 + (x % 7) * 60, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    return [light, art(this, x, y, 'diya', size)];
  }

  // Fade a set of objects in or out (at once when Reduce motion is on).
  fade(target, show, duration = 300) {
    if (settings.reduceMotion) return target.setAlpha(show ? 1 : 0).setVisible(show);
    target.setVisible(true);
    this.tweens.add({ targets: target, alpha: { from: show ? 0 : 1, to: show ? 1 : 0 }, duration, onComplete: () => target.setVisible(show) });
  }

  // ---- 1 · Write -------------------------------------------------------------------------------

  writePage() {
    this.bubble.say(NOTE.ask);
    this.fade(this.offering, false, 240);
    this.sheet = this.add.container(0, 0).setDepth(5);
    this.fade(this.sheet, true, 360);
    const parchment = art(this, SHEET.x, SHEET.y, 'parchment', SHEET.w);
    const dear = this.hand(WRITE.x0, WRITE.dearY, 'Dear', 30);
    const signoff = this.hand(WRITE.x1, WRITE.msgBottom + 10, NOTE.signoff, 28).setOrigin(1, 0);
    this.sheet.add([parchment, dear, signoff]);
    this.dear = dear;
    this.privacy = this.text(SHEET.x, SHEET.bottom + 8, NOTE.privacy, 'b3', { origin: [0.5, 0], color: COLOR.grey600 });
    this.fade(this.privacy, true, 360);

    const name = this.field('input', { maxLength: 40, placeholder: 'their name', ariaLabel: 'Their name' });
    const message = this.field('textarea', { maxLength: 200, placeholder: 'Write your note here…', ariaLabel: 'Your note' });
    this.nameEl = name;
    this.messageEl = message;
    this.boxes = [
      [name, dear.x + dear.width + 10, WRITE.dearY - 4, WRITE.x1 - (dear.x + dear.width + 10), 50, 28],
      [message, WRITE.x0, WRITE.msgTop, WRITE.x1 - WRITE.x0, WRITE.msgBottom - WRITE.msgTop, pick(26, 30)],
    ];
    this.onView(() => this.placeFields());
    this.onResize = () => requestAnimationFrame(() => this.placeFields());
    window.addEventListener('resize', this.onResize);

    this.actions([
      { label: 'Roll it up', x: 770, width: 320, onClick: () => this.rollUp() },
      { label: 'Skip', x: 1040, width: 200, variant: 'outline', accent: true, onClick: () => this.leave() },
    ]);
    // Keyboard users reach the fields with Tab, before the buttons.
    this.focus.items.unshift(this.proxy(message));
    this.focus.items.unshift(this.proxy(name));
    if (window.matchMedia?.('(pointer: fine)').matches) this.time.delayedCall(250, () => name.isConnected && name.focus());
  }

  // Handwriting on the parchment, in ink.
  hand(x, y, str, size, opts = {}) {
    return this.add.text(x, y, str, { fontFamily: HAND, fontSize: `${size}px`, color: INK, resolution: RES, ...opts });
  }

  field(tag, { maxLength, placeholder, ariaLabel }) {
    const el = document.createElement(tag);
    el.className = 'note-field';
    el.maxLength = maxLength;
    el.placeholder = placeholder;
    el.setAttribute('aria-label', ariaLabel);
    el.autocomplete = 'off';
    el.spellcheck = false;
    if (tag === 'input') el.type = 'text';
    const kb = this.input.keyboard;
    // While typing, Space, Enter and Tab belong to the field, not to the game's buttons.
    el.addEventListener('focus', () => kb.disableGlobalCapture());
    el.addEventListener('blur', () => kb.enableGlobalCapture());
    el.addEventListener('keydown', (e) => this.fieldKey(e, el));
    // Inside #game, so the fields still show in full screen.
    (document.getElementById('game') ?? document.body).appendChild(el);
    this.fields.push(el);
    return el;
  }

  fieldKey(e, el) {
    const isName = el === this.nameEl;
    if (e.key === 'Enter' && isName) {
      e.preventDefault();
      this.messageEl.focus();
    } else if (e.key === 'Escape') {
      el.blur();
    } else if (e.key === 'Tab') {
      // Name → note is the browser's own order; from the note, Tab moves on to the game's buttons.
      if (isName !== e.shiftKey) return;
      e.preventDefault();
      if (isName) return;
      el.blur();
      this.focus.focus(this.buttons[0]);
    }
  }

  // A stand-in for a field in the keyboard focus order: focusing it focuses the field.
  proxy(el) {
    const z = this.add.zone(0, 0, 1, 1);
    z.enabled = true;
    z.setFocused = (on) => {
      if (on && this.focus.visible) el.focus();
    };
    z.keyPress = () => {};
    z.once('destroy', () => this.focus.remove(z));
    this.proxies = [...(this.proxies ?? []), z];
    return z;
  }

  // Line the fields up with the parchment, wherever the canvas is on screen and however large.
  placeFields() {
    const canvas = this.game.canvas;
    if (!canvas || !this.fields.length) return;
    const rect = canvas.getBoundingClientRect();
    const { left } = this.viewBounds();
    const k = rect.height / STAGE.height;
    // Phones zoom into fields with text under 16 px, so never go smaller than that.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    for (const [el, x, y, w, h, font] of this.boxes) {
      Object.assign(el.style, {
        left: `${rect.left + (x - left) * k}px`,
        top: `${rect.top + y * k}px`,
        width: `${w * k}px`,
        height: `${h * k}px`,
        fontSize: `${coarse ? Math.max(16, font * k) : font * k}px`,
      });
      el.dataset.stageFont = String(parseFloat(el.style.fontSize) / k);
    }
  }

  removeFields() {
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    this.onResize = null;
    for (const el of this.fields) {
      el.blur();
      el.remove();
    }
    this.fields = [];
    this.proxies?.forEach((z) => z.destroy());
    this.proxies = [];
    this.input.keyboard?.enableGlobalCapture();
  }

  actions(list) {
    this.buttons.forEach((b) => b.destroy());
    this.buttons = list.map(({ x = SHEET.x, width = 340, ...opts }) => new Button(this, x, 652, { width, ...opts }));
  }

  // ---- 2 · Roll it up ----------------------------------------------------------------------------

  rollUp() {
    const name = this.nameEl.value.trim();
    const message = this.messageEl.value.trim();
    if (!name && !message) {
      this.bubble.say(NOTE.empty, 'info');
      return;
    }
    this.ink(name, message);
    this.removeFields();
    this.privacy.destroy();
    this.actions([]);
    this.bubble.say(NOTE.rolling);

    // The rolled paper: a tube that grows thicker as it travels up the sheet, swallowing the paper below it.
    const roll = art(this, 0, 0, 'scroll-roll', SHEET.w + 16);
    const base = roll.scaleY;
    this.scroll = this.add.container(SHEET.x, SHEET.bottom, [roll]).setDepth(10);
    this.roll = roll;
    const finalY = SHEET.top + (72 * base * 1.1) / 2;
    const mask = this.make.graphics({}, false);
    this.sheet.setMask(mask.createGeometryMask());
    const step = (p) => {
      const edge = SHEET.bottom + (finalY - SHEET.bottom) * p;
      mask.clear();
      mask.fillStyle(0xffffff, 1);
      mask.fillRect(SHEET.x - SHEET.w, SHEET.top - 20, SHEET.w * 2, edge - SHEET.top + 20);
      this.scroll.y = edge;
      roll.scaleY = base * (0.5 + 0.6 * p);
    };
    const rolled = () => {
      this.sheet.destroy();
      mask.destroy();
      this.tiePage();
    };
    if (settings.reduceMotion) {
      step(1);
      this.scroll.y = SHEET.y - 20;
      return rolled();
    }
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1600,
      ease: 'Sine.InOut',
      onUpdate: (tw) => step(tw.getValue()),
      onComplete: () => {
        this.sheet.destroy();
        mask.destroy();
        // The scroll drops down to the middle, ready to be tied.
        this.tweens.add({ targets: this.scroll, y: SHEET.y - 20, duration: 500, ease: 'Back.Out', onComplete: () => this.tiePage() });
      },
    });
  }

  // The words written in the fields go onto the parchment in ink, so they roll up with it.
  ink(name, message) {
    const [nameBox, msgBox] = this.boxes;
    const nameFont = Number(this.nameEl.dataset.stageFont) || nameBox[5];
    if (name) this.sheet.add(this.hand(nameBox[1] + 6, WRITE.dearY + 2, `${name},`, nameFont));
    else this.dear.setText('Dear one,');
    if (!message) return;
    let size = Number(this.messageEl.dataset.stageFont) || msgBox[5];
    const text = this.hand(WRITE.x0 + 10, WRITE.msgTop + 6, message, size, { wordWrap: { width: msgBox[3] - 20 }, lineSpacing: Math.round(size * 0.2) });
    while (text.height > msgBox[4] - 10 && size > 16) {
      size -= 2;
      text.setFontSize(size).setLineSpacing(Math.round(size * 0.2));
    }
    this.sheet.add(text);
  }

  // ---- 3 · Tie it with a string ------------------------------------------------------------------

  tiePage() {
    this.bubble.say(NOTE.tie);
    this.actions([{ label: 'Tie the string', onClick: () => this.tie() }]);
    if (this.focus.visible) this.focus.focus(this.buttons[0]);
  }

  tie() {
    this.actions([]);
    const half = this.roll.displayHeight / 2;
    const cord = this.add.graphics();
    this.scroll.add(cord);
    const V = (x, y) => new Phaser.Math.Vector2(x, y);
    // The cord goes once round the middle of the roll, then into a bow with two loops and two tails.
    const paths = [
      new Phaser.Curves.Line(V(-4, -half - 2), V(4, half + 2)),
      new Phaser.Curves.CubicBezier(V(0, 4), V(-70, -58), V(-84, 26), V(0, 4)),
      new Phaser.Curves.CubicBezier(V(0, 4), V(70, -58), V(84, 26), V(0, 4)),
      new Phaser.Curves.CubicBezier(V(0, 4), V(-12, 34), V(-36, 44), V(-28, half + 46)),
      new Phaser.Curves.CubicBezier(V(0, 4), V(12, 36), V(32, 42), V(24, half + 54)),
    ].map((c) => c.getPoints(40));
    const draw = (t) => {
      cord.clear();
      paths.forEach((pts, i) => {
        // The band first, then the loops, then the tails.
        const start = i === 0 ? 0 : i < 3 ? 0.35 : 0.7;
        const span = i === 0 ? 0.35 : 0.3;
        const k = Phaser.Math.Clamp((t - start) / span, 0, 1);
        if (k <= 0) return;
        const part = pts.slice(0, Math.max(2, Math.round(pts.length * k)));
        cord.lineStyle(7, CORD, 1);
        cord.strokePoints(part, false);
        cord.lineStyle(2, CORD_SHINE, 0.9);
        cord.strokePoints(part, false);
      });
      if (t >= 0.35) {
        cord.fillStyle(CORD, 1);
        cord.fillCircle(0, 4, 9);
      }
    };
    const flower = art(this, 0, 4, 'marigold-orange', 38);
    this.scroll.add(flower);
    const done = () => {
      draw(1);
      this.sendPage();
    };
    if (settings.reduceMotion) return done();
    flower.setScale(0);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1500,
      ease: 'Sine.InOut',
      onUpdate: (tw) => draw(tw.getValue()),
      onComplete: () => {
        this.tweens.add({ targets: flower, scale: 38 / flower.width, duration: 380, ease: 'Back.Out', onComplete: done });
        sparkle(this, this.scroll.x, this.scroll.y, { radius: 70, count: 10, depth: 12 });
      },
    });
  }

  // ---- 4 · The pigeon carries it away ------------------------------------------------------------

  sendPage() {
    this.bubble.say(NOTE.send);
    this.actions([{ label: 'Send it', onClick: () => this.send() }]);
    if (this.focus.visible) this.focus.focus(this.buttons[0]);
  }

  send() {
    this.actions([]);
    if (settings.reduceMotion) {
      this.scroll.destroy();
      return this.sentPage();
    }
    const { left, right } = this.viewBounds();
    const scrollY = 380;
    // The scroll shrinks to a size a pigeon can carry.
    this.tweens.add({ targets: this.scroll, scale: 0.42, y: scrollY, duration: 600, ease: 'Cubic.InOut' });

    const pigeon = this.pigeon(left - 140, 150);
    pigeon.setScale(0.9);
    const feet = 64; // from the pigeon's middle down to where its feet hold the scroll
    this.tweens.add({ targets: pigeon, x: SHEET.x, duration: 1700, ease: 'Sine.Out' });
    this.tweens.add({
      targets: pigeon,
      y: scrollY - feet,
      scale: 1,
      duration: 1700,
      ease: 'Sine.InOut',
      onComplete: () => {
        // Hover, take the scroll in its feet, and fly off over the rooftops.
        this.tweens.add({
          targets: pigeon,
          y: '-=8',
          duration: 260,
          yoyo: true,
          onComplete: () => {
            this.scroll.setPosition(0, feet).setScale(0.42);
            pigeon.addAt(this.scroll, 0);
            pigeon.flap.timeScale = 1.5;
            this.trail(pigeon);
            this.tweens.add({ targets: pigeon, angle: -12, duration: 500, ease: 'Sine.Out' });
            this.tweens.add({ targets: pigeon, x: right + 220, duration: 2000, ease: 'Sine.In' });
            this.tweens.add({
              targets: pigeon,
              y: 40,
              scale: 0.5,
              duration: 2000,
              ease: 'Sine.Out',
              onComplete: () => {
                pigeon.destroy();
                this.sentPage();
              },
            });
          },
        });
      },
    });
  }

  // A grey pigeon facing right, with one wing that flaps from the shoulder.
  pigeon(x, y) {
    const body = art(this, 0, 0, 'pigeon-body', 190);
    const s = body.scaleX * (body.width / 210);
    // The wing art is drawn shoulder-left; mirrored, the shoulder sits at the front of the back and the tip trails.
    const wing = art(this, 21 * s, -6 * s, 'pigeon-wing', 156 * s * 0.75).setFlipX(true).setOrigin(1 - 8 / 156, 18 / 62);
    const bird = this.add.container(x, y, [body, wing]).setDepth(30);
    bird.flap = this.tweens.add({ targets: wing, angle: { from: -10, to: 58 }, duration: 150, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    bird.once('destroy', () => bird.flap.remove());
    return bird;
  }

  // Golden sparkles drift down behind the pigeon as it flies off.
  trail(bird) {
    const colours = [COLOR.yellow300, COLOR.yellow500, COLOR.marigold500];
    const timer = this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        if (!bird.active) return timer.remove();
        const d = this.add.circle(bird.x - 60 * bird.scale, bird.y + 20 * bird.scale, Phaser.Math.Between(2, 5), Phaser.Utils.Array.GetRandom(colours)).setDepth(29);
        this.tweens.add({ targets: d, alpha: 0, scale: 0.3, y: d.y + 24, duration: 800, onComplete: () => d.destroy() });
      },
    });
  }

  // The note is gone; the foods are set out again, with their lamps lit.
  sentPage() {
    this.bubble.say(NOTE.sent);
    this.fade(this.offering, true, 600);
    this.actions([{ label: 'Continue', onClick: () => this.leave() }]);
    if (this.focus.visible) this.focus.focus(this.buttons[0]);
  }

  // Sent or skipped, the note is done; on to the last page (more muruku, or finish).
  leave() {
    progress.noteDone = true;
    this.go('Finale', { mode: 'choice' });
  }
}
