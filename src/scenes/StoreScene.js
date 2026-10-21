import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, chip, header, ingredientArt, sparkle, tooltip } from '../ui/widgets.js';
import { makeText } from '../ui/text.js';
import { INGREDIENTS, STORE_LINES } from '../content.js';
import { freeKitchenFacts } from '../quiz.js';
import { COLOR } from '../theme.js';
import { progress, settings } from '../state.js';

const SHELVES = [300, 492];
const COLUMNS = [240, 640, 1040];

// Screen 4 · Store: Paati's store room, a side-on wall of shelves with six containers.
// mode 'review' (after chapters 1 and 2), 'cook' (start of chapter 3) or 'free' (always fully stocked).
export class StoreScene extends BaseScene {
  constructor() {
    super('Store');
  }

  create(data) {
    this.mode = data.mode;
    const free = this.mode === 'free';
    this.setStage('kitchen');
    header(this, { title: free ? 'Free kitchen · Store' : "Paati's Store" });
    this.drawWall();

    const earned = free ? [] : progress.justEarned.slice();
    progress.justEarned = [];
    this.tip = null;
    INGREDIENTS.forEach((ing, i) => this.slot(ing, COLUMNS[i % 3], SHELVES[Math.floor(i / 3)], earned));

    const count = free ? 6 : progress.collected.length;
    const bubble = new PaatiBubble(this, 40, 584, 820);
    if (free) {
      const facts = freeKitchenFacts();
      const fact = facts[progress.factIndex % facts.length];
      bubble.say(STORE_LINES.fact(fact), 'info');
    } else if (this.mode === 'cook') {
      bubble.say(STORE_LINES.cook);
    } else if (count < 6) {
      bubble.say(STORE_LINES.some(count));
    } else {
      bubble.say(STORE_LINES.all, 'success');
    }
    bubble.setY(Math.min(584, 712 - bubble.bubbleHeight));

    const ready = count === 6;
    const cooking = this.mode !== 'review';
    new Button(this, 1060, 648, {
      label: cooking ? 'Start cooking' : 'Continue',
      width: 320,
      onClick: () => (free ? this.go('Cook', { free: true }) : this.advance()),
    }).setEnabled(!cooking || ready);
  }

  drawWall() {
    const g = this.add.graphics();
    g.fillStyle(0xf3dfbd, 1);
    g.fillRoundedRect(40, 112, 1200, 456, 24);
    for (const y of SHELVES) {
      g.fillStyle(0x000000, 0.08);
      g.fillRect(64, y + 20, 1152, 10);
      g.fillStyle(COLOR.wood, 1);
      g.fillRect(64, y, 1152, 14);
      g.fillStyle(COLOR.woodDark, 1);
      g.fillRect(64, y + 14, 1152, 6);
      for (const x of [90, 440, 840, 1190]) {
        g.fillStyle(COLOR.woodDark, 1);
        g.fillTriangle(x - 10, y + 20, x + 10, y + 20, x, y + 36);
      }
    }
  }

  slot(ing, x, shelfY, earned) {
    const free = this.mode === 'free';
    const have = free || progress.collected.includes(ing.id);
    const isNew = earned.includes(ing.id);
    const img = ingredientArt(this, 0, 0, ing, 120).setOrigin(0.5, 1);
    if (!have || isNew) img.setTintFill(0xdcc59e).setAlpha(0.65);

    // The whole container is one button, so it can be tapped or reached with the keyboard.
    const button = new Button(this, x, shelfY - 84, {
      variant: 'bare',
      width: 220,
      height: 168,
      content: [img],
      onClick: () => this.showNote(ing, x, shelfY - 96, progress.collected.includes(ing.id) || free),
    });
    img.setPosition(0, 84);

    const name = makeText(this, 0, 0, ing.name, 'b1', { weight: 600 });
    const tag = chip(this, 0, 0, have && !isNew ? '✓ Collected' : 'Not yet', have && !isNew ? 'success' : 'muted');
    this.placeLabel(name, tag, x, shelfY + 50);

    if (isNew) {
      const delay = 350 + earned.indexOf(ing.id) * 450;
      this.time.delayedCall(delay, () => {
        img.clearTint().setAlpha(1);
        tag.destroy();
        this.placeLabel(name, chip(this, 0, 0, '✓ Collected', 'success'), x, shelfY + 50);
        sparkle(this, x, shelfY - 70);
        if (!settings.reduceMotion) this.tweens.add({ targets: img, scale: { from: img.scale * 1.2, to: img.scale }, duration: 300, ease: 'Back.Out' });
      });
    }
    return button;
  }

  // Name and chip side by side, centred under the container.
  placeLabel(name, tag, x, y) {
    const tw = tag.list[1].width + 28;
    const total = name.width + 10 + tw;
    name.setOrigin(0, 0.5).setPosition(x - total / 2, y);
    tag.setPosition(x - total / 2 + name.width + 10 + tw / 2, y);
  }

  showNote(ing, x, y, have) {
    this.tip?.destroy();
    this.tip = tooltip(this, x, y, have ? ing.note : 'Answer Paati\'s questions to earn this one.');
  }
}
