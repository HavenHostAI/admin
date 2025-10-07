import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

type ConvexCallArgs = Record<string, unknown>;

type EscalationFilters = {
  propertyId?: string;
  priority?: string;
  status?: string;
};

type EscalationListItem = {
  id: string;
  propertyId: string;
  propertyName: string;
  priority: string;
  status: string;
  topic: string;
  assigneeContact: string | null;
  createdAt: number;
};

type FilterOptions = {
  properties: { id: string; name: string }[];
  priorities: string[];
  statuses: string[];
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
    ? (jsonToConvex(encodedArgs as unknown) as ConvexCallArgs)
    : {};
  return { path: body.path, args: decodedArgs };
};

const testUser = {
  id: "user_1",
  email: "owner@example.com",
  name: "Owner User",
  role: "owner",
  companyId: "company_1",
  status: "active",
};

const filterOptions: FilterOptions = {
  properties: [
    { id: "property_1", name: "Atlas Apartments" },
    { id: "property_2", name: "Beacon Lofts" },
  ],
  priorities: ["high", "medium", "low"],
  statuses: ["open", "resolved"],
};

const allEscalations: EscalationListItem[] = [
  {
    id: "esc_1",
    propertyId: "property_1",
    propertyName: "Atlas Apartments",
    priority: "high",
    status: "open",
    topic: "Broken elevator in tower A",
    assigneeContact: "Jamie Rivera",
    createdAt: new Date("2024-03-14T10:00:00Z").getTime(),
  },
  {
    id: "esc_2",
    propertyId: "property_2",
    propertyName: "Beacon Lofts",
    priority: "medium",
    status: "open",
    topic: "Leaking roof on 5F",
    assigneeContact: null,
    createdAt: new Date("2024-03-13T16:30:00Z").getTime(),
  },
  {
    id: "esc_3",
    propertyId: "property_1",
    propertyName: "Atlas Apartments",
    priority: "low",
    status: "resolved",
    topic: "Noise complaint in unit 8B",
    assigneeContact: "Morgan Lee",
    createdAt: new Date("2024-03-12T09:15:00Z").getTime(),
  },
];

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const getFilteredEscalations = (filters: EscalationFilters) => {
  const propertyId =
    typeof filters.propertyId === "string" ? filters.propertyId : undefined;
  const priority = normalize(filters.priority);
  const status = normalize(filters.status);

  return allEscalations
    .filter((escalation) => {
      if (propertyId && escalation.propertyId !== propertyId) {
        return false;
      }
      if (priority && normalize(escalation.priority) !== priority) {
        return false;
      }
      if (status && normalize(escalation.status) !== status) {
        return false;
      }
      return true;
    })
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
};

const setupEscalationTest = async (page: Page) => {
  await page.addInitScript(
    ({ tokenKey, userKey, token, user }) => {
      window.localStorage.setItem(tokenKey, token);
      window.localStorage.setItem(userKey, JSON.stringify(user));
    },
    {
      tokenKey: TOKEN_STORAGE_KEY,
      userKey: USER_STORAGE_KEY,
      token: "test-session-token",
      user: testUser,
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

    if (path === "escalations:listFilters") {
      return respond(route, filterOptions);
    }

    if (path === "escalations:listEscalations") {
      return respond(route, getFilteredEscalations(args as EscalationFilters));
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
          userId: testUser.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        user: testUser,
      });
    }

    return respond(route, {});
  });

  await page.route("**/api/mutation", (route) => respond(route, {}));
};

test.describe("Escalations filters", () => {
  test("updates the table when property, priority, and status filters change", async ({
    page,
  }) => {
    await setupEscalationTest(page);

    await page.goto("/escalations");
    await page.waitForLoadState("networkidle");

    const tableBody = page.locator("tbody");
    const resetButton = page.getByRole("button", { name: "Reset filters" });

    await expect(resetButton).toBeDisabled();
    await expect(tableBody.locator("tr")).toHaveCount(3);

    const atlasRow = tableBody.locator("tr", { hasText: "Atlas Apartments" });
    const beaconRow = tableBody.locator("tr", { hasText: "Beacon Lofts" });

    await expect(
      atlasRow.filter({ hasText: "Broken elevator in tower A" }),
    ).toHaveCount(1);
    await expect(
      atlasRow.filter({ hasText: "Noise complaint in unit 8B" }),
    ).toHaveCount(1);
    await expect(
      beaconRow.filter({ hasText: "Leaking roof on 5F" }),
    ).toHaveCount(1);

    const propertySelect = page.getByLabel("Property");
    await propertySelect.click();
    await page.getByRole("option", { name: "Atlas Apartments" }).click();

    await expect(resetButton).toBeEnabled();
    await expect(tableBody.locator("tr")).toHaveCount(2);
    await expect(
      tableBody.locator("tr", { hasText: "Broken elevator in tower A" }),
    ).toHaveCount(1);
    await expect(
      tableBody.locator("tr", { hasText: "Noise complaint in unit 8B" }),
    ).toHaveCount(1);
    await expect(
      tableBody.locator("tr", { hasText: "Leaking roof on 5F" }),
    ).toHaveCount(0);

    await propertySelect.click();
    await page.getByRole("option", { name: "All properties" }).click();
    await expect(resetButton).toBeDisabled();

    const prioritySelect = page.getByLabel("Priority");
    await prioritySelect.click();
    await page.getByRole("option", { name: "Medium" }).click();

    await expect(resetButton).toBeEnabled();
    await expect(tableBody.locator("tr")).toHaveCount(1);
    await expect(
      tableBody.locator("tr", { hasText: "Leaking roof on 5F" }),
    ).toHaveCount(1);
    await expect(
      tableBody.locator("tr", { hasText: "Broken elevator in tower A" }),
    ).toHaveCount(0);

    await prioritySelect.click();
    await page.getByRole("option", { name: "All priorities" }).click();
    await expect(resetButton).toBeDisabled();

    const statusSelect = page.getByLabel("Status");
    await statusSelect.click();
    await page.getByRole("option", { name: "Resolved" }).click();

    await expect(resetButton).toBeEnabled();
    await expect(tableBody.locator("tr")).toHaveCount(1);
    await expect(
      tableBody.locator("tr", { hasText: "Noise complaint in unit 8B" }),
    ).toHaveCount(1);
    await expect(
      tableBody.locator("tr", { hasText: "Broken elevator in tower A" }),
    ).toHaveCount(0);

    await propertySelect.click();
    await page.getByRole("option", { name: "Beacon Lofts" }).click();

    await expect(
      tableBody.locator("tr", {
        hasText: "No escalations match the selected filters.",
      }),
    ).toHaveCount(1);

    await resetButton.click();
    await expect(resetButton).toBeDisabled();
    await expect(tableBody.locator("tr")).toHaveCount(3);
    await expect(
      tableBody.locator("tr", { hasText: "Broken elevator in tower A" }),
    ).toHaveCount(1);
    await expect(
      tableBody.locator("tr", { hasText: "Leaking roof on 5F" }),
    ).toHaveCount(1);
    await expect(
      tableBody.locator("tr", { hasText: "Noise complaint in unit 8B" }),
    ).toHaveCount(1);
  });
});
