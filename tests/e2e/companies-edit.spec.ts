import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

type ConvexArgs = Record<string, unknown>;

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type CompanyRecord = {
  name: string;
  plan: string;
  timezone: string;
  branding: {
    logoUrl: string;
    greetingName: string;
  };
  createdAt: number;
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

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeDeep = (
  target: Record<string, unknown>,
  updates?: Record<string, unknown>,
) => {
  if (!updates) {
    return target;
  }

  const next: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(updates)) {
    if (isPlainObject(value)) {
      const existing = next[key];
      next[key] = mergeDeep(
        isPlainObject(existing) ? (existing as Record<string, unknown>) : {},
        value,
      );
    } else {
      next[key] = value;
    }
  }
  return next;
};

const clone = <T>(value: T): T =>
  value === undefined
    ? value
    : (JSON.parse(JSON.stringify(value)) as unknown as T);

const setupCompanyEditTest = async (
  page: Page,
  options: {
    companyId: string;
    company: CompanyRecord;
    user?: AuthUser;
  },
) => {
  const {
    companyId,
    company,
    user = {
      id: "user_owner",
      email: "owner@example.com",
      name: "Owner",
      role: "owner",
    },
  } = options;

  let currentCompany: Record<string, unknown> = clone(company);
  const updateCalls: ConvexArgs[] = [];
  const validateSessionCalls: ConvexArgs[] = [];

  await page.addInitScript(
    ({ tokenKey, tokenValue, storedUserKey, storedUser }) => {
      window.localStorage.setItem(tokenKey, tokenValue);
      window.localStorage.setItem(storedUserKey, JSON.stringify(storedUser));
    },
    {
      tokenKey: TOKEN_STORAGE_KEY,
      tokenValue: "test-session-token",
      storedUserKey: USER_STORAGE_KEY,
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

  const getCompanyDocument = () => ({
    _id: companyId,
    ...currentCompany,
  });

  const handleQuery = (route: Route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "admin:get") {
      if ((args?.id as string | undefined) === companyId) {
        return respond(route, getCompanyDocument());
      }
      return respond(route, null);
    }

    if (path === "admin:list") {
      return respond(route, {
        data: [getCompanyDocument()],
        total: 1,
      });
    }

    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "admin:update") {
      updateCalls.push(clone(args));
      const updates = args.data as Record<string, unknown> | undefined;
      currentCompany = mergeDeep(
        currentCompany,
        updates ? clone(updates) : undefined,
      );
      return respond(route, getCompanyDocument());
    }

    return respond(route, {});
  });

  await page.route("**/api/action", (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "auth:validateSession") {
      validateSessionCalls.push(clone(args));
      const now = new Date().toISOString();
      return respond(route, {
        session: {
          token: "test-session-token",
          userId: user.id,
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        user,
      });
    }

    return respond(route, {});
  });

  return {
    getCurrentCompany: () => clone(currentCompany),
    updateCalls,
    validateSessionCalls,
  };
};

test.describe("Company editing", () => {
  test("persists only modified fields when updating a company", async ({
    page,
  }) => {
    const companyId = "company_123";
    const initialCompany: CompanyRecord = {
      name: "Alpha Logistics",
      plan: "starter",
      timezone: "America/New_York",
      branding: {
        logoUrl: "https://example.com/logo.svg",
        greetingName: "Alpha team",
      },
      createdAt: 1_700_000_000_000,
    };

    const mocks = await setupCompanyEditTest(page, {
      companyId,
      company: initialCompany,
    });

    await page.goto(`/companies/${companyId}`);

    const nameField = page.getByLabel(/^Name\b/);
    await expect(nameField).toHaveValue(initialCompany.name);

    const timezoneField = page.getByLabel("Timezone");
    await expect(timezoneField).toHaveValue(initialCompany.timezone);

    const planTrigger = page.getByRole("combobox").first();
    await expect(planTrigger).toHaveText("Starter");

    await expect(page.getByLabel("Branding · Greeting Name")).toHaveValue(
      initialCompany.branding.greetingName,
    );

    await nameField.fill("Alpha Logistics International");
    await timezoneField.fill("America/Los_Angeles");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Element updated")).toBeVisible();

    await expect.poll(() => mocks.updateCalls.length).toBe(1);

    const [updateCall] = mocks.updateCalls;
    expect(updateCall).toMatchObject({
      table: "companies",
      id: companyId,
    });

    const updatedData = (updateCall.data ?? {}) as Record<string, unknown>;
    expect(updatedData).toMatchObject({
      name: "Alpha Logistics International",
      timezone: "America/Los_Angeles",
      branding: initialCompany.branding,
      plan: initialCompany.plan,
      createdAt: initialCompany.createdAt,
    });
    expect(Object.keys(updatedData).sort()).toEqual([
      "branding",
      "createdAt",
      "name",
      "plan",
      "timezone",
    ]);

    await expect(page).toHaveURL(`/companies`);

    await page.goto(`/companies/${companyId}/show`);

    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", {
        level: 2,
        name: "Company Alpha Logistics International",
      }),
    ).toBeVisible();
    await expect(
      main.getByText("America/Los_Angeles", { exact: true }),
    ).toBeVisible();
    await expect(main.getByText("starter", { exact: true })).toBeVisible();
  });
});
