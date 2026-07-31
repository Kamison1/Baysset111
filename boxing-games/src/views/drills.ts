import { sfxGo, sfxTick, unlockAudio } from "../audio";
import { formatTime } from "../content";
import { navigate } from "../router";

interface Card {
  title: string;
  detail: string;
  seconds: number;
  tag: string;
}

const DECK: Card[] = [
  {
    title: "Pivot & Fire",
    detail: "Pivot off the lead foot, throw a 1-2, reset. Whole class together.",
    seconds: 60,
    tag: "Footwork",
  },
  {
    title: "Slip Line",
    detail: "Slip left, slip right, then cross. Continuous for the clock.",
    seconds: 60,
    tag: "Defense",
  },
  {
    title: "Mirror Match",
    detail: "Partners face each other. Leader throws slow; follower mirrors. Switch at halfway.",
    seconds: 90,
    tag: "Partner",
  },
  {
    title: "Body Only",
    detail: "Shadow or pads — only body shots. Mix 2, 5, and 6.",
    seconds: 60,
    tag: "Power",
  },
  {
    title: "High Guard March",
    detail: "Tight high guard, march the room perimeter. Coach taps openings.",
    seconds: 75,
    tag: "Guard",
  },
  {
    title: "Clinch Escape",
    detail: "Light clinch with partner. Frame, pivot out, fire 1-2.",
    seconds: 60,
    tag: "Partner",
  },
  {
    title: "Silent Round",
    detail: "No talking. Read coach hand signals / the screen only.",
    seconds: 60,
    tag: "Focus",
  },
  {
    title: "Last 20 All-Out",
    detail: "Whatever you're on — final 20 seconds max intensity as a group.",
    seconds: 20,
    tag: "Finisher",
  },
  {
    title: "Jab Ladder",
    detail: "10 slow jabs, 10 medium, 10 fast. Reset stance each set.",
    seconds: 75,
    tag: "Shadow",
  },
  {
    title: "Corner Pressure",
    detail: "One fighter backs up; other presses with jab-jab-cross. Switch halfway.",
    seconds: 90,
    tag: "Partner",
  },
];

export function mountDrills(root: HTMLElement): () => void {
  let idx = 0;
  let left = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let active = false;
  const cleanups: Array<() => void> = [];

  function clearTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function card() {
    return DECK[idx % DECK.length]!;
  }

  function paint(running: boolean) {
    const c = card();
    root.innerHTML = `
      <div class="screen stage">
        <div class="stage__meta">
          <button type="button" class="btn-back" data-back>← Coach Hub</button>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            <div class="badge"><span class="badge__label">Drill</span><span class="badge__value">${(idx % DECK.length) + 1}/${DECK.length}</span></div>
            <div class="badge"><span class="badge__label">Tag</span><span class="badge__value badge__value--hot">${c.tag}</span></div>
          </div>
        </div>
        <div class="stage__center">
          <p class="phase-label">${running ? "Work the room" : "Drill Board"}</p>
          <h2 class="giant-title">${c.title}</h2>
          <p class="giant-detail">${c.detail}</p>
          ${running ? `<div class="clock" data-clock>${formatTime(left)}</div>` : ""}
        </div>
        <div class="coach-bar">
          ${
            running
              ? `<button type="button" class="btn-main" data-next>Next Drill</button>
                 <button type="button" class="btn-soft" data-pause>Pause Board</button>`
              : `<button type="button" class="btn-main" data-start>Start This Drill</button>
                 <button type="button" class="btn-soft" data-skip>Show Next Card</button>`
          }
          <p class="hint-keys">Space = next · Esc = hub</p>
        </div>
      </div>
    `;
    root.querySelector("[data-back]")?.addEventListener("click", () => {
      clearTimer();
      navigate({ name: "home" });
    });
    root.querySelector("[data-start]")?.addEventListener("click", start);
    root.querySelector("[data-skip]")?.addEventListener("click", () => {
      idx += 1;
      paint(false);
    });
    root.querySelector("[data-next]")?.addEventListener("click", () => {
      idx += 1;
      start();
    });
    root.querySelector("[data-pause]")?.addEventListener("click", () => {
      clearTimer();
      active = false;
      paint(false);
    });
  }

  function start() {
    unlockAudio();
    active = true;
    const c = card();
    left = c.seconds;
    sfxGo();
    paint(true);
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
        idx += 1;
        start();
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
      if (active) {
        idx += 1;
        start();
      } else {
        root.querySelector<HTMLButtonElement>("[data-start]")?.click() ??
          root.querySelector<HTMLButtonElement>("[data-skip]")?.click();
        if (!active) {
          // if still on preview, start
          start();
        }
      }
    }
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  paint(false);
  return () => {
    clearTimer();
    cleanups.forEach((fn) => fn());
  };
}
