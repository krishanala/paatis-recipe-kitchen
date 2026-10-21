import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { art, bokeh, burst, celebrate, doorstepKolam, garland, glow, hangingGarlands, paati, sparkle, twinkles } from '../ui/widgets.js';
import { settings, saveSettings, progress } from '../state.js';
import { resumeStep } from '../flow.js';
import { fontSize } from '../ui/text.js';
import { PAATI } from '../content.js';
import { BLEED, BUTTON_HEIGHT, COLOR, pick } from '../theme.js';

let introPlayed = false; // the welcome greeting plays once per visit to the site

// The game's name: EB Garamond in maroon, raised on a deeper maroon edge.
const SERIF = '"EB Garamond", Garamond, Georgia, serif';
const MAROON = 0x800000;
const MAROON_EDGE = 0x4d0000;
const NAME_DEPTH = 5;

// Screen 1 · Title: a Happy Deepavali greeting, the game name, Paati inviting the player in, Play, then Sound,
// Help and Full screen.
export class TitleScene extends BaseScene {
  constructor() {
    super('Title');
  }

  create() {
    this.setStage('festive');

    // Warm festive light: bokeh, a golden sunburst behind Paati and firework sparkles in the sky.
    bokeh(this, 14, { area: [-BLEED, 90, 620, 700], seed: 'title-left', strength: 0.7 });
    bokeh(this, 30, { area: [620, 90, 1280 + BLEED, 700], seed: 'title-right' });
    glow(this, 930, 330, 300);
    burst(this, 720, 150, 44);
    burst(this, 1160, 172, 58, COLOR.marigold500);
    burst(this, 1214, 440, 38);
    burst(this, 652, 520, 30, COLOR.marigold500);
    garland(this);
    // Marigold strands hang down both sides like a festive doorway, pinned to the screen edges.
    const strands = hangingGarlands(this, [
      [22, 14, 330],
      [56, 14, 220, 'alt'],
      [1224, 14, 220, 'alt'],
      [1258, 14, 330],
    ]);
    this.onView(({ left, right }) => {
      [left + 22, left + 56, right - 56, right - 22].forEach((x, i) => (strands[i].x = x));
    });
    twinkles(this, [
      [700, 150, 12],
      [1180, 140, 14],
      [760, 300, 9],
      [1200, 330, 10],
      [660, 470, 8],
      [1220, 520, 12],
      [560, 130, 9],
    ]);
    // Paati stands at the back of the doorstep kolam with open arms: come in, dear.
    doorstepKolam(this, 930, 634, 430);
    paati(this, 930, 562, PAATI.welcome, 440);
    // A golden lotus diya glows at the heart of the kolam, in front of her.
    art(this, 930, 706, 'lotus-diya', 204).setOrigin(0.5, 1).setDepth(4);

    // Left column: the name, Play, then Sound / Help / Full screen in a row under it, centred vertically and
    // stacked by real heights so it still fits when phones enlarge the text.
    const x = 96;
    const started = progress.step >= 0 || progress.freeKitchen;
    const title = this.gameName(x, 0);
    const icon = BUTTON_HEIGHT.giant; // the icon buttons are drawn at the default (giant) height
    const measure = (str) => {
      const t = this.text(0, 0, str, 'b3');
      const size = { w: t.width, h: t.height };
      t.destroy();
      return size;
    };
    const labelH = measure('Help').h;
    const labelGap = 10; // between each icon button and its label
    const total = title.textHeight + 36 + BUTTON_HEIGHT.giant + 28 + icon + labelGap + labelH;
    let y = Math.max(110, Math.round(392 - total / 2));
    title.setY(y);
    const titleMid = y + title.textHeight / 2;
    y += title.textHeight + 36;

    const playX = x + 150;
    const play = new Button(this, playX, y + BUTTON_HEIGHT.giant / 2, {
      label: started ? 'Continue' : 'Play',
      width: 300,
      onClick: () => {
        // On phones and tablets, Play also goes full screen so the browser's bars don't shrink the game.
        if (window.matchMedia('(pointer: coarse)').matches && this.canFullscreen() && !this.scale.isFullscreen) this.toggleFullscreen();
        const step = resumeStep();
        this.go(step.scene, step.data);
      },
    });
    y += BUTTON_HEIGHT.giant + 28;

    // Sound, Help and Full screen: icon buttons with a label under each, centred under Play.
    const tools = [
      {
        key: 'sound',
        icon: settings.sound ? 'sound-on' : 'sound-off',
        onClick: () => {
          settings.sound = !settings.sound;
          saveSettings();
          this.refreshSound();
        },
      },
      { key: 'help', icon: 'help', label: 'Help', onClick: () => this.openSettings() },
    ];
    if (this.canFullscreen()) tools.push({ key: 'fs', icon: 'fullscreen', label: 'Full screen', onClick: () => this.toggleFullscreen() });
    const spacing = Math.max(icon + 30, Math.max(...['Sound off', 'Full screen'].map((str) => measure(str).w)) + 20);
    const rowY = y + icon / 2;
    const toolParts = [];
    tools.forEach((tool, i) => {
      const bx = playX + (i - (tools.length - 1) / 2) * spacing;
      const button = new Button(this, bx, rowY, { variant: 'icon', icon: tool.icon, onClick: tool.onClick });
      const label = this.text(bx, rowY + icon / 2 + labelGap, tool.label ?? '', 'b3', { origin: [0.5, 0], color: COLOR.grey600 });
      toolParts.push(button, label);
      if (tool.key === 'sound') {
        this.soundButton = button;
        this.soundLabel = label;
      }
      if (tool.key === 'fs') {
        const sync = () => button.setIcon(this.scale.isFullscreen ? 'fullscreen-exit' : 'fullscreen');
        this.scale.on('enterfullscreen', sync);
        this.scale.on('leavefullscreen', sync);
        this.events.once('shutdown', () => {
          this.scale.off('enterfullscreen', sync);
          this.scale.off('leavefullscreen', sync);
        });
        sync();
      }
    });
    this.refreshSound();
    this.events.on('settings-closed', () => this.refreshSound());

    // The welcome greeting plays once per visit to the site; coming back to this screen shows it settled.
    if (!introPlayed) {
      introPlayed = true;
      this.intro(x, titleMid, title, play, toolParts);
    }
  }

  // Welcome: "Happy Deepavali!" pops up with firecrackers and pops away, then "Paati's Recipe" slides in, then
  // Play, then the icons. A tap or key press skips to the end. Reduce motion swaps the steps without movement.
  intro(x, titleMid, title, play, toolParts) {
    const S = pick(1.45, 1.3);
    const banner = this.banner();
    banner.setPosition(x + (banner.bw * S) / 2, titleMid).setScale(S).setDepth(20);
    const parts = [title, play, ...toolParts];
    const home = parts.map((o) => ({ x: o.x, y: o.y }));
    const buttons = parts.filter((o) => o instanceof Button);
    parts.forEach((o) => o.setAlpha(0));
    // Hidden buttons can't be tapped by accident; any tap skips instead.
    buttons.forEach((b) => b.input && (b.input.enabled = false));

    const timers = [];
    const later = (ms, fn) => timers.push(this.time.delayedCall(ms, fn));
    let finished = false;
    const settle = () => {
      if (finished) return;
      finished = true;
      timers.forEach((t) => t.remove(false));
      this.tweens.killTweensOf([banner, ...parts]);
      banner.destroy();
      parts.forEach((o, i) => o.setPosition(home[i].x, home[i].y).setAlpha(1).setScale(1));
      buttons.forEach((b) => b.input && (b.input.enabled = true));
      this.input.off('pointerdown', settle);
      this.input.keyboard?.off('keydown', settle);
    };
    this.input.on('pointerdown', settle);
    this.input.keyboard?.on('keydown', settle);

    if (settings.reduceMotion) {
      later(1600, settle);
      return;
    }
    const fade = (targets, cfg) => this.tweens.add({ targets, alpha: { from: 0, to: 1 }, ...cfg });

    // 1 · Happy Deepavali! pops up, with sparkles and two rockets.
    banner.setScale(0);
    later(200, () => {
      this.tweens.add({ targets: banner, scale: S, duration: 520, ease: 'Back.Out' });
      sparkle(this, banner.x, banner.y, { radius: 280, count: 24, depth: 21 });
      celebrate(this, [
        [x + 70, titleMid - 120],
        [x + banner.bw * S - 60, titleMid - 150],
      ]);
    });
    // 2 · …and pops away.
    later(1900, () => {
      this.tweens.chain({
        targets: banner,
        tweens: [
          { scale: S * 1.12, duration: 140, ease: 'Sine.Out' },
          { scale: 0, alpha: 0, duration: 260, ease: 'Back.In' },
        ],
      });
    });
    // 3 · Paati's Recipe slides in from the left.
    later(2320, () => fade(title, { x: { from: home[0].x - 380, to: home[0].x }, duration: 700, ease: 'Cubic.Out' }));
    // 4 · Then Play, then the icons one by one.
    later(2850, () => fade(play, { y: { from: home[1].y + 36, to: home[1].y }, scale: { from: 0.85, to: 1 }, duration: 420, ease: 'Back.Out' }));
    later(3150, () => {
      for (let i = 0; i < toolParts.length; i += 2) {
        const pair = [toolParts[i], toolParts[i + 1]];
        pair.forEach((o, k) => {
          const h = home[2 + i + k];
          fade(o, { y: { from: h.y + 18, to: h.y }, duration: 320, delay: (i / 2) * 110, ease: 'Cubic.Out' });
        });
      }
    });
    later(3150 + 110 * (toolParts.length / 2) + 340, settle);
  }

  // "Paati's Recipe" in EB Garamond, maroon, standing on a 5 px deeper-maroon edge so it looks raised (3D).
  // The edge is the name repeated 1 to 5 px lower, behind it. Returns a container; textHeight is its full height.
  gameName(x, y) {
    const layer = (dy, colour) =>
      this.text(0, dy, "Paati's Recipe", 'h1', { width: 640, color: colour, weight: 700 }).setFontFamily(SERIF).setFontSize(fontSize('h1') + 10);
    const edge = [];
    for (let d = NAME_DEPTH; d >= 1; d--) edge.push(layer(d, MAROON_EDGE));
    const face = layer(0, MAROON);
    const name = this.add.container(x, y, [...edge, face]);
    name.textHeight = face.height + NAME_DEPTH;
    return name;
  }

  // "Happy Deepavali!" ribbon: a Rani pink pill trimmed in gold, with a lit diya at each end, centred on (0, 0).
  banner() {
    const t = this.text(0, 0, 'Happy Deepavali!', 'h5', { color: COLOR.white, weight: 700, origin: [0, 0.5] });
    const d = Math.round(t.height * 1.15);
    const pad = 18;
    const gap = 10;
    const w = pad + d + gap + t.width + gap + d + pad;
    const h = Math.round(t.height + 24);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.12);
    g.fillRoundedRect(0, 4, w, h, h / 2);
    g.fillStyle(COLOR.rani500, 1);
    g.fillRoundedRect(0, 0, w, h, h / 2);
    g.lineStyle(2, COLOR.yellow500, 1);
    g.strokeRoundedRect(4, 4, w - 8, h - 8, (h - 8) / 2);
    t.setPosition(pad + d + gap, h / 2);
    const left = art(this, pad + d / 2, h / 2 - 3, 'diya', d);
    const right = art(this, w - pad - d / 2, h / 2 - 3, 'diya', d);
    const parts = [g, t, left, right];
    parts.forEach((o) => o.setPosition(o.x - w / 2, o.y - h / 2));
    const c = this.add.container(0, 0, parts);
    c.bw = w;
    return c;
  }

  refreshSound() {
    this.soundButton.setIcon(settings.sound ? 'sound-on' : 'sound-off');
    this.soundLabel.setText(settings.sound ? 'Sound on' : 'Sound off');
  }
}
