import { sfxGo, unlockAudio } from "../audio";
import { navigate } from "../router";

export function mountTeams(root: HTMLElement): () => void {
  let red = 0;
  let blue = 0;
  const cleanups: Array<() => void> = [];

  function paint() {
    root.innerHTML = `
      <div class="screen">
        <div class="topbar">
          <button type="button" class="btn-back" data-back>← Coach Hub</button>
          <h1 class="hub__brand" style="font-size:clamp(2rem,6vw,3rem);margin:0">Team Battle</h1>
          <button type="button" class="btn-soft" data-reset>Reset</button>
        </div>
        <p style="text-align:center;color:var(--muted);margin:0.25rem 0 1rem">
          Split the room. Coach awards points for effort, clean form, and finishers — big buttons from across the mat.
        </p>
        <div class="teams">
          <div class="team" style="--team:#e02d3a">
            <h2 class="team__name">Red</h2>
            <div class="team__score">${red}</div>
            <div class="team__btns">
              <button type="button" data-r="1">+1</button>
              <button type="button" data-r="3">+3</button>
              <button type="button" data-r="5">+5</button>
              <button type="button" data-r="-1">−1</button>
            </div>
          </div>
          <div class="team" style="--team:#2a6fd4">
            <h2 class="team__name">Blue</h2>
            <div class="team__score">${blue}</div>
            <div class="team__btns">
              <button type="button" data-b="1">+1</button>
              <button type="button" data-b="3">+3</button>
              <button type="button" data-b="5">+5</button>
              <button type="button" data-b="-1">−1</button>
            </div>
          </div>
        </div>
        <p style="text-align:center;color:var(--rope);font-weight:700;letter-spacing:0.08em;text-transform:uppercase">
          ${red === blue ? "Tied up" : red > blue ? "Red leads" : "Blue leads"}
        </p>
      </div>
    `;
    root.querySelector("[data-back]")?.addEventListener("click", () => navigate({ name: "home" }));
    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      red = 0;
      blue = 0;
      paint();
    });
    root.querySelectorAll<HTMLButtonElement>("[data-r]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        red = Math.max(0, red + Number(btn.dataset.r));
        sfxGo();
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>("[data-b]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        blue = Math.max(0, blue + Number(btn.dataset.b));
        sfxGo();
        paint();
      });
    });
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") navigate({ name: "home" });
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  paint();
  return () => cleanups.forEach((fn) => fn());
}
