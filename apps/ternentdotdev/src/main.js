import { createApp } from "vue";

import en from "@vueform/vueform/locales/en";
import vueform from "@vueform/vueform/dist/vueform";
import Vueform, { defineConfig } from "@vueform/vueform";
import "highlight.js/styles/base16/spacemacs.css";

import App from "./App.vue";
import router from "./router";
import registerSW from "./utils/registerSW";
import { provideWhiteLabel } from "./module/brand/useWhiteLabel";

import "./input.css";
import "ternent-ui/styles";

// You might place these anywhere else in your project
import "@vueform/vueform/dist/vueform.css";

const app = createApp(App);

provideWhiteLabel(app);

app.use(router);
app.use(
  Vueform,
  defineConfig({
    theme: vueform,
    locales: { en },
    locale: "en",
  })
);

registerSW();
app.mount("#app");

console.log("hii");
