import { createApp } from "vue";
import { createEngine } from "@core/engine";
import { App } from "@ui/app";

const {engine, character} = createEngine();

const app = createApp({
  ...App(engine, character)
});
app.mount("#app");

// start();
