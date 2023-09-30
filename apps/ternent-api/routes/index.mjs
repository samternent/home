import express from "express";
import billingRoutes from "./billing/index.mjs";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/index");
});

billingRoutes(router);

export default router;
