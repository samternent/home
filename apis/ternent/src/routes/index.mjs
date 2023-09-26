import express from "express";

const router = express.Router();

router.get("/*", async function (req, res) {
  return res.status(200).json({
    title: "ternent dot dev",
    path: `${req.path}`,
    host: `${req.hostname}`,
  });
});

export default router;
