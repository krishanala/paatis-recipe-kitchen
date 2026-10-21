import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, card, header, ingredientArt, sparkle, toran } from '../ui/widgets.js';
import { BUTTON_FONT, makeText } from '../ui/text.js';
import { ADD_ORDER, COOK_LINES as LINES, QUIZ_LINES, STEPS, RECIPE_NOTE, ingredient } from '../content.js';
import { BUTTON_HEIGHT, COLOR, COMPACT, lerpColor, pick } from '../theme.js';
import { NoteSheet } from '../ui/NoteSheet.js';
import { progress, settings, markChapterDone } from '../state.js';
import { WATER_ZONE, GOLDEN_ZONE, scoreDough, scoreTwist, scoreFry, fryColour, buildResult } from '../scoring.js';
import { drawSegment, paintRibbon, edgeOf } from '../draw.js';

// On phones (COMPACT) text is larger, so Paati's bubble needs more room at the bottom and the work area
// tucks up and shrinks a little to stay clear of it.
const BOWL = pick({ x: 830, y: 455, r: 105 }, { x: 830, y: 432, r: 92 }); // where things are dropped
// The wooden bowl art (bowl-back / bowl-front, 320 × 230, rim centre at 160, 62) and where its rim sits.
const BOWL_W = pick(304, 266);
const BS = BOWL_W / 320;
const RIM_Y = BOWL.y - 34;
const HEAP_H = 128 * BS; // the heap's height above the rim when the bowl is full
// The clay pitcher (pitcher.svg, 240 × 220) rests on its base beside the bowl, and lifts and tips to pour.
const PITCHER = pick(
  { x: 1050, y: 352, width: 140, pour: { x: 1010, y: 272, angle: -55 } },
  { x: 1040, y: 330, width: 128, pour: { x: 1000, y: 262, angle: -55 } },
);
const PAN = pick({ x: 830, y: 388, width: 400 }, { x: 830, y: 372, width: 340 });
const OIL_R = 134 * (PAN.width / 360) - 8; // the oil circle in pot-oil.svg, less a margin
// Hold to twist sits beside the pot, so the spiral stays in full view.
const TWIST_W = pick(200, 240);
const TWIST_BUTTON = { x: PAN.x + PAN.width / 2 + 24 + TWIST_W / 2, y: PAN.y, width: TWIST_W };
const PRESS = pick({ x: 960, y: 400, width: 300 }, { x: 960, y: 380, width: 280 }); // press-*.svg is 270 × 300
const RAW = 0xf3e2b8;
const RICE = 0xfbf7ee; // rice flour on its own
const FLOUR = 0xf4ead2; // the flours mixed
const DOUGH = 0xe9d3a3;
const ALT_BUTTON = pick({ x: 525, y: 540, width: 240 }, { x: 525, y: 500, width: 240 }); // tap-and-hold alternatives
const TOKENS = pick({ y: 262, art: 78, label: 46 }, { y: 222, art: 64, label: 38 }); // ingredient row in step 1
const CARD = pick({ y: 196, h: 384 }, { y: 196, h: 324 });
const BUBBLE_TOP = 596; // the bubble sits here, or higher when a long line needs the room
const NOZZLE = { idle: 0.35, pressing: 0.55 }; // the press nozzle over the oil, see-through

const wrapAngle = (a) => (a > Math.PI ? a - 2 * Math.PI : a < -Math.PI ? a + 2 * Math.PI : a);

// Screen 5 · Cook: one muruku in six steps. A wooden bowl (from the front) for steps 1–3, the press (side view)
// for step 4, and a pot of oil (from above) for steps 5–6. Every step can be done by touch, mouse or keyboard, and nothing can fail.
export class CookScene extends BaseScene {
  constructor() {
    super('Cook');
  }

  create(data) {
    this.free = Boolean(data.free);
    this.setStage('kitchen');
    toran(this, 104);
    header(this, { title: this.free ? 'Free kitchen · Cook' : 'Chapter 3 · How is it made?' });

    this.cook = { addMistakes: 0, water: 0, twist: null };
    this.stepObjs = [];
    this.bowlObjs = [];
    this.chips = [];
    this.pressTop = null;
    this.nudging = null; // the scene object is reused between visits
    // The card shows the full instruction, except in the free kitchen (short hints) and on phones, where the
    // full steps open in a pop-up because they don't fit the card.
    this.showFull = !this.free && !COMPACT;

    card(this, 32, CARD.y, 360, CARD.h, { kolam: true });
    this.cardEyebrow = this.text(60, CARD.y + 30, '', 'b3', { weight: 700, color: 0xb35600 });
    this.cardTitle = this.text(60, CARD.y + 54, '', 'h4', { width: 304 });
    this.cardBody = this.text(60, 0, '', 's1', { width: 304 });
    this.cardNote = this.text(60, 0, '', 'b3', { width: 304, color: COLOR.grey600 });
    if (this.free || COMPACT) {
      this.fullToggle = new Button(this, 212, CARD.y + CARD.h - 44, {
        label: 'Show full steps',
        size: 'medium',
        variant: 'clear',
        width: 300,
        onClick: () => {
          if (COMPACT) {
            const step = STEPS[this.stepIndex];
            new NoteSheet(this, {
              eyebrow: `STEP ${this.stepIndex + 1} OF ${STEPS.length}`,
              title: step.title,
              body: step.full,
              note: step.id === 'add' ? RECIPE_NOTE : '',
            });
            return;
          }
          this.showFull = !this.showFull;
          this.drawCard();
        },
      });
    }

    this.bubble = new PaatiBubble(this, 32, BUBBLE_TOP, 820);
    this.nextBtn = new Button(this, 1080, 652, { label: 'Next step', width: 300, onClick: () => this.onNext?.() });

    this.input.on('pointerdown', (p) => this.pointerDown?.(this.world(p)));
    this.input.on('pointermove', (p) => this.pointerMove?.(this.world(p)));
    this.input.on('pointerup', () => this.pointerUp?.());
    this.input.on('pointerupoutside', () => this.pointerUp?.());
    this.goStep(0);
  }

  update(time, delta) {
    this.tick?.(delta);
  }

  world(p) {
    return this.cameras.main.getWorldPoint(p.x, p.y);
  }

  // ---- step plumbing -------------------------------------------------------------------------------

  goStep(i) {
    this.stepIndex = i;
    this.stepObjs.forEach((o) => o.destroy());
    this.stepObjs = [];
    this.pointerDown = this.pointerMove = this.pointerUp = this.tick = this.onNext = null;
    this.nextBtn.setVisible(false).setEnabled(true);
    this.drawChips();
    this.drawCard();
    const run = {
      add: () => this.stepAdd(),
      water: () => this.stepWater(),
      knead: () => this.stepKnead(),
      fill: () => this.stepFill(),
      twist: () => this.stepTwist(),
      fry: () => this.stepFry(),
    };
    run[STEPS[i].id]();
  }

  keep(obj) {
    if (obj) this.stepObjs.push(obj);
    return obj;
  }

  // One of Paati's kitchen lines ([full, short], from COOK_LINES).
  line([full, short], tone = 'plain') {
    this.say(full, short, tone);
  }

  say(full, short = full, tone = 'plain') {
    this.bubble.say(this.free ? short : full, tone);
    // Grow upwards when a line needs more room than the space below the work area.
    this.bubble.setY(Math.min(BUBBLE_TOP, 712 - this.bubble.bubbleHeight));
  }

  showNext(label, handler, enabled = true) {
    this.onNext = handler;
    this.nextBtn.setLabel(label).setVisible(true).setEnabled(enabled);
    if (enabled && this.focus.visible) this.focus.focus(this.nextBtn);
  }

  drawChips() {
    this.chips.forEach((o) => o.destroy());
    this.chips = [];
    const w = 148;
    const gap = 10;
    const x0 = 640 - (STEPS.length * w + (STEPS.length - 1) * gap) / 2;
    STEPS.forEach((step, i) => {
      const x = x0 + i * (w + gap);
      const done = i < this.stepIndex;
      const now = i === this.stepIndex;
      const g = this.add.graphics();
      if (now) {
        g.fillStyle(COLOR.marigold500, 1);
        g.fillRoundedRect(x, 144, w, 36, 18);
      } else if (done) {
        g.fillStyle(0xe3f4e7, 1);
        g.fillRoundedRect(x, 144, w, 36, 18);
      } else {
        g.lineStyle(2, COLOR.grey300, 1);
        g.strokeRoundedRect(x, 144, w, 36, 18);
      }
      const label = `${done ? '✓' : i + 1}  ${step.chip}`;
      const t = makeText(this, x + w / 2, 162, label, 'b3', {
        weight: 700,
        color: now ? COLOR.grey900 : done ? COLOR.green700 : COLOR.grey600,
        origin: 0.5,
      });
      this.chips.push(g, t);
    });
  }

  drawCard() {
    const step = STEPS[this.stepIndex];
    this.cardEyebrow.setText(`STEP ${this.stepIndex + 1} OF ${STEPS.length}`);
    this.cardTitle.setText(step.title);
    this.cardBody.setY(this.cardTitle.y + this.cardTitle.height + 14).setText(this.showFull ? step.full : step.short);
    this.cardNote.setText(step.id === 'add' && !COMPACT ? RECIPE_NOTE : '').setY(this.cardBody.y + this.cardBody.height + 12);
    if (!COMPACT) this.fullToggle?.setLabel(this.showFull ? 'Show short hint' : 'Show full steps');
  }

  // A bare button that can be dragged onto a target or simply tapped (or activated with the keyboard).
  draggable(x, y, w, h, content, target, reach, onDrop) {
    const btn = this.keep(new Button(this, x, y, { variant: 'bare', width: w, height: h, content, onClick: () => onDrop(btn) }));
    btn.home = { x, y };
    btn.dragMode = true;
    this.input.setDraggable(btn);
    btn.on('dragstart', () => {
      this.children.bringToTop(btn);
      btn.moved = 0;
    });
    btn.on('drag', (p, dx, dy) => {
      if (!btn.enabled) return;
      btn.moved = Math.max(btn.moved, Math.hypot(dx - x, dy - y));
      btn.setPosition(dx, dy);
    });
    btn.on('dragend', () => {
      if (!btn.enabled) return;
      if (btn.moved < 12 || Math.hypot(btn.x - target.x, btn.y - target.y) < reach) onDrop(btn);
      else this.sendHome(btn);
    });
    return btn;
  }

  sendHome(btn) {
    if (settings.reduceMotion) btn.setPosition(btn.home.x, btn.home.y);
    else this.tweens.add({ targets: btn, x: btn.home.x, y: btn.home.y, duration: 260, ease: 'Back.Out' });
  }

  flyInto(btn, target, scale, onComplete) {
    btn.setEnabled(false);
    if (settings.reduceMotion) {
      btn.setVisible(false);
      onComplete();
      return;
    }
    this.tweens.add({
      targets: btn,
      x: target.x,
      y: target.y,
      scale,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.In',
      onComplete: () => {
        btn.setVisible(false);
        onComplete();
      },
    });
  }

  holdButton(label, onStart, onEnd, at = ALT_BUTTON) {
    return this.keep(
      new Button(this, at.x, at.y, {
        label,
        size: 'large',
        variant: 'outline',
        width: at.width,
        onHoldStart: onStart,
        onHoldEnd: onEnd,
      }),
    );
  }

  // ---- bowl (steps 1–3) ----------------------------------------------------------------------------

  // The wooden bowl, seen from the front and a little above. What's inside is drawn between its back and its front
  // lip, so it sits in the bowl and rises above the rim as a mound.
  drawBowl() {
    const back = art(this, BOWL.x, RIM_Y, 'bowl-back', BOWL_W).setOrigin(0.5, 62 / 230);
    // Contents are drawn around the rim's centre (0, 0), so they can squish while kneading.
    this.contents = this.add.graphics({ x: BOWL.x, y: RIM_Y });
    const front = art(this, BOWL.x, RIM_Y, 'bowl-front', BOWL_W).setOrigin(0.5, 62 / 230);
    this.bowlObjs.push(back, this.contents, front);
    this.mix = { level: 0, layers: [], specks: false, ghee: false, water: 0, kneaded: 0 };
  }

  destroyBowl() {
    this.bowlObjs.forEach((o) => o.destroy());
    this.bowlObjs = [];
  }

  // A heap in the bowl: its base fills the opening and its top rises h above the rim. `k` shapes it: about 1.3 is a
  // soft peaked pile of flour, lower is a rounder lump of dough.
  heap(g, { dx = 0, rx, h, k = 1.3, colour, alpha = 1, rough = 0, seed = 'heap' }) {
    const rnd = new Phaser.Math.RandomDataGenerator([seed]);
    const baseY = 2 * BS;
    const ry = 30 * BS;
    const pts = [];
    const N = 36;
    for (let i = 0; i <= N; i++) {
      const x = -rx + (2 * rx * i) / N;
      const bump = rough * rnd.realInRange(-1, 1) * (1 - (x / rx) ** 2);
      pts.push({ x: dx + x, y: this.surfaceY(x, rx, h, k) - bump });
    }
    for (let i = 1; i < N; i++) {
      const t = (Math.PI * i) / N;
      pts.push({ x: dx + rx * Math.cos(t), y: baseY + ry * Math.sin(t) });
    }
    g.fillStyle(colour, alpha);
    g.fillPoints(pts, true);
  }

  // How high a heap's surface is at x from its middle (for its outline, and for scattering specks, lumps and drops).
  surfaceY(x, rx, h, k = 1.3) {
    const u = Phaser.Math.Clamp(Math.abs(x) / rx, 0, 1);
    return 2 * BS - h * Math.pow(1 - u * u, k);
  }

  // The heap's size and shape right now: flour piles to a soft peak, dough slumps rounder.
  heapShape() {
    const wet = Math.min(1, this.mix.water / 0.6);
    return { rx: 132 * BS, h: HEAP_H * this.mix.level * (1 - 0.18 * wet), k: 1.3 - 0.65 * wet, wet };
  }

  // Everything in the bowl: flour heaps (each flour its own little heap on top), spices, ghee, then as water goes
  // in it turns to dough, rounder and smoother, and kneading smooths out the lumps.
  paintMix() {
    const g = this.contents;
    const m = this.mix;
    g.clear();
    if (m.level <= 0) return;
    const { rx, h, k, wet } = this.heapShape();
    const colour = lerpColor(m.layers.length ? FLOUR : RICE, DOUGH, wet);
    const rough = (1 - wet) * 3 * BS;
    // Shadowed body, the lit face up and to the left, and a soft highlight.
    this.heap(g, { rx, h, k, colour: lerpColor(colour, 0x8a6d3b, 0.22), rough, seed: 'body' });
    this.heap(g, { dx: -6 * BS, rx: rx * 0.94, h: h * 0.97, k, colour, rough, seed: 'body' });
    if (wet < 0.5) {
      // Before the water, each flour sits as its own little heap on the pile.
      m.layers.forEach((layer, i) => {
        const lh = 2 * BS - this.surfaceY(layer.dx, rx, h, k) + 14 * BS * (1 - wet * 2);
        const lc = lerpColor(layer.colour, colour, wet * 2);
        this.heap(g, { dx: layer.dx + 3 * BS, rx: rx * 0.48, h: lh, colour: lerpColor(lc, 0x8a6d3b, 0.2), rough, seed: `layer${i}` });
        this.heap(g, { dx: layer.dx, rx: rx * 0.45, h: lh * 0.97, colour: lc, rough, seed: `layer${i}` });
      });
    }
    this.heap(g, { dx: -28 * BS, rx: rx * 0.46, h: h * 0.8, k, colour: lerpColor(colour, 0xffffff, 0.5), alpha: 0.55, seed: 'shine' });
    const rnd = new Phaser.Math.RandomDataGenerator(['mix']);
    const spot = (spread = 0.8) => {
      const x = rnd.realInRange(-rx * spread, rx * spread);
      const top = this.surfaceY(x, rx, h, k);
      return { x, y: rnd.realInRange(top + 6 * BS, Math.max(top + 8 * BS, 2 * BS + 18 * BS)) };
    };
    // Powdery grain while it is dry.
    if (wet < 1) {
      for (let k = 0; k < 40; k++) {
        const p = spot(0.85);
        g.fillStyle(0x8a6d3b, 0.14 * (1 - wet));
        g.fillCircle(p.x, p.y, rnd.realInRange(0.8, 1.6) * BS);
      }
    }
    if (m.specks) {
      for (let k = 0; k < 46; k++) {
        const p = spot(0.75);
        g.fillStyle([0xc8402a, 0xe8b323, 0x7a4a1e, 0x2e2a26][k % 4], 1 - wet * 0.35);
        g.fillCircle(p.x, p.y, rnd.realInRange(1.6, 2.6) * BS);
      }
    }
    if (m.ghee && wet < 0.8) {
      for (let k = 0; k < 5; k++) {
        const x = rnd.realInRange(-rx * 0.45, rx * 0.45);
        const y = this.surfaceY(x, rx, h, k) + rnd.realInRange(8, 26) * BS;
        g.fillStyle(0xf2c14e, 0.9 * (1 - wet / 0.8));
        g.fillEllipse(x, y, rnd.realInRange(16, 24) * BS, rnd.realInRange(8, 11) * BS);
        g.fillStyle(0xffffff, 0.7 * (1 - wet / 0.8));
        g.fillCircle(x - 4 * BS, y - 2 * BS, 2 * BS);
      }
    }
    // Wet dough is lumpy until it is kneaded smooth.
    if (wet > 0.15) {
      const lumps = Math.round(12 * (1 - m.kneaded));
      for (let k = 0; k < 12; k++) {
        const p = spot(0.7);
        const r = rnd.realInRange(7, 13) * BS;
        if (k >= lumps) continue;
        g.fillStyle(lerpColor(colour, 0x8a6d3b, 0.14), 0.8);
        g.fillCircle(p.x + 2 * BS, p.y + 2 * BS, r);
        g.fillStyle(lerpColor(colour, 0xffffff, 0.3), 1);
        g.fillCircle(p.x, p.y, r);
      }
    }
    if (m.water > WATER_ZONE[1]) {
      g.fillStyle(0xffffff, 0.4);
      g.fillEllipse(-rx * 0.25, 2 * BS - h * 0.72, rx * 0.5, 12 * BS);
    }
    if (m.kneaded >= 1) {
      g.fillStyle(0xffffff, 0.5);
      g.fillEllipse(-rx * 0.3, 2 * BS - h * 0.7, rx * 0.34, 16 * BS);
    }
  }

  // The top of the heap, in world coordinates: where things land and water falls.
  heapTop(dx = 0) {
    const { rx, h, k } = this.heapShape();
    return { x: BOWL.x + dx, y: RIM_Y + this.surfaceY(dx, rx, h, k) };
  }

  dotTexture() {
    if (this.textures.exists('cook-dot')) return 'cook-dot';
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('cook-dot', 16, 16);
    g.destroy();
    return 'cook-dot';
  }

  // An ingredient pours from above into the bowl and the heap grows; flour puffs up a little cloud as it lands.
  pourIn(colours, { puff = true, grow, onDone } = {}) {
    const apply = () => {
      grow?.(1);
      this.paintMix();
      onDone?.();
    };
    if (settings.reduceMotion) return apply();
    const land = this.heapTop(0);
    const top = land.y - 110;
    const speed = 380;
    const g = 1100;
    const fallMs = ((-speed + Math.sqrt(speed * speed + 2 * g * (land.y - top))) / g) * 1000;
    const stream = this.add
      .particles(BOWL.x, top, this.dotTexture(), {
        x: { min: -16, max: 16 },
        speedY: speed,
        gravityY: g,
        lifespan: fallMs,
        scale: { min: 0.22, max: 0.42 },
        tint: colours,
        frequency: 10,
        quantity: 3,
      })
      .setDepth(5);
    this.time.delayedCall(420, () => stream.stop());
    this.time.delayedCall(420 + fallMs + 50, () => stream.destroy());
    this.time.delayedCall(fallMs, () => {
      if (puff) {
        const cloud = this.add
          .particles(0, 0, this.dotTexture(), {
            speed: { min: 30, max: 120 },
            angle: { min: 190, max: 350 },
            lifespan: 700,
            scale: { start: 0.5, end: 1.4 },
            alpha: { start: 0.5, end: 0 },
            tint: colours,
            emitting: false,
          })
          .setDepth(5);
        cloud.explode(22, land.x, land.y);
        this.time.delayedCall(800, () => cloud.destroy());
      }
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 480,
        ease: 'Sine.Out',
        onUpdate: (tw) => {
          grow?.(tw.getValue());
          this.paintMix();
        },
        onComplete: () => onDone?.(),
      });
    });
  }

  addToBowl(ing, index) {
    const m = this.mix;
    const from = m.level;
    if (ing.id === 'spices') {
      m.specks = true;
      this.pourIn([0xc8402a, 0xe8b323, 0x7a4a1e, 0x2e2a26], { puff: false });
    } else if (ing.id === 'ghee') {
      m.ghee = true;
      this.pourIn([0xf2c14e, 0xe8b323], { puff: false });
    } else {
      // Rice flour makes the heap; the other flours each land as their own little heap on top.
      const to = [0.62, 0.78, 0.9][index] ?? 0.9;
      if (index > 0) m.layers.push({ dx: index === 1 ? 46 * BS : -52 * BS, colour: ing.colour });
      this.pourIn([index === 0 ? RICE : ing.colour, 0xffffff], { grow: (t) => (m.level = from + (to - from) * t) });
    }
  }

  // ---- step 1: add ---------------------------------------------------------------------------------

  stepAdd() {
    this.destroyBowl();
    this.drawBowl();
    this.addIndex = 0;
    ADD_ORDER.forEach((id, i) => {
      const ing = ingredient(id);
      const img = ingredientArt(this, 0, -16, ing, TOKENS.art);
      const label = makeText(this, 0, TOKENS.label - 12, ing.name, 'b3', { weight: 600, width: 136, align: 'center', origin: [0.5, 0] });
      const token = this.draggable(520 + i * 150, TOKENS.y, 140, 132, [img, label], BOWL, BOWL.r + 40, (b) => this.tryAdd(b));
      token.ing = ing;
    });
    this.line(LINES.addStart);
  }

  tryAdd(token) {
    const expected = ingredient(ADD_ORDER[this.addIndex]);
    if (token.ing.id !== expected.id) {
      this.cook.addMistakes++;
      this.sendHome(token);
      this.line(LINES.addWrong(expected), 'warning');
      return;
    }
    const index = this.addIndex++;
    this.flyInto(token, { x: BOWL.x, y: this.heapTop().y - 100 }, 0.4, () => this.addToBowl(token.ing, index));
    if (this.addIndex < ADD_ORDER.length) {
      this.line(LINES.addNext(token.ing, ingredient(ADD_ORDER[this.addIndex])));
    } else {
      this.line(LINES.allIn, 'success');
      this.showNext('Next step', () => this.goStep(1));
    }
  }

  // ---- step 2: water -------------------------------------------------------------------------------

  stepWater() {
    this.cook.water = 0;
    this.pouring = false;
    this.mix.water = 0;
    this.paintMix();
    // The clay pitcher rests beside the bowl; pouring lifts and tips it so water streams from its spout.
    const s = PITCHER.width / 240;
    // Its shadow stays on the counter, fading while the pitcher is lifted.
    const shadow = this.keep(this.add.ellipse(PITCHER.x - 4 * s, PITCHER.y + 4, 150 * s, 14 * s, 0x5a3a1e, 0.16));
    const jug = this.keep(art(this, PITCHER.x, PITCHER.y, 'pitcher', PITCHER.width).setOrigin(130 / 240, 207 / 220));
    const stream = this.keep(this.add.graphics());
    const splash = this.keep(this.add.graphics());
    const meter = this.keep(this.add.graphics());
    const M = { x: 1184, top: 226, h: 330, w: 28 };
    const zoneTop = M.top + M.h * (1 - WATER_ZONE[1]);
    const zoneBottom = M.top + M.h * (1 - WATER_ZONE[0]);
    this.keep(makeText(this, M.x - 12, (zoneTop + zoneBottom) / 2, 'Just right', 'b3', { weight: 700, color: COLOR.green700, origin: [1, 0.5] }));
    this.keep(makeText(this, M.x + M.w / 2, M.top - 10, 'Water', 'b3', { weight: 700, color: COLOR.grey600, origin: [0.5, 1] }));

    // The meter: water rises; the green zone glows while the level is in it, and past it the water turns amber.
    const drawMeter = () => {
      const w = this.cook.water;
      const inZone = w >= WATER_ZONE[0] && w <= WATER_ZONE[1];
      const over = w > WATER_ZONE[1];
      meter.clear();
      meter.fillStyle(COLOR.white, 1);
      meter.fillRoundedRect(M.x, M.top, M.w, M.h, 14);
      if (inZone) {
        meter.fillStyle(COLOR.green600, 0.18);
        meter.fillRect(M.x - 10, zoneTop - 6, M.w + 20, zoneBottom - zoneTop + 12);
      }
      const level = M.h * w;
      if (level > 0) {
        meter.fillStyle(over ? COLOR.warning600 : 0x4a9fe0, 0.9);
        meter.fillRect(M.x + 4, M.top + M.h - level, M.w - 8, Math.max(0, level - 4));
      }
      meter.lineStyle(inZone ? 5 : 3, COLOR.green600, 1);
      meter.strokeRect(M.x - 4, zoneTop, M.w + 8, zoneBottom - zoneTop);
      meter.lineStyle(2, COLOR.grey300, 1);
      meter.strokeRoundedRect(M.x, M.top, M.w, M.h, 14);
    };
    drawMeter();

    // Where the spout is, wherever the pitcher has moved and turned.
    const spout = () => {
      const lx = (24 - 130) * s;
      const ly = (50 - 207) * s;
      const c = Math.cos(jug.rotation);
      const sn = Math.sin(jug.rotation);
      return { x: jug.x + lx * c - ly * sn, y: jug.y + lx * sn + ly * c };
    };
    const tilt = (on) => {
      const pose = on ? PITCHER.pour : { x: PITCHER.x, y: PITCHER.y, angle: 0 };
      shadow.setAlpha(on ? 0.4 : 1);
      if (settings.reduceMotion) jug.setPosition(pose.x, pose.y).setAngle(pose.angle);
      else this.tweens.add({ targets: jug, x: pose.x, y: pose.y, angle: pose.angle, duration: 240, ease: 'Sine.Out' });
    };
    const start = () => {
      if (this.pouring) return;
      this.pouring = true;
      tilt(true);
    };
    const stop = () => {
      if (!this.pouring) return;
      this.pouring = false;
      stream.clear();
      splash.clear();
      tilt(false);
      this.waterFeedback();
      // Pouring again picks up from where the level is now.
      stage = stages.findIndex((st) => this.cook.water < st.at);
      if (stage < 0) stage = stages.length;
    };
    this.holdButton('Hold to pour', start, stop);
    this.pointerDown = (p) => {
      if (Math.hypot(p.x - jug.x, p.y - (jug.y - 60)) < 90 || Math.hypot(p.x - BOWL.x, p.y - BOWL.y) < BOWL.r) start();
    };
    this.pointerUp = stop;
    let t = 0;
    // Paati keeps up while you pour: each stage is said once, as the level passes it.
    const [lo, hi] = WATER_ZONE;
    const stages = [
      { at: 0.08, line: LINES.pourGoing, tone: 'plain' },
      { at: lo - 0.1, line: LINES.pourAlmost, tone: 'info' },
      { at: lo, line: LINES.pourStop, tone: 'success', buzz: true },
      { at: hi + 0.02, line: LINES.pourTooMuch, tone: 'warning' },
    ];
    let stage = stages.findIndex((st) => this.cook.water < st.at);
    if (stage < 0) stage = stages.length;
    this.tick = (dt) => {
      if (!this.pouring) return;
      t += dt;
      // Water only runs once the pitcher is tipped far enough.
      if (jug.angle > PITCHER.pour.angle * 0.75) return;
      this.cook.water = Math.min(1, this.cook.water + (dt / 1000) * 0.15);
      this.mix.water = this.cook.water;
      this.paintMix();
      drawMeter();
      while (stage < stages.length && this.cook.water >= stages[stage].at) {
        const st = stages[stage++];
        if (stage < stages.length && this.cook.water >= stages[stage].at) continue;
        this.line(st.line, st.tone);
        // A tiny buzz on phones that can, at just right.
        if (st.buzz) navigator.vibrate?.(30);
      }
      this.drawStream(stream, splash, spout(), this.heapTop(10), t);
      if (this.cook.water > 0.05 && !this.nextBtn.enabled) this.nextBtn.setEnabled(true);
    };
    this.line(LINES.waterStart);
    this.showNext('Done pouring', () => this.goStep(2), false);
  }

  // A stream of water arcing from the spout into the bowl, with drops and a splash where it lands.
  drawStream(stream, splash, from, to, t) {
    stream.clear();
    splash.clear();
    const wobble = Math.sin(t / 70) * 2.5;
    const cx = from.x - 26 + wobble;
    const cy = from.y + 4;
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(from.x, from.y), new Phaser.Math.Vector2(cx, cy), new Phaser.Math.Vector2(to.x, to.y));
    const pts = curve.getPoints(16);
    stream.lineStyle(9, 0x4f9fdc, 0.9);
    stream.strokePoints(pts, false);
    stream.lineStyle(3, 0xd9f0ff, 0.9);
    stream.strokePoints(pts.map((p) => ({ x: p.x - 2, y: p.y })), false);
    // Drops flicking off the stream and a crown of splash at the bottom.
    const rnd = new Phaser.Math.RandomDataGenerator([String(Math.floor(t / 90))]);
    for (let k = 0; k < 4; k++) {
      const p = pts[rnd.between(6, 15)];
      stream.fillStyle(0x7fc0ee, 0.9);
      stream.fillCircle(p.x + rnd.realInRange(-10, 10), p.y + rnd.realInRange(-4, 4), rnd.realInRange(1.5, 3));
    }
    splash.fillStyle(0xbfe3fb, 0.55);
    splash.fillEllipse(to.x, to.y + 2, 46, 12);
    splash.lineStyle(2.5, 0x4f9fdc, 0.85);
    for (let k = 0; k < 5; k++) {
      const a = Math.PI + (k + 0.5) * (Math.PI / 5);
      const r = 10 + rnd.realInRange(0, 8);
      splash.lineBetween(to.x + Math.cos(a) * 6, to.y + Math.sin(a) * 4, to.x + Math.cos(a) * r * 1.6, to.y + Math.sin(a) * r);
    }
  }

  waterFeedback() {
    const [lo, hi] = WATER_ZONE;
    const w = this.cook.water;
    if (w < lo) this.line(LINES.waterLow, 'info');
    else if (w <= hi) this.line(LINES.waterRight, 'success');
    else this.line(LINES.waterHigh, 'warning');
  }

  // ---- step 3: knead -------------------------------------------------------------------------------

  stepKnead() {
    const NEED = Math.PI * 2 * 5; // five circles
    this.kneaded = 0;
    this.kneading = false;
    this.autoKnead = false;
    this.mix.water = this.cook.water;
    this.mix.kneaded = 0;
    this.paintMix();
    // A ring around the bowl fills as you knead.
    const ring = this.keep(this.add.graphics());
    const E = { x: BOWL.x, y: RIM_Y + 30 * BS, rx: BOWL_W / 2 + 26, ry: 130 * BS + 14 };
    const arc = (from, to) => {
      const pts = [];
      const n = Math.max(2, Math.ceil(((to - from) / (Math.PI * 2)) * 72));
      for (let i = 0; i <= n; i++) {
        const a = from + ((to - from) * i) / n;
        pts.push({ x: E.x + E.rx * Math.cos(a), y: E.y + E.ry * Math.sin(a) });
      }
      return pts;
    };
    const drawRing = () => {
      const p = Math.min(1, this.kneaded / NEED);
      ring.clear();
      ring.lineStyle(10, COLOR.grey300, 0.7);
      ring.strokePoints(arc(0, Math.PI * 2), true);
      if (p > 0) {
        ring.lineStyle(10, p >= 1 ? COLOR.green600 : COLOR.yellow500, 1);
        ring.strokePoints(arc(-Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p), false);
      }
    };
    drawRing();
    let shown = 0;
    const knead = (da) => {
      if (this.kneaded >= NEED) return;
      this.kneaded += da;
      drawRing();
      const p = Math.min(1, this.kneaded / NEED);
      if (p - shown >= 0.08 || p >= 1) {
        shown = p;
        this.mix.kneaded = p;
        this.paintMix();
        if (!settings.reduceMotion) this.tweens.add({ targets: this.contents, scaleX: 1.05, scaleY: 0.93, duration: 90, yoyo: true });
      }
      if (p >= 1) {
        this.kneading = this.autoKnead = false;
        sparkle(this, BOWL.x, this.heapTop().y + 20);
        this.line(LINES.kneadDone, 'success');
        this.showNext('Next step', () => this.goStep(3));
      }
    };
    const inRing = (p) => ((p.x - E.x) / (E.rx + 30)) ** 2 + ((p.y - E.y) / (E.ry + 30)) ** 2 <= 1;
    this.pointerDown = (p) => {
      if (!inRing(p)) return;
      this.kneading = true;
      this.lastAngle = Math.atan2(p.y - E.y, p.x - E.x);
    };
    this.pointerMove = (p) => {
      if (!this.kneading || Math.hypot(p.x - E.x, p.y - E.y) < 12) return;
      const a = Math.atan2(p.y - E.y, p.x - E.x);
      knead(Math.abs(wrapAngle(a - this.lastAngle)));
      this.lastAngle = a;
    };
    this.pointerUp = () => {
      this.kneading = false;
    };
    this.holdButton(
      'Hold to knead',
      () => (this.autoKnead = true),
      () => (this.autoKnead = false),
    );
    this.tick = (dt) => {
      if (this.autoKnead) knead(((dt / 1000) * Math.PI * 2) / 0.9);
    };
    this.line(LINES.kneadStart);
  }

  // ---- step 4: fill the press ----------------------------------------------------------------------

  stepFill() {
    this.destroyBowl();
    const s = PRESS.width / 270;
    const left = PRESS.x - PRESS.width / 2;
    const top = PRESS.y - (300 * s) / 2;
    const at = (sx, sy) => ({ x: left + sx * s, y: top + sy * s });
    const mouth = at(130, 156);
    const plungerSpot = at(130, 124);
    const plateSpot = at(130, 236);
    const press = this.keep(art(this, PRESS.x, PRESS.y, 'press-empty', PRESS.width));
    const doughInPress = this.keep(this.add.graphics());
    const itemY = pick(380, 350);

    // 3 · Drag the star plate under the press. The arrow starts from the row, so it doesn't give the answer away.
    const plates = () => {
      this.line(LINES.plates);
      const rowY = pick(520, 470);
      const arrow = this.dragArrow({ x: 500 + 2 * 118 + 50, y: rowY + 20 }, { x: plateSpot.x - 52, y: plateSpot.y + 10 }, { bend: 1, lift: 26 });
      const kinds = [
        ['plate-round', 'Round'],
        ['plate-star', 'Star'],
        ['plate-ribbon', 'Ribbon'],
      ];
      const buttons = kinds.map(([key, name], i) => {
        const img = art(this, 0, -12, key, 72);
        const label = makeText(this, 0, 46, name, 'b3', { weight: 600, origin: 0.5 });
        const b = this.draggable(500 + i * 118, rowY, 108, 124, [img, label], plateSpot, 90, () => {
          if (key !== 'plate-star') {
            // Set that plate aside, and pause the others on Paati's hint until Try again.
            b.setEnabled(false);
            b.wrong = true;
            img.setAlpha(0.4);
            this.sendHome(b);
            if (!settings.reduceMotion) this.time.delayedCall(280, () => b.active && this.tweens.add({ targets: b, x: b.home.x + 8, duration: 50, yoyo: true, repeat: 3 }));
            this.line(LINES.plateWrong, 'info');
            buttons.forEach((other) => other.setEnabled(false));
            this.showNext('Try again', () => {
              this.nextBtn.setVisible(false);
              buttons.forEach((other) => !other.wrong && other.setEnabled(true));
              this.say(QUIZ_LINES.tryAgain, QUIZ_LINES.tryAgain, 'info');
            });
            return;
          }
          arrow.destroy();
          buttons.forEach((other) => other !== b && other.setEnabled(false));
          this.flyInto(b, plateSpot, 0.6, () => {
            this.keep(art(this, plateSpot.x, plateSpot.y + 4, 'plate-star', 56));
          });
          this.line(LINES.plateRight, 'success');
          this.showNext('Next step', () => this.goStep(4));
        });
        this.followArrow(b, arrow);
        return b;
      });
    };

    // 2 · Drag the plunger on top.
    const plunger = () => {
      this.line(LINES.plunger);
      const img = art(this, 0, -8, 'press-plunger', 80 * s);
      const label = makeText(this, 0, 54, 'Plunger', 'b3', { weight: 600, origin: 0.5 });
      const arrow = this.dragArrow({ x: 560 + 66, y: itemY - 30 }, { x: plungerSpot.x - 44, y: plungerSpot.y - 46 });
      const b = this.draggable(560, itemY, 130, 140, [img, label], plungerSpot, 100, (btn) => {
        arrow.destroy();
        this.flyInto(btn, plungerSpot, 1, () => {
          press.setTexture('press-filled');
          doughInPress.clear();
          plates();
        });
      });
      this.followArrow(b, arrow);
    };

    // 1 · Drag the dough into the press.
    const ballG = this.add.graphics();
    ballG.fillStyle(lerpColor(DOUGH, 0x8a6d3b, 0.15), 1);
    ballG.fillCircle(3, 4, 42);
    ballG.fillStyle(DOUGH, 1);
    ballG.fillCircle(0, 0, 42);
    ballG.fillStyle(0xffffff, 0.45);
    ballG.fillCircle(-14, -14, 12);
    const ballLabel = makeText(this, 0, 60, 'Dough', 'b3', { weight: 600, origin: 0.5 });
    const arrow = this.dragArrow({ x: 560 + 66, y: itemY - 24 }, { x: mouth.x - 46, y: mouth.y - 30 });
    const dough = this.draggable(560, itemY, 130, 150, [ballG, ballLabel], mouth, 100, (b) => {
      arrow.destroy();
      this.flyInto(b, mouth, 0.5, () => {
        doughInPress.fillStyle(0xf6e7c6, 1);
        doughInPress.fillEllipse(mouth.x, mouth.y, 72 * s, 13 * s);
        plunger();
      });
    });
    this.followArrow(dough, arrow);
    this.line(LINES.fillStart);
  }

  // A dashed arrow arching from an item to where it goes, marked "Drag", with a dot gliding along it to show the
  // move. bend −1 arches over the top, 1 dips underneath; lift is how far. Reduce motion keeps the arrow, without the dot.
  dragArrow(from, to, { bend = -1, lift = 60 + Math.abs(to.x - from.x) * 0.12 } = {}) {
    const V = (p) => new Phaser.Math.Vector2(p.x, p.y);
    const mid = { x: (from.x + to.x) / 2, y: (bend < 0 ? Math.min(from.y, to.y) : Math.max(from.y, to.y)) + bend * lift };
    const curve = new Phaser.Curves.QuadraticBezier(V(from), V(mid), V(to));
    const pts = curve.getSpacedPoints(36);
    const g = this.add.graphics();
    const colour = COLOR.buttonFill;
    g.lineStyle(5, colour, 0.9);
    for (let i = 0; i < pts.length - 3; i += 2) g.lineBetween(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    // The arrowhead, pointing along the curve's last stretch.
    const end = pts[pts.length - 1];
    const before = pts[pts.length - 3];
    const a = Math.atan2(end.y - before.y, end.x - before.x);
    const head = (da, r) => ({ x: end.x - Math.cos(a + da) * r, y: end.y - Math.sin(a + da) * r });
    const l = head(0.5, 20);
    const r = head(-0.5, 20);
    g.fillStyle(colour, 1);
    g.fillTriangle(end.x + Math.cos(a) * 4, end.y + Math.sin(a) * 4, l.x, l.y, r.x, r.y);
    const apex = curve.getPoint(0.5);
    const tag = makeText(this, apex.x, apex.y + (bend < 0 ? -10 : 10), 'Drag', 'b3', { weight: 700, color: colour, origin: [0.5, bend < 0 ? 1 : 0] });
    const parts = [g, tag];
    if (!settings.reduceMotion) {
      const dot = this.add.circle(from.x, from.y, 8, colour).setStrokeStyle(3, COLOR.white);
      parts.push(dot);
      const glide = this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1300,
        repeat: -1,
        repeatDelay: 350,
        ease: 'Sine.InOut',
        onUpdate: (tw) => {
          const t = tw.getValue();
          const p = curve.getPoint(t);
          dot.setPosition(p.x, p.y).setAlpha(t < 0.85 ? 1 : (1 - t) / 0.15);
        },
      });
      dot.once('destroy', () => glide.remove());
    }
    const arrow = this.keep(this.add.container(0, 0, parts).setDepth(3));
    return arrow;
  }

  // The arrow dims while its item is being dragged, and comes back if the item goes home.
  followArrow(item, arrow) {
    item.on('dragstart', () => arrow.active && arrow.setAlpha(0.25));
    item.on('dragend', () => this.time.delayedCall(300, () => arrow.active && arrow.setAlpha(1)));
  }

  // ---- the pot of oil (steps 5–6) -------------------------------------------------------------------

  bubbleTexture() {
    if (this.textures.exists('oil-bubble')) return 'oil-bubble';
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // A pale bubble with an amber rim, so it shows on golden oil, and a bright glint.
    g.fillStyle(0xfff3c4, 0.6);
    g.fillCircle(16, 16, 13);
    g.lineStyle(2.5, 0xa86a12, 0.65);
    g.strokeCircle(16, 16, 13);
    g.lineStyle(1.5, 0xffffff, 0.8);
    g.beginPath();
    g.arc(16, 16, 10, Math.PI * 1.05, Math.PI * 1.55);
    g.strokePath();
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(11, 11, 3);
    g.generateTexture('oil-bubble', 32, 32);
    g.destroy();
    return 'oil-bubble';
  }

  // Bubbles in the hot oil: around the dough (all of it, or just the freshest bit while twisting), or anywhere
  // in the pot. Nothing when Reduce motion is on.
  fizz({ around = true, recent = false, frequency = 30, quantity = 2, scale = { start: 0.16, end: 0.42 } } = {}) {
    if (settings.reduceMotion) return null;
    const source = {
      getRandomPoint: (p) => {
        const pool = recent ? this.samples.slice(-50) : this.samples;
        if (around && pool.length) {
          const s = pool[Math.floor(Math.random() * pool.length)];
          const a = Math.random() * Math.PI * 2;
          const d = s.w * 0.45 + Math.random() * 12;
          p.x = s.x + Math.cos(a) * d;
          p.y = s.y + Math.sin(a) * d;
        } else {
          const a = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * (OIL_R - 6);
          p.x = Math.cos(a) * r;
          p.y = Math.sin(a) * r;
        }
        return p;
      },
    };
    return this.add.particles(PAN.x, PAN.y, this.bubbleTexture(), {
      emitZone: { type: 'random', source },
      lifespan: { min: 260, max: 640 },
      scale,
      alpha: { start: 0.95, end: 0 },
      frequency,
      quantity,
    });
  }

  // ---- step 5: twist -------------------------------------------------------------------------------

  stepTwist() {
    this.pan = art(this, PAN.x, PAN.y, 'pot-oil', PAN.width);
    this.muruku = this.add.container(PAN.x, PAN.y);
    this.edgeG = this.add.graphics();
    this.fillG = this.add.graphics();
    this.muruku.add([this.edgeG, this.fillG]);
    this.resetTwist();

    // The press nozzle follows the spiral, small and see-through so the dough under it stays visible.
    const pressTop = this.keep(art(this, PAN.x, PAN.y, 'press-top', 60).setAlpha(NOZZLE.idle));
    this.pressTop = pressTop;
    // Hot oil fizzes where the fresh dough goes in.
    this.keep(this.fizz({ recent: true, frequency: 25, quantity: 3 }));
    const again = this.keep(
      new Button(this, TWIST_BUTTON.x, TWIST_BUTTON.y + BUTTON_HEIGHT.large / 2 + 14 + BUTTON_HEIGHT.medium / 2, {
        label: 'Start again',
        size: 'medium',
        variant: 'outline',
        width: TWIST_BUTTON.width,
        onClick: () => {
          this.resetTwist();
          again.setVisible(false);
          this.nextBtn.setEnabled(false);
        },
      }),
    ).setVisible(false);

    const inOil = (p) => Math.hypot(p.x - PAN.x, p.y - PAN.y) < OIL_R + 20;
    this.pointerDown = (p) => {
      if (!inOil(p)) return;
      this.beginStroke();
      this.addSample(p.x - PAN.x, p.y - PAN.y);
    };
    this.pointerMove = (p) => {
      if (this.pressing && !this.autoTwist) this.addSample(p.x - PAN.x, p.y - PAN.y);
    };
    this.pointerUp = () => {
      if (this.pressing && !this.autoTwist) this.endStroke(again);
    };
    this.holdButton(
      'Hold to twist',
      () => {
        this.autoTwist = true;
        this.beginStroke();
      },
      () => {
        if (!this.autoTwist) return;
        this.autoTwist = false;
        this.endStroke(again);
      },
      TWIST_BUTTON,
    );
    // The tap-and-hold alternative lays a steady spiral outward from the middle while held.
    this.tick = (dt) => {
      if (!this.autoTwist) return;
      const b = 7.5 * (OIL_R / 141); // same number of turns whatever the pan size
      const r = 8 + b * this.autoTheta;
      if (r > OIL_R - 12) {
        this.autoTwist = false;
        this.endStroke(again);
        return;
      }
      this.autoTheta += ((340 * dt) / 1000) / Math.hypot(r, b);
      const r2 = 8 + b * this.autoTheta;
      this.addSample(r2 * Math.cos(this.autoTheta), r2 * Math.sin(this.autoTheta));
    };
    this.line(LINES.twistStart);
    this.showNext('Done twisting', () => this.finishTwist(), false);
  }

  resetTwist() {
    this.samples = [];
    this.stroke = 0;
    this.pressing = false;
    this.autoTwist = false;
    this.autoTheta = 0;
    this.edgeG.clear();
    this.fillG.clear();
    this.edgeG.fillStyle(edgeOf(RAW), 1);
    this.fillG.fillStyle(RAW, 1);
    this.pressTop?.setPosition(PAN.x, PAN.y).setAlpha(NOZZLE.idle);
  }

  beginStroke() {
    this.pressing = true;
    this.stroke++;
    this.pressTop.setAlpha(NOZZLE.pressing);
  }

  endStroke(again) {
    this.pressing = false;
    this.pressTop.setAlpha(NOZZLE.idle);
    if (this.samples.length > 20) {
      this.nextBtn.setEnabled(true);
      again.setVisible(true);
      this.line(LINES.twistMore);
    }
  }

  addSample(x, y) {
    const r = Math.hypot(x, y);
    if (r > OIL_R) {
      x *= OIL_R / r;
      y *= OIL_R / r;
    }
    const t = this.time.now;
    const last = this.samples[this.samples.length - 1];
    let w = 14;
    if (last && last.stroke === this.stroke) {
      const d = Math.hypot(x - last.x, y - last.y);
      if (d < 3) return;
      // Slow drawing leaves thick dough, fast drawing thin: steady speed means steady thickness.
      const speed = (d / Math.max(1, t - last.t)) * 1000;
      w = last.w * 0.7 + Phaser.Math.Clamp(22 - speed / 55, 8, 20) * 0.3;
    }
    const sample = { x, y, t, w, stroke: this.stroke };
    this.samples.push(sample);
    drawSegment(this.edgeG, this.fillG, last, sample);
    this.pressTop.setPosition(PAN.x + x, PAN.y + y);
  }

  finishTwist() {
    this.cook.twist = scoreTwist(this.samples);
    this.goStep(5);
  }

  // ---- step 6: fry ---------------------------------------------------------------------------------

  stepFry() {
    const fry = (this.fry = { a: 0, b: 0, flipped: false, warned: false, since: 0 });
    const M = pick({ x: 506, top: 236, h: 250, w: 30 }, { x: 506, top: 226, h: 220, w: 30 });
    this.keep(makeText(this, M.x + M.w / 2, M.top - 12, 'Side in the oil', 'b3', { weight: 700, color: COLOR.grey600, origin: [0.5, 1] }));
    const meter = this.keep(this.add.graphics());
    for (let i = 0; i < M.h; i += 2) {
      meter.fillStyle(fryColour(1 - i / M.h), 1);
      meter.fillRect(M.x, M.top + i, M.w, 2);
    }
    const zTop = M.top + M.h * (1 - GOLDEN_ZONE[1]);
    const zBottom = M.top + M.h * (1 - GOLDEN_ZONE[0]);
    meter.lineStyle(3, COLOR.grey900, 1);
    meter.strokeRect(M.x - 4, zTop, M.w + 8, zBottom - zTop);
    meter.lineStyle(2, COLOR.grey300, 1);
    meter.strokeRect(M.x, M.top, M.w, M.h);
    this.keep(makeText(this, M.x + M.w + 12, (zTop + zBottom) / 2, 'Golden', 'b3', { weight: 700, origin: [0, 0.5] }));
    this.keep(makeText(this, M.x + M.w + 12, M.top + 8, 'Dark', 'b3', { color: COLOR.grey600, origin: [0, 0.5] }));
    this.keep(makeText(this, M.x + M.w + 12, M.top + M.h - 8, 'Pale', 'b3', { color: COLOR.grey600, origin: [0, 0.5] }));
    const marker = this.keep(this.add.graphics());

    // Loader restyled as a flickering diya while frying.
    const loaderY = M.top + M.h + pick(70, 46);
    const diya = this.keep(art(this, 470, loaderY - 4, 'diya', 48));
    this.keep(makeText(this, 500, loaderY, 'Frying…', 'b3', { weight: 600, origin: [0, 0.5] }));
    // The oil bubbles hard all round the muruku, with bigger bubbles rising across the pot. It calms a little
    // as the side in the oil turns golden.
    // Froth hugs the muruku while it fries, under it and over the oil.
    const foam = this.keep(this.add.graphics({ x: PAN.x, y: PAN.y }));
    this.children.moveBelow(foam, this.muruku);
    const runs = [];
    this.samples.forEach((p, i) => {
      if (i === 0 || p.stroke !== this.samples[i - 1].stroke) runs.push([]);
      runs[runs.length - 1].push(p);
    });
    const avgW = this.samples.reduce((sum, p) => sum + p.w, 0) / Math.max(1, this.samples.length);
    for (const [width, colour, alpha] of [[avgW + 22, 0xfff0c2, 0.45], [avgW + 10, 0xffffff, 0.4]]) {
      foam.lineStyle(width, colour, alpha);
      runs.forEach((run) => run.length > 1 && foam.strokePoints(run, false));
    }
    if (!settings.reduceMotion) this.tweens.add({ targets: foam, alpha: { from: 1, to: 0.7 }, duration: 320, yoyo: true, repeat: -1 });
    const fizz = this.keep(this.fizz({ frequency: 8, quantity: 6, scale: { start: 0.2, end: 0.55 } }));
    this.keep(this.fizz({ around: false, frequency: 60, quantity: 1, scale: { start: 0.3, end: 0.75 } }));
    if (!settings.reduceMotion) this.tweens.add({ targets: diya, alpha: 0.6, duration: 260, yoyo: true, repeat: -1 });

    const repaint = () => {
      const inOil = fry.flipped ? fry.b : fry.a;
      // The top shows the side out of the oil; the rim shows the side frying.
      const topColour = fry.flipped ? fryColour(fry.a) : fryColour(fry.a * 0.25);
      paintRibbon(this.edgeG, this.fillG, this.samples, { fill: topColour, edge: edgeOf(fryColour(inOil)) });
      marker.clear();
      const y = M.top + M.h * (1 - inOil);
      marker.fillStyle(COLOR.grey900, 1);
      marker.fillTriangle(M.x - 6, y, M.x - 20, y - 9, M.x - 20, y + 9);
    };
    repaint();

    const lift = () => {
      const result = scoreFry({ sideA: fry.a, sideB: fry.b, flipped: fry.flipped });
      const colour = fryColour(fry.flipped ? (fry.a + fry.b) / 2 : (fry.a + 0.1) / 2);
      this.finish(result, colour);
    };
    const liftY = 652 - BUTTON_HEIGHT.giant / 2 - 14 - BUTTON_HEIGHT.large / 2;
    const liftNow = this.keep(new Button(this, 1080, liftY, { label: 'Lift out', size: 'large', variant: 'outline', width: 300, onClick: lift }));
    const cue = this.keep(this.cueBadge());
    this.showNext('Flip', () => {
      fry.flipped = true;
      fry.warned = false;
      fry.cued = false;
      cue.hide();
      this.stopNudge();
      liftNow.setVisible(false);
      if (!settings.reduceMotion) this.tweens.add({ targets: this.muruku, scaleY: 0, duration: 90, yoyo: true });
      this.line(LINES.flipped, 'success');
      this.showNext('Lift out', lift);
      repaint();
    });

    this.tick = (dt) => {
      const key = fry.flipped ? 'b' : 'a';
      fry[key] = Math.min(1, fry[key] + (dt / 1000) * 0.07);
      if (fizz) fizz.frequency = 8 + 24 * fry[key];
      fry.since += dt;
      if (fry.since > 150) {
        fry.since = 0;
        repaint();
      }
      // Golden: time to flip (or, after the flip, to lift it out).
      if (!fry.cued && fry[key] >= GOLDEN_ZONE[0]) {
        fry.cued = true;
        const line = fry.flipped ? LINES.liftNow : LINES.flipNow;
        cue.show(line[1]);
        this.nudge(this.nextBtn);
        this.line(line, 'success');
      }
      if (!fry.warned && fry[key] > GOLDEN_ZONE[1] + 0.05) {
        fry.warned = true;
        this.line(fry.flipped ? LINES.darkTop : LINES.darkUnder, 'info');
      }
    };
    this.line(LINES.fryStart);
  }

  // A big marigold badge beside the pot ("Flip now!", "Lift it out!"), pointing at it, pulsing unless Reduce
  // motion is on.
  cueBadge() {
    const w = pick(220, 250);
    const h = pick(64, 76);
    const badge = this.add.container(PAN.x + PAN.width / 2 + 30 + w / 2, PAN.y - 70).setDepth(20).setVisible(false);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.16);
    g.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, h / 2);
    g.fillStyle(COLOR.buttonFill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.fillTriangle(-w / 2 - 16, 0, -w / 2 + 4, -14, -w / 2 + 4, 14);
    g.lineStyle(2, COLOR.yellow300, 1);
    g.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, (h - 8) / 2);
    const label = makeText(this, 0, 0, '', 'h5', { weight: 700, color: COLOR.offWhite, origin: 0.5 }).setFontFamily(BUTTON_FONT);
    badge.add([g, label]);
    let pulse = null;
    badge.show = (str) => {
      label.setText(str);
      badge.setVisible(true).setScale(1);
      if (settings.reduceMotion) return;
      pulse?.remove();
      pulse = this.tweens.add({ targets: badge, scale: { from: 0.9, to: 1.08 }, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    };
    badge.hide = () => {
      pulse?.remove();
      pulse = null;
      badge.setVisible(false);
    };
    badge.once('destroy', () => pulse?.remove());
    return badge;
  }

  // Make a button gently pulse to draw the eye, until stopNudge().
  nudge(btn) {
    this.stopNudge();
    if (settings.reduceMotion) return;
    this.nudging = { btn, tween: this.tweens.add({ targets: btn, scale: { from: 1, to: 1.06 }, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' }) };
  }

  stopNudge() {
    if (!this.nudging) return;
    this.nudging.tween.remove();
    this.nudging.btn.setScale(1);
    this.nudging = null;
  }

  finish(fry, colour) {
    this.tick = null;
    const dough = scoreDough({ addMistakes: this.cook.addMistakes, water: this.cook.water });
    const result = buildResult({ dough, twist: this.cook.twist, fry });
    progress.lastMuruku = { samples: this.samples.map(({ x, y, w, stroke }) => ({ x, y, w, stroke })), colour, result };
    if (this.free) {
      progress.plate++;
      this.go('Result', { free: true });
    } else {
      markChapterDone('ch3');
      this.advance();
    }
  }
}
