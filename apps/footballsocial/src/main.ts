import { createApp } from "vue";
import Toast from "vue-toastification";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import "vue-toastification/dist/index.css";
import registerSW from "./utils/registerSW";
import { version } from '../package.json';

console.info(`FootballSocial.app | v${version}`);

const app = createApp(App);
app.use(router);
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 1,
  newestOnTop: true,
});

registerSW();

if (localStorage.getItem('storageFlush/0') !== "flushed") {
  localStorage.clear();
  localStorage.setItem("storageFlush/0", 'flushed');
}

app.mount("#app");
