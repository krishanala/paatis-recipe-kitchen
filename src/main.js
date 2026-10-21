import { STAGE, COLOR, RES, viewWidth } from './theme.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { StoryScene } from './scenes/StoryScene.js';
import { QuizScene } from './scenes/QuizScene.js';
import { StoreScene } from './scenes/StoreScene.js';
import { CookScene } from './scenes/CookScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';
import { NoteScene } from './scenes/NoteScene.js';

// Phaser measures text when it is created, so wait (briefly) for the fonts to load first: Inter, EB Garamond for
// the game's name, Poppins for the Play button, and Kalam for handwriting.
const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
const faces = [...['400', '500', '600', '700'].map((w) => `${w} 24px Inter`), '700 24px "EB Garamond"', '600 24px Poppins', '400 24px Kalam'];
const fonts = Promise.all(faces.map((face) => document.fonts.load(face))).catch(() => {});
await Promise.race([fonts, timeout]);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // Designed at 1280×720 and rendered at the size it shows on screen (theme.js → RES); BaseScene zooms to match.
  width: Math.round(viewWidth() * RES),
  height: Math.round(STAGE.height * RES),
  backgroundColor: COLOR.offWhite,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: 'game' },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene, StoryScene, QuizScene, StoreScene, CookScene, ResultScene, NoteScene, FinaleScene],
});

// When the window changes shape (turning a phone, entering full screen), widen or narrow the view to match.
// BaseScene re-fits its camera when the game size changes.
// While a text field has focus (the note at the end), a phone keyboard can squash the window: wait until typing ends.
const typing = () => document.activeElement?.matches?.('input, textarea');
function refit() {
  if (typing()) return;
  const width = Math.round(viewWidth() * RES);
  if (width !== game.scale.width) game.scale.setGameSize(width, Math.round(STAGE.height * RES));
}
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(refit, 120);
});
document.addEventListener('focusout', () => setTimeout(refit, 150));

// Handy in the browser console while developing.
window.muruku = game;
