import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { celebrate, raisedTitle, ribbon, sparkle, welcomeStage } from '../ui/widgets.js';
import { settings, saveSettings, progress } from '../state.js';
import { resumeStep } from '../flow.js';
import { PAATI } from '../content.js';
import { BUTTON_HEIGHT, COLOR, pick } from '../theme.js';

let introPlayed = false; // the welcome greeting plays once per visit to the site

// Screen 1 · Title: a Happy Deepavali greeting, the game name, Paati inviting the player in, Play, then Sound,
// Help and Full screen.
export class TitleScene extends BaseScene {
  constructor() {
    super('Title');
  }

  create() {
    this.setStage('festive');

    // Paati invites the player in from the doorstep kolam, in warm festive light.
    welcomeStage(this, PAATI.welcome);

    // Left column: the name, Play, then Sound / Help / Full screen in a row under it, centred vertically and
    // stacked by real heights so it still fits when phones enlarge the text.
    const x = 96;
    const started = progress.step >= 0 || progress.freeKitchen;
    const title = raisedTitle(this, x, 0, "Paati's Recipe");
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
    const banner = ribbon(this, 'Happy Deepavali!');
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

  refreshSound() {
    this.soundButton.setIcon(settings.sound ? 'sound-on' : 'sound-off');
    this.soundLabel.setText(settings.sound ? 'Sound on' : 'Sound off');
  }
}
