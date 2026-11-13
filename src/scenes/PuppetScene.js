import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { SERIF, art, chip, rocket, sparkle } from '../ui/widgets.js';
import { fontSize, makeText } from '../ui/text.js';
import { PUPPET } from '../content.js';
import { BLEED, COLOR, RES, STAGE, css, pick } from '../theme.js';
import { settings } from '../state.js';
import { Shadow, banyan, broadleaf, distantForest, palm, undergrowth } from '../trees.js';
import { speak } from '../voice.js';

// Shadow puppets: leather figures pressed against a cloth screen, with a row of oil lamps burning behind it. Small
// holes punched in the puppets let the light through, and their clothes are dyed leather, so the colour glows.
const SHADOW = 0x2a160b;
const LIGHT = 0xfff1cc; // the lamp light, through the punched holes
const CLOTH = { mid: 0xf8d9a0, warm: 0xe6ad62, edge: 0xb06428 };
const BACKLIGHT = 0xffdca6; // the lamps behind the cloth
const NIGHT = 0x1c0b05; // the lamps shaded: the cloth goes a deep umber
const FLAME = { outer: 0xffa63a, inner: 0xffe49a, core: 0xfffbea, halo: 0xffa640, pool: 0xff962c };
const WOOD = 0x4a1d0c;
const CURTAIN = 0xa3172f;
const CURTAIN_DARK = 0x7a0f22;
// The dyes as they look with lamp light shining through the leather.
const DYE = { maroon: 0xb8322a, ochre: 0xd88a26, teal: 0x23887e, indigo: 0x3a5cae, green: 0x4c8c2c, red: 0xd2352b, purple: 0x7b3fa0 };

// How long each scene stays up: long enough to read its subtitle at an easy pace (holdFor), and never shorter than
// its own animation needs (these, in ms).
const MIN_HOLD = {
  kingdom: 6000,
  dice: 6500,
  lost: 6000,
  forest: 6500,
  home: 6000,
  reunion: 7000,
  together: 8000,
  exile: 6500,
  hut: 6000,
  ravana: 6500,
  friends: 6500,
  hanuman: 7500,
  bridge: 7000,
  battle: 6000,
  ayodhya: 6000,
  rows: 8500,
  naraka: 6500,
  boon: 6500,
  garuda: 6500,
  fight: 7500,
  wish: 7000,
  dawn: 7000,
  morning: 9500,
};
const holdFor = (line) => Math.max(MIN_HOLD[line.id] ?? 6000, 2000 + line.text.length * 55);
// The puppets on each story's card.
const THUMBS = {
  pandavas: [['yudhishthira', -0.33], ['bhima', -0.11], ['arjuna', 0.11], ['draupadi', 0.33]],
  rama: [['hanuman', -0.3], ['sita', -0.04], ['rama', 0.24]],
  krishna: [['satyabhama', -0.3], ['krishna', -0.05], ['narakasura', 0.3]],
};
const CURTAIN_MS = 1200;
const BAND_DEPTH = 10; // the subtitle band and its button, above the crackers (depth 5) at the end

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
  krishna: { dye: DYE.ochre, skin: DYE.indigo, crown: 'peacock', hold: 'chakra' },
  satyabhama: { dye: DYE.green, sari: true, hold: 'bow' },
  narakasura: { dye: DYE.purple, crown: 'tall', hold: 'trident', fierce: true, size: 1.12, left: true },
  elder: { dye: 0xd8c49a, sari: true, hold: 'plate', left: true },
  vanara: { dye: DYE.ochre, crown: 'none', monkey: true, size: 0.72, left: true },
};

// The shadow puppet show (after the chapter 1 quiz), full screen. Curtains open on a lit cloth screen showing three
// story cards: the Pandavas coming home, Rama coming home to Ayodhya, and Krishna and Satyabhama defeating
// Narakasura. Each story explains who everyone is and why things happen, and ends on a different part of Deepavali.
// A story's puppets come and go scene by scene, with a subtitle on a dark band at the bottom; Skip story goes back to
// the cards. Back at the cards, the watched stories are ticked, and Next (Skip before any story) carries on. With
// Reduce motion the scenes change without the puppets moving or the lamp light flickering.
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
    const lines = [PUPPET.pick, PUPPET.again, ...PUPPET.stories.flatMap((st) => st.lines.map((l) => l.text))];
    const tallest = Math.max(...lines.map((l) => this.measure(l, textW)));
    const bandH = tallest + pick(36, 28);
    this.band = { y: S.y + S.h - bandH, h: bandH, textW, btnX: S.x + S.w - 40 - btnW / 2, btnW };
    this.ground = this.band.y - 8;
    this.P = Math.round((this.ground - S.y) * 0.58); // a puppet's height, without its crown
    this.paintForest();

    // How dark the cloth is (0 day to 1), and the lit parts of the puppets, which dim with it.
    this.light = { night: 0 };
    this.lights = [];
    this.drawTheatre(valance);
    this.cast = [];
    this.timers = [];
    this.watched = new Set();
    this.cards = [];
    // The curtains open on a dim cloth and the story cards; the show's lamps come up once its diyas are lit.
    this.applyNight(0.45);
    this.openCurtains(() => this.showPicker());
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

  clearTimers() {
    this.timers.forEach((t) => t.remove(false));
    this.timers = [];
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

    // The cloth, lit from behind: a row of oil lamps glows through it in bright patches that flicker, and the cloth
    // shows its folds, the seams between its panels and a faint weave.
    const mask = this.make.graphics({}, false);
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(x, y, w, h);
    const clip = (o) => o.setMask(mask.createGeometryMask());
    this.add.image(x, y, this.clothTexture()).setOrigin(0).setDisplaySize(w, h);
    this.backlight = clip(this.add.container(x, y));
    const spots = 5;
    for (let i = 0; i < spots; i++) {
      const spot = this.glow(w * (0.1 + (0.8 * i) / (spots - 1)), h * 0.5, w * 0.42, h * 1.05, BACKLIGHT, 0.36);
      this.backlight.add(spot);
      if (this.still) continue;
      const R = Phaser.Math;
      this.tweens.add({ targets: spot, alpha: { from: 0.3, to: 0.4 }, duration: R.Between(120, 260), yoyo: true, repeat: -1, repeatDelay: R.Between(80, 700), delay: R.Between(0, 600), ease: 'Sine.InOut' });
      this.tweens.add({ targets: spot, scaleX: spot.scaleX * 1.04, scaleY: spot.scaleY * 1.06, duration: R.Between(900, 1600), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    const weave = this.add.graphics();
    weave.lineStyle(1, 0x6a3a10, 0.05);
    for (let lx = x + 4; lx < x + w; lx += 5) weave.lineBetween(lx, y, lx, y + h);
    weave.lineStyle(1, 0x6a3a10, 0.018);
    for (let ly = y + 3; ly < y + h; ly += 5) weave.lineBetween(x, ly, x + w, ly);
    weave.lineStyle(2, 0x6a3a10, 0.1);
    for (const f of [1 / 3, 2 / 3]) weave.lineBetween(x + w * f, y, x + w * f, y + h);

    // Night: the lamps behind the cloth are shaded, so the cloth goes dark (see applyNight).
    this.night = this.add.rectangle(x + w / 2, y + h / 2, w, h, NIGHT, 1).setAlpha(0);
    // Everything on the cloth lives in these containers, clipped to it: the light that lit diyas throw on the cloth
    // (above the night, so it glows through it), the puppets and props, and the diyas in front of them.
    this.pools = clip(this.add.container(x, y));
    this.stage = clip(this.add.container(x, y));
    this.front = clip(this.add.container(x, y));

    // The subtitle band, with its button at the right: Skip or Next by the cards, Skip story during a story.
    const b = this.band;
    const band = this.add.graphics();
    band.fillStyle(0x140a04, 0.78);
    band.fillRect(x, b.y, w, b.h);
    band.fillStyle(COLOR.yellow500, 1);
    band.fillRect(x, b.y, w, 2);
    this.subtitle = makeText(this, x + 40, b.y + b.h / 2, '', 'h5', { width: b.textW, weight: 600, color: COLOR.white, origin: [0, 0.5] });
    // Above the crackers at the end of a story, which go up from behind the band.
    [band, this.subtitle].forEach((o) => o.setDepth(BAND_DEPTH));

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
      return c.setDepth(BAND_DEPTH + 1);
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

  // ---- the story cards ------------------------------------------------------------------------------

  // The cards: the show's title across the top of the cloth, a card for each story, and the theatre's own diyas lit
  // along the bottom. After a story the band says to pick another or carry on, and watched stories are ticked.
  showPicker() {
    this.story = null;
    this.clearTimers();
    this.tweens.killTweensOf(this.light);
    const first = !this.watched.size;
    this.setNight(0, first ? 1600 : 900, first ? 1500 : 0);
    this.say(first ? PUPPET.pick : PUPPET.again);
    const { w } = this.S;
    const title = makeText(this, w / 2, 0, PUPPET.title, 'h2', { color: SHADOW, weight: 700, origin: [0.5, 0], align: 'center' }).setFontFamily(SERIF);
    title.setY(Math.max(10, this.floor * 0.05));
    this.cardTop = title.y + title.height + pick(16, 10);
    this.setCast([title], this.lamps(this.row(9), this.floor, first ? 400 : 0, 1, first ? 140 : 0));
    this.cards.forEach((c) => c.destroy());
    this.cards = PUPPET.stories.map((st, i) => this.card(st, i));
    if (!this.still) {
      this.cards.forEach((c, i) => {
        c.setAlpha(0);
        this.tweens.add({ targets: c, alpha: 1, duration: 450, delay: 250 + i * 120 });
      });
    }
    this.bandButton(first ? 'Skip' : 'Next', !first, () => this.advance());
    if (this.focus.visible) this.focus.focus(this.cards.find((c) => !this.watched.has(c.story)) ?? this.skip);
  }

  // A story's card: a little lit cloth with its puppets, its name, what it tells about Deepavali, and a tick once it
  // has been watched. The whole card is one button.
  card(st, i) {
    const { w } = this.S;
    const gap = pick(34, 26);
    const margin = pick(46, 40);
    const cw = (w - 2 * margin - 2 * gap) / 3;
    const top = this.cardTop;
    const ch = this.floor - 0.2 * this.P - top;
    const pad = 14;
    const textW = cw - 2 * pad - 8;
    const name = makeText(this, 0, 0, st.title, 'h5', { weight: 700, width: textW, align: 'center', origin: [0.5, 0], color: COLOR.grey900 });
    const teaser = makeText(this, 0, 0, st.teaser, 'b1', { width: textW, align: 'center', origin: [0.5, 0], color: COLOR.grey600 });
    const tick = this.watched.has(st.id) ? chip(this, 0, 0, '✓ Watched', 'success') : null;
    // Every card has the same picture size, sized for the card with the most text, with room kept for the tick.
    this.cardText ??= Math.max(
      ...PUPPET.stories.map((other) => {
        const a = makeText(this, 0, 0, other.title, 'h5', { weight: 700, width: textW });
        const b = makeText(this, 0, 0, other.teaser, 'b1', { width: textW });
        const h = a.height + 4 + b.height + 10 + 32;
        a.destroy();
        b.destroy();
        return h;
      }),
    );
    const thumbH = Math.max(80, ch - 2 * pad - 12 - this.cardText);
    const thumbW = cw - 2 * pad;
    const y0 = -ch / 2 + pad;
    const cloth = this.add.image(0, y0 + thumbH / 2, 'puppet-cloth').setDisplaySize(thumbW, thumbH);
    const scale = (thumbH - 10) / (1.32 * this.P);
    const puppets = THUMBS[st.id].map(([kind, f]) => this.rider(kind, f * thumbW, y0 + thumbH - 4, scale));
    name.setY(y0 + thumbH + 12);
    teaser.setY(name.y + name.height + 4);
    tick?.setY(teaser.y + teaser.height + 10 + 16);
    const card = new Button(this, this.S.x + margin + cw / 2 + i * (cw + gap), this.S.y + top + ch / 2, {
      variant: 'outline',
      dark: false,
      width: cw,
      height: ch,
      radius: 20,
      content: [cloth, ...puppets, name, teaser, ...(tick ? [tick] : [])],
      onClick: () => this.play(st.id),
    });
    card.story = st.id;
    return card;
  }

  // Plays one story from the start. Its card is ticked from now on.
  play(id) {
    this.clearTimers();
    this.story = PUPPET.stories.find((st) => st.id === id);
    this.watched.add(id);
    const cards = this.cards;
    this.cards = [];
    cards.forEach((c) => c.setEnabled(false));
    if (this.still) cards.forEach((c) => c.destroy());
    else this.tweens.add({ targets: cards, alpha: 0, duration: 300, onComplete: () => cards.forEach((c) => c.destroy()) });
    this.setNight(0, 400);
    this.bandButton('Skip story', false, () => this.showPicker());
    if (this.focus.visible) this.focus.focus(this.skip);
    this.index = -1;
    this.next();
  }

  next() {
    if (!this.story) return;
    this.index++;
    const line = this.story.lines[this.index];
    if (!line) return this.showPicker();
    this.say(line.text);
    this.hold = holdFor(line);
    this[line.id]();
    this.later(this.hold, () => this.next());
  }

  // Shows (and speaks) a line on the subtitle band.
  say(text) {
    speak(text);
    this.subtitle.setText(text);
    if (!this.still) this.tweens.add({ targets: this.subtitle, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  // The band's button: an outline (Skip, Skip story) or filled (Next). Keyboard focus stays on it when it changes.
  bandButton(label, filled, onClick) {
    const b = this.band;
    const focused = this.skip && this.focus.current === this.skip;
    this.skip?.destroy();
    this.skip = new Button(this, b.btnX, b.y + b.h / 2, { label, variant: filled ? 'filled' : 'outline', width: b.btnW, dark: true, onClick }).setDepth(BAND_DEPTH);
    if (focused) this.focus.focus(this.skip);
    if (!this.still) this.tweens.add({ targets: this.skip, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  // Swap the puppets on the cloth: the old ones fade away as the new ones arrive. `front` holds diyas, which stand in
  // front of the puppets, and `pools` the light they throw on the cloth (each fades in as its diya is lit).
  setCast(objs, { front = [], pools = [] } = {}) {
    const old = this.cast;
    this.cast = [...objs, ...front, ...pools];
    this.stage.add(objs);
    this.front.add(front);
    this.pools.add(pools);
    const drop = () =>
      old.forEach((o) => {
        this.tweens.killTweensOf([o, ...(o.list ?? [])]);
        o.destroy();
      });
    if (this.still) return drop();
    this.tweens.add({ targets: old, alpha: 0, duration: 400, onComplete: drop });
    [...objs, ...front].forEach((o) => {
      const a = o.alpha;
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: a, duration: 500, delay: 250 });
    });
  }

  // Night falls on the cloth (the new moon), or lifts.
  setNight(level, ms = 1600, delay = 0) {
    if (this.still) return this.applyNight(level);
    this.tweens.add({ targets: this.light, night: level, duration: ms, delay, ease: 'Sine.InOut', onUpdate: () => this.applyNight(this.light.night) });
  }

  // The lamps behind the cloth are shaded: the cloth darkens, and so does the light through the puppets' holes and
  // dyed leather. Lit diyas keep glowing.
  applyNight(v) {
    this.light.night = v;
    this.night.setAlpha(v);
    this.lights = this.lights.filter((l) => l.scene);
    this.lights.forEach((l) => l.setAlpha(1 - v * 0.75));
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

  // Diyas at each x, standing at y, lit one by one, `step` ms apart, from `delay` ms (all at once with Reduce motion).
  lamps(xs, y, delay, size = 1, step = 280) {
    const front = [];
    const pools = [];
    xs.forEach((x, i) => {
      const { lamp, pool } = this.diya(x, y, size);
      front.push(lamp);
      pools.push(pool);
      if (this.still) return lamp.light();
      this.later(delay + i * step, () => lamp.light());
    });
    return { front, pools };
  }

  // n positions spread across the cloth, for a row of diyas.
  row(n) {
    const { w } = this.S;
    return Array.from({ length: n }, (_, i) => w * 0.04 + (i * w * 0.92) / (n - 1));
  }

  // A fraction of the cloth's width, in the stage containers' space.
  at(f) {
    return this.S.w * f;
  }

  // The ground, in the stage containers' space.
  get floor() {
    return this.ground - this.S.y;
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
    const fam = this.family(this.at(0.075), this.P * 0.33);
    const cousin = this.puppet('duryodhana', this.at(0.88));
    const dice = [0, 1].map((k) => this.die(this.at(0.64) + k * 0.12 * this.P, this.floor * 0.18));
    this.sway(cousin, 2);
    const landX = (k) => this.at(0.62) + k * 0.16 * this.P;
    if (this.still) {
      dice.forEach((d, k) => d.setPosition(landX(k), this.floor - 0.06 * this.P));
    } else {
      // The dice tumble down between them, and the brothers bow their heads.
      dice.forEach((d, k) =>
        this.tweens.add({ targets: d, x: landX(k), y: this.floor - 0.06 * this.P, angle: 540 + k * 90, duration: 1400, delay: 600 + k * 200, ease: 'Bounce.Out' }),
      );
      this.later(2300, () => fam.forEach((p, i) => this.tweens.add({ targets: p, angle: 7, y: p.y + 0.03 * this.P, duration: 700, delay: i * 60, ease: 'Sine.InOut' })));
    }
    this.setCast([...fam, cousin, ...dice]);
  }

  forest() {
    // The far side of the forest, pale and soft; the moon behind the near trees; then a coconut palm, a tall forest
    // tree and a banyan close to the cloth, with grass and ferns along the ground.
    const far = this.forestShadow('far', 0.2);
    const moon = this.add.circle(this.at(0.08), this.floor * 0.16, 0.07 * this.P, LIGHT, 0.9);
    const near = [
      this.forestShadow('palm', 0.5, 1),
      this.forestShadow('tall', 0.5, 0.5),
      this.forestShadow('banyan', 0.5, 0.25),
    ];
    const ground = this.forestShadow('ground', 0.55);
    const fam = this.family(-0.4 * this.P, this.P * 0.38);
    // Many moons pass as they walk through the forest.
    if (!this.still) this.tweens.add({ targets: moon, x: this.at(0.92), duration: this.hold / 3, repeat: 2 });
    fam.forEach((p, i) => this.walk(p, this.at(0.16) + i * this.P * 0.38, this.hold - 700));
    this.setCast([far, moon, ...near, ground, ...fam]);
  }

  lost() {
    // They leave the palace, heads bowed, while Duryodhana watches them go.
    this.setNight(0.25, 1200);
    const palace = this.palace(this.at(0.12), 0.9);
    const cousin = this.puppet('duryodhana', this.at(0.27), 0, { face: 'right' });
    this.sway(cousin, 1);
    const fam = this.family(this.at(0.36), this.P * 0.33);
    fam.forEach((p, i) => {
      p.setAngle(6);
      this.walk(p, this.at(0.36) + i * this.P * 0.33 + this.S.w * 0.7, this.hold);
    });
    this.setCast([palace, cousin, ...fam]);
  }

  home() {
    // A dark new moon night: they walk home to the palace, its windows lit.
    this.setNight(0.62);
    const palace = this.palace(this.at(0.85), 1);
    const fam = this.family(-0.3 * this.P, this.P * 0.36);
    fam.forEach((p, i) => this.walk(p, this.at(0.08) + i * this.P * 0.36, this.hold - 1500));
    this.setCast([palace, ...fam]);
  }

  reunion() {
    // An elder of the family comes out to meet them with a plate of sweets, and they bow to her for her blessing.
    this.setNight(0.45, 1200);
    const palace = this.palace(this.at(0.9), 1);
    const elder = this.puppet('elder', this.at(0.7));
    const fam = this.family(this.at(0.04), this.P * 0.33);
    fam.forEach((p, i) => this.walk(p, this.at(0.1) + i * this.P * 0.33, 1800));
    this.sway(elder, 2);
    if (!this.still) {
      this.later(2300, () => fam.forEach((p, i) => this.tweens.add({ targets: p, angle: 14, duration: 600, delay: i * 80, yoyo: true, hold: 900, ease: 'Sine.InOut' })));
    }
    this.setCast([palace, elder, ...fam]);
  }

  together() {
    // Everyone together in the light, the elder sharing her sweets.
    this.setNight(0.2, 1500);
    const palace = this.palace(this.at(0.9), 1);
    const fam = this.family(this.at(0.06), this.P * 0.33);
    const elder = this.puppet('elder', this.at(0.68));
    fam.forEach((p, i) => this.sway(p, i));
    this.sway(elder, 6);
    const k = this.P / 100;
    if (!this.still) {
      this.later(1200, () => sparkle(this, this.S.x + elder.x - 30 * k, this.S.y + this.floor - 70 * k, { radius: 50, count: 12 }));
      this.later(3600, () => sparkle(this, this.S.x + this.at(0.35), this.S.y + this.floor * 0.3, { radius: this.S.w * 0.25, count: 22 }));
    }
    this.setCast([palace, elder, ...fam]);
  }

  exile() {
    // Rama, Sita and Lakshmana leave the palace of Ayodhya for the forest.
    const palace = this.palace(this.at(0.13), 0.95);
    const trees = [this.forestShadow('tall', 0.5, 0.5, { x: this.at(0.86), scale: 0.9 }), this.forestShadow('palm', 0.5, 1, { x: this.at(0.99), scale: 0.9 })];
    const trio = ['lakshmana', 'sita', 'rama'].map((k, i) => this.puppet(k, this.at(0.24) + i * this.P * 0.38));
    trio.forEach((p, i) => this.walk(p, this.at(0.5) + i * this.P * 0.38, this.hold - 1000));
    this.setCast([palace, ...trees, ...trio]);
  }

  hut() {
    // Their little home in the forest: a thatched hut among the trees.
    const far = this.forestShadow('far', 0.2);
    const near = [this.forestShadow('tall', 0.5, 0.5), this.forestShadow('banyan', 0.5, 0.25)];
    const ground = this.forestShadow('ground', 0.55);
    const hut = this.cottage(this.at(0.62));
    const trio = [['lakshmana', 0.14], ['sita', 0.27], ['rama', 0.4]].map(([k, f]) => this.puppet(k, this.at(f)));
    trio.forEach((p, i) => this.sway(p, i));
    this.setCast([far, ...near, hut, ground, ...trio]);
  }

  friends() {
    // In the forest, Hanuman bows to Rama, and a band of monkeys gathers behind him to help.
    const far = this.forestShadow('far', 0.2);
    const ground = this.forestShadow('ground', 0.55);
    const tree = this.forestShadow('tall', 0.5, 0.5, { x: this.at(0.92), scale: 0.8 });
    const lakshmana = this.puppet('lakshmana', this.at(0.12));
    const rama = this.puppet('rama', this.at(0.26));
    const hanuman = this.puppet('hanuman', this.at(0.5), 0, { face: 'left' });
    const monkeys = [0.64, 0.74, 0.84].map((f) => this.puppet('vanara', this.at(f)));
    [lakshmana, rama, ...monkeys].forEach((p, i) => this.sway(p, i));
    if (this.still) {
      hanuman.setAngle(-12);
    } else {
      hanuman.setX(this.at(0.62));
      this.walk(hanuman, this.at(0.5), 1600);
      this.later(2000, () => this.tweens.add({ targets: hanuman, angle: -14, duration: 600, ease: 'Sine.InOut' }));
      monkeys.forEach((m, i) => {
        m.setX(m.x + this.S.w * 0.3);
        this.walk(m, this.at([0.64, 0.74, 0.84][i]), 2200 + i * 300);
      });
    }
    this.setCast([far, tree, ground, lakshmana, rama, hanuman, ...monkeys]);
  }

  ravana() {
    this.setNight(0, 300);
    const lanka = this.lanka(this.at(0.86));
    const ravana = this.puppet('ravana', this.at(0.56));
    const sita = this.puppet('sita', this.at(0.3));
    // Ravana leads Sita away towards Lanka.
    this.walk(ravana, this.at(0.68), this.hold - 1500);
    this.walk(sita, this.at(0.44), this.hold - 1500);
    this.setCast([lanka, sita, ravana]);
  }

  bridge() {
    const sea = this.sea();
    const stones = this.bridgeStones();
    const lanka = this.lanka(this.at(0.9));
    const walkers = ['rama', 'lakshmana', 'hanuman'].map((k, i) => this.puppet(k, -0.3 * this.P - i * 0.42 * this.P, 0.27 * this.P));
    walkers.forEach((p, i) => this.walk(p, this.at(0.52) - i * this.P * 0.42, this.hold - 600));
    this.setCast([sea, stones, lanka, ...walkers]);
  }

  battle() {
    // Rama stands at the front of his side, so it is clearly his arrow, with Hanuman (and his tail) at the back.
    const hanuman = this.puppet('hanuman', this.at(0.1));
    const lakshmana = this.puppet('lakshmana', this.at(0.24));
    const rama = this.puppet('rama', this.at(0.36), 0, { pose: 'draw' });
    const ravana = this.puppet('ravana', this.at(0.72));
    const sita = this.puppet('sita', this.at(0.92)).setAlpha(0.35);
    const k = this.P / 100;
    const arrow = this.arrow(rama.x + 25 * k, this.floor - 72 * k);
    const objs = [hanuman, lakshmana, rama, ravana, sita, arrow];
    if (this.still) {
      arrow.setVisible(false);
      ravana.setVisible(false);
      sita.setAlpha(1).setX(this.at(0.6));
    } else {
      // Rama's arrow flies, Ravana falls back and fades away, and Sita steps out, free, towards Rama.
      arrow.setAlpha(0);
      this.later(1300, () => {
        arrow.setAlpha(1);
        this.tweens.add({ targets: arrow, x: ravana.x - 20 * k, duration: 750, ease: 'Quad.In', onComplete: () => arrow.setVisible(false) });
      });
      this.later(2050, () => {
        sparkle(this, this.S.x + ravana.x, this.S.y + this.floor - 0.6 * this.P, { radius: 60, count: 14 });
        this.tweens.add({ targets: ravana, angle: 75, y: ravana.y + 0.04 * this.P, duration: 1300, ease: 'Cubic.In' });
        this.tweens.add({ targets: ravana, alpha: 0, duration: 900, delay: 400 });
      });
      this.later(3200, () => {
        this.tweens.add({ targets: sita, alpha: 1, duration: 400 });
        this.walk(sita, this.at(0.6), 1800);
      });
    }
    this.setCast(objs);
  }

  hanuman() {
    // Hanuman leaps from the shore, high over the sea, and lands in the garden of Lanka, where Sita sits under a tree.
    // He holds out Rama's ring: a sparkle between them.
    const k = this.P / 100;
    const h = 34 * k; // the land stands this high above the floor of the cloth
    const top = this.floor - h;
    const sea = this.sea();
    const shore = this.land(0, this.at(0.13), h);
    const garden = this.land(this.at(0.52), this.S.w, h);
    const lanka = this.lanka(this.at(0.95)).setY(top);
    const tree = this.forestShadow('tall', 0.5, 0.4, { x: this.at(0.81), y: top, scale: 0.42 });
    const sita = this.puppet('sita', this.at(0.74), h, { face: 'left' });
    const hanuman = this.puppet('hanuman', this.at(0.06), h);
    const landX = this.at(0.6);
    if (this.still) {
      hanuman.setX(landX);
    } else {
      // He flies leaning far forward, mace out in front, and straightens up to land.
      this.later(700, () => {
        this.tweens.add({ targets: hanuman, x: landX, duration: 1800, ease: 'Sine.InOut' });
        this.tweens.add({ targets: hanuman, y: top - 0.3 * this.P, duration: 900, yoyo: true, ease: 'Quad.Out' });
        this.tweens.add({ targets: hanuman, angle: 62, duration: 450, ease: 'Sine.Out' });
        this.tweens.add({ targets: hanuman, angle: 0, duration: 450, delay: 1350, ease: 'Sine.In' });
      });
      this.later(2900, () => sparkle(this, this.S.x + (landX + sita.x) / 2, this.S.y + top - 60 * k, { radius: 36, count: 10 }));
    }
    this.setCast([sea, shore, garden, lanka, tree, sita, hanuman]);
  }

  ayodhya() {
    // A dark new moon night: the flying chariot glides in with Rama, Sita, Lakshmana and Hanuman aboard and settles by
    // the palace.
    this.setNight(0.72);
    const palace = this.palace(this.at(0.86), 1.05);
    const chariot = this.chariot([['hanuman', -38], ['lakshmana', -16], ['sita', 5], ['rama', 26]]);
    const landX = this.at(0.4);
    const landY = this.floor - 8 * (this.P / 100);
    if (this.still) {
      chariot.setPosition(landX, landY);
    } else {
      chariot.setPosition(-0.7 * this.P, this.floor * 0.32);
      this.tweens.add({ targets: chariot, x: landX, duration: 3400, ease: 'Sine.Out' });
      this.tweens.add({ targets: chariot, y: landY, duration: 3400, ease: 'Sine.InOut' });
    }
    this.setCast([palace, chariot]);
  }

  rows() {
    // The people light rows of diyas to welcome them home; the cloth stays dark enough for them to glow.
    this.setNight(0.72, 300);
    const palace = this.palace(this.at(0.86), 1.05);
    const chariot = this.chariot([['hanuman', -38], ['lakshmana', -16], ['sita', 5], ['rama', 26]]);
    chariot.setPosition(this.at(0.4), this.floor - 8 * (this.P / 100));
    const lamps = this.lamps(this.row(11), this.floor, 600, 1.2);
    this.setNight(0.48, 2800, 1000);
    this.later(600 + 11 * 280, () => sparkle(this, this.S.x + this.S.w / 2, this.S.y + this.floor * 0.45, { radius: this.S.w * 0.4, count: 30 }));
    this.setCast([palace, chariot], lamps);
  }

  naraka() {
    // The sky dims while Narakasura stamps before his fort, trident raised.
    this.setNight(0.32, 900);
    const fort = this.fort(this.at(0.8));
    const naraka = this.puppet('narakasura', this.at(0.48));
    if (!this.still) {
      this.tweens.add({ targets: naraka, y: naraka.y - 0.04 * this.P, duration: 260, yoyo: true, repeat: 7, repeatDelay: 420, ease: 'Quad.Out' });
      this.tweens.add({ targets: naraka, angle: { from: -4, to: 4 }, duration: 680, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    this.setCast([fort, naraka]);
  }

  boon() {
    // Narakasura in a glow of his gift, sure that no one can stop him.
    this.setNight(0.4, 800);
    const fort = this.fort(this.at(0.82));
    const naraka = this.puppet('narakasura', this.at(0.45));
    const aura = this.glow(this.at(0.45), this.floor - 0.6 * this.P, 1.1 * this.P, 1.5 * this.P, 0xffc870, 0);
    this.sway(naraka, 2);
    if (this.still) aura.setAlpha(0.45);
    else this.tweens.add({ targets: aura, alpha: { from: 0, to: 0.5 }, duration: 1400, delay: 500, yoyo: true, hold: 1600, repeat: -1 });
    this.setCast([fort, naraka], { pools: [aura] });
  }

  garuda() {
    // Krishna and Satyabhama fly in on Garuda, wings beating, and hover facing Narakasura.
    this.setNight(0, 1200);
    const fort = this.fort(this.at(0.88));
    const naraka = this.puppet('narakasura', this.at(0.7));
    this.sway(naraka, 1);
    const bird = this.eagle([['satyabhama', -16], ['krishna', 10]]).setScale(1.2);
    const hoverX = this.at(0.32);
    const hoverY = this.floor * 0.58;
    if (this.still) {
      bird.setPosition(hoverX, hoverY);
    } else {
      bird.setPosition(-0.9 * this.P, this.floor * 0.22);
      this.tweens.add({ targets: bird, x: hoverX, y: hoverY, duration: 3000, ease: 'Sine.Out' });
      this.later(3000, () => this.tweens.add({ targets: bird, y: hoverY - 0.04 * this.P, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut' }));
    }
    this.setCast([fort, naraka, bird]);
  }

  fight() {
    // Narakasura strikes Krishna to his knees; Satyabhama steps in front of him and looses an arrow; Narakasura sinks
    // to his knees, and Krishna rises.
    const k = this.P / 100;
    const fort = this.fort(this.at(0.9));
    const krishna = this.puppet('krishna', this.at(0.2));
    const satya = this.puppet('satyabhama', this.at(0.07), 0, { pose: 'draw' });
    const naraka = this.puppet('narakasura', this.at(0.7));
    const shootX = this.at(0.36);
    const arrow = this.arrow(shootX + 25 * k, this.floor - 72 * k);
    const kneel = { y: this.floor + 0.12 * this.P, angle: -10 };
    if (this.still) {
      satya.setX(shootX);
      arrow.setVisible(false);
      naraka.setPosition(naraka.x, kneel.y).setAngle(kneel.angle);
    } else {
      arrow.setAlpha(0);
      this.later(800, () => this.tweens.add({ targets: krishna, y: this.floor + 0.1 * this.P, angle: -16, duration: 500, ease: 'Quad.In' }));
      this.later(1300, () => this.walk(satya, shootX, 900));
      this.later(2400, () => {
        arrow.setAlpha(1);
        this.tweens.add({ targets: arrow, x: naraka.x - 20 * k, duration: 750, ease: 'Quad.In', onComplete: () => arrow.setVisible(false) });
      });
      this.later(3150, () => {
        sparkle(this, this.S.x + naraka.x, this.S.y + this.floor - 0.6 * this.P, { radius: 60, count: 14 });
        this.tweens.add({ targets: naraka, angle: 14, duration: 300, ease: 'Quad.Out' });
        this.tweens.add({ targets: naraka, ...kneel, duration: 1000, delay: 300, ease: 'Sine.InOut' });
      });
      this.later(3900, () => this.tweens.add({ targets: krishna, angle: 0, y: this.floor, duration: 800, ease: 'Back.Out' }));
    }
    this.setCast([fort, krishna, satya, naraka, arrow]);
  }

  wish() {
    // Evening: Narakasura, kneeling, makes his last wish to Krishna and Satyabhama, and fades away.
    this.setNight(0.45);
    const satya = this.puppet('satyabhama', this.at(0.2));
    const krishna = this.puppet('krishna', this.at(0.34));
    const naraka = this.puppet('narakasura', this.at(0.64));
    naraka.setPosition(naraka.x, this.floor + 0.12 * this.P).setAngle(-10);
    if (!this.still) this.later(this.hold - 3000, () => this.tweens.add({ targets: naraka, alpha: 0, duration: 2400, ease: 'Sine.InOut' }));
    this.setCast([satya, krishna, naraka]);
  }

  dawn() {
    // Dawn: a deep orange sun rises behind the cloth as Krishna and Satyabhama walk home.
    this.setNight(0.6, 300);
    const { sun, glow, risen } = this.sunrise();
    const palace = this.palace(this.at(0.88), 1);
    const satya = this.puppet('satyabhama', this.at(0));
    const krishna = this.puppet('krishna', this.at(0.12));
    this.walk(satya, this.at(0.35), this.hold - 1500);
    this.walk(krishna, this.at(0.65), this.hold - 1500);
    this.setNight(0.22, 4800, 900);
    if (this.still) {
      sun.setY(risen);
      glow.setAlpha(0.5);
    } else {
      this.tweens.add({ targets: sun, y: risen, duration: 5200, delay: 600, ease: 'Sine.Out' });
      this.tweens.add({ targets: glow, alpha: 0.5, duration: 4200, delay: 600 });
    }
    this.setCast([sun, palace, satya, krishna], { pools: [glow] });
  }

  morning() {
    // Morning: crackers go up from behind the stage, and Happy Deepavali appears across the top.
    this.setNight(0.22, 300);
    const { sun, glow, risen } = this.sunrise();
    sun.setY(risen);
    glow.setAlpha(0.5);
    const palace = this.palace(this.at(0.88), 1);
    const satya = this.puppet('satyabhama', this.at(0.35));
    const krishna = this.puppet('krishna', this.at(0.65));
    [satya, krishna].forEach((p, i) => this.sway(p, i));
    const greeting = makeText(this, this.S.w / 2, this.floor * 0.15, 'Happy Deepavali!', 'h1', { color: SHADOW, weight: 700, origin: 0.5, align: 'center' })
      .setFontFamily(SERIF)
      .setFontSize(Math.round(fontSize('h1') * 1.15));
    if (!this.still) {
      greeting.setAlpha(0);
      this.later(1600, () => this.tweens.add({ targets: greeting, alpha: 1, duration: 900 }));
      const R = Phaser.Math;
      for (let i = 0; i < 9; i++) {
        this.later(700 + i * 650, () => rocket(this, this.S.x + this.at(R.FloatBetween(0.1, 0.9)), this.S.y + this.floor * R.FloatBetween(0.14, 0.4), { depth: 5 }));
      }
    }
    this.setCast([sun, palace, satya, krishna, greeting], { pools: [glow] });
  }

  // The sun, below the ground, and the warm glow it will throw on the cloth; `risen` is where it ends up.
  sunrise() {
    const r = 0.26 * this.P;
    const x = this.at(0.5);
    return {
      glow: this.glow(x, this.floor, this.S.w * 0.95, this.floor * 1.5, 0xff9a40, 0),
      sun: this.add.circle(x, this.floor + r, r, 0xffa63a, 1),
      risen: this.floor - r * 1.15,
    };
  }

  // ---- puppets and props, drawn as shadows -----------------------------------------------------------

  // A shadow puppet standing at screen x, on the ground (or `lift` above it), facing right (left for Duryodhana and
  // Ravana). Drawn 100 units tall (crown extra), with a profile face, crown, jewellery and clothes picked out by
  // punched holes, dyed panels, and what each one holds.
  puppet(kind, x, lift = 0, { pose, face } = {}) {
    const c = CAST[kind];
    const k = (this.P / 100) * (c.size ?? 1);
    // The rod the puppeteer holds, running down off the cloth.
    const rod = this.add.graphics();
    rod.lineStyle(1.8 * k, SHADOW, 0.55);
    rod.lineBetween(0, -55 * k, -8 * k, 140 * k);
    // Drawn twice: as a plain shadow, and again with the light through its holes and dyed leather, which fades when
    // the lamps behind the cloth are shaded for night.
    const plain = this.add.graphics();
    this.paintPuppet(plain, c, k, pose, false);
    const lit = this.add.graphics();
    this.paintPuppet(lit, c, k, pose, true);
    lit.setAlpha(1 - this.light.night * 0.75);
    this.lights.push(lit);
    const ct = this.add.container(x, this.floor - lift, [rod, plain, lit]);
    if (face ? face === 'left' : c.left) ct.setScale(-1, 1);
    return ct;
  }

  // A puppet riding on something: smaller, without its rod, standing at (x, y) inside it.
  rider(kind, x, y, scale, opts) {
    const p = this.puppet(kind, x, 0, opts);
    p.list[0].setVisible(false);
    return p.setPosition(x, y).setScale(p.scaleX * scale, scale);
  }

  // Draws a puppet into g at k pixels a unit; `lit` adds the holes and dyed leather the light shines through.
  paintPuppet(g, c, k, pose, lit) {
    const s = (v) => v * k;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const shadow = (a = 0.94) => g.fillStyle(SHADOW, a);
    const holes = (list, r = 0.9) => {
      if (!lit) return;
      g.fillStyle(LIGHT, 0.9);
      list.forEach(([hx, hy]) => g.fillCircle(s(hx), s(hy), s(r)));
    };
    const dots = (x0, y0, x1, y1, n, r = 0.8) => holes(Array.from({ length: n }, (_, i) => [x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * i) / (n - 1)]), r);
    const dye = (list, colour = c.dye, a = 0.72) => {
      if (!lit) return;
      g.fillStyle(colour, a);
      g.fillPoints(P(list), true);
    };

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
      if (lit) {
        g.fillStyle(LIGHT, 0.55);
        g.fillPoints(P([[-15, -3], [17, -3], [16.6, -1.5], [-14.6, -1.5]]), true);
      }
      dots(-13, -7, 15, -7, 10);
      for (let i = 0; i < 5; i++) dots(-6 + i * 4.5, -46, -9 + i * 6, -10, 6, 0.55);
      shadow();
      g.fillPoints(P([[8, -76], [12, -72], [-11, -32], [-16, -36]]), true);
      dye([[8, -76], [12, -72], [-11, -32], [-16, -36]], c.dye, 0.8);
      dots(9, -73, -13, -35, 8, 0.75);
    } else {
      // A pleated dhoti, legs, anklets and feet.
      g.fillPoints(P([[-9, -49], [10, -49], [13, -12], [-11, -12]]), true);
      dye([[-9, -49], [10, -49], [13, -12], [-11, -12]]);
      if (lit) {
        g.lineStyle(s(0.6), LIGHT, 0.5);
        for (let i = 0; i < 4; i++) g.lineBetween(s(-5 + i * 5), s(-46), s(-6 + i * 6), s(-14));
      }
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
    if (c.skin) dye(chest, c.skin, 0.55);
    shadow();
    g.fillRect(s(-1), s(-81), s(5), s(6));
    const head = c.monkey
      ? [[-6, -88], [-1, -94], [6, -93], [9, -89], [14, -86], [15, -82], [11, -79], [7, -78], [2, -77], [-4, -79], [-7, -83]]
      : [[-6, -87], [-2, -93], [5, -92], [8, -88], [8, -86], [11, -83], [8.5, -82], [9, -80.5], [7, -78], [2, -77], [-4, -79], [-7, -83]];
    g.fillPoints(P(head), true);
    if (c.skin) dye(head, c.skin, 0.55);
    holes([[5.5, -86]], 0.9); // the eye
    // A necklace with a pendant, and an ear ornament.
    holes(Array.from({ length: 7 }, (_, i) => Math.PI * (0.15 + (i / 6) * 0.7)).map((a) => [2 + 7 * Math.cos(a), -74 + 6 * Math.sin(a)]), 0.75);
    holes([[2, -66]], 1.3);
    holes([[-1, -82.5]], 1.2);
    shadow();
    g.fillCircle(s(-1), s(-82.5), s(0.6));
    // A proud, fierce face (Narakasura): a thick moustache curling up past the nose, and a fang.
    if (c.fierce) {
      shadow();
      g.fillPoints(P([[6.5, -81.6], [10, -81.8], [12.5, -83.2], [14, -85.6], [15, -84.6], [13.6, -81.6], [10.6, -79.8], [7, -79.9]]), true);
      if (lit) {
        g.fillStyle(LIGHT, 0.9);
        g.fillTriangle(s(7.6), s(-79.6), s(9.2), s(-79.6), s(8.5), s(-77.4));
      }
    }

    // The crown: a tall tiered one for kings and heroes, a low one otherwise; with the sari, a bun and a small tiara.
    if (c.sari) {
      g.fillCircle(s(-8), s(-87), s(5));
      holes([[-10, -89], [-7, -91], [-11, -86]], 0.9);
      shadow();
      g.fillPoints(P([[-4, -92], [6, -92], [5, -95], [1, -97], [-3, -95]]), true);
      holes([[1, -94]], 0.8);
    } else if (c.crown === 'none') {
      // Bare-headed: the monkeys of the army.
    } else if (c.crown === 'peacock') {
      // A jewelled crown with a peacock feather rising from it (Krishna), its eye dyed blue and green.
      shadow();
      g.fillRect(s(-6), s(-95), s(15), s(4));
      g.fillPoints(P([[-6, -95], [9, -95], [7, -101], [3.5, -105], [1.5, -103], [-0.5, -105], [-4, -101]]), true);
      holes([[1.5, -93], [-3, -93], [6, -93], [1.5, -99]], 0.85);
      g.lineStyle(s(1.3), SHADOW, 0.94);
      g.beginPath();
      g.moveTo(s(-1), s(-103));
      g.lineTo(s(-3), s(-111));
      g.lineTo(s(-6.5), s(-119));
      g.lineTo(s(-10), s(-124));
      g.strokePath();
      g.lineStyle(s(0.5), SHADOW, 0.94);
      for (let i = 0; i < 6; i++) {
        const y = -106 - i * 3;
        g.lineBetween(s(-2 - i * 1.3), s(y), s(-6 - i * 1.4), s(y - 1.5));
        g.lineBetween(s(-2 - i * 1.3), s(y), s(1 - i * 1.2), s(y - 2.5));
      }
      shadow();
      g.fillEllipse(s(-11.5), s(-128), s(10), s(13));
      if (lit) {
        g.fillStyle(DYE.teal, 0.85);
        g.fillEllipse(s(-11.5), s(-128), s(7), s(9.5));
        g.fillStyle(DYE.indigo, 0.95);
        g.fillEllipse(s(-11.5), s(-128.5), s(3.6), s(5));
      }
      holes([[-11.5, -129]], 0.6);
      shadow();
      g.fillPoints(P([[-6, -92], [-12, -97], [-13, -89], [-7, -86]]), true);
      holes([[-10, -92]], 0.8);
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
      // A long bow gripped in the middle, standing upright in front of the body; drawn, its string is pulled back
      // to the cheek.
      const R = draw ? 50 : 56;
      const spread = draw ? 0.6 : 0.55;
      const bx = hx - R + 1;
      g.beginPath();
      g.arc(s(bx), s(hy), s(R), -spread, spread);
      g.strokePath();
      g.lineStyle(s(0.6), SHADOW, 0.94);
      const tip = (sign) => [s(bx + R * Math.cos(spread)), s(hy + sign * R * Math.sin(spread))];
      if (draw) {
        g.lineBetween(...tip(-1), s(-2), s(hy));
        g.lineBetween(s(-2), s(hy), ...tip(1));
      } else {
        g.lineBetween(...tip(-1), ...tip(1));
      }
      holes([-0.3, 0.3].map((a) => [bx + R * Math.cos(a), hy + R * Math.sin(a)]), 0.75);
    } else if (c.hold === 'sword') {
      shadow();
      g.fillPoints(P([[hx - 1, hy + 1], [hx + 2, hy - 1], [hx + 20, hy - 24], [hx + 17, hy - 25]]), true);
      g.fillRect(s(hx - 3), s(hy - 1), s(6), s(2));
    } else if (c.hold === 'sceptre') {
      g.lineBetween(s(hx), s(hy + 12), s(hx), s(hy - 28));
      shadow();
      g.fillPoints(P([[hx - 4, hy - 30], [hx, hy - 36], [hx + 4, hy - 30], [hx, hy - 28]]), true);
      holes([[hx, hy - 31]], 0.8);
    } else if (c.hold === 'chakra') {
      // The discus, spinning on a raised finger (Krishna): a toothed wheel with spokes of light.
      g.lineBetween(s(hx), s(hy), s(hx + 1), s(hy - 6));
      const cx = hx + 1.5;
      const cy = hy - 14;
      const R = 7.5;
      shadow();
      g.fillCircle(s(cx), s(cy), s(R));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const at = (r, da) => [s(cx + r * Math.cos(a + da)), s(cy + r * Math.sin(a + da))];
        g.fillTriangle(...at(R - 0.5, -0.2), ...at(R - 0.5, 0.2), ...at(R + 2.6, 0));
      }
      holes(Array.from({ length: 8 }, (_, i) => [cx + 4.4 * Math.cos((i / 8) * Math.PI * 2), cy + 4.4 * Math.sin((i / 8) * Math.PI * 2)]), 0.9);
      holes([[cx, cy]], 1.5);
    } else if (c.hold === 'trident') {
      // A tall trident (Narakasura), its staff resting on the ground.
      g.lineStyle(s(2), SHADOW, 0.94);
      g.lineBetween(s(hx + 1), s(0), s(hx - 1), s(-108));
      shadow();
      g.fillRect(s(hx - 9), s(-110), s(16), s(3));
      g.fillPoints(P([[hx - 2.5, -110], [hx + 0.5, -110], [hx - 1, -124]]), true);
      for (const side of [-1, 1]) {
        const px = hx - 1 + side * 6.5;
        g.fillPoints(P([[px - 1.3, -108], [px + 1.3, -108], [px + side * 1.5, -119], [px + side * 0.2, -120]]), true);
      }
      holes([[hx - 5, -108.5], [hx - 1, -108.5], [hx + 3, -108.5]], 0.7);
    } else if (c.hold === 'plate') {
      // A plate of sweets held out: round sweets and a muruku spiral.
      shadow();
      g.fillEllipse(s(hx + 4), s(hy - 1), s(20), s(4));
      g.fillCircle(s(hx - 1), s(hy - 4.5), s(2.6));
      g.fillCircle(s(hx + 4), s(hy - 5), s(2.8));
      g.fillCircle(s(hx + 9), s(hy - 4.5), s(2.4));
      g.lineStyle(s(1.1), SHADOW, 0.94);
      g.beginPath();
      for (let t = 0; t <= 1.001; t += 0.05) {
        const a = t * Math.PI * 5;
        const r = 0.6 + t * 3.4;
        const px = s(hx + 4 + r * Math.cos(a));
        const py = s(hy - 11 + r * Math.sin(a));
        if (t === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
      if (lit) {
        g.fillStyle(DYE.ochre, 0.85);
        g.fillCircle(s(hx - 1), s(hy - 4.5), s(1.8));
        g.fillCircle(s(hx + 4), s(hy - 5), s(2));
        g.fillCircle(s(hx + 9), s(hy - 4.5), s(1.6));
      }
      holes([[hx - 3, hy - 1], [hx + 2, hy - 1], [hx + 7, hy - 1], [hx + 11, hy - 1]], 0.6);
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

  // The sea: rolling waves across the bottom of the cloth, on a panel of blue-dyed leather.
  sea() {
    const { w } = this.S;
    const k = this.P / 100;
    const g = this.add.graphics();
    const top = this.floor - 30 * k;
    g.fillStyle(SHADOW, 0.5);
    g.fillRect(0, top + 6 * k, w, this.S.h);
    g.fillStyle(0x2f78a8, 0.5);
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

  // Land standing out of the sea from x0 to x1, h high, sloping down into the waves on its sea side, with grass along
  // its top.
  land(x0, x1, h) {
    const k = this.P / 100;
    const top = this.floor - h;
    const slope = (x) => (x > 0 && x < this.S.w ? 14 * k : 0);
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.9);
    g.fillPoints(
      [
        { x: x0 - slope(x0), y: this.floor + 6 * k },
        { x: x0, y: top },
        { x: x1, y: top },
        { x: x1 + slope(x1), y: this.floor + 6 * k },
      ],
      true,
    );
    g.lineStyle(1.1 * k, SHADOW, 0.9);
    for (let x = x0 + 2 * k, i = 0; x < x1 - k; x += 3.4 * k, i++) g.lineBetween(x, top + k, x + (i % 3) * k - k, top - (2.5 + (i % 4)) * k);
    g.fillStyle(LIGHT, 0.55);
    for (let x = x0 + 9 * k, i = 0; x < x1 - 6 * k; x += 17 * k, i++) g.fillCircle(x, top + (9 + (i % 3) * 6) * k, 1.1 * k);
    return this.add.container(0, 0, [g]);
  }

  // A little home in the forest: a hut with woven walls and a doorway, under a deep thatched roof.
  cottage(x) {
    const k = this.P / 100;
    const s = (v) => v * k;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.9);
    g.fillRect(s(-30), s(-36), s(60), s(36));
    g.fillPoints(P([[-44, -30], [-8, -66], [8, -66], [44, -30], [40, -27], [-40, -27]]), true);
    g.lineStyle(s(0.6), LIGHT, 0.35);
    for (let i = -5; i <= 5; i++) g.lineBetween(s(i * 1.4), s(-64), s(i * 7.6), s(-29));
    g.fillStyle(LIGHT, 0.5);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 9; col++) if (col < 3 || col > 5) g.fillCircle(s(-26 + col * 6.5), s(-20 + row * 7), s(0.9));
    g.fillStyle(LIGHT, 0.65);
    g.fillRect(s(-7), s(-22), s(14), s(22));
    g.fillCircle(s(0), s(-22), s(7));
    return this.add.container(x, this.floor, [g]);
  }

  // Narakasura's fort: a wall with battlements and a barred gate, between two domed towers with flags.
  fort(x) {
    const k = this.P / 100;
    const s = (v) => v * k;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const g = this.add.graphics();
    g.fillStyle(SHADOW, 0.9);
    g.fillRect(s(-50), s(-42), s(100), s(42));
    for (let mx = -50; mx < 48; mx += 10) g.fillRect(s(mx + 2), s(-48), s(6), s(6));
    for (const tx of [-58, 58]) {
      g.fillRect(s(tx - 11), s(-68), s(22), s(68));
      g.beginPath();
      g.arc(s(tx), s(-68), s(11), Math.PI, 0);
      g.closePath();
      g.fillPath();
      g.fillRect(s(tx - 0.8), s(-92), s(1.6), s(14));
      g.fillPoints(P([[tx + 0.8, -92], [tx + 10, -88.5], [tx + 0.8, -85]]), true);
    }
    g.fillStyle(LIGHT, 0.7);
    g.fillRect(s(-9), s(-22), s(18), s(22));
    g.fillCircle(s(0), s(-22), s(9));
    for (const tx of [-58, 58]) for (const ty of [-54, -36, -18]) g.fillRect(s(tx - 1.2), s(ty), s(2.4), s(7));
    for (let i = 0; i < 9; i++) g.fillCircle(s(-40 + i * 10), s(-36), s(1.1));
    g.fillStyle(SHADOW, 0.9);
    for (const bx of [-6, -2, 2, 6]) g.fillRect(s(bx - 0.6), s(-30), s(1.2), s(30));
    g.fillRect(s(-9), s(-12), s(18), s(1.2));
    return this.add.container(x, this.floor, [g]);
  }

  // Garuda, the great eagle, flying right with his wings beating and `riders` ([kind, x]) on his back, among his
  // feathers. About 1.6 puppets from tail to beak.
  eagle(riders) {
    const k = this.P / 100;
    const s = (v) => v * k;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const dots = (g, list, r) => list.forEach(([px, py]) => g.fillCircle(s(px), s(py), s(r)));
    // A wing reaching back from the shoulder, its long flight feathers splayed; it beats between two angles.
    const wing = (from, to, delay) => {
      const g = this.add.graphics({ x: s(4), y: s(-8) });
      g.fillStyle(SHADOW, 0.93);
      g.fillPoints(P([[0, -5], [-18, -11], [-40, -14], [-62, -12], [-84, -6], [-94, 0], [-80, 3], [-86, 9], [-70, 8], [-73, 15], [-58, 12], [-59, 19], [-46, 14], [-46, 21], [-34, 14], [-33, 19], [-22, 12], [-16, 14], [-6, 8], [2, 4]]), true);
      g.fillStyle(DYE.red, 0.6);
      g.fillPoints(P([[-2, -4], [-18, -9], [-40, -11], [-56, -9], [-50, -2], [-36, 1], [-20, 2], [-6, 2]]), true);
      g.fillStyle(LIGHT, 0.85);
      dots(g, [[-82, 1], [-70, 5], [-58, 8], [-46, 8], [-34, 8], [-22, 6]], 0.9);
      dots(g, [[-12, -5], [-24, -7], [-36, -8], [-48, -6]], 0.75);
      g.setAngle(from);
      if (!this.still) this.tweens.add({ targets: g, angle: to, duration: 420, yoyo: true, repeat: -1, delay, ease: 'Sine.InOut' });
      return g;
    };
    const far = wing(46, 18, 0);
    const people = riders.map(([kind, x]) => this.rider(kind, s(x), s(-5), 0.52));
    const body = this.add.graphics();
    body.fillStyle(SHADOW, 0.94);
    // The tail fan, the body and neck, and the crowned head with its hooked beak.
    body.fillPoints(P([[-46, -7], [-68, -16], [-84, -14], [-76, -8], [-92, -6], [-78, -1], [-90, 4], [-72, 4], [-46, 3]]), true);
    body.fillPoints(P([[-50, -6], [-30, -12], [-6, -14], [14, -14], [26, -18], [34, -26], [40, -32], [48, -34], [55, -32], [60, -28], [68, -26], [73, -22], [69, -19.5], [63, -21], [58, -18], [50, -14], [40, -8], [28, 0], [10, 6], [-12, 8], [-34, 5], [-50, 2]]), true);
    body.fillPoints(P([[43, -33], [45, -42], [48.5, -36.5], [51.5, -45], [54, -36], [57.5, -40], [57, -31]]), true);
    // Talons tucked under him as he flies.
    body.lineStyle(s(2.2), SHADOW, 0.94);
    body.lineBetween(s(12), s(4), s(20), s(15));
    body.lineBetween(s(20), s(15), s(27), s(14));
    body.lineBetween(s(20), s(15), s(25), s(19));
    body.fillStyle(DYE.ochre, 0.6);
    body.fillPoints(P([[-40, -3], [-10, -9], [20, -10], [36, -18], [44, -26], [50, -26], [44, -14], [30, -4], [8, 2], [-20, 3]]), true);
    body.fillStyle(LIGHT, 0.88);
    dots(body, [[56, -28]], 1.2);
    dots(body, [[48, -37], [51.5, -40]], 0.7);
    dots(body, [[-62, -9], [-74, -10], [-70, -3], [-80, -4], [-66, 1]], 0.8);
    dots(body, [[38, -20], [33, -14], [26, -8], [16, -4], [4, -2], [-8, -1], [-20, -2], [-32, -2]], 0.8);
    const near = wing(-6, -30, 210);
    return this.add.container(0, 0, [far, ...people, body, near]);
  }

  // The flying chariot: a carved pavilion on a swan-prowed boat, riding on clouds, with `riders` ([kind, x]) aboard.
  // About 1.4 puppets long.
  chariot(riders) {
    const k = this.P / 100;
    const s = (v) => v * k;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const back = this.add.graphics();
    // Clouds under it, then the pavilion: pillars, a lintel, a stepped roof with a dome, and two flags.
    back.fillStyle(SHADOW, 0.32);
    for (const [cx, cy, rx, ry] of [[-52, 0, 18, 7], [-28, 4, 22, 8], [2, 3, 24, 8], [30, 5, 20, 8], [52, 1, 15, 6], [-12, 9, 30, 6]]) back.fillEllipse(s(cx), s(cy), s(rx * 2), s(ry * 2));
    back.fillStyle(SHADOW, 0.92);
    for (const px of [-46, -26, -2, 18, 40]) back.fillRect(s(px - 1.3), s(-72), s(2.6), s(56));
    back.fillRect(s(-52), s(-78), s(98), s(6));
    back.fillPoints(P([[-46, -78], [40, -78], [32, -88], [-38, -88]]), true);
    back.fillPoints(P([[-34, -88], [28, -88], [20, -97], [-26, -97]]), true);
    back.fillPoints(P([[-22, -97], [16, -97], [10, -104], [-16, -104]]), true);
    back.beginPath();
    back.arc(s(-3), s(-104), s(10), Math.PI, 0);
    back.closePath();
    back.fillPath();
    back.fillRect(s(-3.8), s(-122), s(1.6), s(8));
    back.fillCircle(s(-3), s(-123), s(2.2));
    for (const [fx, dir] of [[-50, -1], [44, 1]]) {
      back.fillRect(s(fx - 0.7), s(-96), s(1.4), s(18));
      back.fillPoints(P([[fx, -96], [fx + dir * 9, -93], [fx, -90]]), true);
    }
    back.fillStyle(LIGHT, 0.8);
    for (let i = 0; i < 12; i++) back.fillCircle(s(-47 + i * 8), s(-75), s(1));
    for (const [y, x0, n] of [[-83, -30, 8], [-92.5, -20, 5], [-100.5, -10, 2]]) for (let i = 0; i < n; i++) back.fillCircle(s(x0 + i * 8), s(y), s(1));
    const people = riders.map(([kind, x]) => this.rider(kind, s(x), s(-6), 0.5));
    // The boat: a curled tail at the back, a swan's neck and head at the prow, and a dyed band with holes.
    const hull = this.add.graphics();
    hull.fillStyle(SHADOW, 0.94);
    hull.fillPoints(P([[-62, -38], [-58, -28], [-52, -22], [48, -22], [54, -28], [58, -40], [60, -50], [64, -56], [71, -56], [80, -52], [72, -50], [67, -46], [65, -34], [61, -18], [52, -6], [-48, -6], [-58, -14], [-64, -24], [-68, -34], [-66, -42]]), true);
    hull.fillStyle(DYE.red, 0.7);
    hull.fillPoints(P([[-54, -19], [52, -19], [50, -12], [-52, -12]]), true);
    hull.fillStyle(LIGHT, 0.85);
    for (let i = 0; i < 13; i++) hull.fillCircle(s(-48 + i * 8), s(-15.5), s(0.9));
    hull.fillCircle(s(69), s(-53), s(1.1));
    hull.fillCircle(s(-63), s(-36), s(1));
    hull.fillCircle(s(-60), s(-28), s(1));
    return this.add.container(0, 0, [back, ...people, hull]);
  }

  // The forest's trees, grown and painted once as the show starts, so the forest scene doesn't pause to paint them.
  // Each stands at a fraction `at` of the way across the cloth, with a box: how far it reaches from its foot
  // ([left, right, up, down], in puppet units, measured from what it grows; anything past the cloth's edges is left
  // out). `detail` is how finely it is painted and `blur` how soft its edges are: trees held further back from the
  // cloth, nearer the lamps, cast softer shadows.
  paintForest() {
    const span = this.S.w / (this.P / 100); // the cloth's width, in puppet units
    const trees = {
      far: { at: 0, box: [0, span, 140, 0.5], detail: 0.5, blur: 2.6, seed: 11, paint: (p) => distantForest(p, span) },
      palm: { at: 0.045, box: [32, 58, 190, 0.5], detail: 1, blur: 0.4, seed: 3, paint: (p) => palm(p, { height: 158, lean: 14 }) },
      tall: { at: 0.37, box: [92, 88, 184, 0.5], detail: 1, blur: 0.4, seed: 7, paint: (p) => broadleaf(p, { trunk: 80, reach: 31, limbs: 4, clump: 8.5 }) },
      banyan: { at: 0.86, box: [118, 144, 146, 0.5], detail: 1, blur: 0.4, seed: 5, paint: (p) => banyan(p, { left: 0.8 }) },
      ground: { at: 0, box: [0, span, 18, 0.5], detail: 1, blur: 0.3, seed: 9, paint: (p) => undergrowth(p, span) },
    };
    this.woods = {};
    for (const [name, t] of Object.entries(trees)) {
      const [left, right, up, down] = t.box;
      const box = [Math.min(left, t.at * span + 4), Math.min(right, (1 - t.at) * span + 4), up, down];
      this.woods[name] = { ...this.forestTexture(`forest-${name}`, { ...t, box }), at: t.at };
    }
    this.events.once('shutdown', () => Object.values(this.woods).forEach((t) => this.textures.remove(t.key)));
  }

  // Paints a tree into a texture, white (the scene tints it), with its foot at (ox, oy). It is painted sharp on a
  // spare canvas, then copied across as a blurred shadow if it should be soft.
  forestTexture(key, { box: [left, right, top, bottom], detail, blur, seed, paint }) {
    const res = Math.min(RES, 2) * detail;
    const unit = (this.P / 100) * res; // texture pixels per puppet unit
    const pad = blur * 3 + 2;
    const W = Math.ceil((left + right + 2 * pad) * unit);
    const H = Math.ceil((top + bottom + 2 * pad) * unit);
    const ox = (left + pad) * unit;
    const oy = (top + pad) * unit;
    const sharp = document.createElement('canvas');
    sharp.width = W;
    sharp.height = H;
    const c = sharp.getContext('2d');
    c.setTransform(unit, 0, 0, unit, ox, oy);
    // Nothing shows below the ground: roots, round trunk ends and drooping ferns stop at it.
    c.beginPath();
    c.rect(-left - pad, -top - pad, left + right + 2 * pad, top + pad + 0.5);
    c.clip();
    c.fillStyle = '#fff';
    c.strokeStyle = '#fff';
    paint(new Shadow(c, seed));
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, W, H);
    const ctx = tex.getContext();
    if (blur > 0) {
      // The canvas's own shadow, thrown back onto it from a copy drawn just out of sight, is the blurred tree.
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = blur * unit;
      ctx.shadowOffsetX = W;
      ctx.drawImage(sharp, -W, 0);
    } else {
      ctx.drawImage(sharp, 0, 0);
    }
    tex.refresh();
    return { key, W, H, ox, oy, res };
  }

  // A painted tree standing in its place on the ground (or at x, y, `scale` times its size), as a shadow `alpha`
  // dark. Near trees sway a little in the wind (`sway` degrees), rocking from their foot.
  forestShadow(name, alpha, sway = 0, { x, y, scale = 1 } = {}) {
    const t = this.woods[name];
    const img = this.add
      .image(x ?? this.at(t.at), y ?? this.floor, t.key)
      .setOrigin(t.ox / t.W, t.oy / t.H)
      .setScale(scale / t.res)
      .setTint(SHADOW)
      .setAlpha(alpha);
    if (sway && !this.still) {
      img.setAngle(-sway);
      this.tweens.add({ targets: img, angle: sway, duration: Phaser.Math.Between(2400, 3400), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    return img;
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

  // A clay diya's shadow standing at (x, y), unlit until lamp.light(): then its flame grows and flickers, glowing
  // through the cloth, and it throws a pool of warm light on the cloth around it (`pool`, for the pools layer).
  // size 1 is about a fifth of a puppet wide.
  diya(x, y, size = 1) {
    const u = (this.P / 210) * size;
    const s = (v) => v * u;
    const P = (list) => list.map(([px, py]) => ({ x: s(px), y: s(py) }));
    const g = this.add.graphics();
    // The bowl, pinched into a spout at the right, on a small foot.
    g.fillStyle(SHADOW, 0.95);
    g.fillPoints(P([[-19, -11], [12, -11], [17, -12.5], [23, -15], [20, -10], [14, -4.5], [7, -2], [-7, -2], [-13, -4.5], [-17, -8]]), true);
    g.fillRect(s(-7), s(-2.5), s(14), s(2.5));
    g.fillRect(s(-10), s(-1.2), s(20), s(1.2));
    // A band of dyed clay round the bowl, and a row of punched holes under it.
    g.fillStyle(DYE.ochre, 0.8);
    g.fillPoints(P([[-16.5, -9], [13, -9], [11, -6.5], [-14.5, -6.5]]), true);
    g.fillStyle(LIGHT, 0.9);
    for (let i = 0; i < 6; i++) g.fillCircle(s(-10.5 + i * 4.2), s(-4.2), s(0.8));

    // The flame on the wick at the spout: layers of orange, yellow and white, with a halo where it shines through.
    const fx = s(19.5);
    const fy = s(-14);
    const halo = this.glow(fx, fy - s(6), s(48), s(56), FLAME.halo, 0);
    const flame = this.add.graphics({ x: fx, y: fy });
    const drop = (h, r, colour, a) => {
      flame.fillStyle(colour, a);
      flame.fillCircle(0, -r, r);
      flame.fillTriangle(-r * 0.97, -r * 1.25, r * 0.97, -r * 1.25, 0, -h);
    };
    drop(s(17), s(4.6), FLAME.outer, 0.95);
    drop(s(12.5), s(3.2), FLAME.inner, 1);
    drop(s(7.5), s(1.8), FLAME.core, 1);
    flame.setScale(0);
    const pool = this.glow(x + fx, y + fy - s(8), s(200), s(170), FLAME.pool, 0);
    const lamp = this.add.container(x, y, [g, halo, flame]);

    const R = Phaser.Math;
    const flicker = (targets, props, min, max) => this.tweens.add({ targets, ...props, duration: R.Between(min, max), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    lamp.light = () => {
      if (this.still) {
        flame.setScale(1);
        halo.setAlpha(0.85);
        pool.setAlpha(0.42);
        return;
      }
      this.tweens.add({
        targets: flame,
        scale: 1,
        duration: 380,
        ease: 'Back.Out',
        onComplete: () => {
          flicker(flame, { scaleY: { from: 0.9, to: 1.1 }, scaleX: { from: 1.05, to: 0.95 } }, 130, 240);
          flicker(flame, { angle: { from: -5, to: 5 } }, 420, 700);
          flicker(halo, { alpha: { from: 0.7, to: 0.95 } }, 150, 280);
        },
      });
      this.tweens.add({ targets: halo, alpha: 0.85, duration: 380 });
      this.tweens.add({ targets: pool, alpha: 0.42, duration: 900, ease: 'Sine.Out', onComplete: () => flicker(pool, { alpha: { from: 0.36, to: 0.46 } }, 200, 380) });
    };
    return { lamp, pool };
  }

  // A soft round glow, added to the light of whatever is under it.
  glow(x, y, w, h, tint, alpha) {
    return this.add.image(x, y, this.glowTexture()).setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setDisplaySize(w, h).setAlpha(alpha);
  }

  glowTexture() {
    const key = 'soft-glow';
    if (this.textures.exists(key)) return key;
    const N = 256;
    const tex = this.textures.createCanvas(key, N, N);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    for (const [at, a] of [[0, 1], [0.18, 0.78], [0.4, 0.36], [0.65, 0.12], [1, 0]]) grad.addColorStop(at, `rgba(255,255,255,${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, N, N);
    tex.refresh();
    return key;
  }

  // The cloth as the lamps behind it light it: warm in the middle, deep orange at the edges, with soft folds and a
  // shade under the valance.
  clothTexture() {
    const key = 'puppet-cloth';
    if (this.textures.exists(key)) return key;
    const W = 1024;
    const H = 512;
    const tex = this.textures.createCanvas(key, W, H);
    const ctx = tex.getContext();
    const base = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, W * 0.62);
    base.addColorStop(0, css(CLOTH.mid));
    base.addColorStop(0.5, css(CLOTH.warm));
    base.addColorStop(1, css(CLOTH.edge));
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    for (const f of [0.17, 0.42, 0.58, 0.83]) {
      const fold = ctx.createLinearGradient(W * f - 36, 0, W * f + 36, 0);
      fold.addColorStop(0, 'rgba(90,40,10,0)');
      fold.addColorStop(0.5, 'rgba(90,40,10,0.08)');
      fold.addColorStop(1, 'rgba(90,40,10,0)');
      ctx.fillStyle = fold;
      ctx.fillRect(W * f - 36, 0, 72, H);
    }
    const top = ctx.createLinearGradient(0, 0, 0, H * 0.24);
    top.addColorStop(0, 'rgba(60,20,5,0.35)');
    top.addColorStop(1, 'rgba(60,20,5,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, H * 0.24);
    const corners = ctx.createRadialGradient(W / 2, H * 0.55, W * 0.4, W / 2, H * 0.55, W * 0.72);
    corners.addColorStop(0, 'rgba(50,15,0,0)');
    corners.addColorStop(1, 'rgba(50,15,0,0.35)');
    ctx.fillStyle = corners;
    ctx.fillRect(0, 0, W, H);
    tex.refresh();
    return key;
  }
}
