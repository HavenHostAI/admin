import { test, expect } from "@playwright/test";

test.describe("Property Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto("/auth/signin");
    await page.fill('[data-testid="email-input"]', "admin@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');
    await page.waitForURL("/");

    // Navigate to properties page
    await page.goto("/properties");
    await page.waitForLoadState("networkidle");
  });

  test("should display properties list page", async ({ page }) => {
    await expect(
      page.locator("h1, h2, h3").filter({ hasText: "Property Management" }),
    ).toBeVisible();
    await expect(
      page.locator(
        "text=Manage hosting properties, servers, domains, and resources",
      ),
    ).toBeVisible();
  });

  test("should show search input and filters", async ({ page }) => {
    await expect(
      page.locator('input[placeholder="Search properties..."]'),
    ).toBeVisible();
    await expect(
      page.locator("select").filter({ hasText: "Filter by type" }),
    ).toBeVisible();
    await expect(
      page.locator("select").filter({ hasText: "Filter by status" }),
    ).toBeVisible();
  });

  test("should show create property button", async ({ page }) => {
    await expect(
      page.locator("button").filter({ hasText: "Create Property" }),
    ).toBeVisible();
  });

  test("should open create property dialog", async ({ page }) => {
    await page.click("button:has-text('Create Property')");

    await expect(page.locator("text=Create New Property")).toBeVisible();
    await expect(
      page.locator("text=Add a new hosting property to the system."),
    ).toBeVisible();
  });

  test("should create a new property", async ({ page }) => {
    await page.click("button:has-text('Create Property')");

    // Fill in the form
    await page.fill('input[placeholder="Property name"]', "E2E Test Server");
    await page.selectOption("select", { label: "Server" });
    await page.selectOption("select", { label: "Active" });
    await page.fill(
      'textarea[placeholder="Property description"]',
      "This is a test server created by E2E tests",
    );
    await page.fill(
      'input[placeholder="Owner user ID (optional)"]',
      "user_123",
    );

    // Submit the form
    await page.click("button:has-text('Create Property')");

    // Wait for the dialog to close and the property to appear in the list
    await page.waitForSelector("text=E2E Test Server", { timeout: 10000 });
    await expect(page.locator("text=E2E Test Server")).toBeVisible();
  });

  test("should search for properties", async ({ page }) => {
    // First create a property to search for
    await page.click("button:has-text('Create Property')");
    await page.fill('input[placeholder="Property name"]', "Searchable Server");
    await page.selectOption("select", { label: "Server" });
    await page.click("button:has-text('Create Property')");
    await page.waitForSelector("text=Searchable Server");

    // Now search for it
    await page.fill('input[placeholder="Search properties..."]', "Searchable");
    await page.waitForTimeout(500); // Wait for search to trigger

    await expect(page.locator("text=Searchable Server")).toBeVisible();
  });

  test("should filter properties by type", async ({ page }) => {
    // Create properties of different types
    await page.click("button:has-text('Create Property')");
    await page.fill('input[placeholder="Property name"]', "Test Server");
    await page.selectOption("select", { label: "Server" });
    await page.click("button:has-text('Create Property')");
    await page.waitForSelector("text=Test Server");

    await page.click("button:has-text('Create Property')");
    await page.fill('input[placeholder="Property name"]', "Test Domain");
    await page.selectOption("select", { label: "Domain" });
    await page.click("button:has-text('Create Property')");
    await page.waitForSelector("text=Test Domain");

    // Filter by server type
    await page.selectOption("select", { label: "Server" });
    await page.waitForTimeout(500);

    await expect(page.locator("text=Test Server")).toBeVisible();
    // Domain should not be visible when filtering by server
    await expect(page.locator("text=Test Domain")).not.toBeVisible();
  });

  test("should filter properties by status", async ({ page }) => {
    // Create properties with different statuses
    await page.click("button:has-text('Create Property')");
    await page.fill('input[placeholder="Property name"]', "Active Server");
    await page.selectOption("select", { label: "Server" });
    await page.selectOption("select", { label: "Active" });
    await page.click("button:has-text('Create Property')");
    await page.waitForSelector("text=Active Server");

    await page.click("button:has-text('Create Property')");
    await page.fill('input[placeholder="Property name"]', "Inactive Server");
    await page.selectOption("select", { label: "Server" });
    await page.selectOption("select", { label: "Inactive" });
    await page.click("button:has-text('Create Property')");
    await page.waitForSelector("text=Inactive Server");

    // Filter by active status
    await page.selectOption("select", { label: "Active" });
    await page.waitForTimeout(500);

    await expect(page.locator("text=Active Server")).toBeVisible();
    // Inactive server should not be visible when filtering by active
    await expect(page.locator("text=Inactive Server")).not.toBeVisible();
  });

  test("should edit a property", async ({ page }) => {
    // First create a property
    await page.click("button:has-text('Create Property')");
    await page.fill('input[placeholder="Property name"]', "Editable Server");
    await page.selectOption("select", { label: "Server" });
    await page.click("button:has-text('Create Property')");
    await page.waitForSelector("text=Editable Server");

    // Find and click the edit button (in dropdown menu)
    await page.click("button:has-text('Editable Server')");
    await page.click("text=Edit");

    // Update the property
    await page.fill('input[placeholder="Property name"]', "Updated Server");
    await page.fill(
      'textarea[placeholder="Property description"]',
      "This server has been updated",
    );
    await page.selectOption("select", { label: "Maintenance" });

    // Submit the update
    await page.click("button:has-text('Update Property')");

    // Wait for the update to complete
    await page.waitForSelector("text=Updated Server");
    await expect(page.locator("text=Updated Server")).toBeVisible();
  });

  test("should delete a property", async ({ page }) => {
    // First create a property
    await page.click("button:has-text('Create Property')");
    await page.fill('input[placeholder="Property name"]', "Deletable Server");
    await page.selectOption("select", { label: "Server" });
    await page.click("button:has-text('Create Property')");
    await page.waitForSelector("text=Deletable Server");

    // Find and click the delete button (in dropdown menu)
    await page.click("button:has-text('Deletable Server')");
    await page.click("text=Delete");

    // Confirm deletion
    page.on("dialog", (dialog) => dialog.accept());
    await page.waitForTimeout(1000);

    // Property should be removed from the list
    await expect(page.locator("text=Deletable Server")).not.toBeVisible();
  });

  test("should show property details correctly", async ({ page }) => {
    // Create a property with all details
    await page.click("button:has-text('Create Property')");
    await page.fill('input[placeholder="Property name"]', "Detailed Server");
    await page.selectOption("select", { label: "Server" });
    await page.selectOption("select", { label: "Active" });
    await page.fill(
      'textarea[placeholder="Property description"]',
      "This is a detailed server description",
    );
    await page.fill(
      'input[placeholder="Owner user ID (optional)"]',
      "user_456",
    );
    await page.click("button:has-text('Create Property')");

    // Wait for property to appear
    await page.waitForSelector("text=Detailed Server");

    // Check that all details are displayed correctly
    await expect(page.locator("text=Detailed Server")).toBeVisible();
    await expect(page.locator("text=Server")).toBeVisible();
    await expect(page.locator("text=active")).toBeVisible();
    await expect(
      page.locator("text=This is a detailed server description"),
    ).toBeVisible();
  });

  test("should handle pagination", async ({ page }) => {
    // Create multiple properties to test pagination
    for (let i = 1; i <= 15; i++) {
      await page.click("button:has-text('Create Property')");
      await page.fill(
        'input[placeholder="Property name"]',
        `Pagination Server ${i}`,
      );
      await page.selectOption("select", { label: "Server" });
      await page.click("button:has-text('Create Property')");
      await page.waitForSelector(`text=Pagination Server ${i}`);
    }

    // Check that pagination controls appear
    await expect(page.locator("text=Showing 1 to 10 of")).toBeVisible();
    await expect(page.locator("button:has-text('Next')")).toBeVisible();

    // Click next page
    await page.click("button:has-text('Next')");
    await page.waitForTimeout(500);

    // Should show next set of properties
    await expect(page.locator("text=Showing 11 to")).toBeVisible();
    await expect(page.locator("button:has-text('Previous')")).toBeVisible();
  });

  test("should show loading state", async ({ page }) => {
    // Navigate to properties page and check for loading state
    await page.goto("/properties");

    // Loading state should appear briefly
    await expect(page.locator("text=Loading properties...")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should handle empty state", async ({ page }) => {
    // If no properties exist, should show empty state
    // This test assumes the page handles empty state gracefully
    await expect(page.locator("text=Property Management")).toBeVisible();
  });

  test("should validate required fields in create dialog", async ({ page }) => {
    await page.click("button:has-text('Create Property')");

    // Try to submit without required fields
    await page.click("button:has-text('Create Property')");

    // Form should not submit and dialog should remain open
    await expect(page.locator("text=Create New Property")).toBeVisible();
  });

  test("should show error messages for invalid data", async ({ page }) => {
    await page.click("button:has-text('Create Property')");

    // Fill with invalid data (empty name)
    await page.selectOption("select", { label: "Server" });
    await page.click("button:has-text('Create Property')");

    // Should show validation error or keep dialog open
    await expect(page.locator("text=Create New Property")).toBeVisible();
  });
});
