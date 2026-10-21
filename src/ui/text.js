import { TYPE, TEXT_BASE_SCALE, COLOR, RES, css, textBoost } from '../theme.js';
import { settings } from '../state.js';

export const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const BUTTON_FONT = 'Poppins, Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function fontSize(role) {
  return Math.round(TYPE[role].size * TEXT_BASE_SCALE * textBoost(role) * settings.textScale);
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
