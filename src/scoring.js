import { lerpColor } from './theme.js';

// Perfection score (brief → "Perfection score and stars"): dough 40 (steps 1–3), twist 30 (step 5), fry 30 (step 6).
export const MAX = { dough: 40, twist: 30, fry: 30 };

// Placeholder zones. Playtests and the family recipe (open question 5) should tune them.
export const WATER_ZONE = [0.55, 0.7];
export const GOLDEN_ZONE = [0.55, 0.75];

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function stars(total) {
  if (total >= 90) return 3;
  if (total >= 70) return 2;
  return 1;
}

// Step 1 (order, 15) + step 2 (water, 15) + step 3 (knead, 10).
export function scoreDough({ addMistakes, water }) {
  const add = Math.max(5, 15 - 3 * addMistakes);
  const [lo, hi] = WATER_ZONE;
  let wet = 15;
  let reason = 'Smooth, soft dough. Just right.';
  if (water < lo) {
    wet = Math.max(3, Math.round(15 - (lo - water) * 60));
    reason = 'A bit dry. Add a little more water next time.';
  } else if (water > hi) {
    wet = Math.max(3, Math.round(15 - (water - hi) * 60));
    reason = 'Oops, too much water. The dough got sticky.';
  } else if (addMistakes > 0) {
    reason = 'Remember the order: rice flour, urad dal flour, flour, spices, ghee.';
  }
  // Kneading ends only when the ring is full, so it always earns its 10.
  return { score: add + wet + 10, max: MAX.dough, reason };
}

// samples: [{ x, y, t, stroke }] in pan space. Judges a closed spiral (turns), even rings
// (radius grows steadily with angle) and steady thickness (steady drawing speed).
export function scoreTwist(samples) {
  if (samples.length < 10) {
    return { score: 4, max: MAX.twist, reason: 'Only a little dough came out. Go round two or three times.' };
  }
  const n = samples.length;
  const cx = samples.reduce((s, p) => s + p.x, 0) / n;
  const cy = samples.reduce((s, p) => s + p.y, 0) / n;

  let prev = Math.atan2(samples[0].y - cy, samples[0].x - cx);
  let turned = 0;
  const theta = [0];
  const radius = [Math.hypot(samples[0].x - cx, samples[0].y - cy)];
  for (let i = 1; i < n; i++) {
    const a = Math.atan2(samples[i].y - cy, samples[i].x - cx);
    let d = a - prev;
    if (d > Math.PI) d -= 2 * Math.PI;
    else if (d < -Math.PI) d += 2 * Math.PI;
    turned += d;
    prev = a;
    theta.push(turned);
    radius.push(Math.hypot(samples[i].x - cx, samples[i].y - cy));
  }
  const turns = Math.abs(turned) / (2 * Math.PI);
  const closed = clamp01(turns / 2.5);

  // Linear fit radius ~ angle; R² near 1 means evenly spaced rings.
  const mt = theta.reduce((s, v) => s + v, 0) / n;
  const mr = radius.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (theta[i] - mt) * (radius[i] - mr);
    sxx += (theta[i] - mt) ** 2;
    syy += (radius[i] - mr) ** 2;
  }
  const r2 = sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : 0;
  const even = clamp01((r2 - 0.5) / 0.4);

  // Speed over small windows within each stroke; a low spread means steady thickness.
  const speeds = [];
  for (let i = 4; i < n; i += 2) {
    const a = samples[i - 4];
    const b = samples[i];
    if (a.stroke !== b.stroke || b.t <= a.t) continue;
    speeds.push(Math.hypot(b.x - a.x, b.y - a.y) / (b.t - a.t));
  }
  let steady = 0.5;
  if (speeds.length > 3) {
    const ms = speeds.reduce((s, v) => s + v, 0) / speeds.length;
    const sd = Math.sqrt(speeds.reduce((s, v) => s + (v - ms) ** 2, 0) / speeds.length);
    steady = ms > 0 ? clamp01(1 - (sd / ms - 0.35) / 0.8) : 0;
  }

  const score = Math.round(12 * closed + 10 * even + 8 * steady);
  const parts = [
    { v: closed, reason: 'The spiral was not closed. Go round two or three times.' },
    { v: even, reason: 'The rings were uneven. Let each ring grow a little wider.' },
    { v: steady, reason: 'The thickness changed. Move at a steady speed.' },
  ].sort((a, b) => a.v - b.v);
  // A spiral that barely goes round is the first thing to fix, whatever else is off.
  let reason = parts[0].v >= 0.85 ? 'Even rings and a closed spiral. Lovely.' : parts[0].reason;
  if (closed < 0.6) reason = 'The spiral was not closed. Go round two or three times.';
  return { score, max: MAX.twist, reason, turns };
}

// sideA / sideB: how cooked each side is, 0 (raw) to 1 (burnt).
export function scoreFry({ sideA, sideB, flipped }) {
  const [lo, hi] = GOLDEN_ZONE;
  const side = (p) => {
    if (p < lo) return Math.max(2, Math.round(15 - (lo - p) * 45));
    if (p > hi) return Math.max(2, Math.round(15 - (p - hi) * 45));
    return 15;
  };
  const b = flipped ? sideB : 0;
  const score = side(sideA) + side(b);
  let reason = 'Golden on both sides.';
  if (!flipped) reason = 'It was not flipped, so one side stayed pale. Flip it once next time.';
  else if (Math.max(sideA, b) > hi) reason = 'A little too dark. Lift it a bit sooner.';
  else if (Math.min(sideA, b) < lo) reason = 'Too pale. Give it a little longer.';
  return { score, max: MAX.fry, reason };
}

export function fryColour(p) {
  return p < 0.65 ? lerpColor(0xf3e2b8, 0xd8962f, p / 0.65) : lerpColor(0xd8962f, 0x5e3210, (p - 0.65) / 0.35);
}

export function buildResult({ dough, twist, fry }) {
  const total = dough.score + twist.score + fry.score;
  return { dough, twist, fry, total, stars: stars(total) };
}
