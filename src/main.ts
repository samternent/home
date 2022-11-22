import { createApp } from "vue";
import Toast from "vue-toastification";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import "vue-toastification/dist/index.css";

const app = createApp(App);
app.use(router);
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 1,
  newestOnTop: true,
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

app.mount("#app");
