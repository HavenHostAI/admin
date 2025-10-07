import { expect, test, type Page } from "@playwright/test";

import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

import { setupConvexMocks } from "./utils/convexMocks";

const createDeferred = <T = void>() => {
  type Resolve = (value: T | PromiseLike<T>) => void;
  type Reject = (reason?: unknown) => void;

  let resolve: Resolve | undefined;
  let reject: Reject | undefined;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  if (!resolve || !reject) {
    throw new Error("Failed to create deferred promise");
  }

  return { promise, resolve, reject };
};

const loginExistingUser = async (page: Page) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("OWNER@example.com  ");
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

  const storedUserRaw = await page.evaluate((key) => {
    return window.localStorage.getItem(key);
  }, USER_STORAGE_KEY);

  const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  expect(storedUser?.companyId).toBeTruthy();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
};

test.describe("Dashboard KPIs", () => {
  test("renders KPI metrics from Convex data", async ({ page }) => {
    const metrics = {
      callsHandled: 3271,
      aiResolutionRate: 0.642,
      openEscalations: 12,
      unitsUnderManagement: 843,
    };

    const dashboardResponse = {
      metrics,
      charts: {
        callsOverTime: [
          { date: "2024-05-06", count: 124 },
          { date: "2024-05-07", count: 156 },
          { date: "2024-05-08", count: 201 },
          { date: "2024-05-09", count: 189 },
          { date: "2024-05-10", count: 175 },
          { date: "2024-05-11", count: 167 },
          { date: "2024-05-12", count: 142 },
        ],
        escalationsByPriority: [
          { priority: "Critical", value: 3 },
          { priority: "High", value: 5 },
          { priority: "Medium", value: 2 },
          { priority: "Low", value: 1 },
        ],
      },
      lastUpdated: Date.UTC(2024, 4, 12, 15, 30, 0),
    };

    const metricsResponse = createDeferred<typeof dashboardResponse>();

    let dashboardCallCount = 0;

    await setupConvexMocks(page, {
      queryHandlers: {
        "admin:dashboard": async () => {
          dashboardCallCount += 1;
          return metricsResponse.promise;
        },
      },
    });

    await loginExistingUser(page);

    await page.goto("/");

    await expect.poll(() => dashboardCallCount).toBeGreaterThan(0);

    await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();

    metricsResponse.resolve(dashboardResponse);

    const numberFormatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    });
    const percentFormatter = new Intl.NumberFormat(undefined, {
      style: "percent",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    });

    const expectedMetrics = {
      "Calls handled": numberFormatter.format(metrics.callsHandled),
      "AI resolution": percentFormatter.format(metrics.aiResolutionRate),
      "Open escalations": numberFormatter.format(metrics.openEscalations),
      "Units under management": numberFormatter.format(
        metrics.unitsUnderManagement,
      ),
    } as const;

    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);

    for (const [label, value] of Object.entries(expectedMetrics)) {
      const card = page.locator('div[data-slot="card"]').filter({
        has: page.locator('div[data-slot="card-title"]', { hasText: label }),
      });
      await expect(card).toHaveCount(1);
      await expect(card.locator('div[data-slot="card-title"]')).toHaveText(
        label,
      );
      await expect(card.getByText(value, { exact: true })).toBeVisible();
    }

    const expectedLastUpdated = dateFormatter.format(
      new Date(dashboardResponse.lastUpdated),
    );
    await expect(
      page.getByText(new RegExp(`Last updated\\s+${expectedLastUpdated}`)),
    ).toBeVisible();
  });

  test("shows outage fallback messaging when dashboard data is unavailable", async ({
    page,
  }) => {
    const outageResponse = createDeferred<null>();

    let outageCallCount = 0;

    await setupConvexMocks(page, {
      queryHandlers: {
        "admin:dashboard": async () => {
          outageCallCount += 1;
          return outageResponse.promise;
        },
      },
    });

    await loginExistingUser(page);

    await page.goto("/");

    await expect.poll(() => outageCallCount).toBeGreaterThan(0);

    await expect(page.locator('[data-slot="alert-title"]').first()).toHaveText(
      "Live data is temporarily unavailable",
      { timeout: 15000 },
    );

    await expect(
      page.locator('[data-slot="alert-description"]').first(),
    ).toContainText("We couldn't reach Convex to refresh metrics.", {
      timeout: 15000,
    });

    const fallbackMetrics = {
      "Calls handled": "0",
      "AI resolution": "0%",
      "Open escalations": "0",
      "Units under management": "0",
    } as const;

    for (const [label, value] of Object.entries(fallbackMetrics)) {
      const card = page.locator('div[data-slot="card"]').filter({
        has: page.locator('div[data-slot="card-title"]', { hasText: label }),
      });
      await expect(card).toHaveCount(1);
      await expect(card.getByText(value, { exact: true })).toBeVisible();
    }

    outageResponse.resolve(null);
  });
});
