import { sfxEnd, sfxGo, sfxRest, sfxShow, sfxTick, unlockAudio } from "../audio";
import {
  BASIC,
  CLASS_TEMPLATES,
  PUNCHES,
  type ClassBlock,
  type ClassTemplate,
  type Combo,
  formatTime,
  pickClassic,
  randomCombo,
} from "../content";
import { navigate } from "../router";

export function mountSession(root: HTMLElement, templateId: string): () => void {
  const found = CLASS_TEMPLATES.find((t) => t.id === templateId);
  if (!found) {
    navigate({ name: "templates" });
    return () => {};
  }
  const template: ClassTemplate = found;

  let blockIndex = 0;
  let phase: "intro" | "work" | "rest" | "done" = "intro";
  let round = 0;
  let left = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let combo: Combo | null = null;
  let drillIdx = 0;
  const cleanups: Array<() => void> = [];

  function clearTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function block(): ClassBlock {
    return template.blocks[blockIndex]!;
  }

  function renderShell() {
    root.innerHTML = `
      <div class="screen stage" data-stage>
        <div class="stage__meta">
          <button type="button" class="btn-back" data-exit>← Exit Class</button>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
            <div class="badge"><span class="badge__label">Class</span><span class="badge__value">${template.title}</span></div>
            <div class="badge"><span class="badge__label">Block</span><span class="badge__value" data-block>—</span></div>
            <div class="badge"><span class="badge__label">Round</span><span class="badge__value badge__value--hot" data-round>—</span></div>
          </div>
        </div>
        <div class="stage__center" data-center></div>
        <div class="coach-bar" data-bar></div>
      </div>
    `;
    bindChrome();
  }

  function bindChrome() {
    root.querySelector("[data-exit]")?.addEventListener("click", () => {
      clearTimer();
      navigate({ name: "home" });
    });
  }

  function setBadge(name: string, value: string) {
    const el = root.querySelector(`[data-${name}]`);
    if (el) el.textContent = value;
  }

  function comboHTML(c: Combo) {
    return `
      <div class="combo-row">
        ${c.punches
          .map((id, i) => {
            const p = PUNCHES[id];
            return `<div class="punch" style="--punch:${p.color};animation-delay:${i * 0.05}s">
              <span class="punch__num">${id}</span>
              <span class="punch__name">${p.short}</span>
            </div>`;
          })
          .join("")}
      </div>
      <p class="cue">${c.cue ?? c.name}</p>
    `;
  }

  function showIntro() {
    phase = "intro";
    clearTimer();
    const b = block();
    setBadge("block", b.label);
    setBadge("round", "—");
    const center = root.querySelector("[data-center]")!;
    const bar = root.querySelector("[data-bar]")!;

    if (b.mode === "message" && b.id.includes("battle")) {
      center.innerHTML = `
        <p class="phase-label">Next up</p>
        <h2 class="giant-title">${b.label}</h2>
        <p class="giant-detail">${b.instruction}</p>
      `;
      bar.innerHTML = `
        <button type="button" class="btn-main" data-act="teams">Open Team Battle</button>
        <button type="button" class="btn-soft" data-act="skip">Skip / Next Block</button>
        <p class="hint-keys">Award points live, then come back and continue the class</p>
      `;
      bar.querySelector('[data-act="teams"]')?.addEventListener("click", () => navigate({ name: "teams" }));
      bar.querySelector('[data-act="skip"]')?.addEventListener("click", nextBlock);
      return;
    }

    if (b.mode === "message") {
      center.innerHTML = `
        <p class="phase-label">${blockIndex === template.blocks.length - 1 ? "Class complete" : "Coach note"}</p>
        <h2 class="giant-title">${b.label}</h2>
        <p class="giant-detail">${b.instruction}</p>
      `;
      bar.innerHTML =
        blockIndex === template.blocks.length - 1
          ? `<button type="button" class="btn-main" data-act="home">Back to Hub</button>`
          : `<button type="button" class="btn-main" data-act="next">Next Block</button>`;
      bar.querySelector('[data-act="home"]')?.addEventListener("click", () => navigate({ name: "home" }));
      bar.querySelector('[data-act="next"]')?.addEventListener("click", nextBlock);
      if (blockIndex === template.blocks.length - 1) sfxEnd();
      return;
    }

    center.innerHTML = `
      <p class="phase-label">Block ${blockIndex + 1} / ${template.blocks.length}</p>
      <h2 class="giant-title">${b.label}</h2>
      <p class="giant-detail">${b.instruction}</p>
    `;
    bar.innerHTML = `
      <button type="button" class="btn-main" data-act="start">Start ${b.label}</button>
      <button type="button" class="btn-soft" data-act="skip">Skip Block</button>
      <p class="hint-keys">Space / Enter = start · Esc = exit</p>
    `;
    bar.querySelector('[data-act="start"]')?.addEventListener("click", startBlock);
    bar.querySelector('[data-act="skip"]')?.addEventListener("click", nextBlock);
  }

  function nextBlock() {
    clearTimer();
    blockIndex += 1;
    if (blockIndex >= template.blocks.length) {
      blockIndex = template.blocks.length - 1;
    }
    round = 0;
    drillIdx = 0;
    showIntro();
  }

  function startBlock() {
    unlockAudio();
    const b = block();
    round = 0;
    drillIdx = 0;
    if (b.mode === "caller") startCallerRound();
    else if (b.mode === "drill") startDrillPiece();
  }

  function startCallerRound() {
    const b = block();
    const totalRounds = b.rounds ?? 4;
    round += 1;
    if (round > totalRounds) {
      nextBlock();
      return;
    }
    phase = "work";
    setBadge("round", `${round}/${totalRounds}`);
    combo = Math.random() > 0.35 ? pickClassic() : randomCombo(BASIC, round <= 2 ? 2 : 3);
    left = b.workSec ?? 60;
    sfxGo();
    paintCaller();
    clearTimer();
    timer = setInterval(() => {
      left -= 1;
      updateClock();
      if (left === 10 || (left <= 3 && left > 0)) sfxTick();
      if (left <= 0) {
        if ((b.restSec ?? 0) > 0 && round < totalRounds) startRest();
        else startCallerRound();
      }
    }, 1000);
  }

  function startRest() {
    const b = block();
    phase = "rest";
    left = b.restSec ?? 20;
    sfxRest();
    const center = root.querySelector("[data-center]")!;
    center.innerHTML = `
      <p class="phase-label">Rest</p>
      <div class="clock" data-clock>${formatTime(left)}</div>
      <p class="giant-detail">Shake out. Next round coming.</p>
    `;
    const bar = root.querySelector("[data-bar]")!;
    bar.innerHTML = `
      <button type="button" class="btn-main" data-act="skiprest">Skip Rest</button>
      <button type="button" class="btn-soft" data-act="endblock">End Block</button>
      <p class="hint-keys">Space = skip rest</p>
    `;
    bar.querySelector('[data-act="skiprest"]')?.addEventListener("click", () => startCallerRound());
    bar.querySelector('[data-act="endblock"]')?.addEventListener("click", nextBlock);
    clearTimer();
    timer = setInterval(() => {
      left -= 1;
      updateClock();
      if (left <= 3 && left > 0) sfxTick();
      if (left <= 0) startCallerRound();
    }, 1000);
  }

  function paintCaller() {
    const center = root.querySelector("[data-center]")!;
    const bar = root.querySelector("[data-bar]")!;
    center.innerHTML = `
      <p class="phase-label">Work · ${combo?.name ?? "Combo"}</p>
      ${combo ? comboHTML(combo) : ""}
      <div class="clock" data-clock>${formatTime(left)}</div>
    `;
    bar.innerHTML = `
      <button type="button" class="btn-main" data-act="newcombo">New Combo</button>
      <button type="button" class="btn-soft" data-act="nextround">Next Round</button>
      <button type="button" class="btn-soft" data-act="endblock">End Block</button>
      <p class="hint-keys">Space = new combo · N = next round</p>
    `;
    bar.querySelector('[data-act="newcombo"]')?.addEventListener("click", () => {
      combo = pickClassic();
      sfxShow();
      paintCaller();
    });
    bar.querySelector('[data-act="nextround"]')?.addEventListener("click", () => {
      clearTimer();
      startCallerRound();
    });
    bar.querySelector('[data-act="endblock"]')?.addEventListener("click", nextBlock);
  }

  function startDrillPiece() {
    const b = block();
    const drills = b.drills ?? [];
    if (drillIdx >= drills.length) {
      nextBlock();
      return;
    }
    phase = "work";
    const d = drills[drillIdx]!;
    setBadge("round", `${drillIdx + 1}/${drills.length}`);
    left = d.seconds;
    sfxGo();
    const center = root.querySelector("[data-center]")!;
    const bar = root.querySelector("[data-bar]")!;
    center.innerHTML = `
      <p class="phase-label">${b.label} · ${d.kind}</p>
      <h2 class="giant-title">${d.title}</h2>
      <p class="giant-detail">${d.detail}</p>
      <div class="clock" data-clock>${formatTime(left)}</div>
    `;
    bar.innerHTML = `
      <button type="button" class="btn-main" data-act="nextdrill">Next Drill</button>
      <button type="button" class="btn-soft" data-act="endblock">End Block</button>
      <p class="hint-keys">Space = next drill</p>
    `;
    bar.querySelector('[data-act="nextdrill"]')?.addEventListener("click", () => {
      clearTimer();
      drillIdx += 1;
      startDrillPiece();
    });
    bar.querySelector('[data-act="endblock"]')?.addEventListener("click", nextBlock);

    clearTimer();
    timer = setInterval(() => {
      left -= 1;
      updateClock();
      if (left <= 3 && left > 0) sfxTick();
      if (left <= 0) {
        drillIdx += 1;
        startDrillPiece();
      }
    }, 1000);
  }

  function updateClock() {
    const el = root.querySelector<HTMLElement>("[data-clock]");
    if (!el) return;
    el.textContent = formatTime(left);
    el.classList.toggle("is-low", left <= 10 && phase === "work");
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      clearTimer();
      navigate({ name: "home" });
      return;
    }
    if (e.key !== " " && e.key !== "Enter" && e.key.toLowerCase() !== "n") return;
    e.preventDefault();
    if (phase === "intro") {
      const start = root.querySelector<HTMLButtonElement>('[data-act="start"]');
      const next = root.querySelector<HTMLButtonElement>('[data-act="next"]');
      const teams = root.querySelector<HTMLButtonElement>('[data-act="teams"]');
      if (start) start.click();
      else if (next) next.click();
      else if (teams) teams.click();
      return;
    }
    if (e.key.toLowerCase() === "n") {
      root.querySelector<HTMLButtonElement>('[data-act="nextround"]')?.click();
      return;
    }
    if (phase === "rest") {
      root.querySelector<HTMLButtonElement>('[data-act="skiprest"]')?.click();
      return;
    }
    const newCombo = root.querySelector<HTMLButtonElement>('[data-act="newcombo"]');
    const nextDrill = root.querySelector<HTMLButtonElement>('[data-act="nextdrill"]');
    if (newCombo) newCombo.click();
    else if (nextDrill) nextDrill.click();
  }

  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  renderShell();
  showIntro();

  return () => {
    clearTimer();
    cleanups.forEach((fn) => fn());
  };
}

export function templateById(id: string): ClassTemplate | undefined {
  return CLASS_TEMPLATES.find((t) => t.id === id);
}
