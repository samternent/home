import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import registerSW from "./utils/registerSW";

import "./input.css";
import "ternent-ui/styles";

const app = createApp(App);

app.use(router);
registerSW();
app.mount("#app");
