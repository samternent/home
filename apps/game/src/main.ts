import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";

import registerSW from "./utils/registerSW";

const app = createApp(App);
app.use(router);
registerSW();
app.mount("#app");
