import webPush from "web-push";

export default function pushNotificationRoutes(router) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log(
      "You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
        "environment variables. You can use the following ones:"
    );
    console.log(webPush.generateVAPIDKeys());
    return;
  }

  console.log("setting up vapid routes");
  // Set the keys used for encrypting the push messages.
  webPush.setVapidDetails(
    "https://footballsocial.app/",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  router.get("/vapidPublicKey", async function (req, res) {
    console.log("in here");
    return res.send(process.env.VAPID_PUBLIC_KEY);
  });

  router.post("/register", function (req, res) {
    // A real world application would store the subscription info.
    console.log(req);
    res.sendStatus(201);
  });

  router.post("/sendNotification", function (req, res) {
    const subscription = req.body.subscription;
    const payload = req.body.payload;
    const options = {
      TTL: req.body.ttl,
    };

    setTimeout(function () {
      webPush
        .sendNotification(subscription, payload, options)
        .then(function () {
          res.sendStatus(201);
        })
        .catch(function (error) {
          console.log(error);
          res.sendStatus(500);
        });
    }, req.body.delay * 1000);
  });
}
