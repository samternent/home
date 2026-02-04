import express from "express";
import billingRoutes from "./billing/index.mjs";
import stickerbookRoutes from "./stickerbook/index.mjs";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/index");
});

billingRoutes(router);
// murderMysteryRoutes(router);
stickerbookRoutes(router);
// createMediaServer();

export default router;
