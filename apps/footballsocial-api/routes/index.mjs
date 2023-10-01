import express from "express";

import predictRoutes from "./predictRoutes.mjs";
import footballDataProxy from "../services/footballDataProxy.mjs";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/index");
});

router.get("/football-data/*", async function (req, res) {
  const { error, data } = await footballDataProxy(req, res);
  if (error) {
    res.send(error);
  }
  return res.send(data);
});

predictRoutes(router);

export default router;
