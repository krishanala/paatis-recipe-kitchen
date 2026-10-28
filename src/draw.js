import { lerpColor } from './theme.js';

// The player's muruku is the spiral they drew: samples [{ x, y, w, stroke }], where w is the dough thickness.
// It is drawn as overlapping circles (smooth thick ribbon) on two layers: a thin edge layer underneath, a little
// deeper than the dough, and the fill layer on top. (A centre line for the star plate's ridge read as stripes, so
// it was taken out.)

export const edgeOf = (colour) => lerpColor(colour, 0x3a1d08, 0.2);

function stamp(g, x, y, r) {
  g.fillCircle(x, y, r);
}

// Draws the piece of ribbon between samples a and b (b only, when a is from another stroke).
export function drawSegment(edgeG, fillG, a, b, { scale = 1, ox = 0, oy = 0, edgeWidth = 1.5 } = {}) {
  if (!a || a.stroke !== b.stroke) {
    stamp(edgeG, ox + b.x * scale, oy + b.y * scale, (b.w / 2) * scale + edgeWidth);
    stamp(fillG, ox + b.x * scale, oy + b.y * scale, (b.w / 2) * scale);
    return;
  }
  const d = Math.hypot(b.x - a.x, b.y - a.y) * scale;
  const steps = Math.max(1, Math.ceil(d / 3));
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    const x = ox + (a.x + (b.x - a.x) * t) * scale;
    const y = oy + (a.y + (b.y - a.y) * t) * scale;
    const r = ((a.w + (b.w - a.w) * t) / 2) * scale;
    stamp(edgeG, x, y, r + edgeWidth);
    stamp(fillG, x, y, r);
  }
}

export function paintRibbon(edgeG, fillG, samples, { fill, edge = edgeOf(fill), scale = 1, ox = 0, oy = 0 } = {}) {
  edgeG.clear();
  fillG.clear();
  edgeG.fillStyle(edge, 1);
  fillG.fillStyle(fill, 1);
  const edgeWidth = Math.max(1, 1.5 * scale);
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
