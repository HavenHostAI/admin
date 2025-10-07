import { expect, test } from "@playwright/test";

import { setupConvexMocks } from "./utils/convexMocks";

test.describe("Company detail view", () => {
  test("renders company metadata as read-only for limited roles", async ({
    page,
  }) => {
    const companyRecord = {
      _id: "company_42",
      name: "HavenHost",
      plan: "growth",
      timezone: "America/Los_Angeles",
      branding: {
        logoUrl: "https://cdn.example.com/havenhost-logo.svg",
        greetingName: "HavenHost Support",
      },
      createdAt: "2024-05-01T15:30:00.000Z",
    } as const;

    await setupConvexMocks(page, {
      user: {
        id: "user_agent",
        name: "Agent Viewer",
        email: "agent.viewer@example.com",
        role: "agent",
        companyId: companyRecord._id,
      },
      queryHandlers: {
        "admin:get": async (args) => {
          const { table, id } = args as { table?: string; id?: string };
          if (table === "companies" && id === companyRecord._id) {
            return {
              _id: companyRecord._id,
              name: companyRecord.name,
              plan: companyRecord.plan,
              timezone: companyRecord.timezone,
              branding: companyRecord.branding,
              createdAt: companyRecord.createdAt,
            };
          }
          return null;
        },
      },
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("agent.viewer@example.com");
    await page.getByLabel("Password").fill("agent-password!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForLoadState("networkidle");

    await page.goto(`/companies/${companyRecord._id}/show`);
    await page.waitForLoadState("networkidle");

    const planRow = page
      .getByText("Plan", { exact: true })
      .locator("xpath=../..");
    await expect(planRow).toContainText(companyRecord.plan);
    await expect(planRow.locator("input, textarea, select")).toHaveCount(0);

    const timezoneRow = page
      .getByText("Timezone", { exact: true })
      .locator("xpath=../..");
    await expect(timezoneRow).toContainText(companyRecord.timezone);
    await expect(timezoneRow.locator("input, textarea, select")).toHaveCount(0);

    const logoRow = page
      .getByText("Logo URL", { exact: true })
      .locator("xpath=../..");
    await expect(logoRow).toContainText(companyRecord.branding.logoUrl);
    await expect(logoRow.locator("input, textarea, select")).toHaveCount(0);
    const logoLink = logoRow.getByRole("link", {
      name: companyRecord.branding.logoUrl,
    });
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute(
      "href",
      companyRecord.branding.logoUrl,
    );
    const logoAlt = `${companyRecord.name} logo preview`;
    const logoImage = logoRow.getByRole("img", { name: logoAlt });
    await expect(logoImage).toBeVisible();
    await expect(logoImage).toHaveAttribute(
      "src",
      companyRecord.branding.logoUrl,
    );

    const greetingRow = page
      .getByText("Greeting Name", { exact: true })
      .locator("xpath=../..");
    await expect(greetingRow).toContainText(
      companyRecord.branding.greetingName,
    );
    await expect(greetingRow.locator("input, textarea, select")).toHaveCount(0);

    const createdRow = page
      .getByText("Created", { exact: true })
      .locator("xpath=../..");
    const expectedCreated = await page.evaluate(
      (value) => new Date(value).toLocaleString(),
      companyRecord.createdAt,
    );
    await expect(createdRow).toContainText(expectedCreated);
    await expect(createdRow.locator("input, textarea, select")).toHaveCount(0);

    await expect(page.getByRole("link", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
  });
});
