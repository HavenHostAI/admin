import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { setupMSW } from "./helpers/msw-setup";

const openUsersTab = async (page: Page) => {
  await page.goto("/admin");
  await page.getByRole("tab", { name: "Users" }).click();
};

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  test("loads user management tab", async ({ page }) => {
    await openUsersTab(page);
    await expect(page.getByText("User Management")).toBeVisible();
    await expect(
      page.getByText("Manage users, roles, and permissions", { exact: true }),
    ).toBeVisible();
  });

  test("creates a new user", async ({ page }) => {
    await openUsersTab(page);
    await page.getByRole("button", { name: "Add User" }).click();
    await page.getByLabel("Name").fill("Playwright User");
    const uniqueEmail = `playwright-${Date.now()}@example.com`;
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create User" }).click();
    await expect(
      page.locator("tr").filter({ hasText: "Playwright User" }),
    ).toBeVisible();
  });

  test("filters by status", async ({ page }) => {
    await openUsersTab(page);
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Inactive" }).click();
    await expect(page.getByRole("combobox").nth(1)).toContainText("Inactive");
  });

  test("searches for users", async ({ page }) => {
    await openUsersTab(page);
    await page.getByPlaceholder("Search users...").fill("admin");
    await expect(
      page.locator("tr").filter({ hasText: "Admin User" }),
    ).toBeVisible();
  });
});
