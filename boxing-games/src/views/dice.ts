import { sfxDiceClack, sfxDiceLand, sfxGo, sfxTick, unlockAudio } from "../audio";
import { formatTime } from "../content";
import { navigate } from "../router";

type DoseMode = "time" | "reps";
type Face = 1 | 2 | 3 | 4 | 5 | 6;

interface ExerciseFace {
  face: Face;
  name: string;
  detail: string;
  mode: DoseMode;
  dosesByFace: Record<Face, number>;
}

const EXERCISES: Record<Face, ExerciseFace> = {
  1: {
    face: 1,
    name: "Plank",
    detail: "Forearm plank. Straight line from head to heels. Breathe.",
    mode: "time",
    dosesByFace: { 1: 20, 2: 30, 3: 40, 4: 45, 5: 60, 6: 90 },
  },
  2: {
    face: 2,
    name: "Jump Rope",
    detail: "Easy bounce or basic skips. Soft landings, relaxed shoulders.",
    mode: "time",
    dosesByFace: { 1: 30, 2: 40, 3: 45, 4: 60, 5: 75, 6: 90 },
  },
  3: {
    face: 3,
    name: "Shadow Boxing",
    detail: "Move and throw: jabs, crosses, hooks. Stay light on your feet.",
    mode: "time",
    dosesByFace: { 1: 30, 2: 40, 3: 45, 4: 60, 5: 75, 6: 90 },
  },
  4: {
    face: 4,
    name: "Push-ups",
    detail: "Chest to the floor, full lockout at the top. Clean form.",
    mode: "reps",
    dosesByFace: { 1: 6, 2: 8, 3: 10, 4: 12, 5: 15, 6: 20 },
  },
  5: {
    face: 5,
    name: "Squats",
    detail: "Feet shoulder-width. Sit back, knees track toes, stand tall.",
    mode: "reps",
    dosesByFace: { 1: 8, 2: 10, 3: 12, 4: 15, 5: 20, 6: 25 },
  },
  6: {
    face: 6,
    name: "Burpees",
    detail: "Down to the floor, chest touches, jump up. That’s one.",
    mode: "reps",
    dosesByFace: { 1: 5, 2: 6, 3: 8, 4: 10, 5: 12, 6: 15 },
  },
};

const FACES: Face[] = [1, 2, 3, 4, 5, 6];

function rollFace(): Face {
  return FACES[Math.floor(Math.random() * FACES.length)]!;
}

function formatDose(mode: DoseMode, value: number): string {
  return mode === "time" ? `${value} sec` : `${value} reps`;
}

function formatDoseShort(mode: DoseMode, value: number): string {
  return mode === "time" ? `${value}s` : `×${value}`;
}

function doseChart(ex: ExerciseFace): string {
  return FACES.map((f) => `${f}→${formatDoseShort(ex.mode, ex.dosesByFace[f])}`).join(" · ");
}

/** Classic 3×3 pip face for a real die look. */
function dieHTML(kind: "exercise" | "dose", face: Face | null, rolling: boolean): string {
  const label = kind === "exercise" ? "Amber" : "Red";
  const sub = kind === "exercise" ? "Exercise" : "Dose";
  const faceAttr = face ?? 1;
  const blank = face == null && !rolling;
  return `
    <div class="die-wrap">
      <span class="die-caption">${label} · ${sub}</span>
      <div
        class="die die--${kind} ${rolling ? "is-rolling" : ""} ${blank ? "is-blank" : ""} ${face && !rolling ? "is-landed" : ""}"
        data-die="${kind}"
        data-face="${faceAttr}"
        aria-label="${label} die${face ? `, ${face}` : ""}"
      >
        <div class="die__face">
          <div class="die__pips" aria-hidden="true">
            <span class="pip"></span><span class="pip"></span><span class="pip"></span>
            <span class="pip"></span><span class="pip"></span><span class="pip"></span>
            <span class="pip"></span><span class="pip"></span><span class="pip"></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setDieFace(root: HTMLElement, kind: "exercise" | "dose", face: Face) {
  const el = root.querySelector<HTMLElement>(`[data-die="${kind}"]`);
  if (!el) return;
  el.dataset.face = String(face);
  el.classList.remove("is-blank");
}

export function mountDice(root: HTMLElement): () => void {
  let rolling = false;
  let exerciseFace: Face | null = null;
  let doseFace: Face | null = null;
  let left = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const cleanups: Array<() => void> = [];

  function clearTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function current() {
    if (exerciseFace == null || doseFace == null) return null;
    const exercise = EXERCISES[exerciseFace];
    const dose = exercise.dosesByFace[doseFace];
    return { exercise, dose, exerciseFace, doseFace };
  }

  function legendHTML() {
    return `
      <div class="dice-key">
        <div class="dice-key__col">
          <p class="dice-key__title" style="color:var(--spark)">Amber = Exercise</p>
          <ul>
            ${FACES.map((f) => {
              const ex = EXERCISES[f];
              return `<li><span class="dice-key__n">${f}</span> ${ex.name} <em>(${ex.mode})</em></li>`;
            }).join("")}
          </ul>
        </div>
        <div class="dice-key__col">
          <p class="dice-key__title" style="color:var(--glove)">Red = Dose face</p>
          <p class="dice-key__note">Same pips 1–6, but the chart changes with the exercise (time vs reps).</p>
          ${
            exerciseFace
              ? `<p class="dice-key__active">${EXERCISES[exerciseFace].name} chart:<br/><strong>${doseChart(EXERCISES[exerciseFace])}</strong></p>`
              : `<p class="dice-key__note">Roll first — then you’ll see that exercise’s 1–6 dose chart.</p>`
          }
        </div>
      </div>
    `;
  }

  function paintIdle(showResult = false) {
    const c = showResult ? current() : null;
    root.innerHTML = `
      <div class="screen">
        <div class="topbar">
          <button type="button" class="btn-back" data-back>← Coach Hub</button>
          <h1 class="hub__brand" style="font-size:clamp(2rem,6vw,3rem);margin:0">Dice Call</h1>
          <span></span>
        </div>
        <p class="dice-lead">
          Real dice faces (pips 1–6).
          <strong style="color:var(--spark)">Amber → exercise</strong>.
          <strong style="color:var(--glove)">Red → dose</strong> from that exercise’s chart.
        </p>
        <div class="dice-stage ${rolling ? "is-rolling" : ""}">
          ${dieHTML("exercise", c ? c.exerciseFace : exerciseFace, rolling)}
          ${dieHTML("dose", c ? c.doseFace : doseFace, rolling)}
        </div>
        ${
          c
            ? `<div class="dice-result">
                <p class="phase-label">Connection</p>
                <p class="dice-link">
                  Amber <strong>${c.exerciseFace}</strong> → ${c.exercise.name}
                  &nbsp;·&nbsp;
                  Red <strong>${c.doseFace}</strong> → ${formatDose(c.exercise.mode, c.dose)}
                </p>
                <h2 class="giant-title">${formatDose(c.exercise.mode, c.dose)}</h2>
                <h3 class="dice-move">${c.exercise.name}</h3>
                <p class="giant-detail">${c.exercise.detail}</p>
              </div>`
            : `<div class="dice-result dice-result--empty">
                <p class="giant-detail">Roll — read the pips, then call it to the class.</p>
              </div>`
        }
        ${legendHTML()}
        <div class="coach-bar">
          <button type="button" class="btn-main" data-roll ${rolling ? "disabled" : ""}>${c ? "Roll Again" : "Roll the Dice"}</button>
          ${
            c
              ? c.exercise.mode === "time"
                ? `<button type="button" class="btn-soft" data-go>Start Timer</button>`
                : `<button type="button" class="btn-soft" data-go>Got It</button>`
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
      const c = current();
      if (!c) return;
      if (c.exercise.mode === "time") startTimer();
      else sfxDiceLand();
    });
  }

  async function roll() {
    if (rolling) return;
    unlockAudio();
    clearTimer();
    rolling = true;
    exerciseFace = null;
    doseFace = null;
    paintIdle(false);

    const scrambleMs = 1100;
    const step = 90;
    let t = 0;
    let clackEvery = 0;

    await new Promise<void>((resolve) => {
      const id = setInterval(() => {
        t += step;
        clackEvery += 1;
        setDieFace(root, "exercise", rollFace());
        setDieFace(root, "dose", rollFace());
        // Soft clacks — not every frame, so it doesn't buzz
        if (clackEvery % 2 === 0) sfxDiceClack();
        if (t >= scrambleMs) {
          clearInterval(id);
          resolve();
        }
      }, step);
    });

    exerciseFace = rollFace();
    doseFace = rollFace();
    rolling = false;
    sfxDiceLand();
    // tiny second settle for the other die
    setTimeout(() => sfxDiceClack(), 70);
    paintIdle(true);
  }

  function startTimer() {
    const c = current();
    if (!c || c.exercise.mode !== "time") return;
    unlockAudio();
    left = c.dose;
    sfxGo();
    root.innerHTML = `
      <div class="screen stage">
        <div class="stage__meta">
          <button type="button" class="btn-back" data-back>← Dice</button>
          <div class="badge"><span class="badge__label">Amber ${c.exerciseFace}</span><span class="badge__value">${c.exercise.name}</span></div>
          <div class="badge"><span class="badge__label">Red ${c.doseFace}</span><span class="badge__value badge__value--hot">${formatDose(c.exercise.mode, c.dose)}</span></div>
        </div>
        <div class="stage__center">
          <p class="phase-label">${c.exercise.name}</p>
          <h2 class="giant-title">${formatDose(c.exercise.mode, c.dose)}</h2>
          <p class="giant-detail">${c.exercise.detail}</p>
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
        sfxDiceLand();
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
