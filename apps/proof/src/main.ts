import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import { routes } from "./routes";
import { installAppProviders } from "./app/bootstrap/createApp";
import registerSW from "./utils/registerSW";

import "ternent-ui/styles.css";
import "ternent-ui/themes/proof.css";
import "./style.css";

export const createApp = ViteSSG(
  App,
  {
    routes,
  },
  ({ app, isClient }) => {
    installAppProviders(app);

    if (isClient) {
      registerSW();
    }
  },
);
