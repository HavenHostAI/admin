import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

type ConvexCallArgs = Record<string, unknown>;

type ConvexUpdateArgs = ConvexCallArgs & {
  data?: Record<string, unknown>;
};

const clone = <T>(value: T): T =>
  value === undefined
    ? value
    : (JSON.parse(JSON.stringify(value)) as unknown as T);

const convexSuccessResponse = (value: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    status: "success",
    value,
    logLines: [],
  }),
});

const decodeConvexBody = (bodyText: string) => {
  const body = JSON.parse(bodyText) as {
    path?: string;
    args?: unknown[];
  };
  const [encodedArgs] = body.args ?? [];
  const decodedArgs = encodedArgs
    ? (jsonToConvex(encodedArgs as unknown) as ConvexCallArgs)
    : {};
  return { path: body.path, args: decodedArgs };
};

const decodeConvexRequest = (route: Route) => {
  const bodyText = route.request().postData() ?? "{}";
  return decodeConvexBody(bodyText);
};

const baseSession = {
  session: {
    token: "test-session-token",
    userId: "user_session",
    createdAt: new Date("2024-01-01T12:00:00Z").toISOString(),
    updatedAt: new Date("2024-01-01T12:00:00Z").toISOString(),
    expiresAt: new Date("2024-01-02T12:00:00Z").toISOString(),
  },
  user: {
    id: "user_session",
    email: "owner@example.com",
    name: "Owner",
    role: "owner",
    companyId: "company_1",
    status: "active",
  },
};

const existingUserRecord = {
  _id: "user_123",
  email: "agent@example.com",
  name: "Agent Smith",
  role: "agent",
  status: "active",
  companyId: "company_1",
  emailVerified: false,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_500_000_000,
};

const companies = [
  { _id: "company_1", name: "Acme Holdings" },
  { _id: "company_2", name: "Globex Corporation" },
];

const setupUserEditMocks = async (page: Page) => {
  let currentUserRecord = { ...existingUserRecord };
  const updateCalls: ConvexUpdateArgs[] = [];

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  await page.route("**/api/action", (route) => {
    const { path } = decodeConvexRequest(route);
    if (path === "auth:validateSession") {
      return respond(route, baseSession);
    }
    return respond(route, {});
  });

  const handleQuery = (route: Route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "admin:get" && args.table === "users") {
      return respond(route, currentUserRecord);
    }

    if (path === "admin:get" && args.table === "companies") {
      const company = companies.find((item) => item._id === args.id);
      return respond(route, company ?? null);
    }

    if (path === "admin:getMany" && args.table === "companies") {
      const ids = Array.isArray(args.ids) ? args.ids : [];
      const matched = companies.filter((company) =>
        ids.some((id) => String(id) === company._id),
      );
      return respond(route, matched);
    }

    if (path === "admin:list" && args.table === "companies") {
      return respond(route, {
        data: companies,
        total: companies.length,
      });
    }

    if (path === "admin:getManyReference" && args.table === "companies") {
      return respond(route, {
        data: companies,
        total: companies.length,
      });
    }

    if (path?.startsWith("admin:")) {
      return respond(route, {
        data: [],
        total: 0,
      });
    }

    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "admin:update" && args.table === "users") {
      const data = clone((args.data ?? {}) as Record<string, unknown>);
      updateCalls.push(clone({ ...args, data } as ConvexUpdateArgs));
      currentUserRecord = {
        ...currentUserRecord,
        ...data,
        updatedAt: Number(data.updatedAt ?? Date.now()),
      };
      return respond(route, currentUserRecord);
    }

    return respond(route, {});
  });

  return {
    getCurrentUser: () => ({ ...currentUserRecord }),
    updateCalls,
  } as const;
};

test.describe("User edit", () => {
  test("updates user assignment and status from the edit form", async ({
    page,
  }) => {
    const { updateCalls } = await setupUserEditMocks(page);

    await page.addInitScript(
      ({ tokenKey, tokenValue, userKey, user }) => {
        window.localStorage.setItem(tokenKey, tokenValue);
        window.localStorage.setItem(userKey, JSON.stringify(user));
      },
      {
        tokenKey: TOKEN_STORAGE_KEY,
        tokenValue: "test-session-token",
        userKey: USER_STORAGE_KEY,
        user: baseSession.user,
      },
    );

    await page.goto("/users/user_123");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[name="email"]')).toHaveValue(
      "agent@example.com",
    );
    await expect(page.locator('input[name="name"]')).toHaveValue("Agent Smith");

    const companyField = page
      .locator('[data-slot="form-item"]')
      .filter({ has: page.locator('label:has-text("Company")') });
    await expect(companyField).toHaveCount(1);
    const companyTrigger = companyField
      .locator('[data-slot="popover-trigger"]')
      .first();
    await expect(companyTrigger).toContainText("Acme Holdings");

    const roleField = page
      .locator('[data-slot="form-item"]')
      .filter({ has: page.locator('label:has-text("Role")') });
    const roleTrigger = roleField
      .locator('[data-slot="select-trigger"]')
      .first();
    await expect(roleTrigger).toContainText("Agent");

    const statusField = page
      .locator('[data-slot="form-item"]')
      .filter({ has: page.locator('label:has-text("Status")') });
    const statusTrigger = statusField
      .locator('[data-slot="select-trigger"]')
      .first();
    await expect(statusTrigger).toContainText("Active");

    const createdAtInput = page.locator('input[name="createdAt"]');
    const updatedAtInput = page.locator('input[name="updatedAt"]');
    await expect(createdAtInput).toBeDisabled();
    await expect(updatedAtInput).toBeDisabled();

    await companyTrigger.click();
    await page.getByRole("option", { name: "Globex Corporation" }).click();
    await expect(companyTrigger).toContainText("Globex Corporation");

    await roleTrigger.click();
    await page.getByRole("option", { name: "Manager" }).click();
    await expect(roleTrigger).toContainText("Manager");

    await statusTrigger.click();
    await page.getByRole("option", { name: "Inactive" }).click();
    await expect(statusTrigger).toContainText("Inactive");

    const emailVerifiedSwitch = page.getByRole("switch", {
      name: "Email Verified",
    });
    await expect(emailVerifiedSwitch).not.toBeChecked();
    await emailVerifiedSwitch.click();
    await expect(emailVerifiedSwitch).toBeChecked();

    const saveButton = page.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page.getByText("Element updated")).toBeVisible();

    await expect.poll(() => updateCalls.length).toBe(1);

    const [updateArgs] = updateCalls;
    expect(updateArgs).toMatchObject({
      table: "users",
      id: "user_123",
    });
    expect(updateArgs?.data).toMatchObject({
      companyId: "company_2",
      role: "manager",
      status: "inactive",
      emailVerified: true,
    });
  });
});
