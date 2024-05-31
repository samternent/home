import express from "express";
import billingRoutes from "./billing/index.mjs";
import murderMysteryRoutes from "./murder-mystery/index.mjs";
import createMediaServer from "./live/index.mjs";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/index");
});

billingRoutes(router);
murderMysteryRoutes(router);
createMediaServer();

export default router;
