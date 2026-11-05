export function bindKeyboard(target, { enabled, getBindings, onInput, onMenu, blockUnmapped = false }) {
  const held = new Map();
  function release() {
    for (const [code, action] of held) onInput(action, false, code);
    held.clear();
  }
  function change(event) {
    if (event.defaultPrevented) return;
    if (event.type === 'keyup' && held.has(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      onInput(held.get(event.code), false, event.code);
      held.delete(event.code);
      return;
    }
    if (event.code === 'Escape' && event.type === 'keydown' && !event.repeat && onMenu()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      release();
      return;
    }
    if (!enabled(event) || event.ctrlKey || event.altKey || event.metaKey || event.code === 'Tab') return;
    const action = Object.keys(getBindings()).find((id) => getBindings()[id] === event.code);
    if (!action) {
      if (blockUnmapped) event.stopImmediatePropagation();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === 'keydown' && !event.repeat && !held.has(event.code)) {
      held.set(event.code, action);
      onInput(action, true, event.code);
    }
  }
  target.addEventListener('keydown', change, true);
  target.addEventListener('keyup', change, true);
  target.addEventListener('blur', release);
  return { release };
}
