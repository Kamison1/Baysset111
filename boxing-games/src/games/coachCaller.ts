import { sfxGo, sfxShow, sfxTick, unlockAudio } from "../audio";
import {
  ALL_PUNCHES,
  BASIC_PUNCHES,
  CLASSIC_COMBOS,
  PUNCHES,
  type PunchId,
  randomCombo,
} from "../punches";
import { atmosphereHTML, backButton, navigate } from "../router";

type Mode = "random" | "classic";

export function mountCoachCaller(root: HTMLElement): () => void {
  let mode: Mode = "random";
  let length = 3;
  let useSix = false;
  let throwSeconds = 8;
  let combo: PunchId[] = [];
  let comboName = "";
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let left = 0;
  const cleanups: Array<() => void> = [];

  root.innerHTML = `
    ${atmosphereHTML()}
    <div class="screen game-shell">
      <div class="game-top">
        ${backButton()}
        <h1 class="game-title">Coach Caller</h1>
        <div class="stats-row">
          <div class="stat"><span class="stat__label">Throw</span><span class="stat__value" data-stat="throw">${throwSeconds}s</span></div>
          <div class="stat"><span class="stat__label">Length</span><span class="stat__value" data-stat="len">${length}</span></div>
        </div>
      </div>
      <div class="game-stage">
        <div class="setup-panel" data-setup>
          <p class="hint">Project this on the gym screen. Combos appear big — the class throws them on the coach's count.</p>
          <div class="difficulty-pills">
            <button type="button" class="pill is-on" data-mode="random">Random</button>
            <button type="button" class="pill" data-mode="classic">Classic Combos</button>
          </div>
          <div class="difficulty-pills" data-len-row>
            ${[2, 3, 4, 5].map((n) => `<button type="button" class="pill${n === 3 ? " is-on" : ""}" data-len="${n}">${n} punches</button>`).join("")}
          </div>
          <div class="difficulty-pills">
            <button type="button" class="pill is-on" data-pads="4">1–4</button>
            <button type="button" class="pill" data-pads="6">1–6</button>
          </div>
          <div class="difficulty-pills">
            ${[5, 8, 12].map((n) => `<button type="button" class="pill${n === 8 ? " is-on" : ""}" data-sec="${n}">${n}s throw</button>`).join("")}
          </div>
          <button type="button" class="btn-primary" data-action="go">Call Next Combo</button>
        </div>
        <div class="caller-display" data-play hidden>
          <p class="roulette-card__label" data-name>Combo</p>
          <div class="caller-combo" data-combo></div>
          <div class="caller-timer" data-timer>8</div>
          <p class="hint" data-phase>Get ready…</p>
          <div class="controls-row">
            <button type="button" class="btn-primary" data-action="next">Next Combo</button>
            <button type="button" class="btn-ghost" data-action="pause">Pause</button>
            <button type="button" class="btn-ghost" data-action="setup">Settings</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const setup = root.querySelector<HTMLElement>("[data-setup]")!;
  const play = root.querySelector<HTMLElement>("[data-play]")!;
  const comboEl = root.querySelector<HTMLElement>("[data-combo]")!;
  const timerEl = root.querySelector<HTMLElement>("[data-timer]")!;
  const phaseEl = root.querySelector<HTMLElement>("[data-phase]")!;
  const nameEl = root.querySelector<HTMLElement>("[data-name]")!;

  function setStat(name: string, value: string | number) {
    const el = root.querySelector(`[data-stat="${name}"]`);
    if (el) el.textContent = String(value);
  }

  function clearCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = null;
  }

  function pickCombo() {
    if (mode === "classic") {
      const pick = CLASSIC_COMBOS[Math.floor(Math.random() * CLASSIC_COMBOS.length)]!;
      combo = [...pick.punches];
      comboName = pick.name;
    } else {
      const pool = useSix ? ALL_PUNCHES : BASIC_PUNCHES;
      combo = randomCombo(length, pool);
      comboName = "Random Call";
    }
  }

  function renderCombo() {
    nameEl.textContent = comboName;
    comboEl.innerHTML = combo
      .map((id, i) => {
        const p = PUNCHES[id];
        return `<div class="caller-punch" style="--pad-color:${p.color};animation-delay:${i * 0.06}s">${id}<span>${p.short}</span></div>`;
      })
      .join("");
  }

  function startThrowWindow() {
    clearCountdown();
    left = throwSeconds;
    timerEl.textContent = String(left);
    phaseEl.textContent = "THROW IT!";
    sfxGo();

    countdownTimer = setInterval(() => {
      left -= 1;
      timerEl.textContent = String(Math.max(0, left));
      if (left <= 3 && left > 0) sfxTick();
      if (left <= 0) {
        clearCountdown();
        phaseEl.textContent = "Rest — next combo coming";
        timerEl.textContent = "✓";
        setTimeout(() => {
          if (!play.hidden) callCombo();
        }, 1200);
      }
    }, 1000);
  }

  function callCombo() {
    unlockAudio();
    setup.hidden = true;
    play.hidden = false;
    pickCombo();
    renderCombo();
    phaseEl.textContent = "Read it…";
    timerEl.textContent = "—";
    sfxShow();
    setTimeout(() => {
      if (!play.hidden) startThrowWindow();
    }, 900);
  }

  function showSetup() {
    clearCountdown();
    play.hidden = true;
    setup.hidden = false;
  }

  // Settings
  root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((btn) => {
    const handler = () => {
      mode = btn.dataset.mode as Mode;
      root.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("is-on", b === btn));
      const lenRow = root.querySelector<HTMLElement>("[data-len-row]");
      if (lenRow) lenRow.style.opacity = mode === "classic" ? "0.35" : "1";
    };
    btn.addEventListener("click", handler);
    cleanups.push(() => btn.removeEventListener("click", handler));
  });

  root.querySelectorAll<HTMLButtonElement>("[data-len]").forEach((btn) => {
    const handler = () => {
      length = Number(btn.dataset.len);
      setStat("len", length);
      root.querySelectorAll("[data-len]").forEach((b) => b.classList.toggle("is-on", b === btn));
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

  root.querySelectorAll<HTMLButtonElement>("[data-sec]").forEach((btn) => {
    const handler = () => {
      throwSeconds = Number(btn.dataset.sec);
      setStat("throw", `${throwSeconds}s`);
      root.querySelectorAll("[data-sec]").forEach((b) => b.classList.toggle("is-on", b === btn));
    };
    btn.addEventListener("click", handler);
    cleanups.push(() => btn.removeEventListener("click", handler));
  });

  const go = () => callCombo();
  const next = () => callCombo();
  const pause = () => {
    clearCountdown();
    phaseEl.textContent = "Paused — tap Next when ready";
  };
  const toSetup = () => showSetup();

  root.querySelector('[data-action="go"]')!.addEventListener("click", go);
  root.querySelector('[data-action="next"]')!.addEventListener("click", next);
  root.querySelector('[data-action="pause"]')!.addEventListener("click", pause);
  root.querySelector('[data-action="setup"]')!.addEventListener("click", toSetup);
  cleanups.push(() => {
    root.querySelector('[data-action="go"]')?.removeEventListener("click", go);
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") navigate({ name: "home" });
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (play.hidden) callCombo();
      else callCombo();
    }
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  root.querySelector("[data-nav]")?.addEventListener("click", () => navigate({ name: "home" }));

  return () => {
    clearCountdown();
    cleanups.forEach((fn) => fn());
  };
}
