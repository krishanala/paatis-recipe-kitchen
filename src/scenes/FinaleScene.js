import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { SERIF, art, bokeh, burst, celebrate, fireworks, garland, glow, hangingGarlands, kolamCorner, paati, raisedTitle, ribbon, sparkle, welcomeStage } from '../ui/widgets.js';
import { fontSize, makeText } from '../ui/text.js';
import { FINALE, PAATI, RECAP } from '../content.js';
import { BUTTON_HEIGHT, COLOR, COMPACT, pick } from '../theme.js';
import { progress, resetProgress, settings } from '../state.js';
import { paintMuruku } from '../draw.js';

// The recap boxes: an icon and a colour band for each thing learned, in the order of RECAP.
const RECAP_LOOK = [
  { icon: 'diya', band: COLOR.marigold500 },
  { icon: 'muruku-golden', band: COLOR.yellow500 },
  { icon: 'jar-clay', band: COLOR.rani500 },
];

// Screen 7 · Finale, in modes:
// 'finale'  the player offers their muruku to Paati, then What you learned (three boxes) and Next;
// 'bonus'   Bonus for your heart, in the welcome page's style, leading to the note for someone you miss;
// 'choice'  the last page: Make more muruku (the free kitchen) or Finish;
// 'goodbye' Paati's farewell at the very end.
export class FinaleScene extends BaseScene {
  constructor() {
    super('Finale');
  }

  create(data) {
    this.setStage('festive');
    const mode = data.mode ?? 'finale';
    if (mode === 'bonus') return this.bonus();
    if (mode === 'choice') return this.choice();
    bokeh(this, 26, { seed: `finale-${mode}` });
    garland(this);
    if (mode === 'goodbye') this.goodbye();
    else this.offer();
  }

  offer() {
    const objs = [];
    const strands = hangingGarlands(this, [
      [22, 14, 290],
      [56, 14, 196, 'alt'],
      [1224, 14, 196, 'alt'],
      [1258, 14, 290],
    ]);
    this.pinToEdges(strands);
    objs.push(
      ...strands,
      burst(this, 640, 300, 40),
      burst(this, 1120, 200, 50, COLOR.marigold500),
    );
    objs.push(this.text(640, 130, FINALE.offer, 'h3', { origin: [0.5, 0] }));
    objs.push(glow(this, 900, 430, 240));
    objs.push(paati(this, 900, 712, PAATI.welcome, 540));
    const gift = [art(this, 380, 400, 'banana-leaf', 360)];
    if (progress.lastMuruku) gift.push(...paintMuruku(this, progress.lastMuruku, 380, 392, 180));
    else gift.push(art(this, 380, 392, 'muruku-golden', 180));
    objs.push(...gift);
    const offer = new Button(this, 380, 620, {
      label: 'Offer to Paati',
      width: 320,
      onClick: () => {
        offer.setEnabled(false);
        const done = () => {
          objs.forEach((o) => o.destroy());
          offer.destroy();
          this.recap();
        };
        if (settings.reduceMotion) return done();
        sparkle(this, 900, 360, { radius: 140, count: 24 });
        this.tweens.add({ targets: gift, x: '+=420', y: '-=20', alpha: 0, duration: 700, ease: 'Cubic.In', onComplete: done });
      },
    });
  }

  // What you learned: a heading, Paati's thanks, then one box per thing learned, side by side. Next moves on.
  recap() {
    // Two rockets burst either side of the heading as the page opens.
    this.time.delayedCall(250, () => celebrate(this, [[170, 150], [1110, 140]]));
    const L = pick(
      { top: 108, cardW: 340, gap: 32, icon: 40, thanks: true },
      { top: 104, cardW: 384, gap: 20, icon: 32, thanks: false },
    );
    const head = raisedTitle(this, 640, L.top, 'What you learned', { size: fontSize('h1'), width: 1000, align: 'center', origin: [0.5, 0] });
    let y = L.top + head.textHeight + 12;
    y = this.divider(640, y + 6) + 14;
    if (L.thanks) {
      const thanks = this.text(640, y, FINALE.thanks, 's1', { origin: [0.5, 0], width: 1000, align: 'center', color: COLOR.grey600 });
      y += thanks.height + 22;
    } else {
      y += 6;
    }

    // Three boxes of the same size, as tall as the longest needs.
    const n = RECAP.length;
    const x0 = 640 - (n * L.cardW + (n - 1) * L.gap) / 2;
    const pad = 26;
    const boxes = RECAP.map((item, i) => {
      const x = x0 + i * (L.cardW + L.gap);
      const cx = x + L.cardW / 2;
      const look = RECAP_LOOK[i] ?? RECAP_LOOK[0];
      const disc = this.add.graphics();
      const iconY = y + 22 + L.icon;
      disc.fillStyle(COLOR.yellow50, 1);
      disc.fillCircle(cx, iconY, L.icon);
      disc.lineStyle(2, COLOR.yellow500, 1);
      disc.strokeCircle(cx, iconY, L.icon);
      const icon = art(this, cx, iconY, look.icon, L.icon * 1.45);
      const num = makeText(this, cx, iconY + L.icon + 12, String(i + 1).padStart(2, '0'), 'b3', { weight: 700, origin: [0.5, 0], color: 0xb35600 });
      const title = makeText(this, cx, num.y + num.height + 2, item.title, 'h4', { origin: [0.5, 0], color: 0x800000, weight: 700 }).setFontFamily(SERIF);
      const body = makeText(this, cx, title.y + title.height + 8, item.text, 'b1', { origin: [0.5, 0], width: L.cardW - 2 * pad, align: 'center', color: COLOR.grey600 });
      return { x, look, parts: [disc, icon, num, title, body], bottom: body.y + body.height };
    });
    const h = Math.max(...boxes.map((b) => b.bottom)) + pad - y;
    boxes.forEach((b) => this.box(b.x, y, L.cardW, h, b.look.band).setDepth(-1));
    // The boxes' contents rise in one box after another.
    if (!settings.reduceMotion) {
      boxes.forEach((b, i) =>
        b.parts.forEach((o) => this.tweens.add({ targets: o, alpha: { from: 0, to: 1 }, y: { from: o.y + 16, to: o.y }, duration: 380, delay: 120 + i * 120, ease: 'Cubic.Out' })),
      );
    }

    // The safety note at the bottom left, and Next on the right, lined up with the boxes' edges.
    const right = x0 + n * L.cardW + (n - 1) * L.gap;
    const nextW = 280;
    const rowY = 660;
    this.text(x0, rowY, FINALE.safety, 'b3', { origin: [0, 0.5], width: right - x0 - nextW - 40, color: COLOR.grey600 });
    new Button(this, right - nextW / 2, rowY, {
      label: 'Next',
      width: nextW,
      onClick: () => this.go('Finale', { mode: progress.noteDone ? 'choice' : 'bonus' }),
    });
  }

  // A recap box: white card, a coloured band across the top, kolam flourishes in the bottom corners.
  box(x, y, w, h, band) {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.07);
    g.fillRoundedRect(x, y + 6, w, h, 24);
    g.fillStyle(COLOR.white, 1);
    g.fillRoundedRect(x, y, w, h, 24);
    g.fillStyle(band, 1);
    g.fillRoundedRect(x, y, w, 10, { tl: 24, tr: 24, bl: 0, br: 0 });
    g.fillStyle(COLOR.yellow500, 1);
    g.fillRect(x + 10, y + 12, w - 20, 2);
    kolamCorner(g, x, y + h, 1, -1);
    kolamCorner(g, x + w, y + h, -1, -1);
    return g;
  }

  // A small ornament under a heading: gold lines either side of a Rani pink diamond. Returns its bottom.
  divider(x, y) {
    const g = this.add.graphics();
    g.lineStyle(2, COLOR.yellow500, 1);
    g.lineBetween(x - 120, y, x - 18, y);
    g.lineBetween(x + 18, y, x + 120, y);
    g.fillStyle(COLOR.rani500, 1);
    g.fillPoints([{ x, y: y - 8 }, { x: x + 8, y }, { x, y: y + 8 }, { x: x - 8, y }], true);
    g.fillStyle(COLOR.yellow500, 1);
    g.fillCircle(x - 126, y, 3);
    g.fillCircle(x + 126, y, 3);
    return y + 8;
  }

  // The welcome page's layout: a ribbon, a raised maroon heading, a line of text and buttons on the left, and Paati
  // at the doorstep kolam on the right. They come in one after another, unless Reduce motion is on.
  welcomeLayout({ pose, ribbonText, title, text, buttons }) {
    welcomeStage(this, pose);
    const x = 96;
    const band = ribbon(this, ribbonText);
    const head = raisedTitle(this, x, 0, title, { size: fontSize('h1'), width: 560 });
    const line = this.text(x, 0, text, 's1', { width: 520, color: COLOR.grey600 });
    const total = band.bh + 22 + head.textHeight + 16 + line.height + 36 + BUTTON_HEIGHT.giant;
    let y = Math.max(110, Math.round(392 - total / 2));
    band.setPosition(x + band.bw / 2, y + band.bh / 2);
    y += band.bh + 22;
    head.setY(y);
    y += head.textHeight + 16;
    line.setY(y);
    y += line.height + 36 + BUTTON_HEIGHT.giant / 2;
    let bx = x;
    const made = buttons.map((b) => {
      const btn = new Button(this, bx + b.width / 2, y, b);
      bx += b.width + 20;
      return btn;
    });
    if (!settings.reduceMotion) {
      band.setScale(0);
      this.tweens.add({ targets: band, scale: 1, duration: 420, ease: 'Back.Out' });
      this.tweens.add({ targets: head, x: { from: x - 120, to: x }, alpha: { from: 0, to: 1 }, duration: 520, delay: 160, ease: 'Cubic.Out' });
      this.tweens.add({ targets: line, alpha: { from: 0, to: 1 }, duration: 400, delay: 380 });
      made.forEach((btn, i) => this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, y: { from: y + 16, to: y }, duration: 360, delay: 520 + i * 110, ease: 'Cubic.Out' }));
    }
    return made;
  }

  // Bonus for your heart: the way into the note for someone you miss.
  bonus() {
    const leave = () => {
      progress.noteDone = true;
      this.go('Finale', { mode: 'choice' });
    };
    this.welcomeLayout({
      pose: PAATI.welcome,
      ribbonText: FINALE.bonusRibbon,
      title: FINALE.bonusTitle,
      text: FINALE.bonusText,
      buttons: [
        { label: 'Write a note', width: pick(280, 300), onClick: () => this.go('Note') },
        { label: 'Skip', width: 180, variant: 'outline', accent: true, onClick: leave },
      ],
    });
  }

  // The last page: more muruku in the free kitchen, or finish.
  choice() {
    this.welcomeLayout({
      pose: PAATI.celebrating,
      ribbonText: FINALE.choiceRibbon,
      title: FINALE.choiceTitle,
      text: FINALE.choiceText,
      buttons: [
        {
          label: 'Make more muruku',
          width: pick(360, 390),
          onClick: () => {
            progress.freeKitchen = true;
            this.go('Store', { mode: 'free' });
          },
        },
        { label: 'Finish', width: 200, variant: 'outline', accent: true, onClick: () => this.go('Finale', { mode: 'goodbye' }) },
      ],
    });
  }

  // Keep the four side strands at the screen edges, however wide the view is.
  pinToEdges(strands) {
    this.onView(({ left, right }) => {
      [left + 22, left + 56, right - 56, right - 22].forEach((x, i) => strands[i]?.active && (strands[i].x = x));
    });
  }

  goodbye() {
    fireworks(this);
    this.pinToEdges(
      hangingGarlands(this, [
        [22, 14, 330],
        [56, 14, 220, 'alt'],
        [1224, 14, 220, 'alt'],
        [1258, 14, 330],
      ]),
    );
    burst(this, 300, 200, 50, COLOR.marigold500);
    burst(this, 980, 190, 56);
    // Golden lotus diyas glow in both bottom corners.
    art(this, 190, 704, 'lotus-diya', 240).setOrigin(0.5, 1);
    art(this, 1090, 704, 'lotus-diya', 240).setOrigin(0.5, 1);
    this.text(640, 120, 'Happy Deepavali!', 'h2', { origin: [0.5, 0] });
    glow(this, 640, 370, 220);
    paati(this, 640, 526, PAATI.proud, 340);
    this.text(640, 536, FINALE.goodbye, 's1', { origin: [0.5, 0], width: 760, align: 'center' });
    const made = (progress.lastMuruku ? 1 : 0) + progress.plate;
    this.text(640, 576, `You made ${made} muruku with Paati.`, 'b1', { origin: [0.5, 0], color: COLOR.grey600 });
    new Button(this, 640, 660, {
      label: 'Play again',
      width: 320,
      onClick: () => {
        resetProgress();
        this.go('Title');
      },
    });
  }
}
