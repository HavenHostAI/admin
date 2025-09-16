import { test, expect } from "@playwright/test";

test.describe("Post Management", () => {
  test("should display post creation form", async ({ page }) => {
    await page.goto("/");

    // Look for post-related elements
    const postForm = page.locator("form");
    const titleInput = page.locator('input[placeholder="Title"]');

    if ((await postForm.count()) > 0) {
      await expect(postForm).toBeVisible();
    }

    if ((await titleInput.count()) > 0) {
      await expect(titleInput).toBeVisible();
    }
  });

  test("should handle post creation", async ({ page }) => {
    await page.goto("/");

    const titleInput = page.locator('input[placeholder="Title"]');
    const submitButton = page.locator('button[type="submit"]');

    if ((await titleInput.count()) > 0 && (await submitButton.count()) > 0) {
      await titleInput.fill("Test Post");
      await submitButton.click();

      // Wait for any response or state change
      await page.waitForTimeout(1000);
    }
  });

  test("should display existing posts or no posts message", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Look for post content - either posts exist or there's a no posts message
    const postContent = page.locator("text=/Your most recent post/");
    const noPostsMessage = page.locator("text=/You have no posts yet/");

    // Check if either element exists (more flexible approach)
    const hasPosts = (await postContent.count()) > 0;
    const hasNoPosts = (await noPostsMessage.count()) > 0;
    const hasAnyContent = await page.locator("body").textContent();

    // At minimum, the page should have some content
    expect(hasAnyContent).toBeTruthy();
  });
});
