// Design tokens from docs/design-brief.md → "Look and design system".

export const STAGE = { width: 1280, height: 720 };

// How large the 1280×720 stage shows on this screen. Measured in landscape, so turning a phone doesn't change it.
const LONG = Math.max(window.innerWidth, window.innerHeight) || STAGE.width;
const SHORT = Math.min(window.innerWidth, window.innerHeight) || STAGE.height;
export const FIT = Math.min(LONG / STAGE.width, SHORT / STAGE.height);

// Render resolution: draw the stage at the size it appears on screen in device pixels (capped at 2.5×), so it is
// sharp on big monitors and doesn't waste memory on phones. BaseScene zooms the camera to match.
export const RES = Math.min(2.5, Math.max(1, Math.ceil((window.devicePixelRatio || 1) * FIT * 2) / 2));

// Phones show the stage at about half size, so small text and buttons grow there to stay readable and tappable.
export const COMPACT = FIT < 0.65;

// The stage is designed at 1280×720. On wider screens (most phones held sideways) the view grows wider, up to 2.4:1,
// so the scene fills the screen edge to edge: content stays in the middle 1280 and the extra width shows more
// background and decoration. BLEED is how far backgrounds reach past the stage edges to cover that.
export const MAX_ASPECT = 2.4;
export const BLEED = 260;
export function viewWidth() {
  const w = window.innerWidth || STAGE.width;
  const h = window.innerHeight || STAGE.height;
  const aspect = Math.max(w, h) / Math.min(w, h);
  return Math.round(STAGE.height * Math.min(MAX_ASPECT, Math.max(16 / 9, aspect)));
}
export const pick = (normal, compact) => (COMPACT ? compact : normal);

export const COLOR = {
  indigo900: 0x212967, // night backgrounds
  indigo800: 0x2b3587,
  primary500: 0x4e61f6, // secondary actions, links, focus ring on light
  primary700: 0x3745af,
  marigold500: 0xf77700, // the one main action
  // Filled buttons are a deeper marigold, so their off-white labels pass 3:1 contrast for large text in every
  // state (normal 3.5:1, hover 3.3:1, pressed 4.4:1).
  buttonFill: 0xd96500,
  buttonHover: 0xe06a00,
  buttonPress: 0xc25700,
  yellow500: 0xffaa00, // lamp glow, stars, highlights
  yellow300: 0xffc654, // focus ring on dark
  yellow50: 0xfff7e6, // paper and kitchen backgrounds
  offWhite: 0xfffbf5, // festive screens (Title, Welcome, chapter 1, Finale)
  rani500: 0xd6246e, // celebration and kolam accents
  raniWash: 0xfbe6ef, // chapter 4 background (light tint)
  green600: 0x3da755, // correct answers, banana leaf
  green700: 0x308242,
  info600: 0x0088e8, // hints
  warning600: 0xe89b00, // gentle correction (never red)
  grey900: 0x131927, // text on light
  grey600: 0x5a6070,
  grey300: 0xc9ccd6,
  grey100: 0xf1f2f5,
  white: 0xffffff,
  kitchen: 0xfbeed6, // warm kitchen cream
  wood: 0x8b3a22, // press base and lever
  woodDark: 0x6a2a17,
  paleWood: 0xe3c9a0, // plunger
};

export const css = (n) => '#' + n.toString(16).padStart(6, '0');
export const rgb = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];

export function lerpColor(a, b, t) {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const k = Math.min(1, Math.max(0, t));
  return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
}

// Type scale from the design system: size / line height in px.
export const TYPE = {
  h1: { size: 48, line: 58, weight: 600 },
  h2: { size: 40, line: 48, weight: 600 },
  h3: { size: 32, line: 38, weight: 600 },
  h4: { size: 28, line: 34, weight: 600 },
  h5: { size: 24, line: 28, weight: 600 },
  s1: { size: 18, line: 28, weight: 500 },
  b1: { size: 16, line: 24, weight: 400 },
  b3: { size: 14, line: 20, weight: 400 },
};

// The 1280×720 stage shrinks to fit phones, so sizes start 25% above the brief's scale.
// Settings → Text size multiplies on top of this.
export const TEXT_BASE_SCALE = 1.25;

// Extra growth per type role on phones (COMPACT): small text grows most, headings barely.
const COMPACT_TEXT = { h1: 1, h2: 1, h3: 1.05, h4: 1.1, h5: 1.15, s1: 1.25, b1: 1.3, b3: 1.35 };
export const textBoost = (role) => (COMPACT ? COMPACT_TEXT[role] : 1);

export const RADIUS = { button: 12, card: 24 };

// Button heights in stage pixels. The brief's Giant 56 / Large 48 are scaled up for the same reason as text.
// On phones every button's touch area is at least MIN_HIT, which shows as about 46 px.
export const BUTTON_HEIGHT = COMPACT ? { giant: 84, large: 76, medium: 64, icon: 72 } : { giant: 72, large: 64, medium: 52, icon: 60 };
export const MIN_HIT = COMPACT ? 88 : 0;

// Mood by chapter (brief → "Mood by chapter"). Changed on 2026-10-20: the brief's night-indigo screens are now
// off-white with bright Deepavali colour around them, and indigo stays as an accent.
export const MOOD = {
  festive: { bg: COLOR.offWhite, dark: false, band: COLOR.marigold500 },
  ch1: { bg: COLOR.offWhite, dark: false, band: COLOR.rani500 },
  ch2: { bg: COLOR.yellow50, dark: false, band: COLOR.marigold500 },
  kitchen: { bg: COLOR.kitchen, dark: false, band: COLOR.marigold500 },
  ch4: { bg: COLOR.raniWash, dark: false, band: COLOR.rani500 },
};
