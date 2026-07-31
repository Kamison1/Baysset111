import { sfxCorrect, unlockAudio } from "../audio";
import { atmosphereHTML, backButton, navigate } from "../router";

interface Fighter {
  id: string;
  name: string;
  score: number;
}

const STORAGE_KEY = "ringcall-scoreboard";

function load(): Fighter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Fighter[];
  } catch {
    return [];
  }
}

function save(fighters: Fighter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fighters));
}

export function mountScoreboard(root: HTMLElement): () => void {
  let fighters = load();
  const cleanups: Array<() => void> = [];

  function render() {
    const sorted = [...fighters].sort((a, b) => b.score - a.score);
    root.innerHTML = `
      ${atmosphereHTML()}
      <div class="screen game-shell">
        <div class="game-top">
          ${backButton()}
          <h1 class="game-title">Class Scoreboard</h1>
          <div class="stats-row">
            <div class="stat"><span class="stat__label">Fighters</span><span class="stat__value">${fighters.length}</span></div>
          </div>
        </div>
        <div class="game-stage">
          <p class="hint">Track wins from Flash Combos, Pad Panic, or live pad rounds. Scores stay on this device.</p>
          <form class="score-form" data-form>
            <input name="name" type="text" maxlength="24" placeholder="Fighter name" required autocomplete="off" />
            <button type="submit" class="btn-primary">Add</button>
          </form>
          ${
            sorted.length === 0
              ? `<p class="empty-state">No fighters yet — add your class to start scoring.</p>`
              : `<ul class="fighter-list">
                  ${sorted
                    .map(
                      (f, i) => `
                    <li class="fighter" data-id="${f.id}">
                      <span class="fighter__rank">${i + 1}</span>
                      <span class="fighter__name">${escapeHtml(f.name)}</span>
                      <span class="fighter__score">${f.score}</span>
                      <div class="fighter__actions">
                        <button type="button" data-act="plus5">+5</button>
                        <button type="button" data-act="plus10">+10</button>
                        <button type="button" data-act="minus5">−5</button>
                        <button type="button" data-act="remove">Remove</button>
                      </div>
                    </li>`,
                    )
                    .join("")}
                </ul>`
          }
          <div class="controls-row" style="margin-top:1.25rem">
            <button type="button" class="btn-ghost" data-action="reset">Reset All Scores</button>
            <button type="button" class="btn-ghost" data-action="clear">Clear Board</button>
          </div>
        </div>
      </div>
    `;

    bind();
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  }

  function bind() {
    root.querySelector("[data-nav]")?.addEventListener("click", () => navigate({ name: "home" }));

    const form = root.querySelector<HTMLFormElement>("[data-form]");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      unlockAudio();
      const input = form.elements.namedItem("name") as HTMLInputElement;
      const name = input.value.trim();
      if (!name) return;
      fighters.push({ id: crypto.randomUUID(), name, score: 0 });
      save(fighters);
      sfxCorrect();
      render();
    });

    root.querySelectorAll<HTMLElement>(".fighter").forEach((row) => {
      const id = row.dataset.id!;
      row.querySelectorAll<HTMLButtonElement>("[data-act]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const act = btn.dataset.act;
          const f = fighters.find((x) => x.id === id);
          if (!f) return;
          if (act === "plus5") f.score += 5;
          if (act === "plus10") f.score += 10;
          if (act === "minus5") f.score = Math.max(0, f.score - 5);
          if (act === "remove") fighters = fighters.filter((x) => x.id !== id);
          save(fighters);
          unlockAudio();
          sfxCorrect();
          render();
        });
      });
    });

    root.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
      fighters = fighters.map((f) => ({ ...f, score: 0 }));
      save(fighters);
      render();
    });

    root.querySelector('[data-action="clear"]')?.addEventListener("click", () => {
      fighters = [];
      save(fighters);
      render();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate({ name: "home" });
    };
    window.addEventListener("keydown", onKey);
    cleanups.push(() => window.removeEventListener("keydown", onKey));
  }

  render();

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
