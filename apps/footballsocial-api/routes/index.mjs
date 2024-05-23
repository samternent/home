import express from "express";
import predictRoutes from "./predict/index.mjs";
import footballDataProxy from "../services/footballDataProxy.mjs";
import { supabaseClient } from "../services/supabase.mjs";

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

// Stats
router.get("/landing-stats", async function (req, res) {
  const { count: predictionCount } = await supabaseClient
    .from("predictions")
    .select("*", { count: "exact", head: true });

  const { count: userCount } = await supabaseClient
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return res.status(200).send({
    predictions: predictionCount,
    users: userCount,
  });
});

predictRoutes(router);

export default router;
