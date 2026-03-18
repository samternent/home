import { test, expect } from "@playwright/test";

test("offline reload keeps app shell available", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByText("Template-ready ternent app")).toBeVisible();

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByText("Template-ready ternent app")).toBeVisible();
});
