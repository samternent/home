import express from "express";

const router = express.Router();

router.get("/hello/:name?", async function (req, res) {
  const { name } = req.params;
  return res.send(`Hello, ${name || "World"}!`);
});

router.get("/*", async function (req, res) {
  return res.status(200).send("https://api.concords.app");
});

export default router;
