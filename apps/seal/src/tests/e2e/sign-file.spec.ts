import { test, expect } from "@playwright/test";

test("sign file and verify proof only", async ({ page }) => {
  await page.goto("/app/identity");
  await page.getByRole("button", { name: "Generate new identity" }).click();
  await expect(page.getByText("Identity created. Export it now and store it securely.")).toBeVisible();

  await page.getByRole("link", { name: "Sign" }).click();
  await page.getByRole("tab", { name: "File" }).click();

  await page
    .locator("input[type='file']")
    .nth(0)
    .setInputFiles({
      name: "sample.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("sample file proof", "utf8"),
    });

  await page.getByRole("button", { name: "Sign payload" }).click();
  await expect(page.getByRole("heading", { name: "Proof artifact ready" })).toBeVisible();

  await page.getByRole("button", { name: "Inspect raw proof JSON" }).click();
  const proofJson = await page.locator("textarea[readonly]").inputValue();

  await page.getByRole("link", { name: "Verify" }).click();
  await page.getByRole("button", { name: "Inspect raw proof JSON" }).click();
  await page.getByPlaceholder("Paste proof JSON").fill(proofJson);
  await page
    .locator("[data-scope='radio-group'][data-part='item']")
    .filter({ hasText: "Verify proof only" })
    .click();
  await page.getByRole("button", { name: "Verify proof" }).click();

  await expect(page.getByText("Proof JSON parsed successfully and the signature is valid.")).toBeVisible();
  await expect(page.getByText("Content match skipped (proof-only mode).")).toBeVisible();
});

test("settings routes redirect back to the identity workspace", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/app\/identity$/);

  await page.goto("/settings/appearance");
  await expect(page).toHaveURL(/\/app\/identity$/);

  await page.goto("/settings/identity");
  await expect(page).toHaveURL(/\/app\/identity$/);
});
