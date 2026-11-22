// Áudio 100% gerado com Web Audio API (sons originais, sem arquivos de terceiros).

let ctx = null;
let muted = false;
let musicTimer = null;
const questionAudio = new Audio("assets/pergunta.mp3");
questionAudio.preload = "auto";

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(v) {
  muted = v;
  if (v) {
    questionAudio.pause();
    questionAudio.currentTime = 0;
  }
}

function tone(freq, dur, type = "square", vol = 0.12, when = 0) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function seq(notes, type = "square", vol = 0.12) {
  let t = 0;
  for (const [f, d] of notes) {
    if (f) tone(f, d * 0.92, type, vol, t);
    t += d;
  }
}

// "Plateia": ruído filtrado com envelope (aplausos/vaias)
export function crowd(dur = 1.5) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 900;
  const g = c.createGain();
  g.gain.value = 0.35;
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start();
}

export const sfx = {
  jingle() {
    seq([[523, 0.14], [659, 0.14], [784, 0.14], [1047, 0.28], [784, 0.14], [1047, 0.45]]);
  },
  question() {
    if (muted) return;
    questionAudio.currentTime = 0;
    questionAudio.play().catch(() => {});
  },
  correct() {
    seq([[660, 0.1], [880, 0.1], [1320, 0.25]]);
  },
  wrong() {
    seq([[330, 0.22], [262, 0.22], [196, 0.5]], "sawtooth", 0.1);
    crowd(1.2);
  },
  tick() {
    tone(1800, 0.04, "square", 0.05);
  },
  milhao() {
    seq([
      [523, 0.12], [523, 0.12], [523, 0.12], [659, 0.25], [587, 0.25],
      [659, 0.25], [784, 0.35], [659, 0.12], [784, 0.5], [1047, 0.8],
    ]);
    crowd(2.5);
  },
};

// Trilha de suspense em loop (melodia original, 8-bit)
const THEME = [392, 0, 523, 0, 587, 523, 0, 392, 330, 0, 392, 0, 440, 0, 523, 0];

export function startMusic() {
  stopMusic();
  if (muted) return;
  let i = 0;
  musicTimer = setInterval(() => {
    const f = THEME[i % THEME.length];
    i++;
    if (f) tone(f, 0.2, "triangle", 0.05);
    if (i % 4 === 1) tone(98, 0.35, "sine", 0.09);
  }, 250);
}

export function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}
