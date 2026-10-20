import { QUIZ_BANK, STORIES, EXTRA_FACTS } from './content.js';
import { progress } from './state.js';

// Which questions this journey asks in a chapter: the bank's core questions plus random others, in a shuffled
// order. The pick is kept for the visit, so Paati's story and her quiz always cover the same facts.
export function pickQuiz(chapter) {
  const bank = QUIZ_BANK[chapter];
  if (!bank) return [];
  if (!progress.quizPick[chapter]) {
    const core = bank.questions.filter((q) => q.core);
    const rest = Phaser.Utils.Array.Shuffle(bank.questions.filter((q) => !q.core));
    const chosen = Phaser.Utils.Array.Shuffle([...core, ...rest].slice(0, bank.ask));
    progress.quizPick[chapter] = chosen.map((q) => q.id);
  }
  return progress.quizPick[chapter].map((id) => bank.questions.find((q) => q.id === id));
}

// Paati's story for a chapter: fixed lines, or the intro, one teaching line per question she will ask, and the outro.
export function storyLines(id) {
  const story = STORIES[id];
  if (story.lines) return story.lines;
  return [story.intro, ...pickQuiz(id).map((q) => q.teach), story.outro].filter(Boolean);
}

// Facts for the free kitchen: everything from the banks that wasn't asked this time, then the extra facts.
export function freeKitchenFacts() {
  const asked = new Set(Object.values(progress.quizPick).flat());
  const unasked = Object.values(QUIZ_BANK)
    .flatMap((bank) => bank.questions)
    .filter((q) => !asked.has(q.id))
    .map((q) => q.teach);
  return [...unasked, ...EXTRA_FACTS];
}
