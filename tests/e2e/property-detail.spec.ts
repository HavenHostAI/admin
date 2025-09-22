import { test, expect } from "@playwright/test";

test.describe("Property Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to properties page and ensure we're logged in
    await page.goto("/properties");

    // Wait for the page to load
    await expect(page.locator("h1, [data-testid='page-title']")).toBeVisible();
  });

  test("should navigate to property detail page when clicking property name", async ({
    page,
  }) => {
    // Wait for properties to load
    await expect(page.locator("table tbody tr")).toHaveCount({ min: 1 });

    // Get the first property name link
    const firstPropertyLink = page.locator(
      "table tbody tr:first-child td:first-child a",
    );
    await expect(firstPropertyLink).toBeVisible();

    // Get the property name to verify we're on the right page
    const propertyName = await firstPropertyLink.textContent();
    expect(propertyName).toBeTruthy();

    // Click the property name link
    await firstPropertyLink.click();

    // Verify we're on the property detail page
    await expect(page).toHaveURL(/\/properties\/[^\/]+$/);

    // Verify the property name is displayed in the header
    await expect(page.locator("h1")).toContainText(propertyName!.trim());
  });

  test("should display property information correctly", async ({ page }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Verify basic property information is displayed
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Server • ID:")).toBeVisible();
    await expect(
      page.locator("[data-testid='property-status'], .badge").first(),
    ).toBeVisible();

    // Verify metadata section
    await expect(page.locator("text=Metadata")).toBeVisible();
    await expect(page.locator("text=Created")).toBeVisible();
    await expect(page.locator("text=Last Updated")).toBeVisible();
  });

  test("should display property configuration", async ({ page }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Verify configuration section exists
    await expect(page.locator("text=Configuration")).toBeVisible();

    // Configuration should either show data or "No configuration data available"
    const configSection = page
      .locator("text=Configuration")
      .locator("..")
      .locator("..");
    await expect(configSection).toBeVisible();
  });

  test("should show back button and navigate back", async ({ page }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Verify back button exists
    const backButton = page.locator("text=Back");
    await expect(backButton).toBeVisible();

    // Click back button
    await backButton.click();

    // Verify we're back on the properties list page
    await expect(page).toHaveURL("/properties");
    await expect(page.locator("text=Property Management")).toBeVisible();
  });

  test("should show actions dropdown with available options", async ({
    page,
  }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Click actions button
    const actionsButton = page.locator("text=Actions");
    await expect(actionsButton).toBeVisible();
    await actionsButton.click();

    // Verify dropdown menu appears with expected options
    await expect(page.locator("text=Edit Property")).toBeVisible();
    await expect(page.locator("text=Delete")).toBeVisible();

    // Should show either Activate or Deactivate based on property status
    const activateOrDeactivate = page
      .locator("text=Activate, text=Deactivate")
      .first();
    await expect(activateOrDeactivate).toBeVisible();
  });

  test("should open edit dialog when edit is clicked", async ({ page }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Open actions dropdown
    await page.locator("text=Actions").click();

    // Click edit
    await page.locator("text=Edit Property").click();

    // Verify edit dialog opens
    await expect(page.locator("text=Edit Property").first()).toBeVisible();
    await expect(page.locator("input[name='name']")).toBeVisible();
  });

  test("should handle delete confirmation", async ({ page }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Open actions dropdown
    await page.locator("text=Actions").click();

    // Click delete
    await page.locator("text=Delete").click();

    // Verify confirmation dialog appears
    await expect(page.locator("text=Are you sure")).toBeVisible();
  });

  test("should show correct status badges", async ({ page }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Verify status badges are displayed
    const statusBadges = page.locator(".badge");
    await expect(statusBadges).toHaveCount({ min: 2 }); // Status and Active/Inactive badges

    // At least one badge should be visible
    await expect(statusBadges.first()).toBeVisible();
  });

  test("should display property type with correct icon", async ({ page }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Verify property type is displayed
    await expect(page.locator("text=Server")).toBeVisible();

    // Verify type icon is present (SVG icon)
    const typeIcon = page.locator("svg").first();
    await expect(typeIcon).toBeVisible();
  });

  test("should handle 404 for non-existent property", async ({ page }) => {
    // Navigate to a non-existent property ID
    await page.goto("/properties/non-existent-id");

    // Should show 404 page or redirect
    // The exact behavior depends on your 404 handling
    await expect(
      page.locator("text=404, text=Not Found, text=Property not found"),
    ).toBeVisible();
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load
    await expect(page.locator("h1")).toBeVisible();

    // Verify key elements are still visible on mobile
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Back")).toBeVisible();
    await expect(page.locator("text=Actions")).toBeVisible();

    // Verify the layout adapts (cards should stack vertically)
    const cards = page.locator(".card, [class*='card']");
    await expect(cards).toHaveCount({ min: 2 });
  });

  test("should maintain state when navigating between properties", async ({
    page,
  }) => {
    // Navigate to first property detail page
    await page.locator("table tbody tr:first-child td:first-child a").click();

    // Wait for the page to load and get the property name
    await expect(page.locator("h1")).toBeVisible();
    const firstPropertyName = await page.locator("h1").textContent();

    // Go back to properties list
    await page.locator("text=Back").click();
    await expect(page).toHaveURL("/properties");

    // Navigate to second property if available
    const secondPropertyLink = page.locator(
      "table tbody tr:nth-child(2) td:first-child a",
    );
    if (await secondPropertyLink.isVisible()) {
      await secondPropertyLink.click();

      // Verify we're on a different property page
      await expect(page.locator("h1")).toBeVisible();
      const secondPropertyName = await page.locator("h1").textContent();
      expect(secondPropertyName).not.toBe(firstPropertyName);
    }
  });
});
