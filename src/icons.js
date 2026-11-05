const paths = {
  drag: 'M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01',
  collapse: 'm6 9 6 6 6-6',
  expand: 'm6 15 6-6 6 6',
  pickup: 'M8 13V6a2 2 0 0 1 4 0v6m0-4a2 2 0 0 1 4 0v4m0-2a2 2 0 0 1 4 0v5l-4 5H9l-6-8a2 2 0 0 1 3-2l2 2',
  inspect: 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm6-2 6 6M6 10h8m-4-4v8',
  down: 'M3 18h18M5 18v3m14-3v3M7 6h10l3 8H4l3-8zm1 3v3m-1-1h2m6-1h.01m2 1h.01',
  back: 'm9 4-6 6 6 6M3 10h10a7 7 0 0 1 7 7v3',
  lamp: 'M9 18h6m-5 3h4M8 14c-5-5-2-12 4-12s9 7 4 12l-1 2H9z',
  room: 'M12 2v3M6 5h12l3 6H3zM6 16l-2 3m8-3v5m6-5 2 3',
  cartridge: 'M3 7h3V4h12v3h3v13H3V7zm4 3h10v6H7v-6zm0 10v-2m3 2v-2m4 2v-2m3 2v-2',
  fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5',
  screen: 'M3 4h18v16H3V4zm4 6V8h3m4 0h3v2M7 14v2h3m4 0h3v-2',
  close: 'm6 6 12 12M18 6 6 18',
  speed: 'm3 5 8 7-8 7V5zm10 0 8 7-8 7V5z',
  keys: 'M3 5h18v14H3V5zm4 4h.01M11 9h.01M15 9h.01M18 9h.01M7 13h.01M11 13h.01M15 13h.01M8 16h8',
  autosave: 'M20 8a8 8 0 1 0 0 8M20 3v5h-5M9 12l2 2 4-4',
  save: 'M4 3h13l4 4v14H3V3zm4 0v6h8V3M7 21v-7h10v7',
  load: 'M3 10a9 9 0 1 1 1 8M3 4v6h6M12 7v5l3 2',
  slots: 'M4 3h16v4H4V3zm0 7h16v4H4v-4zm0 7h16v4H4v-4z',
  restart: 'M12 2v8M7 4a8 8 0 1 0 12 3M19 3v4h-4',
};

export function icon(button, name, label, badge = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', paths[name]);
  svg.append(path);
  button.replaceChildren(svg);
  button.setAttribute('aria-label', label);
  button.title = label;
  button.dataset.tooltip = label;
  if (badge) {
    const value = document.createElement('span');
    value.className = 'icon-badge';
    value.textContent = badge;
    value.setAttribute('aria-hidden', 'true');
    button.append(value);
  }
}
