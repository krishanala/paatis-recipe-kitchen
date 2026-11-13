import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, SERIF, art, bokeh, header, sparkle } from '../ui/widgets.js';
import { fontSize, makeText } from '../ui/text.js';
import { PUPPET } from '../content.js';
import { COLOR, lerpColor, pick } from '../theme.js';
import { settings } from '../state.js';

// Shadow puppets: dark leather figures behind a cloth screen lit by oil lamps, with small holes punched in them
// that let the light through.
const SHADOW = 0x2a160b;
const LIGHT = 0xfff1cc; // the lamp light, through the punched holes
const SCREEN = { mid: 0xffe9b8, edge: 0xe0a85a };
const WOOD = 0x5a2410;
const CURTAIN = 0xa3172f;
const CURTAIN_DARK = 0x7a0f22;

// How long each scene stays up, in ms: long enough to read Paati's line, and under a minute in all.
const HOLD = { title: 6000, kingdom: 8000, dice: 8000, forest: 9000, home: 8000, lamps: 10000 };
const CURTAIN_MS = 1200;

// Paati's shadow puppet show (after the chapter 1 quiz): the Pandavas come home from exile on a dark new moon night
// and everyone lights lamps to welcome them. Curtains open on a lit cloth screen; each scene's puppets come and go
// while Paati tells it, line by line, in her bubble. Skip moves on at any time; at the end it becomes Next. With
// Reduce motion the scenes change without the puppets walking or the lamp light flickering.
export class PuppetScene extends BaseScene {
  constructor() {
    super('Puppet');
  }

  create() {
    this.setStage('ch1');
    bokeh(this, 14, { seed: 'puppet', strength: 0.6 });
    header(this, { title: PUPPET.header });
    this.still = settings.reduceMotion;

    // Paati tells it in her bubble along the bottom, as tall as her longest line needs.
    const bubbleW = pick(940, 960);
    const bodyW = bubbleW - 146 - 24;
    const tallest = Math.max(...PUPPET.lines.map((l) => this.measure(l.text, bodyW)));
    const bubbleH = Math.max(96, tallest + 36);
    const bubbleY = 708 - bubbleH;
    this.bubble = new PaatiBubble(this, 24, bubbleY, bubbleW);
    const btnX = 24 + bubbleW + (1256 - 24 - bubbleW) / 2;
    this.btn = { x: btnX, y: bubbleY + bubbleH / 2, width: pick(220, 240) };
    this.skip = new Button(this, this.btn.x, this.btn.y, { label: 'Skip', variant: 'outline', accent: true, width: this.btn.width, onClick: () => this.advance() });

    // The theatre fills the space between the header and the bubble.
    const top = 106;
    const frame = pick(18, 14);
    const valance = pick(30, 26);
    const h = bubbleY - 22 - top - valance - 2 * frame;
    const w = Math.min(780, Math.round(h * 1.9));
    this.S = { x: 640 - w / 2, y: top + valance + frame, w, h };
    this.u = h / 330; // puppets are sized for a 330 px tall screen
    this.drawTheatre(frame, valance);

    this.cast = [];
    this.timers = [];
    this.index = -1;
    this.openCurtains(() => this.next());
  }

  measure(str, width) {
    const t = makeText(this, 0, 0, str, 's1', { width });
    const h = t.height;
    t.destroy();
    return h;
  }

  later(ms, fn) {
    this.timers.push(this.time.delayedCall(ms, fn));
  }

  // ---- the theatre -----------------------------------------------------------------------------------

  drawTheatre(frame, valance) {
    const { x, y, w, h } = this.S;
    const g = this.add.graphics();
    // Wooden frame with a gold line inside, and a maroon valance hung with marigolds.
    g.fillStyle(0x000000, 0.12);
    g.fillRoundedRect(x - frame - 4, y - frame - valance + 6, w + 2 * frame + 8, h + 2 * frame + valance, 18);
    g.fillStyle(WOOD, 1);
    g.fillRoundedRect(x - frame, y - frame - valance, w + 2 * frame, h + 2 * frame + valance, 16);
    g.lineStyle(3, COLOR.yellow500, 1);
    g.strokeRect(x - 5, y - 5, w + 10, h + 10);
    g.fillStyle(CURTAIN_DARK, 1);
    g.fillRect(x - frame + 6, y - frame - valance + 6, w + 2 * frame - 12, valance);
    for (let fx = x - frame + 20, i = 0; fx < x + w + frame - 10; fx += 26, i++) {
      art(this, fx, y - frame - valance + 6 + valance / 2, i % 2 ? 'marigold-yellow' : 'marigold-orange', valance * 0.9);
    }

    // The cloth screen, brightest where the lamps behind it are, with a faint weave.
    const screen = this.add.graphics();
    screen.fillStyle(SCREEN.edge, 1);
    screen.fillRect(x, y, w, h);
    for (let i = 24; i >= 1; i--) {
      const k = i / 24;
      screen.fillStyle(lerpColor(SCREEN.mid, SCREEN.edge, k), 1);
      screen.fillEllipse(x + w / 2, y + h * 0.62, w * 1.15 * k, h * 1.5 * k);
    }
    screen.lineStyle(1, 0x8a5a20, 0.06);
    for (let lx = x + 4; lx < x + w; lx += 5) screen.lineBetween(lx, y, lx, y + h);
    const mask = this.make.graphics({}, false);
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(x, y, w, h);
    screen.setMask(mask.createGeometryMask());

    // Everything on the screen lives in this container, clipped to the cloth.
    this.stage = this.add.container(x, y);
    this.stage.setMask(mask.createGeometryMask());
    // The lamp light flickers a little.
    this.flicker = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 1).setAlpha(0);
    this.night = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x1c1030, 1).setAlpha(0);
    // Lit lamps sit above the night, so they glow through it.
    this.front = this.add.container(x, y);
    this.front.setMask(mask.createGeometryMask());
    if (!this.still) {
      this.tweens.add({ targets: this.flicker, alpha: { from: 0, to: 0.08 }, duration: 260, yoyo: true, repeat: -1, repeatDelay: 900, ease: 'Sine.InOut' });
    }
    // Red curtains, drawn closed; they open to the sides when the show starts.
    this.curtains = [-1, 1].map((side) => {
      const c = this.add.graphics({ x: x + w / 2, y });
      const cw = w / 2 + frame + 4;
      const x0 = side < 0 ? -cw : 0;
      c.fillStyle(CURTAIN, 1);
      c.fillRect(x0, -4, cw, h + 8);
      c.fillStyle(CURTAIN_DARK, 1);
      for (let fx = 12; fx < cw; fx += 34) c.fillRect(x0 + fx, -4, 10, h + 8);
      c.fillStyle(COLOR.yellow500, 1);
      c.fillRect(x0, h - 10, cw, 6);
      c.side = side;
      return c;
    });
  }

  openCurtains(onDone) {
    if (this.still) {
      this.curtains.forEach((c) => c.setVisible(false));
      onDone();
      return;
    }
    this.curtains.forEach((c) => {
      this.tweens.add({ targets: c, x: c.x + c.side * (this.S.w / 2 + 40), scaleX: 0.35, duration: CURTAIN_MS, ease: 'Cubic.InOut' });
      this.tweens.add({ targets: c, alpha: 0, duration: 400, delay: CURTAIN_MS - 400, onComplete: () => c.setVisible(false) });
    });
    this.later(CURTAIN_MS - 300, onDone);
  }

  // ---- the show --------------------------------------------------------------------------------------

  next() {
    this.index++;
    const line = PUPPET.lines[this.index];
    if (!line) return this.end();
    this.bubble.say(line.text);
    this[line.id]();
    this.later(HOLD[line.id], () => this.next());
  }

  // The show is over: Skip becomes Next.
  end() {
    const focused = this.focus.current === this.skip;
    this.skip.destroy();
    const next = new Button(this, this.btn.x, this.btn.y, { label: 'Next', width: this.btn.width, onClick: () => this.advance() });
    if (focused) this.focus.focus(next);
    if (!this.still) this.tweens.add({ targets: next, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  // Swap the puppets on the screen: the old ones fade away as the new ones arrive.
  setCast(objs) {
    const old = this.cast;
    this.cast = objs;
    if (this.still) {
      old.forEach((o) => o.destroy());
      return;
    }
    this.tweens.add({ targets: old, alpha: 0, duration: 400, onComplete: () => old.forEach((o) => o.destroy()) });
    objs.forEach((o) => {
      const a = o.alpha;
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: a, duration: 500, delay: 250 });
    });
  }

  // A puppet walks: it moves along, bobbing as the puppeteer steps it forward.
  walk(p, toX, ms) {
    if (this.still) return p.setX(toX);
    this.tweens.add({ targets: p, x: toX, duration: ms, ease: 'Sine.InOut' });
    this.tweens.add({ targets: p, y: p.y - 6 * this.u, angle: { from: -3, to: 3 }, duration: 320, yoyo: true, repeat: Math.floor(ms / 640) });
  }

  // A gentle sway while a puppet stands, so it looks held.
  sway(p, i = 0) {
    if (this.still) return;
    this.tweens.add({ targets: p, angle: { from: -2, to: 2 }, duration: 1100 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 120 });
  }

  // The five Pandava brothers and Draupadi, side by side, facing right.
  family(x0, gap, ground) {
    const kinds = ['yudhishthira', 'bhima', 'arjuna', 'nakula', 'sahadeva', 'draupadi'];
    return kinds.map((k, i) => this.puppet(k, x0 + i * gap, ground));
  }

  title() {
    const { w, h } = this.S;
    const u = this.u;
    const t = makeText(this, w / 2, h * 0.36, PUPPET.title, 'h2', { color: SHADOW, weight: 700, origin: 0.5, align: 'center', width: w - 60 })
      .setFontFamily(SERIF)
      .setFontSize(Math.round(fontSize('h2') * Math.min(1, u * 1.1)));
    const lamps = [-2, -1, 0, 1, 2].map((k) => this.lampShape(w / 2 + k * 70 * u, h * 0.72));
    this.stage.add([t, ...lamps]);
    this.setCast([t, ...lamps]);
  }

  kingdom() {
    const { w, h } = this.S;
    const u = this.u;
    const ground = h * 0.94;
    const palace = this.palace(w * 0.84, ground, 1);
    const fam = this.family(w * 0.07, 58 * u, ground);
    this.stage.add([palace, ...fam]);
    fam.forEach((p, i) => this.sway(p, i));
    this.setCast([palace, ...fam]);
  }

  dice() {
    const { w, h } = this.S;
    const u = this.u;
    const ground = h * 0.94;
    const fam = this.family(w * 0.05, 54 * u, ground);
    const cousin = this.puppet('duryodhana', w * 0.88, ground);
    const dice = [0, 1].map((k) => this.die(w * 0.6 + k * 30 * u, h * 0.2));
    this.stage.add([...fam, cousin, ...dice]);
    this.sway(cousin, 2);
    if (this.still) {
      dice.forEach((d, k) => d.setPosition(w * 0.52 + k * 40 * u, ground - 14 * u));
    } else {
      // The dice tumble down between them, and the brothers bow their heads.
      dice.forEach((d, k) =>
        this.tweens.add({ targets: d, x: w * 0.52 + k * 40 * u, y: ground - 14 * u, angle: 540 + k * 90, duration: 1400, delay: 700 + k * 200, ease: 'Bounce.Out' }),
      );
      this.later(2400, () => fam.forEach((p, i) => this.tweens.add({ targets: p, angle: -10, y: p.y + 6 * u, duration: 700, delay: i * 60, ease: 'Sine.InOut' })));
    }
    this.setCast([...fam, cousin, ...dice]);
  }

  forest() {
    const { w, h } = this.S;
    const u = this.u;
    const ground = h * 0.94;
    const trees = [0.08, 0.3, 0.55, 0.78, 0.97].map((k, i) => this.tree(w * k, ground, 0.8 + (i % 2) * 0.25));
    const moon = this.add.circle(w * 0.1, h * 0.2, 16 * u, LIGHT, 0.9);
    const fam = this.family(-60 * u, 46 * u, ground);
    this.stage.add([moon, ...trees, ...fam]);
    // Many moons pass as they walk through the forest.
    if (!this.still) this.tweens.add({ targets: moon, x: w * 0.9, duration: HOLD.forest / 3, repeat: 2 });
    fam.forEach((p, i) => this.walk(p, w * 0.22 + i * 46 * u, HOLD.forest - 800));
    this.setCast([moon, ...trees, ...fam]);
  }

  home() {
    const { w, h } = this.S;
    const u = this.u;
    const ground = h * 0.94;
    // The new moon: the screen goes dark.
    if (this.still) this.night.setAlpha(0.5);
    else this.tweens.add({ targets: this.night, alpha: 0.5, duration: 1600 });
    const palace = this.palace(w * 0.84, ground, 1);
    const fam = this.family(-40 * u, 52 * u, ground);
    this.stage.add([palace, ...fam]);
    fam.forEach((p, i) => this.walk(p, w * 0.12 + i * 52 * u, HOLD.home - 1200));
    this.setCast([palace, ...fam]);
  }

  lamps() {
    const { w, h } = this.S;
    const u = this.u;
    const ground = h * 0.94;
    const palace = this.palace(w * 0.84, ground, 1);
    const fam = this.family(w * 0.12, 52 * u, ground);
    fam.forEach((p, i) => this.sway(p, i));
    // Rows of lamps light up one by one, and the light comes back.
    const lit = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const lx = w * 0.05 + (i * w * 0.9) / (n - 1);
      const glowC = this.add.circle(lx, ground - 30 * u, 46 * u, COLOR.yellow300, 0.4);
      const lamp = art(this, lx, ground - 16 * u, 'diya', 46 * u);
      lamp.home = lamp.scaleX;
      lit.push(glowC, lamp);
    }
    this.stage.add([palace, ...fam]);
    this.front.add(lit);
    this.setCast([palace, ...fam, ...lit]);
    if (this.still) {
      this.night.setAlpha(0);
      return;
    }
    lit.forEach((o) => o.setVisible(false));
    for (let i = 0; i < n; i++) {
      this.later(500 + i * 380, () => {
        lit[i * 2].setVisible(true).setAlpha(0);
        lit[i * 2 + 1].setVisible(true).setScale(0);
        this.tweens.add({ targets: lit[i * 2], alpha: 0.4, duration: 400 });
        this.tweens.add({ targets: lit[i * 2 + 1], scale: lit[i * 2 + 1].home, duration: 320, ease: 'Back.Out' });
      });
    }
    this.tweens.add({ targets: this.night, alpha: 0, duration: 2600, delay: 600 });
    this.later(500 + n * 380, () => sparkle(this, this.S.x + w / 2, this.S.y + h * 0.5, { radius: w * 0.4, count: 26 }));
  }

  // ---- puppets and props, drawn as shadows -----------------------------------------------------------

  // A shadow puppet standing with its feet at (x, ground) in screen space, facing right (or left for the cousin).
  puppet(kind, x, ground) {
    const u = this.u * 1.45; // 100 units ≈ the puppet's height
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.92);
    const queen = kind === 'draupadi';
    const big = kind === 'bhima' || kind === 'duryodhana' ? 1.12 : kind === 'nakula' || kind === 'sahadeva' ? 0.92 : 1;
    const s = (v) => v * u * big;
    // The rod the puppeteer holds, running down off the screen.
    g.lineStyle(s(2), SHADOW, 0.6);
    g.lineBetween(s(0), s(-60), s(-6), s(90));
    // Head, neck and body.
    g.fillCircle(s(2), s(-84), s(7));
    g.fillRect(s(-1), s(-79), s(5), s(5));
    g.fillPoints(pts(s, [[-8, -76], [11, -76], [9, -50], [-7, -50]]), true);
    if (queen) {
      // A sari to the ground, its end over the shoulder, and hair in a bun.
      g.fillPoints(pts(s, [[-8, -52], [9, -52], [16, 0], [-14, 0]]), true);
      g.fillPoints(pts(s, [[8, -76], [11, -72], [-10, -36], [-14, -40]]), true);
      g.fillCircle(s(-6), s(-87), s(4.5));
    } else {
      // A dhoti, legs and feet, and a crown.
      g.fillPoints(pts(s, [[-8, -50], [9, -50], [12, -14], [-10, -14]]), true);
      g.fillRect(s(-6), s(-15), s(4), s(15));
      g.fillRect(s(3), s(-15), s(4), s(15));
      g.fillEllipse(s(-3), s(-1), s(9), s(3.5));
      g.fillEllipse(s(7), s(-1), s(9), s(3.5));
      g.fillPoints(pts(s, [[-6, -89], [-5, -98], [-1, -93], [2, -104], [6, -93], [9, -98], [10, -89]]), true);
    }
    // The front arm, holding something that tells the brothers apart.
    const hand = { x: 22, y: -58 };
    g.lineStyle(s(4), SHADOW, 0.92);
    g.lineBetween(s(8), s(-73), s(15), s(-62));
    g.lineBetween(s(15), s(-62), s(hand.x), s(hand.y));
    g.lineStyle(s(2.5), SHADOW, 0.92);
    if (kind === 'bhima' || kind === 'duryodhana') {
      // A mace.
      g.lineBetween(s(hand.x), s(hand.y), s(hand.x + 8), s(hand.y - 28));
      g.fillCircle(s(hand.x + 9), s(hand.y - 32), s(6));
    } else if (kind === 'arjuna') {
      // A bow.
      g.beginPath();
      g.arc(s(hand.x - 4), s(hand.y), s(26), -1.15, 1.15);
      g.strokePath();
      g.lineStyle(s(0.8), SHADOW, 0.92);
      g.lineBetween(s(hand.x - 4 + 26 * Math.cos(-1.15)), s(hand.y + 26 * Math.sin(-1.15)), s(hand.x - 4 + 26 * Math.cos(1.15)), s(hand.y + 26 * Math.sin(1.15)));
    } else if (kind === 'yudhishthira') {
      // A sceptre.
      g.lineBetween(s(hand.x), s(hand.y + 10), s(hand.x), s(hand.y - 26));
      g.fillCircle(s(hand.x), s(hand.y - 28), s(3));
    } else if (kind === 'nakula' || kind === 'sahadeva') {
      // A sword.
      g.fillPoints(pts(s, [[hand.x, hand.y], [hand.x + 3, hand.y - 2], [hand.x + 18, hand.y - 22], [hand.x + 15, hand.y - 23]]), true);
    } else if (queen) {
      // A lotus.
      g.fillCircle(s(hand.x + 2), s(hand.y - 4), s(3.5));
    }
    // Holes punched in the leather let the lamp light through: a necklace, a belt and the crown's jewels.
    g.fillStyle(LIGHT, 0.85);
    for (let i = 0; i < 5; i++) g.fillCircle(s(-4 + i * 3.4), s(-72 + Math.abs(i - 2) * 1.2), s(0.9));
    for (let i = 0; i < 4; i++) g.fillCircle(s(-5 + i * 4.4), s(-48), s(0.9));
    if (!queen) g.fillCircle(s(2), s(-95), s(1.4));
    else for (let i = 0; i < 4; i++) g.fillCircle(s(-6 + i * 5), s(-30 + i * 6), s(1));
    const c = this.add.container(x, ground, [g]);
    if (kind === 'duryodhana') c.setScale(-1, 1);
    return c;
  }

  // A palace with a temple-like tower, two domes and lit windows.
  palace(x, ground, k) {
    const u = this.u * k;
    const s = (v) => v * u;
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.9);
    g.fillRect(s(-80), s(-70), s(160), s(70));
    g.fillPoints(pts(s, [[-40, -70], [40, -70], [30, -110], [-30, -110]]), true);
    g.fillPoints(pts(s, [[-30, -110], [30, -110], [20, -145], [-20, -145]]), true);
    g.fillPoints(pts(s, [[-20, -145], [20, -145], [10, -170], [-10, -170]]), true);
    g.fillCircle(s(0), s(-176), s(6));
    for (const dx of [-62, 62]) {
      g.beginPath();
      g.arc(s(dx), s(-70), s(20), Math.PI, 0);
      g.closePath();
      g.fillPath();
      g.fillRect(s(dx - 1.5), s(-100), s(3), s(12));
    }
    g.fillStyle(LIGHT, 0.75);
    g.fillRect(s(-11), s(-36), s(22), s(36));
    for (const dx of [-60, -36, 36, 60]) g.fillRect(s(dx - 4), s(-54), s(8), s(12));
    for (const dy of [-96, -130]) g.fillRect(s(-4), s(dy), s(8), s(10));
    return this.add.container(x, ground, [g]);
  }

  tree(x, ground, k) {
    const u = this.u * k;
    const s = (v) => v * u;
    const g = this.add.graphics();
    // Paler than the puppets, as cut-outs held further back from the screen are (a solid colour, so the leaves
    // don't show rings where they overlap).
    g.fillStyle(lerpColor(SHADOW, SCREEN.mid, 0.62), 1);
    g.fillPoints(pts(s, [[-6, 0], [6, 0], [4, -70], [-4, -70]]), true);
    for (const [cx, cy, r] of [[0, -120, 38], [-30, -95, 28], [30, -95, 28], [-18, -150, 24], [20, -148, 24]]) g.fillCircle(s(cx), s(cy), s(r));
    g.fillStyle(LIGHT, 0.35);
    for (const [cx, cy] of [[-10, -120], [14, -110], [-26, -96], [4, -140], [26, -92]]) g.fillCircle(s(cx), s(cy), s(1.6));
    return this.add.container(x, ground, [g]);
  }

  die(x, y) {
    const u = this.u;
    const s = (v) => v * u;
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.92);
    g.fillRoundedRect(s(-11), s(-11), s(22), s(22), s(4));
    g.fillStyle(LIGHT, 0.85);
    for (const [px, py] of [[-5, -5], [5, 5], [0, 0], [5, -5], [-5, 5]]) g.fillCircle(s(px), s(py), s(1.8));
    return this.add.container(x, y, [g]);
  }

  // An unlit lamp's shadow, for the title.
  lampShape(x, y) {
    const u = this.u;
    const s = (v) => v * u;
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.85);
    g.fillPoints(pts(s, [[-16, -6], [16, -6], [10, 4], [-10, 4]]), true);
    g.fillEllipse(s(0), s(-12), s(6), s(12));
    return this.add.container(x, y, [g]);
  }
}

const pts = (s, list) => list.map(([x, y]) => ({ x: s(x), y: s(y) }));
