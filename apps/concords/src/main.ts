import { createApp } from "vue";
import { plugin, defaultConfig } from "@formkit/vue";
import { generateClasses } from "@formkit/themes";
import formTheme from "./utils/formTheme";
import Toast from "vue-toastification";
import "./style.css";
import Root from "./Root.vue";
import router from "./router";
import "vue-toastification/dist/index.css";
import registerSW from "./utils/registerSW";

const app = createApp(Root);
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
