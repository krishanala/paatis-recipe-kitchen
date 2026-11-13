import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, chip, header, ingredientArt, sparkle, tooltip } from '../ui/widgets.js';
import { makeText } from '../ui/text.js';
import { INGREDIENTS, STORE_LINES } from '../content.js';
import { freeKitchenFacts } from '../quiz.js';
import { BUTTON_HEIGHT, COLOR, pick } from '../theme.js';
import { progress, settings } from '../state.js';

// On phones the shelves sit higher and the jars are a little smaller, so Paati's longer lines fit under them.
const SHELVES = pick([300, 492], [226, 384]);
const ITEM = pick({ art: 120, h: 168, label: 50 }, { art: 100, h: 138, label: 40 });
const WALL_BOTTOM = SHELVES[1] + ITEM.label + 32;
const COLUMNS = [240, 640, 1040];
// The free kitchen: narrower shelves (everything is collected, so no tags), and Paati's fact in a tall bubble beside
// them, since some facts run to several lines.
const FACT = { columns: [158, 390, 622], wallW: 706, bubble: { x: 764, y: 112, w: 476 } };

// Screen 4 · Store: Paati's store room, a side-on wall of shelves with six containers.
// mode 'review' (after chapters 1 and 2), 'cook' (start of chapter 3) or 'free' (always fully stocked).
export class StoreScene extends BaseScene {
  constructor() {
    super('Store');
  }

  create(data) {
    this.mode = data.mode;
    const free = this.mode === 'free';
    this.factMode = free;
    const columns = this.factMode ? FACT.columns : COLUMNS;
    this.setStage('kitchen');
    header(this, { title: free ? 'Free kitchen · Store' : "Paati's Store" });
    this.drawWall(this.factMode ? FACT.wallW : 1200, columns);

    const earned = free ? [] : progress.justEarned.slice();
    progress.justEarned = [];
    this.tip = null;
    INGREDIENTS.forEach((ing, i) => this.slot(ing, columns[i % 3], SHELVES[Math.floor(i / 3)], earned));

    const count = free ? 6 : progress.collected.length;
    const bubbleTop = this.factMode ? FACT.bubble.y : WALL_BOTTOM + 14;
    const bubble = this.factMode
      ? new PaatiBubble(this, FACT.bubble.x, bubbleTop, FACT.bubble.w, { avatar: false })
      : new PaatiBubble(this, 40, bubbleTop, pick(820, 850));
    // Bigger text (Settings) steps down to fit: above the button in the free kitchen, under the shelves otherwise.
    bubble.maxH = this.factMode ? 648 - BUTTON_HEIGHT.giant / 2 - 8 - bubbleTop : 712 - bubbleTop;
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
    if (!this.factMode) bubble.setY(Math.min(bubbleTop, 712 - bubble.bubbleHeight));

    const ready = count === 6;
    const cooking = this.mode !== 'review';
    new Button(this, 1060, 648, {
      label: cooking ? 'Start cooking' : 'Continue',
      width: 320,
      onClick: () => (free ? this.go('Cook', { free: true }) : this.advance()),
    }).setEnabled(!cooking || ready);
  }

  drawWall(w, columns) {
    const g = this.add.graphics();
    g.fillStyle(0xf3dfbd, 1);
    g.fillRoundedRect(40, 112, w, WALL_BOTTOM - 112, 24);
    // Brackets at the ends and between the columns.
    const brackets = [90, (columns[0] + columns[1]) / 2, (columns[1] + columns[2]) / 2, 40 + w - 50];
    for (const y of SHELVES) {
      g.fillStyle(0x000000, 0.08);
      g.fillRect(64, y + 20, w - 48, 10);
      g.fillStyle(COLOR.wood, 1);
      g.fillRect(64, y, w - 48, 14);
      g.fillStyle(COLOR.woodDark, 1);
      g.fillRect(64, y + 14, w - 48, 6);
      for (const x of brackets) {
        g.fillStyle(COLOR.woodDark, 1);
        g.fillTriangle(x - 10, y + 20, x + 10, y + 20, x, y + 36);
      }
    }
  }

  slot(ing, x, shelfY, earned) {
    const free = this.mode === 'free';
    const have = free || progress.collected.includes(ing.id);
    const isNew = earned.includes(ing.id);
    const img = ingredientArt(this, 0, 0, ing, ITEM.art).setOrigin(0.5, 1);
    if (!have || isNew) img.setTintFill(0xdcc59e).setAlpha(0.65);

    // The whole container is one button, so it can be tapped or reached with the keyboard.
    const button = new Button(this, x, shelfY - ITEM.h / 2, {
      variant: 'bare',
      width: 220,
      height: ITEM.h,
      content: [img],
      onClick: () => this.showNote(ing, x, shelfY - ITEM.h / 2 - 12, progress.collected.includes(ing.id) || free),
    });
    img.setPosition(0, ITEM.h / 2);

    const name = makeText(this, 0, 0, ing.name, 'b1', { weight: 600 });
    if (this.factMode) {
      name.setOrigin(0.5).setPosition(x, shelfY + ITEM.label);
      return button;
    }
    const tag = chip(this, 0, 0, have && !isNew ? '✓ Collected' : 'Not yet', have && !isNew ? 'success' : 'muted');
    this.placeLabel(name, tag, x, shelfY + ITEM.label);

    if (isNew) {
      const delay = 350 + earned.indexOf(ing.id) * 450;
      this.time.delayedCall(delay, () => {
        img.clearTint().setAlpha(1);
        tag.destroy();
        this.placeLabel(name, chip(this, 0, 0, '✓ Collected', 'success'), x, shelfY + ITEM.label);
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
