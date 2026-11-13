import { TYPE, TEXT_BASE_SCALE, COLOR, COMPACT, RES, css, textBoost } from '../theme.js';
import { settings } from '../state.js';

export const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const BUTTON_FONT = 'Poppins, Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// The size of a type role in stage px, at the player's text size (or at `scale`: 1 is the default size). Phones start
// from much bigger text, so the A+ and A++ steps add less there (A++ comes to about the size it was before
// 2026-11-13), and the screens still fit.
export function fontSize(role, scale = settings.textScale) {
  const k = COMPACT ? 1 + (scale - 1) * 0.4 : scale;
  return Math.round(TYPE[role].size * TEXT_BASE_SCALE * textBoost(role) * k);
}

// Bigger text, as big as fits: a text set larger than the default (Settings → Text size) steps down a pixel at a
// time until it is no taller than maxH, but never below the default size. Returns the text.
export function fitText(text, role, maxH) {
  let size = fontSize(role);
  const floor = fontSize(role, 1);
  text.setFontSize(size);
  while (text.height > maxH && size > floor) text.setFontSize(--size);
  return text;
}

// Text in one of the brief's type roles (h1…b3). opts: dark, color, weight, width (wraps), align, origin.
export function makeText(scene, x, y, str, role = 'b1', opts = {}) {
  const t = TYPE[role];
  const size = fontSize(role);
  const color = opts.color ?? (opts.dark ? COLOR.white : COLOR.grey900);
  const style = {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: String(opts.weight ?? t.weight),
    color: css(color),
    align: opts.align ?? 'left',
    lineSpacing: Math.max(0, Math.round(size * (t.line / t.size - 1.2))),
    resolution: RES,
  };
  if (opts.width) style.wordWrap = { width: opts.width };
  const obj = scene.add.text(x, y, str, style);
  if (opts.origin !== undefined) {
    if (Array.isArray(opts.origin)) obj.setOrigin(...opts.origin);
    else obj.setOrigin(opts.origin);
  }
  return obj;
}
