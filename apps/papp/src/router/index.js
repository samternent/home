import { useLocalStorage } from "@vueuse/core";
import { createRouter, createWebHistory } from "vue-router";
import { authRoutes } from "./auth";
import { defaultRoutes } from "./default";
import { ledgerRoutes } from "./ledger";

const routes = [...authRoutes, ...defaultRoutes, ...ledgerRoutes];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
