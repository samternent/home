import "@/style.css";

import { createApp } from "vue";

import Root from "@/Root.vue";
import registerSW from "@/utils/registerSW";

const app = createApp(Root);

registerSW();

if (localStorage.getItem("storageFlush/0") !== "flushed") {
  localStorage.clear();
  localStorage.setItem("storageFlush/0", "flushed");
}

app.mount("#app");
