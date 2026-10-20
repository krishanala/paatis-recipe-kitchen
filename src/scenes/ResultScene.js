import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, art, card, header, sparkle, starRow } from '../ui/widgets.js';
import { makeText } from '../ui/text.js';
import { RESULT_LINES } from '../content.js';
import { COLOR, pick } from '../theme.js';
import { progress } from '../state.js';
import { paintMuruku } from '../draw.js';

// Screen 6 · Result: the finished muruku, stars with words, the score out of 100 and one line per part.
// In the free kitchen: Make another and Finish, and the plate of muruku made so far.
export class ResultScene extends BaseScene {
  constructor() {
    super('Result');
  }

  create(data) {
    const free = Boolean(data.free);
    const muruku = progress.lastMuruku;
    const r = muruku.result;
    const line = RESULT_LINES[r.stars];
    this.setStage('kitchen');
    header(this, { title: free ? 'Free kitchen · Your muruku' : 'Chapter 3 · Your muruku' });

    // Left column: the muruku on a banana leaf, stars with words, the score, then Paati's reaction.
    const L = pick({ leafY: 250, leaf: 420, muruku: 210, starsY: 418 }, { leafY: 226, leaf: 360, muruku: 180, starsY: 378 });
    art(this, 320, L.leafY, 'banana-leaf', L.leaf);
    paintMuruku(this, muruku, 320, L.leafY - 6, L.muruku);
    if (r.stars === 3) this.time.delayedCall(300, () => sparkle(this, 320, L.leafY, { radius: 160, count: 20 }));
    starRow(this, 320, L.starsY, r.stars, 48);
    let ly = L.starsY + 34;
    const words = this.text(320, ly, line.words, 'h4', { origin: [0.5, 0] });
    ly += words.height + 2;
    const score = this.text(320, ly, `Score ${r.total} out of 100`, 's1', { origin: [0.5, 0], color: COLOR.grey600 });
    ly += score.height + 6;
    if (free) {
      // The plate on the counter fills up with every muruku made in the free kitchen.
      const plate = this.text(320, ly, `On your plate: ${progress.plate} muruku`, 'b1', { weight: 600, origin: [0.5, 0] });
      ly += plate.height + 6;
    }
    const bubble = new PaatiBubble(this, 40, ly + 10, 560).say(line.line, line.tone);
    bubble.setY(Math.min(ly + 10, 712 - bubble.bubbleHeight));

    // Right column, a List: one row each for dough, twist and fry. Rows grow with their reason text.
    const x = 640;
    const w = 600;
    makeText(this, x + 40, 140, 'How Paati judged it', 's1', { weight: 700 });
    const rows = [
      ['Dough', r.dough],
      ['Twist', r.twist],
      ['Fry', r.fry],
    ];
    let y = 186;
    rows.forEach(([name, part], i) => {
      if (i > 0) {
        const g = this.add.graphics();
        g.lineStyle(1, COLOR.yellow500, 0.7);
        g.lineBetween(x + 40, y - 10, x + w - 40, y - 10);
      }
      makeText(this, x + 40, y, name, 's1', { weight: 700 });
      makeText(this, x + w - 40, y, `${part.score} / ${part.max}`, 's1', { weight: 700, origin: [1, 0], color: part.score === part.max ? COLOR.green700 : COLOR.grey900 });
      const reason = makeText(this, x + 40, y + 30, part.reason, 'b1', { width: w - 80, color: COLOR.grey600 });
      y = reason.y + reason.height + 18;
    });
    card(this, x, 116, w, y + 4 - 116, { kolam: true }).setDepth(-1);

    if (free) {
      new Button(this, 790, 664, {
        label: 'Make another',
        width: 300,
        onClick: () => {
          progress.factIndex++;
          this.go('Store', { mode: 'free' });
        },
      });
      new Button(this, 1100, 664, { label: 'Finish', variant: 'outline', width: 260, onClick: () => this.go('Finale', { mode: 'goodbye' }) });
    } else {
      new Button(this, 1080, 664, { label: 'Next', width: 300, onClick: () => this.advance() });
    }
  }
}
