import { createRouter, createWebHistory } from "vue-router";
import { defaultRoutes } from "./default";
import { encryptRoutes } from "./encrypt";
import { identityRoutes } from "./identity";
import { ledgerRoutes } from "./ledger";
import { storageRoutes } from "./storage";

const routes = [
  ...defaultRoutes,
  ...encryptRoutes,
  ...identityRoutes,
  ...ledgerRoutes,
  ...storageRoutes,
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
