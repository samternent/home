// Choose a cache name
const cacheName = "cache-v3";

// When the service worker is installing, open the cache and add the precache resources to it
self.addEventListener("install", (event) => {
  // console.log("Service worker install event!");
  // event.waitUntil(
  //   caches.open(cacheName).then((cache) => cache.addAll(precacheResources))
  // );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (_cacheName) {
              return caches.delete(_cacheName);
          })
        );
      }),
    ])
  );
});
// When there's an incoming fetch request, try and respond with a precached resource, otherwise fall back to the network
self.addEventListener("fetch", (event) => {
  // console.log("Fetch intercepted for:", event.request.url);
  // event.respondWith(
  //   caches.match(event.request).then((cachedResponse) => {
  //     if (cachedResponse) {
  //       return cachedResponse;
  //     }
  //     return fetch(event.request);
  //   })
  // );
});

// Register event listener for the 'push' event.
self.addEventListener("push", function (event) {
  // Retrieve the textual payload from event.data (a PushMessageData object).
  // Other formats are supported (ArrayBuffer, Blob, JSON), check out the documentation
  // on https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData.
  // const payload = event.data ? event.data.text() : "no payload";

  // Keep the service worker alive until the notification is created.
  // event.waitUntil(
  //   self.registration.showNotification("FootballSocial", {
  //     body: payload,
  //   })
  // );
});
