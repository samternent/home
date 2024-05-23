import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes";

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // always scroll to top
    return { top: 0 };
  },
});
