import { test, expect } from "@playwright/test";

test("generate identity, sign text, verify proof and mismatch", async ({ page }) => {
  await page.goto("/app/identity");
  await page.getByRole("button", { name: "Generate new identity" }).click();
  await expect(page.getByText("Identity created. Export it now and store it securely.")).toBeVisible();

  await page.getByRole("link", { name: "Sign" }).click();
  await page.getByPlaceholder("Enter text to sign").fill("seal text");
  await page.getByRole("button", { name: "Sign payload" }).click();
  await expect(page.getByRole("heading", { name: "Proof artifact ready" })).toBeVisible();

  await page.getByRole("button", { name: "Inspect raw proof JSON" }).click();
  const proofJson = await page.locator("textarea[readonly]").inputValue();

  await page.getByRole("link", { name: "Verify" }).click();
  await page.getByRole("button", { name: "Inspect raw proof JSON" }).click();
  await page.getByPlaceholder("Paste proof JSON").fill(proofJson);
  await page
    .locator("[data-scope='radio-group'][data-part='item']")
    .filter({ hasText: "Verify proof + original content" })
    .click();
  await page
    .locator("[data-scope='radio-group'][data-part='item']")
    .filter({ hasText: "TextPaste the original text to compare." })
    .click();
  await page.getByPlaceholder("Paste original text").fill("seal text");
  await page.getByRole("button", { name: "Verify proof" }).click();

  await expect(page.getByText("Proof JSON parsed successfully and the signature is valid.")).toBeVisible();
  await expect(page.getByText("Content hash matches proof subject.")).toBeVisible();

  await page.getByPlaceholder("Paste original text").fill("different text");
  await page.getByRole("button", { name: "Verify proof" }).click();
  await expect(page.getByText("Content hash does not match proof subject.")).toBeVisible();
});

test("export, clear, and import identity through the consolidated app identity flow", async ({ page }) => {
  await page.goto("/app/identity");
  await expect(page.getByRole("button", { name: "Download export file" })).toHaveCount(0);

  await page.getByRole("button", { name: "Generate new identity" }).click();
  await expect(page.getByText("Identity created. Export it now and store it securely.")).toBeVisible();

  const exportedPayload = await page.locator("textarea[readonly]").inputValue();
  await expect(page.getByRole("button", { name: "Download export file" })).toBeVisible();

  await page.getByRole("button", { name: "Clear identity" }).click();
  await expect(page.getByText("Identity cleared from memory and remembered storage.")).toBeVisible();
  await expect(page.getByText("No identity loaded").first()).toBeVisible();

  await page.getByRole("button", { name: "Import identity" }).click();
  await page
    .getByPlaceholder('{"format":"ternent-identity","version":"2","algorithm":"Ed25519","material":{"kind":"seed","seed":"..."},...}')
    .fill(exportedPayload);
  await page.getByRole("button", { name: "Import identity", exact: true }).click();

  await expect(page.getByText("Identity imported successfully.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download export file" })).toBeVisible();
});
