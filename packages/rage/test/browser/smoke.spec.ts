import { expect, test } from "@playwright/test";

test("loads and decrypts in the browser", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('body[data-status="ok"]');

  const output = await page.locator("#output").textContent();
  expect(output).toContain('"status": "ok"');
  expect(output).toContain('"recipientPlaintext": "browser recipient"');
  expect(output).toContain('"passphrasePlaintext": "browser passphrase"');
});
