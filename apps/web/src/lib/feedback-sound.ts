let context: AudioContext | null = null;

function audio() {
  try {
    const Audio = window.AudioContext ?? (window as Window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;
    if (!Audio) return null;
    if (!context || context.state === 'closed') context = new Audio();
  } catch {
    return null;
  }
  return context;
}

export function prepareFeedbackSound() {
  const ctx = audio();
  if (!ctx) return;
  void ctx.resume().catch(() => {});
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  peak: number,
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(dest);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}

type Tone = [number, number, number, OscillatorType, number];

const confirmationTones: Tone[] = [
  [523.25, 0, 0.16, 'triangle', 0.55],
  [659.25, 0.08, 0.18, 'triangle', 0.62],
  [783.99, 0.16, 0.28, 'sine', 0.7],
  [1046.5, 0.26, 0.42, 'sine', 0.48],
  [1318.5, 0.34, 0.22, 'sine', 0.22],
];

const refreshTones: Tone[] = [
  [587.33, 0, 0.16, 'sine', 0.16],
  [783.99, 0.09, 0.22, 'sine', 0.13],
];

const copyTones: Tone[] = [
  [880, 0, 0.055, 'sine', 0.14],
  [1174.66, 0.045, 0.075, 'sine', 0.12],
];

function playTones(ctx: AudioContext, notes: Tone[], volume = 1) {
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  const now = ctx.currentTime;
  for (const [frequency, offset, duration, type, peak] of notes) {
    tone(ctx, master, frequency, now + offset, duration, type, peak);
  }
}

function play(notes: Tone[], volume = 1) {
  const ctx = audio();
  if (!ctx) return;

  const start = () => {
    if (ctx.state === 'running') playTones(ctx, notes, volume);
  };

  if (ctx.state === 'running') {
    start();
    return;
  }

  void ctx.resume().then(start).catch(() => {});
}

export function playFeedbackSound() {
  play(confirmationTones, 0.28);
}

export function playRefreshSound() {
  play(refreshTones);
}

export function playCopySound() {
  play(copyTones, 0.65);
}
