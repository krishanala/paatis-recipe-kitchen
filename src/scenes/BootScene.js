import { COLOR, RES, STAGE } from '../theme.js';

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
  ['banana-leaf', 1.2],
  ['petals', 1],
  ['sack-rice-flour', 1.2],
  ['jar-steel', 1.2],
  ['flour-tin', 1.2],
  ['spice-tin', 1.2],
  ['ghee-jar', 1.2],
  ['jar-clay', 1.2],
  ['press-empty', 1.2],
  ['press-filled', 1.2],
  ['press-plunger', 1.2],
  ['press-top', 1],
  ['plate-star', 1],
  ['plate-round', 1],
  ['plate-ribbon', 1],
  ['pan-hot', 1.2],
  ['muruku-golden', 1],
  ['parchment', 1.2],
  ['scroll-roll', 1.2],
  ['pigeon-body', 1],
  ['pigeon-wing', 1],
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
    // Paati is illustrated art (assets/paati), cut out from the source images in assets/paati/source.
    for (const pose of ['welcome', 'teaching', 'proud', 'sharing', 'avatar']) {
      this.load.image(`paati-${pose}`, `assets/paati/${pose}.png`);
    }
  }

  create() {
    this.scene.start('Title');
  }
}
