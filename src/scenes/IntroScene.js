import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { art, bokeh, burst, glow, header, raisedTitle, sparkle, twinkles, wordText } from '../ui/widgets.js';
import { fontSize } from '../ui/text.js';
import { INTRO } from '../content.js';
import { BUTTON_HEIGHT, COLOR, pick } from '../theme.js';
import { settings } from '../state.js';

// Reading pace: a new word every PACE ms, and a pause between the two paragraphs.
const PACE = 150;
const PARA_PAUSE = 700;
// The space for the left column, under the header.
const TOP = 112;
const BOTTOM = 700;

// The page between the welcome and Chapter 1: what we are about to do (make muruku, and find out what Deepavali is
// along the way), beside a big plate of muruku. The heading slides in, the words arrive one at a time at a pace
// people can read, then Start Chapter 1. A tap or key press shows it all at once, and Reduce motion shows it all
// from the start.
export class IntroScene extends BaseScene {
  constructor() {
    super('Intro');
  }

  create() {
    this.setStage('festive');
    bokeh(this, 22, { seed: 'intro', strength: 0.8 });
    header(this, { title: 'Welcome' });

    // Right: the plate of muruku in a warm glow, with twinkles around it.
    const P = pick({ x: 950, y: 420, w: 560 }, { x: 950, y: 430, w: 540 });
    glow(this, P.x, P.y - 10, 290);
    burst(this, 1186, 168, 50, COLOR.marigold500);
    burst(this, 716, 196, 34);
    twinkles(this, [
      [700, 320, 10],
      [1214, 330, 12],
      [748, 620, 9],
      [1196, 610, 11],
      [972, 150, 10],
    ]);
    this.pile = art(this, P.x, P.y, 'muruku-pile', P.w);

    // Left: the words, stacked by their real heights and centred under the header.
    const x = 96;
    const width = 540;
    const eyebrow = this.text(x, 0, INTRO.eyebrow, 'b3', { weight: 700, color: 0xb35600 });
    const title = raisedTitle(this, x, 0, INTRO.title, { size: fontSize('h1'), width });
    const rule = this.rule(x);
    const paras = INTRO.lines.map((line) => wordText(this, line, 's1', { width }).setX(x));
    const start = new Button(this, x + 170, 0, { label: INTRO.start, width: 340, onClick: () => this.advance() });

    const stack = [
      [eyebrow, eyebrow.height, 8],
      [title, title.textHeight, 14],
      [rule, 16, 22],
      ...paras.map((p, i) => [p, p.textHeight, i < paras.length - 1 ? 16 : 36]),
      [start, BUTTON_HEIGHT.giant, 0],
    ];
    const total = stack.reduce((sum, [, h, gap]) => sum + h + gap, 0);
    let y = TOP + Math.max(0, Math.round((BOTTOM - TOP - total) / 2));
    for (const [obj, h, gap] of stack) {
      obj.setY(obj === start ? y + h / 2 : y);
      y += h + gap;
    }

    this.reveal({ eyebrow, title, rule, paras, start });
  }

  // A small ornament under the heading: a Rani pink diamond, then a gold line ending in a dot. 16 px tall.
  rule(x) {
    const g = this.add.graphics({ x });
    g.fillStyle(COLOR.rani500, 1);
    g.fillPoints([{ x: 8, y: 0 }, { x: 16, y: 8 }, { x: 8, y: 16 }, { x: 0, y: 8 }], true);
    g.lineStyle(2, COLOR.yellow500, 1);
    g.lineBetween(26, 8, 150, 8);
    g.fillStyle(COLOR.yellow500, 1);
    g.fillCircle(158, 8, 3);
    return g;
  }

  // The plate pops in and then floats gently; the left column follows in reading order.
  reveal({ eyebrow, title, rule, paras, start }) {
    const words = paras.flatMap((p) => p.words);
    const parts = [eyebrow, title, rule, ...words, start];
    const home = parts.map((o) => ({ x: o.x, y: o.y, scaleX: o.scaleX, scaleY: o.scaleY }));
    if (settings.reduceMotion) return;

    const pile = this.pile;
    const scale = pile.scale;
    pile.setAlpha(0).setScale(scale * 0.7);
    this.tweens.add({
      targets: pile,
      alpha: 1,
      scale,
      duration: 620,
      delay: 120,
      ease: 'Back.Out',
      onComplete: () => {
        sparkle(this, pile.x, pile.y - 40, { radius: 220, count: 22 });
        this.tweens.add({ targets: pile, y: pile.y - 8, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      },
    });

    // Hidden until their turn; Start can't be pressed before it shows, and any tap or key shows it all.
    parts.forEach((o) => o.setAlpha(0));
    if (start.input) start.input.enabled = false;
    const timers = [];
    const later = (ms, fn) => timers.push(this.time.delayedCall(ms, fn));
    const fade = (targets, cfg) => this.tweens.add({ targets, alpha: { from: 0, to: 1 }, ...cfg });
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      timers.forEach((t) => t.remove(false));
      this.tweens.killTweensOf(parts);
      parts.forEach((o, i) => o.setPosition(home[i].x, home[i].y).setScale(home[i].scaleX, home[i].scaleY).setAlpha(1));
      if (start.input) start.input.enabled = true;
      this.input.off('pointerdown', settle);
      this.input.keyboard?.off('keydown', settle);
    };
    this.input.on('pointerdown', settle);
    this.input.keyboard?.on('keydown', settle);

    later(200, () => fade(eyebrow, { duration: 400 }));
    later(320, () => fade(title, { x: { from: title.x - 160, to: title.x }, duration: 640, ease: 'Cubic.Out' }));
    later(760, () => fade(rule, { scaleX: { from: 0, to: 1 }, duration: 480, ease: 'Cubic.Out' }));

    // Then the words, one at a time, each rising a little into place.
    let t = 1100;
    paras.forEach((p, i) => {
      if (i > 0) t += PARA_PAUSE;
      p.words.forEach((w) => {
        later(t, () => fade(w, { y: { from: w.y + 14, to: w.y }, duration: 420, ease: 'Cubic.Out' }));
        t += PACE;
      });
    });

    t += 600;
    later(t, () => fade(start, { y: { from: start.y + 18, to: start.y }, duration: 380, ease: 'Cubic.Out' }));
    later(t + 400, settle);
  }
}
