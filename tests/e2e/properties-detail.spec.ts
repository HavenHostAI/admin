import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";

import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  status: string;
};

type ConvexCall = Record<string, unknown>;

type ConvexMocks = {
  signInCalls: ConvexCall[];
  validateSessionCalls: ConvexCall[];
  getCurrentUser: () => AuthUser;
};

type PropertyTestContext = {
  property: Record<string, unknown>;
  company: Record<string, unknown>;
};

const baseUser: AuthUser = {
  id: "user_1",
  email: "test.user@example.com",
  name: "Test User",
  role: "owner",
  companyId: "company_1",
  status: "active",
};

const convexSuccessResponse = (value: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    status: "success",
    value,
    logLines: [],
  }),
});

const decodeConvexRequest = (route: Route) => {
  const bodyText = route.request().postData() ?? "{}";
  const body = JSON.parse(bodyText) as {
    path?: string;
    args?: unknown[];
  };
  const [encodedArgs] = body.args ?? [];
  const decodedArgs = encodedArgs
    ? (jsonToConvex(encodedArgs as unknown) as Record<string, unknown>)
    : {};
  return { path: body.path, args: decodedArgs };
};

const setupConvexMocks = async (
  page: Page,
  context: PropertyTestContext,
): Promise<ConvexMocks> => {
  const signInCalls: ConvexCall[] = [];
  const validateSessionCalls: ConvexCall[] = [];

  let activeToken: string | null = null;
  let currentUser: AuthUser = { ...baseUser };

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  const handleAdminQuery = (route: Route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "admin:get" && args.table === "properties") {
      if (String(args.id) === String(context.property._id)) {
        return respond(route, context.property);
      }
      return respond(route, null);
    }

    if (path === "admin:get" && args.table === "companies") {
      if (String(args.id) === String(context.company._id)) {
        return respond(route, context.company);
      }
      return respond(route, null);
    }

    if (path === "admin:getMany" && args.table === "companies") {
      const ids = (args.ids as string[] | undefined) ?? [];
      const matches = ids.includes(String(context.company._id))
        ? [context.company]
        : [];
      return respond(route, matches);
    }

    if (path?.startsWith("admin:")) {
      if (path === "admin:list") {
        return respond(route, { data: [], total: 0 });
      }
      if (path === "admin:getManyReference") {
        return respond(route, { data: [], total: 0 });
      }
      return respond(route, null);
    }

    return respond(route, null);
  };

  await page.route("**/api/query", handleAdminQuery);
  await page.route("**/api/query_at_ts", handleAdminQuery);

  await page.route("**/api/mutation", (route) => respond(route, {}));

  await page.route("**/api/action", (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "auth:signIn") {
      signInCalls.push(args);
      currentUser = {
        ...currentUser,
        email: String(args.email),
      };
      activeToken = "test-session-token";
      return respond(route, { token: activeToken, user: currentUser });
    }

    if (path === "auth:validateSession") {
      validateSessionCalls.push(args);
      if (!activeToken) {
        return respond(route, null);
      }
      const now = new Date();
      return respond(route, {
        session: {
          token: activeToken,
          userId: currentUser.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        user: currentUser,
      });
    }

    if (path === "auth:signUp") {
      return respond(route, {});
    }

    return respond(route, {});
  });

  return {
    signInCalls,
    validateSessionCalls,
    getCurrentUser: () => currentUser,
  };
};

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
      property: propertyRecord,
      company: companyRecord,
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

    const fieldValue = (label: string) =>
      page
        .locator("div.flex.flex-col")
        .filter({
          has: page.locator(`div:text-is("${label}")`),
        })
        .locator("span.flex-1")
        .first();

    await expect(fieldValue("Time Zone")).toHaveText(propertyRecord.timeZone);
    await expect(fieldValue("Street")).toHaveText(
      propertyRecord.address.street,
    );
    await expect(fieldValue("City")).toHaveText(propertyRecord.address.city);
    await expect(fieldValue("State")).toHaveText(propertyRecord.address.state);
    await expect(fieldValue("Postal Code")).toHaveText(
      propertyRecord.address.postalCode,
    );
    await expect(fieldValue("Country")).toHaveText(
      propertyRecord.address.country,
    );

    await expect(fieldValue("No Code Over Phone")).toHaveText(
      String(propertyRecord.flags.noCodeOverPhone),
    );
    await expect(fieldValue("Always Escalate Lockout")).toHaveText(
      String(propertyRecord.flags.alwaysEscalateLockout),
    );
    await expect(fieldValue("Upsell Enabled")).toHaveText(
      String(propertyRecord.flags.upsellEnabled),
    );

    const expectedCreated = new Date(propertyRecord.createdAt).toLocaleString();
    const expectedUpdated = new Date(propertyRecord.updatedAt).toLocaleString();

    await expect(fieldValue("Created")).toContainText(expectedCreated);
    await expect(fieldValue("Updated")).toContainText(expectedUpdated);

    expect(mocks.validateSessionCalls.length).toBeGreaterThan(0);
  });
});
