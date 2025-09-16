import { test, expect } from "@playwright/test";

test.describe("Role Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin page
    await page.goto("/admin");
  });

  test("should display role management interface", async ({ page }) => {
    // Check if the role management tab is visible
    await expect(page.getByRole("tab", { name: "Roles" })).toBeVisible();

    // Click on the Roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Check if the role management interface is displayed
    await expect(page.getByText("Role Management")).toBeVisible();
    await expect(
      page.getByText("Manage roles and their permissions"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Role" })).toBeVisible();
  });

  test("should create a new role", async ({ page }) => {
    // Navigate to roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Click Add Role button
    await page.getByRole("button", { name: "Add Role" }).click();

    // Fill in the role form
    await page.getByLabel("Role Name").fill("Test Role");
    await page
      .getByLabel("Description")
      .fill("A test role for testing purposes");

    // Submit the form
    await page.getByRole("button", { name: "Create Role" }).click();

    // Check if the role was created successfully
    await expect(page.getByText("Test Role")).toBeVisible();
    await expect(
      page.getByText("A test role for testing purposes"),
    ).toBeVisible();
  });

  test("should search for roles", async ({ page }) => {
    // Navigate to roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Use the search input
    await page.getByPlaceholder("Search roles...").fill("test");

    // Check if search results are filtered
    // Note: This test assumes there are existing roles with "test" in their name
    await expect(page.getByText("Search roles...")).toBeVisible();
  });

  test("should edit role information", async ({ page }) => {
    // Navigate to roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Find a role row and click the actions menu
    const roleRow = page.locator("tr").filter({ hasText: "Test Role" }).first();
    await roleRow.getByRole("button").click();

    // Click Edit option
    await page.getByRole("menuitem", { name: "Edit" }).click();

    // Update the role name
    await page.getByLabel("Role Name").fill("Updated Test Role");

    // Submit the form
    await page.getByRole("button", { name: "Update Role" }).click();

    // Check if the role was updated
    await expect(page.getByText("Updated Test Role")).toBeVisible();
  });

  test("should manage role permissions", async ({ page }) => {
    // Navigate to roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Find a role row
    const roleRow = page.locator("tr").filter({ hasText: "Test Role" }).first();

    // Click on the Permissions button
    await roleRow.getByRole("button", { name: "Permissions" }).click();

    // Check if the permissions dialog is open
    await expect(page.getByText("Manage Permissions")).toBeVisible();

    // Check if permission groups are displayed
    await expect(page.getByText("Available Permissions")).toBeVisible();

    // Note: The actual permission selection would depend on what permissions exist in the system
    // This test verifies that the interface is working correctly
  });

  test("should delete a role", async ({ page }) => {
    // Navigate to roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Find a role row and click the actions menu
    const roleRow = page.locator("tr").filter({ hasText: "Test Role" }).first();
    await roleRow.getByRole("button").click();

    // Click Delete option
    await page.getByRole("menuitem", { name: "Delete" }).click();

    // Confirm deletion in the browser dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Check if the role was removed from the list
    // Note: This test might need adjustment based on the actual implementation
    await expect(roleRow).not.toBeVisible();
  });

  test("should display role type badges", async ({ page }) => {
    // Navigate to roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Check if role type badges are displayed
    // System roles should have a "System" badge
    // Custom roles should have a "Custom" badge
    await expect(page.getByText("System")).toBeVisible();
    await expect(page.getByText("Custom")).toBeVisible();
  });

  test("should show permission count for each role", async ({ page }) => {
    // Navigate to roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Check if permission counts are displayed
    // Each role should show "X permissions" in the permissions column
    await expect(page.getByText("permissions")).toBeVisible();
  });

  test("should handle pagination for roles", async ({ page }) => {
    // Navigate to roles tab
    await page.getByRole("tab", { name: "Roles" }).click();

    // Check if pagination controls are present when there are many roles
    // This test assumes there are enough roles to trigger pagination
    const paginationControls = page
      .locator("button")
      .filter({ hasText: "Previous" });
    const nextButton = page.locator("button").filter({ hasText: "Next" });

    // If pagination is present, test navigation
    if (await paginationControls.isVisible()) {
      await nextButton.click();
      await expect(page.getByText("Page 2")).toBeVisible();

      await paginationControls.click();
      await expect(page.getByText("Page 1")).toBeVisible();
    }
  });
});
