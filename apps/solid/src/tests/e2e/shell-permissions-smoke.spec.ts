import { expect, test } from "@playwright/test";

test("shell and permissions happy path", async ({ page }) => {
  await page.goto("/");

  const onboardingDialog = page.locator('[data-test="identity-global-dialog"]');
  await expect(onboardingDialog).toBeVisible();

  const unlockPasswordField = page.locator('[data-test="identity-dialog-unlock-password"]');

  if (await unlockPasswordField.count()) {
    await unlockPasswordField.fill("password123");
    await page.locator('[data-test="identity-dialog-unlock-submit"]').click();
  } else {
    await page.locator('[data-test="identity-dialog-mnemonic-confirmed"]').click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.locator('[data-test="identity-dialog-password"]').fill("password123");
    await page.locator('[data-test="identity-dialog-password-confirm"]').fill("password123");

    await page.locator('[data-test="identity-dialog-mfa-enabled"]').click();
    await page.locator('[data-test="identity-dialog-create-submit"]').click();
  }

  await expect(page.locator('[data-test="home-v2-status"]')).toHaveText("ready");

  await page.locator('[data-test="home-v2-permissions-link"]').click();
  await expect(page.locator('[data-test="permissions-v2"]')).toBeVisible();

  await page.locator('[data-test="permission-create-title"]').fill("Reviewers");
  await page.locator('[data-test="permission-create-scope"]').fill("workspace");
  await page.locator('[data-test="permission-create-submit"]').click();

  await expect(page.locator('[data-test="permissions-empty"]')).toHaveCount(0);
});
