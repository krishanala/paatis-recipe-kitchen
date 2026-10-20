import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { PaatiBubble, ProgressBar, art, card, chip, header, sparkle } from '../ui/widgets.js';
import { makeText } from '../ui/text.js';
import { CHAPTERS, REWARDS, ingredient } from '../content.js';
import { pickQuiz } from '../quiz.js';
import { BUTTON_HEIGHT, COLOR, MIN_HIT } from '../theme.js';
import { progress, settings, markChapterDone } from '../state.js';
import { paintMuruku } from '../draw.js';

const LETTERS = ['A', 'B', 'C'];

// Screen 3 · Quiz: 3 choices per question, drawn from the chapter's bank (src/quiz.js) so they match Paati's story.
// A wrong answer is set aside with a kind explanation and the player tries again. In chapters 1 and 2 each right
// answer earns an ingredient, which flies to the Store.
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
    this.question = this.text(80, 112 + this.counter.height + 12, '', 'h5', { width: 680 });
    this.bubble = new PaatiBubble(this, 80, 528, 680);
    this.answers = [];

    this.storeChip = null;
    this.next = new Button(this, 1060, 650, { label: 'Next', width: 320, onClick: () => this.onNext() });
    this.side = [];
    this.showQuestion();
  }

  showQuestion() {
    const q = this.questions[this.index];
    this.answered = false;
    this.tries = 0;
    this.counter.setText(`Question ${this.index + 1} of ${this.questions.length}`);
    this.question.setText(q.q);
    this.answers.forEach((b) => b.destroy());
    // Answers stack under the question; on phones they are taller and spaced so touch areas don't overlap.
    const top = this.question.y + this.question.height + 18;
    const step = Math.max(BUTTON_HEIGHT.large + 14, MIN_HIT + 2);
    this.bubbleTop = top + (q.choices.length - 1) * step + BUTTON_HEIGHT.large + 16;
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
    this.say(this.index === 0 ? 'Take your time, dear. Choose one answer.' : 'Here is the next one.');
    this.next.setVisible(false);
    this.updateStoreChip();
    this.showSide();
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
      this.say(choice.why, 'warning');
      this.focusNextUsable();
      return;
    }
    this.answered = true;
    btn.setLook('correct');
    this.answers.forEach((b) => b !== btn && b.look !== 'setAside' && b.setEnabled(false));
    this.say(choice.why, 'success');
    const first = (progress.firstTry[this.chapterId] ??= []);
    first[this.index] = this.tries === 1;
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
    const next = this.answers.find((b) => b.enabled);
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
