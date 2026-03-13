import { test, expect } from "@playwright/test";

test("offline mode banner appears when network drops", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByText("Cryptographic proof you can take anywhere.")).toBeVisible();

  await page.goto("/app/verify");
  await context.setOffline(true);

  await expect(page.getByText("Offline mode active. Signing and verification continue locally.")).toBeVisible();
});
