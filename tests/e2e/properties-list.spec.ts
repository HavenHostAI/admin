import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";

import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  status: string;
};

type ConvexRequest = {
  path?: string;
  args?: Record<string, unknown>;
};

type PropertyDoc = {
  _id: string;
  name: string;
  companyId: string;
  timeZone: string;
  updatedAt: string;
};

type CompanyDoc = {
  _id: string;
  name: string;
};

const baseUser: AuthUser = {
  id: "user_1",
  email: "owner@example.com",
  name: "Test Owner",
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

const decodeConvexRequest = (route: Route): ConvexRequest => {
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

const setupAuthenticatedApp = async (
  page: Page,
  {
    user: userOverrides,
    properties,
    companies,
  }: {
    user?: Partial<AuthUser>;
    properties: PropertyDoc[];
    companies: CompanyDoc[];
  },
) => {
  const user: AuthUser = { ...baseUser, ...userOverrides };
  const token = "test-session-token";
  const companiesById = new Map(
    companies.map((company) => [company._id, company]),
  );

  await page.addInitScript(
    ({ tokenKey, userKey, tokenValue, storedUser }) => {
      window.localStorage.setItem(tokenKey, tokenValue);
      window.localStorage.setItem(userKey, JSON.stringify(storedUser));
    },
    {
      tokenKey: TOKEN_STORAGE_KEY,
      userKey: USER_STORAGE_KEY,
      tokenValue: token,
      storedUser: user,
    },
  );

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  const handleQuery = (route: Route) => {
    const { path, args } = decodeConvexRequest(route);
    const table = typeof args?.table === "string" ? args.table : undefined;

    if (path === "admin:list") {
      if (table === "properties") {
        return respond(route, { data: properties, total: properties.length });
      }
      if (table === "companies") {
        const data = Array.from(companiesById.values());
        return respond(route, { data, total: data.length });
      }
      return respond(route, { data: [], total: 0 });
    }

    if (path === "admin:getMany" && table === "companies") {
      const ids = Array.isArray(args?.ids) ? (args.ids as string[]) : [];
      const docs = ids
        .map((id) => companiesById.get(id))
        .filter((doc): doc is CompanyDoc => !!doc);
      return respond(route, docs);
    }

    if (path === "admin:get" && table === "companies") {
      const id = typeof args?.id === "string" ? args.id : undefined;
      return respond(route, id ? (companiesById.get(id) ?? null) : null);
    }

    if (path?.startsWith("admin:")) {
      return respond(route, { data: [], total: 0 });
    }

    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", (route) => respond(route, {}));

  await page.route("**/api/action", (route) => {
    const { path } = decodeConvexRequest(route);
    if (path === "auth:validateSession") {
      const now = new Date();
      return respond(route, {
        session: {
          token,
          userId: user.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        user,
      });
    }

    if (path === "auth:signOut") {
      return respond(route, null);
    }

    return respond(route, null);
  });
};

const formatUpdatedAt = (value: string) => new Date(value).toLocaleString();

test.describe("Properties list", () => {
  test("displays properties with their companies and metadata", async ({
    page,
  }) => {
    const propertyDocs: PropertyDoc[] = [
      {
        _id: "property_1",
        name: "Sunset Villa",
        companyId: "company_1",
        timeZone: "America/Los_Angeles",
        updatedAt: "2024-03-01T12:00:00.000Z",
      },
      {
        _id: "property_2",
        name: "Mountain Retreat",
        companyId: "company_2",
        timeZone: "America/Denver",
        updatedAt: "2024-04-15T18:30:00.000Z",
      },
    ];

    const companyDocs: CompanyDoc[] = [
      { _id: "company_1", name: "Acme Hospitality" },
      { _id: "company_2", name: "Summit Holdings" },
    ];

    await setupAuthenticatedApp(page, {
      properties: propertyDocs,
      companies: companyDocs,
    });

    await page.goto("/properties");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { level: 2, name: /properties/i }),
    ).toBeVisible();

    const headerCells = page.locator("thead th");
    await expect(headerCells).toHaveCount(5);
    await expect(headerCells.nth(1)).toHaveText("Name");
    await expect(headerCells.nth(2)).toHaveText("Company");
    await expect(headerCells.nth(3)).toHaveText("Time Zone");
    await expect(headerCells.nth(4)).toHaveText("Updated");

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(propertyDocs.length);

    await Promise.all(
      propertyDocs.map(async (property, index) => {
        const company = companyDocs.find(
          (doc) => doc._id === property.companyId,
        );
        const row = rows.nth(index);
        const cells = row.locator("td");

        await expect(cells.nth(1)).toHaveText(property.name);
        await expect(cells.nth(2)).toHaveText(company?.name ?? "");
        await expect(cells.nth(3)).toHaveText(property.timeZone);
        await expect(cells.nth(4)).toHaveText(
          formatUpdatedAt(property.updatedAt),
        );
      }),
    );
  });

  test("shows the empty state when no properties are returned", async ({
    page,
  }) => {
    await setupAuthenticatedApp(page, {
      properties: [],
      companies: [],
    });

    await page.goto("/properties");

    await expect(
      page.getByRole("heading", { level: 2, name: /properties/i }),
    ).toBeVisible();

    await expect(page.getByText("No results found.")).toBeVisible();
  });
});
