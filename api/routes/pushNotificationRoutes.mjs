import webPush from "web-push";
import { supabaseClient } from "../supabase.mjs";

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

  router.post("/sendNotification", async function (req, res) {
    console.log(req.body);
    const { data } = await supabaseClient
      .from("subscription")
      .select("*")
      .eq("username", "sam");

    for (let i = 0; i < data.length; i++) {
      try {
        await webPush.sendNotification(
          JSON.parse(data[i].subscription),
          JSON.stringify(req.body),
          { TTL: 34 }
        );
        res.sendStatus(201);
      } catch (e) {
        console.log(e);
        res.sendStatus(500);
      }
    }
  });
}
