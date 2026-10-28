import { lerpColor } from './theme.js';

// The player's muruku is the spiral they drew: samples [{ x, y, w, stroke }], where w is the dough thickness.
// It is drawn as overlapping circles (smooth thick ribbon) on two layers: an edge layer underneath and a
// fill layer on top. (A centre line for the star plate's ridge read as stripes, so it was taken out.)
// Along both sides, small bumps of dough give it the crinkly edge the star plate leaves on real muruku.

export const edgeOf = (colour) => lerpColor(colour, 0x3a1d08, 0.35);

// The crinkly sides: a bump every CRINKLE.gap × thickness along each side (the two sides take turns), each about
// CRINKLE.size × thickness across, standing out from the edge. Sizes wobble a little so it looks hand-pressed.
const CRINKLE = { gap: 0.6, size: 0.27, out: 0.8 };

function stamp(g, x, y, r) {
  g.fillCircle(x, y, r);
}

// The same small wobble for the same bump every time the muruku is drawn.
const wobble = (n) => {
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return 0.8 + 0.4 * (v - Math.floor(v));
};

// Draws the piece of ribbon between samples a and b (b only, when a is from another stroke). Each sample keeps
// how far along its stroke it is (s), so the bumps stay evenly spaced from one piece to the next.
export function drawSegment(edgeG, fillG, a, b, { scale = 1, ox = 0, oy = 0, edgeWidth = 3 } = {}) {
  if (!a || a.stroke !== b.stroke) {
    b.s = 0;
    stamp(edgeG, ox + b.x * scale, oy + b.y * scale, (b.w / 2) * scale + edgeWidth);
    stamp(fillG, ox + b.x * scale, oy + b.y * scale, (b.w / 2) * scale);
    return;
  }
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const s0 = a.s ?? 0;
  b.s = s0 + len;
  const d = len * scale;
  const steps = Math.max(1, Math.ceil(d / 3));
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    const x = ox + (a.x + (b.x - a.x) * t) * scale;
    const y = oy + (a.y + (b.y - a.y) * t) * scale;
    const r = ((a.w + (b.w - a.w) * t) / 2) * scale;
    stamp(edgeG, x, y, r + edgeWidth);
    stamp(fillG, x, y, r);
  }
  if (len === 0) return;
  // The crinkles: every half gap along the stroke, a bump on one side, then the other.
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const w = (a.w + b.w) / 2;
  const half = (CRINKLE.gap * w) / 2;
  for (let j = Math.ceil(s0 / half); j * half <= b.s; j++) {
    if (j * half <= s0 && s0 > 0) continue; // drawn with the piece before
    const t = (j * half - s0) / len;
    const side = j % 2 ? 1 : -1;
    const br = CRINKLE.size * w * wobble(j + b.stroke * 1000) * scale;
    const off = (w / 2) * scale - br * (1 - CRINKLE.out);
    const x = ox + (a.x + (b.x - a.x) * t) * scale + nx * off * side;
    const y = oy + (a.y + (b.y - a.y) * t) * scale + ny * off * side;
    stamp(edgeG, x, y, br + edgeWidth * 0.8);
    stamp(fillG, x, y, br);
  }
}

export function paintRibbon(edgeG, fillG, samples, { fill, edge = edgeOf(fill), scale = 1, ox = 0, oy = 0 } = {}) {
  edgeG.clear();
  fillG.clear();
  edgeG.fillStyle(edge, 1);
  fillG.fillStyle(fill, 1);
  const edgeWidth = Math.max(1.5, 3 * scale);
  for (let i = 0; i < samples.length; i++) drawSegment(edgeG, fillG, samples[i - 1], samples[i], { scale, ox, oy, edgeWidth });
}

// Draws a finished muruku ({ samples, colour }) centred at (x, y), fitted into a box `size` wide.
export function paintMuruku(scene, muruku, x, y, size) {
  const { samples, colour } = muruku;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of samples) {
    minX = Math.min(minX, p.x - p.w / 2);
    maxX = Math.max(maxX, p.x + p.w / 2);
    minY = Math.min(minY, p.y - p.w / 2);
    maxY = Math.max(maxY, p.y + p.w / 2);
  }
  const span = Math.max(maxX - minX, maxY - minY, 1);
  const scale = size / span;
  const ox = x - ((minX + maxX) / 2) * scale;
  const oy = y - ((minY + maxY) / 2) * scale;
  const edgeG = scene.add.graphics();
  const fillG = scene.add.graphics();
  paintRibbon(edgeG, fillG, samples, { fill: colour, scale, ox, oy });
  return [edgeG, fillG];
}
