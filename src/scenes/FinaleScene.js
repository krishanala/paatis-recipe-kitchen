import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { art, bokeh, burst, fireworks, garland, glow, hangingGarlands, paati, raisedTitle, ribbon, welcomeStage } from '../ui/widgets.js';
import { fontSize } from '../ui/text.js';
import { FINALE, PAATI, PUPPET } from '../content.js';
import { BUTTON_HEIGHT, COLOR, pick } from '../theme.js';
import { personal, progress, resetProgress, settings } from '../state.js';
import { radioOff, radioOn } from '../radio.js';

// Screen 7 · Finale, in modes:
// 'finale'  Let Paati taste it: Paati enjoys a muruku in her rocking chair on the veranda, with no words, and Next
//           goes on to the last page;
// 'choice'  the last page: Paati's stories of Deepavali, make more muruku (the free kitchen), or finish;
// 'goodbye' Paati's farewell at the very end.
export class FinaleScene extends BaseScene {
  constructor() {
    super('Finale');
  }

  create(data) {
    const mode = data.mode ?? 'finale';
    if (mode === 'finale') return this.veranda();
    this.setStage('festive');
    if (mode === 'choice') return this.choice();
    bokeh(this, 26, { seed: `finale-${mode}` });
    garland(this);
    this.goodbye();
  }

  // Let Paati taste it, with no words: Paati in her rocking chair on the veranda at dusk, the lamps lit along the
  // wall, the old radio playing on the side table beside a plate of muruku. She nibbles, smiles, dabs a happy tear and
  // rocks; the radio's notes drift up; Next appears after a moment. With Reduce motion the chair, notes and lamps
  // stay still and her pictures change in place.
  veranda() {
    this.setStage('festive');
    const still = settings.reduceMotion;
    const FY = 680; // the floor line where the chair and table stand
    art(this, 640, 360, 'veranda', 1800);
    garland(this);

    // Diyas lit along the top of the wall, each with soft light around its flame.
    const soft = this.softGlow();
    for (const x of [-130, -60, 112, 420, 905, 975, 1050, 1125, 1290, 1360, 1430]) {
      art(this, x, 446, 'diya', 40);
      const halo = this.add.image(x, 434, soft).setDisplaySize(70, 70).setTint(0xffb347).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD);
      if (!still) this.tweens.add({ targets: halo, alpha: 0.45, scale: halo.scale * 0.85, duration: 700 + ((x * 7) % 400), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    // The side table, with the radio and a plate of muruku on it.
    this.add.ellipse(300, FY + 2, 280, 18, 0x3a120c, 0.3);
    this.add.image(300, FY, 'side-table').setOrigin(0.5, 250 / 260).setDisplaySize(300, 260);
    const top = FY - 206; // the table's top, where things stand
    const dial = this.add.image(236, top - 42, soft).setDisplaySize(170, 110).setTint(0xffb347).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    const radio = this.add.image(236, top, 'radio').setOrigin(0.5, 1).setDisplaySize(167, 152);
    art(this, 382, top + 2, 'muruku-pile', 112).setOrigin(0.5, 1);
    if (!still) this.tweens.add({ targets: dial, alpha: 0.6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.notes(radio, still);

    // Paati in her rocking chair. The chair is drawn in two layers, back and front, with her between: her top half
    // from the tasting pictures, and the hem of her sari under the shawl on her lap.
    const CX = 650;
    const K = 0.66;
    this.add.ellipse(CX, FY + 4, 420, 26, 0x3a120c, 0.32);
    const chair = (key) => this.add.image(-230, -592, key).setOrigin(0, 0).setDisplaySize(460, 600);
    const px = (-461 * K) / 2;
    const py = -592 + 34;
    const frames = {};
    for (const key of ['bite', 'wipe', 'happy']) {
      frames[key] = this.add.image(px, py, `paati-taste-${key}`).setOrigin(0, 0).setScale(K).setCrop(0, 0, 461, 480).setAlpha(key === 'happy' ? 1 : 0);
    }
    const hem = this.add.image(px, py + 470 - 34 - 690 * K, 'paati-taste-happy').setOrigin(0, 0).setScale(K).setCrop(0, 690, 461, 130);
    const rock = this.add.container(CX, FY, [chair('chair-back'), hem, ...Object.values(frames), chair('chair-front')]);
    this.rock = rock;
    if (!still) {
      rock.angle = -1.3;
      this.tweens.add({ targets: rock, angle: 1.3, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    // What she does, round and round: a bite (crumbs fall into her lap), a happy smile, a dab of a happy tear, a smile.
    const mouth = { x: px + 248 * K, y: py + 262 * K };
    let shown = frames.happy;
    const show = (key) => {
      const next = frames[key];
      if (next === shown) return next;
      if (still) {
        shown.setAlpha(0);
        next.setAlpha(1);
      } else {
        this.tweens.add({ targets: shown, alpha: 0, duration: 220 });
        this.tweens.add({ targets: next, alpha: 1, duration: 220 });
      }
      shown = next;
      return next;
    };
    const steps = [
      ['bite', 2400],
      ['happy', 2000],
      ['wipe', 1800],
      ['happy', 2600],
    ];
    let i = 0;
    const step = () => {
      const [key, ms] = steps[i];
      const f = show(key);
      if (key === 'bite' && !still) {
        this.crumbs(rock, mouth.x + 10, mouth.y + 10, 8);
        this.tweens.add({ targets: f, scaleY: K * 0.985, duration: 140, yoyo: true, repeat: 2, ease: 'Sine.InOut' });
      }
      i = (i + 1) % steps.length;
      this.time.delayedCall(ms, step);
    };
    this.time.delayedCall(700, step);

    // The radio plays while Sound is on.
    if (settings.sound) radioOn();
    this.events.on('settings-changed', () => (settings.sound ? radioOn() : radioOff()));
    this.events.once('shutdown', radioOff);

    const next = new Button(this, 1040, 652, { label: 'Next', width: 280, onClick: () => this.go('Finale', { mode: 'choice' }) });
    next.setAlpha(0).setEnabled(false);
    this.time.delayedCall(still ? 600 : 2600, () => {
      next.setEnabled(true);
      if (still) next.setAlpha(1);
      else this.tweens.add({ targets: next, alpha: 1, y: { from: next.y + 16, to: next.y }, duration: 380, ease: 'Cubic.Out' });
    });
  }

  // A round, soft white glow (made once), to tint for lamp light.
  softGlow() {
    const key = 'soft-glow';
    if (!this.textures.exists(key)) {
      const t = this.textures.createCanvas(key, 128, 128);
      const ctx = t.getContext();
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      t.refresh();
    }
    return key;
  }

  // Music notes rise from the radio's speaker, sway, and fade: a few at a time. With Reduce motion two notes stay
  // still beside it.
  notes(radio, still) {
    const x = radio.x + 20;
    const y = radio.y - radio.displayHeight + 30;
    const note = (nx, ny, double) => {
      const g = this.add.graphics({ x: nx, y: ny });
      g.lineStyle(3, 0x5a2f1a, 0.55);
      g.fillStyle(0xfff1c4, 1);
      const head = (hx, hy) => {
        g.fillEllipse(hx, hy, 13, 9.5);
        g.strokeEllipse(hx, hy, 13, 9.5);
      };
      g.fillStyle(0xfff1c4, 1);
      if (double) {
        g.fillRect(4, -24, 3, 24);
        g.fillRect(22, -28, 3, 24);
        g.fillPoints([{ x: 4, y: -24 }, { x: 25, y: -28 }, { x: 25, y: -22 }, { x: 4, y: -18 }], true);
        head(0, 0);
        head(18, -4);
      } else {
        g.fillRect(4, -26, 3, 26);
        g.fillPoints([{ x: 7, y: -26 }, { x: 16, y: -16 }, { x: 14, y: -13 }, { x: 7, y: -19 }], true);
        head(0, 0);
      }
      return g.setAngle(-8);
    };
    if (still) {
      note(x + 70, y - 40, true);
      note(x + 30, y - 90, false);
      return;
    }
    let n = 0;
    const spawn = () => {
      const g = note(x + Phaser.Math.Between(-20, 20), y, n++ % 3 === 0).setAlpha(0).setScale(0.8);
      const dx = Phaser.Math.Between(70, 170);
      this.tweens.add({ targets: g, alpha: { from: 0, to: 1 }, duration: 400 });
      this.tweens.add({ targets: g, x: g.x + dx, y: g.y - Phaser.Math.Between(150, 220), scale: 1.05, duration: 3200, ease: 'Sine.Out' });
      this.tweens.add({ targets: g, angle: 8, duration: 800, yoyo: true, repeat: 1, ease: 'Sine.InOut' });
      this.tweens.add({ targets: g, alpha: 0, delay: 2300, duration: 900, onComplete: () => g.destroy() });
    };
    spawn();
    this.time.addEvent({ delay: 950, loop: true, callback: spawn });
  }

  // Golden crumbs that fall from her muruku into her lap (inside the rocking chair, so they rock with her).
  crumbs(parent, x, y, count) {
    for (let i = 0; i < count; i++) {
      const c = this.add.circle(x, y, 1.6 + Math.random() * 2.4, [0xd9a441, 0xc07a2a, 0xe8b860][i % 3]);
      parent.add(c);
      this.tweens.add({
        targets: c,
        x: x + Phaser.Math.Between(-24, 30),
        y: y + Phaser.Math.Between(60, 110),
        alpha: 0,
        duration: Phaser.Math.Between(600, 900),
        ease: 'Quad.In',
        onComplete: () => c.destroy(),
      });
    }
  }

  // The welcome page's layout: a ribbon, a raised maroon heading, a line of text and rows of buttons on the left, and
  // Paati at the doorstep kolam on the right. They come in one after another, unless Reduce motion is on. `rows` is a
  // list of rows, each a list of buttons side by side.
  welcomeLayout({ pose, ribbonText, title, text, rows }) {
    welcomeStage(this, pose);
    const x = 96;
    const band = ribbon(this, ribbonText);
    const head = raisedTitle(this, x, 0, title, { size: fontSize('h1'), width: 560 });
    const line = this.text(x, 0, text, 's1', { width: pick(540, 650), color: COLOR.grey600 });
    const made = rows.map((row) => {
      let bx = x;
      return row.map((b) => {
        const btn = new Button(this, bx + b.width / 2, 0, b);
        bx += b.width + 20;
        return btn;
      });
    });
    const rowH = made.map((row) => Math.max(...row.map((b) => b.bh)));
    // Phones have less height for the bigger text, so the gaps are tighter there.
    const gap = pick({ band: 22, head: 16, line: 32, row: 16 }, { band: 12, head: 10, line: 20, row: 10 });
    const buttonsH = rowH.reduce((a, h) => a + h, 0) + (rows.length - 1) * gap.row;
    const total = band.bh + gap.band + head.textHeight + gap.head + line.height + gap.line + buttonsH;
    let y = Math.max(pick(104, 96), Math.round(392 - total / 2));
    band.setPosition(x + band.bw / 2, y + band.bh / 2);
    y += band.bh + gap.band;
    head.setY(y);
    y += head.textHeight + gap.head;
    line.setY(y);
    y += line.height + gap.line;
    made.forEach((row, r) => {
      row.forEach((btn) => btn.setY(y + rowH[r] / 2));
      y += rowH[r] + gap.row;
    });
    if (!settings.reduceMotion) {
      band.setScale(0);
      this.tweens.add({ targets: band, scale: 1, duration: 420, ease: 'Back.Out' });
      this.tweens.add({ targets: head, x: { from: x - 120, to: x }, alpha: { from: 0, to: 1 }, duration: 520, delay: 160, ease: 'Cubic.Out' });
      this.tweens.add({ targets: line, alpha: { from: 0, to: 1 }, duration: 400, delay: 380 });
      made.flat().forEach((btn, i) => this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, y: { from: btn.y + 16, to: btn.y }, duration: 360, delay: 520 + i * 110, ease: 'Cubic.Out' }));
    }
    return made.flat();
  }

  // The last page: Paati's stories of Deepavali (the cards), or make more muruku in the free kitchen (or just finish). If no story
  // has been watched yet, Paati says so and the show comes first; skipping it is fine.
  choice() {
    const none = !progress.watched.length;
    const all = progress.watched.length === PUPPET.stories.length;
    const watch = {
      label: all ? 'Watch a story again' : none ? 'Learn more about Deepavali' : 'Watch another story',
      width: pick(420, 560),
      variant: none ? 'filled' : 'outline',
      accent: !none,
      onClick: () => this.go('Puppet', { from: 'end' }),
    };
    const more = {
      label: 'Make more muruku',
      width: pick(420, 560),
      variant: none ? 'outline' : 'filled',
      accent: none,
      onClick: () => {
        progress.freeKitchen = true;
        this.go('Store', { mode: 'free' });
      },
    };
    const finish = { label: none ? 'Skip both and finish' : 'Finish', width: pick(300, 440), size: pick('large', 'medium'), variant: 'clear', align: 'left', inset: 16, dark: false, onClick: () => this.go('Finale', { mode: 'goodbye' }) };
    this.welcomeLayout({
      pose: PAATI.celebrating,
      ribbonText: personal(FINALE.choiceRibbon),
      title: FINALE.choiceTitle,
      text: personal(none ? FINALE.choiceMissed : FINALE.choiceText),
      rows: [[watch], [more], [finish]],
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
    const line = this.text(640, made.y - made.height - 6, personal(FINALE.goodbye), 's1', { origin: [0.5, 1], width: 760, align: 'center' });
    const bottom = line.y - line.height - 12;
    const top = head.y + head.textHeight + 10;
    const h = Math.min(340, bottom - top);
    glow(this, 640, bottom - h * 0.52, h * 0.64).setDepth(-1);
    paati(this, 640, bottom, PAATI.proud, h);
  }
}
