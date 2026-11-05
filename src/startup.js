import { brandImage, starImage, orbitImage, glowImage, loadBrand } from './brand.js';

export const STARTUP_DURATION = 3200;

export function drawStartup(canvas, elapsed, reducedMotion = false) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The startup screen requires a 2D canvas.');
  const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, elapsed / 1000));
  const settle = 1 - (1 - progress) ** 3;
  const time = reducedMotion ? 2.4 : elapsed / 1000;
  context.save();
  context.setTransform(canvas.width / 240, 0, 0, canvas.height / 160, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = '#100a20';
  context.fillRect(0, 0, 240, 160);
  context.save();
  const glow = context.createRadialGradient(120, 77, 5, 120, 77, 125);
  glow.addColorStop(0, '#7735ac80');
  glow.addColorStop(1, '#100a2000');
  context.fillStyle = glow;
  context.fillRect(0, 0, 240, 160);
  for (let i = 0; i < 38; i++) {
    const x = (i * 73 + 19) % 240, y = (i * 47 + 11) % 160;
    context.globalAlpha = .15 + (Math.sin(i + time * 1.8) + 1) * .22;
    context.fillStyle = i % 3 ? '#dac8ff' : '#ffc99d';
    context.fillRect(x, y, 1, 1);
  }
  context.globalAlpha = progress;
  context.globalAlpha = progress * .65;
  context.drawImage(orbitImage, 7, 37, 226, 82);
  context.globalAlpha = progress;
  const orbit = (front) => {
    for (let index = 0; index < 3; index++) {
      const angle = time * 2.3 + index * Math.PI * 2 / 3;
      if ((Math.sin(angle) >= 0) !== front) continue;
      const x = 120 + Math.cos(angle) * 98;
      const y = 78 + Math.sin(angle) * 33 - Math.cos(angle) * 9;
      const size = 16 + (Math.sin(angle) + 1) * 5;
      context.save();
      context.translate(x, y);
      context.rotate(angle * .4);
      const glowSize = size * (1.1 + Math.sin(time * 2 + index) * .1);
      context.drawImage(glowImage, -glowSize / 2, -glowSize / 2, glowSize, glowSize);
      context.drawImage(starImage, -size / 2, -size / 2, size, size);
      context.restore();
    }
  };
  orbit(false);
  const width = 160 * (.82 + settle * .18);
  const height = width * brandImage.height / brandImage.width;
  if (reducedMotion) {
    context.drawImage(brandImage, (240 - width) / 2, 78 - height / 2, width, height);
  } else {
    const columns = Math.ceil(width * 2);
    for (let column = 0; column < columns; column++) {
      const sourceX = column / columns * brandImage.width;
      const wave = Math.sin(column / columns * Math.PI * 4 - time * 3) * 2.8 * progress;
      context.drawImage(brandImage, sourceX, 0, brandImage.width / columns, brandImage.height,
        (240 - width) / 2 + column / columns * width, 78 - height / 2 + wave, width / columns, height);
    }
  }
  orbit(true);
  context.restore();
  context.globalAlpha = reducedMotion ? 1 : Math.max(0, Math.min(1, (elapsed - 900) / 500));
  context.textAlign = 'center';
  context.fillStyle = '#c9b4ec';
  context.font = '6px monospace';
  context.fillText('INFINITE BATTERY. ENDLESS PLAY.', 120, 134);
  context.fillStyle = '#bc85ff';
  context.fillRect(83, 145, reducedMotion ? 74 : 74 * Math.min(1, elapsed / STARTUP_DURATION), 1);
  context.globalAlpha = 1;
  context.restore();
}

export async function playStartup(view) {
  await loadBrand();
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 640;
  const reduced = view.reducedMotion.matches;
  drawStartup(canvas, 0, reduced);
  view.setScreen(canvas);
  view.host.dataset.booting = 'true';
  const started = performance.now();
  try {
    await new Promise((resolve, reject) => {
      const animate = (time) => {
        try {
          drawStartup(canvas, time - started, reduced);
          if (time - started >= (reduced ? 500 : STARTUP_DURATION)) resolve();
          else requestAnimationFrame(animate);
        } catch (error) { reject(error); }
      };
      requestAnimationFrame(animate);
    });
  } finally {
    view.host.dataset.booting = 'false';
  }
}

export async function playStartupSound({ volume, muted }) {
  if (muted || volume === 0) return;
  const audio = new AudioContext();
  let timer;
  try {
    await Promise.race([
      (async () => {
        await audio.resume();
        const started = audio.currentTime + .95;
        await new Promise((resolve) => {
          for (const [index, frequency] of [523.25, 783.99, 1046.5].entries()) {
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            const start = started + index * .085;
            const duration = index === 2 ? .24 : .075;
            const level = volume / 100 * .045;
            oscillator.type = 'square';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(level, start + .002);
            for (let step = 1; step < 8; step++) {
              gain.gain.setValueAtTime(level * (8 - step) / 8,
                start + .002 + (duration - .012) * step / 8);
            }
            gain.gain.setValueAtTime(level / 8, start + duration - .008);
            gain.gain.linearRampToValueAtTime(0, start + duration);
            oscillator.connect(gain).connect(audio.destination);
            oscillator.start(start);
            oscillator.stop(start + duration + .005);
            if (index === 2) oscillator.onended = resolve;
          }
        });
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('The browser did not allow startup audio. Check its sound permissions.')), 4000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    await audio.close();
  }
}
