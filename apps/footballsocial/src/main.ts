import 'ternent-ui/tailwind';
import 'ternent-ui/styles';

import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import registerSW from "./utils/registerSW";

const app = createApp(App);

app.use(router);
registerSW();

if (localStorage.getItem('storageFlush/0') !== "flushed") {
  localStorage.clear();
  localStorage.setItem("storageFlush/0", 'flushed');
}

window.addEventListener('pagehide', () => {
  new BroadcastChannel('supabase.auth.token').close();
});

window.addEventListener('pageshow', () => {
  new BroadcastChannel('supabase.auth.token');
});

app.mount("#app");
