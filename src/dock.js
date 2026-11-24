import { icon } from './icons.js';

export function bindDock(dock, label, beforeChange = () => {}) {
  const container = document.getElementById('player');
  const handle = dock.querySelector('[data-dock-handle]');
  const toggle = dock.querySelector('[data-dock-toggle]');
  const actions = dock.querySelector('[data-dock-actions]');
  let position = null;
  let drag = null;

  function positionDock(x, y) {
    const bounds = container.getBoundingClientRect();
    const margin = Math.min(8, Math.max(0, (bounds.width - dock.offsetWidth) / 2));
    const verticalMargin = Math.min(8, Math.max(0, (bounds.height - dock.offsetHeight) / 2));
    position = {
      x: Math.max(margin, Math.min(bounds.width - dock.offsetWidth - margin, x)),
      y: Math.max(verticalMargin, Math.min(bounds.height - dock.offsetHeight - verticalMargin, y)),
    };
    dock.dataset.moved = '';
    dock.style.setProperty('--dock-x', `${position.x}px`);
    dock.style.setProperty('--dock-y', `${position.y}px`);
  }

  function finishDrag(event) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const { id } = drag;
    drag = null;
    delete dock.dataset.dragging;
    if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id);
  }

  function reset() {
    finishDrag();
    position = null;
    delete dock.dataset.moved;
  }

  function cancelDrag() {
    if (!drag) return false;
    const previous = drag.previous;
    reset();
    if (previous) positionDock(previous.x, previous.y);
    return true;
  }

  function closePopovers() {
    beforeChange();
    for (const button of actions.querySelectorAll('[popovertarget]')) {
      const popover = document.getElementById(button.getAttribute('popovertarget'));
      if (popover.matches(':popover-open')) popover.hidePopover();
    }
  }

  function fit() {
    finishDrag();
    if (position) positionDock(position.x, position.y);
  }

  function setCollapsed(collapsed) {
    finishDrag();
    closePopovers();
    actions.hidden = collapsed;
    dock.toggleAttribute('data-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    icon(toggle, collapsed ? 'expand' : 'collapse', `${collapsed ? 'Expand' : 'Collapse'} ${label}`);
    fit();
  }

  icon(handle, 'drag', `Move ${label}`);
  setCollapsed(actions.hidden);
  toggle.addEventListener('click', () => setCollapsed(!actions.hidden));
  handle.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    event.preventDefault();
    closePopovers();
    const box = dock.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY,
      left: box.left - bounds.left, top: box.top - bounds.top, previous: position };
    dock.dataset.dragging = '';
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    positionDock(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) handle.addEventListener(name, finishDrag);
  handle.addEventListener('keydown', (event) => {
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!directions[event.code] && event.code !== 'Home') return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    event.stopPropagation();
    closePopovers();
    if (event.code === 'Home') reset();
    else {
      finishDrag();
      const box = dock.getBoundingClientRect();
      const bounds = container.getBoundingClientRect();
      const [x, y] = directions[event.code];
      const step = event.shiftKey ? 40 : 10;
      positionDock(box.left - bounds.left + x * step, box.top - bounds.top + y * step);
    }
  });
  new ResizeObserver(fit).observe(dock);
  window.addEventListener('resize', fit);
  window.addEventListener('blur', () => finishDrag());
  document.addEventListener('fullscreenchange', fit);
  return { setCollapsed, cancelDrag };
}
