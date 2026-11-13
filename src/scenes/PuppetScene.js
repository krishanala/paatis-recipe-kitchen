import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { SERIF, art, sparkle } from '../ui/widgets.js';
import { fontSize, makeText } from '../ui/text.js';
import { PUPPET } from '../content.js';
import { BLEED, COLOR, STAGE, lerpColor, pick } from '../theme.js';
import { settings } from '../state.js';
import { speak } from '../voice.js';

// Shadow puppets: leather figures behind a cloth screen lit by oil lamps. Small holes punched in them let the light
// through, and their clothes are faintly dyed, so the colour glows through the shadow.
const SHADOW = 0x2a160b;
const LIGHT = 0xfff1cc; // the lamp light, through the punched holes
const SCREEN = { mid: 0xffeac0, edge: 0xdc9f52 };
const WOOD = 0x4a1d0c;
const CURTAIN = 0xa3172f;
const CURTAIN_DARK = 0x7a0f22;
const DYE = { maroon: 0x8a1c14, ochre: 0xb8661a, teal: 0x1d6a6a, indigo: 0x24407a, green: 0x2f6a2a, red: 0xb0221e };

// How long each scene stays up, in ms: long enough to read its subtitle, about a minute in all.
const HOLD = { title: 5000, kingdom: 6500, dice: 6500, forest: 6500, home: 8000, ravana: 6500, bridge: 6500, battle: 6000, ayodhya: 9000 };
const CURTAIN_MS = 1200;

// Who each puppet is: its dye, crown, what it holds, and how big it is.
const CAST = {
  yudhishthira: { dye: DYE.ochre, crown: 'tall', hold: 'sceptre' },
  bhima: { dye: DYE.maroon, crown: 'tall', hold: 'mace', size: 1.1 },
  arjuna: { dye: DYE.teal, crown: 'tall', hold: 'bow', quiver: true },
  nakula: { dye: DYE.green, crown: 'low', hold: 'sword', size: 0.92 },
  sahadeva: { dye: DYE.indigo, crown: 'low', hold: 'sword', size: 0.92 },
  draupadi: { dye: DYE.red, sari: true, hold: 'lotus' },
  duryodhana: { dye: DYE.maroon, crown: 'tall', hold: 'mace', size: 1.1, left: true },
  rama: { dye: DYE.indigo, skin: DYE.indigo, crown: 'tall', hold: 'bow', quiver: true },
  lakshmana: { dye: DYE.ochre, crown: 'tall', hold: 'bow', quiver: true, size: 0.95 },
  sita: { dye: DYE.red, sari: true, hold: 'lotus' },
  hanuman: { dye: DYE.ochre, crown: 'low', hold: 'mace', monkey: true, size: 1.02 },
  ravana: { dye: DYE.maroon, crown: 'tall', hold: 'sword', heads: 10, size: 1.15, left: true },
};

// The shadow puppet show (after the chapter 1 quiz), full screen: two stories many families tell at Deepavali, the
// Pandavas coming home and Rama coming home to Ayodhya, both to rows of lamps. Curtains open on a lit cloth screen;
// each scene's puppets come and go with a subtitle on a dark band at the bottom. Skip moves on at any time; at the
// end it becomes Next. With Reduce motion the scenes change without the puppets moving or the lamp light flickering.
export class PuppetScene extends BaseScene {
  constructor() {
    super('Puppet');
  }

  create() {
    this.setStage('ch1');
    this.still = settings.reduceMotion;
    this.cameras.main.setBackgroundColor(WOOD);

    // The theatre fills the screen: a valance of marigolds along the top, the cloth below it, and the subtitle band
    // along its bottom, as tall as the longest subtitle needs.
    const valance = pick(34, 30);
    const S = { x: 20, y: valance, w: STAGE.width - 40, h: STAGE.height - valance - 6 };
    this.S = S;
    const btnW = pick(200, 230);
    const textW = S.w - 80 - btnW - 30;
    const tallest = Math.max(...PUPPET.lines.map((l) => this.measure(l.text, textW)));
    const bandH = tallest + pick(36, 28);
    this.band = { y: S.y + S.h - bandH, h: bandH, textW, btnX: S.x + S.w - 40 - btnW / 2, btnW };
    this.ground = this.band.y - 8;
    this.P = Math.round((this.ground - S.y) * 0.58); // a puppet's height, without its crown

    this.drawTheatre(valance);
    this.cast = [];
    this.timers = [];
    this.index = -1;
    this.openCurtains(() => this.next());
  }

  measure(str, width) {
    const t = makeText(this, 0, 0, str, 'h5', { width, weight: 600 });
    const h = t.height;
    t.destroy();
    return h;
  }

  later(ms, fn) {
    this.timers.push(this.time.delayedCall(ms, fn));
  }

  // ---- the theatre -----------------------------------------------------------------------------------

  drawTheatre(valance) {
    const { x, y, w, h } = this.S;
    // Red drapes at the sides (wider phones show more of them) and the marigold valance across the top.
    const g = this.add.graphics();
    for (const [x0, x1] of [[-BLEED, x + 4], [x + w - 4, STAGE.width + BLEED]]) {
      g.fillStyle(CURTAIN, 1);
      g.fillRect(x0, 0, x1 - x0, STAGE.height);
      g.fillStyle(CURTAIN_DARK, 1);
      for (let fx = x0 + 10; fx < x1; fx += 30) g.fillRect(fx, 0, 9, STAGE.height);
    }
    g.fillStyle(CURTAIN_DARK, 1);
    g.fillRect(-BLEED, 0, STAGE.width + 2 * BLEED, valance);
    g.fillStyle(COLOR.yellow500, 1);
    g.fillRect(-BLEED, valance - 4, STAGE.width + 2 * BLEED, 3);
    for (let fx = -BLEED + 14, i = 0; fx < STAGE.width + BLEED; fx += valance * 0.85, i++) {
      art(this, fx, valance / 2 - 1, i % 2 ? 'marigold-yellow' : 'marigold-orange', valance * 0.92);
    }

    // The cloth, brightest where the lamps behind it are, with a faint weave.
    const screen = this.add.graphics();
    screen.fillStyle(SCREEN.edge, 1);
    screen.fillRect(x, y, w, h);
    for (let i = 28; i >= 1; i--) {
      const k = i / 28;
      screen.fillStyle(lerpColor(SCREEN.mid, SCREEN.edge, k), 1);
      screen.fillEllipse(x + w / 2, y + h * 0.58, w * 1.1 * k, h * 1.6 * k);
    }
    screen.lineStyle(1, 0x8a5a20, 0.05);
    for (let lx = x + 4; lx < x + w; lx += 5) screen.lineBetween(lx, y, lx, y + h);
    const mask = this.make.graphics({}, false);
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(x, y, w, h);
    screen.setMask(mask.createGeometryMask());

    // Everything on the cloth lives in these containers, clipped to it.
    this.stage = this.add.container(x, y);
    this.stage.setMask(mask.createGeometryMask());
    this.flicker = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 1).setAlpha(0);
    this.night = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x1c1030, 1).setAlpha(0);
    // Lit lamps sit above the night, so they glow through it.
    this.front = this.add.container(x, y);
    this.front.setMask(mask.createGeometryMask());
    if (!this.still) {
      this.tweens.add({ targets: this.flicker, alpha: { from: 0, to: 0.07 }, duration: 260, yoyo: true, repeat: -1, repeatDelay: 900, ease: 'Sine.InOut' });
    }

    // The subtitle band, with Skip (then Next) at its right.
    const b = this.band;
    const band = this.add.graphics();
    band.fillStyle(0x140a04, 0.78);
    band.fillRect(x, b.y, w, b.h);
    band.fillStyle(COLOR.yellow500, 1);
    band.fillRect(x, b.y, w, 2);
    this.subtitle = makeText(this, x + 40, b.y + b.h / 2, '', 'h5', { width: b.textW, weight: 600, color: COLOR.white, origin: [0, 0.5] });
    this.skip = new Button(this, b.btnX, b.y + b.h / 2, { label: 'Skip', variant: 'outline', width: b.btnW, dark: true, onClick: () => this.advance() });

    // Red curtains, drawn closed over the cloth; they open to the sides when the show starts.
    this.curtains = [-1, 1].map((side) => {
      const c = this.add.graphics({ x: x + w / 2, y });
      const cw = w / 2 + 6;
      const x0 = side < 0 ? -cw : 0;
      c.fillStyle(CURTAIN, 1);
      c.fillRect(x0, 0, cw, h);
      c.fillStyle(CURTAIN_DARK, 1);
      for (let fx = 14; fx < cw; fx += 40) c.fillRect(x0 + fx, 0, 12, h);
      c.fillStyle(COLOR.yellow500, 1);
      c.fillRect(x0, h - 14, cw, 6);
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
      this.tweens.add({ targets: c, x: c.x + c.side * (this.S.w / 2 + 40), scaleX: 0.3, duration: CURTAIN_MS, ease: 'Cubic.InOut' });
      this.tweens.add({ targets: c, alpha: 0, duration: 400, delay: CURTAIN_MS - 400, onComplete: () => c.setVisible(false) });
    });
    this.later(CURTAIN_MS - 300, onDone);
  }

  // ---- the show --------------------------------------------------------------------------------------

  next() {
    this.index++;
    const line = PUPPET.lines[this.index];
    if (!line) return this.end();
    speak(line.text);
    this.subtitle.setText(line.text);
    if (!this.still) this.tweens.add({ targets: this.subtitle, alpha: { from: 0, to: 1 }, duration: 300 });
    this[line.id]();
    this.later(HOLD[line.id], () => this.next());
  }

  // The show is over: Skip becomes Next.
  end() {
    const focused = this.focus.current === this.skip;
    this.skip.destroy();
    const b = this.band;
    const next = new Button(this, b.btnX, b.y + b.h / 2, { label: 'Next', width: b.btnW, onClick: () => this.advance() });
    if (focused) this.focus.focus(next);
    if (!this.still) this.tweens.add({ targets: next, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  // Swap the puppets on the cloth: the old ones fade away as the new ones arrive.
  setCast(objs, front = []) {
    const old = this.cast;
    this.cast = [...objs, ...front];
    this.stage.add(objs);
    this.front.add(front);
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

  // Night falls on the cloth (the new moon), or lifts.
  setNight(alpha, ms = 1600, delay = 0) {
    if (this.still) return this.night.setAlpha(alpha);
    this.tweens.add({ targets: this.night, alpha, duration: ms, delay });
  }

  // A puppet walks: it moves along, bobbing as the puppeteer steps it forward.
  walk(p, toX, ms) {
    if (this.still) return p.setX(toX);
    this.tweens.add({ targets: p, x: toX, duration: ms, ease: 'Sine.InOut' });
    this.tweens.add({ targets: p, y: p.y - 0.03 * this.P, angle: { from: -3, to: 3 }, duration: 320, yoyo: true, repeat: Math.floor(ms / 640) });
  }

  // A gentle sway while a puppet stands, so it looks held.
  sway(p, i = 0) {
    if (this.still) return;
    this.tweens.add({ targets: p, angle: { from: -2, to: 2 }, duration: 1100 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 120 });
  }

  // Lamps along the ground, lit one by one from `delay` ms (all at once with Reduce motion).
  lamps(n, delay) {
    const { w } = this.S;
    const k = this.P / 300;
    const lit = [];
    for (let i = 0; i < n; i++) {
      const lx = w * 0.04 + (i * w * 0.92) / (n - 1);
      const ly = this.floor - 18 * k;
      const glowC = this.add.circle(lx, ly - 14 * k, 48 * k, COLOR.yellow300, 0.4);
      const lamp = art(this, lx, ly, 'diya', 54 * k);
      lamp.home = lamp.scaleX;
      lit.push(glowC, lamp);
      if (this.still) continue;
      glowC.setAlpha(0);
      lamp.setScale(0);
      this.later(delay + i * 300, () => {
        this.tweens.add({ targets: glowC, alpha: 0.4, duration: 400 });
        this.tweens.add({ targets: lamp, scale: lamp.home, duration: 320, ease: 'Back.Out' });
      });
    }
    return lit;
  }

  // A fraction of the cloth's width, in the stage containers' space.
  at(f) {
    return this.S.w * f;
  }

  // The ground, in the stage containers' space.
  get floor() {
    return this.ground - this.S.y;
  }

  title() {
    const { w } = this.S;
    const t = makeText(this, w / 2, this.floor * 0.36, PUPPET.title, 'h1', { color: SHADOW, weight: 700, origin: 0.5, align: 'center', width: w - 120 })
      .setFontFamily(SERIF)
      .setFontSize(Math.round(fontSize('h1') * 1.15));
    const lamps = [-3, -2, -1, 0, 1, 2, 3].map((k) => this.lampShape(w / 2 + k * this.P * 0.32, this.floor * 0.72));
    this.setCast([t, ...lamps]);
  }

  // The five Pandava brothers and Draupadi, side by side, facing right.
  family(x0, gap) {
    return ['yudhishthira', 'bhima', 'arjuna', 'nakula', 'sahadeva', 'draupadi'].map((k, i) => this.puppet(k, x0 + i * gap));
  }

  kingdom() {
    const palace = this.palace(this.at(0.84), 1);
    const fam = this.family(this.at(0.05), this.P * 0.41);
    fam.forEach((p, i) => this.sway(p, i));
    this.setCast([palace, ...fam]);
  }

  dice() {
    const fam = this.family(this.at(0.04), this.P * 0.34);
    const cousin = this.puppet('duryodhana', this.at(0.88));
    const dice = [0, 1].map((k) => this.die(this.at(0.62) + k * 0.12 * this.P, this.floor * 0.18));
    this.sway(cousin, 2);
    const landX = (k) => this.at(0.6) + k * 0.16 * this.P;
    if (this.still) {
      dice.forEach((d, k) => d.setPosition(landX(k), this.floor - 0.06 * this.P));
    } else {
      // The dice tumble down between them, and the brothers bow their heads.
      dice.forEach((d, k) =>
        this.tweens.add({ targets: d, x: landX(k), y: this.floor - 0.06 * this.P, angle: 540 + k * 90, duration: 1400, delay: 600 + k * 200, ease: 'Bounce.Out' }),
      );
      this.later(2300, () => fam.forEach((p, i) => this.tweens.add({ targets: p, angle: -9, y: p.y + 0.03 * this.P, duration: 700, delay: i * 60, ease: 'Sine.InOut' })));
    }
    this.setCast([...fam, cousin, ...dice]);
  }

  forest() {
    const trees = [0.06, 0.27, 0.5, 0.73, 0.95].map((f, i) => this.tree(this.at(f), 0.9 + (i % 2) * 0.25));
    const moon = this.add.circle(this.at(0.08), this.floor * 0.16, 0.07 * this.P, LIGHT, 0.9);
    const fam = this.family(-0.4 * this.P, this.P * 0.38);
    // Many moons pass as they walk through the forest.
    if (!this.still) this.tweens.add({ targets: moon, x: this.at(0.92), duration: HOLD.forest / 3, repeat: 2 });
    fam.forEach((p, i) => this.walk(p, this.at(0.16) + i * this.P * 0.38, HOLD.forest - 700));
    this.setCast([moon, ...trees, ...fam]);
  }

  home() {
    // The new moon: the cloth goes dark, they walk home, and the lamps come on as the light returns.
    this.setNight(0.5);
    const palace = this.palace(this.at(0.85), 1);
    const fam = this.family(-0.3 * this.P, this.P * 0.38);
    fam.forEach((p, i) => this.walk(p, this.at(0.06) + i * this.P * 0.38, 3600));
    const lit = this.lamps(9, 3400);
    this.setNight(0, 2200, 3600);
    this.setCast([palace, ...fam], lit);
  }

  ravana() {
    this.setNight(0, 300);
    const lanka = this.lanka(this.at(0.86));
    const ravana = this.puppet('ravana', this.at(0.56));
    const sita = this.puppet('sita', this.at(0.3));
    // Ravana leads Sita away towards Lanka.
    this.walk(ravana, this.at(0.68), HOLD.ravana - 1500);
    this.walk(sita, this.at(0.44), HOLD.ravana - 1500);
    this.setCast([lanka, sita, ravana]);
  }

  bridge() {
    const sea = this.sea();
    const stones = this.bridgeStones();
    const lanka = this.lanka(this.at(0.9));
    const walkers = ['rama', 'lakshmana', 'hanuman'].map((k, i) => this.puppet(k, -0.3 * this.P - i * 0.42 * this.P, 0.27 * this.P));
    walkers.forEach((p, i) => this.walk(p, this.at(0.52) - i * this.P * 0.42, HOLD.bridge - 600));
    this.setCast([sea, stones, lanka, ...walkers]);
  }

  battle() {
    const rama = this.puppet('rama', this.at(0.22), 0, { pose: 'draw' });
    const lakshmana = this.puppet('lakshmana', this.at(0.1));
    const hanuman = this.puppet('hanuman', this.at(0.34));
    const ravana = this.puppet('ravana', this.at(0.74));
    const sita = this.puppet('sita', this.at(0.93));
    sita.setAlpha(0.35);
    const arrow = this.arrow(this.at(0.28), this.floor - 0.7 * this.P);
    const objs = [lakshmana, rama, hanuman, ravana, sita, arrow];
    if (this.still) {
      arrow.setVisible(false);
      ravana.setAngle(70).setAlpha(0.3);
      sita.setAlpha(1);
    } else {
      // Rama's arrow flies, Ravana falls back, and Sita steps out, free.
      arrow.setAlpha(0);
      this.later(1300, () => {
        arrow.setAlpha(1);
        this.tweens.add({ targets: arrow, x: this.at(0.7), duration: 750, ease: 'Quad.In', onComplete: () => arrow.setVisible(false) });
      });
      // He falls backwards, away from Rama.
      this.later(2100, () => {
        sparkle(this, this.S.x + this.at(0.72), this.S.y + this.floor - 0.6 * this.P, { radius: 60, count: 14 });
        this.tweens.add({ targets: ravana, angle: 70, alpha: 0.25, y: ravana.y + 0.04 * this.P, duration: 1200, ease: 'Cubic.In' });
      });
      this.later(3000, () => this.tweens.add({ targets: sita, alpha: 1, x: this.at(0.82), duration: 900, ease: 'Sine.Out' }));
    }
    this.setCast(objs);
  }

  ayodhya() {
    this.setNight(0.5);
    const palace = this.palace(this.at(0.86), 1.05);
    const party = ['hanuman', 'lakshmana', 'sita', 'rama'].map((k, i) => this.puppet(k, -0.3 * this.P - i * 0.42 * this.P));
    party.forEach((p, i) => this.walk(p, this.at(0.56) - i * this.P * 0.42, 3600));
    const lit = this.lamps(11, 3000);
    this.setNight(0, 2600, 3200);
    this.later(3000 + 11 * 300, () => sparkle(this, this.S.x + this.S.w / 2, this.S.y + this.floor * 0.45, { radius: this.S.w * 0.4, count: 30 }));
    this.setCast([palace, ...party], lit);
  }

  // ---- puppets and props, drawn as shadows -----------------------------------------------------------

  // A shadow puppet standing at screen x, on the ground (or `lift` above it), facing right (left for Duryodhana and
  // Ravana). Drawn 100 units tall (crown extra), with a profile face, crown, jewellery and clothes picked out by
  // punched holes, dyed panels, and what each one holds.
  puppet(kind, x, lift = 0, { pose } = {}) {
    const c = CAST[kind];
    const k = (this.P / 100) * (c.size ?? 1);
    const s = (v) => v * k;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const g = this.add.graphics();
    const shadow = (a = 0.94) => g.fillStyle(SHADOW, a);
    const holes = (list, r = 0.9) => {
      g.fillStyle(LIGHT, 0.85);
      list.forEach(([hx, hy]) => g.fillCircle(s(hx), s(hy), s(r)));
    };
    const dots = (x0, y0, x1, y1, n, r = 0.8) => holes(Array.from({ length: n }, (_, i) => [x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * i) / (n - 1)]), r);
    const dye = (list, colour = c.dye, a = 0.42) => {
      g.fillStyle(colour, a);
      g.fillPoints(P(list), true);
    };

    // The rod the puppeteer holds, running down off the cloth.
    g.lineStyle(s(1.8), SHADOW, 0.55);
    g.lineBetween(s(0), s(-55), s(-8), s(140));

    // The tail (Hanuman), behind everything: a long curl rising over his back.
    if (c.monkey) {
      g.lineStyle(s(3.2), SHADOW, 0.94);
      g.beginPath();
      g.moveTo(s(-8), s(-42));
      for (let t = 0; t <= 1.001; t += 0.05) {
        const a = Math.PI * 0.9 + t * Math.PI * 1.6;
        g.lineTo(s(-22 + 12 * Math.cos(a) * (1 - t * 0.45)), s(-70 + 26 * Math.sin(a) * (1 - t * 0.4) - t * 22));
      }
      g.strokePath();
    }

    // The back arm, resting.
    g.lineStyle(s(4), SHADOW, 0.94);
    g.lineBetween(s(-3), s(-71), s(-9), s(-58));
    g.lineBetween(s(-9), s(-58), s(-7), s(-47));

    shadow();
    if (c.sari) {
      // A sari to the ground with a patterned border, its end over the shoulder, and hair in a bun with flowers.
      g.fillPoints(P([[-9, -50], [9, -50], [17, 0], [-15, 0]]), true);
      dye([[-9, -50], [9, -50], [17, 0], [-15, 0]]);
      g.fillStyle(LIGHT, 0.5);
      g.fillPoints(P([[-15, -3], [17, -3], [16.6, -1.5], [-14.6, -1.5]]), true);
      dots(-13, -7, 15, -7, 10);
      for (let i = 0; i < 5; i++) dots(-6 + i * 4.5, -46, -9 + i * 6, -10, 6, 0.55);
      shadow();
      g.fillPoints(P([[8, -76], [12, -72], [-11, -32], [-16, -36]]), true);
      dye([[8, -76], [12, -72], [-11, -32], [-16, -36]], c.dye, 0.5);
      dots(9, -73, -13, -35, 8, 0.75);
    } else {
      // A pleated dhoti, legs, anklets and feet.
      g.fillPoints(P([[-9, -49], [10, -49], [13, -12], [-11, -12]]), true);
      dye([[-9, -49], [10, -49], [13, -12], [-11, -12]]);
      g.lineStyle(s(0.6), LIGHT, 0.45);
      for (let i = 0; i < 4; i++) g.lineBetween(s(-5 + i * 5), s(-46), s(-6 + i * 6), s(-14));
      shadow();
      g.fillRect(s(-6), s(-13), s(4), s(12));
      g.fillRect(s(4), s(-13), s(4), s(12));
      g.fillPoints(P([[-7, -2], [-1, -2], [3, 0], [-7, 0]]), true);
      g.fillPoints(P([[3, -2], [9, -2], [13, 0], [3, 0]]), true);
      dots(-6, -4, -2, -4, 3, 0.6);
      dots(4, -4, 8, -4, 3, 0.6);
      // A sash at the waist with a tassel.
      shadow();
      g.fillRect(s(-10), s(-51), s(21), s(4));
      dots(-8, -49, 9, -49, 7, 0.7);
      shadow();
      g.fillPoints(P([[-9, -48], [-6, -48], [-11, -30], [-14, -31]]), true);
    }
    // The body, the neck and the head in profile (a monkey's muzzle for Hanuman).
    shadow();
    const chest = c.monkey ? [[-10, -76], [12, -76], [14, -62], [10, -48], [-10, -48]] : [[-8, -76], [11, -76], [13, -63], [9, -48], [-8, -48]];
    g.fillPoints(P(chest), true);
    if (c.skin) dye(chest, c.skin, 0.38);
    shadow();
    g.fillRect(s(-1), s(-81), s(5), s(6));
    const head = c.monkey
      ? [[-6, -88], [-1, -94], [6, -93], [9, -89], [14, -86], [15, -82], [11, -79], [7, -78], [2, -77], [-4, -79], [-7, -83]]
      : [[-6, -87], [-2, -93], [5, -92], [8, -88], [8, -86], [11, -83], [8.5, -82], [9, -80.5], [7, -78], [2, -77], [-4, -79], [-7, -83]];
    g.fillPoints(P(head), true);
    if (c.skin) dye(head, c.skin, 0.38);
    holes([[5.5, -86]], 0.9); // the eye
    // A necklace with a pendant, and an ear ornament.
    g.fillStyle(LIGHT, 0.85);
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * (0.15 + (i / 6) * 0.7);
      g.fillCircle(s(2 + 7 * Math.cos(a)), s(-74 + 6 * Math.sin(a)), s(0.75));
    }
    g.fillCircle(s(2), s(-66), s(1.3));
    holes([[-1, -82.5]], 1.2);
    shadow();
    g.fillCircle(s(-1), s(-82.5), s(0.6));

    // The crown: a tall tiered one for kings and heroes, a low one otherwise; with the sari, a bun and a small tiara.
    if (c.sari) {
      g.fillCircle(s(-8), s(-87), s(5));
      holes([[-10, -89], [-7, -91], [-11, -86]], 0.9);
      shadow();
      g.fillPoints(P([[-4, -92], [6, -92], [5, -95], [1, -97], [-3, -95]]), true);
      holes([[1, -94]], 0.8);
    } else if (c.crown === 'tall') {
      shadow();
      g.fillRect(s(-6), s(-95), s(15), s(4));
      g.fillPoints(P([[-6, -95], [9, -95], [6, -101], [8, -104], [4, -106], [5, -110], [1.5, -116], [-2, -110], [-1, -106], [-5, -104], [-3, -101]]), true);
      holes([[1.5, -93], [-3, -93], [6, -93], [1.5, -100], [1.5, -106], [1.5, -112]], 0.85);
      // A flared ornament behind the ear.
      shadow();
      g.fillPoints(P([[-6, -92], [-12, -97], [-13, -89], [-7, -86]]), true);
      holes([[-10, -92]], 0.8);
    } else {
      shadow();
      g.fillPoints(P([[-5, -91], [8, -91], [7, -96], [4, -99], [1.5, -97], [-1, -99], [-4, -96]]), true);
      holes([[1.5, -94], [-2, -94], [5, -94]], 0.8);
    }

    // Ravana's ten heads: four more each side and one above, each crowned.
    if (c.heads) {
      for (let i = 1; i <= 4; i++) {
        for (const side of [-1, 1]) {
          const hx = side * i * 9;
          const hy = -84 + i * 2;
          shadow(0.9);
          g.fillCircle(s(hx + 1), s(hy), s(5.6 - i * 0.3));
          g.fillPoints(P([[hx - 3, hy - 4], [hx + 5, hy - 4], [hx + 1, hy - 13 + i]]), true);
          holes([[hx + 2.5, hy - 1], [hx + 1, hy - 7 + i * 0.5]], 0.7);
        }
      }
      shadow(0.9);
      g.fillCircle(s(1), s(-120), s(5));
      g.fillPoints(P([[-3, -124], [5, -124], [1, -132]]), true);
      holes([[2.5, -121]], 0.7);
    }

    // The front arm, and what it holds.
    const draw = pose === 'draw';
    const elbow = draw ? [17, -70] : [15, -61];
    const hand = draw ? [27, -72] : [23, -62];
    g.lineStyle(s(4), SHADOW, 0.94);
    g.lineBetween(s(8), s(-73), s(elbow[0]), s(elbow[1]));
    g.lineBetween(s(elbow[0]), s(elbow[1]), s(hand[0]), s(hand[1]));
    holes([[11.5, -68.5]], 1); // armlet
    dots(hand[0] - 3, hand[1] + 0.5, hand[0] - 1, hand[1] - 0.5, 2, 0.6); // bangles
    shadow();
    g.lineStyle(s(2.2), SHADOW, 0.94);
    const [hx, hy] = hand;
    if (c.hold === 'mace') {
      g.lineBetween(s(hx), s(hy), s(hx + 7), s(hy - 30));
      g.fillCircle(s(hx + 8.5), s(hy - 35), s(6.5));
      g.fillPoints(P([[hx + 7, hy - 41], [hx + 10, hy - 41], [hx + 8.5, hy - 47]]), true);
      holes([[hx + 8.5, hy - 35], [hx + 5.5, hy - 35], [hx + 11.5, hy - 35], [hx + 8.5, hy - 38]], 0.8);
    } else if (c.hold === 'bow') {
      const R = 30;
      const bx = draw ? hx - 2 : hx - 6;
      g.beginPath();
      g.arc(s(bx), s(hy), s(R), -1.1, 1.1);
      g.strokePath();
      g.lineStyle(s(0.6), SHADOW, 0.94);
      const sx = draw ? -12 : 0; // the string pulled back when drawing
      g.lineBetween(s(bx + R * Math.cos(-1.1)), s(hy + R * Math.sin(-1.1)), s(bx + sx), s(hy));
      g.lineBetween(s(bx + sx), s(hy), s(bx + R * Math.cos(1.1)), s(hy + R * Math.sin(1.1)));
      holes([[bx + R, hy]], 0.9);
    } else if (c.hold === 'sword') {
      shadow();
      g.fillPoints(P([[hx - 1, hy + 1], [hx + 2, hy - 1], [hx + 20, hy - 24], [hx + 17, hy - 25]]), true);
      g.fillRect(s(hx - 3), s(hy - 1), s(6), s(2));
    } else if (c.hold === 'sceptre') {
      g.lineBetween(s(hx), s(hy + 12), s(hx), s(hy - 28));
      shadow();
      g.fillPoints(P([[hx - 4, hy - 30], [hx, hy - 36], [hx + 4, hy - 30], [hx, hy - 28]]), true);
      holes([[hx, hy - 31]], 0.8);
    } else if (c.hold === 'lotus') {
      shadow();
      g.fillCircle(s(hx + 2), s(hy - 3), s(3.2));
      g.fillPoints(P([[hx - 1, hy - 4], [hx + 2, hy - 9], [hx + 5, hy - 4]]), true);
      holes([[hx + 2, hy - 3]], 0.7);
    }
    // A quiver of arrows on the back.
    if (c.quiver) {
      shadow();
      g.fillPoints(P([[-10, -76], [-6, -77], [-11, -52], [-15, -53]]), true);
      g.lineStyle(s(0.7), SHADOW, 0.94);
      for (let i = 0; i < 3; i++) g.lineBetween(s(-8 + i), s(-77), s(-5 + i * 2), s(-84));
      holes([[-10, -64], [-11, -58]], 0.7);
    }

    const ct = this.add.container(x, this.floor - lift, [g]);
    if (c.left) ct.setScale(-1, 1);
    return ct;
  }

  // A palace with a temple-like tower, two domes, flags and lit windows. scale 1 is about 1.2 puppets tall.
  palace(x, scale) {
    const k = (this.P / 100) * scale;
    const s = (v) => v * k;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.9);
    g.fillRect(s(-48), s(-40), s(96), s(40));
    g.fillPoints(P([[-26, -40], [26, -40], [20, -64], [-20, -64]]), true);
    g.fillPoints(P([[-20, -64], [20, -64], [15, -86], [-15, -86]]), true);
    g.fillPoints(P([[-15, -86], [15, -86], [9, -104], [-9, -104]]), true);
    g.fillPoints(P([[-9, -104], [9, -104], [4, -114], [-4, -114]]), true);
    g.fillCircle(s(0), s(-118), s(4));
    for (const dx of [-37, 37]) {
      g.beginPath();
      g.arc(s(dx), s(-40), s(12), Math.PI, 0);
      g.closePath();
      g.fillPath();
      g.fillRect(s(dx - 1), s(-60), s(2), s(9));
      g.fillPoints(P([[dx + 1, -60], [dx + 8, -57], [dx + 1, -54]]), true);
    }
    g.fillStyle(LIGHT, 0.75);
    // An arched door, windows, and rows of holes along each tier.
    g.fillRect(s(-6), s(-20), s(12), s(20));
    g.fillCircle(s(0), s(-20), s(6));
    for (const dx of [-36, -24, 24, 36]) g.fillRect(s(dx - 2.5), s(-30), s(5), s(8));
    for (const [y, half] of [[-52, 18], [-75, 14], [-95, 9]]) for (let i = -2; i <= 2; i++) g.fillCircle(s((i * half) / 2.5), s(y), s(1.2));
    return this.add.container(x, this.floor, [g]);
  }

  // Lanka: a palace of many domes on a rock, by the sea.
  lanka(x) {
    const k = this.P / 100;
    const s = (v) => v * k;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.88);
    g.fillPoints(P([[-40, 0], [-34, -14], [-20, -20], [20, -22], [36, -14], [42, 0]]), true);
    g.fillRect(s(-28), s(-52), s(56), s(32));
    for (const [dx, r, h] of [[-20, 9, -52], [0, 13, -52], [20, 9, -52], [-10, 7, -70], [10, 7, -70]]) {
      if (h === -70) g.fillRect(s(dx - 6), s(-70), s(12), s(18));
      g.beginPath();
      g.arc(s(dx), s(h), s(r), Math.PI, 0);
      g.closePath();
      g.fillPath();
      g.fillPoints(P([[dx - 1, h - r], [dx + 1, h - r], [dx, h - r - 7]]), true);
    }
    g.fillStyle(LIGHT, 0.7);
    for (const dx of [-18, -6, 6, 18]) {
      g.fillRect(s(dx - 2.5), s(-44), s(5), s(9));
      g.fillCircle(s(dx), s(-44), s(2.5));
    }
    return this.add.container(x, this.floor, [g]);
  }

  // The sea: rolling waves across the bottom of the cloth.
  sea() {
    const { w } = this.S;
    const k = this.P / 100;
    const g = this.add.graphics();
    const top = this.floor - 30 * k;
    g.fillStyle(SHADOW, 0.55);
    g.fillRect(0, top + 6 * k, w, this.S.h);
    g.lineStyle(2.4 * k, SHADOW, 0.7);
    for (let row = 0; row < 4; row++) {
      const y = top + row * 7 * k;
      for (let x = (row * 9 - 9) * k; x < w + 18 * k; x += 18 * k) {
        g.beginPath();
        g.arc(x, y + 4 * k, 6 * k, Math.PI, Math.PI * 1.9);
        g.strokePath();
      }
    }
    return this.add.container(0, 0, [g]);
  }

  // The bridge of stones across the sea, to Lanka.
  bridgeStones() {
    const { w } = this.S;
    const k = this.P / 100;
    const g = this.add.graphics();
    const y = this.floor - 24 * k;
    for (let x = 0, i = 0; x < w * 0.78; x += 11 * k, i++) {
      g.fillStyle(SHADOW, 0.9);
      g.fillEllipse(x, y, 12 * k, 7 * k);
      g.fillStyle(LIGHT, 0.6);
      g.fillCircle(x - 2 * k + (i % 2) * 3 * k, y - 1 * k, 0.9 * k);
    }
    return this.add.container(0, 0, [g]);
  }

  // Rama's arrow, flying right.
  arrow(x, y) {
    const k = this.P / 100;
    const g = this.add.graphics();
    g.lineStyle(1.6 * k, SHADOW, 0.94);
    g.lineBetween(-22 * k, 0, 18 * k, 0);
    g.fillStyle(SHADOW, 0.94);
    g.fillTriangle(18 * k, -3 * k, 26 * k, 0, 18 * k, 3 * k);
    g.fillTriangle(-22 * k, 0, -27 * k, -4 * k, -24 * k, 0);
    g.fillTriangle(-22 * k, 0, -27 * k, 4 * k, -24 * k, 0);
    return this.add.container(x, y, [g]);
  }

  // A tree held further back from the cloth: a paler shadow (a solid colour, so the leaves don't show rings where
  // they overlap), with a few holes for light through the leaves.
  tree(x, scale) {
    const k = (this.P / 100) * scale;
    const s = (v) => v * k;
    const g = this.add.graphics();
    g.fillStyle(lerpColor(SHADOW, SCREEN.mid, 0.62), 1);
    g.fillPoints([{ x: s(-4), y: 0 }, { x: s(4), y: 0 }, { x: s(3), y: s(-50) }, { x: s(-3), y: s(-50) }], true);
    for (const [cx, cy, r] of [[0, -84, 26], [-21, -66, 19], [21, -66, 19], [-12, -104, 16], [13, -102, 16]]) g.fillCircle(s(cx), s(cy), s(r));
    g.fillStyle(LIGHT, 0.35);
    for (const [cx, cy] of [[-7, -84], [10, -76], [-18, -66], [3, -98], [18, -64]]) g.fillCircle(s(cx), s(cy), s(1.2));
    return this.add.container(x, this.floor, [g]);
  }

  die(x, y) {
    const k = this.P / 100;
    const s = (v) => v * k;
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.94);
    g.fillRoundedRect(s(-7), s(-7), s(14), s(14), s(2.5));
    g.fillStyle(LIGHT, 0.85);
    for (const [px, py] of [[-3.5, -3.5], [3.5, 3.5], [0, 0], [3.5, -3.5], [-3.5, 3.5]]) g.fillCircle(s(px), s(py), s(1.2));
    return this.add.container(x, y, [g]);
  }

  // An unlit lamp's shadow, for the title.
  lampShape(x, y) {
    const k = this.P / 100;
    const s = (v) => v * k;
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.85);
    g.fillPoints([{ x: s(-10), y: s(-4) }, { x: s(10), y: s(-4) }, { x: s(6), y: s(3) }, { x: s(-6), y: s(3) }], true);
    g.fillEllipse(s(0), s(-8), s(4), s(8));
    return this.add.container(x, y, [g]);
  }
}
