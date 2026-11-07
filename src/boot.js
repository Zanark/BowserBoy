const loading = document.getElementById('scene-loading');
const player = document.getElementById('player');
const retry = document.getElementById('scene-loading-retry');
const recover = document.getElementById('scene-loading-recover');
let application;
function showDesk() {
  loading.hidden = true;
  player.inert = false;
  player.setAttribute('aria-busy', 'false');
}

retry.addEventListener('click', () => location.reload());
recover.addEventListener('click', showDesk);

try {
  // Present the cover before synchronous model construction and shader work.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  application = await import('./app.js');
  if (application.sceneFailure) throw application.sceneFailure;
  await loading.querySelector('img').decode();
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  showDesk();
} catch (error) {
  console.error('Starting BowserBOY:', error);
  loading.dataset.failed = '';
  const status = document.getElementById('scene-loading-status');
  status.setAttribute('role', 'alert');
  status.textContent = 'The desk could not finish loading.';
  document.getElementById('scene-loading-detail').textContent =
    `${error.message} Check your connection and WebGL support, then reload to try again.`;
  retry.hidden = false;
  recover.hidden = !application?.sceneFailure;
}
