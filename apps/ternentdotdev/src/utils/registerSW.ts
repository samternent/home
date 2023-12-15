export default function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      // delete all the caches... bugs I think
      caches.keys().then(function (names) {
        for (let name of names) caches.delete(name);
      });

      // unregister old service workers... there maybe be bugs
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });

      navigator.serviceWorker.register("/sw.js");
    });
  }
}
