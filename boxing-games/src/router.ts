export type Route =
  | { name: "home" }
  | { name: "templates" }
  | { name: "session"; templateId: string }
  | { name: "caller" }
  | { name: "drills" }
  | { name: "teams" }
  | { name: "dice" };

type Listener = (route: Route) => void;
const listeners = new Set<Listener>();
let current: Route = { name: "home" };

export function getRoute() {
  return current;
}

export function navigate(route: Route) {
  current = route;
  listeners.forEach((fn) => fn(route));
  window.scrollTo(0, 0);
}

export function onRoute(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
