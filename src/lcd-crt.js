const effects = new WeakMap();

export function drawLcdCrt(context, rows = 160) {
  const { canvas } = context;
  const { width, height } = canvas;
  let effect = effects.get(canvas);
  if (!effect || effect.width !== width || effect.height !== height || effect.rows !== rows) {
    const tile = document.createElement('canvas');
    tile.width = 3;
    tile.height = Math.max(2, Math.round(height / rows));
    const mask = tile.getContext('2d');
    if (!mask) throw new Error('The built-in CRT screen requires a 2D canvas.');
    for (const [x, color] of ['#fff7f7', '#f7fff7', '#f7f7ff'].entries()) {
      mask.fillStyle = color;
      mask.fillRect(x, 0, 1, tile.height);
    }
    mask.fillStyle = '#0003';
    mask.fillRect(0, tile.height - 1, tile.width, 1);
    const pattern = context.createPattern(tile, 'repeat');
    if (!pattern) throw new Error('The built-in CRT screen mask could not be created.');
    const vignette = context.createRadialGradient(width / 2, height / 2, height * .2,
      width / 2, height / 2, Math.hypot(width / 2, height / 2));
    vignette.addColorStop(0, '#0000');
    vignette.addColorStop(.6, '#0000');
    vignette.addColorStop(1, '#0003');
    effect = { width, height, rows, pattern, vignette };
    effects.set(canvas, effect);
  }
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = effect.pattern;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = effect.vignette;
  context.fillRect(0, 0, width, height);
  context.restore();
}
