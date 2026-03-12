import { test, expect } from "@playwright/test";

test("offline mode banner appears when network drops", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Portable Proof" })).toBeVisible();

  await page.goto("/app/verify");
  await context.setOffline(true);

  await expect(page.getByText("Offline mode active. Signing and verification continue locally.")).toBeVisible();
});
