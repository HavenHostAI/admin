import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should load home page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/.*\//);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have proper page title", async ({ page }) => {
    await page.goto("/");

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("should handle page refresh", async ({ page }) => {
    await page.goto("/");

    await page.reload();

    await expect(page.locator("body")).toBeVisible();
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("body")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator("body")).toBeVisible();
  });
});
