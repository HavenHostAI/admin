import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

type ConvexRequest = {
  path?: string;
  args: Record<string, unknown>;
};

type AdminCreateArgs = {
  table: string;
  data: Record<string, unknown>;
  meta?: unknown;
};

type AdminMutationRecord = AdminCreateArgs;

type AdminMocks = {
  createCalls: AdminMutationRecord[];
  companyRecords: Array<Record<string, unknown>>;
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

const setupAuthenticatedAdmin = async (page: Page): Promise<AdminMocks> => {
  const createCalls: AdminMutationRecord[] = [];
  const companyRecords = [
    { _id: "company_1", name: "HavenHost" },
    { _id: "company_2", name: "Summit Suites" },
  ];

  const adminUser = {
    id: "user_admin",
    email: "owner@example.com",
    name: "Admin Owner",
    role: "owner",
    companyId: "company_1",
    status: "active",
  };

  await page.addInitScript(
    ([tokenKey, token, userKey, user]) => {
      window.localStorage.setItem(tokenKey, token);
      window.localStorage.setItem(userKey, JSON.stringify(user));
    },
    [TOKEN_STORAGE_KEY, "test-session-token", USER_STORAGE_KEY, adminUser],
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

    if (path === "admin:list" && args.table === "companies") {
      return respond(route, {
        data: companyRecords,
        total: companyRecords.length,
      });
    }

    if (path === "admin:get" && args.table === "companies") {
      const company = companyRecords.find((item) => item._id === args.id);
      return respond(route, company ?? null);
    }

    if (path === "admin:getMany" && args.table === "companies") {
      const ids = (Array.isArray(args.ids) ? args.ids : []) as string[];
      const matches = companyRecords.filter((company) =>
        ids.includes(company._id as string),
      );
      return respond(route, matches);
    }

    if (path?.startsWith("admin:")) {
      return respond(route, { data: [], total: 0 });
    }

    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/action", (route) => {
    const { path } = decodeConvexRequest(route);
    if (path === "auth:validateSession") {
      const now = new Date();
      return respond(route, {
        session: {
          token: "test-session-token",
          userId: adminUser.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        user: adminUser,
      });
    }
    return respond(route, null);
  });

  await page.route("**/api/mutation", (route) => {
    const { path, args } = decodeConvexRequest(route);
    if (path === "admin:create") {
      const createArgs = args as AdminCreateArgs;
      createCalls.push(createArgs);
      const data = createArgs?.data ?? {};
      return respond(route, { _id: "property_mock", ...data });
    }
    return respond(route, {});
  });

  return { createCalls, companyRecords };
};

test.describe("Property management", () => {
  test("allows creating a property with generated timestamps", async ({
    page,
  }) => {
    const { createCalls, companyRecords } = await setupAuthenticatedAdmin(page);

    await page.goto("/#/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { level: 1, name: /dashboard/i }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Properties" }).click();

    await expect(
      page.getByRole("heading", { level: 2, name: /properties/i }),
    ).toBeVisible();

    const createButton = page.getByRole("link", { name: /create/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 2, name: /create property/i }),
    ).toBeVisible();

    const nameInput = page.getByLabel("Name");
    await expect(nameInput).toBeVisible();

    const companyInput = page.getByRole("combobox").first();
    await expect(companyInput).toBeVisible();
    await companyInput.click();
    const companyOption = page.getByRole("option", {
      name: companyRecords[0].name as string,
    });
    await expect(companyOption).toBeVisible();
    await companyOption.click();

    await nameInput.fill("Sunset Villas");
    await page.getByLabel("Time Zone").fill("America/Los_Angeles");
    await page.getByLabel("Address · Street").fill("123 Sunset Blvd");
    await page.getByLabel("Address · City").fill("Los Angeles");
    await page.getByLabel("Address · State").fill("CA");
    await page.getByLabel("Address · Postal Code").fill("90001");
    await page.getByLabel("Address · Country").fill("USA");

    const noCodeSwitch = page.getByRole("switch", {
      name: "No Code Over Phone",
    });
    await noCodeSwitch.click();
    await expect(noCodeSwitch).toHaveAttribute("aria-checked", "true");

    const lockoutSwitch = page.getByRole("switch", {
      name: "Always Escalate Lockout",
    });
    await lockoutSwitch.click();
    await expect(lockoutSwitch).toHaveAttribute("aria-checked", "true");

    const upsellSwitch = page.getByRole("switch", { name: "Upsell Enabled" });
    await upsellSwitch.click();
    await expect(upsellSwitch).toHaveAttribute("aria-checked", "true");

    const createdAtInput = page.getByLabel("Created At (epoch ms)");
    const createdAtValue = await createdAtInput.inputValue();
    expect(createdAtValue).not.toBe("");
    const createdAtNumber = Number(createdAtValue);
    expect(Number.isFinite(createdAtNumber)).toBe(true);
    const now = Date.now();
    expect(createdAtNumber).toBeGreaterThan(now - 60_000);
    expect(createdAtNumber).toBeLessThanOrEqual(now + 60_000);
    await createdAtInput.fill(String(createdAtNumber));

    const updatedAtInput = page.getByLabel("Updated At (epoch ms)");
    const updatedAtValue = await updatedAtInput.inputValue();
    expect(updatedAtValue).not.toBe("");
    const updatedAtNumber = Number(updatedAtValue);
    expect(Number.isFinite(updatedAtNumber)).toBe(true);
    expect(updatedAtNumber).toBeGreaterThanOrEqual(createdAtNumber);
    expect(updatedAtNumber).toBeLessThanOrEqual(now + 60_000);
    await updatedAtInput.fill(String(updatedAtNumber));

    await page.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => createCalls.length, { timeout: 10_000 }).toBe(1);

    const [{ table, data }] = createCalls;
    expect(table).toBe("properties");

    expect(data).toMatchObject({
      companyId: companyRecords[0]._id,
      name: "Sunset Villas",
      timeZone: "America/Los_Angeles",
      address: {
        street: "123 Sunset Blvd",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90001",
        country: "USA",
      },
      flags: {
        noCodeOverPhone: true,
        alwaysEscalateLockout: true,
        upsellEnabled: true,
      },
    });

    expect(data.createdAt).toBe(createdAtNumber);
    expect(data.updatedAt).toBe(updatedAtNumber);
  });
});
