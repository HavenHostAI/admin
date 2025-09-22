import { expect, test } from "@playwright/test";
import { setupMSW } from "./helpers/msw-setup";

test.describe("Post Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  test("home page encourages sign in when logged out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.locator("text=Your most recent post")).toHaveCount(0);
  });
});
