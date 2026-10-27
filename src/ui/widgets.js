import { BLEED, BUTTON_HEIGHT, COLOR, STAGE, css } from '../theme.js';
import { fontSize, makeText } from './text.js';
import { Button } from './Button.js';
import { settings, progress } from '../state.js';
import { speak } from '../voice.js';

export const HEADER_H = 84;

// An image from assets/art scaled to a display width in stage pixels.
export function art(scene, x, y, key, width) {
  const img = scene.add.image(x, y, key);
  img.setScale(width / img.width);
  return img;
}

// An ingredient's art for a slot of the given width. The illustrated ones are wider than they are tall,
// so `artScale` draws them a little larger to look the same size as the water jar.
export function ingredientArt(scene, x, y, ing, width) {
  return art(scene, x, y, ing.art, width * (ing.artScale ?? 1));
}

// Full-body Paati, standing with her feet at (x, bottom), sized by height (the poses differ in width).
export function paati(scene, x, bottom, key, height) {
  const img = scene.add.image(x, bottom, key).setOrigin(0.5, 1);
  img.setScale(height / img.height);
  return img;
}

// Silk-border trim: two thin gold lines around a Marigold or Rani pink band.
export function silkTrim(scene, y, band = COLOR.marigold500, x = 0, w = STAGE.width) {
  const g = scene.add.graphics();
  g.fillStyle(COLOR.yellow500, 1);
  g.fillRect(x, y, w, 2);
  g.fillStyle(band, 1);
  g.fillRect(x, y + 4, w, 5);
  g.fillStyle(COLOR.yellow500, 1);
  g.fillRect(x, y + 11, w, 2);
  return g;
}

// Navbar Top: back on the left, title in the middle, then chapter diyas, Full screen (where the browser allows it)
// and help on the right.
export function header(scene, { title, onBack }) {
  const dark = scene.dark;
  const g = scene.add.graphics();
  g.fillStyle(dark ? 0x000000 : COLOR.white, dark ? 0.2 : 0.85);
  g.fillRect(-BLEED, 0, STAGE.width + 2 * BLEED, HEADER_H);
  silkTrim(scene, HEADER_H, scene.mood.band, -BLEED, STAGE.width + 2 * BLEED);
  new Button(scene, 50, HEADER_H / 2, { variant: 'icon', icon: 'back', onClick: onBack ?? (() => scene.toTitle()) });
  // The title is centred, but a long one moves left to clear the chapter diyas, and gets smaller only if it still
  // doesn't fit between them and the back button.
  const diyasX = 920;
  const room = [50 + BUTTON_HEIGHT.giant / 2 + 20, diyasX - 18 - 20];
  const t = makeText(scene, STAGE.width / 2, HEADER_H / 2, title, 'h5', { dark, origin: 0.5 });
  const fit = room[1] - room[0];
  if (t.width > fit) t.setFontSize(Math.floor((fontSize('h5') * fit) / t.width));
  t.setX(Math.min(STAGE.width / 2, room[1] - t.width / 2));
  diyaRow(scene, diyasX, HEADER_H / 2, progress.chaptersDone.length);
  const helpX = STAGE.width - 50;
  if (scene.canFullscreen?.()) {
    // Icon buttons are drawn at the default (giant) height, and are as wide as they are tall.
    const fs = new Button(scene, helpX - BUTTON_HEIGHT.giant - 12, HEADER_H / 2, { variant: 'icon', icon: 'fullscreen', onClick: () => scene.toggleFullscreen() });
    const sync = () => fs.setIcon(scene.scale.isFullscreen ? 'fullscreen-exit' : 'fullscreen');
    scene.scale.on('enterfullscreen', sync);
    scene.scale.on('leavefullscreen', sync);
    scene.events.once('shutdown', () => {
      scene.scale.off('enterfullscreen', sync);
      scene.scale.off('leavefullscreen', sync);
    });
    sync();
  }
  new Button(scene, helpX, HEADER_H / 2, { variant: 'icon', icon: 'help', onClick: () => scene.openSettings() });
}

// Page Control: one diya per chapter; the flame turns on when the chapter is done.
export function diyaRow(scene, x, y, lit, count = 4, size = 36) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const d = art(scene, x + i * (size + 8), y, i < lit ? 'diya' : 'diya-unlit', size);
    if (i >= lit) d.setAlpha(scene.dark ? 0.7 : 0.55);
    items.push(d);
  }
  return items;
}

// Progress Bar that fills with gold as questions are answered.
export class ProgressBar {
  constructor(scene, x, y, width, total) {
    Object.assign(this, { scene, x, y, width, total, value: 0 });
    this.g = scene.add.graphics();
    this.draw(0);
  }

  draw(v) {
    const { g, x, y, width } = this;
    g.clear();
    g.fillStyle(this.scene.dark ? COLOR.white : COLOR.grey900, this.scene.dark ? 0.18 : 0.1);
    g.fillRoundedRect(x, y, width, 12, 6);
    if (v > 0) {
      g.fillStyle(COLOR.yellow500, 1);
      g.fillRoundedRect(x, y, Math.max(12, (width * v) / this.total), 12, 6);
    }
  }

  set(v) {
    const from = this.value;
    this.value = v;
    if (settings.reduceMotion) return this.draw(v);
    this.scene.tweens.addCounter({ from, to: v, duration: 400, ease: 'Cubic.Out', onUpdate: (tw) => this.draw(tw.getValue()) });
  }
}

const TONES = {
  plain: { accent: COLOR.yellow500 },
  success: { accent: COLOR.green600, label: 'Well done', labelColor: COLOR.green700 },
  info: { accent: COLOR.info600, label: "Paati's hint", labelColor: 0x006cb8 },
  warning: { accent: COLOR.warning600, label: 'Not quite', labelColor: 0x8a5b00 },
};

// Paati's speech bubble: Avatar XXXL (96) + an Alert-style bubble (Success, Info or Warning). Never red.
export class PaatiBubble extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, { avatar = true } = {}) {
    super(scene, x, y);
    this.bw = width;
    this.avatar = avatar;
    this.g = scene.add.graphics();
    this.add(this.g);
    if (avatar) {
      const ring = scene.add.graphics();
      ring.fillStyle(COLOR.yellow300, 1);
      ring.fillCircle(48, 48, 48);
      this.add([ring, art(scene, 48, 48, 'paati-avatar', 96)]);
    }
    this.tx = (avatar ? 112 : 0) + 34;
    this.labelText = makeText(scene, this.tx, 18, '', 'b3', { weight: 700 });
    this.body = makeText(scene, this.tx, 18, '', 's1', { width: width - this.tx - 24 });
    this.add([this.labelText, this.body]);
    scene.add.existing(this);
  }

  say(str, tone = 'plain') {
    speak(str);
    const t = TONES[tone];
    let y = 18;
    if (t.label) {
      this.labelText.setText(t.label.toUpperCase()).setColor(css(t.labelColor)).setVisible(true).setY(y);
      y += this.labelText.height + 2;
    } else {
      this.labelText.setVisible(false);
    }
    this.body.setText(str).setY(y);
    const h = Math.max(96, y + this.body.height + 18);
    const bx = this.avatar ? 112 : 0;
    const w = this.bw - bx;
    const g = this.g;
    g.clear();
    g.fillStyle(0x000000, 0.08);
    g.fillRoundedRect(bx, 4, w, h, 24);
    g.fillStyle(COLOR.white, 1);
    g.fillRoundedRect(bx, 0, w, h, 24);
    if (this.avatar) g.fillTriangle(bx + 2, 32, bx - 14, 48, bx + 2, 64);
    g.fillStyle(t.accent, 1);
    g.fillRoundedRect(bx + 14, 16, 6, h - 32, 3);
    this.bubbleHeight = h;
    if (!settings.reduceMotion) {
      this.scene.tweens.add({ targets: this.body, alpha: { from: 0, to: 1 }, duration: 220 });
    }
    return this;
  }
}

// White card, radius 24, with optional kolam corners in gold.
export function card(scene, x, y, w, h, { kolam = false, color = COLOR.white } = {}) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.08);
  g.fillRoundedRect(x, y + 6, w, h, 24);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, w, h, 24);
  if (kolam) {
    kolamCorner(g, x, y, 1, 1);
    kolamCorner(g, x + w, y, -1, 1);
    kolamCorner(g, x, y + h, 1, -1);
    kolamCorner(g, x + w, y + h, -1, -1);
  }
  return g;
}

// A small kolam flourish tucked into a card corner (never behind text).
export function kolamCorner(g, x, y, sx, sy, color = COLOR.yellow500) {
  const cx = x + sx * 16;
  const cy = y + sy * 16;
  const start = sx > 0 ? (sy > 0 ? 0 : 1.5 * Math.PI) : sy > 0 ? 0.5 * Math.PI : Math.PI;
  g.lineStyle(2, color, 0.9);
  for (const r of [10, 18]) {
    g.beginPath();
    g.arc(cx, cy, r, start, start + Math.PI / 2);
    g.strokePath();
  }
  g.fillStyle(color, 1);
  g.fillCircle(cx, cy, 2.5);
  g.fillCircle(cx + sx * 26, cy, 2);
  g.fillCircle(cx, cy + sy * 26, 2);
}

// Badge & Chip. tone: 'success' (Collected) | 'muted'.
export function chip(scene, x, y, label, tone = 'success') {
  const t = makeText(scene, 0, 0, label, 'b3', { weight: 600, color: tone === 'success' ? COLOR.green700 : COLOR.grey600, origin: 0.5 });
  const w = t.width + 28;
  const h = t.height + 10;
  const g = scene.add.graphics();
  g.fillStyle(tone === 'success' ? 0xe3f4e7 : COLOR.grey100, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  return scene.add.container(x, y, [g, t]);
}

function starPoints(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad });
  }
  return pts;
}

// Stars always come with words (the caller adds the label).
export function starRow(scene, x, y, earned, size = 48) {
  const g = scene.add.graphics();
  for (let i = 0; i < 3; i++) {
    const cx = x + (i - 1) * (size + 14);
    const pts = starPoints(cx, y, size / 2, size / 4.6);
    if (i < earned) {
      g.fillStyle(COLOR.yellow500, 1);
      g.fillPoints(pts, true);
      g.lineStyle(2, 0xc77800, 1);
    } else {
      g.lineStyle(3, COLOR.grey300, 1);
    }
    g.strokePoints(pts, true);
  }
  return g;
}

// Tooltip: Paati's one-line note, pointing down at (x, y). Fades after a few seconds.
export function tooltip(scene, x, y, str, maxWidth = 320) {
  const t = makeText(scene, 0, 0, str, 'b1', { color: COLOR.white, width: maxWidth - 32, weight: 500 });
  const w = Math.min(maxWidth, t.width + 32);
  const h = t.height + 24;
  const left = Phaser.Math.Clamp(x - w / 2, 12, STAGE.width - w - 12);
  t.setPosition(16, 12);
  const g = scene.add.graphics();
  g.fillStyle(COLOR.grey900, 0.94);
  g.fillRoundedRect(0, 0, w, h, 12);
  g.fillTriangle(x - left - 10, h, x - left + 10, h, x - left, h + 10);
  const c = scene.add.container(left, y - h - 10, [g, t]).setDepth(500);
  scene.time.delayedCall(4000, () => {
    if (!c.active) return;
    if (settings.reduceMotion) c.destroy();
    else scene.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
  });
  return c;
}

const SPARK_COLORS = [COLOR.yellow500, COLOR.yellow300, COLOR.marigold500, COLOR.rani500];

// Short burst of sparkles; nothing when Reduce motion is on.
export function sparkle(scene, x, y, { count = 14, radius = 80, depth = 600 } = {}) {
  if (settings.reduceMotion) return;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const r = radius * (0.6 + Math.random() * 0.5);
    const dot = scene.add.circle(x, y, 3 + Math.random() * 4, SPARK_COLORS[i % SPARK_COLORS.length]).setDepth(depth);
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(a) * r,
      y: y + Math.sin(a) * r,
      alpha: 0,
      scale: 0.4,
      duration: 650 + Math.random() * 250,
      ease: 'Cubic.Out',
      onComplete: () => dot.destroy(),
    });
  }
}

// ---- Firecrackers: rockets that whoosh up and burst into colour ----------------------------------

const BURST_PALETTES = [
  [COLOR.rani500, COLOR.marigold500, COLOR.yellow500],
  [COLOR.green600, COLOR.yellow500, COLOR.marigold500],
  [COLOR.primary500, COLOR.rani500, COLOR.yellow300],
  [COLOR.marigold500, 0xe53935, COLOR.yellow300],
];

function sparkTexture(scene) {
  if (scene.textures.exists('spark')) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(16, 16, 16);
  g.generateTexture('spark', 32, 32);
  g.destroy();
}

function burstAt(scene, x, y, depth) {
  const tint = BURST_PALETTES[Math.floor(Math.random() * BURST_PALETTES.length)];
  const burst = scene.add
    .particles(0, 0, 'spark', {
      speed: { min: 150, max: 360 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 650, max: 1050 },
      gravityY: 260,
      scale: { start: 0.42, end: 0 },
      alpha: { start: 1, end: 0 },
      tint,
      emitting: false,
    })
    .setDepth(depth);
  burst.explode(44, x, y);
  // A second, smaller crackle of glitter a moment later.
  scene.time.delayedCall(200, () => burst.active && burst.explode(16, x, y));
  scene.time.delayedCall(1500, () => burst.destroy());
}

// Launch one rocket from the bottom of the screen to (x, y), where it bursts.
export function rocket(scene, x, y, { depth = 800 } = {}) {
  if (settings.reduceMotion) return;
  sparkTexture(scene);
  const head = scene.add.circle(x + Phaser.Math.Between(-30, 30), 740, 5, COLOR.yellow300).setDepth(depth);
  const trail = scene.add
    .particles(0, 0, 'spark', {
      follow: head,
      speed: { min: 8, max: 30 },
      lifespan: 360,
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [COLOR.yellow300, COLOR.marigold500],
      frequency: 16,
      quantity: 2,
    })
    .setDepth(depth - 1);
  scene.tweens.add({
    targets: head,
    x,
    y,
    duration: 520,
    ease: 'Cubic.Out',
    onComplete: () => {
      head.destroy();
      trail.stop();
      burstAt(scene, x, y, depth);
      scene.time.delayedCall(500, () => trail.destroy());
    },
  });
}

// A short celebration: three rockets across the sky, a beat apart. Nothing when Reduce motion is on.
export function celebrate(scene, spots = [[300, 210], [640, 150], [980, 220]]) {
  if (settings.reduceMotion) return;
  spots.forEach(([x, y], i) => scene.time.delayedCall(i * 170, () => rocket(scene, x, y)));
}

// Rockets every so often across the visible sky (Finale).
export function fireworks(scene, { top = 120, bottom = 420 } = {}) {
  if (settings.reduceMotion) return null;
  return scene.time.addEvent({
    delay: 1100,
    loop: true,
    callback: () => {
      const { left, right } = scene.viewBounds?.() ?? { left: 0, right: STAGE.width };
      rocket(scene, left + 80 + Math.random() * (right - left - 160), top + Math.random() * (bottom - top), { depth: 2 });
    },
  });
}

// The festive doorway valance across the top (Title and Finale): mango leaves hanging from a chain with brass bells,
// a dense band of marigolds, and marigold swags with short rose drops between them.
export function garland(scene, { x0 = -BLEED, x1 = STAGE.width + BLEED } = {}) {
  const rnd = new Phaser.Math.RandomDataGenerator(['valance']);
  const objs = [];
  const chainY = 12;
  const chain = scene.add.graphics();
  chain.lineStyle(2, 0xb8860b, 1);
  chain.lineBetween(x0, chainY, x1, chainY);
  objs.push(chain);
  for (let x = x0 + 10; x < x1; x += 23) {
    objs.push(art(scene, x, chainY - 2, 'mango-leaf', 24).setOrigin(0.5, 0).setAngle(rnd.realInRange(-9, 9)));
  }
  // Swag anchors every 256 px, lined up with the stage edges, reaching into the extra width on wide screens.
  const anchors = [];
  for (let x = Math.floor(x0 / 256) * 256; x <= x1 + 255; x += 256) anchors.push(x);
  // Swags of orange marigolds, sagging between the anchors.
  anchors.slice(0, -1).forEach((a, k) => {
    const b = anchors[k + 1];
    const mid = (a + b) / 2;
    const n = 14;
    for (let j = 1; j < n; j++) {
      const t = j / n;
      const x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * mid + t * t * b;
      const y = chainY + 4 + 2 * (1 - t) * t * 2 * 44;
      objs.push(flowerAt(scene, x, y, 24, j % 3 === 0 ? 'D' : 'O', rnd));
    }
  });
  // The straight band along the chain, mostly yellow.
  for (let x = x0 + 6, i = 0; x < x1 + 12; x += 17, i++) objs.push(flowerAt(scene, x, chainY, 22, 'YYYO'[i % 4], rnd));
  // Short drops with a rose at each inner anchor, and brass bells.
  anchors.slice(1, -1).forEach((ax, k) => {
    objs.push(marigoldStrand(scene, ax, chainY + 4, 44, { size: 20, pattern: 'YO', tassel: false, seed: 900 + k }));
    objs.push(art(scene, ax, chainY + 58, 'rose', 18));
    objs.push(art(scene, ax + 22, chainY + 4, 'brass-bell', 14).setOrigin(0.5, 0));
    objs.push(art(scene, ax - 22, chainY + 4, 'brass-bell', 14).setOrigin(0.5, 0));
  });
  return objs;
}

// Mango-leaf toran: glossy leaves hanging from a string with small marigolds, above the kitchen on the Cook screen.
export function toran(scene, y, x0 = -BLEED, x1 = STAGE.width + BLEED) {
  const rnd = new Phaser.Math.RandomDataGenerator(['toran']);
  const string = scene.add.graphics();
  string.lineStyle(2, 0xb8860b, 1);
  string.lineBetween(x0, y, x1, y);
  const objs = [string];
  for (let x = x0 + 8; x < x1; x += 15) objs.push(art(scene, x, y - 1, 'mango-leaf', 11).setOrigin(0.5, 0).setAngle(rnd.realInRange(-8, 8)));
  for (let x = x0 + 24, i = 0; x < x1; x += 64, i++) objs.push(flowerAt(scene, x, y + 2, 16, i % 2 ? 'Y' : 'O', rnd));
  return objs;
}

// Warm lamp glow behind Paati: a soft sunburst of marigold and gold rays with golden rings.
export function glow(scene, x, y, r = 260) {
  const g = scene.add.graphics();
  const rays = 20;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    g.fillStyle(i % 2 ? COLOR.yellow300 : COLOR.marigold500, i % 2 ? 0.2 : 0.08);
    g.slice(x, y, r * 1.2, a, a + (Math.PI * 2) / rays);
    g.fillPath();
  }
  for (let i = 5; i >= 1; i--) {
    g.fillStyle(COLOR.yellow300, 0.12);
    g.fillCircle(x, y, (r * i) / 5);
  }
  return g;
}

// A soft circle of warm lamp light, drawn around (0, 0) of a graphics placed at (x, y) so it can pulse.
export function lampGlow(scene, x, y, r) {
  const g = scene.add.graphics({ x, y });
  const rings = [
    [1, 0.08],
    [0.75, 0.12],
    [0.5, 0.18],
    [0.28, 0.26],
  ];
  for (const [k, a] of rings) {
    g.fillStyle(COLOR.yellow300, a);
    g.fillCircle(0, 0, r * k);
  }
  return g;
}

// Warm bokeh: soft discs of lamp light scattered over an area (seeded, so every visit looks the same).
export function bokeh(scene, count, { area = [-BLEED, 96, STAGE.width + BLEED, STAGE.height], seed = 'bokeh', strength = 1 } = {}) {
  const rnd = new Phaser.Math.RandomDataGenerator([seed]);
  const g = scene.add.graphics();
  const colours = [COLOR.yellow300, COLOR.marigold500, COLOR.yellow500, COLOR.yellow300, COLOR.rani500];
  const [x0, y0, x1, y1] = area;
  for (let i = 0; i < count; i++) {
    const x = rnd.between(x0, x1);
    const y = rnd.between(y0, y1);
    const r = rnd.between(8, 30);
    const c = colours[i % colours.length];
    for (let k = 4; k >= 1; k--) {
      g.fillStyle(c, 0.045 * strength);
      g.fillCircle(x, y, (r * k) / 4);
    }
  }
  return g;
}

// A firework burst drawn in fine gold rays with sparkling tips (it twinkles unless Reduce motion is on).
export function burst(scene, x, y, r, colour = COLOR.yellow500) {
  const g = scene.add.graphics({ x, y });
  const rays = 22;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const len = r * (i % 2 ? 0.72 : 1);
    g.lineStyle(2, colour, 0.55);
    g.lineBetween(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22, Math.cos(a) * len, Math.sin(a) * len);
    g.fillStyle(i % 3 ? colour : COLOR.marigold500, 0.85);
    g.fillCircle(Math.cos(a) * len, Math.sin(a) * len, i % 2 ? 1.8 : 2.6);
  }
  g.fillStyle(COLOR.yellow300, 0.9);
  g.fillCircle(0, 0, r * 0.08);
  if (!settings.reduceMotion) {
    scene.tweens.add({ targets: g, scale: { from: 0.92, to: 1.06 }, alpha: { from: 1, to: 0.6 }, duration: 900 + (x % 5) * 120, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
  return g;
}

// ---- Marigold garlands and mango leaves (art in assets/art, generated by a script) ----------------

const FLOWER = { O: 'marigold-orange', Y: 'marigold-yellow', D: 'marigold-deep' };
// Colour orders for strands, as in real garlands: pairs of orange and yellow, alternating, or solid runs.
const PATTERNS = { pairs: 'OOYY', alt: 'OY', orange: 'O', yellow: 'Y', deep: 'DO' };

function flowerAt(scene, x, y, size, kind, rnd) {
  const img = scene.add.image(x, y, FLOWER[kind]);
  img.setScale((size * rnd.realInRange(0.94, 1.06)) / img.width);
  img.setAngle(rnd.between(0, 359));
  return img;
}

// One hanging marigold strand: fluffy flowers packed tight on a thread, with a jasmine-and-rose tassel at the end.
// It is a container anchored at the top, so the whole strand can sway.
export function marigoldStrand(scene, x, top, length, { size = 26, pattern = 'pairs', tassel = true, seed = x } = {}) {
  const rnd = new Phaser.Math.RandomDataGenerator([`strand-${seed}`]);
  const thread = scene.add.graphics();
  thread.lineStyle(1.5, 0x9c7a2a, 1);
  thread.lineBetween(0, 0, 0, length);
  const kids = [thread];
  const order = PATTERNS[pattern] ?? pattern;
  let i = 0;
  for (let y = size * 0.45; y <= length; y += size * 0.78, i++) {
    kids.push(flowerAt(scene, rnd.realInRange(-1.5, 1.5), y, size, order[i % order.length], rnd));
  }
  if (tassel) kids.push(art(scene, 0, length + size * 0.2, 'jasmine-tassel', size * 1.3).setOrigin(0.5, 0.1));
  return scene.add.container(x, top, kids);
}

// Marigold strands hanging down the sides like a festive doorway. strands: [[x, top, length, pattern?], …].
// They sway gently unless Reduce motion is on.
export function hangingGarlands(scene, strands, { size = 26 } = {}) {
  return strands.map(([x, top, length, pattern = 'pairs'], s) => {
    const strand = marigoldStrand(scene, x, top, length, { size, pattern, seed: s * 31 + x });
    if (!settings.reduceMotion) {
      strand.angle = -1;
      scene.tweens.add({ targets: strand, angle: 1, duration: 1900 + s * 230, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    return strand;
  });
}

function star4(size) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.28;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return pts;
}

// Gold and pink twinkles that gently pulse (still when Reduce motion is on). spots: [[x, y, size], …]
export function twinkles(scene, spots) {
  return spots.map(([x, y, size], i) => {
    const g = scene.add.graphics({ x, y });
    g.fillStyle([COLOR.yellow500, COLOR.rani500, COLOR.marigold500][i % 3], 0.9);
    g.fillPoints(star4(size), true);
    if (!settings.reduceMotion) {
      scene.tweens.add({ targets: g, scale: 0.55, alpha: 0.5, duration: 700 + (i % 4) * 180, yoyo: true, repeat: -1, delay: i * 140, ease: 'Sine.InOut' });
    }
    return g;
  });
}

// A bright kolam on the floor at (x, y), seen at a low angle, with marigold petals scattered around it and lit
// diyas on its rim. Draw it before Paati so she stands at its back edge, inviting the player in.
export function doorstepKolam(scene, x, y, width, { diyas = 5 } = {}) {
  const squash = 0.36;
  const h = width * squash;
  const floor = scene.add.graphics();
  floor.fillStyle(0xf3dcb4, 0.5);
  floor.fillEllipse(x, y + 6, width * 1.16, h * 1.24);
  const kolam = scene.add.image(x, y, 'kolam-doorstep');
  kolam.setScale(width / kolam.width, (width / kolam.width) * squash);

  const rnd = new Phaser.Math.RandomDataGenerator(['kolam-petals']);
  const petals = scene.add.graphics();
  for (let i = 0; i < 28; i++) {
    const a = rnd.realInRange(0, Math.PI * 2);
    const k = rnd.realInRange(0.55, 0.68);
    petals.fillStyle([COLOR.marigold500, COLOR.yellow500, COLOR.rani500][i % 3], 0.9);
    petals.fillEllipse(x + Math.cos(a) * width * k, y + Math.sin(a) * h * k, rnd.between(8, 12), rnd.between(4, 6));
  }

  // Lamps around the front half of the rim, from right (0) to left (π), above Paati.
  const lamps = [];
  for (let i = 0; i < diyas; i++) {
    const a = diyas === 1 ? Math.PI / 2 : (Math.PI * i) / (diyas - 1);
    const lx = x + Math.cos(a) * width * 0.5;
    const ly = y + Math.sin(a) * h * 0.5;
    const halo = lampGlow(scene, lx, ly - 34, 34).setDepth(5);
    const lamp = art(scene, lx, ly, 'diya', 54).setOrigin(0.5, 0.9).setDepth(5);
    if (!settings.reduceMotion) {
      scene.tweens.add({ targets: lamp, alpha: 0.82, duration: 420 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      scene.tweens.add({ targets: halo, scale: 1.12, alpha: 0.75, duration: 520 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    lamps.push(halo, lamp);
  }
  return [floor, kolam, petals, ...lamps];
}

// ---- The welcome look: the Title and the last page share it ------------------------------------------

export const SERIF = '"EB Garamond", Garamond, Georgia, serif';
const MAROON = 0x800000;
const MAROON_EDGE = 0x4d0000;
const RAISE = 5;

// A heading in EB Garamond maroon, standing on a 5 px deeper-maroon edge so it looks raised (3D): the edge is the
// text repeated 1 to 5 px lower, behind it (raise: 0 for flat). Returns a container; textHeight is its full height.
export function raisedTitle(scene, x, y, str, { size = fontSize('h1') + 10, width = 640, align = 'left', origin = [0, 0], raise = RAISE } = {}) {
  const layer = (dy, colour) =>
    makeText(scene, 0, dy, str, 'h1', { width, color: colour, weight: 700, align, origin }).setFontFamily(SERIF).setFontSize(size);
  const edge = [];
  for (let d = raise; d >= 1; d--) edge.push(layer(d, MAROON_EDGE));
  const face = layer(0, MAROON);
  const title = scene.add.container(x, y, [...edge, face]);
  title.textHeight = face.height + raise;
  title.textWidth = face.width;
  return title;
}

// Text set one word at a time (wrapping at width) in a container, so each word can arrive on its own while the
// rest stay put. Words between *stars* are picked out in bold deep marigold. words lists them in reading order;
// textHeight is the full height.
export function wordText(scene, str, role, { width = 520, color, dark = scene.dark } = {}) {
  const make = (s, opts = {}) => makeText(scene, 0, 0, s, role, { color, dark, ...opts });
  const one = make('A');
  const two = make('A\nA');
  const pair = make('A A');
  const lineH = one.height;
  const advance = two.height - one.height;
  const space = pair.width - 2 * one.width;
  [one, two, pair].forEach((t) => t.destroy());
  const words = [];
  let x = 0;
  let y = 0;
  let marked = false;
  for (const raw of str.split(/\s+/).filter(Boolean)) {
    const opens = raw.startsWith('*');
    if (opens) marked = true;
    const hot = marked;
    if (raw.indexOf('*', opens ? 1 : 0) !== -1) marked = false;
    const t = make(raw.replaceAll('*', ''), hot ? { color: 0xb35600, weight: 700 } : {});
    if (x > 0 && x + t.width > width) {
      x = 0;
      y += advance;
    }
    t.setPosition(x, y);
    x += t.width + space;
    words.push(t);
  }
  const c = scene.add.container(0, 0, words);
  c.words = words;
  c.textHeight = y + lineH;
  return c;
}

// A Rani pink ribbon trimmed in gold, with a lit diya at each end, centred on (0, 0). bw and bh are its size.
// size is the text size in px; text with line breaks is centred, and the ribbon's ends round off to suit.
export function ribbon(scene, str, { size } = {}) {
  const t = makeText(scene, 0, 0, str, 'h5', { color: COLOR.white, weight: 700, origin: [0, 0.5], align: 'center' });
  if (size) t.setFontSize(size);
  const lines = str.split('\n').length;
  const lineH = t.height / lines;
  const d = Math.round(lineH * 1.15);
  const pad = 18;
  const gap = 10;
  const w = pad + d + gap + t.width + gap + d + pad;
  const h = Math.round(t.height + 24);
  const r = Math.min(h / 2, (lineH + 24) / 2);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.12);
  g.fillRoundedRect(0, 4, w, h, r);
  g.fillStyle(COLOR.rani500, 1);
  g.fillRoundedRect(0, 0, w, h, r);
  g.lineStyle(2, COLOR.yellow500, 1);
  g.strokeRoundedRect(4, 4, w - 8, h - 8, r - 4);
  t.setPosition(pad + d + gap, h / 2);
  const left = art(scene, pad + d / 2, h / 2 - 3, 'diya', d);
  const right = art(scene, w - pad - d / 2, h / 2 - 3, 'diya', d);
  const parts = [g, t, left, right];
  parts.forEach((o) => o.setPosition(o.x - w / 2, o.y - h / 2));
  const c = scene.add.container(0, 0, parts);
  c.bw = w;
  c.bh = h;
  return c;
}

// The welcome scene: warm bokeh and a golden sunburst, the marigold valance with strands pinned to the screen edges,
// firework sparkles, and Paati (in the given pose) at the back of a doorstep kolam with a golden lotus diya.
// Text and buttons go in the left column, x 96 to about 660.
export function welcomeStage(scene, poseKey) {
  bokeh(scene, 14, { area: [-BLEED, 90, 620, 700], seed: 'title-left', strength: 0.7 });
  bokeh(scene, 30, { area: [620, 90, 1280 + BLEED, 700], seed: 'title-right' });
  glow(scene, 930, 330, 300);
  burst(scene, 720, 150, 44);
  burst(scene, 1160, 172, 58, COLOR.marigold500);
  burst(scene, 1214, 440, 38);
  burst(scene, 652, 520, 30, COLOR.marigold500);
  garland(scene);
  const strands = hangingGarlands(scene, [
    [22, 14, 330],
    [56, 14, 220, 'alt'],
    [1224, 14, 220, 'alt'],
    [1258, 14, 330],
  ]);
  scene.onView(({ left, right }) => {
    [left + 22, left + 56, right - 56, right - 22].forEach((x, i) => (strands[i].x = x));
  });
  twinkles(scene, [
    [700, 150, 12],
    [1180, 140, 14],
    [760, 300, 9],
    [1200, 330, 10],
    [660, 470, 8],
    [1220, 520, 12],
    [560, 130, 9],
  ]);
  doorstepKolam(scene, 930, 634, 430);
  paati(scene, 930, 562, poseKey, 440);
  art(scene, 930, 706, 'lotus-diya', 204).setOrigin(0.5, 1).setDepth(4);
}
