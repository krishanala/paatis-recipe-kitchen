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
// where Paati asks the player to tap something (draw the kolam, light the lamps, bite the muruku, cool it down).
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
    const g = this.add.graphics();
    g.fillStyle(COLOR.buttonFill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.hint = this.add.container(OBJ.x, y, [g, label]).setDepth(5);
    if (!settings.reduceMotion) this.tweens.add({ targets: this.hint, scale: { from: 0.94, to: 1.04 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  // A bare button over the thing to tap, so it works with touch, mouse and the keyboard.
  tapArea(x, y, w, h, onTap) {
    const b = new Button(this, x, y, { variant: 'bare', width: w, height: h, onClick: onTap });
    b.setEnabled(false);
    return b;
  }

  // ---- Welcome: tap the doorstep and a kolam draws itself, dot by dot -----------------------------------

  kolam() {
    const { x, y } = OBJ;
    const slab = this.add.graphics();
    slab.fillStyle(0x000000, 0.06);
    slab.fillRoundedRect(x - 150, y - 86, 300, 180, 26);
    slab.fillStyle(0xf3e6cc, 1);
    slab.fillRoundedRect(x - 150, y - 90, 300, 180, 26);
    slab.lineStyle(2, 0xd8c29a, 1);
    slab.strokeRoundedRect(x - 150, y - 90, 300, 180, 26);
    const g = this.add.graphics();
    // A 5 × 5 grid of dots turned on its side, with a loop drawn round each dot and a border round them all.
    const step = 24;
    const dots = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) dots.push({ x: x + (i - j) * step * 0.95, y: y + (i + j) * step * 0.55 });
    }
    const draw = (shown, loops, border) => {
      g.clear();
      dots.slice(0, shown).forEach((d) => {
        g.fillStyle(COLOR.indigo900, 1);
        g.fillCircle(d.x, d.y, 3);
      });
      dots.forEach((d, k) => {
        const t = Phaser.Math.Clamp(loops * dots.length - k, 0, 1);
        if (t <= 0) return;
        g.lineStyle(3, k % 2 ? COLOR.marigold500 : COLOR.rani500, 1);
        g.beginPath();
        g.arc(d.x, d.y, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t);
        g.strokePath();
      });
      if (border > 0) {
        const pts = [
          { x, y: y - step * 2.6 },
          { x: x + step * 4.2, y },
          { x, y: y + step * 2.6 },
          { x: x - step * 4.2, y },
        ];
        g.lineStyle(3, COLOR.indigo900, 1);
        for (let i = 0; i < 4; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % 4];
          const t = Phaser.Math.Clamp(border * 4 - i, 0, 1);
          if (t > 0) g.lineBetween(a.x, a.y, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        }
      }
    };
    const area = this.tapArea(x, y, 300, 180, () => {
      area.setEnabled(false);
      const finish = () => {
        draw(dots.length, 1, 1);
        [[x, y - step * 2.6], [x + step * 4.2, y], [x, y + step * 2.6], [x - step * 4.2, y]].forEach(([fx, fy], i) =>
          art(this, fx, fy, i % 2 ? 'marigold-yellow' : 'marigold-orange', 26),
        );
        sparkle(this, x, y, { radius: 120, count: 18 });
        this.actDone();
      };
      if (settings.reduceMotion) return finish();
      this.tweens.addCounter({
        from: 0,
        to: 3,
        duration: 2400,
        onUpdate: (tw) => {
          const v = tw.getValue();
          draw(Math.min(dots.length, Math.floor(v * dots.length)), Phaser.Math.Clamp(v - 1, 0, 1), Phaser.Math.Clamp(v - 2, 0, 1));
        },
        onComplete: finish,
      });
    });
    return { start: () => this.startTap(area) };
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

  // ---- Chapter 2: bite the muruku (three crunchy bites) ---------------------------------------------------

  crunch() {
    const { x, y } = OBJ;
    art(this, x, y + 12, 'banana-leaf', 240);
    // The muruku is drawn into a texture so bites can be taken out of it.
    const size = 150;
    const px = Math.round(size * RES);
    const rt = this.add.renderTexture(x, y, px, px).setScale(1 / RES);
    const img = this.make.image({ x: px / 2, y: px / 2, key: 'muruku-golden', add: false });
    img.setScale(px / img.width);
    rt.draw(img);
    const bites = [-0.7, 2.6, 1.1];
    let taken = 0;
    const area = this.tapArea(x, y, 190, 170, () => {
      const a = bites[taken++];
      const bx = px / 2 + Math.cos(a) * px * 0.42;
      const by = px / 2 + Math.sin(a) * px * 0.42;
      const eraser = this.make.graphics({}, false);
      eraser.fillStyle(0xffffff, 1);
      for (const [dx, dy, r] of [[0, 0, 0.17], [-0.1, 0.06, 0.12], [0.1, -0.06, 0.12]]) eraser.fillCircle(bx + dx * px, by + dy * px, r * px);
      rt.erase(eraser);
      eraser.destroy();
      this.crumbs(x + (bx - px / 2) / RES, y + (by - px / 2) / RES);
      if (taken === bites.length) {
        area.setEnabled(false);
        this.actDone();
      }
    });
    return { start: () => this.startTap(area) };
  }

  // Crumbs fall and a "Crunch!" pops up where the bite was.
  crumbs(x, y) {
    const word = makeText(this, x, y - 20, 'Crunch!', 'h5', { weight: 700, color: 0xb35600, origin: 0.5 }).setFontFamily(BUTTON_FONT).setDepth(6);
    if (settings.reduceMotion) {
      this.time.delayedCall(500, () => word.destroy());
      return;
    }
    this.tweens.add({ targets: word, y: y - 70, alpha: { from: 1, to: 0 }, scale: { from: 0.8, to: 1.2 }, duration: 700, ease: 'Cubic.Out', onComplete: () => word.destroy() });
    for (let i = 0; i < 9; i++) {
      const c = this.add.circle(x, y, Phaser.Math.Between(2, 5), Phaser.Utils.Array.GetRandom([0xc98a3c, 0xe0aa55, 0xa86a28])).setDepth(6);
      this.tweens.add({ targets: c, x: x + Phaser.Math.Between(-40, 40), y: y + Phaser.Math.Between(30, 70), alpha: 0, duration: 600, ease: 'Quad.In', onComplete: () => c.destroy() });
    }
  }

  // ---- Chapter 4: blow on the warm muruku until the steam is gone ---------------------------------------

  cool() {
    const { x, y } = OBJ;
    art(this, x, y + 12, 'banana-leaf', 240);
    if (progress.lastMuruku) paintMuruku(this, progress.lastMuruku, x, y, 120);
    else art(this, x, y, 'muruku-golden', 120);
    // Three wisps of steam rise from it, over and over.
    const wisps = [-36, 0, 36].map((dx, i) => {
      const g = this.add.graphics({ x: x + dx, y: y - 50 });
      g.lineStyle(5, COLOR.white, 0.85);
      g.beginPath();
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const px = Math.sin(t * Math.PI * 2 + i) * 8;
        const py = -t * 70;
        if (k === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
      if (!settings.reduceMotion) {
        g.rise = this.tweens.add({ targets: g, y: { from: y - 40, to: y - 70 }, alpha: { from: 0.9, to: 0.2 }, duration: 1100 + i * 150, repeat: -1, ease: 'Sine.Out' });
      }
      return g;
    });
    let blown = 0;
    const area = this.tapArea(x, y - 20, 200, 200, () => {
      const g = wisps[blown++];
      g.rise?.remove();
      if (settings.reduceMotion) g.destroy();
      else this.tweens.add({ targets: g, x: g.x + 90, alpha: 0, duration: 420, ease: 'Cubic.Out', onComplete: () => g.destroy() });
      if (blown === wisps.length) {
        area.setEnabled(false);
        sparkle(this, x, y, { radius: 70, count: 10 });
        this.actDone();
      }
    });
    return { start: () => this.startTap(area) };
  }

  // Mood props per chapter (brief → "The Deepavali layer"). Kept away from text. Chapters with an act build
  // their own props.
  decorate(id) {
    if (id === 'ch3') {
      art(this, 660, 560, 'press-filled', 200);
    } else if (id === 'ch4') {
      art(this, 640, 360, 'petals', 1280).setAlpha(0.3);
    }
  }
}
