export type Route =
  | { name: "home" }
  | { name: "flash" }
  | { name: "panic" }
  | { name: "caller" }
  | { name: "roulette" }
  | { name: "scoreboard" };

type Listener = (route: Route) => void;

const listeners = new Set<Listener>();
let current: Route = { name: "home" };

export function getRoute(): Route {
  return current;
}

export function navigate(route: Route): void {
  current = route;
  listeners.forEach((fn) => fn(route));
  window.scrollTo(0, 0);
}

export function onRoute(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function atmosphereHTML(): string {
  return `
    <div class="atmosphere" aria-hidden="true">
      <div class="atmosphere__spot"></div>
      <div class="atmosphere__rope atmosphere__rope--1"></div>
      <div class="atmosphere__rope atmosphere__rope--2"></div>
    </div>
  `;
}

export function backButton(): string {
  return `<button type="button" class="back-btn" data-nav="home">← Games</button>`;
}
