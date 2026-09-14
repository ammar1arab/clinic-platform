let context: AudioContext | null = null;

function audio() {
  try {
    context ??= new AudioContext();
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

function chime(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.28;
  master.connect(ctx.destination);

  const now = ctx.currentTime;
  const notes: Array<[number, number, number, OscillatorType, number]> = [
    [523.25, 0, 0.16, 'triangle', 0.55],
    [659.25, 0.08, 0.18, 'triangle', 0.62],
    [783.99, 0.16, 0.28, 'sine', 0.7],
    [1046.5, 0.26, 0.42, 'sine', 0.48],
    [1318.5, 0.34, 0.22, 'sine', 0.22],
  ];

  for (const [frequency, offset, duration, type, peak] of notes) {
    tone(ctx, master, frequency, now + offset, duration, type, peak);
  }
}

export function playFeedbackSound() {
  const ctx = audio();
  if (!ctx) return;

  const start = () => {
    if (ctx.state === 'running') chime(ctx);
  };

  if (ctx.state === 'running') {
    start();
    return;
  }

  void ctx.resume().then(start).catch(() => {});
}
