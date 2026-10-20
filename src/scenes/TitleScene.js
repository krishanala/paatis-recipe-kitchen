import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { art, bokeh, burst, doorstepKolam, garland, glow, hangingGarlands, paati, twinkles } from '../ui/widgets.js';
import { settings, saveSettings, progress } from '../state.js';
import { resumeStep } from '../flow.js';
import { PAATI } from '../content.js';
import { BUTTON_HEIGHT, COLOR } from '../theme.js';

// Screen 1 · Title: Happy Deepavali, the game name, Paati inviting the player in, Play, Sound, Help.
export class TitleScene extends BaseScene {
  constructor() {
    super('Title');
  }

  create() {
    this.setStage('festive');

    // Warm festive light: bokeh, a golden sunburst behind Paati and firework sparkles in the sky.
    bokeh(this, 10, { area: [0, 90, 620, 700], seed: 'title-left', strength: 0.7 });
    bokeh(this, 24, { area: [620, 90, 1280, 700], seed: 'title-right' });
    glow(this, 930, 330, 300);
    burst(this, 720, 150, 44);
    burst(this, 1160, 172, 58, COLOR.marigold500);
    burst(this, 1214, 440, 38);
    burst(this, 652, 520, 30, COLOR.marigold500);
    garland(this);
    // Marigold strands hang down both sides like a festive doorway.
    hangingGarlands(this, [
      [22, 14, 330],
      [56, 14, 220, 'alt'],
      [1224, 14, 220, 'alt'],
      [1258, 14, 330],
    ]);
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

    // Left column: banner, name, then Play / Sound / Help, centred vertically and stacked by real heights so it
    // still fits when phones enlarge the text.
    const started = progress.step >= 0 || progress.freeKitchen;
    const title = this.text(96, 0, "Paati's Recipe Kitchen", 'h1', { width: 620, color: COLOR.indigo900 });
    const probe = this.text(0, 0, 'Happy Deepavali!', 'h5', { weight: 700 });
    const bannerH = probe.height + 24;
    probe.destroy();
    const total = bannerH + 18 + title.height + 36 + BUTTON_HEIGHT.giant + 34;
    let y = this.banner(96, Math.max(104, Math.round(400 - total / 2))) + 18;
    title.setY(y);
    y += title.height + 36;

    // Play, Sound and Help share one row.
    const rowY = y + BUTTON_HEIGHT.giant / 2;
    new Button(this, 96 + 150, rowY, {
      label: started ? 'Continue' : 'Play',
      width: 300,
      onClick: () => {
        const step = resumeStep();
        this.go(step.scene, step.data);
      },
    });
    const iconX = 96 + 300 + 30 + BUTTON_HEIGHT.icon / 2;
    const labelY = rowY + BUTTON_HEIGHT.icon / 2 + 6;
    const sound = new Button(this, iconX, rowY, {
      variant: 'icon',
      icon: settings.sound ? 'sound-on' : 'sound-off',
      onClick: () => {
        settings.sound = !settings.sound;
        saveSettings();
        this.refreshSound();
      },
    });
    this.soundLabel = this.text(iconX, labelY, '', 'b3', { origin: [0.5, 0], color: COLOR.grey600 });
    const helpX = iconX + BUTTON_HEIGHT.icon + 30;
    new Button(this, helpX, rowY, { variant: 'icon', icon: 'help', onClick: () => this.openSettings() });
    this.text(helpX, labelY, 'Help', 'b3', { origin: [0.5, 0], color: COLOR.grey600 });
    this.soundButton = sound;
    this.refreshSound();
    this.events.on('settings-closed', () => this.refreshSound());

    this.text(96, 696, 'Starter build · draft stories, placeholder art', 'b3', { origin: [0, 1], color: COLOR.grey600 });
  }

  // "Happy Deepavali!" ribbon: a Rani pink pill trimmed in gold, with a lit diya at each end. Returns its bottom.
  banner(x, y) {
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
    this.add.container(x, y, [g, t, left, right]);
    twinkles(this, [
      [x + w + 16, y + 6, 9],
      [x + w + 4, y + h - 2, 6],
    ]);
    return y + h;
  }

  refreshSound() {
    this.soundButton.setIcon(settings.sound ? 'sound-on' : 'sound-off');
    this.soundLabel.setText(settings.sound ? 'Sound on' : 'Sound off');
  }
}
