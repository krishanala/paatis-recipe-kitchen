import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, bokeh, glow, header, lampGlow, paati, sparkle } from '../ui/widgets.js';
import { BUTTON_FONT, makeText } from '../ui/text.js';
import { CHAPTERS, STORIES } from '../content.js';
import { storyLines } from '../quiz.js';
import { COLOR, RES, pick } from '../theme.js';
import { progress, settings } from '../state.js';
import { paintMuruku } from '../draw.js';

// Where the thing to tap sits: below Paati's words, between her and the Next button.
const OBJ = { x: 670, y: pick(560, 585) };

// Screen 2 · Paati's story: two or three short lines that open each chapter. Most stories have one "act": a line
// where Paati asks the player to do something (scratch off the card over the kolam, light the lamps).
// Next waits until it's done, then the story carries on.
export class StoryScene extends BaseScene {
  constructor() {
    super('Story');
  }

  create(data) {
    const id = data.story;
    const story = STORIES[id];
    const chapter = CHAPTERS[id];
    this.setStage(chapter.mood);
    this.decorate(id);
    header(this, { title: chapter.number ? `Chapter ${chapter.number} of 4` : 'Welcome' });

    bokeh(this, 16, { seed: `story-${id}`, strength: 0.8 });
    glow(this, 260, 400, 240);
    paati(this, 260, 712, story.paati, 560);

    this.text(500, 128, chapter.number ? `CHAPTER ${chapter.number}` : "PAATI'S KITCHEN", 'b3', {
      weight: 700,
      color: 0xb35600,
    });
    this.text(500, 154, chapter.number ? chapter.title : 'Welcome, dear', 'h3', { width: 720 });

    this.lines = storyLines(id);
    this.index = 0;
    this.act = story.act ?? null;
    this.acted = false;
    this.bubble = new PaatiBubble(this, 500, 236, 740, { avatar: false });
    this.counter = this.text(500, 0, '', 'b3', { color: COLOR.grey600 });
    this.next = new Button(this, 1060, 640, { label: 'Next', width: 320, onClick: () => this.onNext() });
    this.doneLabel = story.done;
    if (this.act) this.prop = this[this.act.kind]();
    this.show();
  }

  show() {
    this.bubble.say(this.lines[this.index]);
    this.counter.setText(`${this.index + 1} of ${this.lines.length}`).setY(236 + this.bubble.bubbleHeight + 16);
    this.next.setLabel(this.index === this.lines.length - 1 ? this.doneLabel : 'Next');
    const acting = this.act && this.index === this.act.at && !this.acted;
    this.next.setVisible(!acting);
    if (acting) this.prop.start();
  }

  onNext() {
    if (this.index < this.lines.length - 1) {
      this.index++;
      this.show();
    } else {
      this.advance();
    }
  }

  // The tap is done: Paati carries on by herself.
  actDone() {
    if (this.acted) return;
    this.acted = true;
    this.hint?.destroy();
    this.time.delayedCall(settings.reduceMotion ? 0 : 450, () => {
      this.index++;
      this.show();
      if (this.focus.visible) this.focus.focus(this.next);
    });
  }

  // "Tap …" in a marigold pill under the thing to tap, gently pulsing.
  showHint(y = OBJ.y + 112) {
    const label = makeText(this, 0, 0, this.act.tap, 'b1', { weight: 600, color: COLOR.offWhite, origin: 0.5 }).setFontFamily(BUTTON_FONT);
    const w = label.width + 40;
    const h = label.height + 18;
    y = Math.min(y, 712 - h / 2); // always on screen, however big the text
    const g = this.add.graphics();
    g.fillStyle(COLOR.buttonFill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.hint = this.add.container(OBJ.x, y, [g, label]).setDepth(5);
    if (!settings.reduceMotion) this.tweens.add({ targets: this.hint, scale: { from: 0.94, to: 1.04 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  // ---- Welcome: scratch off a gold card to find the kolam underneath --------------------------------------

  kolam() {
    const { x, y } = OBJ;
    const W = 300;
    const H = 180;
    // The kolam, drawn straight on the page: a 5 × 5 grid of dots turned on its side, a loop round each dot, and a
    // border round them all.
    const g = this.add.graphics();
    const step = 24;
    const corners = [[x, y - step * 2.6], [x + step * 4.2, y], [x, y + step * 2.6], [x - step * 4.2, y]];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const dx = x + (i - j) * step * 0.95;
        const dy = y + (i + j) * step * 0.55;
        g.lineStyle(3, (i + j) % 2 ? COLOR.marigold500 : COLOR.rani500, 1);
        g.strokeCircle(dx, dy, 11);
        g.fillStyle(COLOR.indigo900, 1);
        g.fillCircle(dx, dy, 3);
      }
    }
    g.lineStyle(3, COLOR.indigo900, 1);
    corners.forEach(([ax, ay], i) => g.lineBetween(ax, ay, corners[(i + 1) % 4][0], corners[(i + 1) % 4][1]));

    // Over it, a gold scratch card, drawn into a texture so it can be rubbed away. Its depth is a darker bottom
    // edge on the card itself (a shadow underneath would show through the scratches).
    const R = RES;
    const foil = this.add.renderTexture(x, y, Math.round(W * R), Math.round(H * R)).setScale(1 / R).setDepth(2);
    const paint = this.make.graphics({ x: 0, y: 0 }, false);
    paint.fillStyle(0xa8711f, 1);
    paint.fillRoundedRect(0, 0, W * R, H * R, 26 * R);
    paint.fillStyle(0xc98d2e, 1);
    paint.fillRoundedRect(0, 0, W * R, (H - 5) * R, 26 * R);
    paint.fillStyle(0xf0c35a, 1);
    paint.fillRoundedRect(5 * R, 5 * R, (W - 10) * R, (H - 15) * R, 22 * R);
    // Diagonal sheen bands and a scatter of glints, like foil.
    paint.fillStyle(0xfbe3a0, 0.55);
    for (const bx of [40, 130, 210]) paint.fillPoints([{ x: bx * R, y: 6 * R }, { x: (bx + 34) * R, y: 6 * R }, { x: (bx - 46) * R, y: (H - 6) * R }, { x: (bx - 80) * R, y: (H - 6) * R }], true);
    const rnd = new Phaser.Math.RandomDataGenerator(['foil']);
    paint.fillStyle(0xffffff, 0.7);
    for (let k = 0; k < 40; k++) paint.fillCircle(rnd.between(14, W - 14) * R, rnd.between(14, H - 14) * R, rnd.realInRange(0.8, 2) * R);
    foil.draw(paint);
    paint.destroy();
    const label = this.make.text({ x: (W / 2) * R, y: (H / 2) * R, text: 'Scratch here', style: { fontFamily: BUTTON_FONT, fontSize: `${Math.round(30 * R)}px`, fontStyle: '700', color: '#7a3e12' }, add: false }).setOrigin(0.5);
    foil.draw(label);
    label.destroy();

    // Rubbing erases a round brush along the finger's path; a coarse grid tracks how much is uncovered.
    const brushR = 24;
    const brush = this.make.graphics({ x: 0, y: 0 }, false);
    brush.fillStyle(0xffffff, 1);
    brush.fillCircle(0, 0, brushR * R);
    const COLS = 15;
    const ROWS = 9;
    const cleared = new Set();
    let active = false;
    let down = false;
    let last = null;
    let done = false;
    const eraseAt = (l) => {
      foil.erase(brush, l.x * R, l.y * R);
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          const cx = ((c + 0.5) * W) / COLS;
          const cy = ((r + 0.5) * H) / ROWS;
          if (Math.hypot(cx - l.x, cy - l.y) < brushR) cleared.add(c * ROWS + r);
        }
      }
    };
    const finish = () => {
      if (done) return;
      done = true;
      active = false;
      proxy.enabled = false;
      ring.clear();
      const reveal = () => {
        foil.destroy();
        brush.destroy();
        corners.forEach(([fx, fy], i) => art(this, fx, fy, i % 2 ? 'marigold-yellow' : 'marigold-orange', 26));
        sparkle(this, x, y, { radius: 120, count: 18 });
        this.actDone();
      };
      if (settings.reduceMotion) return reveal();
      this.tweens.add({ targets: foil, alpha: 0, duration: 350, onComplete: reveal });
    };
    const scratchTo = (l) => {
      if (done) return;
      if (last) {
        const d = Math.hypot(l.x - last.x, l.y - last.y);
        const n = Math.max(1, Math.ceil(d / (brushR * 0.4)));
        for (let k = 1; k <= n; k++) eraseAt({ x: last.x + ((l.x - last.x) * k) / n, y: last.y + ((l.y - last.y) * k) / n });
      } else {
        eraseAt(l);
      }
      last = l;
      // Most of it scratched: the rest falls away.
      if (cleared.size >= COLS * ROWS * 0.6) finish();
    };
    const toLocal = (p) => {
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      return { x: w.x - (x - W / 2), y: w.y - (y - H / 2) };
    };
    const over = (l) => l.x >= -10 && l.y >= -10 && l.x <= W + 10 && l.y <= H + 10;
    this.input.on('pointerdown', (p) => {
      if (!active) return;
      const l = toLocal(p);
      if (!over(l)) return;
      down = true;
      last = null;
      scratchTo(l);
    });
    this.input.on('pointermove', (p) => {
      if (active && down) scratchTo(toLocal(p));
    });
    this.input.on('pointerup', () => {
      down = false;
      last = null;
    });

    // Keyboard players focus the card and press Enter or Space: Paati's hand scratches it for them.
    const ring = this.add.graphics().setDepth(3);
    const proxy = this.add.zone(x, y, W, H);
    proxy.enabled = false;
    proxy.setFocused = (on) => {
      ring.clear();
      if (on && this.focus.visible && !done) {
        ring.lineStyle(4, COLOR.primary500, 1);
        ring.strokeRoundedRect(x - W / 2 - 8, y - H / 2 - 8, W + 16, H + 16, 32);
      }
    };
    proxy.keyPress = (pressed) => {
      if (pressed || !proxy.enabled || done) return;
      if (settings.reduceMotion) return finish();
      // A zigzag across the card, row by row.
      const rows = [24, 62, 100, 138, 168];
      this.tweens.addCounter({
        from: 0,
        to: rows.length,
        duration: 1300,
        onUpdate: (tw) => {
          const v = Math.min(rows.length - 0.001, tw.getValue());
          const row = Math.floor(v);
          const t = v - row;
          scratchTo({ x: row % 2 ? W - 10 - t * (W - 20) : 10 + t * (W - 20), y: rows[row] });
        },
        onComplete: finish,
      });
    };
    this.focus.add(proxy);
    return {
      // The card says "Scratch here" itself, so there's no separate hint.
      start: () => {
        active = true;
        proxy.enabled = true;
        if (this.focus.visible) this.focus.focus(proxy);
      },
    };
  }

  startTap(...areas) {
    areas.forEach((a) => a.setEnabled(true));
    this.showHint();
    if (this.focus.visible) this.focus.focus(areas[0]);
  }

  // ---- Chapter 1: light five lamps ----------------------------------------------------------------------

  diyas() {
    const lamps = [];
    let lit = 0;
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (Math.PI * (i + 0.5)) / 5;
      const lx = OBJ.x + Math.cos(a) * 190;
      const ly = OBJ.y + 40 + Math.sin(a) * 70;
      const img = art(this, 0, 0, 'diya-unlit', 72);
      const btn = new Button(this, lx, ly, {
        variant: 'bare',
        width: 92,
        height: 92,
        content: [img],
        onClick: () => {
          btn.setEnabled(false);
          img.setTexture('diya');
          img.setScale(72 / img.width);
          const light = lampGlow(this, lx, ly - 10, 60);
          this.children.moveBelow(light, btn);
          if (!settings.reduceMotion) this.tweens.add({ targets: light, scale: { from: 0.4, to: 1 }, alpha: { from: 0, to: 1 }, duration: 380 });
          sparkle(this, lx, ly - 20, { radius: 40, count: 8 });
          if (++lit === lamps.length) this.actDone();
        },
      });
      btn.setEnabled(false);
      lamps.push(btn);
    }
    return { start: () => this.startTap(...lamps) };
  }

  // Mood props per chapter (brief → "The Deepavali layer"). Kept away from text. Chapters with an act build
  // their own props.
  decorate(id) {
    if (id === 'ch2') {
      art(this, OBJ.x, OBJ.y + 12, 'banana-leaf', 240);
      art(this, OBJ.x, OBJ.y, 'muruku-golden', 150);
    } else if (id === 'ch3') {
      art(this, 660, 560, 'press-filled', 200);
    } else if (id === 'ch4') {
      // The player's own muruku, on a banana leaf.
      art(this, 640, 360, 'petals', 1280).setAlpha(0.3);
      art(this, OBJ.x, OBJ.y + 12, 'banana-leaf', 240);
      if (progress.lastMuruku) paintMuruku(this, progress.lastMuruku, OBJ.x, OBJ.y, 120);
      else art(this, OBJ.x, OBJ.y, 'muruku-golden', 120);
    }
  }
}
