export const cartridgeFramingDuration = 850;
export const cartridgeSlideDuration = 1350;

export function nextCartridgeElapsed(motion, time, paintDue) {
  if (!paintDue) return motion.elapsed;
  const step = Math.max(0, time - (motion.lastPaint ?? time - 16.67));
  // Present the fully lowered framing before allowing a sparse paint to seat.
  const boundary = motion.elapsed < cartridgeFramingDuration
    ? cartridgeFramingDuration : cartridgeFramingDuration + cartridgeSlideDuration;
  return Math.min(boundary, motion.elapsed + step);
}
