import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, bokeh, burst, fireworks, garland, glow, hangingGarlands, paati, raisedTitle, ribbon, sparkle, welcomeStage } from '../ui/widgets.js';
import { BUTTON_FONT, fontSize } from '../ui/text.js';
import { FINALE, PAATI } from '../content.js';
import { BUTTON_HEIGHT, COLOR, pick } from '../theme.js';
import { progress, resetProgress, settings } from '../state.js';
import { paintMuruku } from '../draw.js';

// Screen 7 · Finale, in modes:
// 'finale'  Let Paati taste it: the player offers their muruku, Paati tastes it and says thank you, and Next goes
//           on to Bonus for your heart (or the last page, once the note has been offered);
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

  // Let Paati taste it: the player's muruku on a banana leaf. Offered, it flies over to her and she tastes it.
  offer() {
    this.pinToEdges(
      hangingGarlands(this, [
        [22, 14, 290],
        [56, 14, 196, 'alt'],
        [1224, 14, 196, 'alt'],
        [1258, 14, 290],
      ]),
    );
    burst(this, 640, 300, 40);
    burst(this, 1120, 200, 50, COLOR.marigold500);
    this.text(640, 130, FINALE.offer, 'h3', { origin: [0.5, 0], width: 1100, align: 'center' });
    const light = glow(this, 900, 430, 240);
    const welcome = paati(this, 900, 712, PAATI.welcome, 540);
    const gift = [art(this, 380, 400, 'banana-leaf', 360)];
    if (progress.lastMuruku) gift.push(...paintMuruku(this, progress.lastMuruku, 380, 392, 180));
    else gift.push(art(this, 380, 392, 'muruku-golden', 180));
    const offer = new Button(this, 380, 620, {
      label: 'Offer to Paati',
      width: 320,
      onClick: () => {
        offer.setEnabled(false);
        this.taste(welcome, light, gift, offer);
      },
    });
  }

  // Paati tastes it in the middle of the screen, one picture after another: a bite (Crunch!), chewing with crumbs
  // flying, a happy dab of her eyes, then she looks at the player and says thank you, and Next appears. A tap or key
  // press skips to the end. With Reduce motion she moves to the middle at once and the pictures change in place.
  taste(welcome, light, gift, offer) {
    const still = settings.reduceMotion;
    const mid = 640;
    const tall = 520; // a little shorter than on the offering page, so her head clears the heading
    const frames = {};
    for (const key of ['bite', 'chew', 'wipe', 'happy']) {
      const f = paati(this, mid, 712, `paati-taste-${key}`, tall).setAlpha(0);
      f.home = f.scaleX;
      frames[key] = f;
    }
    const mouth = { x: mid + 5, y: 312 };
    let shown = welcome;
    const show = (key) => {
      const next = frames[key];
      if (still) {
        shown.setAlpha(0);
        next.setAlpha(1);
      } else {
        this.tweens.add({ targets: shown, alpha: 0, duration: 200 });
        this.tweens.add({ targets: next, alpha: 1, duration: 200 });
      }
      shown = next;
      return next;
    };

    const timers = [];
    const later = (ms, fn) => timers.push(this.time.delayedCall(ms, fn));
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach((t) => t.remove(false));
      this.input.off('pointerdown', finish);
      this.input.keyboard?.off('keydown', finish);
      this.tweens.killTweensOf([welcome, light, offer, ...gift, ...Object.values(frames)]);
      light.setX(mid - 900);
      gift.forEach((o) => o.destroy());
      offer.destroy();
      welcome.setAlpha(0);
      Object.values(frames).forEach((f) => f.setAlpha(0).setScale(f.home).setAngle(0));
      frames.happy.setAlpha(1);
      this.thanks();
    };
    this.input.on('pointerdown', finish);
    this.input.keyboard?.on('keydown', finish);

    // Paati steps into the middle, with her glow, as the muruku goes over to her.
    const scale = (welcome.scaleX * tall) / 540;
    if (still) {
      [...gift, offer].forEach((o) => o.setVisible(false));
      welcome.setX(mid).setScale(scale);
      light.setX(mid - 900);
    } else {
      this.tweens.add({ targets: offer, alpha: 0, duration: 200 });
      this.tweens.add({ targets: welcome, x: mid, scale, duration: 520, ease: 'Cubic.InOut' });
      this.tweens.add({ targets: light, x: mid - 900, duration: 520, ease: 'Cubic.InOut' });
      this.tweens.add({ targets: gift, x: '+=265', y: '-=20', alpha: 0, duration: 700, delay: 120, ease: 'Cubic.In' });
    }
    // 1 · A bite.
    later(620, () => {
      const f = show('bite');
      if (still) return;
      this.crunch(mouth);
      this.tweens.add({ targets: f, scaleY: f.home * 0.97, duration: 110, yoyo: true, ease: 'Sine.InOut' });
    });
    // 2 · Chewing, with crumbs flying.
    later(2000, () => {
      const f = show('chew');
      if (still) return;
      this.tweens.add({ targets: f, scaleY: f.home * 0.985, duration: 170, yoyo: true, repeat: 4, ease: 'Sine.InOut' });
      for (let i = 0; i < 4; i++) later(120 + i * 340, () => this.crumbs(mouth.x + 40, mouth.y - 6, 5));
    });
    // 3 · A happy dab of her eyes with her handkerchief.
    later(3600, () => {
      const f = show('wipe');
      if (still) return;
      this.tweens.add({ targets: f, angle: { from: -1.5, to: 1.5 }, duration: 420, yoyo: true, repeat: 1, ease: 'Sine.InOut', onComplete: () => f.setAngle(0) });
    });
    // 4 · Happy and content, she looks at the player.
    later(5100, () => {
      show('happy');
      sparkle(this, mid, 270, { radius: 170, count: 20 });
    });
    later(5600, finish);
  }

  // "Crunch!" pops up beside Paati's mouth, with a spray of crumbs.
  crunch({ x, y }) {
    const word = this.text(x + 136, y - 70, FINALE.crunch, 'h4', { weight: 700, color: 0xb35600, origin: 0.5 })
      .setFontFamily(BUTTON_FONT)
      .setStroke('#ffffff', 8)
      .setAngle(-8)
      .setScale(0)
      .setDepth(5);
    this.tweens.add({ targets: word, scale: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: word, y: word.y - 30, alpha: 0, delay: 900, duration: 420, ease: 'Sine.In', onComplete: () => word.destroy() });
    this.crumbs(x + 30, y, 10);
  }

  // Golden crumbs that spray out and fall.
  crumbs(x, y, count) {
    for (let i = 0; i < count; i++) {
      const c = this.add.circle(x, y, 2 + Math.random() * 3, [0xd9a441, 0xc07a2a, 0xe8b860][i % 3]).setDepth(5);
      this.tweens.add({
        targets: c,
        x: x + Phaser.Math.Between(-10, 56),
        y: y + Phaser.Math.Between(40, 120),
        alpha: 0,
        duration: Phaser.Math.Between(600, 900),
        ease: 'Quad.In',
        onComplete: () => c.destroy(),
      });
    }
  }

  // Paati's thanks, in a bubble on her left pointing at her, then Next on her right.
  thanks() {
    const x = 72;
    const y = 262;
    const w = 400;
    const bubble = new PaatiBubble(this, x, y, w, { avatar: false }).say(FINALE.thanks);
    const tail = this.add.graphics();
    tail.fillStyle(COLOR.white, 1);
    tail.fillTriangle(x + w - 2, y + 32, x + w + 18, y + 48, x + w - 2, y + 64);
    const next = new Button(this, 1010, 620, {
      label: 'Next',
      width: 320,
      onClick: () => this.go('Finale', { mode: progress.noteDone ? 'choice' : 'bonus' }),
    });
    if (!settings.reduceMotion) {
      this.tweens.add({ targets: bubble, alpha: { from: 0, to: 1 }, y: { from: y + 16, to: y }, duration: 320, ease: 'Cubic.Out' });
      this.tweens.add({ targets: tail, alpha: { from: 0, to: 1 }, y: { from: 16, to: 0 }, duration: 320, ease: 'Cubic.Out' });
      this.tweens.add({ targets: next, alpha: { from: 0, to: 1 }, y: { from: next.y + 18, to: next.y }, duration: 360, delay: 260, ease: 'Cubic.Out' });
    }
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
    // Golden lotus diyas glow in both bottom corners, pinned to the screen edges so text never runs into them.
    const diyas = [art(this, 0, 704, 'lotus-diya', 240).setOrigin(0.5, 1), art(this, 0, 704, 'lotus-diya', 240).setOrigin(0.5, 1)];
    this.onView(({ left, right }) => {
      diyas[0].x = left + 170;
      diyas[1].x = right - 170;
    });

    // Stacked by real heights from the bottom up, so nothing overlaps whatever the text size:
    // Play again, the muruku count, Paati's goodbye, then Paati fills the space under the heading.
    const head = raisedTitle(this, 640, 104, 'Happy Deepavali!', { size: fontSize('h1'), width: 1000, align: 'center', origin: [0.5, 0] });
    const again = new Button(this, 640, 660, {
      label: 'Play again',
      width: 320,
      onClick: () => {
        resetProgress();
        this.go('Title');
      },
    });
    const count = (progress.lastMuruku ? 1 : 0) + progress.plate;
    const made = this.text(640, again.y - again.bh / 2 - 16, `You made ${count} muruku with Paati.`, 'b1', { origin: [0.5, 1], color: COLOR.grey600 });
    const line = this.text(640, made.y - made.height - 6, FINALE.goodbye, 's1', { origin: [0.5, 1], width: 760, align: 'center' });
    const bottom = line.y - line.height - 12;
    const top = head.y + head.textHeight + 10;
    const h = Math.min(340, bottom - top);
    glow(this, 640, bottom - h * 0.52, h * 0.64).setDepth(-1);
    paati(this, 640, bottom, PAATI.proud, h);
  }
}
