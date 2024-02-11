import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import registerSW from "./utils/registerSW";

import { provideWhiteLabel } from "./module/brand/useWhiteLabel";

import "./input.css";
import "ternent-ui/styles";

const app = createApp(App);

provideWhiteLabel(app);

app.use(router);
registerSW();
app.mount("#app");
