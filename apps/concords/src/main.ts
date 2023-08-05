import { createApp } from "vue";

import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { md2 } from "vuetify/blueprints";
import { plugin, defaultConfig } from "@formkit/vue";
import { generateClasses } from "@formkit/themes";
import formTheme from "./utils/formTheme";
import Toast from "vue-toastification";
import "./style.css";
import Root from "./Root.vue";
import router from "./router";
import "vue-toastification/dist/index.css";
import registerSW from "./utils/registerSW";
import { version } from '../package.json';

console.info(`concords-app | version@${version}`);

const app = createApp(Root);

const myCustomDarkTheme = {
  dark: true,
  colors: {
    background: "#18191A",
    surface: "#242526",
    primary: "#E5DADA",
    "primary-darken-1": "#149442",
    secondary: "#F38D68",
    "secondary-darken-1": "#018786",
    error: "#B00020",
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FB8C00",
  },
};

app.use(
  createVuetify({
    components,
    directives,
    blueprint: md2,
    theme: {
      defaultTheme: "myCustomDarkTheme",
      themes: {
        myCustomDarkTheme,
      },
    },
  })
);
app.use(
  plugin,
  defaultConfig({
    config: {
      classes: generateClasses(formTheme),
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
