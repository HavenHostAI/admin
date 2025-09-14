import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should load home page", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads successfully
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/.*\//);
  });

  test("should show home page content", async ({ page }) => {
    await page.goto("/");

    // Check for basic page elements
    await expect(page.locator("body")).toBeVisible();
    
    // Check that the page has some content
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });

  test("should handle page refresh", async ({ page }) => {
    await page.goto("/");
    
    await page.reload();
    
    await expect(page.locator("body")).toBeVisible();
  });
});
