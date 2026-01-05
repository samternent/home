import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import { routes } from "./route/index";

export const createApp = ViteSSG(
  App,
  { routes },
  // SSG options
  ({}) => {}
);
