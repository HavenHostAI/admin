import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";

import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

type ConvexCall = Record<string, unknown>;

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

type EscalationDetail = EscalationListItem & {
  summary: string | null;
  resolvedAt: number | null;
  transcriptRef: string | null;
};

type FilterResponse = {
  properties: { id: string; name: string }[];
  priorities: string[];
  statuses: string[];
};

type EscalationMocks = {
  assignmentCalls: ConvexCall[];
  statusCalls: ConvexCall[];
  setAssignmentFailure: (shouldFail: boolean) => void;
  setStatusFailure: (shouldFail: boolean) => void;
};

const expectToast = async (page: Page, text: RegExp) => {
  const toasts = page.locator("[data-sonner-toast]");
  await expect
    .poll(async () => toasts.count(), { timeout: 10_000 })
    .toBeGreaterThan(0);

  const toast = toasts.filter({ hasText: text }).first();
  await expect(toast).toContainText(text);
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

const initialDetail: EscalationDetail = {
  id: "esc_1",
  propertyId: "prop_1",
  propertyName: "Sunset Villas",
  priority: "high",
  status: "pending",
  topic: "Water leak in unit 4B",
  assigneeContact: "jane.roe@example.com",
  createdAt: new Date("2024-03-04T10:00:00Z").getTime(),
  resolvedAt: null,
  summary:
    "Resident reported a persistent water leak in the bathroom of unit 4B.",
  transcriptRef: "transcript-123",
};

const initialFilters: FilterResponse = {
  properties: [
    { id: "prop_1", name: "Sunset Villas" },
    { id: "prop_2", name: "Harbor Heights" },
  ],
  priorities: ["high", "medium", "low"],
  statuses: ["open", "pending", "resolved"],
};

const setupEscalationMocks = async (page: Page): Promise<EscalationMocks> => {
  const assignmentCalls: ConvexCall[] = [];
  const statusCalls: ConvexCall[] = [];
  let shouldFailAssignment = false;
  let shouldFailStatus = false;

  let currentDetail: EscalationDetail = { ...initialDetail };
  let currentList: EscalationListItem[] = [
    {
      id: initialDetail.id,
      propertyId: initialDetail.propertyId,
      propertyName: initialDetail.propertyName,
      priority: initialDetail.priority,
      status: initialDetail.status,
      topic: initialDetail.topic,
      assigneeContact: initialDetail.assigneeContact,
      createdAt: initialDetail.createdAt,
    },
  ];

  await page.addInitScript(
    ({ tokenKey, userKey, token, user }) => {
      window.localStorage.setItem(tokenKey, token);
      window.localStorage.setItem(userKey, JSON.stringify(user));
    },
    {
      tokenKey: TOKEN_STORAGE_KEY,
      userKey: USER_STORAGE_KEY,
      token: "test-session-token",
      user: {
        id: "user_1",
        email: "owner@example.com",
        name: "Test Owner",
        role: "owner",
        status: "active",
      },
    },
  );

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  const respondError = (route: Route, message: string) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ status: "error", message }),
    });

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
      return respond(route, initialFilters);
    }

    if (path === "escalations:listEscalations") {
      return respond(route, currentList);
    }

    if (path === "escalations:getEscalation") {
      if (args.id === currentDetail.id) {
        return respond(route, currentDetail);
      }
      return respond(route, null);
    }

    if (path?.startsWith("admin:")) {
      return respond(route, { data: [], total: 0 });
    }

    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "escalations:assignContact") {
      assignmentCalls.push(args);
      if (shouldFailAssignment) {
        return respondError(route, "Unable to update assignee");
      }
      const updatedContact =
        typeof args.contact === "string" ? args.contact : null;
      currentDetail = {
        ...currentDetail,
        assigneeContact: updatedContact,
      };
      currentList = currentList.map((item) =>
        item.id === currentDetail.id
          ? { ...item, assigneeContact: updatedContact }
          : item,
      );
      return respond(route, currentDetail);
    }

    if (path === "escalations:updateStatus") {
      statusCalls.push(args);
      if (shouldFailStatus) {
        return respondError(route, "Unable to update status");
      }
      const updatedStatus = typeof args.status === "string" ? args.status : "";
      currentDetail = {
        ...currentDetail,
        status: updatedStatus,
      };
      currentList = currentList.map((item) =>
        item.id === currentDetail.id
          ? { ...item, status: updatedStatus }
          : item,
      );
      return respond(route, currentDetail);
    }

    return respond(route, {});
  });

  await page.route("**/api/action", (route) => {
    const { path } = decodeConvexRequest(route);
    if (path === "auth:validateSession") {
      const now = new Date();
      return respond(route, {
        session: {
          token: "test-session-token",
          userId: "user_1",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        user: {
          id: "user_1",
          email: "owner@example.com",
          name: "Test Owner",
          role: "owner",
          status: "active",
        },
      });
    }

    return respond(route, {});
  });

  return {
    assignmentCalls,
    statusCalls,
    setAssignmentFailure: (shouldFail: boolean) => {
      shouldFailAssignment = shouldFail;
    },
    setStatusFailure: (shouldFail: boolean) => {
      shouldFailStatus = shouldFail;
    },
  };
};

test.describe("Escalation drawer interactions", () => {
  test("updates assignee and status with success feedback", async ({
    page,
  }) => {
    const mocks = await setupEscalationMocks(page);

    await page.goto("/escalations");

    const escalationRow = page.getByRole("row", {
      name: /Water leak in unit 4B/i,
    });
    await expect(escalationRow).toBeVisible();

    await escalationRow.click();

    await expect(
      page.getByRole("heading", { level: 2, name: /Water leak in unit 4B/i }),
    ).toBeVisible();

    const assignmentInput = page.getByLabel("Assign contact");
    await expect(assignmentInput).toHaveValue("jane.roe@example.com");

    await assignmentInput.fill("ops.team@example.com");
    await page.getByRole("button", { name: "Save" }).click();

    await expectToast(page, /Escalation assignee updated/i);
    await expect(assignmentInput).toHaveValue("ops.team@example.com");
    await expect(page.locator("tbody tr").first()).toContainText(
      "ops.team@example.com",
    );

    expect(mocks.assignmentCalls).toHaveLength(1);
    expect(mocks.assignmentCalls[0]).toMatchObject({
      id: initialDetail.id,
      contact: "ops.team@example.com",
    });

    const resolvedButton = page.getByRole("button", { name: "Resolved" });
    await expect(resolvedButton).toBeEnabled();

    await resolvedButton.evaluate((button) => button.click());

    await expectToast(page, /Escalation status updated/i);
    await expect(resolvedButton).toBeDisabled();

    await expect.poll(() => mocks.statusCalls.length).toBe(1);

    const statusSection = page
      .locator('[data-vaul-drawer] label:text("Status")')
      .first()
      .locator("..");
    await expect(statusSection).toContainText("Resolved");

    await expect(page.locator("tbody tr").first()).toContainText("Resolved");

    expect(mocks.statusCalls).toHaveLength(1);
    expect(mocks.statusCalls[0]).toMatchObject({
      id: initialDetail.id,
      status: "resolved",
    });
  });

  test("shows error notifications when updates fail", async ({ page }) => {
    const mocks = await setupEscalationMocks(page);
    mocks.setAssignmentFailure(true);
    mocks.setStatusFailure(true);

    await page.goto("/escalations");

    const escalationRow = page.getByRole("row", {
      name: /Water leak in unit 4B/i,
    });
    await expect(escalationRow).toBeVisible();
    await escalationRow.click();

    const assignmentInput = page.getByLabel("Assign contact");
    await expect(assignmentInput).toHaveValue("jane.roe@example.com");

    await assignmentInput.fill("fail.update@example.com");
    await page.getByRole("button", { name: "Save" }).click();

    await expectToast(page, /Unable to update assignee/i);
    await expect(assignmentInput).toHaveValue("fail.update@example.com");
    await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();

    expect(mocks.assignmentCalls).toHaveLength(1);
    expect(mocks.assignmentCalls[0]).toMatchObject({
      id: initialDetail.id,
      contact: "fail.update@example.com",
    });

    const resolvedButton = page.getByRole("button", { name: "Resolved" });
    await expect(resolvedButton).toBeEnabled();
    await resolvedButton.evaluate((button) => button.click());

    await expectToast(page, /Unable to update status/i);
    await expect(resolvedButton).toBeEnabled();

    await expect.poll(() => mocks.statusCalls.length).toBe(1);

    const statusSection = page
      .locator('[data-vaul-drawer] label:text("Status")')
      .first()
      .locator("..");
    await expect(statusSection).toContainText("Pending");

    await expect(page.locator("tbody tr").first()).toContainText("Pending");

    expect(mocks.statusCalls).toHaveLength(1);
    expect(mocks.statusCalls[0]).toMatchObject({
      id: initialDetail.id,
      status: "resolved",
    });
  });
});
