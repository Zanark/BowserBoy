// Pinned EmulatorJS 4.2.3 / Emscripten OpenAL integration.
const configuredSchedulers = new WeakSet();

export function configureAudioBuffer(GameManager) {
  const original = GameManager?.prototype?.getRetroArchCfg;
  if (typeof original !== 'function') throw new Error('The emulator audio configuration is unavailable.');
  GameManager.prototype.getRetroArchCfg = function () {
    const config = original.call(this);
    if (!/^audio_latency = 64$/m.test(config)) {
      throw new Error('The pinned emulator audio configuration changed.');
    }
    const al = this.Module.AL;
    if (typeof al?.updateSourceTime !== 'function') {
      throw new Error('The pinned emulator audio scheduler is unavailable.');
    }
    if (!configuredSchedulers.has(al)) {
      const update = al.updateSourceTime;
      al.QUEUE_LOOKAHEAD = .2;
      al.updateSourceTime = (source) => {
        const starting = source.state === 4114 && !Number.isFinite(source.bufStartTime);
        const time = update(source);
        // Native playback otherwise starts immediately, even with a larger buffer.
        if (starting && source.state === 4114) source.bufStartTime += .096;
        source.bufOffset = Math.max(0, source.bufOffset);
        return time;
      };
      configuredSchedulers.add(al);
    }
    // Audio-paced steady playback needs native capacity, not only startup pre-roll.
    return config.replace(/^audio_latency = 64$/m, 'audio_latency = 256');
  };
}

export function protectAudio(emulator) {
  const al = emulator.Module.AL;
  const context = al?.currentCtx;
  if (!context?.gain || !context.audioCtx || !Array.isArray(context.sources)) {
    throw new Error('The emulator audio output is unavailable.');
  }
  const audio = context.audioCtx;
  for (const source of context.sources.filter(Boolean)) {
    source.gain.gain.setValueAtTime(emulator.volume, audio.currentTime);
  }
  const limiter = audio.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = .003;
  limiter.release.value = .08;
  context.gain.disconnect(audio.destination);
  context.gain.connect(limiter).connect(audio.destination);

  const setVolume = emulator.setVolume.bind(emulator);
  const knownSources = new WeakSet(context.sources.filter(Boolean));
  // Track overlapping ramps independently of the native AudioParam assignments.
  let from = emulator.volume;
  let target = from;
  let changed = audio.currentTime;
  const schedule = al.scheduleSourceAudio;
  al.scheduleSourceAudio = (source, ...args) => {
    // OpenAL can replace a starved source; retain the user's volume/mute.
    if (!knownSources.has(source)) {
      source.gain.gain.setValueAtTime(target, source.context.audioCtx.currentTime);
      knownSources.add(source);
    }
    return schedule(source, ...args);
  };
  emulator.setVolume = (volume) => {
    const time = audio.currentTime;
    const previous = from + (target - from) * Math.min(1, Math.max(0, (time - changed) / .015));
    const gains = context.sources.filter(Boolean).map(source => source.gain.gain);
    setVolume(volume);
    for (const gain of gains) {
      gain.cancelScheduledValues(time);
      gain.setValueAtTime(previous, time);
      gain.linearRampToValueAtTime(volume, time + .015);
    }
    from = previous;
    target = volume;
    changed = time;
  };
}
