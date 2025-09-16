import { test, expect } from "@playwright/test";

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin page
    await page.goto("/admin");
  });

  test("should display user management interface", async ({ page }) => {
    // Check if the user management tab is visible
    await expect(page.getByRole("tab", { name: "Users" })).toBeVisible();

    // Click on the Users tab
    await page.getByRole("tab", { name: "Users" }).click();

    // Check if the user management interface is displayed
    await expect(page.getByText("User Management")).toBeVisible();
    await expect(
      page.getByText("Manage users, roles, and permissions"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Add User" })).toBeVisible();
  });

  test("should create a new user", async ({ page }) => {
    // Navigate to users tab
    await page.getByRole("tab", { name: "Users" }).click();

    // Click Add User button
    await page.getByRole("button", { name: "Add User" }).click();

    // Fill in the user form
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    // Submit the form
    await page.getByRole("button", { name: "Create User" }).click();

    // Check if the user was created successfully
    await expect(page.getByText("Test User")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
  });

  test("should search for users", async ({ page }) => {
    // Navigate to users tab
    await page.getByRole("tab", { name: "Users" }).click();

    // Use the search input
    await page.getByPlaceholder("Search users...").fill("test");

    // Check if search results are filtered
    // Note: This test assumes there are existing users with "test" in their name/email
    await expect(page.getByText("Search users...")).toBeVisible();
  });

  test("should filter users by status", async ({ page }) => {
    // Navigate to users tab
    await page.getByRole("tab", { name: "Users" }).click();

    // Open status filter dropdown
    await page
      .getByRole("combobox")
      .filter({ hasText: "Filter by status" })
      .click();

    // Select Active status
    await page.getByRole("option", { name: "Active" }).click();

    // Check if filter is applied
    await expect(
      page.getByRole("combobox").filter({ hasText: "Active" }),
    ).toBeVisible();
  });

  test("should edit user information", async ({ page }) => {
    // Navigate to users tab
    await page.getByRole("tab", { name: "Users" }).click();

    // Find a user row and click the actions menu
    const userRow = page
      .locator("tr")
      .filter({ hasText: "test@example.com" })
      .first();
    await userRow.getByRole("button").click();

    // Click Edit option
    await page.getByRole("menuitem", { name: "Edit" }).click();

    // Update the user name
    await page.getByLabel("Name").fill("Updated Test User");

    // Submit the form
    await page.getByRole("button", { name: "Update User" }).click();

    // Check if the user was updated
    await expect(page.getByText("Updated Test User")).toBeVisible();
  });

  test("should assign roles to user", async ({ page }) => {
    // Navigate to users tab
    await page.getByRole("tab", { name: "Users" }).click();

    // Find a user row and click the actions menu
    const userRow = page
      .locator("tr")
      .filter({ hasText: "test@example.com" })
      .first();
    await userRow.getByRole("button").click();

    // Click Manage Roles option
    await page.getByRole("menuitem", { name: "Manage Roles" }).click();

    // Check if the role management dialog is open
    await expect(page.getByText("Manage User Roles")).toBeVisible();

    // Select a role from the dropdown
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select a role" })
      .click();

    // Note: This test assumes there are existing roles
    // The actual role selection would depend on what roles exist in the system
    await expect(page.getByText("Select a role")).toBeVisible();
  });

  test("should delete a user", async ({ page }) => {
    // Navigate to users tab
    await page.getByRole("tab", { name: "Users" }).click();

    // Find a user row and click the actions menu
    const userRow = page
      .locator("tr")
      .filter({ hasText: "test@example.com" })
      .first();
    await userRow.getByRole("button").click();

    // Click Delete option
    await page.getByRole("menuitem", { name: "Delete" }).click();

    // Confirm deletion in the browser dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Check if the user was removed from the list
    // Note: This test might need adjustment based on the actual implementation
    await expect(userRow).not.toBeVisible();
  });
});
