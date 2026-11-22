// Confete em canvas (efeito de vitória).

export function confetti(n = 160) {
  const c = document.getElementById("confetti");
  if (!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  const ctx = c.getContext("2d");
  const colors = ["#ffd23f", "#ff3b6b", "#3bd6ff", "#7cff6b", "#ff9f1c"];
  const ps = Array.from({ length: n }, () => ({
    x: Math.random() * c.width,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    s: 6 + Math.random() * 6,
    r: Math.random() * 6,
    col: colors[Math.floor(Math.random() * colors.length)],
  }));
  const end = performance.now() + 3200;
  function step(now) {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of ps) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.r += 0.2;
      ctx.fillStyle = p.col;
      ctx.fillRect(p.x, p.y, p.s, p.s * 0.5);
    }
    if (now < end) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, c.width, c.height);
  }
  requestAnimationFrame(step);
}
