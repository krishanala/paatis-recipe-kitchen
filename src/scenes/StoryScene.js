import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, bokeh, doorstepKolam, glow, header, paati } from '../ui/widgets.js';
import { CHAPTERS, STORIES } from '../content.js';
import { storyLines } from '../quiz.js';
import { COLOR } from '../theme.js';

// Screen 2 · Paati's story: two short lines that open each chapter, one at a time.
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
    this.text(500, 154, chapter.number ? chapter.title : 'Welcome, dear', 'h3', { width: 720 });

    this.lines = storyLines(id);
    this.index = 0;
    this.bubble = new PaatiBubble(this, 500, 236, 740, { avatar: false });
    this.counter = this.text(500, 0, '', 'b3', { color: COLOR.grey600 });
    this.next = new Button(this, 1060, 640, { label: 'Next', width: 320, onClick: () => this.onNext() });
    this.doneLabel = story.done;
    this.show();
  }

  show() {
    this.bubble.say(this.lines[this.index]);
    this.counter.setText(`${this.index + 1} of ${this.lines.length}`).setY(236 + this.bubble.bubbleHeight + 16);
    this.next.setLabel(this.index === this.lines.length - 1 ? this.doneLabel : 'Next');
  }

  onNext() {
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
