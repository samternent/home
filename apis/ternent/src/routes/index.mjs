import express from "express";

const router = express.Router();
router.get("/", (req, res) => {
  res.send({ message: "Hello WWW!" });
});

export default router;
