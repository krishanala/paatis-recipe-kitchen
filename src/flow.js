import { progress } from './state.js';

// The one-time journey, in order. docs/user-flow.md draws the same path.
export const JOURNEY = [
  { scene: 'Story', data: { story: 'welcome' } },
  { scene: 'Story', data: { story: 'ch1' } },
  { scene: 'Quiz', data: { chapter: 'ch1' } },
  { scene: 'Store', data: { mode: 'review' } },
  { scene: 'Story', data: { story: 'ch2' } },
  { scene: 'Quiz', data: { chapter: 'ch2' } },
  { scene: 'Store', data: { mode: 'review' } },
  { scene: 'Story', data: { story: 'ch3' } },
  { scene: 'Store', data: { mode: 'cook' } },
  { scene: 'Cook', data: {} },
  { scene: 'Result', data: {} },
  { scene: 'Story', data: { story: 'ch4' } },
  { scene: 'Quiz', data: { chapter: 'ch4' } },
  { scene: 'Finale', data: { mode: 'finale' } },
];

export function nextStep() {
  progress.step = Math.min(progress.step + 1, JOURNEY.length - 1);
  return JOURNEY[progress.step];
}

// Where Play/Continue on the Title screen should go.
export function resumeStep() {
  if (progress.freeKitchen) return { scene: 'Store', data: { mode: 'free' } };
  if (progress.step < 0) return nextStep();
  return JOURNEY[progress.step];
}
