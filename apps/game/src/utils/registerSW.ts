export default function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js");
      navigator.serviceWorker.ready.then(function (registration) {
        // Use the PushManager to get the user's subscription to the push service.
        return registration.pushManager
          .getSubscription()
          .then(async function (subscription) {
            // If a subscription was found, return it.
            if (subscription) {
              return subscription;
            }
          });
      });
    });
  }
}
