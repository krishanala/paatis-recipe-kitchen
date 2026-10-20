import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, card, header, sparkle, toran } from '../ui/widgets.js';
import { makeText } from '../ui/text.js';
import { ADD_ORDER, STEPS, RECIPE_NOTE, ingredient } from '../content.js';
import { BUTTON_HEIGHT, COLOR, COMPACT, lerpColor, pick } from '../theme.js';
import { NoteSheet } from '../ui/NoteSheet.js';
import { progress, settings, markChapterDone } from '../state.js';
import { WATER_ZONE, GOLDEN_ZONE, scoreDough, scoreTwist, scoreFry, fryColour, buildResult } from '../scoring.js';
import { drawSegment, paintRibbon, edgeOf } from '../draw.js';

// On phones (COMPACT) text is larger, so Paati's bubble needs more room at the bottom and the work area
// tucks up and shrinks a little to stay clear of it.
const BOWL = pick({ x: 830, y: 455, r: 105 }, { x: 830, y: 432, r: 92 });
const PAN = pick({ x: 830, y: 388, width: 400 }, { x: 830, y: 372, width: 340 });
const OIL_R = 134 * (PAN.width / 360) - 8; // the oil circle in pan-hot.svg, less a margin
const PRESS = pick({ x: 960, y: 400, width: 300 }, { x: 960, y: 380, width: 280 }); // press-*.svg is 270 × 300
const RAW = 0xf3e2b8;
const FLOUR = 0xf4ead2;
const DOUGH = 0xe9d3a3;
const ALT_BUTTON = pick({ x: 525, y: 540, width: 240 }, { x: 525, y: 500, width: 240 }); // tap-and-hold alternatives
const TOKENS = pick({ y: 262, art: 78, label: 46 }, { y: 222, art: 64, label: 38 }); // ingredient row in step 1
const CARD = pick({ y: 196, h: 384 }, { y: 196, h: 324 });
const BUBBLE_TOP = 596; // the bubble sits here, or higher when a long line needs the room

const wrapAngle = (a) => (a > Math.PI ? a - 2 * Math.PI : a < -Math.PI ? a + 2 * Math.PI : a);

// Screen 5 · Cook: one muruku in six steps. Bowl (top-down) for steps 1–3, press (side view) for step 4,
// pan (top-down) for steps 5–6. Every step can be done by touch, mouse or keyboard, and nothing can fail.
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
    this.stepObjs.push(obj);
    return obj;
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

  holdButton(label, onStart, onEnd) {
    return this.keep(
      new Button(this, ALT_BUTTON.x, ALT_BUTTON.y, {
        label,
        size: 'large',
        variant: 'outline',
        width: ALT_BUTTON.width,
        onHoldStart: onStart,
        onHoldEnd: onEnd,
      }),
    );
  }

  // ---- bowl (steps 1–3) ----------------------------------------------------------------------------

  drawBowl() {
    const { x, y, r } = BOWL;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.1);
    g.fillCircle(x, y + 8, r + 18);
    g.fillStyle(0xa9b0b7, 1);
    g.fillCircle(x, y, r + 18);
    g.fillStyle(0xe2e6ea, 1);
    g.fillCircle(x, y, r + 11);
    g.fillStyle(0xc3c9cf, 1);
    g.fillCircle(x, y, r);
    g.fillStyle(0xd3d8dd, 1);
    g.fillCircle(x - r * 0.1, y - r * 0.1, r * 0.88);
    // Contents are drawn around (0, 0) so they can squish while kneading.
    this.contents = this.add.graphics({ x, y });
    this.bowlObjs.push(g, this.contents);
  }

  destroyBowl() {
    this.bowlObjs.forEach((o) => o.destroy());
    this.bowlObjs = [];
  }

  addToBowl(ing, index) {
    const g = this.contents;
    const r = BOWL.r;
    const spot = [
      [-0.2, -0.15],
      [0.22, -0.1],
      [0, 0.22],
      [0, 0],
      [0.1, 0.05],
    ][index];
    const cx = spot[0] * r;
    const cy = spot[1] * r;
    const rnd = new Phaser.Math.RandomDataGenerator([ing.id]);
    if (ing.id === 'spices') {
      for (let k = 0; k < 40; k++) {
        g.fillStyle([0xc8402a, 0xe8b323, 0x7a4a1e, 0x2e2a26][k % 4], 1);
        g.fillCircle(rnd.between(-r * 0.5, r * 0.5), rnd.between(-r * 0.5, r * 0.5), 2.5);
      }
    } else if (ing.id === 'ghee') {
      g.fillStyle(ing.colour, 0.9);
      for (let k = 0; k < 6; k++) g.fillCircle(cx + rnd.between(-40, 40), cy + rnd.between(-40, 40), rnd.between(6, 12));
    } else {
      g.fillStyle(lerpColor(ing.colour, 0x8a6d3b, 0.12), 1);
      g.fillCircle(cx + 3, cy + 4, r * 0.42);
      g.fillStyle(ing.colour, 1);
      g.fillCircle(cx, cy, r * 0.42);
    }
  }

  // The mix in the bowl: dry flour → dough as water goes in; lumps fade as it is kneaded.
  paintDough(water, kneaded = 0) {
    const g = this.contents;
    const r = BOWL.r;
    g.clear();
    const colour = lerpColor(FLOUR, DOUGH, Math.min(1, water / 0.6));
    g.fillStyle(lerpColor(colour, 0x8a6d3b, 0.15), 1);
    g.fillCircle(3, 5, r * 0.74);
    g.fillStyle(colour, 1);
    g.fillCircle(0, 0, r * 0.74);
    const rnd = new Phaser.Math.RandomDataGenerator(['lumps']);
    const lumps = Math.round(14 * (1 - kneaded));
    for (let k = 0; k < 14; k++) {
      const lx = rnd.between(-r * 0.5, r * 0.5);
      const ly = rnd.between(-r * 0.5, r * 0.5);
      const lr = rnd.between(8, 16);
      if (k >= lumps) continue;
      g.fillStyle(lerpColor(colour, 0xffffff, 0.35), 1);
      g.fillCircle(lx, ly, lr);
    }
    if (water > WATER_ZONE[1]) {
      g.fillStyle(0xffffff, 0.35);
      g.fillEllipse(-r * 0.25, -r * 0.3, r * 0.5, r * 0.18);
    }
    if (kneaded >= 1) {
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(-r * 0.28, -r * 0.28, r * 0.16);
    }
  }

  // ---- step 1: add ---------------------------------------------------------------------------------

  stepAdd() {
    this.destroyBowl();
    this.drawBowl();
    this.addIndex = 0;
    ADD_ORDER.forEach((id, i) => {
      const ing = ingredient(id);
      const img = art(this, 0, -16, ing.art, TOKENS.art);
      const label = makeText(this, 0, TOKENS.label - 12, ing.name, 'b3', { weight: 600, width: 136, align: 'center', origin: [0.5, 0] });
      const token = this.draggable(520 + i * 150, TOKENS.y, 140, 132, [img, label], BOWL, BOWL.r + 40, (b) => this.tryAdd(b));
      token.ing = ing;
    });
    this.say('Let us start. Rice flour goes in first, for the crunch.', 'Rice flour first.');
  }

  tryAdd(token) {
    const expected = ingredient(ADD_ORDER[this.addIndex]);
    if (token.ing.id !== expected.id) {
      this.cook.addMistakes++;
      this.sendHome(token);
      this.say(`First the ${expected.name.toLowerCase()}, dear. ${expected.note}`, `${expected.name} comes next.`, 'warning');
      return;
    }
    const index = this.addIndex++;
    this.flyInto(token, BOWL, 0.4, () => this.addToBowl(token.ing, index));
    if (this.addIndex < ADD_ORDER.length) {
      const next = ingredient(ADD_ORDER[this.addIndex]);
      this.say(`${token.ing.note} Next, the ${next.name.toLowerCase()}.`, `Next: ${next.name.toLowerCase()}.`);
    } else {
      this.say('All in! Now we bring it together with water.', 'All in!', 'success');
      this.showNext('Next step', () => this.goStep(1));
    }
  }

  // ---- step 2: water -------------------------------------------------------------------------------

  stepWater() {
    this.cook.water = 0;
    this.pouring = false;
    this.paintDough(0);
    const pot = this.keep(art(this, 1000, 280, 'jar-clay', 110));
    const stream = this.keep(this.add.graphics());
    const meter = this.keep(this.add.graphics());
    const M = { x: 1184, top: 226, h: 330, w: 28 };
    const zoneTop = M.top + M.h * (1 - WATER_ZONE[1]);
    const zoneBottom = M.top + M.h * (1 - WATER_ZONE[0]);
    this.keep(makeText(this, M.x - 12, (zoneTop + zoneBottom) / 2, 'Just right', 'b3', { weight: 700, color: COLOR.green700, origin: [1, 0.5] }));
    this.keep(makeText(this, M.x + M.w / 2, M.top - 10, 'Water', 'b3', { weight: 700, color: COLOR.grey600, origin: [0.5, 1] }));

    const drawMeter = () => {
      meter.clear();
      meter.fillStyle(COLOR.white, 1);
      meter.fillRoundedRect(M.x, M.top, M.w, M.h, 14);
      const level = M.h * this.cook.water;
      if (level > 0) {
        meter.fillStyle(0x4a9fe0, 0.9);
        meter.fillRect(M.x + 4, M.top + M.h - level, M.w - 8, Math.max(0, level - 4));
      }
      meter.lineStyle(3, COLOR.green600, 1);
      meter.strokeRect(M.x - 4, zoneTop, M.w + 8, zoneBottom - zoneTop);
      meter.lineStyle(2, COLOR.grey300, 1);
      meter.strokeRoundedRect(M.x, M.top, M.w, M.h, 14);
    };
    drawMeter();

    const start = () => {
      this.pouring = true;
      if (!settings.reduceMotion) this.tweens.add({ targets: pot, angle: -40, duration: 180 });
      else pot.setAngle(-40);
    };
    const stop = () => {
      if (!this.pouring) return;
      this.pouring = false;
      stream.clear();
      if (!settings.reduceMotion) this.tweens.add({ targets: pot, angle: 0, duration: 180 });
      else pot.setAngle(0);
      this.waterFeedback();
    };
    this.holdButton('Hold to pour', start, stop);
    this.pointerDown = (p) => {
      if (Math.hypot(p.x - pot.x, p.y - pot.y) < 70 || Math.hypot(p.x - BOWL.x, p.y - BOWL.y) < BOWL.r) start();
    };
    this.pointerUp = stop;
    this.tick = (dt) => {
      if (!this.pouring) return;
      this.cook.water = Math.min(1, this.cook.water + (dt / 1000) * 0.15);
      this.paintDough(this.cook.water);
      drawMeter();
      stream.clear();
      stream.lineStyle(7, 0x7fb8e0, 0.85);
      stream.lineBetween(pot.x - 52, pot.y - 18, BOWL.x + 10, BOWL.y - 8);
      if (this.cook.water > 0.05 && !this.nextBtn.enabled) this.nextBtn.setEnabled(true);
    };
    this.say('Now water. Hold to pour, and let go in the green zone.', 'Hold to pour. Stop in the green.');
    this.showNext('Done pouring', () => this.goStep(2), false);
  }

  waterFeedback() {
    const [lo, hi] = WATER_ZONE;
    const w = this.cook.water;
    if (w < lo) this.say('A little more water, dear. Hold again.', 'A little more.', 'info');
    else if (w <= hi) this.say('That is just right. Press Done pouring.', 'Just right.', 'success');
    else this.say('Oh, that is a lot of water. It is alright, we will knead it in.', 'That is a lot of water.', 'warning');
  }

  // ---- step 3: knead -------------------------------------------------------------------------------

  stepKnead() {
    const NEED = Math.PI * 2 * 5; // five circles
    this.kneaded = 0;
    this.kneading = false;
    this.autoKnead = false;
    this.paintDough(this.cook.water, 0);
    const ring = this.keep(this.add.graphics());
    const R = BOWL.r + 30;
    const drawRing = () => {
      const p = Math.min(1, this.kneaded / NEED);
      ring.clear();
      ring.lineStyle(10, COLOR.grey300, 0.7);
      ring.strokeCircle(BOWL.x, BOWL.y, R);
      if (p > 0) {
        ring.lineStyle(10, p >= 1 ? COLOR.green600 : COLOR.yellow500, 1);
        ring.beginPath();
        ring.arc(BOWL.x, BOWL.y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
        ring.strokePath();
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
        this.paintDough(this.cook.water, p);
        if (!settings.reduceMotion) this.tweens.add({ targets: this.contents, scaleX: 1.05, scaleY: 0.95, duration: 90, yoyo: true });
      }
      if (p >= 1) {
        this.kneading = this.autoKnead = false;
        sparkle(this, BOWL.x, BOWL.y);
        this.say('Soft like an earlobe. Perfect.', 'Soft and smooth.', 'success');
        this.showNext('Next step', () => this.goStep(3));
      }
    };
    this.pointerDown = (p) => {
      if (Math.hypot(p.x - BOWL.x, p.y - BOWL.y) > R + 30) return;
      this.kneading = true;
      this.lastAngle = Math.atan2(p.y - BOWL.y, p.x - BOWL.x);
    };
    this.pointerMove = (p) => {
      if (!this.kneading || Math.hypot(p.x - BOWL.x, p.y - BOWL.y) < 12) return;
      const a = Math.atan2(p.y - BOWL.y, p.x - BOWL.x);
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
    this.say('Now knead. Rub the dough round and round in the bowl.', 'Rub in circles.');
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

    const plates = () => {
      this.say('Now choose the plate. Which one makes muruku?', 'Choose the plate.');
      const kinds = [
        ['plate-round', 'Round'],
        ['plate-star', 'Star'],
        ['plate-ribbon', 'Ribbon'],
      ];
      kinds.forEach(([key, name], i) => {
        const img = art(this, 0, -12, key, 72);
        const label = makeText(this, 0, 46, name, 'b3', { weight: 600, origin: 0.5 });
        const b = this.keep(
          new Button(this, 500 + i * 118, pick(520, 470), {
            variant: 'bare',
            width: 108,
            height: 124,
            content: [img, label],
            onClick: () => {
              if (key !== 'plate-star') {
                b.setEnabled(false);
                img.setAlpha(0.4);
                this.say('That plate makes a different snack. For muruku we use the star plate.', 'Not that one: the star plate.', 'info');
                return;
              }
              this.flyInto(b, plateSpot, 0.6, () => {
                this.keep(art(this, plateSpot.x, plateSpot.y + 4, 'plate-star', 56));
              });
              this.say('That is the one. The star plate gives muruku its ridges.', 'Star plate on.', 'success');
              this.showNext('Next step', () => this.goStep(4));
            },
          }),
        );
      });
    };

    const plunger = () => {
      this.say('Now fit the plunger on top.', 'Plunger on.');
      const img = art(this, 0, -8, 'press-plunger', 80 * s);
      const label = makeText(this, 0, 54, 'Plunger', 'b3', { weight: 600, origin: 0.5 });
      this.draggable(560, pick(380, 350), 130, 140, [img, label], plungerSpot, 100, (b) =>
        this.flyInto(b, plungerSpot, 1, () => {
          press.setTexture('press-filled');
          doughInPress.clear();
          plates();
        }),
      );
    };

    const ballG = this.add.graphics();
    ballG.fillStyle(lerpColor(DOUGH, 0x8a6d3b, 0.15), 1);
    ballG.fillCircle(3, 4, 42);
    ballG.fillStyle(DOUGH, 1);
    ballG.fillCircle(0, 0, 42);
    ballG.fillStyle(0xffffff, 0.45);
    ballG.fillCircle(-14, -14, 12);
    const ballLabel = makeText(this, 0, 60, 'Dough', 'b3', { weight: 600, origin: 0.5 });
    this.draggable(560, pick(380, 350), 130, 150, [ballG, ballLabel], mouth, 100, (b) =>
      this.flyInto(b, mouth, 0.5, () => {
        doughInPress.fillStyle(0xf6e7c6, 1);
        doughInPress.fillEllipse(mouth.x, mouth.y, 72 * s, 13 * s);
        plunger();
      }),
    );
    this.say('Into the press it goes. Drag the dough into the wooden press.', 'Dough into the press.');
  }

  // ---- step 5: twist -------------------------------------------------------------------------------

  stepTwist() {
    this.pan = art(this, PAN.x, PAN.y, 'pan-hot', PAN.width);
    this.muruku = this.add.container(PAN.x, PAN.y);
    this.edgeG = this.add.graphics();
    this.fillG = this.add.graphics();
    this.muruku.add([this.edgeG, this.fillG]);
    this.resetTwist();

    const pressTop = this.keep(art(this, PAN.x, PAN.y, 'press-top', 84).setAlpha(0.6));
    this.pressTop = pressTop;
    const again = this.keep(
      new Button(this, ALT_BUTTON.x, ALT_BUTTON.y - BUTTON_HEIGHT.large / 2 - 14 - BUTTON_HEIGHT.medium / 2, {
        label: 'Start again',
        size: 'medium',
        variant: 'outline',
        width: ALT_BUTTON.width,
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
    this.say('Careful, the oil is hot. Hold, and draw a spiral from the middle outwards.', 'Spiral from the middle.');
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
    this.pressTop?.setPosition(PAN.x, PAN.y).setAlpha(0.6);
  }

  beginStroke() {
    this.pressing = true;
    this.stroke++;
    this.pressTop.setAlpha(1);
  }

  endStroke(again) {
    this.pressing = false;
    this.pressTop.setAlpha(0.6);
    if (this.samples.length > 20) {
      this.nextBtn.setEnabled(true);
      again.setVisible(true);
      this.say('Lovely. Keep going, or press Done twisting when your spiral is closed.', 'Done when it is closed.');
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
    if (!settings.reduceMotion) {
      this.tweens.add({ targets: diya, alpha: 0.6, duration: 260, yoyo: true, repeat: -1 });
      const bubbles = this.time.addEvent({
        delay: 200,
        loop: true,
        callback: () => {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * OIL_R;
          const c = this.add.circle(PAN.x + Math.cos(a) * r, PAN.y + Math.sin(a) * r, 3, 0xfff6da, 0).setStrokeStyle(1.5, 0xfff6da, 0.8);
          this.tweens.add({ targets: c, scale: 2, alpha: 0, duration: 600, onComplete: () => c.destroy() });
        },
      });
      this.keep({ destroy: () => bubbles.remove() });
    }

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
    this.showNext('Flip', () => {
      fry.flipped = true;
      fry.warned = false;
      liftNow.setVisible(false);
      if (!settings.reduceMotion) this.tweens.add({ targets: this.muruku, scaleY: 0, duration: 90, yoyo: true });
      this.say('Good flip! Now watch the other side.', 'Flipped!', 'success');
      this.showNext('Lift out', lift);
      repaint();
    });

    this.tick = (dt) => {
      const key = fry.flipped ? 'b' : 'a';
      fry[key] = Math.min(1, fry[key] + (dt / 1000) * 0.07);
      fry.since += dt;
      if (fry.since > 150) {
        fry.since = 0;
        repaint();
      }
      if (!fry.warned && fry[key] > GOLDEN_ZONE[1] + 0.05) {
        fry.warned = true;
        this.say(fry.flipped ? 'It is getting dark, dear. Lift it out!' : 'It is getting dark underneath. Flip it!', 'Getting dark!', 'info');
      }
    };
    this.say('Now we fry. Watch the colour, flip it once, then lift it out when it is golden.', 'Flip once. Lift when golden.');
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
