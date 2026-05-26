import { registerSW } from "virtual:pwa-register";

export default function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateServiceWorker(true);
    },
    onRegisteredSW(_swUrl, registration) {
      void registration?.update();
    },
    onRegisterError(error) {
      console.error("service worker registration error", error);
    },
  });
}
