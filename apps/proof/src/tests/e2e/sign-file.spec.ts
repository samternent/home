import { test, expect } from "@playwright/test";

test("sign file and verify proof only", async ({ page }) => {
  await page.goto("/app/identity");
  await page.getByRole("checkbox", { name: "Store identity in this browser (trusted devices only)" }).check();
  await page.getByRole("button", { name: "Generate new identity" }).click();
  await expect(page.getByText("Identity created. Export it now and store it securely.")).toBeVisible();

  await page.goto("/app/sign");
  await page.locator("[data-scope='radio-group'][data-part='item']").filter({ hasText: "Sign File" }).click();

  await page
    .locator("input[type='file']")
    .nth(0)
    .setInputFiles({
      name: "sample.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("sample file proof", "utf8"),
    });

  await page.getByRole("button", { name: "Sign", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Proof generated successfully" })).toBeVisible();

  await page.getByRole("button", { name: "▶ View raw proof JSON" }).click();
  const proofJson = await page.locator("textarea[readonly]").inputValue();

  await page.goto("/app/verify");
  await page.getByRole("button", { name: "▶ View raw proof JSON" }).click();
  await page.getByPlaceholder("Paste proof JSON").fill(proofJson);
  await page
    .locator("[data-scope='radio-group'][data-part='item']")
    .filter({ hasText: "Verify proof only" })
    .click();
  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page.getByText("Signature valid.")).toBeVisible();
  await expect(page.getByText("Content match skipped (proof-only mode).")).toBeVisible();
});
