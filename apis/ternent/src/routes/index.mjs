import express from "express";
// import { login } from "../services/solid/auth.mjs";

const router = express.Router();
router.get("/", (req, res) => {
  res.send({ message: "Hello WWW!" });
});
export default router;
