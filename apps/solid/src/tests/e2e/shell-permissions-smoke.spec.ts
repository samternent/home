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

  await expect(page.locator('[data-test="home-v2-placeholder"]')).toBeVisible();
  await expect(page.locator('[data-test="console-status-runtime"]')).toHaveText("ready");
  await expect(page.locator('[data-test="sidebar-active-identity-label"]')).toContainText("User");
  await expect(page.locator('[data-test="nav-app-tasks"]')).toBeVisible();

  await page.locator('[data-test="nav-app-tasks"]').click();
  await expect(page.locator('[data-test="runtime-app-v0"]')).toBeVisible();
  await expect(page.locator('[data-test="runtime-app-title"]')).toContainText("Tasks");

  await page.locator('[data-test="nav-permissions"]').click();
  await expect(page.locator('[data-test="permissions-v2"]')).toBeVisible();

  await page.locator('[data-test="permission-create-title"]').fill("Reviewers");
  await page.locator('[data-test="permission-create-submit"]').click();

  await expect(page.locator('[data-test="permissions-empty"]')).toHaveCount(0);
  await expect(page.locator('[data-test^="permission-selected-title-"]')).toContainText(
    "Reviewers",
  );
  await expect(page.locator('[data-test="permissions-users-empty"]')).toBeVisible();
  await expect(page.locator('[data-test="console-status-staged"]')).toContainText(
    "needs attention",
  );

  const commitMessage = page.locator('[data-test="console-commit-message"]');
  if (!(await commitMessage.isVisible())) {
    await page.getByRole("button", { name: "Toggle panel" }).click();
  }

  await commitMessage.fill("Create reviewers permission");
  await page.locator('[data-test="console-commit-submit"]').click();

  await expect(page.locator('[data-test="console-status-staged"]')).toContainText(
    "No staged entries",
  );
});
