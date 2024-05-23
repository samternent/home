import "ternent-ui/tailwind";
import "ternent-ui/styles";
import "@/style.css";

import { createApp } from "vue";

import Root from "@/Root.vue";
import router from "@/route/router";
import registerSW from "@/utils/registerSW";

const app = createApp(Root);

app.use(router);
registerSW();

if (localStorage.getItem("storageFlush/0") !== "flushed") {
  localStorage.clear();
  localStorage.setItem("storageFlush/0", "flushed");
}

app.mount("#app");
