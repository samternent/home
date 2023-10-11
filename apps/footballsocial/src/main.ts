import { createApp } from "vue";
import * as Sentry from "@sentry/vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import registerSW from "./utils/registerSW";

const app = createApp(App);

Sentry.init({
  app,
  dsn: "https://78110d419c2a0afbf0b017a39c46a3eb@o4505977280593920.ingest.sentry.io/4505977283674112",
  integrations: [
    new Sentry.BrowserTracing({
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ["localhost", /^https:\/\/footballsocial\.app/],
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
    }),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: 0.1,
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

app.use(router);
registerSW();

if (localStorage.getItem('storageFlush/0') !== "flushed") {
  localStorage.clear();
  localStorage.setItem("storageFlush/0", 'flushed');
}

app.mount("#app");
