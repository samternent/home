import express from "express";
// import { login } from "../services/solid/auth.mjs";

const router = express.Router();
router.get("/", (req, res) => {
  res.send({ message: "Hello WWW!" });
});

router.get("/secret", (req, res) => {
  res.send({ message: process.env.SUPERSECRET });
});
export default router;
