import express from "express";

import pushNotificationRoutes from "./pushNotificationRoutes.mjs";
import predictRoutes from "./predictRoutes.mjs";

import footballDataProxy from "../footballDataProxy.mjs";

const router = express.Router();

router.get("/football-data/*", async function (req, res) {
  const { error, data } = await footballDataProxy(req, res);
  if (error) {
    res.send(error);
  }
  return res.send(data);
});

pushNotificationRoutes(router);
predictRoutes(router);

export default router;
