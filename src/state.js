// Settings are remembered on this device. Progress lasts for the session only:
// whether to save between visits is open question 7 in the brief.

const SETTINGS_KEY = 'muruku.settings.v1';

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function loadSettings() {
  const defaults = { sound: true, textScale: 1, reduceMotion: prefersReducedMotion() };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return defaults;
  }
}

export const settings = loadSettings();

export function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Private mode or blocked storage: settings still work for this visit.
  }
}

function freshProgress() {
  return {
    step: -1, // index into JOURNEY (flow.js); -1 means the journey hasn't started
    collected: [], // ingredient ids earned so far
    justEarned: [], // ids the Store should animate filling in next time it opens
    quizIndex: {}, // chapter id → index of the current question
    quizPick: {}, // chapter id → ids of the questions this journey asks (src/quiz.js)
    firstTry: {}, // chapter id → [true | false] per question, for the success measures
    chaptersDone: [],
    lastMuruku: null, // { points, colour, result } of the most recent muruku
    freeKitchen: false,
    plate: 0, // muruku made in the free kitchen
    factIndex: 0,
    noteSent: false, // the remembrance note at the end has gone with the pigeon
  };
}

export const progress = freshProgress();

export function resetProgress() {
  Object.assign(progress, freshProgress());
}

export function markChapterDone(id) {
  if (!progress.chaptersDone.includes(id)) progress.chaptersDone.push(id);
}
