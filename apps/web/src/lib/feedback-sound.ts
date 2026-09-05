let context: AudioContext | null = null;

export function prepareFeedbackSound() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  } catch {
    context = null;
  }
}

export function playFeedbackSound() {
  if (!context || context.state !== 'running') return;
  const now = context.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context!.createOscillator();
    const gain = context!.createGain();
    const start = now + index * 0.11;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.035, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    oscillator.connect(gain);
    gain.connect(context!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.4);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}
