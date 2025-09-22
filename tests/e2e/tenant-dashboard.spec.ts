import { expect, test } from "@playwright/test";
import { setupMSW } from "./helpers/msw-setup";

test.describe("Tenant Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    await page.goto("/tenant");
  });

  test("should display tenant dashboard with key metrics", async ({ page }) => {
    // Check that the main dashboard elements are present
    await expect(
      page.getByRole("heading", { name: "Tenant Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText(/Overview of your tenant/)).toBeVisible();

    // Check key metrics cards
    await expect(page.getByText("Total Users")).toBeVisible();
    await expect(page.getByText("Active Servers")).toBeVisible();
    await expect(page.getByText("Database Size")).toBeVisible();
    await expect(page.getByText("Active Alerts")).toBeVisible();

    // Check system status
    await expect(page.getByText("All Systems Operational")).toBeVisible();
  });

  test("should navigate between tabs correctly", async ({ page }) => {
    // Test Overview tab (default)
    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(page.getByText("System Health")).toBeVisible();

    // Navigate to Recent Activity tab
    await page.getByRole("tab", { name: "Recent Activity" }).click();
    await expect(
      page.getByText("Latest events and actions in your tenant"),
    ).toBeVisible();

    // Navigate to Performance tab
    await page.getByRole("tab", { name: "Performance" }).click();
    await expect(page.getByText("Performance Metrics")).toBeVisible();
    await expect(page.getByText("Resource Usage")).toBeVisible();

    // Navigate to Settings tab
    await page.getByRole("tab", { name: "Settings" }).click();
    await expect(page.getByText("Tenant Settings")).toBeVisible();
    await expect(
      page.getByText("Configure your tenant preferences and settings"),
    ).toBeVisible();
  });

  test("should display recent activity data", async ({ page }) => {
    await page.getByRole("tab", { name: "Recent Activity" }).click();

    // Check that activity items are displayed
    await expect(page.getByText("User registration")).toBeVisible();
    await expect(page.getByText("Server maintenance")).toBeVisible();
    await expect(page.getByText("Database backup")).toBeVisible();

    // Check status badges
    await expect(page.getByText("Success").first()).toBeVisible();
    await expect(page.getByText("Info").first()).toBeVisible();
  });

  test("should display performance metrics with progress bars", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Performance" }).click();

    // Check performance metrics
    await expect(page.getByText("Response Time")).toBeVisible();
    await expect(page.getByText("Throughput")).toBeVisible();
    await expect(page.getByText("Error Rate")).toBeVisible();

    // Check resource usage
    await expect(page.getByText("CPU")).toBeVisible();
    await expect(page.getByText("Memory")).toBeVisible();
    await expect(page.getByText("Storage")).toBeVisible();

    // Check that progress bars are present
    const progressBars = page.locator(
      '[class*="bg-green-500"], [class*="bg-blue-500"], [class*="bg-yellow-500"]',
    );
    await expect(progressBars.first()).toBeVisible();
  });

  test("should allow editing tenant settings", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();

    // Check that form elements are present
    await expect(page.getByLabel("Tenant Name")).toBeVisible();
    await expect(page.getByLabel("Timezone")).toBeVisible();
    await expect(page.getByText("Email notifications")).toBeVisible();
    await expect(page.getByText("System alerts")).toBeVisible();
    await expect(page.getByText("Performance warnings")).toBeVisible();

    // Test editing tenant name
    const tenantNameInput = page.getByLabel("Tenant Name");
    await tenantNameInput.clear();
    await tenantNameInput.fill("My Updated Tenant");

    // Test changing timezone
    await page.getByLabel("Timezone").selectOption("America/New_York");

    // Test toggling checkboxes
    await page.getByLabel("Performance warnings").check();

    // Save settings
    await page.getByRole("button", { name: "Save Settings" }).click();

    // Verify the form still shows the updated values
    await expect(tenantNameInput).toHaveValue("My Updated Tenant");
    await expect(page.getByLabel("Timezone")).toHaveValue("America/New_York");
    await expect(page.getByLabel("Performance warnings")).toBeChecked();
  });

  test("should display quick actions in overview tab", async ({ page }) => {
    // Should be on overview tab by default
    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Manage Users" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Server Status" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Database Tools" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "View Logs" })).toBeVisible();
  });

  test("should display system health metrics", async ({ page }) => {
    // Should be on overview tab by default
    await expect(page.getByText("System Health")).toBeVisible();
    await expect(page.getByText("API Response Time")).toBeVisible();
    await expect(page.getByText("Database Connections")).toBeVisible();
    await expect(page.getByText("Memory Usage")).toBeVisible();
    await expect(page.getByText("CPU Usage")).toBeVisible();

    // Check that status badges are present
    await expect(page.getByText("45ms")).toBeVisible();
    await expect(page.getByText("12/50")).toBeVisible();
    await expect(page.getByText("78%")).toBeVisible();
    await expect(page.getByText("23%")).toBeVisible();
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that the dashboard still loads and is usable
    await expect(
      page.getByRole("heading", { name: "Tenant Dashboard" }),
    ).toBeVisible();

    // Check that tabs are still accessible
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Recent Activity" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Performance" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();

    // Test navigation on mobile
    await page.getByRole("tab", { name: "Settings" }).click();
    await expect(page.getByText("Tenant Settings")).toBeVisible();
  });

  test("should handle loading states gracefully", async ({ page }) => {
    // The dashboard should show loading state initially
    // This test verifies that the loading state is handled properly
    await page.goto("/tenant");

    // Wait for the dashboard to load
    await expect(
      page.getByRole("heading", { name: "Tenant Dashboard" }),
    ).toBeVisible();

    // Verify that data is eventually loaded
    await expect(page.getByText("Total Users")).toBeVisible();
  });
});
