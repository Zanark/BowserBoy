export function nextGameBoxElapsed(motion, time, reducedMotion = false) {
  if (reducedMotion) return 4900;
  const delta = Math.max(0, time - (motion.lastPaint ?? time));
  // Sparse paints may catch up, but must present each unpacking stage first.
  const boundary = [650, 1350, 2300, 3050, 4150, 4250, 4900]
    .find(value => value > motion.elapsed) ?? 4900;
  return Math.min(boundary, motion.elapsed + delta);
}
