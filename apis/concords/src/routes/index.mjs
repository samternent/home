import express from "express";
import { webcrypto } from "node:crypto";

const router = express.Router();

router.get("/hello/:name?", async function (req, res) {
  const { name } = req.params;
  return res.send(`Hello, ${name || "World"}!`);
});

router.get("/generate/ecdsa", async function (req, res) {
  const { privateKey } = await webcrypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-521",
    },
    true,
    ["sign", "verify"]
  );
  const jwk = await webcrypto.subtle.exportKey("jwk", privateKey);
  return res.status(200).json(jwk);
});

router.get("/*", async function (req, res) {
  return res.status(200).send("https://api.concords.app");
});

export default router;
