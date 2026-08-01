import { sfxGo, sfxShow, sfxTick, unlockAudio } from "../audio";
import { formatTime } from "../content";
import { navigate } from "../router";

type DoseMode = "time" | "reps";

interface ExerciseFace {
  id: string;
  name: string;
  detail: string;
  mode: DoseMode;
  /** Valid doses only — never absurd pairings like 5s plank */
  doses: number[];
  why: string;
}

/** Amber die — exercise. Each face locks the dose type + allowed values. */
const EXERCISES: ExerciseFace[] = [
  {
    id: "plank",
    name: "Plank Hold",
    detail: "Forearms or high plank. Squeeze glutes, breathe steady.",
    mode: "time",
    doses: [20, 30, 40, 45, 60, 90],
    why: "Holds need real time — never under 20 seconds.",
  },
  {
    id: "guard",
    name: "High Guard March",
    detail: "Tight guard, soft bounce or march in place.",
    mode: "time",
    doses: [30, 40, 45, 60, 75, 90],
    why: "Guard work is a clock drill — enough time to settle in.",
  },
  {
    id: "shadow",
    name: "Shadow 1-2 Flow",
    detail: "Continuous jab-cross. Stay light, reset stance often.",
    mode: "time",
    doses: [30, 45, 60, 75, 90],
    why: "Flow rounds run on the clock, not single reps.",
  },
  {
    id: "burpee",
    name: "Burpee + 1-2",
    detail: "Burpee, stand tall, sharp jab-cross. That’s one.",
    mode: "reps",
    doses: [6, 8, 10, 12, 15],
    why: "Explosive work is counted in clean reps.",
  },
  {
    id: "pushup",
    name: "Push-up to Jab",
    detail: "Push-up, then jab at the top. Full lockout each rep.",
    mode: "reps",
    doses: [8, 10, 12, 15, 20],
    why: "Strength moves use reps — short timers don’t fit.",
  },
  {
    id: "sitout",
    name: "Sit-Throughs",
    detail: "From beast stance, sit-through each side = 1 rep.",
    mode: "reps",
    doses: [8, 10, 12, 16, 20],
    why: "Agility drills score by clean repetitions.",
  },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function formatDose(mode: DoseMode, value: number): string {
  return mode === "time" ? `${value} sec` : `${value} reps`;
}

function formatDoseShort(mode: DoseMode, value: number): string {
  return mode === "time" ? `${value}s` : `×${value}`;
}

export function mountDice(root: HTMLElement): () => void {
  let rolling = false;
  let exercise: ExerciseFace | null = null;
  let dose = 0;
  let left = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const cleanups: Array<() => void> = [];

  function clearTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function paintIdle(result = false) {
    const has = result && exercise;
    root.innerHTML = `
      <div class="screen">
        <div class="topbar">
          <button type="button" class="btn-back" data-back>← Coach Hub</button>
          <h1 class="hub__brand" style="font-size:clamp(2rem,6vw,3rem);margin:0">Dice Call</h1>
          <span></span>
        </div>
        <p class="dice-lead">
          Two dice for the class: <strong style="color:var(--spark)">amber = exercise</strong>,
          <strong style="color:var(--glove)">red = dose</strong>.
          Dose only rolls values that fit the exercise — no 5‑second planks.
        </p>
        <div class="dice-stage">
          <div class="die die--exercise ${rolling ? "is-rolling" : ""}" data-die="exercise">
            <span class="die__label">Exercise</span>
            <span class="die__face">${has ? exercise!.name : "—"}</span>
          </div>
          <div class="die die--dose ${rolling ? "is-rolling" : ""}" data-die="dose">
            <span class="die__label">Dose</span>
            <span class="die__face">${has ? formatDoseShort(exercise!.mode, dose) : "—"}</span>
            <span class="die__sub">${has ? (exercise!.mode === "time" ? "TIME" : "REPS") : "fits the move"}</span>
          </div>
        </div>
        ${
          has
            ? `<div class="dice-result">
                <p class="phase-label">Class does</p>
                <h2 class="giant-title">${formatDose(exercise!.mode, dose)}</h2>
                <h3 class="dice-move">${exercise!.name}</h3>
                <p class="giant-detail">${exercise!.detail}</p>
                <p class="dice-why">${exercise!.why}</p>
              </div>`
            : `<div class="dice-result dice-result--empty">
                <p class="giant-detail">Roll for a finisher, warm-up spike, or team challenge.</p>
              </div>`
        }
        <div class="coach-bar">
          <button type="button" class="btn-main" data-roll ${rolling ? "disabled" : ""}>${has ? "Roll Again" : "Roll the Dice"}</button>
          ${
            has
              ? exercise!.mode === "time"
                ? `<button type="button" class="btn-soft" data-go>Start Timer</button>`
                : `<button type="button" class="btn-soft" data-go>Mark Done</button>`
              : ""
          }
          <p class="hint-keys">Space / Enter = roll · Esc = hub</p>
        </div>
      </div>
    `;
    bindChrome();
  }

  function bindChrome() {
    root.querySelector("[data-back]")?.addEventListener("click", () => {
      clearTimer();
      navigate({ name: "home" });
    });
    root.querySelector("[data-roll]")?.addEventListener("click", () => void roll());
    root.querySelector("[data-go]")?.addEventListener("click", () => {
      if (!exercise) return;
      if (exercise.mode === "time") startTimer();
      else {
        sfxGo();
        // quick flash for reps complete / ready
      }
    });
  }

  async function roll() {
    if (rolling) return;
    unlockAudio();
    clearTimer();
    rolling = true;
    paintIdle(false);

    const exerciseEl = root.querySelector("[data-die='exercise'] .die__face");
    const doseEl = root.querySelector("[data-die='dose'] .die__face");
    const doseSub = root.querySelector("[data-die='dose'] .die__sub");

    // Animate scramble — exercise first drives dose legality
    const scrambleMs = 900;
    const step = 70;
    let t = 0;
    sfxShow();
    await new Promise<void>((resolve) => {
      const id = setInterval(() => {
        t += step;
        const tempEx = pick(EXERCISES);
        if (exerciseEl) exerciseEl.textContent = tempEx.name;
        const tempDose = pick(tempEx.doses);
        if (doseEl) doseEl.textContent = formatDoseShort(tempEx.mode, tempDose);
        if (doseSub) doseSub.textContent = tempEx.mode === "time" ? "TIME" : "REPS";
        if (t >= scrambleMs) {
          clearInterval(id);
          resolve();
        }
      }, step);
    });

    // Resolve with logic: exercise → allowed dose pool only
    exercise = pick(EXERCISES);
    dose = pick(exercise.doses);
    rolling = false;
    sfxGo();
    paintIdle(true);
  }

  function startTimer() {
    if (!exercise || exercise.mode !== "time") return;
    unlockAudio();
    left = dose;
    sfxGo();
    root.innerHTML = `
      <div class="screen stage">
        <div class="stage__meta">
          <button type="button" class="btn-back" data-back>← Dice</button>
          <div class="badge"><span class="badge__label">Dice Call</span><span class="badge__value badge__value--hot">Timed</span></div>
        </div>
        <div class="stage__center">
          <p class="phase-label">${exercise.name}</p>
          <h2 class="giant-title">${formatDose(exercise.mode, dose)}</h2>
          <p class="giant-detail">${exercise.detail}</p>
          <div class="clock" data-clock>${formatTime(left)}</div>
        </div>
        <div class="coach-bar">
          <button type="button" class="btn-main" data-skip>Skip / Done</button>
          <button type="button" class="btn-soft" data-reroll>Roll Again</button>
          <p class="hint-keys">Space = done · Esc = hub</p>
        </div>
      </div>
    `;
    root.querySelector("[data-back]")?.addEventListener("click", () => {
      clearTimer();
      paintIdle(true);
    });
    root.querySelector("[data-skip]")?.addEventListener("click", () => {
      clearTimer();
      paintIdle(true);
    });
    root.querySelector("[data-reroll]")?.addEventListener("click", () => {
      clearTimer();
      void roll();
    });

    clearTimer();
    timer = setInterval(() => {
      left -= 1;
      const el = root.querySelector<HTMLElement>("[data-clock]");
      if (el) {
        el.textContent = formatTime(left);
        el.classList.toggle("is-low", left <= 10);
      }
      if (left <= 3 && left > 0) sfxTick();
      if (left <= 0) {
        clearTimer();
        sfxGo();
        paintIdle(true);
      }
    }, 1000);
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      clearTimer();
      navigate({ name: "home" });
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (timer) {
        clearTimer();
        paintIdle(true);
        return;
      }
      void roll();
    }
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  paintIdle(false);
  return () => {
    clearTimer();
    cleanups.forEach((fn) => fn());
  };
}
