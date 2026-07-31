import { sfxGo, sfxTick, unlockAudio } from "../audio";
import { DRILLS, formatTime } from "../punches";
import { atmosphereHTML, backButton, navigate } from "../router";

export function mountRoundRoulette(root: HTMLElement): () => void {
  let workSec = 60;
  let restSec = 30;
  let rounds = 6;
  let currentRound = 0;
  let phase: "idle" | "work" | "rest" | "done" = "idle";
  let left = 0;
  let totalPhase = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let drillIndex = 0;
  const cleanups: Array<() => void> = [];

  root.innerHTML = `
    ${atmosphereHTML()}
    <div class="screen game-shell">
      <div class="game-top">
        ${backButton()}
        <h1 class="game-title">Round Roulette</h1>
        <div class="stats-row">
          <div class="stat"><span class="stat__label">Round</span><span class="stat__value" data-stat="round">—</span></div>
          <div class="stat"><span class="stat__label">Phase</span><span class="stat__value stat__value--accent" data-stat="phase">Ready</span></div>
        </div>
      </div>
      <div class="game-stage">
        <div class="setup-panel" data-setup>
          <p class="hint">Each round spins a fresh drill for the class. Set your work / rest, then let the roulette run the session.</p>
          <div class="difficulty-pills">
            <button type="button" class="pill" data-work="45">45s work</button>
            <button type="button" class="pill is-on" data-work="60">60s work</button>
            <button type="button" class="pill" data-work="90">90s work</button>
          </div>
          <div class="difficulty-pills">
            <button type="button" class="pill" data-rest="15">15s rest</button>
            <button type="button" class="pill is-on" data-rest="30">30s rest</button>
            <button type="button" class="pill" data-rest="45">45s rest</button>
          </div>
          <div class="difficulty-pills">
            <button type="button" class="pill" data-rounds="4">4 rounds</button>
            <button type="button" class="pill is-on" data-rounds="6">6 rounds</button>
            <button type="button" class="pill" data-rounds="8">8 rounds</button>
          </div>
          <button type="button" class="btn-primary" data-action="start">Spin Round 1</button>
        </div>
        <div data-play hidden style="width:min(100%,520px)">
          <div class="timer-ring" data-ring>
            <span class="timer-ring__value" data-clock>1:00</span>
          </div>
          <div class="roulette-card">
            <p class="roulette-card__label" data-label>Work Round</p>
            <h2 class="roulette-card__drill" data-drill>—</h2>
            <p class="roulette-card__detail" data-detail>—</p>
            <div class="controls-row">
              <button type="button" class="btn-ghost" data-action="skip">Skip / Next</button>
              <button type="button" class="btn-ghost" data-action="stop">End Session</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const setup = root.querySelector<HTMLElement>("[data-setup]")!;
  const play = root.querySelector<HTMLElement>("[data-play]")!;
  const ring = root.querySelector<HTMLElement>("[data-ring]")!;
  const clock = root.querySelector<HTMLElement>("[data-clock]")!;
  const label = root.querySelector<HTMLElement>("[data-label]")!;
  const drillEl = root.querySelector<HTMLElement>("[data-drill]")!;
  const detailEl = root.querySelector<HTMLElement>("[data-detail]")!;

  function setStat(name: string, value: string | number) {
    const el = root.querySelector(`[data-stat="${name}"]`);
    if (el) el.textContent = String(value);
  }

  function clearTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function pickDrill() {
    drillIndex = Math.floor(Math.random() * DRILLS.length);
    const d = DRILLS[drillIndex]!;
    drillEl.textContent = d.title;
    detailEl.textContent = d.detail;
    // spin animation
    drillEl.style.animation = "none";
    void drillEl.offsetWidth;
    drillEl.style.animation = "countdownPop 0.45s var(--ease-punch)";
  }

  function updateClock() {
    clock.textContent = formatTime(left);
    const progress = totalPhase > 0 ? left / totalPhase : 0;
    ring.style.setProperty("--progress", String(progress));
  }

  function finishSession() {
    clearTimer();
    phase = "done";
    setStat("phase", "Done");
    label.textContent = "Session Complete";
    drillEl.textContent = "Great work, class!";
    detailEl.textContent = `You finished ${currentRound} rounds. Water up.`;
    clock.textContent = "✓";
    ring.style.setProperty("--progress", "0");
  }

  function startRest() {
    phase = "rest";
    setStat("phase", "Rest");
    label.textContent = "Rest";
    drillEl.textContent = "Breathe. Shake it out.";
    detailEl.textContent = "Next drill spins when the rest ends.";
    left = restSec;
    totalPhase = restSec;
    updateClock();
    sfxTick();

    clearTimer();
    timer = setInterval(() => {
      left -= 1;
      updateClock();
      if (left <= 3 && left > 0) sfxTick();
      if (left <= 0) {
        if (currentRound >= rounds) finishSession();
        else startWork();
      }
    }, 1000);
  }

  function startWork() {
    unlockAudio();
    currentRound += 1;
    phase = "work";
    setStat("round", `${currentRound}/${rounds}`);
    setStat("phase", "Work");
    label.textContent = `Work — Round ${currentRound}`;
    pickDrill();
    left = workSec;
    totalPhase = workSec;
    updateClock();
    sfxGo();
    play.hidden = false;
    setup.hidden = true;

    clearTimer();
    timer = setInterval(() => {
      left -= 1;
      updateClock();
      if (left <= 3 && left > 0) sfxTick();
      if (left <= 0) {
        if (currentRound >= rounds) finishSession();
        else startRest();
      }
    }, 1000);
  }

  function startSession() {
    currentRound = 0;
    startWork();
  }

  function stopSession() {
    clearTimer();
    phase = "idle";
    play.hidden = true;
    setup.hidden = false;
    setStat("round", "—");
    setStat("phase", "Ready");
  }

  function skip() {
    if (phase === "work") {
      if (currentRound >= rounds) finishSession();
      else startRest();
    } else if (phase === "rest") {
      startWork();
    } else if (phase === "done") {
      stopSession();
    }
  }

  root.querySelectorAll<HTMLButtonElement>("[data-work]").forEach((btn) => {
    const handler = () => {
      workSec = Number(btn.dataset.work);
      root.querySelectorAll("[data-work]").forEach((b) => b.classList.toggle("is-on", b === btn));
    };
    btn.addEventListener("click", handler);
    cleanups.push(() => btn.removeEventListener("click", handler));
  });

  root.querySelectorAll<HTMLButtonElement>("[data-rest]").forEach((btn) => {
    const handler = () => {
      restSec = Number(btn.dataset.rest);
      root.querySelectorAll("[data-rest]").forEach((b) => b.classList.toggle("is-on", b === btn));
    };
    btn.addEventListener("click", handler);
    cleanups.push(() => btn.removeEventListener("click", handler));
  });

  root.querySelectorAll<HTMLButtonElement>("[data-rounds]").forEach((btn) => {
    const handler = () => {
      rounds = Number(btn.dataset.rounds);
      root.querySelectorAll("[data-rounds]").forEach((b) => b.classList.toggle("is-on", b === btn));
    };
    btn.addEventListener("click", handler);
    cleanups.push(() => btn.removeEventListener("click", handler));
  });

  root.querySelector('[data-action="start"]')!.addEventListener("click", startSession);
  root.querySelector('[data-action="skip"]')!.addEventListener("click", skip);
  root.querySelector('[data-action="stop"]')!.addEventListener("click", stopSession);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") navigate({ name: "home" });
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (phase === "idle") startSession();
      else skip();
    }
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  root.querySelector("[data-nav]")?.addEventListener("click", () => navigate({ name: "home" }));

  return () => {
    clearTimer();
    cleanups.forEach((fn) => fn());
  };
}
