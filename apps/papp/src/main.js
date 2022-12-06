/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from "./App.vue";

// Composables
import { createApp } from "vue";

import { router } from "./router";
import "./styles.css";
import "./styles/index.scss";

// Plugins
import { registerPlugins } from "@/plugins";
import vuetify from "./plugins/vuetify";

const app = createApp(App);

registerPlugins(app);
app.use(vuetify).use(router).mount("#app");
