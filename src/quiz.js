import { QUIZ_BANK, STORIES, EXTRA_FACTS } from './content.js';
import { progress } from './state.js';

const typeOf = (q) => q.type ?? 'choice';

// Which questions this journey asks in a chapter: the bank's core questions plus random others, in a shuffled
// order. Extra picks favour formats not used yet (so each chapter mixes them) and skip questions that share a
// `group` with one already chosen. The pick is kept for the visit, so Paati's story and her quiz always match.
export function pickQuiz(chapter) {
  const bank = QUIZ_BANK[chapter];
  if (!bank) return [];
  if (!progress.quizPick[chapter]) {
    const chosen = bank.questions.filter((q) => q.core);
    const groups = new Set(chosen.map((q) => q.group).filter(Boolean));
    const types = new Set(chosen.map(typeOf));
    let rest = Phaser.Utils.Array.Shuffle(bank.questions.filter((q) => !q.core));
    while (chosen.length < bank.ask) {
      const allowed = rest.filter((q) => !q.group || !groups.has(q.group));
      if (!allowed.length) break;
      const pickNext = allowed.find((q) => !types.has(typeOf(q))) ?? allowed[0];
      chosen.push(pickNext);
      rest = rest.filter((q) => q !== pickNext);
      if (pickNext.group) groups.add(pickNext.group);
      types.add(typeOf(pickNext));
    }
    progress.quizPick[chapter] = Phaser.Utils.Array.Shuffle(chosen).map((q) => q.id);
  }
  return progress.quizPick[chapter].map((id) => bank.questions.find((q) => q.id === id));
}

// Paati's story for a chapter: fixed lines, or the chapter's hook (intro and outro). She asks first and explains
// after, so the story never gives an answer away.
export function storyLines(id) {
  const story = STORIES[id];
  if (story.lines) return story.lines;
  return [story.intro, story.outro].filter(Boolean);
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
