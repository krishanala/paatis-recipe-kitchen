// The forest in the shadow puppet show: trees as the shadows they cast on the cloth. Each one is grown branch by
// branch with the canvas 2D API, in puppet units (a puppet is 100 units tall), standing at (0, 0) and growing up
// (negative y). Everything is filled in one colour, so leaves and branches that overlap don't show seams; the scene
// tints the result and softens its edges.

// A seeded random, so each tree grows the same way every time.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Turns direction a part of the way (t) towards direction b. Angles are canvas angles: 0 points right, π/2 down.
const towards = (a, b, t) => Math.atan2(Math.sin(a) * (1 - t) + Math.sin(b) * t, Math.cos(a) * (1 - t) + Math.cos(b) * t);
const DOWN = Math.PI / 2;

// Paints shapes into a canvas context. Branch angles are measured from straight up, positive to the right.
export class Shadow {
  constructor(ctx, seed) {
    this.ctx = ctx;
    this.rnd = seeded(seed);
  }

  range(a, b) {
    return a + (b - a) * this.rnd();
  }

  // A tapering branch from (x0, y0) to (x1, y1), w0 wide at its base and w1 at its tip, bowed sideways by `bend` (a
  // fraction of its length). Returns where it runs: at(t) is the point t of the way along, and its direction.
  limb(x0, y0, x1, y1, w0, w1, bend = 0) {
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const cx = (x0 + x1) / 2 - ((y1 - y0) / len) * bend * len;
    const cy = (y0 + y1) / 2 + ((x1 - x0) / len) * bend * len;
    const at = (t) => {
      const m = 1 - t;
      return {
        x: m * m * x0 + 2 * m * t * cx + t * t * x1,
        y: m * m * y0 + 2 * m * t * cy + t * t * y1,
        dx: 2 * m * (cx - x0) + 2 * t * (x1 - cx),
        dy: 2 * m * (cy - y0) + 2 * t * (y1 - cy),
      };
    };
    const n = Math.max(3, Math.ceil(len / 2));
    const a = [];
    const b = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const q = at(t);
      const d = Math.hypot(q.dx, q.dy) || 1;
      const h = (w0 + (w1 - w0) * t) / 2;
      a.push([q.x - (q.dy / d) * h, q.y + (q.dx / d) * h]);
      b.push([q.x + (q.dy / d) * h, q.y - (q.dx / d) * h]);
    }
    const ctx = this.ctx;
    ctx.beginPath();
    a.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    b.reverse().forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fill();
    // Round ends, so branches join smoothly (filled apart from the branch, so they can't cancel it out).
    ctx.beginPath();
    ctx.moveTo(x0 + w0 / 2, y0);
    ctx.arc(x0, y0, w0 / 2, 0, Math.PI * 2);
    ctx.moveTo(x1 + w1 / 2, y1);
    ctx.arc(x1, y1, w1 / 2, 0, Math.PI * 2);
    ctx.fill();
    return at;
  }

  // The roots flaring out where a trunk w wide meets the ground at x.
  flare(x, w, h) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x - w * 1.5, 0.6);
    ctx.quadraticCurveTo(x - w * 0.55, -0.4, x - w * 0.5, -h);
    ctx.lineTo(x + w * 0.5, -h);
    ctx.quadraticCurveTo(x + w * 0.55, -0.4, x + w * 1.5, 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // One leaf, added to the current path: from its stalk at (x, y), len long and wid across, pointing at canvas
  // angle `ang`. Every leaf winds the same way, so a pathful of them fills solid where they overlap.
  leaf(x, y, len, wid, ang) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const P = (u, v) => [x + u * c - v * s, y + u * s + v * c];
    const ctx = this.ctx;
    ctx.moveTo(...P(0, 0));
    ctx.quadraticCurveTo(...P(len * 0.4, wid), ...P(len, 0));
    ctx.quadraticCurveTo(...P(len * 0.4, -wid), ...P(0, 0));
  }

  // A clump of n leaves round (cx, cy): a dense heart with leaves all round it pointing outwards and drooping a
  // little, so its edge is ragged and the light shows through between the outer leaves.
  cluster(cx, cy, r, len, n, droop = 0.3) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.55, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const th = this.rnd() * Math.PI * 2;
      const d = r * Math.sqrt(this.rnd());
      const ang = towards(th + this.range(-0.7, 0.7), DOWN, droop);
      const l = len * this.range(0.75, 1.2);
      this.leaf(cx + Math.cos(th) * d, cy + Math.sin(th) * d * 0.8, l, l * this.range(0.34, 0.46), ang);
    }
    ctx.fill();
  }

  // A palm frond (or a fern's): a stalk from (x, y) at angle a, len long, bowing under its own weight, with narrow
  // leaflets along both sides that angle towards its tip and hang down. `hang` is how much they hang.
  frond(x, y, a, len, { droop = 0.022, leaflet = 11, width = 0.9, stalk = 1.5, hang = 0.3 } = {}) {
    const ctx = this.ctx;
    const step = 1.3;
    const pts = [];
    let ang = a;
    for (let s = 0; s <= len; s += step) {
      pts.push({ x, y, ang, s });
      ang = clamp(ang + Math.sign(ang || 1) * droop * step * (0.4 + Math.abs(Math.sin(ang))), -3.05, 3.05);
      x += Math.sin(ang) * step;
      y -= Math.cos(ang) * step;
    }
    ctx.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      ctx.lineWidth = stalk * (1 - pts[i].s / len) + 0.25;
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    ctx.beginPath();
    for (const q of pts) {
      const t = q.s / len;
      if (t < 0.1) continue;
      // Longest in the middle of the frond, short at its tip.
      const L = leaflet * (0.25 + 0.75 * Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.05) / 1.02)), 0.6));
      for (const side of [-1, 1]) {
        const ang = towards(q.ang + side * this.range(0.75, 1.0) - Math.PI / 2, DOWN, hang + 0.25 * t);
        this.leaf(q.x, q.y, L * this.range(0.85, 1.1), width, ang);
      }
    }
    ctx.fill();
  }
}

// A broad-leaved forest tree: a trunk with flared roots that forks into limbs, then branches and twigs, each tipped
// with clumps of leaves, so the crown is a leafy dome with light through its gaps and its limbs showing between.
export function broadleaf(p, { trunk = 44, reach = 32, limbs = 4, spread = 1, leaf = 4, leaves = 44, clump = 8, lean = 0, tw = 9 } = {}) {
  const tips = [];
  const twigs = [];
  const grow = (x, y, ang, len, w, depth) => {
    const ex = x + Math.sin(ang) * len;
    const ey = y - Math.cos(ang) * len;
    const at = p.limb(x, y, ex, ey, w, w * 0.6, p.range(-0.12, 0.12));
    if (depth === 0) return tips.push([ex, ey]);
    if (depth === 1) twigs.push(at(0.55));
    const kids = p.rnd() < 0.4 ? 3 : 2;
    for (let i = 0; i < kids; i++) {
      // Each fork spreads out, and leans back a little towards the light above.
      const a = (ang + (i - (kids - 1) / 2) * p.range(0.45, 0.65) + p.range(-0.15, 0.15)) * 0.88;
      grow(ex, ey, clamp(a, -1.75, 1.75), len * p.range(0.64, 0.8), w * 0.62, depth - 1);
    }
  };
  p.flare(0, tw, 7);
  const trunkAt = p.limb(0, 0, lean, -trunk, tw, tw * 0.72, p.range(-0.05, 0.05));
  for (let i = 0; i < limbs; i++) {
    const a = ((i / (limbs - 1) - 0.5) * 1.9 + p.range(-0.12, 0.12)) * spread;
    const from = trunkAt(i === Math.floor(limbs / 2) ? 1 : p.range(0.72, 0.97));
    grow(from.x, from.y, a, reach * p.range(0.85, 1.1), tw * 0.6, 3);
  }
  tips.forEach(([x, y]) => p.cluster(x, y, clump, leaf, leaves));
  twigs.forEach(({ x, y }) => p.cluster(x, y, clump * 0.7, leaf, Math.round(leaves * 0.6)));
}

// A banyan: a broad trunk of stems grown together, long limbs spreading wide and level, and roots hanging from the
// limbs; the ones that reached the ground have thickened into pillars. `left` shortens the limbs on the left.
export function banyan(p, { left = 1, leaf = 5 } = {}) {
  const tips = [];
  const grow = (x, y, ang, len, w, depth) => {
    const ex = x + Math.sin(ang) * len;
    const ey = y - Math.cos(ang) * len;
    p.limb(x, y, ex, ey, w, w * 0.6, p.range(-0.12, 0.12));
    if (depth === 0) return tips.push([ex, ey]);
    for (let i = 0; i < 2; i++) {
      const a = (ang + (i - 0.5) * p.range(0.5, 0.75) + p.range(-0.15, 0.15)) * 0.8;
      grow(ex, ey, clamp(a, -1.6, 1.6), len * p.range(0.66, 0.8), w * 0.62, depth - 1);
    }
  };
  for (const [x0, x1, w] of [[-9, -5, 11], [0, 0, 13], [8, 5, 10]]) p.limb(x0, 0, x1 + p.range(-1, 1), -42, w, w * 0.8, p.range(-0.05, 0.05));
  p.flare(0, 24, 12);
  p.flare(-14, 7, 5);
  p.flare(15, 7, 5);
  const roots = [];
  for (const [a, len] of [[-1.38, 74], [-0.85, 52], [-0.25, 40], [0.3, 42], [0.92, 56], [1.4, 78]]) {
    const L = len * (a < 0 ? left : 1) * p.range(0.92, 1.08);
    const x0 = Math.sign(a) * 3;
    const y0 = -36 - p.rnd() * 8;
    const ex = x0 + Math.sin(a) * L;
    const ey = y0 - Math.cos(a) * L;
    // The limb rises from the trunk and levels out.
    const at = p.limb(x0, y0, ex, ey, 7.5, 3.5, -Math.sign(ex - x0) * 0.1);
    for (const t of [0.45, 0.75, 1]) {
      const q = at(t);
      grow(q.x, q.y, a * 0.45 + p.range(-0.3, 0.3), 24 * p.range(0.85, 1.1), 3.4, 2);
    }
    if (Math.abs(a) > 0.6) for (let t = 0.25; t < 0.97; t += p.range(0.08, 0.16)) roots.push(at(t));
  }
  // Aerial roots: fine ones hang in bunches and stop short; a few reach the ground as pillars.
  for (const q of roots) {
    if (p.rnd() < 0.22) {
      const w = p.range(2.2, 3.6);
      p.limb(q.x, q.y, q.x + p.range(-1.5, 1.5), 0.5, w * 0.8, w, p.range(-0.02, 0.02));
      p.flare(q.x, w, 2.5);
      continue;
    }
    const strands = 1 + Math.floor(p.rnd() * 3);
    for (let i = 0; i < strands; i++) {
      const x = q.x + p.range(-1.6, 1.6);
      const len = -q.y * p.range(0.25, 0.8);
      p.limb(x, q.y, x + p.range(-1.2, 1.2), q.y + len, p.range(0.7, 1.1), 0.3, p.range(-0.03, 0.03));
    }
  }
  tips.forEach(([x, y]) => p.cluster(x, y, 9.5, leaf, 42));
}

// A coconut palm: a tall, curving trunk ringed with the scars of old fronds, a bunch of coconuts, and a crown of
// long fronds that arch out and bow down, with an old one hanging dead along the trunk.
export function palm(p, { height = 160, lean = 12, fronds = 13, reach = 46 } = {}) {
  const ctx = p.ctx;
  p.flare(0, 7, 6);
  const at = p.limb(0, 0, lean, -height, 7, 4.2, -Math.sign(lean || 1) * 0.07);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeStyle = 'rgba(0,0,0,0.38)';
  ctx.lineWidth = 0.45;
  for (let t = 0.05; t < 0.97; t += 3.1 / height) {
    const q = at(t);
    const d = Math.hypot(q.dx, q.dy) || 1;
    const w = (7 + (4.2 - 7) * t) / 2 + 0.6;
    ctx.beginPath();
    ctx.moveTo(q.x - (q.dy / d) * w, q.y + (q.dx / d) * w - 0.5);
    ctx.lineTo(q.x + (q.dy / d) * w, q.y - (q.dx / d) * w + 0.5);
    ctx.stroke();
  }
  ctx.restore();
  const top = at(1);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const x = top.x + p.range(-5, 5);
    const y = top.y + p.range(1.5, 6);
    ctx.moveTo(x + 2.6, y);
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
  }
  ctx.fill();
  p.frond(top.x, top.y + 2, Math.sign(lean || 1) * -2.85, reach * 0.62, { droop: 0.05, hang: 0.75, leaflet: 8, width: 0.7 });
  for (let i = 0; i < fronds; i++) {
    const a = -2.5 + (5 * i) / (fronds - 1) + p.range(-0.15, 0.15);
    p.frond(top.x, top.y, a, reach * p.range(0.85, 1.1) * (0.72 + 0.28 * Math.abs(Math.sin(a))));
  }
}

// Grass and low plants along the ground, `width` units long: tufts of grass blades, with ferns and leafy bushes here
// and there.
export function undergrowth(p, width) {
  for (let x = 0; x < width; x += p.range(3, 7)) {
    const blades = 4 + Math.floor(p.rnd() * 5);
    for (let i = 0; i < blades; i++) {
      const h = p.range(3.5, 10);
      const a = p.range(-0.55, 0.55);
      const x0 = x + p.range(-1.5, 1.5);
      p.limb(x0, 0.6, x0 + Math.sin(a) * h, -Math.cos(a) * h, 1.1, 0.15, p.range(-0.18, 0.18));
    }
  }
  for (let x = p.range(10, 30); x < width; x += p.range(35, 70)) {
    if (p.rnd() < 0.5) {
      for (let i = 0; i < 7; i++) p.frond(x, 0.5, -1.3 + (2.6 * i) / 6 + p.range(-0.1, 0.1), p.range(12, 19), { droop: 0.06, leaflet: 3.4, width: 1.1, stalk: 0.7, hang: 0.15 });
    } else {
      for (let i = 0; i < 3; i++) p.cluster(x + (i - 1) * 5 + p.range(-1, 1), -5 - p.rnd() * 4, 6, 2.6, 34, 0.15);
    }
  }
}

// The far side of the forest, `width` units long: a row of trees and palms, smaller with distance.
export function distantForest(p, width) {
  const ctx = p.ctx;
  for (let x = p.range(-12, 2); x < width + 12; x += p.range(30, 48)) {
    const s = p.range(0.55, 0.78);
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(s, s);
    if (p.rnd() < 0.28) palm(p, { height: p.range(140, 185), lean: p.range(-14, 14), reach: 40 });
    else broadleaf(p, { trunk: p.range(55, 90), reach: p.range(26, 34), limbs: 3 + Math.floor(p.rnd() * 2), spread: p.range(0.8, 1.05), lean: p.range(-4, 4), leaf: 5, leaves: 26 });
    ctx.restore();
  }
}
