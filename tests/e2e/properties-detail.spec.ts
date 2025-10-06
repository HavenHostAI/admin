import { expect, test } from "@playwright/test";

import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";
import { setupConvexMocks } from "./utils/convexMocks";

test.describe("Property detail view", () => {
  test("renders property information in read-only form", async ({ page }) => {
    const companyRecord = {
      _id: "company_1",
      name: "HavenHost",
      createdAt: new Date("2023-12-15T09:00:00Z").toISOString(),
      updatedAt: new Date("2024-01-10T09:00:00Z").toISOString(),
    };

    const propertyRecord = {
      _id: "property_1",
      name: "Lakeside Villa",
      companyId: companyRecord._id,
      timeZone: "America/New_York",
      address: {
        street: "123 Lakeside Drive",
        city: "Springfield",
        state: "IL",
        postalCode: "62704",
        country: "United States",
      },
      flags: {
        noCodeOverPhone: true,
        alwaysEscalateLockout: false,
        upsellEnabled: true,
      },
      createdAt: new Date("2024-01-01T12:00:00Z").toISOString(),
      updatedAt: new Date("2024-01-15T15:30:00Z").toISOString(),
    };

    const mocks = await setupConvexMocks(page, {
      queryHandlers: {
        "admin:get": ({ table, id }) => {
          if (table === "properties" && String(id) === propertyRecord._id) {
            return propertyRecord;
          }
          if (table === "companies" && String(id) === companyRecord._id) {
            return companyRecord;
          }
          return null;
        },
        "admin:getMany": ({ table, ids }) => {
          if (table === "companies") {
            const requestedIds = (Array.isArray(ids) ? ids : []).map(String);
            if (requestedIds.includes(companyRecord._id)) {
              return [companyRecord];
            }
            return [];
          }
          return [];
        },
        "admin:list": () => ({ data: [], total: 0 }),
        "admin:getManyReference": () => ({ data: [], total: 0 }),
      },
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("owner@example.com");
    await page.getByLabel("Password").fill("owner-password!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect
      .poll(() =>
        page.evaluate(
          (key) => window.localStorage.getItem(key),
          TOKEN_STORAGE_KEY,
        ),
      )
      .toBe("test-session-token");

    expect(mocks.signInCalls).toHaveLength(1);
    expect(mocks.signInCalls[0]).toMatchObject({
      email: "owner@example.com",
      password: "owner-password!",
    });

    await page.goto(`/properties/${propertyRecord._id}/show`);

    const heading = page.getByRole("heading", { level: 2 });
    await expect(heading).toContainText(propertyRecord.name);

    const breadcrumb = page.getByLabel("breadcrumb");
    const breadcrumbLink = breadcrumb.getByRole("link", { name: "Properties" });
    await expect(breadcrumbLink).toBeVisible();
    await expect(breadcrumbLink).toHaveAttribute("href", "/properties");

    const editLink = page.getByRole("link", { name: "Edit" });
    await expect(editLink).toHaveAttribute(
      "href",
      `/properties/${propertyRecord._id}`,
    );

    const companyLink = page.getByRole("link", { name: companyRecord.name });
    await expect(companyLink).toHaveAttribute(
      "href",
      `/companies/${companyRecord._id}/show`,
    );

    const fieldContainer = (label: string) =>
      page.getByText(label, { exact: true }).locator("xpath=../..");

    const fieldValue = (label: string) =>
      fieldContainer(label).locator(":scope > *").nth(1);

    await expect(fieldValue("Time Zone")).toContainText(
      propertyRecord.timeZone,
    );
    await expect(fieldValue("Street")).toContainText(
      propertyRecord.address.street,
    );
    await expect(fieldValue("City")).toContainText(propertyRecord.address.city);
    await expect(fieldValue("State")).toContainText(
      propertyRecord.address.state,
    );
    await expect(fieldValue("Postal Code")).toContainText(
      propertyRecord.address.postalCode,
    );
    await expect(fieldValue("Country")).toContainText(
      propertyRecord.address.country,
    );

    await expect(fieldValue("No Code Over Phone")).toContainText(
      String(propertyRecord.flags.noCodeOverPhone),
    );
    await expect(fieldValue("Always Escalate Lockout")).toContainText(
      String(propertyRecord.flags.alwaysEscalateLockout),
    );
    await expect(fieldValue("Upsell Enabled")).toContainText(
      String(propertyRecord.flags.upsellEnabled),
    );

    const expectedCreated = new Date(propertyRecord.createdAt).toLocaleString();
    const expectedUpdated = new Date(propertyRecord.updatedAt).toLocaleString();

    await expect(fieldValue("Created")).toContainText(expectedCreated);
    await expect(fieldValue("Updated")).toContainText(expectedUpdated);

    expect(mocks.validateSessionCalls.length).toBeGreaterThan(0);
  });
});
