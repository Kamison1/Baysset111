import "./style.css";
import { getRoute, onRoute, type Route } from "./router";
import { mountCaller } from "./views/caller";
import { mountDice } from "./views/dice";
import { mountDrills } from "./views/drills";
import { mountHome } from "./views/home";
import { mountSession } from "./views/session";
import { mountTeams } from "./views/teams";
import { mountTemplates } from "./views/templates";

const app = document.querySelector<HTMLDivElement>("#app")!;
let unmount: (() => void) | null = null;

function render(route: Route) {
  unmount?.();
  unmount = null;

  switch (route.name) {
    case "home":
      unmount = mountHome(app);
      break;
    case "templates":
      unmount = mountTemplates(app);
      break;
    case "session":
      unmount = mountSession(app, route.templateId);
      break;
    case "caller":
      unmount = mountCaller(app);
      break;
    case "drills":
      unmount = mountDrills(app);
      break;
    case "teams":
      unmount = mountTeams(app);
      break;
    case "dice":
      unmount = mountDice(app);
      break;
  }
}

onRoute(render);
render(getRoute());
