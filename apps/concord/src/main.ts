import { ViteSSG } from "vite-ssg";
import "ternent-ui/styles.css";
import "./style.css";
import App from "./App.vue";
import { routes } from "./route/index";

export const createApp = ViteSSG(
  App,
  { routes },
  // SSG options
  ({}) => {}
);
