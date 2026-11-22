// Seu Valêncio — apresentador ORIGINAL em pixel art, desenhado em <canvas>.
// Animações: idle (balança), point (aponta), happy (braços pra cima), sad, e boca
// abrindo/fechando enquanto a voz fala (setTalking).

export function createHost(canvas, P = 10) {
  canvas.width = 24 * P;
  canvas.height = 30 * P;
  const ctx = canvas.getContext("2d");
  const C = {
    skin: "#f2c49b", hair: "#e8e6e1", suit: "#d7263d", suit2: "#8e1b2c",
    tie: "#ffd23f", shirt: "#ffffff", eye: "#222", mouth: "#7a1f1f", mic: "#9aa3b5",
    legs: "#1d1d2b",
  };
  const s = { mood: "idle", talking: false, t: 0, iv: null };

  function frame() {
    const t = s.t++;
    const bob = Math.floor(t / 8) % 2;
    const jump = s.mood === "happy" ? -(Math.floor(t / 4) % 2) : 0;
    const dy = bob + jump;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const R = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x * P, (y + dy) * P, w * P, h * P);
    };

    // sombra no chão
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(6 * P, 28 * P, 12 * P, P);

    // pernas e sapatos
    R(8, 24, 3, 4, C.legs);
    R(13, 24, 3, 4, C.legs);
    R(7, 27, 4, 1, "#111");
    R(13, 27, 4, 1, "#111");

    // terno (lapelas) + camisa + gravata
    R(6, 14, 12, 10, C.suit);
    R(9, 14, 2, 4, C.suit2);
    R(13, 14, 2, 4, C.suit2);
    R(11, 14, 2, 3, C.shirt);
    R(11, 17, 2, 5, C.tie);

    // cabeça + cabelo penteado para trás
    R(8, 6, 8, 8, C.skin);
    R(8, 4, 8, 3, C.hair);
    R(7, 5, 1, 3, C.hair);
    R(16, 5, 1, 3, C.hair);
    R(9, 4, 6, 1, "#c9c6bf");

    // olhos (sorrindo quando feliz)
    if (s.mood === "happy") {
      R(9, 9, 2, 1, C.eye);
      R(13, 9, 2, 1, C.eye);
    } else {
      R(9, 8, 2, 2, C.eye);
      R(13, 8, 2, 2, C.eye);
    }

    // boca
    if (s.talking) {
      if (Math.floor(t / 3) % 2 === 0) R(11, 11, 2, 2, C.mouth);
      else R(11, 11, 2, 1, C.mouth);
    } else if (s.mood === "happy") {
      R(10, 11, 4, 1, C.mouth);
      R(10, 10, 1, 1, C.mouth);
      R(13, 10, 1, 1, C.mouth);
    } else if (s.mood === "sad") {
      R(10, 12, 4, 1, C.mouth);
      R(10, 11, 1, 1, C.mouth);
      R(13, 11, 1, 1, C.mouth);
    } else {
      R(10, 11, 4, 1, C.mouth);
    }

    // braços
    if (s.mood === "point") {
      R(18, 15, 5, 2, C.suit);
      R(22, 14, 2, 2, C.skin);
      R(4, 15, 2, 7, C.suit);
      R(4, 21, 2, 2, C.skin);
    } else if (s.mood === "happy") {
      R(3, 8, 2, 7, C.suit);
      R(3, 6, 2, 2, C.skin);
      R(19, 8, 2, 7, C.suit);
      R(19, 6, 2, 2, C.skin);
    } else {
      R(4, 15, 2, 7, C.suit);
      R(18, 15, 2, 7, C.suit);
      R(4, 21, 2, 2, C.skin);
      R(18, 21, 2, 2, C.skin);
      // microfone de lapela na mão direita
      R(19, 20, 1, 3, C.mic);
    }
  }

  return {
    setMood(m) { s.mood = m; },
    setTalking(v) { s.talking = v; },
    start() {
      if (!s.iv) s.iv = setInterval(frame, 110);
    },
  };
}
