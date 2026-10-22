import { ADD_ORDER, ASK_LINES, COOK_LINES, COOK_QUESTIONS, EXTRA_FACTS, NOTE, QUIZ_BANK, QUIZ_LINES, RESULT_LINES, STORE_LINES, STORIES, ingredient } from './content.js';
import { settings } from './state.js';

// Voice-over hooks. Every line Paati says goes through speak() (PaatiBubble.say calls it), so recordings can be
// added later without touching the scenes. The speech bubble always shows the words, so the captions stay.
//
// A recording is found by its line's key: a short hash of the exact text (lineKey). assets/voice/lines.json maps
// keys to files in assets/voice/. With no file for a line, or with sound off, nothing plays.
// In the browser console, muruku.voiceScript() lists every line with its key: the script for the recording session.

let manifest = {};
let playing = null;

export function lineKey(text) {
  // FNV-1a, 32-bit, in base 36: short, stable, and the same in any browser.
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export async function loadVoice() {
  try {
    const res = await fetch('assets/voice/lines.json', { cache: 'no-cache' });
    if (res.ok) manifest = await res.json();
  } catch {
    // No recordings yet: captions only.
  }
}

export function speak(text) {
  hush();
  const file = manifest[lineKey(text)];
  if (!file || !settings.sound) return;
  playing = new Audio(`assets/voice/${file}`);
  playing.play().catch(() => {});
}

export function hush() {
  playing?.pause();
  playing = null;
}

// Every line Paati can say, with its key, in the order a player meets them.
export function voiceScript() {
  const lines = [];
  const add = (where, text) => text && lines.push({ where, key: lineKey(text), text });
  for (const [id, story] of Object.entries(STORIES)) {
    story.lines.forEach((t) => add(`story ${id}`, t));
  }
  const facts = [...EXTRA_FACTS];
  for (const [ch, bank] of Object.entries(QUIZ_BANK)) {
    for (const q of bank.questions) {
      facts.push(q.teach);
      add(`quiz ${q.id}`, q.why);
      add(`quiz ${q.id}`, q.hint);
      q.choices?.forEach((c) => add(`quiz ${q.id}`, c.why));
    }
  }
  Object.values(QUIZ_LINES.prompts).forEach((t) => add('quiz', t));
  add('quiz', QUIZ_LINES.next);
  add('quiz', QUIZ_LINES.tryAgain);
  for (let i = 1; i < 4; i++) {
    add('quiz', QUIZ_LINES.orderWrong(i));
    add('quiz', QUIZ_LINES.orderRight(i));
  }
  add('store', STORE_LINES.cook);
  add('store', STORE_LINES.all);
  for (let n = 1; n < 6; n++) add('store', STORE_LINES.some(n));
  facts.forEach((f) => add('free kitchen', STORE_LINES.fact(f)));
  for (const [name, value] of Object.entries(COOK_LINES)) {
    if (Array.isArray(value)) value.forEach((t) => add(`cook ${name}`, t));
  }
  ADD_ORDER.forEach((id, i) => {
    COOK_LINES.addWrong(ingredient(id)).forEach((t) => add('cook addWrong', t));
    if (i > 0) COOK_LINES.addNext(ingredient(ADD_ORDER[i - 1]), ingredient(id)).forEach((t) => add('cook addNext', t));
  });
  add('cook question', ASK_LINES.intro);
  for (const [id, q] of Object.entries(COOK_QUESTIONS)) q.choices.forEach((c) => add(`cook question ${id}`, c.why));
  Object.values(RESULT_LINES).forEach((r) => add('result', r.line));
  ['intro', 'ask', 'empty', 'rolling', 'tie', 'send', 'sent'].forEach((k) => add('note', NOTE[k]));
  const seen = new Set();
  return lines.filter((l) => !seen.has(l.key) && seen.add(l.key));
}
