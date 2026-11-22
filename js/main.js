import { QUESTIONS, LEVEL_LABEL } from "./questions.js";
import { createHost } from "./host.js";
import { sfx, startMusic, stopMusic, setMuted } from "./audio.js";
import { playVoice, delayVoice, cancelSpeech, setVoiceEnabled, questionKey } from "./voice.js";
import { confetti } from "./confetti.js";

// Escada de prêmios (pontos). Índice 0 = pergunta 1.
const LADDER = [1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000, 50000, 100000, 150000, 200000, 300000, 500000, 700000, 1000000];
// Patamares seguros: se errar depois de passar por eles, leva o valor do patamar.
const SAFE = [5, 12];
const TOTAL = 16;
const TIME = 30;
// Nível de dificuldade de cada rodada
const PLAN = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3];

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString("pt-BR");
const hosts = ["host-start", "host-game", "host-end"].map((id) => createHost($(id)));
const setMood = (m) => hosts.forEach((h) => h.setMood(m));
const setTalking = (v) => hosts.forEach((h) => h.setTalking(v));

const opts = { sound: true, voice: true, timer: true };
let S = null; // estado da partida
let timerId = null;
let timeLeft = TIME;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFromLevel(level, used) {
  let pool = QUESTIONS.filter((q) => q.n === level && !used.has(q));
  if (!pool.length) pool = QUESTIONS.filter((q) => !used.has(q));
  if (!pool.length) return null;
  const q = pool[Math.floor(Math.random() * pool.length)];
  used.add(q);
  return q;
}

function drawRun() {
  const used = new Set();
  const qs = PLAN.map((lvl) => pickFromLevel(lvl, used));
  return { qs, used };
}

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  window.scrollTo({ top: 0 });
}

// ---------- fluxo ----------
function startGame() {
  cancelSpeech();
  stopTimer();
  const { qs, used } = drawRun();
  const debug = Number(new URLSearchParams(location.search).get("debug")) || 0;
  S = {
    qs,
    used,
    idx: 0,
    cur: null,
    locked: true,
    ended: false,
    lastMeme: false,
    lifelines: { cartas: true, plateia: true, pular: 3 },
  };
  if (debug >= 1 && debug <= TOTAL) S.idx = debug - 1; // atalho para testes: ?debug=16
  show("screen-game");
  $("round").textContent = "ABERTURA";
  $("prize").textContent = "Show da Química";
  $("question").textContent = "Prepare-se! Vai começar o Show da Química!";
  $("options").innerHTML = "";
  $("feedback").classList.add("hidden");
  $("poll").classList.add("hidden");
  $("bubble").textContent = "Vai começar o show!";
  renderLadder();
  renderLifelines();

  const runRef = S;
  setMood("happy");
  setTalking(true);
  playVoice(["inicio", "intro"], () => {
    if (S !== runRef || S.ended) return;
    setTalking(false);
    if (opts.sound) startMusic();
    loadRound();
  });
}

function loadRound() {
  cancelSpeech();
  stopTimer();
  const q = S.qs[S.idx];
  const list = shuffle(q.o.map((t, i) => ({ t, ok: i === 0, hid: false })));
  S.cur = { q, list };
  S.locked = false;

  $("round").textContent = `PERGUNTA ${S.idx + 1}/${TOTAL} · ${LEVEL_LABEL[q.n]}`;
  $("prize").textContent = `Vale ${fmt(LADDER[S.idx])}`;
  $("question").textContent = q.q;
  $("feedback").classList.add("hidden");
  $("poll").classList.add("hidden");
  const defaultBubble = `Pergunta ${S.idx + 1}! Vale ${fmt(LADDER[S.idx])} pontos.`;
  $("bubble").textContent = defaultBubble;
  timeLeft = TIME;
  setTimerText();
  renderOptions();
  renderLadder();
  renderLifelines();

  const cur = S.cur;
  const qKey = questionKey(q.id);
  const useMeme = !S.lastMeme && Math.random() < 0.35;
  S.lastMeme = useMeme;

  const startQuestionVoice = () => {
    if (!S || S.cur !== cur || S.locked) return;
    $("bubble").textContent = defaultBubble;
    sfx.question();
    setMood("point");
    setTalking(true);
    delayVoice(550, () => {
      if (!S || S.cur !== cur || S.locked) return;
      playVoice(qKey, () => {
        setTalking(false);
        setMood("idle");
        if (S && S.cur === cur && !S.locked) startTimer();
      });
    });
  };

  if (useMeme && opts.voice) {
    $("bubble").textContent = "Posso perguntar?";
    setMood("point");
    setTalking(true);
    playVoice("posso-perguntar", startQuestionVoice);
  } else {
    startQuestionVoice();
  }
}

function renderOptions() {
  const box = $("options");
  box.innerHTML = "";
  S.cur.list.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "opt" + (o.hid ? " hid" : "");
    const l = document.createElement("span");
    l.className = "l";
    l.textContent = "ABCD"[i];
    b.append(l, document.createTextNode(o.t));
    b.disabled = o.hid || S.locked;
    b.addEventListener("click", () => answer(i));
    box.append(b);
  });
}

function answer(i) {
  if (!S || S.locked) return;
  S.locked = true;
  cancelSpeech();
  setTalking(false);
  stopTimer();
  const list = S.cur.list;
  const btns = [...$("options").children];
  btns.forEach((b) => (b.disabled = true));
  const correctIdx = list.findIndex((o) => o.ok);

  if (i >= 0 && list[i].ok) {
    btns[i].classList.add("ok");
    correctAnswer();
  } else {
    if (i >= 0) btns[i].classList.add("bad");
    btns[correctIdx].classList.add("reveal", "ok");
    wrongAnswer(i < 0);
  }
  renderLifelines();
}

function correctAnswer() {
  sfx.correct();
  setMood("happy");
  $("bubble").textContent = "Isso aí!";
  const won = LADDER[S.idx];
  S.idx++;
  if (S.idx === TOTAL) {
    victory();
    return;
  }
  setTalking(true);
  playVoice("acerto", () => setTalking(false));
  renderLadder();
  $("fb-title").textContent = `✔ Acertou! +${fmt(won)} pontos`;
  $("fb-text").textContent = S.cur.q.e;
  $("feedback").classList.remove("hidden");
  renderLifelines();
}

function wrongAnswer(timeout) {
  sfx.wrong();
  setMood("sad");
  const prize = safeFloor();
  const why = timeout ? "Tempo esgotado!" : "Resposta errada!";
  setTimeout(() => endGame("errou", prize, `${why} ${S.cur.q.e}`), 1800);
}

function safeFloor() {
  let p = 0;
  for (const s of SAFE) if (s < S.idx) p = LADDER[s];
  return p;
}

function victory() {
  S.ended = true;
  sfx.milhao();
  setMood("happy");
  confetti(220);
  setTimeout(() => endGame("milhao", LADDER[TOTAL - 1], "Você zerou o Show da Química!"), 1800);
}

function stopGame() {
  if (!S || S.ended) return;
  const prize = S.idx > 0 ? LADDER[S.idx - 1] : 0;
  endGame("parou", prize, `Você saiu do show com ${fmt(prize)} pontos.`);
}

function endGame(kind, prize, msg) {
  if (!S || S.ended && kind !== "milhao") return;
  S.ended = true;
  stopTimer();
  stopMusic();
  cancelSpeech();
  const titles = { errou: "FIM DE JOGO", parou: "PARABÉNS!", milhao: "🏆 MILHÃO!" };
  $("end-title").textContent = titles[kind];
  $("end-prize").textContent = `${fmt(prize)} pontos`;
  $("end-text").textContent = msg;
  show("screen-end");
  setMood(kind === "errou" ? "sad" : "happy");
  setTalking(true);
  playVoice(kind || "errou", () => setTalking(false));
}

// ---------- escada e ajudas ----------
function buildLadder() {
  $("ladder").innerHTML = LADDER.map((v, i) => `<li data-i="${i}"><span>${i + 1}</span><span>${fmt(v)}</span></li>`)
    .reverse()
    .join("");
}

function renderLadder() {
  document.querySelectorAll("#ladder li").forEach((li) => {
    const i = Number(li.dataset.i);
    li.className = "";
    if (i === S.idx) li.classList.add("cur");
    else if (i < S.idx) li.classList.add("done");
    if (SAFE.includes(i)) li.classList.add("safe");
  });
}

function renderLifelines() {
  const locked = !S || S.locked;
  $("ll-cartas").disabled = locked || !S.lifelines.cartas;
  $("ll-plateia").disabled = locked || !S.lifelines.plateia;
  $("ll-pular").disabled = locked || S.lifelines.pular <= 0;
  $("ll-pular").textContent = `Pular (${S ? S.lifelines.pular : 0})`;
  const feedbackOpen = !$("feedback").classList.contains("hidden");
  $("btn-stop").disabled = !S || S.idx === 0 || S.ended || (S.locked && !feedbackOpen);
}

$("ll-cartas").addEventListener("click", () => {
  if (S.locked || !S.lifelines.cartas) return;
  S.lifelines.cartas = false;
  const wrongs = shuffle(S.cur.list.filter((o) => !o.ok && !o.hid));
  wrongs.slice(0, 2).forEach((o) => (o.hid = true));
  renderOptions();
  renderLifelines();
});

$("ll-plateia").addEventListener("click", () => {
  if (S.locked || !S.lifelines.plateia) return;
  S.lifelines.plateia = false;
  const correct = 40 + Math.floor(Math.random() * 36); // a plateia "acerta" mais que o chute
  const rest = 100 - correct;
  const w = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
  const sum = w.reduce((a, b) => a + b, 0);
  const values = S.cur.list.map((o) => (o.ok ? correct : 0));
  let k = 0;
  S.cur.list.forEach((o, i) => {
    if (!o.ok) values[i] = Math.round((rest * w[k++]) / sum);
  });
  const poll = $("poll");
  poll.classList.remove("hidden");
  poll.innerHTML =
    `<div>Universitários opinam:</div><div class="poll-bars">` +
    S.cur.list
      .map((_, i) => `<div class="poll-col"><b>${values[i]}%</b><div class="poll-bar" data-h="${values[i]}"></div><span>${"ABCD"[i]}</span></div>`)
      .join("") +
    `</div>`;
  requestAnimationFrame(() =>
    poll.querySelectorAll(".poll-bar").forEach((b) => (b.style.height = `${b.dataset.h * 1.4}px`))
  );
  renderLifelines();
});

$("ll-pular").addEventListener("click", () => {
  if (S.locked || S.lifelines.pular <= 0) return;
  const repl = pickFromLevel(S.cur.q.n, S.used);
  if (!repl) return;
  S.lifelines.pular--;
  S.qs[S.idx] = repl;
  loadRound();
});

$("btn-stop").addEventListener("click", stopGame);

// ---------- cronômetro ----------
function setTimerText() {
  const el = $("timer");
  el.textContent = opts.timer ? timeLeft : "∞";
  el.classList.toggle("low", opts.timer && timeLeft <= 10);
}

function startTimer() {
  stopTimer();
  setTimerText();
  if (!opts.timer) return;
  timerId = setInterval(() => {
    timeLeft--;
    setTimerText();
    if (timeLeft <= 10 && timeLeft > 0) sfx.tick();
    if (timeLeft <= 0) answer(-1);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

// ---------- som, voz e teclado ----------
function setSound(v) {
  opts.sound = v;
  setMuted(!v);
  if (!v) stopMusic();
  else if (S && !S.ended) startMusic();
  updateToggles();
}

function setVoice(v) {
  opts.voice = v;
  setVoiceEnabled(v);
  if (!v) {
    setTalking(false);
    if (S && S.cur && !S.locked && !S.ended && !timerId) startTimer();
  }
  updateToggles();
}

function updateToggles() {
  $("opt-sound").checked = opts.sound;
  $("opt-voice").checked = opts.voice;
  $("btn-mute").textContent = `Som: ${opts.sound ? "ligado" : "desligado"}`;
  $("btn-voice").textContent = `Voz: ${opts.voice ? "ligada" : "desligada"}`;
}

$("opt-sound").addEventListener("change", (e) => setSound(e.target.checked));
$("opt-voice").addEventListener("change", (e) => setVoice(e.target.checked));
$("opt-timer").addEventListener("change", (e) => {
  opts.timer = e.target.checked;
  setTimerText();
  if (!opts.timer) stopTimer();
});
$("btn-mute").addEventListener("click", () => setSound(!opts.sound));
$("btn-voice").addEventListener("click", () => setVoice(!opts.voice));

document.addEventListener("keydown", (e) => {
  if (!$("screen-game").classList.contains("active") || !S) return;
  const k = e.key.toLowerCase();
  if (k === "enter" && !$("feedback").classList.contains("hidden")) {
    $("btn-next").click();
    return;
  }
  const i = "abcd".indexOf(k);
  if (i >= 0 && !S.locked && S.cur.list[i] && !S.cur.list[i].hid) answer(i);
});

$("btn-next").addEventListener("click", () => {
  $("feedback").classList.add("hidden");
  loadRound();
});

$("btn-start").addEventListener("click", startGame);
$("btn-again").addEventListener("click", startGame);

// ---------- inicialização ----------
buildLadder();
updateToggles();
setTimerText();
hosts.forEach((h) => h.start());
// cortina sobe ao carregar (abertura do show)
setTimeout(() => $("curtain").classList.add("open"), 300);
