import { expect, test, type Page } from "@playwright/test";

import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

import { setupConvexMocks } from "./utils/convexMocks";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    let dashboardCallCount = 0;

    await setupConvexMocks(page, {
      queryHandlers: {
        "admin:dashboard": async () => {
          dashboardCallCount += 1;
          await delay(3500);
          return dashboardResponse;
        },
      },
    });

    await loginExistingUser(page);

    await page.goto("/");

    await expect
      .poll(() => dashboardCallCount, { timeout: 15000 })
      .toBeGreaterThan(0);

    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.querySelectorAll('[data-slot="skeleton"]').length,
          ),
        { timeout: 15000 },
      )
      .toBeGreaterThan(0);

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

    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.querySelectorAll('[data-slot="skeleton"]').length,
          ),
        { timeout: 15000 },
      )
      .toBe(0);

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
    let outageCallCount = 0;

    await setupConvexMocks(page, {
      queryHandlers: {
        "admin:dashboard": async () => {
          outageCallCount += 1;
          await delay(10000);
          return null;
        },
      },
    });

    await loginExistingUser(page);

    await page.goto("/");

    await expect
      .poll(() => outageCallCount, { timeout: 20000 })
      .toBeGreaterThan(0);

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document
                .querySelector('[data-slot="alert-title"]')
                ?.textContent?.trim() ?? null,
          ),
        { timeout: 20000 },
      )
      .toBe("Live data is temporarily unavailable");

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document
                .querySelector('[data-slot="alert-description"]')
                ?.textContent?.trim() ?? null,
          ),
        { timeout: 20000 },
      )
      .toContain("We couldn't reach Convex to refresh metrics.");

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
  });
});
