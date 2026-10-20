import { STAGE, COLOR, RES } from './theme.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { StoryScene } from './scenes/StoryScene.js';
import { QuizScene } from './scenes/QuizScene.js';
import { StoreScene } from './scenes/StoreScene.js';
import { CookScene } from './scenes/CookScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';

// Phaser measures text when it is created, so wait (briefly) for Inter to load first.
const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
const fonts = Promise.all(['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 24px Inter`))).catch(() => {});
await Promise.race([fonts, timeout]);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // Designed at 1280×720 and rendered at the size it shows on screen (theme.js → RES); BaseScene zooms to match.
  width: Math.round(STAGE.width * RES),
  height: Math.round(STAGE.height * RES),
  backgroundColor: COLOR.offWhite,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene, StoryScene, QuizScene, StoreScene, CookScene, ResultScene, FinaleScene],
});

// Handy in the browser console while developing.
window.muruku = game;
