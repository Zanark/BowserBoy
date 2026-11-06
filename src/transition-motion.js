export function nextTransitionElapsed(transition, time, paintDue) {
  if (!paintDue) return transition.elapsed;
  if (transition.lastPaint === null) return 0;
  const delta = Math.max(0, time - transition.lastPaint);
  // Present the lifted midpoint before a sparse paint can finish the move.
  const boundary = transition.elapsed < transition.duration / 2
    ? transition.duration / 2 : transition.duration;
  return Math.min(boundary, transition.elapsed + delta);
}
