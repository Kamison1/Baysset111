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

/** Soft table clack while dice tumble — quiet, not buzzy. */
export function sfxDiceClack() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const len = Math.floor(a.sampleRate * 0.035);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12));
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 700 + Math.random() * 500;
  filter.Q.value = 1.2;
  const g = a.createGain();
  g.gain.setValueAtTime(0.045, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  src.connect(filter);
  filter.connect(g);
  g.connect(a.destination);
  src.start(t);
  src.stop(t + 0.05);
}

/** Satisfying settle: soft thud + tiny wood tick. */
export function sfxDiceLand() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;

  const thud = a.createOscillator();
  const tg = a.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(140, t);
  thud.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  tg.gain.setValueAtTime(0.09, t);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  thud.connect(tg);
  tg.connect(a.destination);
  thud.start(t);
  thud.stop(t + 0.15);

  const tick = a.createOscillator();
  const kg = a.createGain();
  tick.type = "triangle";
  tick.frequency.value = 520;
  kg.gain.setValueAtTime(0.035, t + 0.04);
  kg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  tick.connect(kg);
  kg.connect(a.destination);
  tick.start(t + 0.04);
  tick.stop(t + 0.12);
}
