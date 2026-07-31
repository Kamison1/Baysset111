import { sfxCorrect, sfxGo, sfxMiss, sfxShow, unlockAudio } from "../audio";
import { BASIC_PUNCHES, PUNCHES, type PunchId, randomCombo, sleep } from "../punches";
import { atmosphereHTML, backButton, navigate } from "../router";

type Phase = "idle" | "watch" | "input" | "result";

export function mountFlashCombos(root: HTMLElement): () => void {
  let phase: Phase = "idle";
  let sequence: PunchId[] = [];
  let inputIndex = 0;
  let level = 1;
  let lives = 3;
  let best = Number(localStorage.getItem("ringcall-flash-best") || "0");
  let cancelled = false;
  const cleanups: Array<() => void> = [];

  root.innerHTML = `
    ${atmosphereHTML()}
    <div class="screen game-shell">
      <div class="game-top">
        ${backButton()}
        <h1 class="game-title">Flash Combos</h1>
        <div class="stats-row">
          <div class="stat"><span class="stat__label">Level</span><span class="stat__value" data-stat="level">1</span></div>
          <div class="stat"><span class="stat__label">Lives</span><span class="stat__value" data-stat="lives">3</span></div>
          <div class="stat"><span class="stat__label">Best</span><span class="stat__value stat__value--accent" data-stat="best">${best}</span></div>
        </div>
      </div>
      <div class="game-stage">
        <p class="hint" data-hint>Watch the combo. Then throw it back on the pads — or use keys 1–4.</p>
        <div class="combo-strip" data-strip aria-live="polite"></div>
        <p class="big-message" data-msg hidden></p>
        <div class="pads" data-pads>
          ${BASIC_PUNCHES.map(
            (id) => `
            <button type="button" class="pad" data-punch="${id}" style="--pad-color:${PUNCHES[id].color}" disabled>
              ${id}<span class="pad__sub">${PUNCHES[id].short}</span>
            </button>`,
          ).join("")}
        </div>
        <div class="controls-row">
          <button type="button" class="btn-primary" data-action="start">Start Round</button>
          <button type="button" class="btn-ghost" data-action="reset" hidden>Play Again</button>
        </div>
      </div>
    </div>
  `;

  const hint = root.querySelector<HTMLElement>("[data-hint]")!;
  const strip = root.querySelector<HTMLElement>("[data-strip]")!;
  const msg = root.querySelector<HTMLElement>("[data-msg]")!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-action="start"]')!;
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
  const pads = [...root.querySelectorAll<HTMLButtonElement>("[data-punch]")];

  function setStat(name: string, value: string | number) {
    const el = root.querySelector(`[data-stat="${name}"]`);
    if (el) el.textContent = String(value);
  }

  function setPadsEnabled(on: boolean) {
    pads.forEach((p) => {
      p.disabled = !on;
      p.classList.remove("is-lit", "is-dim", "is-pressed");
    });
  }

  function renderStrip(active = -1, mode: "show" | "input" | "done" = "show") {
    strip.innerHTML = sequence
      .map((id, i) => {
        let cls = "combo-chip";
        if (mode === "show" && i === active) cls += " is-active";
        if (mode === "input") {
          if (i < inputIndex) cls += " is-done";
          else if (i === inputIndex) cls += " is-active";
        }
        if (mode === "done") cls += " is-done";
        return `<span class="${cls}">${id}</span>`;
      })
      .join("");
  }

  function showMessage(text: string, kind: "" | "ok" | "miss" | "spark" = "") {
    msg.hidden = false;
    msg.textContent = text;
    msg.className = `big-message${kind ? ` big-message--${kind}` : ""}`;
  }

  function hideMessage() {
    msg.hidden = true;
  }

  async function playSequence() {
    phase = "watch";
    setPadsEnabled(false);
    startBtn.hidden = true;
    resetBtn.hidden = true;
    hideMessage();
    hint.textContent = "Watch closely…";
    renderStrip(-1, "show");
    await sleep(500);
    if (cancelled) return;

    for (let i = 0; i < sequence.length; i++) {
      if (cancelled) return;
      const id = sequence[i]!;
      renderStrip(i, "show");
      const pad = pads.find((p) => p.dataset.punch === id);
      pad?.classList.add("is-lit");
      sfxShow();
      await sleep(550);
      pad?.classList.remove("is-lit");
      await sleep(220);
    }

    if (cancelled) return;
    phase = "input";
    inputIndex = 0;
    hint.textContent = "Your turn — throw the combo!";
    renderStrip(0, "input");
    setPadsEnabled(true);
    sfxGo();
  }

  async function startRound() {
    unlockAudio();
    if (lives <= 0) {
      lives = 3;
      level = 1;
    }
    setStat("level", level);
    setStat("lives", lives);
    const len = Math.min(2 + level, 8);
    sequence = randomCombo(len, BASIC_PUNCHES);
    await playSequence();
  }

  async function onPunch(id: PunchId) {
    if (phase !== "input" || cancelled) return;
    const expected = sequence[inputIndex];
    const pad = pads.find((p) => p.dataset.punch === id);
    pad?.classList.add("is-pressed");
    setTimeout(() => pad?.classList.remove("is-pressed"), 120);

    if (id === expected) {
      sfxCorrect();
      inputIndex += 1;
      renderStrip(inputIndex, "input");
      if (inputIndex >= sequence.length) {
        phase = "result";
        setPadsEnabled(false);
        renderStrip(-1, "done");
        sfxCorrect();
        showMessage("CLEAN!", "ok");
        hint.textContent = `Level ${level} cleared. Ready for more?`;
        if (level > best) {
          best = level;
          localStorage.setItem("ringcall-flash-best", String(best));
          setStat("best", best);
        }
        level += 1;
        setStat("level", level);
        await sleep(900);
        if (!cancelled) await startRound();
      }
    } else {
      sfxMiss();
      phase = "result";
      setPadsEnabled(false);
      lives -= 1;
      setStat("lives", lives);
      showMessage("MISS", "miss");
      if (lives <= 0) {
        hint.textContent = `Out of lives. You reached level ${level}. Best: ${best}.`;
        startBtn.hidden = true;
        resetBtn.hidden = false;
        resetBtn.textContent = "Play Again";
      } else {
        hint.textContent = `${lives} ${lives === 1 ? "life" : "lives"} left. Same combo — try again.`;
        await sleep(900);
        if (!cancelled) await playSequence();
      }
    }
  }

  const onStart = () => {
    void startRound();
  };
  const onReset = () => {
    lives = 3;
    level = 1;
    setStat("level", level);
    setStat("lives", lives);
    hideMessage();
    strip.innerHTML = "";
    resetBtn.hidden = true;
    startBtn.hidden = false;
    hint.textContent = "Watch the combo. Then throw it back on the pads — or use keys 1–4.";
  };

  startBtn.addEventListener("click", onStart);
  resetBtn.addEventListener("click", onReset);
  cleanups.push(() => startBtn.removeEventListener("click", onStart));
  cleanups.push(() => resetBtn.removeEventListener("click", onReset));

  pads.forEach((pad) => {
    const handler = () => {
      const id = pad.dataset.punch as PunchId;
      void onPunch(id);
    };
    pad.addEventListener("click", handler);
    cleanups.push(() => pad.removeEventListener("click", handler));
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate({ name: "home" });
      return;
    }
    if (!BASIC_PUNCHES.includes(e.key as PunchId)) return;
    void onPunch(e.key as PunchId);
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => window.removeEventListener("keydown", onKey));

  root.querySelector("[data-nav]")?.addEventListener("click", () => navigate({ name: "home" }));

  return () => {
    cancelled = true;
    cleanups.forEach((fn) => fn());
  };
}
