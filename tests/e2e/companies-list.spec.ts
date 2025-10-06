import { expect, test, type Page } from "@playwright/test";

import { pollForStoredToken, setupConvexMocks } from "./convexMocks";

const signInAsOwner = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("OWNER@example.com  ");
  await page.getByLabel("Password").fill("owner-password!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: /dashboard/i }),
  ).toBeVisible();
  await pollForStoredToken(page);

  await page.goto("/companies");
  await expect(
    page.getByRole("heading", { level: 2, name: /companies/i }),
  ).toBeVisible();
};

test.describe("Companies list", () => {
  test("renders company rows with the expected headers", async ({ page }) => {
    const mocks = await setupConvexMocks(page);

    const companies = [
      {
        _id: "company_1",
        name: "HavenHost",
        plan: "Pro",
        timezone: "America/New_York",
        createdAt: "2024-05-15T14:20:00.000Z",
      },
      {
        _id: "company_2",
        name: "Acme Ventures",
        plan: "Growth",
        timezone: "Europe/London",
        createdAt: "2023-11-05T09:45:00.000Z",
      },
      {
        _id: "company_3",
        name: "Sunrise Studios",
        plan: "Starter",
        timezone: "America/Los_Angeles",
        createdAt: "2024-02-01T21:10:00.000Z",
      },
    ];

    mocks.setAdminListResponse("companies", {
      data: companies,
      total: companies.length,
    });

    await signInAsOwner(page);

    const table = page.getByRole("table");
    await expect(table.getByRole("button", { name: "Name" })).toBeVisible();
    await expect(table.getByRole("button", { name: "Plan" })).toBeVisible();
    await expect(table.getByRole("button", { name: "Timezone" })).toBeVisible();
    await expect(table.getByRole("button", { name: "Created" })).toBeVisible();

    const havenRow = table.getByRole("row", { name: /HavenHost/ });
    await expect(havenRow).toContainText("HavenHost");
    await expect(havenRow).toContainText("Pro");
    await expect(havenRow).toContainText("America/New_York");
    await expect(havenRow).toContainText(/2024/);

    const acmeRow = table.getByRole("row", { name: /Acme Ventures/ });
    await expect(acmeRow).toContainText("Acme Ventures");
    await expect(acmeRow).toContainText("Growth");
    await expect(acmeRow).toContainText("Europe/London");
    await expect(acmeRow).toContainText(/2023/);

    const sunriseRow = table.getByRole("row", { name: /Sunrise Studios/ });
    await expect(sunriseRow).toContainText("Sunrise Studios");
    await expect(sunriseRow).toContainText("Starter");
    await expect(sunriseRow).toContainText("America/Los_Angeles");
  });

  test("shows an empty state when no companies are available", async ({
    page,
  }) => {
    const mocks = await setupConvexMocks(page);
    mocks.setAdminListResponse("companies", { data: [], total: 0 });

    await signInAsOwner(page);

    await expect(page.getByText("No results found.")).toBeVisible();
  });
});
