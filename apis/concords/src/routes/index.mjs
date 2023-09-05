import express from "express";

const router = express.Router();

router.get("/hello-world", async function (req, res) {
  return res.send('Hello, World!');
});

export default router;
