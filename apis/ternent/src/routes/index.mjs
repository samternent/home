import express from "express";

const router = express.Router();

router.get("/hello/:name?", async function (req, res) {
  const { name } = req.params;

  return res.send(`Hello, ${name || "World"}!`);
});

export default router;
