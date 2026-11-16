import { COLOR, RES, STAGE } from '../theme.js';
import { shortcut } from '../shortcuts.js';

// [file in assets/art, largest display scale used] — SVGs are rasterised at that scale × render resolution.
const ART = [
  ['diya', 1],
  ['diya-unlit', 1],
  ['kolam-doorstep', 1.2],
  ['lotus-diya', 0.8],
  ['marigold-orange', 0.32],
  ['marigold-yellow', 0.32],
  ['marigold-deep', 0.32],
  ['rose', 0.5],
  ['jasmine-tassel', 0.6],
  ['mango-leaf', 0.65],
  ['brass-bell', 0.55],
  ['petals', 1],
  ['jar-clay', 1.2],
  ['press-empty', 1.2],
  ['press-filled', 1.2],
  ['press-plunger', 1.2],
  ['press-top', 1],
  ['plate-star', 1],
  ['plate-round', 1],
  ['plate-ribbon', 1],
  ['pot-oil', 1.2],
  ['bowl-back', 1],
  ['bowl-front', 1],
  ['pitcher', 0.7],
  ['muruku-golden', 1],
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const cam = this.cameras.main;
    cam.setZoom(RES);
    cam.centerOn(STAGE.width / 2, STAGE.height / 2);
    const bar = this.add.graphics();
    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(COLOR.grey900, 0.08);
      bar.fillRoundedRect(440, 352, 400, 16, 8);
      bar.fillStyle(COLOR.yellow500, 1);
      bar.fillRoundedRect(440, 352, Math.max(16, 400 * v), 16, 8);
    });
    for (const [key, scale] of ART) {
      this.load.svg(key, `assets/art/${key}.svg`, { scale: scale * RES });
    }
    // The user's illustrations (PNG, cut out from white with tools/cutout.swift).
    for (const key of ['rice-flour', 'urad-dal', 'flour-sack', 'spice-tray', 'ghee-pot', 'banana-leaf', 'muruku-pile']) {
      this.load.image(key, `assets/art/${key}.png`);
    }
    // Paati is illustrated art (assets/paati), cut out from the source images in assets/paati/source.
    for (const pose of ['welcome', 'teaching', 'proud', 'sharing', 'avatar', 'taste-bite', 'taste-wipe', 'taste-happy']) {
      this.load.image(`paati-${pose}`, `assets/paati/${pose}.png`);
    }
  }

  create() {
    // ?screen= in the address opens one screen straight away (src/shortcuts.js); otherwise the Title.
    const jump = shortcut();
    if (jump) this.scene.start(jump.scene, jump.data);
    else this.scene.start('Title');
  }
}
