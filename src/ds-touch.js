export class DsTouchQueue {
  constructor({ dispatch, nextFrame, onError }) {
    this.dispatch = dispatch;
    this.nextFrame = nextFrame;
    this.onError = onError;
    this.samples = [];
    this.requestedDown = false;
    this.flushing = false;
    this.generation = 0;
  }
  push({ x, y, pressed }) {
    const move = pressed && this.requestedDown;
    this.requestedDown = pressed;
    const entry = { sample: { x, y, pressed }, move };
    if (move && this.samples.at(-1)?.move) this.samples[this.samples.length - 1] = entry;
    else this.samples.push(entry);
    if (!this.flushing) void this.flush();
  }
  cancel() {
    this.generation++;
    this.samples.length = 0;
    this.requestedDown = false;
    if (this.last?.pressed) {
      this.last = { ...this.last, pressed: false };
      this.dispatch(this.last);
    }
  }
  async flush() {
    this.flushing = true;
    const generation = this.generation;
    try {
      while (this.samples.length && generation === this.generation) {
        const { sample } = this.samples.shift();
        this.dispatch(sample);
        this.last = sample;
        // Keep contact edges observable between native input polls, not just message tasks.
        await this.nextFrame(() => generation === this.generation);
      }
    } catch (error) {
      this.samples.length = 0;
      this.requestedDown = false;
      this.onError(error);
    } finally {
      this.flushing = false;
      if (this.samples.length) void this.flush();
    }
  }
}
