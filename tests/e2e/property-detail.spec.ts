import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { setupMSW } from "./helpers/msw-setup";

const goToFirstPropertyDetail = async (page: Page) => {
  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow).toBeVisible();

  const firstPropertyLink = firstRow.locator("a").first();
  const propertyName = (await firstPropertyLink.textContent())?.trim() ?? "";

  await firstPropertyLink.click();

  await expect(page).toHaveURL(/\/properties\/[^/]+$/);
  if (propertyName) {
    await expect(
      page.getByRole("heading", { name: propertyName, level: 1 }),
    ).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  return propertyName;
};

test.describe("Property Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    // Navigate to properties page and ensure we're logged in
    await page.goto("/properties");

    // Wait for the page to load
    await expect(page.getByText("Property Management")).toBeVisible();
  });

  test("should navigate to property detail page when clicking property name", async ({
    page,
  }) => {
    const propertyName = await goToFirstPropertyDetail(page);

    if (propertyName) {
      await expect(
        page.getByRole("heading", { name: propertyName, level: 1 }),
      ).toBeVisible();
    }
  });

  test("should display property information correctly", async ({ page }) => {
    await goToFirstPropertyDetail(page);

    // Verify basic property information is displayed
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Server • ID:/)).toBeVisible();
    await expect(page.getByTestId("property-status")).toBeVisible();

    // Verify metadata section
    await expect(page.getByText("Metadata")).toBeVisible();
    await expect(page.getByText("Created")).toBeVisible();
    await expect(page.getByText("Last Updated")).toBeVisible();
  });

  test("should display property configuration", async ({ page }) => {
    await goToFirstPropertyDetail(page);

    // Verify configuration section exists
    await expect(
      page.getByRole("heading", { name: "Configuration", level: 3 }),
    ).toBeVisible();

    // Configuration should either show data or "No configuration data available"
    await expect(page.getByTestId("property-configuration")).toBeVisible();
  });

  test("should show back button and navigate back", async ({ page }) => {
    await goToFirstPropertyDetail(page);

    // Verify back button exists
    const backButton = page.getByRole("button", { name: /^Back$/ });
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
    await goToFirstPropertyDetail(page);

    // Click actions button
    const actionsButton = page.getByTestId("property-actions-button");
    await actionsButton.click();

    // Verify dropdown menu appears with expected options
    await expect(
      page.getByRole("menuitem", { name: "Edit Property" }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Delete" })).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /Activate|Deactivate/ }),
    ).toBeVisible();
  });

  test("should open edit dialog when edit is clicked", async ({ page }) => {
    await goToFirstPropertyDetail(page);

    // Open actions dropdown
    await page.getByTestId("property-actions-button").click();

    // Click edit
    await page.getByRole("menuitem", { name: "Edit Property" }).click();

    // Verify edit dialog opens
    await expect(
      page.getByRole("dialog", { name: "Edit Property" }),
    ).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();
  });

  test("should handle delete confirmation", async ({ page }) => {
    await goToFirstPropertyDetail(page);

    // Open actions dropdown
    await page.getByTestId("property-actions-button").click();

    // Click delete
    let dialogMessage = "";
    page.once("dialog", (dialog) => {
      dialogMessage = dialog.message();
      dialog.dismiss().catch(() => undefined);
    });
    await page.getByRole("menuitem", { name: "Delete" }).click();
    expect(dialogMessage).toMatch(/delete/iu);
  });

  test("should show correct status badges", async ({ page }) => {
    await goToFirstPropertyDetail(page);

    // Verify status badges are displayed
    await expect(page.getByTestId("property-status-label")).toBeVisible();
    await expect(page.getByTestId("property-active-state")).toBeVisible();
  });

  test("should display property type with correct icon", async ({ page }) => {
    await goToFirstPropertyDetail(page);

    // Verify property type is displayed
    await expect(page.getByRole("heading", { name: "Type" })).toBeVisible();
    await expect(page.getByTestId("property-type-label")).toHaveText("Server");

    // Verify type icon is present (SVG icon)
    const typeIcon = page.locator("svg").first();
    await expect(typeIcon).toBeVisible();
  });

  test("should handle 404 for non-existent property", async ({ page }) => {
    // Navigate to a non-existent property ID
    await page.goto("/properties/non-existent-id");

    // Should show an inline error state
    await expect(page.getByTestId("property-error")).toBeVisible();
    await expect(page.getByText("Property not found")).toBeVisible();
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to first property detail page
    await goToFirstPropertyDetail(page);

    // Verify key elements are still visible on mobile
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Back$/ })).toBeVisible();
    await expect(page.getByTestId("property-actions-button")).toBeVisible();

    // Verify the layout adapts (cards should stack vertically)
    const cards = page.getByTestId("property-card");
    await expect(cards).toHaveCount(2);
  });

  test("should maintain state when navigating between properties", async ({
    page,
  }) => {
    const firstPropertyName = await goToFirstPropertyDetail(page);

    // Go back to properties list
    await page.getByRole("button", { name: /^Back$/ }).click();
    await expect(page).toHaveURL("/properties");

    // Navigate to second property if available
    const secondPropertyLink = page.locator(
      "table tbody tr:nth-child(2) td:first-child a",
    );
    if (await secondPropertyLink.isVisible()) {
      await secondPropertyLink.click();

      // Verify we're on a different property page
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const secondPropertyName = await page
        .getByRole("heading", { level: 1 })
        .first()
        .textContent();
      expect(secondPropertyName).not.toBe(firstPropertyName);
    }
  });
});
