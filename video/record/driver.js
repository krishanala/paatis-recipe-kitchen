// The video recorder: plays Paati's Recipe from the Title to the goodbye by itself, the way a careful player would,
// and saves every frame (30 a second, 1920 × 1080) through video/tools/record_server.py.
//
// It runs inside the game's own page: video/record.html loads the game in a frame and then this module into it, so
// it uses the game's own modules (the same progress and settings) and changes nothing in the game's files. Instead
// of letting the game run in real time, it moves the game's clock on by hand, one frame at a time, so every frame is
// captured however long saving takes, and the video plays at the game's true speed.
//
// A finger dot shows each tap, drag and swirl. Each part of the game is its own clip (PLAN below), so the clips can
// be trimmed and reordered when editing. Change the pacing with READ_* below, and what is picked or answered with
// PICKS and WRONG_FIRST.

import { progress, settings } from '/src/state.js';
import { WATER_ZONE } from '/src/scoring.js';
import { ADD_ORDER, COOK_QUESTIONS, COOK_LINES } from '/src/content.js';

const FPS = 30;
const W = 1920;
const H = 1080;
const STEPS_PER_FRAME = 2; // the game runs at 60 steps a second, the video at 30 frames
const STEP_MS = 1000 / (FPS * STEPS_PER_FRAME);
const JPEG_QUALITY = 0.92;

// How long a line stays up: long enough to read at an easy pace.
const READ_BASE = 1.2; // seconds
const READ_PER_CHAR = 1 / 16; // seconds per character
const read = (str) => Math.max(2.2, READ_BASE + String(str).length * READ_PER_CHAR);

// The quiz questions to show (one of each kind across the chapters), and which questions get a wrong answer first,
// to show Paati's gentle nudge. The name typed on the Welcome page.
const PICKS = {
  ch1: ['kolam-rice', 'medicine', 'spot-diya'],
  ch2: ['twisted', 'make-order', 'hand'],
  ch4: ['shared', 'keeps'],
};
const WRONG_FIRST = { ch1: [0], ch2: [], ch4: [] };
const PLAYER_NAME = 'Meena';
const STORY_TO_WATCH = 'rama'; // the story card to open in Stories of Deepavali

// Each clip: [file name, what happens in it].
const PLAN = [
  ['01-title', title],
  ['02-welcome', welcome],
  ['03-before-we-begin', beforeWeBegin],
  ['04-chapter-1-story', story],
  ['05-chapter-1-quiz', () => quiz('ch1')],
  ['06-stories-of-deepavali', storiesOfDeepavali],
  ['07-store', () => store({ peek: 'Rice flour' })],
  ['08-chapter-2-story', story],
  ['09-chapter-2-quiz', () => quiz('ch2')],
  ['10-store-full', () => store({})],
  ['11-chapter-3-story', story],
  ['12-store-start-cooking', () => store({})],
  ['13-kitchen', kitchen],
  ['14-your-muruku', result],
  ['15-chapter-4-story', story],
  ['16-chapter-4-quiz', () => quiz('ch4')],
  ['17-paati-tastes-it', taste],
  ['18-what-next', whatNext],
  ['19-goodbye', goodbye],
];

export const clips = PLAN.map(([name]) => name);
export const state = { clip: '', frames: 0, total: 0, done: false, error: null, startedAt: 0 };

let game;
let clip = null;
let index = 0;
let t = 0;
const out = document.createElement('canvas');
out.width = W;
out.height = H;
const ctx = out.getContext('2d');

// ---- the clock -----------------------------------------------------------------------------------------------

// The game's own loop is put to sleep; time moves only when the recorder steps it. Date.now follows the same clock.
function takeClock(g) {
  game = g;
  game.loop.sleep();
  t = performance.now();
  const base = Date.now();
  let passed = 0;
  Date.now = () => base + passed;
  stepGame = () => {
    t += STEP_MS;
    passed += STEP_MS;
    game.step(t, STEP_MS);
  };
}
let stepGame = () => {};

// Lets the browser handle loading and other events between steps, without timers (which a hidden page slows down).
const channel = new MessageChannel();
const yieldToBrowser = () =>
  new Promise((resolve) => {
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(0);
  });

// One video frame: the game moves on, then the picture is saved (when a clip is being recorded).
async function frame() {
  for (let i = 0; i < STEPS_PER_FRAME; i++) stepGame();
  animateCursor();
  if (!clip) return yieldToBrowser();
  ctx.drawImage(game.canvas, 0, 0, W, H);
  drawField();
  drawCursor();
  // toDataURL, not toBlob: the browser can hold toBlob's result back for a second in a tab it thinks is in the
  // background, while toDataURL always takes a few milliseconds. The server decodes the base64.
  const jpeg = out.toDataURL('image/jpeg', JPEG_QUALITY);
  await fetch(`/frame?clip=${clip}&i=${index++}`, { method: 'POST', body: jpeg.slice(jpeg.indexOf(',') + 1) });
  state.frames = index;
  state.total++;
}

async function hold(seconds) {
  const n = Math.round(seconds * FPS);
  for (let i = 0; i < n; i++) await frame();
}

async function until(test, what, maxSeconds = 120) {
  for (let i = 0; i < maxSeconds * FPS; i++) {
    if (test()) return;
    await frame();
  }
  throw new Error(`Waited ${maxSeconds} s for ${what}`);
}

// ---- finding things on screen ----------------------------------------------------------------------------------

const scene = () => game.scene.getScenes(true)[0];
const sceneIs = (key) => scene()?.scene.key === key && !scene().leaving;

function shown(o) {
  for (let p = o; p; p = p.parentContainer) if (!p.visible || p.alpha < 0.5) return false;
  return o.active !== false;
}

function all(list = scene().children.list, found = []) {
  for (const o of list) {
    found.push(o);
    if (o.list) all(o.list, found);
  }
  return found;
}

// A button on screen by its label, ready to press.
const button = (label) => all().find((o) => o.label?.text === label && o.enabled !== false && shown(o));

async function buttonReady(label, maxSeconds = 60) {
  await until(() => button(label), `the ${label} button`, maxSeconds);
  return button(label);
}

// From the game's stage (1280 × 720, wider on wide screens) to the video picture.
function toVideo(x, y) {
  const { left, right } = scene().viewBounds();
  return { x: ((x - left) * W) / (right - left), y: (y * H) / 720 };
}

function centre(o) {
  const b = o.getBounds();
  return { x: b.centerX, y: b.centerY };
}

// ---- the finger dot ------------------------------------------------------------------------------------------

const cursor = { x: W * 0.62, y: H * 0.8, alpha: 0, show: false, down: 0, pressed: false, ripples: [], idle: 0 };

function animateCursor() {
  cursor.alpha += ((cursor.show ? 1 : 0) - cursor.alpha) * 0.25;
  cursor.down += ((cursor.pressed ? 1 : 0) - cursor.down) * 0.35;
  cursor.ripples = cursor.ripples.filter((r) => (r.age += 1 / FPS) < 0.45);
  // The dot fades away when nothing has been touched for a while.
  if (!cursor.pressed) cursor.idle += 1 / FPS;
  if (cursor.idle > 1.2) cursor.show = false;
}

function drawCursor() {
  for (const r of cursor.ripples) {
    const k = r.age / 0.45;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 30 + 50 * k, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(247, 119, 0, ${0.6 * (1 - k)})`;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  if (cursor.alpha < 0.02) return;
  const r = 30 - 6 * cursor.down;
  ctx.beginPath();
  ctx.arc(cursor.x, cursor.y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${(0.55 + 0.25 * cursor.down) * cursor.alpha})`;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = `rgba(247, 119, 0, ${cursor.alpha})`;
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(255, 255, 255, ${cursor.alpha})`;
  ctx.beginPath();
  ctx.arc(cursor.x, cursor.y, r + 4, 0, Math.PI * 2);
  ctx.stroke();
}

const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

async function moveTo(p, seconds = 0.5) {
  const from = { x: cursor.x, y: cursor.y };
  cursor.show = true;
  cursor.idle = 0;
  const n = Math.max(1, Math.round(seconds * FPS));
  for (let i = 1; i <= n; i++) {
    const k = ease(i / n);
    cursor.x = from.x + (p.x - from.x) * k;
    cursor.y = from.y + (p.y - from.y) * k;
    cursor.idle = 0;
    await frame();
  }
}

function press() {
  cursor.pressed = true;
  cursor.idle = 0;
  cursor.ripples.push({ x: cursor.x, y: cursor.y, age: 0 });
}

function release() {
  cursor.pressed = false;
  cursor.idle = 0;
}

// Moves to a button, taps it, and lets the tap show.
async function tap(target, after = 0.3) {
  const b = typeof target === 'string' ? await buttonReady(target) : target;
  const c = centre(b);
  await moveTo(toVideo(c.x, c.y));
  await hold(0.1);
  press();
  b.onClick?.(b);
  await hold(0.15);
  release();
  await hold(after);
}

// Picks up a draggable thing, carries it to (x, y) on the stage, and lets go there.
async function drag(item, to, seconds = 0.8) {
  const from = centre(item);
  await moveTo(toVideo(from.x, from.y));
  press();
  await hold(0.15);
  const start = { x: item.x, y: item.y };
  const n = Math.round(seconds * FPS);
  for (let i = 1; i <= n; i++) {
    const k = ease(i / n);
    item.x = start.x + (to.x - from.x) * k;
    item.y = start.y + (to.y - from.y) * k;
    const p = toVideo(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k);
    cursor.x = p.x;
    cursor.y = p.y;
    cursor.idle = 0;
    await frame();
  }
  release();
  item.onClick?.(item);
  await hold(0.2);
}

// Holds a press-and-hold button until done() says so.
async function holdButton(label, done, maxSeconds = 30) {
  const b = await buttonReady(label);
  const c = centre(b);
  await moveTo(toVideo(c.x, c.y));
  press();
  b.onHoldStart?.();
  await until(() => {
    cursor.idle = 0;
    return done();
  }, `${label} to finish`, maxSeconds);
  b.onHoldEnd?.();
  release();
}

// Paati's speech bubble on this screen, and what it says.
const bubbleText = () => scene().bubble?.body?.text ?? '';

// ---- the name box (a real text box over the game, so the canvas doesn't have it: it is drawn in) --------------

function drawField() {
  const s = scene();
  const el = s?.field?.el;
  if (!el || el.style.visibility === 'hidden' || !el.isConnected) return;
  const k = W / game.canvas.getBoundingClientRect().width;
  const x = parseFloat(el.style.left) * k;
  const y = parseFloat(el.style.top) * k;
  const w = parseFloat(el.style.width) * k;
  const h = parseFloat(el.style.height) * k;
  const size = parseFloat(el.style.fontSize) * k;
  const focused = document.activeElement === el;
  ctx.save();
  if (focused) {
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, w + 8, h + 8, 18 * k * 1.1);
    ctx.fillStyle = 'rgba(78, 97, 246, 0.25)';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * k);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 2 * k;
  ctx.strokeStyle = focused ? '#4e61f6' : '#c9ccd6';
  ctx.stroke();
  ctx.font = `${el.value ? 600 : 500} ${size}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = el.value ? '#131927' : '#8a8f9c';
  const tx = x + size * 0.6;
  ctx.fillText(el.value || el.placeholder, tx, y + h / 2);
  // A blinking caret after the text while typing.
  if (focused && Math.floor(t / 530) % 2 === 0) {
    const cx = tx + (el.value ? ctx.measureText(el.value).width + 2 : 0);
    ctx.fillStyle = '#d96500';
    ctx.fillRect(cx, y + h * 0.25, 2.5 * k, h * 0.5);
  }
  ctx.restore();
}

// ---- the parts of the game -------------------------------------------------------------------------------------

async function title() {
  // The greeting pops up, then the name, Play and the icons come in; then a full loop of Paati's vanakkam.
  await until(() => button('Play') && button('Play').input?.enabled, 'Play to appear', 20);
  await hold(6);
  await tap('Play');
}

async function welcome() {
  await until(() => sceneIs('Story'), 'the Welcome page');
  await hold(0.6);
  const s = scene();
  for (;;) {
    if (s.field) {
      // Paati asks for a name: type it, then That's me.
      await hold(read(bubbleText()) - 0.8);
      const el = s.field.el;
      el.focus();
      for (const ch of PLAYER_NAME) {
        el.value += ch;
        await hold(0.14);
      }
      await hold(0.8);
      await tap(s.next);
      await hold(0.4);
      continue;
    }
    await hold(read(bubbleText()));
    const last = s.index === s.lines.length - 1;
    await tap(s.next);
    if (last) return;
  }
}

async function beforeWeBegin() {
  await until(() => sceneIs('Intro'), 'Before we begin');
  // The words come in one at a time; Start appears at the end.
  await until(() => button('Start Chapter 1')?.input?.enabled && button('Start Chapter 1').alpha > 0.99, 'Start Chapter 1', 40);
  await hold(2.5);
  await tap('Start Chapter 1');
}

// A story page: each line read, then Next (the last button says where it goes).
async function story() {
  await until(() => sceneIs('Story'), 'a story page');
  await hold(0.6);
  const s = scene();
  for (;;) {
    await hold(read(bubbleText()));
    const last = s.index === s.lines.length - 1;
    await tap(s.next);
    if (last) return;
  }
}

async function quiz(chapter) {
  await until(() => sceneIs('Quiz'), 'the quiz');
  const s = scene();
  for (;;) {
    await hold(0.6);
    const q = s.questions[s.index];
    await hold(read(q.q) * 0.8);
    const type = q.type ?? 'choice';
    if (type === 'order') {
      for (let k = 0; k < q.items.length; k++) {
        const b = s.answers.find((a) => a.orderIndex === k);
        await tap(b, 0.5);
      }
    } else {
      if (WRONG_FIRST[chapter]?.includes(s.index)) {
        const wrong = q.choices.findIndex((c) => !c.correct);
        await tap(s.answers[wrong], 0.3);
        await hold(read(bubbleText()));
      }
      await tap(s.answers[q.choices.findIndex((c) => c.correct)], 0.3);
    }
    // Paati's explanation, and the ingredient flying to the Store.
    await hold(Math.max(read(bubbleText()), 3));
    const last = s.index === s.questions.length - 1;
    await tap(s.next);
    if (last) return;
  }
}

async function storiesOfDeepavali() {
  await until(() => sceneIs('Puppet'), 'Stories of Deepavali');
  // Paati says what the stories mean; the cards follow on their own.
  await until(() => scene().cards?.length && shown(scene().cards[0]) && scene().cards[0].alpha > 0.99, 'the story cards', 40);
  await hold(2);
  const s = scene();
  const card = s.cards.find((c) => c.story === STORY_TO_WATCH) ?? s.cards[1];
  await tap(card, 0.2);
  // The story plays scene by scene; then Paati says why it matters, and the cards come back.
  await until(() => !s.story && s.cards?.length && shown(s.cards[0]) && s.cards[0].alpha > 0.99 && button('Next'), 'the story to end', 240);
  await hold(2);
  await tap('Next');
}

async function store({ peek }) {
  await until(() => sceneIs('Store'), 'the Store');
  await hold(4);
  if (peek) {
    // Tap an ingredient to hear what it does: the shelf button just above its name.
    const name = all().find((o) => o.text === peek && shown(o));
    const nx = name ? name.getBounds().centerX : 0;
    const item = name && all().find((o) => o.onClick && !o.label && shown(o) && Math.abs(centre(o).x - nx) < 120 && centre(o).y < name.y);
    if (item) {
      await tap(item, 0.2);
      await hold(3);
    }
  }
  const go = button('Start cooking') ? 'Start cooking' : 'Continue';
  await tap(go);
}

// Paati's question at the start of a kitchen step: answered right, her tip read, Continue.
async function kitchenQuestion(step) {
  const q = COOK_QUESTIONS[step];
  const right = q.choices.find((c) => c.correct).text;
  await buttonReady(right, 20);
  await hold(read(q.q));
  await tap(right, 0.3);
  await hold(read(bubbleText()) + 1.5);
  await tap('Continue', 0.5);
}

// Round and round the bowl, the way a finger would, until done() says the ring is full.
async function circleBowl(done) {
  const s = scene();
  const E = { x: 830, y: 455 - 34 + 30 * 0.95, rx: 152 + 26, ry: 130 * 0.95 + 14 };
  const at = (a) => ({ x: E.x + E.rx * 0.85 * Math.cos(a), y: E.y + E.ry * 0.85 * Math.sin(a) });
  let a = -Math.PI / 2;
  const p0 = at(a);
  await moveTo(toVideo(p0.x, p0.y));
  press();
  s.pointerDown(p0);
  const perFrame = (Math.PI * 2) / (1.1 * FPS); // a circle every 1.1 seconds
  while (!done()) {
    a += perFrame;
    const p = at(a);
    s.pointerMove(p);
    const v = toVideo(p.x, p.y);
    cursor.x = v.x;
    cursor.y = v.y;
    cursor.idle = 0;
    await frame();
  }
  s.pointerUp();
  release();
}

async function kitchen() {
  await until(() => sceneIs('Cook'), 'the kitchen');
  const s = scene();
  const BOWL = { x: 830, y: 455 };

  // 1 · Add: Paati's question, then each ingredient dragged into the bowl in her order.
  await kitchenQuestion('add');
  await hold(read(bubbleText()) * 0.6);
  for (const id of ADD_ORDER) {
    const token = s.stepObjs.find((o) => o.ing?.id === id);
    await drag(token, { x: BOWL.x, y: BOWL.y - 60 });
    await hold(1.4);
  }
  await hold(read(COOK_LINES.allIn[0]) * 0.7);
  await tap('Next step', 0.5);

  // 2 · Mix: swirl the flours, spices and ghee into one colour.
  await hold(read(bubbleText()) * 0.6);
  await circleBowl(() => s.mix.mixed >= 1);
  await hold(read(bubbleText()));
  await tap('Next step', 0.5);

  // 3 · Water: hold to pour, let go in the green.
  await kitchenQuestion('water');
  await hold(1.5);
  const middle = (WATER_ZONE[0] + WATER_ZONE[1]) / 2;
  await holdButton('Hold to pour', () => s.cook.water >= middle);
  await hold(read(bubbleText()));
  await tap('Done pouring', 0.5);

  // 4 · Knead: rub in circles until the ring is full.
  await kitchenQuestion('knead');
  await hold(1.2);
  await circleBowl(() => s.mix.kneaded >= 1);
  await hold(read(bubbleText()));
  await tap('Next step', 0.5);

  // 5 · Fill the press: dough in, plunger on, then the plates (the wrong one first, to show Paati's nudge).
  await hold(read(bubbleText()) * 0.6);
  const PRESS = { x: 960, y: 400, width: 300 };
  const k = PRESS.width / 270;
  const at = (sx, sy) => ({ x: PRESS.x - PRESS.width / 2 + sx * k, y: PRESS.y - (300 * k) / 2 + sy * k });
  const draggable = (name) => all().find((o) => o.dragMode && o.enabled && o.list?.some((c) => c.text === name) && shown(o));
  await until(() => draggable('Dough'), 'the dough');
  await drag(draggable('Dough'), at(130, 156));
  await until(() => draggable('Plunger'), 'the plunger', 10);
  await hold(read(bubbleText()) * 0.7);
  await drag(draggable('Plunger'), at(130, 124));
  await until(() => draggable('Star'), 'the plates', 10);
  await hold(read(bubbleText()) * 0.7);
  await drag(draggable('Round'), at(130, 236));
  await hold(read(bubbleText()));
  await drag(draggable('Star'), at(130, 236));
  await hold(read(bubbleText()));
  await tap('Next step', 0.5);

  // 6 · Twist: hold the button, and the spiral grows from the middle.
  await kitchenQuestion('twist');
  await hold(read(bubbleText()) * 0.6);
  await holdButton('Hold to twist', () => !s.autoTwist && s.samples?.length > 20, 40);
  await hold(read(bubbleText()));
  await tap('Done twisting', 0.5);

  // 7 · Fry: flip when golden underneath, lift out when golden all over.
  await kitchenQuestion('fry');
  await until(() => bubbleText().includes('Flip it now'), 'golden underneath', 60);
  await hold(1.2);
  await tap('Flip', 0.3);
  await until(() => bubbleText().includes('Lift it out now'), 'golden all over', 60);
  await hold(1.2);
  await tap(s.nextBtn, 0.3);
}

async function result() {
  await until(() => sceneIs('Result'), 'the result');
  await hold(8);
  await tap('Next');
}

async function taste() {
  await until(() => sceneIs('Finale'), 'the taste');
  await hold(2.5);
  await tap('Offer to Paati', 0.2);
  // The bite, the happy dab of the eyes, then her thanks and Next.
  await buttonReady('Next', 30);
  await hold(read(bubbleText()) + 0.5);
  await tap('Next');
}

async function whatNext() {
  await until(() => sceneIs('Finale') && button('Finish'), 'the last page');
  await hold(6);
  await tap('Finish');
}

async function goodbye() {
  await until(() => sceneIs('Finale') && button('Play again'), 'the goodbye', 20);
  await hold(7);
}

// ---- running it ------------------------------------------------------------------------------------------------

async function startClip(name) {
  clip = name;
  index = 0;
  state.clip = name;
  state.frames = 0;
  await fetch(`/clear?clip=${name}`, { method: 'POST' });
}

// Records the whole game, clip by clip. Call it as soon as the game exists, before the Title shows (record.html
// does), so the Title's greeting is recorded from its start.
export async function record(g) {
  state.startedAt = Date.now();
  try {
    // A fresh player: default settings, the chosen questions.
    settings.reduceMotion = false;
    settings.textScale = 1;
    progress.quizPick = { ...PICKS };
    await until(() => g.isRunning, 'the game to start', 60);
    takeClock(g);
    // Load everything (not recorded), then record from the Title's very first frame.
    for (let i = 0; i < 60 * FPS && !game.scene.isActive('Title'); i++) await frame();
    for (const [name, run] of PLAN) {
      await startClip(name);
      await run();
    }
    await hold(0.5);
    clip = null;
    state.done = true;
  } catch (error) {
    state.error = `${state.clip}: ${error.message}`;
    console.error(error);
  }
}
