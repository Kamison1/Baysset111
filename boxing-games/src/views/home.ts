import { unlockAudio } from "../audio";
import { navigate } from "../router";

export function mountHome(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="screen hub">
      <h1 class="hub__brand">RING <span>CALL</span></h1>
      <p class="hub__lead">
        Coach tools for a live boxing class — put it on the gym TV or tablet.
        The class works with their hands. You run the room.
      </p>
      <div class="hub__actions">
        <button type="button" class="hub-card" data-go="templates" style="--accent:#e02d3a">
          <span class="hub-card__ico">01</span>
          <span>
            <h2 class="hub-card__title">Run a Class</h2>
            <p class="hub-card__desc">Guided session: warm-up, technique calls, pad rounds, finisher. Coach advances each block.</p>
          </span>
        </button>
        <button type="button" class="hub-card" data-go="caller" style="--accent:#f5b42a">
          <span class="hub-card__ico">02</span>
          <span>
            <h2 class="hub-card__title">Pad Caller</h2>
            <p class="hub-card__desc">Giant combo board for pad rounds. Auto-calls while you hold mitts — Space = next.</p>
          </span>
        </button>
        <button type="button" class="hub-card" data-go="drills" style="--accent:#2a6fd4">
          <span class="hub-card__ico">03</span>
          <span>
            <h2 class="hub-card__title">Drill Board</h2>
            <p class="hub-card__desc">Fullscreen physical drills for shadow, partners, and conditioning. No phone tapping.</p>
          </span>
        </button>
        <button type="button" class="hub-card" data-go="teams" style="--accent:#3ecf8e">
          <span class="hub-card__ico">04</span>
          <span>
            <h2 class="hub-card__title">Team Battle</h2>
            <p class="hub-card__desc">Split the room Red vs Blue. You award points for effort and clean work.</p>
          </span>
        </button>
        <button type="button" class="hub-card" data-go="dice" style="--accent:#d4a574">
          <span class="hub-card__ico">05</span>
          <span>
            <h2 class="hub-card__title">Dice Call</h2>
            <p class="hub-card__desc">Two dice: amber picks the exercise, red picks time or reps — matched so the dose always fits.</p>
          </span>
        </button>
      </div>
      <p class="hub__note">Tip: Cast to the gym screen. Keep your phone/tablet as the remote — Space / Enter advances.</p>
    </div>
  `;

  const onClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-go]");
    if (!btn) return;
    unlockAudio();
    const go = btn.dataset.go;
    if (go === "templates") navigate({ name: "templates" });
    if (go === "caller") navigate({ name: "caller" });
    if (go === "drills") navigate({ name: "drills" });
    if (go === "teams") navigate({ name: "teams" });
    if (go === "dice") navigate({ name: "dice" });
  };

  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
