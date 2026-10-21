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
    this.fitCamera();
    cam.setBackgroundColor(this.mood.bg);
    this.scale.on('resize', this.fitCamera, this);
    // Letterbox bars (and the full-screen backdrop) match the screen's mood colour.
    document.body.style.background = css(this.mood.bg);
    const holder = document.getElementById('game');
    if (holder) holder.style.background = css(this.mood.bg);
    this.focus = new FocusManager(this);
    if (!settings.reduceMotion) cam.fadeIn(180, ...rgb(this.mood.bg));
    // Scene events outlive a restart, so drop this visit's listeners when the screen closes.
    this.events.once('shutdown', () => {
      for (const name of ['settings-closed', 'settings-changed', 'escape', 'view-resize']) this.events.off(name);
      this.scale.off('resize', this.fitCamera, this);
    });
  }

  // The camera always shows the whole 1280×720 stage, centred; on wide screens it shows extra width at the sides.
  fitCamera() {
    const cam = this.cameras.main;
    cam.setSize(this.scale.width, this.scale.height);
    cam.setZoom(RES);
    cam.centerOn(STAGE.width / 2, STAGE.height / 2);
    this.events.emit('view-resize', this.viewBounds());
  }

  // The visible stage x range: 0–1280 on 16:9 screens, wider on phones held sideways.
  viewBounds() {
    const half = this.scale.width / RES / 2;
    return { left: STAGE.width / 2 - half, right: STAGE.width / 2 + half };
  }

  // Run fn(bounds) now and whenever the view changes width, for things pinned to the screen edges.
  onView(fn) {
    fn(this.viewBounds());
    this.events.on('view-resize', fn);
  }

  // Full screen hides the browser's bars, which matters most on phones. Must be called from a tap or click.
  canFullscreen() {
    return Boolean(this.scale.fullscreen?.available);
  }

  toggleFullscreen() {
    if (!this.canFullscreen()) return;
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      return;
    }
    this.scale.once('enterfullscreen', () => window.screen.orientation?.lock?.('landscape').catch(() => {}));
    this.scale.startFullscreen();
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
