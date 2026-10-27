import { JOURNEY } from './flow.js';
import { REWARDS } from './content.js';
import { markChapterDone, progress } from './state.js';
import { buildResult, fryColour, scoreDough, scoreFry, scoreTwist } from './scoring.js';

// Screen shortcuts: open one screen straight away, to check a change without playing up to it. Add ?screen= and a
// name to the game's address, for example index.html?screen=taste (README → "Screen shortcuts" lists them all).
// Each one sets up what the game would have by then (ingredients earned, chapters done, a cooked muruku), so the
// screen looks as it would mid-game, and Next carries on from there as usual.

// name → [scene, data, options]. Screens on the journey (flow.js) are found by their scene and data; nth picks
// between steps that look the same (the Store after chapter 1 and after chapter 2). `end` screens come after the
// journey. `data` adds to the screen's data, such as the kitchen step to start at.
const SCREENS = {
  title: ['Title', {}, { journey: false }],
  welcome: ['Story', { story: 'welcome' }],
  intro: ['Intro', {}],
  ch1: ['Story', { story: 'ch1' }],
  'quiz-ch1': ['Quiz', { chapter: 'ch1' }],
  store: ['Store', { mode: 'review' }],
  ch2: ['Story', { story: 'ch2' }],
  'quiz-ch2': ['Quiz', { chapter: 'ch2' }],
  'store-full': ['Store', { mode: 'review' }, { nth: 2 }],
  ch3: ['Story', { story: 'ch3' }],
  'store-cook': ['Store', { mode: 'cook' }],
  kitchen: ['Cook', {}],
  'kitchen-water': ['Cook', {}, { data: { step: 'water' } }],
  'kitchen-knead': ['Cook', {}, { data: { step: 'knead' } }],
  'kitchen-fill': ['Cook', {}, { data: { step: 'fill' } }],
  'kitchen-twist': ['Cook', {}, { data: { step: 'twist' } }],
  'kitchen-fry': ['Cook', {}, { data: { step: 'fry' } }],
  result: ['Result', {}],
  ch4: ['Story', { story: 'ch4' }],
  'quiz-ch4': ['Quiz', { chapter: 'ch4' }],
  taste: ['Finale', { mode: 'finale' }],
  bonus: ['Finale', { mode: 'bonus' }, { end: true }],
  note: ['Note', {}, { end: true }],
  last: ['Finale', { mode: 'choice' }, { end: true, noteDone: true }],
  goodbye: ['Finale', { mode: 'goodbye' }, { end: true, noteDone: true }],
  'free-kitchen': ['Store', { mode: 'free' }, { end: true, noteDone: true, free: true }],
  'free-cook': ['Cook', { free: true }, { end: true, noteDone: true, free: true }],
};

export const SCREEN_NAMES = Object.keys(SCREENS);

// The screen named in the address, set up and ready to start, or null for the Title as usual.
export function shortcut() {
  const name = new URLSearchParams(window.location.search).get('screen');
  if (!name) return null;
  if (!SCREENS[name]) {
    console.warn(`There is no screen called "${name}". Try one of: ${SCREEN_NAMES.join(', ')}`);
    return null;
  }
  const [scene, data, opts = {}] = SCREENS[name];
  if (opts.journey === false) return { scene, data };
  const i = opts.end ? JOURNEY.length : journeyIndex(scene, data, opts.nth ?? 1);
  playUpTo(i);
  progress.step = Math.min(i, JOURNEY.length - 1);
  if (opts.noteDone) progress.noteDone = true;
  if (opts.free) progress.freeKitchen = true;
  return { scene, data: { ...data, ...opts.data } };
}

function journeyIndex(scene, data, nth) {
  let seen = 0;
  return JOURNEY.findIndex((s) => s.scene === scene && Object.entries(data).every(([k, v]) => s.data[k] === v) && ++seen === nth);
}

// What the journey's steps before step i would have left behind.
function playUpTo(i) {
  for (const { scene, data } of JOURNEY.slice(0, i)) {
    if (scene === 'Quiz') {
      for (const id of REWARDS[data.chapter] ?? []) {
        progress.collected.push(id);
        progress.justEarned.push(id);
      }
      markChapterDone(data.chapter);
    } else if (scene === 'Store') {
      progress.justEarned = [];
    } else if (scene === 'Cook') {
      progress.lastMuruku = sampleMuruku();
      markChapterDone('ch3');
    }
  }
}

// A well-made muruku: a steady spiral, the right amount of water, golden on both sides.
export function sampleMuruku(radius = 130) {
  const samples = [];
  const b = 7.5 * (radius / 141);
  for (let th = 0, t = 0; 8 + b * th < radius; t += 16) {
    const r = 8 + b * th;
    samples.push({ x: r * Math.cos(th), y: r * Math.sin(th), t, w: 14, stroke: 1 });
    th += 4 / Math.hypot(r, b);
  }
  const result = buildResult({
    dough: scoreDough({ addMistakes: 0, water: 0.62 }),
    twist: scoreTwist(samples),
    fry: scoreFry({ sideA: 0.65, sideB: 0.65, flipped: true }),
  });
  return { samples, colour: fryColour(0.65), result };
}
