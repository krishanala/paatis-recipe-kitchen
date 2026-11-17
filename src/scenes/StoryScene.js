import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, bokeh, doorstepKolam, glow, header, paati } from '../ui/widgets.js';
import { CHAPTERS, NAME, STORIES } from '../content.js';
import { storyLines } from '../quiz.js';
import { COLOR } from '../theme.js';
import { cleanName, personal, progress } from '../state.js';
import { textField } from '../ui/field.js';

// Screen 2 · Paati's story: the lines that open each chapter, one at a time. Before a quiz she tells the fact behind
// each question she is about to ask (src/quiz.js). On the Welcome page, Paati also asks what to call the player,
// between her two lines.
export class StoryScene extends BaseScene {
  constructor() {
    super('Story');
  }

  create(data) {
    const id = data.story;
    const story = STORIES[id];
    const chapter = CHAPTERS[id];
    this.setStage(chapter.mood);
    this.decorate(id);
    header(this, { title: chapter.number ? `Chapter ${chapter.number} of 4` : 'Welcome' });

    bokeh(this, 16, { seed: `story-${id}`, strength: 0.8 });
    glow(this, 260, 400, 240);
    paati(this, 260, 712, story.paati, 560);

    // The text column: from beside Paati to near the right edge. Phones held sideways show more on the right, so the
    // column widens a little there (up to 880) and Paati's longer facts take fewer lines.
    const colW = Phaser.Math.Clamp(this.viewBounds().right - 40 - 500, 740, 880);
    this.text(500, 128, chapter.number ? `CHAPTER ${chapter.number}` : "PAATI'S KITCHEN", 'b3', {
      weight: 700,
      color: 0xb35600,
    });
    this.heading = this.text(500, 154, chapter.number ? chapter.title : personal('Welcome, dear'), 'h3', { width: 720 });
    // Help & settings has a name box too. It starts from what is typed in the Welcome's box, and the name it ends with
    // comes back to that box and the heading.
    this.events.on('settings-opened', () => {
      if (this.field) progress.name = cleanName(this.field.el.value);
    });
    this.events.on('settings-closed', () => {
      if (this.field) this.field.el.value = progress.name;
      if (!chapter.number) this.heading.setText(personal('Welcome, dear'));
    });

    this.lines = storyLines(id);
    this.index = 0;
    this.bubble = new PaatiBubble(this, 500, 236, colW, { avatar: false, tail: 'left', tailY: 40 });
    // Which line this is, at the top right of the column, so the bubble has all the room down to Next.
    this.counter = this.text(500 + colW, 128, '', 'b3', { color: COLOR.grey600, origin: [1, 0] });
    this.next = new Button(this, 1060, 640, { label: 'Next', width: 320, onClick: () => this.onNext() });
    // The bubble stops above Next; bigger text steps down to fit, never below the default size.
    this.bubble.maxH = this.next.y - this.next.bh / 2 - 16 - 236;
    this.doneLabel = story.done;
    this.show();
  }

  show() {
    const line = this.lines[this.index];
    const asking = Boolean(line.ask);
    this.bubble.say(asking ? NAME.ask : line);
    if (asking) this.askName(236 + this.bubble.bubbleHeight + 16);
    this.counter.setText(`${this.index + 1} of ${this.lines.length}`);
    this.next.setLabel(asking ? NAME.confirm : this.index === this.lines.length - 1 ? this.doneLabel : 'Next');
  }

  // What should Paati call you? A text field under her bubble; That's me (or Enter) keeps the name, Skip carries on
  // without one (she says "dear" instead).
  askName(y) {
    const box = { x: 500, y: y + 4, w: 460, h: 64 };
    this.field = textField(this, { ...box, font: 28, maxLength: 24, placeholder: NAME.placeholder, onEnter: () => this.onNext(), next: this.next });
    this.field.el.value = progress.name;
    this.skipName = new Button(this, 780, 640, { label: NAME.skip, variant: 'outline', accent: true, width: 200, dark: false, onClick: () => this.keepName('') });
    // On a computer the cursor waits in the field; on a phone the keyboard comes up when the field is tapped.
    if (window.matchMedia?.('(pointer: fine)').matches) this.time.delayedCall(250, () => this.field?.el.focus());
  }

  keepName(raw) {
    progress.name = cleanName(raw);
    this.heading.setText(personal('Welcome, dear'));
    this.field?.remove();
    this.field = null;
    this.skipName?.destroy();
    this.skipName = null;
    this.index++;
    this.show();
  }

  onNext() {
    if (this.field) return this.keepName(this.field.el.value);
    if (this.index < this.lines.length - 1) {
      this.index++;
      this.show();
    } else {
      this.advance();
    }
  }

  // Mood props per chapter (brief → "The Deepavali layer"). Kept away from text.
  decorate(id) {
    if (id === 'ch1') {
      doorstepKolam(this, 690, 640, 240, { diyas: 3 });
    } else if (id === 'ch3') {
      art(this, 660, 560, 'press-filled', 200);
    } else if (id === 'ch4') {
      art(this, 640, 360, 'petals', 1280).setAlpha(0.3);
    }
  }
}
