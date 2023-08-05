import express from "express";
const router = express.Router();

router.get("/test", async function (req, res) {
  return res.send({
    hello: "World!",
  });
});


export default router;
