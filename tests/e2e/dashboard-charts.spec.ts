import { expect, test, type Page } from "@playwright/test";

import { setupConvexMocks } from "./utils/convexMocks";

type CallsOverTimePoint = {
  date: string;
  count: number;
};

type EscalationsByPriorityPoint = {
  priority: string;
  value: number;
};

type DashboardResponse = {
  metrics: {
    callsHandled: number;
    aiResolutionRate: number;
    openEscalations: number;
    unitsUnderManagement: number;
  };
  charts: {
    callsOverTime: CallsOverTimePoint[];
    escalationsByPriority: EscalationsByPriorityPoint[];
  };
  lastUpdated: number | null;
};

const completeLogin = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test.user@example.com");
  await page.getByLabel("Password").fill("password!23");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
};

const renderDashboard = async (page: Page, data: DashboardResponse) => {
  await setupConvexMocks(page, {
    queryHandlers: {
      "admin:dashboard": async () => data,
    },
  });

  await completeLogin(page);
};

test.describe("Dashboard charts", () => {
  test("renders charts with populated data", async ({ page }) => {
    await renderDashboard(page, {
      metrics: {
        callsHandled: 128,
        aiResolutionRate: 0.62,
        openEscalations: 7,
        unitsUnderManagement: 342,
      },
      charts: {
        callsOverTime: [
          { date: "2024-03-01", count: 12 },
          { date: "2024-03-02", count: 18 },
          { date: "2024-03-03", count: 27 },
        ],
        escalationsByPriority: [
          { priority: "Critical", value: 2 },
          { priority: "High", value: 3 },
          { priority: "Medium", value: 2 },
        ],
      },
      lastUpdated: Date.UTC(2024, 2, 4),
    });

    await expect(
      page.getByRole("group", { name: "Calls over time chart" }),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid="calls-over-time-chart"]')
        .getByRole("application"),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Escalations by priority chart" }),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid="escalations-by-priority-chart"]')
        .getByRole("application"),
    ).toBeVisible();
    await expect(page.getByText("Critical")).toBeVisible();
    await expect(page.getByText("High")).toBeVisible();
  });

  test("falls back to empty states when no activity exists", async ({
    page,
  }) => {
    await renderDashboard(page, {
      metrics: {
        callsHandled: 0,
        aiResolutionRate: 0,
        openEscalations: 0,
        unitsUnderManagement: 0,
      },
      charts: {
        callsOverTime: [
          { date: "2024-03-01", count: 0 },
          { date: "2024-03-02", count: 0 },
          { date: "2024-03-03", count: 0 },
        ],
        escalationsByPriority: [],
      },
      lastUpdated: null,
    });

    await expect(
      page.getByText("No call activity recorded in this window yet."),
    ).toBeVisible();
    await expect(
      page.getByText("New calls will appear here in real time."),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid="calls-over-time-chart"]')
        .getByRole("application"),
    ).toHaveCount(0);
    await expect(
      page.getByText("No open escalations at the moment."),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid="escalations-by-priority-chart"]')
        .getByRole("application"),
    ).toHaveCount(0);
  });
});
