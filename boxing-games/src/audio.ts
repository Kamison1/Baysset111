/** Lightweight Web Audio beeps — no asset files needed. */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  gain = 0.08,
  when = 0,
): void {
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + when;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function unlockAudio(): void {
  getCtx();
}

export function sfxHit(): void {
  tone(180, 0.08, "square", 0.1);
  tone(320, 0.06, "triangle", 0.06, 0.02);
}

export function sfxCorrect(): void {
  tone(440, 0.07, "triangle", 0.08);
  tone(660, 0.1, "triangle", 0.07, 0.07);
}

export function sfxMiss(): void {
  tone(120, 0.18, "sawtooth", 0.07);
}

export function sfxTick(): void {
  tone(880, 0.04, "sine", 0.05);
}

export function sfxGo(): void {
  tone(220, 0.1, "square", 0.09);
  tone(440, 0.15, "square", 0.08, 0.1);
}

export function sfxShow(): void {
  tone(520, 0.09, "triangle", 0.07);
}
