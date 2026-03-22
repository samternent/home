import { describe, expect, it } from "vitest";
import { mapGeneratedPackToPrintModel } from "@/modules/admin/print/mapGeneratedPackToPrintModel";

describe("mapGeneratedPackToPrintModel", () => {
  it("derives stable filenames and pack-facing metadata from generated admin items", () => {
    const model = mapGeneratedPackToPrintModel(
      {
        codeId: "BX6H2F8TKNMN",
        redeemUrl: "https://pixpax.xyz/redeem?code=BX6H2F8TKNMN",
        qrSvg: "<svg />",
        label: "Spring launch pack",
        kind: "pack",
        collectionId: "pixel-animals",
        version: "v2",
        dropId: "spring-launch",
        count: 5,
      },
      {
        batchId: "2026-03-21-120000",
        index: 0,
      },
    );

    expect(model.filename).toBe("pixpax-2026-03-21-120000-pack-001.png");
    expect(model.packType).toBe("Pack");
    expect(model.subtitle).toBe("Contains 5 stickers");
    expect(model.shortCode).toBe("BX6H2F8TKNMN");
    expect(model.qrValue).toBe("https://pixpax.xyz/redeem?code=BX6H2F8TKNMN");
  });
});
