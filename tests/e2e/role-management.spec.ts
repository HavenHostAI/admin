import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { setupMSW } from "./helpers/msw-setup";

const openRolesTab = async (page: Page) => {
  await page.goto("/admin");
  await page.getByRole("tab", { name: "Roles" }).click();
};

test.describe("Role Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  test("loads role management tab", async ({ page }) => {
    await openRolesTab(page);
    await expect(
      page.getByRole("heading", { name: "Role Management" }),
    ).toBeVisible();
    await expect(
      page.getByText("Manage roles and their permissions"),
    ).toBeVisible();
  });

  test("creates a new role", async ({ page }) => {
    await openRolesTab(page);
    await page.getByRole("button", { name: "Add Role" }).click();
    await page.getByLabel("Role Name").fill("Automation Role");
    await page
      .getByLabel("Description")
      .fill("Role created during automated testing");
    await page.getByRole("button", { name: "Create Role" }).click();
    await expect(
      page.locator("tr").filter({ hasText: "Automation Role" }),
    ).toBeVisible();
  });

  test("shows role type badges", async ({ page }) => {
    await openRolesTab(page);
    await expect(page.getByText("System")).toBeVisible();
    await expect(page.getByText("Custom")).toBeVisible();
  });

  test("displays permission counts", async ({ page }) => {
    await openRolesTab(page);
    await expect(page.locator("tbody tr").first()).toContainText("permissions");
  });

  test("paginates when many roles exist", async ({ page }) => {
    await openRolesTab(page);
    for (let i = 0; i < 12; i++) {
      await page.getByRole("button", { name: "Add Role" }).click();
      await page.getByLabel("Role Name").fill(`Paginated Role ${i}`);
      await page.getByRole("button", { name: "Create Role" }).click();
    }
    await expect(
      page.getByRole("button", { name: "Next", exact: true }).first(),
    ).toBeVisible();
  });
});
