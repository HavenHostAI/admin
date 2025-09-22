import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { setupMSW } from "./helpers/msw-setup";

const openCreateDialog = async (page: Page) => {
  await page.getByRole("button", { name: "Create Property" }).first().click();
  await expect(
    page.getByRole("dialog", { name: "Create New Property" }),
  ).toBeVisible();
};

const selectComboboxOption = async (
  page: Page,
  comboboxIndex: number,
  optionText: string,
) => {
  const trigger = page.getByRole("combobox").nth(comboboxIndex);
  await trigger.click();
  await page.getByRole("option", { name: optionText }).first().click();
};

const createProperty = async (
  page: Page,
  name: string,
  type: string,
  status: string,
  description?: string,
  options: { waitForRow?: boolean } = {},
) => {
  await openCreateDialog(page);
  await page.getByPlaceholder("Property name").fill(name);
  await selectComboboxOption(page, 0, type);
  await selectComboboxOption(page, 1, status);
  if (description) {
    await page.getByPlaceholder("Property description").fill(description);
  }
  await page.getByRole("button", { name: "Create Property" }).last().click();
  await expect(
    page.getByRole("dialog", { name: "Create New Property" }),
  ).not.toBeVisible();
  if (options.waitForRow ?? true) {
    await expect(page.locator("tr").filter({ hasText: name })).toBeVisible();
  }
};

test.describe("Property Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    await page.goto("/properties");
  });

  test("shows initial property list", async ({ page }) => {
    await expect(page.getByText("Property Management")).toBeVisible();
    await expect(
      page.getByRole("row", { name: /Test Server 1/ }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Search properties...")).toBeVisible();
  });

  test("creates a property", async ({ page }) => {
    await createProperty(
      page,
      "E2E Test Server",
      "Server",
      "Active",
      "Created during e2e run",
    );
    await expect(
      page.getByRole("row", { name: /E2E Test Server/ }),
    ).toBeVisible();
  });

  test("filters by search and type", async ({ page }) => {
    await page.getByPlaceholder("Search properties...").fill("Domain");
    await page.waitForTimeout(300);
    await expect(
      page.locator("tr").filter({ hasText: "Test Domain 1" }),
    ).toBeVisible();
    await expect(
      page.locator("tr").filter({ hasText: "Test Server 1" }),
    ).toHaveCount(0);

    await page.getByPlaceholder("Search properties...").fill("");
    await selectComboboxOption(page, 0, "Server");
    await page.waitForTimeout(300);
    await expect(
      page.locator("tr").filter({ hasText: "Test Server 1" }),
    ).toBeVisible();
    await expect(
      page.locator("tr").filter({ hasText: "Test Domain 1" }),
    ).toHaveCount(0);
  });

  test("edits a property", async ({ page }) => {
    await createProperty(page, "Editable Server", "Server", "Active");
    const row = page.locator("tr").filter({ hasText: "Editable Server" });
    await row
      .getByRole("button", { name: /Actions for Editable Server/ })
      .click();
    await page
      .getByRole("button", { name: /^Edit$/ })
      .first()
      .click();
    await expect(
      page.getByRole("dialog", { name: "Edit Property" }),
    ).toBeVisible();
    await page.getByPlaceholder("Property name").fill("Updated Server");
    await page.getByRole("button", { name: "Update Property" }).click();
    await expect(
      page.locator("tr").filter({ hasText: "Updated Server" }),
    ).toBeVisible();
  });

  test("deletes a property", async ({ page }) => {
    await createProperty(page, "Disposable Server", "Server", "Active");
    const row = page.locator("tr").filter({ hasText: "Disposable Server" });
    await row
      .getByRole("button", { name: /Actions for Disposable Server/ })
      .click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(
      page.locator("tr").filter({ hasText: "Disposable Server" }),
    ).toHaveCount(0);
  });

  test("paginates when more than a page of properties exist", async ({
    page,
  }) => {
    // Create properties in parallel for better performance
    const propertyPromises = Array.from({ length: 12 }, (_, i) =>
      createProperty(
        page,
        `Pagination Server ${i + 1}`,
        "Server",
        "Active",
        undefined,
        {
          waitForRow: false, // Don't wait for individual rows since we're creating in parallel
        },
      ),
    );

    await Promise.all(propertyPromises);

    // Wait for the first page to load with the expected count
    await expect(page.getByText(/Showing 1 to 10 of/)).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(/Showing 11 to/)).toBeVisible();
  });

  test("shows loading state briefly", async ({ page }) => {
    await page.goto("/properties");
    await expect(page.getByText("Loading properties...")).toBeVisible();
  });

  test("requires mandatory fields", async ({ page }) => {
    await openCreateDialog(page);
    const nameInput = page.getByPlaceholder("Property name");
    await expect(nameInput).toHaveAttribute("required", "");
  });
});
