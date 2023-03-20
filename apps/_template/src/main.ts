import { createApp } from "vue";

import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { md2 } from "vuetify/blueprints";

import Toast from "vue-toastification";
import "./style.css";
import Root from "./Root.vue";
import router from "./router";

import "vue-toastification/dist/index.css";
import registerSW from "./utils/registerSW";

const app = createApp(Root);
app.use(
  createVuetify({
    components,
    directives,
    blueprint: md2,
    theme: {
      defaultTheme: "dark",
    },
  })
);
app.use(router);
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 1,
  newestOnTop: true,
});

registerSW();

app.mount("#app");
