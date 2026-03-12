import { test, expect } from "@playwright/test";

test("generate identity, sign text, verify proof and mismatch", async ({ page }) => {
  await page.goto("/app/identity");
  await page.getByRole("checkbox", { name: "Store identity in this browser (trusted devices only)" }).check();
  await page.getByRole("button", { name: "Generate new identity" }).click();
  await expect(page.getByText("Identity created. Export it now and store it securely.")).toBeVisible();

  await page.goto("/app/sign");
  await page.locator("[data-scope='radio-group'][data-part='item']").filter({ hasText: "Sign Text" }).click();
  await page.getByPlaceholder("Enter text to sign").fill("portable proof text");
  await page.getByRole("button", { name: "Sign", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Proof generated successfully" })).toBeVisible();

  await page.getByRole("button", { name: "▶ View raw proof JSON" }).click();
  const proofJson = await page.locator("textarea[readonly]").inputValue();

  await page.goto("/app/verify");
  await page.getByRole("button", { name: "▶ View raw proof JSON" }).click();
  await page.getByPlaceholder("Paste proof JSON").fill(proofJson);
  await page
    .locator("[data-scope='radio-group'][data-part='item']")
    .filter({ hasText: "Verify proof + original content" })
    .click();
  await page.locator("[data-scope='radio-group'][data-part='item']").filter({ hasText: "Text" }).click();
  await page.getByPlaceholder("Paste original text").fill("portable proof text");
  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page.getByText("Signature valid.")).toBeVisible();
  await expect(page.getByText("Content hash matches proof payload.")).toBeVisible();

  await page.getByPlaceholder("Paste original text").fill("different text");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("Content hash does not match proof payload.")).toBeVisible();
});
