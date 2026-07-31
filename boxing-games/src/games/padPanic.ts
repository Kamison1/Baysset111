import { sfxCorrect, sfxGo, sfxHit, sfxMiss, sfxTick, unlockAudio } from "../audio";
import { ALL_PUNCHES, BASIC_PUNCHES, PUNCHES, type PunchId, randomPunch } from "../punches";
import { atmosphereHTML, backButton, navigate } from "../router";

type Difficulty = "easy" | "normal" | "hard";

const WINDOW_MS: Record<Difficulty, number> = {
  easy: 1600,
  normal: 1100,
  hard: 750,
};

export function mountPadPanic(root: HTMLElement): () => void {
  let running = false;
  let score = 0;
  let streak = 0;
  let best = Number(localStorage.getItem("ringcall-panic-best") || "0");
  let hits = 0;
  let misses = 0;
  let current: PunchId | null = null;
  let difficulty: Difficulty = "normal";
  let useSix = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let roundTimer: ReturnType<typeof setInterval> | null = null;
  let timeLeft = 45;
  const cleanups: Array<() => void> = [];

  root.innerHTML = `
    ${atmosphereHTML()}
    <div class="screen game-shell">
      <div class="game-top">
        ${backButton()}
        <h1 class="game-title">Pad Panic</h1>
        <div class="stats-row">
          <div class="stat"><span class="stat__label">Score</span><span class="stat__value" data-stat="score">0</span></div>
          <div class="stat"><span class="stat__label">Streak</span><span class="stat__value stat__value--accent" data-stat="streak">0</span></div>
          <div class="stat"><span class="stat__label">Time</span><span class="stat__value" data-stat="time">0:45</span></div>
          <div class="stat"><span class="stat__label">Best</span><span class="stat__value stat__value--ok" data-stat="best">${best}</span></div>
        </div>
      </div>
      <div class="game-stage">
        <div class="setup-panel" data-setup>
          <p class="hint">Lights flash on a pad — smash it before it fades. Great for warm-ups and reaction rounds.</p>
          <div class="difficulty-pills" data-diff>
            <button type="button" class="pill" data-d="easy">Easy</button>
            <button type="button" class="pill is-on" data-d="normal">Normal</button>
            <button type="button" class="pill" data-d="hard">Hard</button>
          </div>
          <div class="difficulty-pills">
            <button type="button" class="pill is-on" data-pads="4">4 Pads</button>
            <button type="button" class="pill" data-pads="6">6 Pads</button>
          </div>
          <button type="button" class="btn-primary" data-action="start">Start 45s Round</button>
        </div>
        <div data-play hidden>
          <p class="hint" data-hint>Hit the lit pad!</p>
          <p class="big-message" data-msg hidden></p>
          <div class="pads pads--five" data-padgrid></div>
          <div class="controls-row" style="margin-top:1.25rem">
            <button type="button" class="btn-ghost" data-action="stop">End Round</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const setup = root.querySelector<HTMLElement>("[data-setup]")!;
  const play = root.querySelector<HTMLElement>("[data-play]")!;
  const padGrid = root.querySelector<HTMLElement>("[data-padgrid]")!;
  const hint = root.querySelector<HTMLElement>("[data-hint]")!;
  const msg = root.querySelector<HTMLElement>("[data-msg]")!;

  function pool(): PunchId[] {
    return useSix ? ALL_PUNCHES : BASIC_PUNCHES;
  }

  function renderPads() {
    const ids = pool();
    padGrid.className = useSix ? "pads pads--five" : "pads";
    padGrid.innerHTML = ids
      .map(
        (id) => `
        <button type="button" class="pad" data-punch="${id}" style="--pad-color:${PUNCHES[id].color}">
          ${id}<span class="pad__sub">${PUNCHES[id].short}</span>
        </button>`,
      )
      .join("");

    padGrid.querySelectorAll<HTMLButtonElement>("[data-punch]").forEach((pad) => {
      pad.addEventListener("click", () => onHit(pad.dataset.punch as PunchId));
    });
  }

  function setStat(name: string, value: string | number) {
    const el = root.querySelector(`[data-stat="${name}"]`);
    if (el) el.textContent = String(value);
  }

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function clearRound() {
    if (roundTimer) clearInterval(roundTimer);
    roundTimer = null;
  }

  function lightNext() {
    clearTimer();
    const pads = [...padGrid.querySelectorAll<HTMLButtonElement>("[data-punch]")];
    pads.forEach((p) => p.classList.remove("is-lit", "is-dim"));
    current = randomPunch(pool());
    const lit = pads.find((p) => p.dataset.punch === current);
    lit?.classList.add("is-lit");
    pads.filter((p) => p !== lit).forEach((p) => p.classList.add("is-dim"));
    sfxTick();

    timer = setTimeout(() => {
      if (!running) return;
      misses += 1;
      streak = 0;
      setStat("streak", streak);
      sfxMiss();
      hint.textContent = "Too slow!";
      lightNext();
    }, WINDOW_MS[difficulty]);
  }

  function onHit(id: PunchId) {
    if (!running || !current) return;
    if (id === current) {
      clearTimer();
      hits += 1;
      streak += 1;
      const bonus = Math.min(streak, 8);
      score += 10 + bonus * 2;
      setStat("score", score);
      setStat("streak", streak);
      sfxHit();
      sfxCorrect();
      hint.textContent = streak >= 5 ? `${streak} streak!` : "Nice!";
      lightNext();
    } else {
      streak = 0;
      misses += 1;
      score = Math.max(0, score - 5);
      setStat("score", score);
      setStat("streak", streak);
      sfxMiss();
      hint.textContent = "Wrong pad!";
    }
  }

  function endRound() {
    running = false;
    clearTimer();
    clearRound();
    current = null;
    play.hidden = true;
    setup.hidden = false;
    if (score > best) {
      best = score;
      localStorage.setItem("ringcall-panic-best", String(best));
      setStat("best", best);
    }
    msg.hidden = false;
    msg.className = "big-message big-message--spark";
    msg.textContent = `${score} PTS`;
    // show summary in setup
    const summary = setup.querySelector("[data-summary]") || document.createElement("p");
    summary.setAttribute("data-summary", "");
    summary.className = "hint";
    summary.textContent = `Round over — ${hits} hits, ${misses} misses. Best: ${best}.`;
    if (!summary.parentElement) setup.insertBefore(summary, setup.querySelector("[data-action]")!);
  }

  function startRound() {
    unlockAudio();
    score = 0;
    streak = 0;
    hits = 0;
    misses = 0;
    timeLeft = 45;
    setStat("score", 0);
    setStat("streak", 0);
    setStat("time", "0:45");
    setup.hidden = true;
    play.hidden = false;
    msg.hidden = true;
    renderPads();
    running = true;
    hint.textContent = "GO!";
    sfxGo();
    lightNext();

    clearRound();
    roundTimer = setInterval(() => {
      timeLeft -= 1;
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      setStat("time", `${m}:${s.toString().padStart(2, "0")}`);
      if (timeLeft <= 0) endRound();
    }, 1000);
  }

  root.querySelectorAll<HTMLButtonElement>("[data-d]").forEach((btn) => {
    const handler = () => {
      difficulty = btn.dataset.d as Difficulty;
      root.querySelectorAll("[data-d]").forEach((b) => b.classList.toggle("is-on", b === btn));
    };
    btn.addEventListener("click", handler);
    cleanups.push(() => btn.removeEventListener("click", handler));
  });

  root.querySelectorAll<HTMLButtonElement>("[data-pads]").forEach((btn) => {
    const handler = () => {
      useSix = btn.dataset.pads === "6";
      root.querySelectorAll("[data-pads]").forEach((b) => b.classList.toggle("is-on", b === btn));
    };
    btn.addEventListener("click", handler);
    cleanups.push(() => btn.removeEventListener("click", handler));
  });

  const startBtn = root.querySelector('[data-action="start"]')!;
  const stopBtn = root.querySelector('[data-action="stop"]')!;
  startBtn.addEventListener("click", startRound);
  stopBtn.addEventListener("click", endRound);
  cleanups.push(() => startBtn.removeEventListener("click", startRound));
  cleanups.push(() => stopBtn.removeEventListener("click", endRound));

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate({ name: "home" });
      return;
    }
    const poolIds = pool();
    if (poolIds.includes(e.key as PunchId)) onHit(e.key as PunchId);
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  root.querySelector("[data-nav]")?.addEventListener("click", () => navigate({ name: "home" }));

  return () => {
    running = false;
    clearTimer();
    clearRound();
    cleanups.forEach((fn) => fn());
  };
}
