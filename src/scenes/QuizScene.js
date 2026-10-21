import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, ProgressBar, art, card, chip, header, sparkle } from '../ui/widgets.js';
import { makeText } from '../ui/text.js';
import { CHAPTERS, REWARDS, ingredient } from '../content.js';
import { pickQuiz } from '../quiz.js';
import { BUTTON_HEIGHT, COLOR, MIN_HIT, pick } from '../theme.js';
import { progress, settings, markChapterDone } from '../state.js';
import { paintMuruku } from '../draw.js';

const LETTERS = ['A', 'B', 'C'];
const ORDINALS = ['first', 'second', 'third', 'fourth'];
// A small label over the question says how to answer, for the formats other than plain 3-choice questions.
const EYEBROWS = { truefalse: 'TRUE OR NOT?', picture: 'TAP THE PICTURE', order: 'PUT THEM IN ORDER' };

// Screen 3 · Quiz, drawn from the chapter's bank (src/quiz.js) so it matches Paati's story. Four formats keep it
// lively: 3 choices, true or not, tap the picture, and put in order. A wrong answer is set aside (or, in order
// questions, gently corrected) and the player tries again. In chapters 1 and 2 each right answer earns an
// ingredient, which flies to the Store.
export class QuizScene extends BaseScene {
  constructor() {
    super('Quiz');
  }

  create(data) {
    this.chapterId = data.chapter;
    const chapter = CHAPTERS[this.chapterId];
    this.setStage(chapter.mood);
    header(this, { title: `Chapter ${chapter.number} · ${chapter.title}` });

    this.questions = pickQuiz(this.chapterId);
    this.rewards = REWARDS[this.chapterId] ?? [];
    this.index = progress.quizIndex[this.chapterId] ?? 0;
    // "Question 2 of 3" with the gold progress bar beside it on the same line.
    this.counter = this.text(80, 112, `Question ${this.questions.length} of ${this.questions.length}`, 'b1', { weight: 600 });
    const barX = 80 + this.counter.width + 20;
    this.bar = new ProgressBar(this, barX, 112 + this.counter.height / 2 - 6, 760 - barX, this.questions.length);
    this.bar.value = this.index;
    this.bar.draw(this.index);
    this.questionY = 112 + this.counter.height + 12;
    this.eyebrow = this.text(80, this.questionY, '', 'b3', { weight: 700, color: 0xb35600 });
    this.question = this.text(80, this.questionY, '', 'h5', { width: 680 });
    this.bubble = new PaatiBubble(this, 80, 528, 680);
    this.answers = [];

    this.storeChip = null;
    this.next = new Button(this, 1060, 650, { label: 'Next', width: 320, onClick: () => this.onNext() });
    this.side = [];
    this.showQuestion();
  }

  showQuestion() {
    const q = this.questions[this.index];
    const type = q.type ?? 'choice';
    this.answered = false;
    this.tries = 0;
    this.mistakes = 0;
    this.counter.setText(`Question ${this.index + 1} of ${this.questions.length}`);
    const eyebrow = EYEBROWS[type] ?? '';
    this.eyebrow.setText(eyebrow).setVisible(Boolean(eyebrow));
    this.question.setY(eyebrow ? this.questionY + this.eyebrow.height + 4 : this.questionY).setText(q.q);
    this.answers.forEach((b) => b.destroy());
    const top = this.question.y + this.question.height + 18;
    const build = { truefalse: this.buildTrueFalse, picture: this.buildPictures, order: this.buildOrder }[type] ?? this.buildChoices;
    const bottom = build.call(this, q, top);
    this.bubbleTop = bottom + 16;
    const prompts = {
      choice: 'Take your time, dear. Choose one answer.',
      truefalse: 'Is it true, or not? Think back to my story.',
      picture: 'Look carefully, then tap the right picture.',
      order: 'Tap them in the right order, starting with the first.',
    };
    this.say(this.index === 0 || type !== 'choice' ? prompts[type] : 'Here is the next one.');
    this.next.setVisible(false);
    this.updateStoreChip();
    this.showSide();
  }

  // Three answers stacked under the question; on phones they are taller and spaced so touch areas don't overlap.
  buildChoices(q, top) {
    const step = Math.max(BUTTON_HEIGHT.large + 14, MIN_HIT + 2);
    this.answers = q.choices.map((choice, i) => {
      const badge = this.add.graphics();
      badge.fillStyle(this.dark ? COLOR.white : COLOR.indigo900, this.dark ? 0.16 : 0.08);
      badge.fillCircle(-340 + 40, 0, 20);
      const letter = makeText(this, -300, 0, LETTERS[i], 'b1', { weight: 700, dark: this.dark, origin: 0.5 });
      return new Button(this, 420, top + BUTTON_HEIGHT.large / 2 + i * step, {
        label: choice.text,
        size: 'large',
        variant: 'outline',
        width: 680,
        align: 'left',
        content: [badge, letter],
        onClick: (btn) => this.choose(btn, choice),
      });
    });
    return top + (q.choices.length - 1) * step + BUTTON_HEIGHT.large;
  }

  // True or not: two big buttons side by side.
  buildTrueFalse(q, top) {
    const h = BUTTON_HEIGHT.giant;
    this.answers = q.choices.map(
      (choice, i) =>
        new Button(this, 250 + i * 340, top + h / 2, {
          label: choice.text,
          size: 'giant',
          variant: 'outline',
          width: 320,
          onClick: (btn) => this.choose(btn, choice),
        }),
    );
    return top + h;
  }

  // Tap the picture: three cards, each with a drawing and a short caption.
  buildPictures(q, top) {
    const h = pick(196, 206);
    this.answers = q.choices.map((choice, i) => {
      const img = art(this, 0, -22, choice.art, pick(104, 96));
      if (img.displayHeight > h - 70) img.setScale(img.scale * ((h - 70) / img.displayHeight));
      const caption = makeText(this, 0, h / 2 - 24, choice.text, 'b1', { weight: 600, origin: 0.5 });
      const btn = new Button(this, 185 + i * 235, top + h / 2, {
        variant: 'outline',
        width: 210,
        height: h,
        radius: 24,
        content: [img, caption],
        onClick: (b) => this.choose(b, choice),
      });
      btn.pic = img;
      btn.caption = caption;
      return btn;
    });
    return top + h;
  }

  // Put in order: the items appear shuffled; tap them first to last. Each right tap gets its number.
  buildOrder(q, top) {
    const n = q.items.length;
    const cols = n > 3 ? 2 : 1;
    const w = cols === 2 ? 330 : 680;
    const badgeX = -w / 2 + (cols === 2 ? 32 : 40);
    const step = Math.max(BUTTON_HEIGHT.large + 14, MIN_HIT + 2);
    let order = Phaser.Utils.Array.Shuffle(q.items.map((text, i) => ({ text, i })));
    if (order.every((o, k) => o.i === k)) order = [...order.slice(1), order[0]];
    this.orderNext = 0;
    this.answers = order.map((item, k) => {
      const badge = this.add.graphics();
      const number = makeText(this, badgeX, 0, '', 'b1', { weight: 700, color: COLOR.white, origin: 0.5 });
      const drawBadge = (placed) => {
        badge.clear();
        if (placed) {
          badge.fillStyle(COLOR.green600, 1);
          badge.fillCircle(badgeX, 0, 18);
        } else {
          badge.lineStyle(2, COLOR.grey300, 1);
          badge.strokeCircle(badgeX, 0, 16);
        }
      };
      drawBadge(false);
      const col = k % cols;
      const row = Math.floor(k / cols);
      const x = cols === 2 ? 80 + w / 2 + col * (w + 20) : 420;
      const btn = new Button(this, x, top + BUTTON_HEIGHT.large / 2 + row * step, {
        label: item.text,
        size: 'large',
        variant: 'outline',
        width: w,
        align: 'left',
        inset: cols === 2 ? 58 : 76,
        content: [badge, number],
        onClick: (b) => this.place(b, q),
      });
      Object.assign(btn, { orderIndex: item.i, drawBadge, number });
      return btn;
    });
    const rows = Math.ceil(n / cols);
    return top + (rows - 1) * step + BUTTON_HEIGHT.large;
  }

  place(btn, q) {
    if (this.answered || btn.placed) return;
    if (btn.orderIndex !== this.orderNext) {
      this.mistakes++;
      this.say(q.hint ?? `Not that one yet, dear. Which comes ${ORDINALS[this.orderNext]}?`, 'warning');
      if (!settings.reduceMotion) this.tweens.add({ targets: btn, x: btn.x + 8, duration: 60, yoyo: true, repeat: 2 });
      return;
    }
    btn.placed = true;
    btn.setLook('correct');
    btn.number.setText(String(this.orderNext + 1));
    btn.drawBadge(true);
    this.orderNext++;
    if (this.orderNext < q.items.length) {
      this.say(`Yes! Now, what comes ${ORDINALS[this.orderNext]}?`, 'info');
      return;
    }
    this.complete(q.why, this.mistakes === 0);
  }

  // The right-hand card: the ingredient this question earns, or (chapter 4) the player's muruku.
  showSide() {
    this.side.forEach((o) => o.destroy());
    const x = 840;
    const y = 160;
    const w = 380;
    const h = 420;
    const cx = x + w / 2;
    this.side = [card(this, x, y, w, h, { kolam: true })];
    const t = (...args) => {
      const o = makeText(this, ...args);
      this.side.push(o);
      return o;
    };
    const reward = this.rewards[this.index];
    if (reward) {
      const ing = ingredient(reward);
      const have = progress.collected.includes(ing.id);
      t(cx, y + 36, 'ANSWER TO EARN', 'b3', { weight: 700, color: 0xb35600, origin: 0.5 });
      this.rewardArt = art(this, cx, y + 160, ing.art, 150);
      if (!have) this.rewardArt.setTintFill(0xd9cdb8).setAlpha(0.7);
      this.side.push(this.rewardArt);
      t(cx, y + 270, ing.name, 'h5', { origin: 0.5 });
      this.rewardNote = t(cx, y + 306, have ? ing.note : 'Answer right to add it to the Store.', 'b1', {
        width: w - 60,
        align: 'center',
        color: COLOR.grey600,
        origin: [0.5, 0],
      });
    } else {
      t(cx, y + 36, 'YOUR MURUKU', 'b3', { weight: 700, color: 0xb35600, origin: 0.5 });
      this.side.push(art(this, cx, y + 180, 'banana-leaf', 300));
      if (progress.lastMuruku) this.side.push(...paintMuruku(this, progress.lastMuruku, cx, y + 170, 150));
      else this.side.push(art(this, cx, y + 170, 'muruku-golden', 150));
      t(cx, y + 300, 'You will offer it to Paati at the end of this chapter.', 'b1', {
        width: w - 60,
        align: 'center',
        color: COLOR.grey600,
        origin: [0.5, 0],
      });
    }
  }

  // Paati's bubble sits under the answers, moving up only if a long line would run off the bottom.
  say(str, tone) {
    this.bubble.say(str, tone);
    this.bubble.setY(Math.min(this.bubbleTop, 712 - this.bubble.bubbleHeight));
  }

  updateStoreChip() {
    this.storeChip?.destroy();
    this.storeChip = null;
    if (!this.rewards.length) return;
    this.storeChip = chip(this, 1100, 124, `Store  ${progress.collected.length} of 6`, 'success');
  }

  choose(btn, choice) {
    if (this.answered) return;
    this.tries++;
    if (!choice.correct) {
      btn.setLook('setAside');
      btn.pic?.setAlpha(0.4);
      btn.caption?.setAlpha(0.5);
      this.say(choice.why, 'warning');
      this.focusNextUsable();
      return;
    }
    btn.setLook('correct');
    this.answers.forEach((b) => b !== btn && b.look !== 'setAside' && b.setEnabled(false));
    this.complete(choice.why, this.tries === 1);
  }

  // The question is answered: Paati explains, the bar fills, the ingredient (if any) flies to the Store.
  complete(why, firstTry) {
    this.answered = true;
    this.say(why, 'success');
    const first = (progress.firstTry[this.chapterId] ??= []);
    first[this.index] = firstTry;
    this.bar.set(this.index + 1);

    const reward = this.rewards[this.index];
    if (reward && !progress.collected.includes(reward)) this.earn(ingredient(reward));
    const last = this.index === this.questions.length - 1;
    this.next.setLabel(last ? (this.chapterId === 'ch4' ? 'Finish the chapter' : 'See the Store') : 'Next question');
    this.next.setVisible(true);
    if (this.focus.visible) this.focus.focus(this.next);
  }

  // The earned ingredient fills in on the card, then a copy flies to the Store counter.
  earn(ing) {
    progress.collected.push(ing.id);
    progress.justEarned.push(ing.id);
    this.rewardArt.clearTint().setAlpha(1);
    this.rewardNote.setText(ing.note).setColor('#5a6070');
    sparkle(this, this.rewardArt.x, this.rewardArt.y);
    if (settings.reduceMotion) {
      this.updateStoreChip();
      return;
    }
    const flyer = art(this, this.rewardArt.x, this.rewardArt.y, ing.art, 150).setDepth(700);
    this.tweens.add({
      targets: flyer,
      x: 1100,
      y: 124,
      scale: flyer.scale * 0.2,
      alpha: 0.4,
      delay: 350,
      duration: 650,
      ease: 'Cubic.In',
      onComplete: () => {
        flyer.destroy();
        this.updateStoreChip();
        if (this.storeChip) this.tweens.add({ targets: this.storeChip, scale: { from: 1.25, to: 1 }, duration: 250 });
      },
    });
  }

  focusNextUsable() {
    if (!this.focus.visible) return;
    const next = this.answers.find((b) => b.enabled && !b.placed);
    if (next) this.focus.focus(next);
  }

  onNext() {
    this.index++;
    progress.quizIndex[this.chapterId] = this.index;
    if (this.index < this.questions.length) {
      this.showQuestion();
      return;
    }
    markChapterDone(this.chapterId);
    this.advance();
  }
}
