import "./style.css";
import { unlockAudio } from "./audio";
import { mountCoachCaller } from "./games/coachCaller";
import { mountFlashCombos } from "./games/flashCombos";
import { mountPadPanic } from "./games/padPanic";
import { mountRoundRoulette } from "./games/roundRoulette";
import { mountScoreboard } from "./games/scoreboard";
import { atmosphereHTML, getRoute, navigate, onRoute, type Route } from "./router";

const app = document.querySelector<HTMLDivElement>("#app")!;
let unmount: (() => void) | null = null;

const GAMES = [
  {
    id: "flash" as const,
    num: "01",
    title: "Flash Combos",
    desc: "Simon Says for boxing — memorize the sequence, throw it back.",
    accent: "#e02d3a",
  },
  {
    id: "panic" as const,
    num: "02",
    title: "Pad Panic",
    desc: "Reaction lights. Hit the glowing pad before time runs out.",
    accent: "#f5b42a",
  },
  {
    id: "caller" as const,
    num: "03",
    title: "Coach Caller",
    desc: "Big-screen combo calls for the whole class to throw together.",
    accent: "#2a6fd4",
  },
  {
    id: "roulette" as const,
    num: "04",
    title: "Round Roulette",
    desc: "Timed rounds that spin a random drill every work interval.",
    accent: "#d4a574",
  },
  {
    id: "scoreboard" as const,
    num: "05",
    title: "Class Scoreboard",
    desc: "Keep score across fighters for competitions and challenges.",
    accent: "#3ecf8e",
  },
];

function renderHome() {
  app.innerHTML = `
    ${atmosphereHTML()}
    <div class="screen home">
      <header class="brand">
        <div class="brand__mark">RING <span>CALL</span></div>
        <p class="brand__tag">Interactive games for boxing class — project it, pad it, or pass a tablet around the ring.</p>
      </header>
      <div class="game-grid">
        ${GAMES.map(
          (g) => `
          <button type="button" class="game-card" data-go="${g.id}" style="--accent:${g.accent}">
            <span class="game-card__num">${g.num}</span>
            <h2 class="game-card__title">${g.title}</h2>
            <p class="game-card__desc">${g.desc}</p>
          </button>`,
        ).join("")}
      </div>
      <p class="home__tip">Tip: Coach Caller + Round Roulette shine on a TV or projector. Flash Combos &amp; Pad Panic work great on a phone or tablet.</p>
    </div>
  `;

  app.querySelectorAll<HTMLButtonElement>("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      unlockAudio();
      navigate({ name: btn.dataset.go as Route["name"] });
    });
  });
}

function render(route: Route) {
  unmount?.();
  unmount = null;

  switch (route.name) {
    case "home":
      renderHome();
      break;
    case "flash":
      unmount = mountFlashCombos(app);
      break;
    case "panic":
      unmount = mountPadPanic(app);
      break;
    case "caller":
      unmount = mountCoachCaller(app);
      break;
    case "roulette":
      unmount = mountRoundRoulette(app);
      break;
    case "scoreboard":
      unmount = mountScoreboard(app);
      break;
  }
}

onRoute(render);
render(getRoute());
