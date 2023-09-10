import express from "express";

const router = express.Router();

router.get("/*", async function (req, res) {
  return res.status(200).json({
    domain: "https://api.ternent.dev",
    request: req.path,
  });
});

export default router;
