// Apresentador em pixel art usando spritesheet (assets/host-sprites.png).
// Frames: 0=idle (mic baixo), 1=falando/animado, 2=apontando, 3=gesto/dúvida, 4=composto (mic no peito).

const FRAMES = [
  { x: 22, y: 98, w: 193, h: 504 },
  { x: 223, y: 100, w: 197, h: 500 },
  { x: 430, y: 101, w: 180, h: 500 },
  { x: 638, y: 100, w: 192, h: 501 },
  { x: 840, y: 98, w: 174, h: 502 },
];

const sheet = new Image();
sheet.src = "assets/host-sprites.png";

export function createHost(canvas) {
  canvas.width = 220;
  canvas.height = 524;
  const ctx = canvas.getContext("2d");
  const s = { mood: "idle", talking: false, t: 0, iv: null };

  function pickFrame(t) {
    if (s.talking) {
      const step = Math.floor(t / 3) % 2;
      if (s.mood === "point") return step === 0 ? 2 : 1;
      if (s.mood === "happy") return step === 0 ? 1 : 2;
      return step === 0 ? 1 : 3;
    }
    if (s.mood === "point") return 2;
    if (s.mood === "happy") return Math.floor(t / 4) % 2 === 0 ? 1 : 2;
    if (s.mood === "sad") return 3;
    return Math.floor(t / 18) % 2 === 0 ? 0 : 4;
  }

  function frame() {
    const t = s.t++;
    const bob = (Math.floor(t / 8) % 2) * 3;
    const jump = s.mood === "happy" ? -(Math.floor(t / 4) % 2) * 10 : 0;
    const dy = bob + jump;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // sombra no chão
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height - 10, 72, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!sheet.complete || !sheet.naturalWidth) return;

    const f = FRAMES[pickFrame(t)];
    const dx = Math.round((canvas.width - f.w) / 2);
    const y = canvas.height - 12 - f.h + dy;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, f.x, f.y, f.w, f.h, dx, y, f.w, f.h);
  }

  sheet.addEventListener("load", frame);

  return {
    setMood(m) { s.mood = m; frame(); },
    setTalking(v) { s.talking = v; frame(); },
    start() {
      frame();
      if (!s.iv) s.iv = setInterval(frame, 110);
    },
  };
}
