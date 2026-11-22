// Voz do apresentador: áudios gravados em assets/voz/*.mp3 (sem síntese do navegador).

let enabled = true;
let seqId = 0;
let timerId = null;
const player = new Audio();
player.preload = "auto";

export function setVoiceEnabled(v) {
  enabled = v;
  if (!v) cancelSpeech();
}

export function questionKey(id) {
  return `p${String(id).padStart(2, "0")}`;
}

export function cancelSpeech() {
  seqId++;
  clearTimeout(timerId);
  timerId = null;
  player.onended = null;
  player.onerror = null;
  player.pause();
  player.currentTime = 0;
}

// Reproduz um áudio (string) ou lista sequencial de áudios em assets/voz/<key>.mp3.
// Chama onStep(key) ao iniciar cada faixa e done() ao concluir tudo (ou imediatamente se voz desligada).
export function playVoice(keys, done, onStep) {
  cancelSpeech();
  const list = Array.isArray(keys) ? keys.filter(Boolean) : [keys].filter(Boolean);
  if (!enabled || !list.length) {
    if (done) done();
    return;
  }

  const mySeq = seqId;
  let idx = 0;

  function next() {
    if (mySeq !== seqId) return;
    if (idx >= list.length) {
      if (done) done();
      return;
    }
    const key = list[idx++];
    if (onStep) onStep(key);
    player.src = `assets/voz/${key}.mp3`;
    player.currentTime = 0;
    player.onended = next;
    player.onerror = next;
    const p = player.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        if (mySeq === seqId) next();
      });
    }
  }

  next();
}

export function delayVoice(ms, fn) {
  const mySeq = seqId;
  clearTimeout(timerId);
  timerId = setTimeout(() => {
    timerId = null;
    if (mySeq === seqId) fn();
  }, ms);
}
