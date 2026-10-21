import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, bokeh, burst, card, fireworks, garland, glow, hangingGarlands, paati, sparkle } from '../ui/widgets.js';
import { makeText } from '../ui/text.js';
import { FINALE, PAATI, RECAP } from '../content.js';
import { COLOR, COMPACT, pick } from '../theme.js';
import { progress, resetProgress, settings } from '../state.js';
import { paintMuruku } from '../draw.js';

// Screen 7 · Finale: the player offers their muruku to Paati, sees a recap of what they learned, then
// chooses to make more muruku (free kitchen) or finish. mode 'goodbye' is Paati's farewell at the very end.
export class FinaleScene extends BaseScene {
  constructor() {
    super('Finale');
  }

  create(data) {
    this.setStage('festive');
    bokeh(this, 26, { seed: `finale-${data.mode}` });
    garland(this);
    if (data.mode === 'goodbye') this.goodbye();
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

  recap() {
    fireworks(this, { top: 110, bottom: 300 });
    glow(this, 230, 470, 190);
    paati(this, 230, 630, PAATI.celebrating, pick(330, 300));
    new PaatiBubble(this, 40, 116, 400, { avatar: false }).say(FINALE.thanks);
    this.text(40, 644, FINALE.safety, 'b3', { width: 400, color: COLOR.grey600 });

    // Card, Vertical: three things the player learned. Rows grow with their text.
    const x = 480;
    const w = 760;
    const heading = makeText(this, x + 44, 140, 'What you learned', 'h4');
    let y = heading.y + heading.height + 16;
    RECAP.forEach((item) => {
      const title = makeText(this, x + 120, y, item.title, 's1', { weight: 700 });
      art(this, x + 74, y + title.height / 2 + 6, 'diya', 44);
      const body = makeText(this, x + 120, y + title.height + 2, item.text, 'b1', { width: w - 170, color: COLOR.grey600 });
      y = body.y + body.height + 14;
    });
    card(this, x, 116, w, y + 6 - 116, { kolam: true }).setDepth(-1);

    // On phones the buttons ask the question themselves; there is no room for the extra line.
    if (!COMPACT) this.text(x + w / 2, y + 24, FINALE.more, 's1', { origin: [0.5, 0], weight: 600 });
    const moreW = pick(340, 400);
    new Button(this, 1090 - 120 - 30 - moreW / 2, 650, {
      label: 'Make more muruku',
      width: moreW,
      onClick: () => {
        progress.freeKitchen = true;
        this.go('Store', { mode: 'free' });
      },
    });
    new Button(this, 1090, 650, { label: 'Finish', variant: 'outline', width: 240, onClick: () => this.finishGame() });
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
