import { STAGE } from '../theme.js';

// A real text field laid over the canvas, lined up with a box on the stage (x, y = top left, w, h, in stage units)
// wherever the canvas is on screen and however large it is, so phones bring up their own keyboard. While typing,
// Space and Enter belong to the field, not to the game's buttons: Enter calls onEnter, Tab moves on to `next`. It
// hides while the Help sheet is open and goes when the screen closes. In the keyboard focus order it comes first, or
// just before `before` when that is given. Returns { el, remove }.
export function textField(scene, { x, y, w, h, font = 28, maxLength = 24, placeholder = '', label = placeholder, onEnter, next, before }) {
  const el = document.createElement('input');
  el.type = 'text';
  el.className = 'text-field';
  el.maxLength = maxLength;
  el.placeholder = placeholder;
  el.setAttribute('aria-label', label);
  el.autocomplete = 'off';
  el.spellcheck = false;
  el.enterKeyHint = 'done';
  const kb = scene.input.keyboard;
  el.addEventListener('focus', () => kb.disableGlobalCapture());
  el.addEventListener('blur', () => kb.enableGlobalCapture());
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.();
    } else if (e.key === 'Escape') {
      el.blur();
    } else if (e.key === 'Tab') {
      // Tab and Shift+Tab carry on through the game's own focus order, from the field's place in it.
      e.preventDefault();
      el.blur();
      if (next && !e.shiftKey) return scene.focus.focus(next);
      scene.focus.current = proxy;
      scene.focus.move(e.shiftKey ? -1 : 1);
    }
  });
  // Inside #game, so it still shows in full screen.
  (document.getElementById('game') ?? document.body).appendChild(el);

  const place = () => {
    const canvas = scene.game.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { left } = scene.viewBounds();
    const k = rect.height / STAGE.height;
    // Phones zoom into fields with text under 16 px, so never go smaller than that.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    Object.assign(el.style, {
      left: `${rect.left + (x - left) * k}px`,
      top: `${rect.top + y * k}px`,
      width: `${w * k}px`,
      height: `${h * k}px`,
      fontSize: `${coarse ? Math.max(16, font * k) : font * k}px`,
    });
  };
  place();
  const onResize = () => requestAnimationFrame(place);
  window.addEventListener('resize', onResize);
  scene.events.on('view-resize', place);
  const hide = () => (el.style.visibility = 'hidden');
  const show = () => (el.style.visibility = 'visible');
  scene.events.on('settings-opened', hide);
  scene.events.on('settings-closed', show);

  // In the keyboard focus order: a stand-in that puts the cursor in the field.
  const proxy = scene.add.zone(0, 0, 1, 1);
  proxy.enabled = true;
  proxy.setFocused = (on) => on && scene.focus.visible && el.focus();
  proxy.keyPress = () => {};
  const order = scene.focus.items;
  const at = before ? order.indexOf(before) : -1;
  order.splice(Math.max(0, at), 0, proxy);
  proxy.once('destroy', () => scene.focus.remove(proxy));

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    window.removeEventListener('resize', onResize);
    scene.events.off('view-resize', place);
    scene.events.off('settings-opened', hide);
    scene.events.off('settings-closed', show);
    scene.events.off('shutdown', remove);
    el.blur();
    el.remove();
    if (proxy.scene) proxy.destroy();
    kb.enableGlobalCapture();
  };
  scene.events.once('shutdown', remove);
  return { el, remove };
}
