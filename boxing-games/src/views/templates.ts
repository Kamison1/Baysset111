import { unlockAudio } from "../audio";
import { CLASS_TEMPLATES } from "../content";
import { navigate } from "../router";

export function mountTemplates(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <button type="button" class="btn-back" data-back>← Coach Hub</button>
        <h1 class="hub__brand" style="font-size:clamp(2rem,6vw,3rem);margin:0">Pick a Class</h1>
        <span></span>
      </div>
      <div class="template-list">
        ${CLASS_TEMPLATES.map(
          (t) => `
          <button type="button" class="template-card" data-id="${t.id}">
            <div class="template-card__meta">
              <span>${t.durationHint}</span>
              <span>${t.level}</span>
            </div>
            <h2 class="template-card__title">${t.title}</h2>
            <p class="template-card__sub">${t.subtitle}</p>
          </button>`,
        ).join("")}
      </div>
    </div>
  `;

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-back]")) {
      navigate({ name: "home" });
      return;
    }
    const card = t.closest<HTMLButtonElement>("[data-id]");
    if (card) {
      unlockAudio();
      navigate({ name: "session", templateId: card.dataset.id! });
    }
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
