import { sfxGo, sfxRest, sfxShow, sfxTick, unlockAudio } from "../audio";
import { BASIC, PUNCHES, type Combo, formatTime, pickClassic, randomCombo } from "../content";
import { navigate } from "../router";

export function mountCaller(root: HTMLElement): () => void {
  let running = false;
  let auto = true;
  let classicBias = true;
  let workSec = 8;
  let combo: Combo | null = null;
  let left = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const cleanups: Array<() => void> = [];

  function clearTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function renderSetup() {
    running = false;
    clearTimer();
    root.innerHTML = `
      <div class="screen">
        <div class="topbar">
          <button type="button" class="btn-back" data-back>← Coach Hub</button>
          <h1 class="hub__brand" style="font-size:clamp(2rem,6vw,3rem);margin:0">Pad Caller</h1>
          <span></span>
        </div>
        <div class="setup">
          <p>Project this. Hold the pads. The screen calls combos for the whole class — nobody needs a phone.</p>
          <div class="pill-row">
            <button type="button" class="pill is-on" data-work="8">8s throw</button>
            <button type="button" class="pill" data-work="12">12s throw</button>
            <button type="button" class="pill" data-work="15">15s throw</button>
          </div>
          <div class="pill-row">
            <button type="button" class="pill is-on" data-mix="classic">Classic mix</button>
            <button type="button" class="pill" data-mix="random">Random only</button>
          </div>
          <button type="button" class="btn-main" data-start>Start Calling</button>
        </div>
      </div>
    `;
    root.querySelector("[data-back]")?.addEventListener("click", () => navigate({ name: "home" }));
    root.querySelectorAll<HTMLButtonElement>("[data-work]").forEach((btn) => {
      btn.addEventListener("click", () => {
        workSec = Number(btn.dataset.work);
        root.querySelectorAll("[data-work]").forEach((b) => b.classList.toggle("is-on", b === btn));
      });
    });
    root.querySelectorAll<HTMLButtonElement>("[data-mix]").forEach((btn) => {
      btn.addEventListener("click", () => {
        classicBias = btn.dataset.mix === "classic";
        root.querySelectorAll("[data-mix]").forEach((b) => b.classList.toggle("is-on", b === btn));
      });
    });
    root.querySelector("[data-start]")?.addEventListener("click", () => {
      unlockAudio();
      running = true;
      nextCombo(true);
    });
  }

  function nextCombo(fresh = false) {
    clearTimer();
    combo = classicBias && Math.random() > 0.3 ? pickClassic() : randomCombo(BASIC, 2 + Math.floor(Math.random() * 2));
    left = workSec;
    if (!fresh) sfxShow();
    else sfxGo();
    paint();
    if (!auto) return;
    timer = setInterval(() => {
      left -= 1;
      const clock = root.querySelector<HTMLElement>("[data-clock]");
      if (clock) {
        clock.textContent = formatTime(left);
        clock.classList.toggle("is-low", left <= 3);
      }
      if (left <= 3 && left > 0) sfxTick();
      if (left <= 0) {
        sfxRest();
        nextCombo();
      }
    }, 1000);
  }

  function paint() {
    if (!combo) return;
    root.innerHTML = `
      <div class="screen stage">
        <div class="stage__meta">
          <button type="button" class="btn-back" data-back>← Stop</button>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            <div class="badge"><span class="badge__label">Mode</span><span class="badge__value">Pad Caller</span></div>
            <div class="badge"><span class="badge__label">Throw</span><span class="badge__value badge__value--hot" data-clock>${formatTime(left)}</span></div>
          </div>
        </div>
        <div class="stage__center">
          <p class="phase-label">${combo.name}</p>
          <div class="combo-row">
            ${combo.punches
              .map((id, i) => {
                const p = PUNCHES[id];
                return `<div class="punch" style="--punch:${p.color};animation-delay:${i * 0.05}s">
                  <span class="punch__num">${id}</span>
                  <span class="punch__name">${p.short}</span>
                </div>`;
              })
              .join("")}
          </div>
          <p class="cue">${combo.cue ?? "Throw it together"}</p>
          <div class="clock ${left <= 3 ? "is-low" : ""}" data-clock>${formatTime(left)}</div>
        </div>
        <div class="coach-bar">
          <button type="button" class="btn-main" data-next>Next Combo</button>
          <button type="button" class="btn-soft" data-auto>${auto ? "Auto: On" : "Auto: Off"}</button>
          <button type="button" class="btn-soft" data-setup>Settings</button>
          <p class="hint-keys">Space / Enter = next combo · Esc = stop</p>
        </div>
      </div>
    `;
    root.querySelector("[data-back]")?.addEventListener("click", renderSetup);
    root.querySelector("[data-setup]")?.addEventListener("click", renderSetup);
    root.querySelector("[data-next]")?.addEventListener("click", () => nextCombo());
    root.querySelector("[data-auto]")?.addEventListener("click", () => {
      auto = !auto;
      if (auto) nextCombo();
      else {
        clearTimer();
        paint();
      }
    });
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (running) renderSetup();
      else navigate({ name: "home" });
      return;
    }
    if ((e.key === " " || e.key === "Enter") && running) {
      e.preventDefault();
      nextCombo();
    }
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  renderSetup();
  return () => {
    clearTimer();
    cleanups.forEach((fn) => fn());
  };
}
