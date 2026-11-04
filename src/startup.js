export const STARTUP_DURATION = 2400;

export function drawStartup(canvas, elapsed, reducedMotion = false) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The startup screen requires a 2D canvas.');
  const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, (elapsed - 100) / 1100));
  const settle = 1 - (1 - progress) ** 3;
  context.fillStyle = '#faf9ff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.textAlign = 'center';
  context.font = 'italic 900 25px Arial';
  context.translate(120, 74 - (1 - settle) * 18);
  context.beginPath();
  context.rect(-120, -40, 240 * progress, 60);
  context.clip();
  const ink = context.createLinearGradient(-95, 0, 95, 0);
  ink.addColorStop(0, '#a546db');
  ink.addColorStop(.45, '#6140c6');
  ink.addColorStop(1, '#283ba4');
  context.fillStyle = ink;
  context.fillText('BOWSER BOY', 0, 0, 216);
  context.font = 'bold 11px Arial';
  context.fillText('A D V A N C E', 0, 18);
  context.restore();
  context.globalAlpha = reducedMotion ? 1 : Math.max(0, Math.min(1, (elapsed - 1200) / 300));
  context.textAlign = 'center';
  context.fillStyle = '#78718d';
  context.font = '7px monospace';
  context.fillText('INFINITE BATTERY. ENDLESS PLAY.', 120, 134);
  context.globalAlpha = 1;
}

export async function playStartup(view) {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 160;
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
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(volume / 100 * .08, start + .008);
            gain.gain.exponentialRampToValueAtTime(.0001, start + .32);
            oscillator.connect(gain).connect(audio.destination);
            oscillator.start(start);
            oscillator.stop(start + .34);
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
