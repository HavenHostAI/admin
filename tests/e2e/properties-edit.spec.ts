import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";
import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";

type ConvexArgs = Record<string, unknown>;

type PropertyRecord = {
  _id: string;
  id: string;
  companyId: string;
  name: string;
  timeZone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  flags: {
    noCodeOverPhone: boolean;
    alwaysEscalateLockout: boolean;
    upsellEnabled: boolean;
  };
  createdAt: number;
  updatedAt: number;
};

type UpdateArgs = {
  table: string;
  id: string;
  data: Partial<Omit<PropertyRecord, "_id" | "address" | "flags">> & {
    address?: Partial<PropertyRecord["address"]>;
    flags?: Partial<PropertyRecord["flags"]>;
  };
  meta?: unknown;
};

type UpdateCall = {
  path?: string;
  args: UpdateArgs;
};

type SetupResult = {
  propertyId: string;
  getPropertyRecord: () => PropertyRecord;
  getUpdateCalls: () => UpdateCall[];
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
    ? (jsonToConvex(encodedArgs as unknown) as ConvexArgs)
    : ({} as ConvexArgs);
  return { path: body.path, args: decodedArgs };
};

const setupPropertyEditTest = async (page: Page): Promise<SetupResult> => {
  const user = {
    id: "user_1",
    email: "test.user@example.com",
    name: "Test User",
    role: "owner",
    companyId: "company_1",
    status: "active",
  };

  const companyRecords = [
    {
      _id: "company_1",
      name: "HavenHost",
    },
  ];

  let propertyRecord: PropertyRecord = {
    _id: "property_1",
    id: "property_1",
    companyId: "company_1",
    name: "Sunset Villa",
    timeZone: "America/Los_Angeles",
    address: {
      street: "1 Beach Road",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
      country: "USA",
    },
    flags: {
      noCodeOverPhone: false,
      alwaysEscalateLockout: false,
      upsellEnabled: true,
    },
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  };

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  const handleQuery = (route: Route) => {
    const { path, args } = decodeConvexRequest(route);
    const table = (args.table as string | undefined) ?? "";

    if (path === "admin:get") {
      if (table === "properties") {
        return respond(route, propertyRecord);
      }
      if (table === "companies") {
        return respond(route, companyRecords[0]);
      }
      return respond(route, null);
    }

    if (path === "admin:list") {
      if (table === "companies") {
        return respond(route, {
          data: companyRecords,
          total: companyRecords.length,
        });
      }
      if (table === "properties") {
        return respond(route, {
          data: [propertyRecord],
          total: 1,
        });
      }
      return respond(route, { data: [], total: 0 });
    }

    if (path === "admin:getMany") {
      if (table === "companies") {
        return respond(route, companyRecords);
      }
      return respond(route, []);
    }

    if (path === "admin:getManyReference") {
      return respond(route, { data: [], total: 0 });
    }

    return respond(route, null);
  };

  await page.addInitScript(
    (storage) => {
      window.localStorage.setItem(storage.key, storage.token);
    },
    { key: TOKEN_STORAGE_KEY, token: "test-session-token" },
  );

  const updateCalls: UpdateCall[] = [];

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", (route) => {
    const { path, args } = decodeConvexRequest(route);
    if (path === "admin:update") {
      const updateArgs = args as UpdateArgs;
      if (updateArgs.table === "properties") {
        const updates = updateArgs.data;
        const nextFlags = {
          ...propertyRecord.flags,
          ...(updates.flags ?? {}),
        };

        propertyRecord = {
          ...propertyRecord,
          ...updates,
          flags: nextFlags,
          updatedAt: Date.now(),
        };
        updateCalls.push({
          path,
          args: JSON.parse(JSON.stringify(updateArgs)) as UpdateArgs,
        });

        return respond(route, propertyRecord);
      }
    }

    return respond(route, {});
  });

  await page.route("**/api/action", (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "auth:validateSession") {
      const now = new Date();
      return respond(route, {
        session: {
          token: "test-session-token",
          userId: user.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        },
        user,
      });
    }

    if (path === "admin:update") {
      const updateArgs = args as UpdateArgs;
      if (updateArgs.table === "properties") {
        const updates = updateArgs.data;
        const nextFlags = {
          ...propertyRecord.flags,
          ...(updates.flags ?? {}),
        };

        propertyRecord = {
          ...propertyRecord,
          ...updates,
          flags: nextFlags,
          updatedAt: Date.now(),
        };

        updateCalls.push({
          path,
          args: JSON.parse(JSON.stringify(updateArgs)) as UpdateArgs,
        });

        return respond(route, propertyRecord);
      }
    }

    return respond(route, {});
  });

  return {
    propertyId: propertyRecord._id,
    getPropertyRecord: () => propertyRecord,
    getUpdateCalls: () => [...updateCalls],
  };
};

const getToastLocator = (page: Page, text: RegExp | string) =>
  page.locator("[data-sonner-toast]").filter({ hasText: text });

test.describe("Property editing", () => {
  test("preloads property details, submits updates, and confirms success", async ({
    page,
  }) => {
    const { propertyId, getUpdateCalls } = await setupPropertyEditTest(page);

    await page.goto("/properties");
    await page.waitForLoadState("networkidle");

    const propertyRow = page.getByRole("row", {
      name: /Sunset Villa/i,
    });
    await expect(propertyRow).toBeVisible({ timeout: 15_000 });
    await propertyRow.click();

    const editLink = page.getByRole("link", { name: /^edit$/i });
    await expect(editLink).toBeVisible({ timeout: 15_000 });
    await editLink.click();

    const timeZoneInput = page.getByLabel("Time Zone");
    await expect(timeZoneInput).toBeVisible({ timeout: 15_000 });
    await expect(timeZoneInput).toHaveValue("America/Los_Angeles");

    await timeZoneInput.fill("America/New_York");

    const noCodeSwitch = page.getByLabel("No Code Over Phone");
    await expect(noCodeSwitch).toBeVisible();
    await noCodeSwitch.click();

    const lockoutSwitch = page.getByLabel("Always Escalate Lockout");
    await lockoutSwitch.click();

    await page.getByRole("button", { name: "Save" }).click();

    const successToast = getToastLocator(page, /updated/i);
    await expect(successToast).toBeVisible();
    await successToast.getByRole("button", { name: /close toast/i }).click();
    await expect(successToast).toBeHidden({ timeout: 10_000 });

    await expect
      .poll(() => getUpdateCalls().length, { timeout: 7_000 })
      .toBeGreaterThan(0);

    const [updateCall] = getUpdateCalls();
    expect(updateCall?.path).toBe("admin:update");
    expect(updateCall?.args).toMatchObject({
      table: "properties",
      id: propertyId,
      data: {
        timeZone: "America/New_York",
        flags: {
          noCodeOverPhone: true,
          alwaysEscalateLockout: true,
        },
      },
    });

    await expect
      .poll(() => {
        const url = new URL(page.url());
        return url.hash || url.pathname;
      })
      .toMatch(new RegExp(`^#?/properties(?:/${propertyId}(?:/show)?)?$`));
  });
});
