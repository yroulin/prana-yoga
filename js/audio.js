// A soft bell for the moment a pose changes, synthesised in the browser so the app ships
// without an audio file and nothing has to be downloaded.

let context = null;

function audioContext() {
  if (context) return context;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

// Browsers hold the context suspended until a real gesture happens.
export function unlock() {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function voice(ctx, frequency, startAt, gain, duration) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startAt);
  amp.gain.setValueAtTime(0.0001, startAt);
  amp.gain.exponentialRampToValueAtTime(gain, startAt + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/**
 * A short struck tone: a fundamental with a quiet fifth above it, both fading away over
 * about two seconds.
 */
export function chime() {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime + 0.01;
  voice(ctx, 528, now, 0.11, 2.0);
  voice(ctx, 792, now + 0.005, 0.045, 1.6);
  voice(ctx, 1056, now + 0.01, 0.018, 1.1);
}
