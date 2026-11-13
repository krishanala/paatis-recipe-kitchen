import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, bokeh, doorstepKolam, glow, header, paati } from '../ui/widgets.js';
import { CHAPTERS, NAME, STORIES } from '../content.js';
import { storyLines } from '../quiz.js';
import { COLOR } from '../theme.js';
import { cleanName, personal, progress } from '../state.js';
import { textField } from '../ui/field.js';

// Screen 2 · Paati's story: two short lines that open each chapter, one at a time. On the Welcome page, Paati also
// asks what to call the player, between her two lines.
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

    this.text(500, 128, chapter.number ? `CHAPTER ${chapter.number}` : "PAATI'S KITCHEN", 'b3', {
      weight: 700,
      color: 0xb35600,
    });
    this.heading = this.text(500, 154, chapter.number ? chapter.title : personal('Welcome, dear'), 'h3', { width: 720 });

    this.lines = storyLines(id);
    this.index = 0;
    this.bubble = new PaatiBubble(this, 500, 236, 740, { avatar: false });
    this.counter = this.text(500, 0, '', 'b3', { color: COLOR.grey600 });
    this.next = new Button(this, 1060, 640, { label: 'Next', width: 320, onClick: () => this.onNext() });
    this.doneLabel = story.done;
    this.show();
  }

  show() {
    const line = this.lines[this.index];
    const asking = Boolean(line.ask);
    this.bubble.say(asking ? NAME.ask : line);
    let y = 236 + this.bubble.bubbleHeight + 16;
    if (asking) y = this.askName(y);
    this.counter.setText(`${this.index + 1} of ${this.lines.length}`).setY(y);
    this.next.setLabel(asking ? NAME.confirm : this.index === this.lines.length - 1 ? this.doneLabel : 'Next');
  }

  // What should Paati call you? A text field under her bubble; That's me (or Enter) keeps the name, Skip carries on
  // without one (she says "dear" instead). Returns the y below the field.
  askName(y) {
    const box = { x: 500, y: y + 4, w: 460, h: 64 };
    this.field = textField(this, { ...box, font: 28, maxLength: 24, placeholder: NAME.placeholder, onEnter: () => this.onNext(), next: this.next });
    this.field.el.value = progress.name;
    this.skipName = new Button(this, 780, 640, { label: NAME.skip, variant: 'outline', accent: true, width: 200, dark: false, onClick: () => this.keepName('') });
    // On a computer the cursor waits in the field; on a phone the keyboard comes up when the field is tapped.
    if (window.matchMedia?.('(pointer: fine)').matches) this.time.delayedCall(250, () => this.field?.el.focus());
    return box.y + box.h + 16;
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
