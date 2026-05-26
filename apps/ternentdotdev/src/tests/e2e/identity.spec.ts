import { test, expect } from "@playwright/test";

test("identity create and export flow", async ({ page }) => {
  await page.goto("/settings/identity/create");
  await page.getByRole("button", { name: "Create identity" }).click();

  await expect(page.getByText("Active identity:")).toBeVisible();

  await page.goto("/settings/identity/export");
  await expect(page.getByRole("button", { name: "Download export file" })).toBeVisible();
});
