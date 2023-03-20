import { supabaseClient } from "../service/supabase";

// Web-Push
// Public base64 to Uint
function urlBase64ToUint8Array(base64String: String) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

            // // Get the server's public key
            // const response = await fetch("/api/vapidPublicKey");
            // const vapidPublicKey = await response.text();
            // // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
            // // urlBase64ToUint8Array() is defined in /tools.js
            // const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            // // Otherwise, subscribe the user (userVisibleOnly allows to specify that we don't plan to
            // // send notifications that don't have a visible effect for the user).
            // return registration.pushManager.subscribe({
            //   userVisibleOnly: true,
            //   applicationServerKey: convertedVapidKey,
            // });
          });
      });
      // .then((subscription) =>
      //   // supabaseClient.from("subscription").upsert(
      //   //   [
      //   //     {
      //   //       username: "sam",
      //   //       endpoint: subscription.endpoint,
      //   //       subscription: JSON.stringify(subscription),
      //   //     },
      //   //   ],
      //   //   { onConflict: "endpoint" }
      //   // )
      // );
    });
  }
}
