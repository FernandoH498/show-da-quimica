// Voz do apresentador: síntese de voz do próprio navegador (pt-BR), sem serviço externo.

let enabled = true;

export function setVoiceEnabled(v) {
  enabled = v;
  if (!v) cancelSpeech();
}

function pickVoice() {
  try {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("pt")) || null;
  } catch {
    return null;
  }
}

// Fala o texto e chama done() quando termina (ou após um tempo estimado, se não houver voz).
export function speak(text, done) {
  let finished = false;
  const fin = () => {
    if (finished) return;
    finished = true;
    done();
  };
  const hasSpeech = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
  if (!enabled || !hasSpeech) {
    setTimeout(fin, Math.min(3000, 800 + text.length * 40));
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = 1.02;
    u.pitch = 0.85;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = fin;
    u.onerror = fin;
    window.speechSynthesis.speak(u);
    // rede de segurança: alguns navegadores não disparam onend
    setTimeout(fin, Math.min(25000, 4000 + text.length * 120));
  } catch {
    fin();
  }
}

export function cancelSpeech() {
  try {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  } catch {
    /* ignora */
  }
}
