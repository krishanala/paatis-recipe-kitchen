import { settings } from '../state.js';

// Paati, alive: every full-figure Paati breathes and sways a little, her free hands move on their own, and each time
// she says something (PaatiBubble.say emits 'paati-say') she reacts to it: a happy hop and a wave or thumbs-up when
// she is excited, a tilt of the head and a raised finger for a question, a nod and a little hand movement otherwise,
// and a giggle behind her hand when she laughs or teases (and now and then on her own). With Reduce motion she stands
// still.
//
// Her hands are cut from the illustrations along the wrist (the boxes below, in the picture's own pixels), so they can
// turn about the wrist (`pivot`) while the rest of her stays put. The body keeps a thin band of the wrist under the
// cut so no gap shows. `lift` is the way the hand turns to rise (+1 clockwise), and `kind` how it moves:
// palm (an open palm that lifts, as if saying "come, come"), wave, thumb (a thumbs-up that pumps), finger (a wag).
const HANDS = {
  'paati-welcome': [
    { box: [0, 400, 106, 565], pivot: [108, 470], lift: 1, kind: 'palm' },
    { box: [552, 395, 680, 528], pivot: [550, 462], lift: -1, kind: 'palm' },
  ],
  'paati-proud': [
    { box: [548, 0, 718, 192], pivot: [610, 192], lift: -1, kind: 'wave' },
    { box: [0, 388, 104, 522], pivot: [106, 468], lift: 1, kind: 'thumb' },
  ],
  'paati-teaching': [{ box: [492, 200, 586, 402], pivot: [538, 404], lift: -1, kind: 'finger' }],
};
const BAND = 10; // px of the wrist left on the body under each cut
// For a giggle she turns, for a moment, into her laughing picture: eyes shut, her hand and hanky up at her mouth, the
// way grandmothers laugh into the end of their sari.
const GIGGLE = 'paati-taste-wipe';

// Builds (once) the textures for a pose with moving hands: the body without its hands, and each hand.
function cutTextures(scene, key) {
  const hands = HANDS[key];
  const baseKey = `${key}-body`;
  if (!scene.textures.exists(baseKey)) {
    const src = scene.textures.get(key).getSourceImage();
    const base = scene.textures.createCanvas(baseKey, src.width, src.height);
    const ctx = base.getContext();
    ctx.drawImage(src, 0, 0);
    hands.forEach((h, i) => {
      let [x0, y0, x1, y1] = h.box;
      const [px, py] = h.pivot;
      if (px >= x1 - 4) x1 -= BAND;
      else if (px <= x0 + 4) x0 += BAND;
      else if (py >= y1 - 4) y1 -= BAND;
      else y0 += BAND;
      ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
      const [bx0, by0, bx1, by1] = h.box;
      const piece = scene.textures.createCanvas(`${key}-hand${i}`, bx1 - bx0, by1 - by0);
      piece.getContext().drawImage(src, bx0, by0, bx1 - bx0, by1 - by0, 0, 0, bx1 - bx0, by1 - by0);
      piece.refresh();
    });
    base.refresh();
  }
  return baseKey;
}

// Paati standing with her feet at (x, bottom), `height` tall. Returns a container (move, fade or destroy it as one).
export function livelyPaati(scene, x, bottom, key, height) {
  const fig = scene.add.container(x, bottom);
  const body = scene.add.container(0, 0);
  fig.add(body);
  const still = settings.reduceMotion;
  const hands = !still && HANDS[key] ? HANDS[key] : null;
  const img = scene.add.image(0, 0, hands ? cutTextures(scene, key) : key).setOrigin(0.5, 1);
  const k = height / img.height;
  img.setScale(k);
  body.add(img);
  if (still) return fig;

  const W = img.width;
  const H = img.height;
  const parts = (hands ?? []).map((h, i) => {
    const [bx0, by0, bx1, by1] = h.box;
    const [px, py] = h.pivot;
    const piece = scene.add
      .image((px - W / 2) * k, (py - H) * k, `${key}-hand${i}`)
      .setOrigin((px - bx0) / (bx1 - bx0), (py - by0) / (by1 - by0))
      .setScale(k);
    body.add(piece);
    piece.hand = h;
    return piece;
  });

  // Her giggling picture, hidden until she giggles.
  const pose = [img, ...parts];
  const giggler = key !== GIGGLE && scene.textures.exists(GIGGLE) ? scene.add.image(0, 0, GIGGLE).setOrigin(0.5, 1).setAlpha(0) : null;
  if (giggler) body.add(giggler.setScale(height / giggler.height));

  // Breathing and a slow sway, from her feet, each starting at its own moment so the screens don't move in step.
  const tw = (cfg) => scene.tweens.add({ targets: body, yoyo: true, repeat: -1, ease: 'Sine.InOut', ...cfg });
  tw({ scaleY: 1.012, duration: 1700, delay: Math.random() * 800 });
  body.angle = -0.7;
  tw({ angle: 0.7, duration: 2900, delay: Math.random() * 1200 });

  // The hands drift a little while she stands.
  const idle = parts.map((p) =>
    scene.tweens.add({ targets: p, angle: p.hand.lift * (p.hand.kind === 'wave' ? 6 : 3), duration: 1300 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' }),
  );

  // One gesture at a time; a new line stops the last one.
  let moving = [];
  let back = null;
  const stop = () => {
    moving.forEach((t) => t.stop());
    moving = [];
    back?.remove(false);
    back = null;
    fig.y = bottom;
    fig.angle = 0;
    fig.scaleY = 1;
    if (giggler?.alpha) {
      giggler.setAlpha(0);
      pose.forEach((o) => o.setAlpha(1));
    }
  };
  const add = (cfg) => moving.push(scene.tweens.add(cfg));
  const handMove = (p, strength = 1) => {
    const h = p.hand;
    idle.forEach((t) => t.pause());
    const back = () => {
      p.angle = 0;
      idle.forEach((t) => t.resume());
    };
    if (h.kind === 'wave') add({ targets: p, angle: { from: -14, to: 12 }, duration: 170, yoyo: true, repeat: 3 * strength, ease: 'Sine.InOut', onComplete: back });
    else if (h.kind === 'finger') add({ targets: p, angle: { from: -10, to: 10 }, duration: 200, yoyo: true, repeat: 2 * strength, ease: 'Sine.InOut', onComplete: back });
    else if (h.kind === 'thumb') add({ targets: p, angle: h.lift * 14, duration: 150, yoyo: true, repeat: 2 * strength - 1, ease: 'Quad.Out', onComplete: back });
    else add({ targets: p, angle: h.lift * 10, duration: 260, yoyo: true, repeat: strength, ease: 'Sine.InOut', onComplete: back });
  };

  const gestures = {
    // A happy little hop, and her hands join in.
    excited() {
      add({ targets: fig, y: bottom - height * 0.035, duration: 170, yoyo: true, repeat: 1, ease: 'Quad.Out' });
      parts.forEach((p) => handMove(p, 2));
    },
    // Laughing: her shoulders shake.
    laugh() {
      add({ targets: fig, angle: { from: -1.6, to: 1.6 }, duration: 90, yoyo: true, repeat: 5, ease: 'Sine.InOut', onComplete: () => (fig.angle = 0) });
      add({ targets: fig, scaleY: 0.985, duration: 90, yoyo: true, repeat: 5 });
      parts.forEach((p) => handMove(p, 1));
    },
    // A giggle behind her hand: her laughing picture for a moment, her shoulders shaking, then back.
    giggle() {
      if (!giggler) return gestures.laugh();
      const swap = (on, off) => {
        add({ targets: off, alpha: 0, duration: 140 });
        add({ targets: on, alpha: 1, duration: 140 });
      };
      swap([giggler], pose);
      add({ targets: fig, angle: { from: -1.3, to: 1.3 }, duration: 110, yoyo: true, repeat: 7, ease: 'Sine.InOut', onComplete: () => (fig.angle = 0) });
      add({ targets: fig, scaleY: 0.986, duration: 110, yoyo: true, repeat: 7 });
      back = scene.time.delayedCall(1900, () => {
        back = null;
        swap(pose, [giggler]);
      });
    },
    // A question: she tilts her head to one side, finger up.
    ask() {
      add({ targets: fig, angle: 2.4, duration: 260, yoyo: true, hold: 700, ease: 'Sine.InOut' });
      parts.forEach((p) => handMove(p, 1));
    },
    // Talking: a nod, and a hand moves with her words.
    talk() {
      add({ targets: fig, scaleY: 0.982, duration: 160, yoyo: true, repeat: 1, ease: 'Sine.InOut' });
      if (parts.length) handMove(parts[Math.floor(Math.random() * parts.length)], 1);
    },
  };
  // Laughter and teasing get a giggle; a question, a tilt; an exclamation, a hop (or every other time, a giggle).
  let cheers = 0;
  const react = (text = '') => {
    stop();
    const t = String(text);
    if (/\b(ha(ha)+|hee|giggle|laugh|joke|boss|no wandering|deal\b)/i.test(t)) gestures.giggle();
    else if (/\?\s*$/.test(t) || /\?/.test(t.split(/[.!]/)[0] ?? '')) gestures.ask();
    else if (/!/.test(t)) (cheers++ % 2 ? gestures.giggle : gestures.excited)();
    else gestures.talk();
  };
  fig.react = react;
  fig.gesture = (name) => {
    stop();
    gestures[name]?.();
  };

  // She answers her own words, and now and then moves on her own.
  const onSay = (text) => fig.active && react(text);
  scene.events.on('paati-say', onSay);
  let idleCount = 0;
  const timer = scene.time.addEvent({
    delay: 5200,
    loop: true,
    callback: () => {
      if (moving.some((t) => t.isPlaying()) || back) return;
      (++idleCount % 3 === 0 ? gestures.giggle : gestures.talk)();
    },
  });
  fig.once('destroy', () => {
    scene.events.off('paati-say', onSay);
    timer.remove(false);
    back?.remove(false);
  });
  // A hello as she arrives, unless she is already reacting to her first words.
  scene.time.delayedCall(450, () => fig.active && !back && !moving.some((t) => t.isPlaying()) && gestures.excited());
  return fig;
}
