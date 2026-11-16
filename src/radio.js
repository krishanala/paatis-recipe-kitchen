// Paati's radio on the veranda: a quiet, plucked tune in a five-note scale (Sa Ri Ga Pa Dha, as in raga Mohanam) over
// a soft drone, made with the Web Audio API, so there is no file to load. It plays only while Sound is on, and fades
// out when the screen closes.

const SA = 293.66; // D4
// [steps above Sa, beats]: four gentle phrases that come back round.
const TUNE = [
  [7, 0.5], [9, 0.5], [12, 1], [9, 0.5], [7, 0.5], [4, 0.5], [2, 0.5], [0, 1.5], [-1, 0.5],
  [4, 0.5], [7, 0.5], [9, 0.5], [7, 0.5], [4, 0.5], [2, 0.5], [4, 1.5], [-1, 0.5],
  [0, 0.5], [2, 0.5], [4, 0.5], [7, 0.5], [9, 0.5], [12, 0.5], [9, 0.5], [7, 1], [-1, 0.5],
  [4, 0.5], [2, 0.5], [0, 0.5], [2, 0.5], [4, 1.5], [0, 2], [-1, 1],
];
const BEAT = 60 / 80;

let audio = null;

export function radioOn() {
  if (audio) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  // A small speaker: everything goes through a gentle low-pass, quietly.
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1.2);
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2200;
  master.connect(tone).connect(ctx.destination);

  // The drone: Sa and Pa, low and steady.
  const drone = [SA / 2, (SA * 3) / 4].map((f) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.value = 0.22;
    o.connect(g).connect(master);
    o.start();
    return o;
  });

  // One plucked note: a quick rise and a long fall, with a quieter octave above for a string's shimmer.
  const pluck = (step, at, beats) => {
    const f = SA * 2 ** (step / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.9, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, at + Math.max(0.6, beats * BEAT * 1.8));
    g.connect(master);
    for (const [mult, type, level] of [[1, 'triangle', 1], [2, 'sine', 0.25]]) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = type;
      o.frequency.value = f * mult;
      og.gain.value = level;
      o.connect(og).connect(g);
      o.start(at);
      o.stop(at + beats * BEAT * 2 + 0.2);
    }
  };

  // Schedule a little ahead, over and over.
  let i = 0;
  let next = ctx.currentTime + 0.4;
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.5) {
      const [step, beats] = TUNE[i];
      if (step >= 0) pluck(step, next, beats);
      next += beats * BEAT;
      i = (i + 1) % TUNE.length;
    }
  }, 100);
  ctx.resume?.().catch(() => {});
  audio = { ctx, master, drone, timer };
}

export function radioOff() {
  if (!audio) return;
  const { ctx, master, timer } = audio;
  audio = null;
  clearInterval(timer);
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0, now + 0.4);
  setTimeout(() => ctx.close().catch(() => {}), 600);
}
