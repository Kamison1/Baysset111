let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function beep(freq: number, dur = 0.1, type: OscillatorType = "square", gain = 0.07, delay = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function unlockAudio() {
  audio();
}

export function sfxTick() {
  beep(880, 0.04, "sine", 0.05);
}

export function sfxGo() {
  beep(220, 0.1, "square", 0.09);
  beep(440, 0.14, "square", 0.08, 0.09);
}

export function sfxRest() {
  beep(330, 0.12, "triangle", 0.06);
}

export function sfxShow() {
  beep(520, 0.09, "triangle", 0.07);
}

export function sfxEnd() {
  beep(392, 0.12, "triangle", 0.07);
  beep(523, 0.18, "triangle", 0.07, 0.12);
}
