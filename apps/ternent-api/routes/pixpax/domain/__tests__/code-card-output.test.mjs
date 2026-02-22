import assert from "node:assert/strict";
import test from "node:test";
import { buildTokenQrArtifact } from "../code-token-qr.mjs";
import { buildCodeCardDataset } from "../code-card-dataset.mjs";

test("token qr artifact uses short /r/:code URL with svg output and M correction", async () => {
  const artifact = await buildTokenQrArtifact("abc.def.ghi", {
    baseUrl: "https://pixpax.xyz",
    publicCode: "XnNQMfdgHPVpx1J9",
  });
  assert.equal(artifact.redeemUrl, "https://pixpax.xyz/r/XnNQMfdgHPVpx1J9");
  assert.equal(artifact.qrErrorCorrection, "M");
  assert.equal(artifact.qrQuietZoneModules, 4);
  assert.match(artifact.qrSvg, /<svg/i);
});

test("code card dataset is generated with qr/meta output", async () => {
  const dataset = await buildCodeCardDataset({
    seriesTitle: "Kid Dragons",
    issuerName: "PixPax",
    items: Array.from({ length: 13 }, (_, index) => ({
      token: `token-${index}.sig`,
      tokenHash: `hash-${index}`,
      label: `Dragon ${index + 1}`,
      codeId: `code-${index}`,
      issuedAt: "2026-02-21T10:00:00.000Z",
      expiresAt: "2026-03-21T10:00:00.000Z",
      collectionId: "kid-dragons",
      version: "v1",
      kind: "fixed-card",
      cardId: `dragon-${index + 1}`,
    })),
  });

  assert.equal(dataset.length, 13);
  assert.equal(typeof dataset[0].redeemUrl, "string");
  assert.equal(typeof dataset[0].qrSvg, "string");

  assert.equal(dataset[0].seriesTitle, "Kid Dragons");
  assert.equal(dataset[0].issuerName, "PixPax");
  assert.equal(dataset[0].qrErrorCorrection, "M");
  assert.equal(dataset[0].qrQuietZoneModules, 4);
});
