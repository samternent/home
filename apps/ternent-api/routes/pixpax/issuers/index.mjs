import {
  loadIssuerRegistry,
  loadReceiptKeyRegistry,
} from "./registry.mjs";

export default function pixpaxIssuerRoutes(router) {
  router.get("/v1/pixpax/issuers", async (req, res) => {
    try {
      const issuers = await loadIssuerRegistry();
      const active = issuers
        .filter((entry) => entry.status === "active")
        .map((entry) => ({
          issuerKeyId: entry.issuerKeyId,
          name: entry.name,
          status: entry.status,
          publicKeyPem: entry.publicKeyPem,
          createdAt: entry.createdAt,
          notes: entry.notes,
        }));
      res.status(200).send({ ok: true, issuers: active });
    } catch (error) {
      console.error("[pixpax/issuers] list failed:", error);
      res.status(500).send({ ok: false, error: "Failed to load issuer registry." });
    }
  });

  router.get("/v1/pixpax/issuers/:issuerKeyId", async (req, res) => {
    try {
      const issuerKeyId = String(req.params?.issuerKeyId || "").trim();
      const issuers = await loadIssuerRegistry();
      const issuer = issuers.find((entry) => entry.issuerKeyId === issuerKeyId) || null;
      if (!issuer) {
        res.status(404).send({ ok: false, error: "Issuer key was not found." });
        return;
      }
      res.status(200).send({ ok: true, issuer });
    } catch (error) {
      console.error("[pixpax/issuers] get failed:", error);
      res.status(500).send({ ok: false, error: "Failed to load issuer key." });
    }
  });

  router.get("/v1/pixpax/receipt-keys", async (req, res) => {
    try {
      const keys = await loadReceiptKeyRegistry();
      const active = keys
        .filter((entry) => entry.status === "active")
        .map((entry) => ({
          receiptKeyId: entry.receiptKeyId,
          name: entry.name,
          status: entry.status,
          publicKeyPem: entry.publicKeyPem,
          createdAt: entry.createdAt,
          notes: entry.notes,
        }));
      res.status(200).send({ ok: true, receiptKeys: active });
    } catch (error) {
      console.error("[pixpax/receipt-keys] list failed:", error);
      res.status(500).send({ ok: false, error: "Failed to load receipt key registry." });
    }
  });

  router.get("/v1/pixpax/receipt-keys/:receiptKeyId", async (req, res) => {
    try {
      const receiptKeyId = String(req.params?.receiptKeyId || "").trim();
      const keys = await loadReceiptKeyRegistry();
      const key = keys.find((entry) => entry.receiptKeyId === receiptKeyId) || null;
      if (!key) {
        res.status(404).send({ ok: false, error: "Receipt key was not found." });
        return;
      }
      res.status(200).send({ ok: true, receiptKey: key });
    } catch (error) {
      console.error("[pixpax/receipt-keys] get failed:", error);
      res.status(500).send({ ok: false, error: "Failed to load receipt key." });
    }
  });
}

