import { RES, STAGE, MOOD, css, rgb } from '../theme.js';
import { FocusManager } from '../ui/focus.js';
import { makeText } from '../ui/text.js';
import { SettingsSheet } from '../ui/SettingsSheet.js';
import { settings } from '../state.js';
import { nextStep } from '../flow.js';

// Shared setup for every screen: mood colours, camera zoom for sharp rendering, keyboard focus,
// fades between screens and the Help & settings sheet.
export class BaseScene extends Phaser.Scene {
  setStage(moodKey) {
    this.mood = MOOD[moodKey];
    this.dark = this.mood.dark;
    this.leaving = false;
    this.sheet = null;
    this.input.enabled = true;
    const cam = this.cameras.main;
    cam.setZoom(RES);
    cam.centerOn(STAGE.width / 2, STAGE.height / 2);
    cam.setBackgroundColor(this.mood.bg);
    // Letterbox bars match the screen's mood colour.
    document.body.style.background = css(this.mood.bg);
    this.focus = new FocusManager(this);
    if (!settings.reduceMotion) cam.fadeIn(180, ...rgb(this.mood.bg));
    // Scene events outlive a restart, so drop this visit's listeners when the screen closes.
    this.events.once('shutdown', () => {
      for (const name of ['settings-closed', 'settings-changed', 'escape']) this.events.off(name);
    });
  }

  text(x, y, str, role, opts = {}) {
    return makeText(this, x, y, str, role, { dark: this.dark, ...opts });
  }

  go(key, data = {}) {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    const start = () => this.scene.start(key, data);
    if (settings.reduceMotion) {
      start();
      return;
    }
    this.cameras.main.fadeOut(160, ...rgb(this.mood.bg));
    this.cameras.main.once('camerafadeoutcomplete', start);
  }

  // Next screen of the one-time journey.
  advance() {
    const step = nextStep();
    this.go(step.scene, step.data);
  }

  toTitle() {
    this.go('Title');
  }

  openSettings() {
    if (this.sheet) return;
    this.sheet = new SettingsSheet(this, () => {
      this.sheet = null;
      this.events.emit('settings-closed');
    });
  }
}
