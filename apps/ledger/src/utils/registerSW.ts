import { registerSW } from "virtual:pwa-register";

export default function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error("service worker registration error", error);
    },
  });
}
