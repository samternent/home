import express from "express";
import authRoutes from "./auth/index.mjs";
import accountRoutes from "./account/index.mjs";
import billingRoutes from "./billing/index.mjs";
import pixpaxCollectionRoutes from "./pixpax/collections/index.mjs";
import pixpaxIssuerRoutes from "./pixpax/issuers/index.mjs";
import stickerbookRoutes from "./stickerbook/index.mjs";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/index");
});

billingRoutes(router);
authRoutes(router);
accountRoutes(router);
// murderMysteryRoutes(router);
stickerbookRoutes(router);
pixpaxCollectionRoutes(router);
pixpaxIssuerRoutes(router);
// createMediaServer();

export default router;
