import { expect, test, type Page, type Route } from "@playwright/test";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";
import { decodeConvexRequest, fulfillConvexSuccess } from "./utils/convex";

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  status?: string | null;
  companyId?: string | null;
};

const setupUserDetailMocks = async (page: Page) => {
  const viewer: AuthUser = {
    id: "user_viewer",
    email: "viewer@example.com",
    name: "View Only",
    role: "viewer",
    status: "active",
  };

  const userRecord = {
    _id: "user_123",
    email: "jane.viewer@example.com",
    name: "Jane Viewer",
    role: "agent",
    status: "active",
    emailVerified: true,
    companyId: "company_456",
  };

  const companyRecord = {
    _id: "company_456",
    name: "Primary Holdings",
  };

  const respond = (route: Route, value: unknown) =>
    fulfillConvexSuccess(route, value);

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  const handleQuery = (route: Route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "admin:get" && args.table === "users") {
      return respond(route, userRecord);
    }

    if (path === "admin:getMany" && args.table === "companies") {
      return respond(route, [companyRecord]);
    }

    if (typeof path === "string" && path.startsWith("admin:")) {
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
          token: "viewer-session-token",
          userId: viewer.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        user: viewer,
      });
    }

    return respond(route, {});
  });

  return { viewer, userRecord, companyRecord };
};

test.describe("User detail view", () => {
  test("renders read-only user details for viewers", async ({ page }) => {
    const { viewer, userRecord, companyRecord } =
      await setupUserDetailMocks(page);

    await page.addInitScript(
      ({ tokenKey, userKey, token, user }) => {
        window.localStorage.setItem(tokenKey, token);
        window.localStorage.setItem(userKey, JSON.stringify(user));
      },
      {
        tokenKey: TOKEN_STORAGE_KEY,
        userKey: USER_STORAGE_KEY,
        token: "viewer-session-token",
        user: viewer,
      },
    );

    await page.goto(`/users/${userRecord._id}/show`);
    await page.waitForLoadState("networkidle");

    const readOnlyValue = (label: string) =>
      page
        .getByText(label, { exact: true })
        .first()
        .locator("xpath=../following-sibling::*[1]");

    // Contact information is read-only
    await expect(readOnlyValue("Email")).toHaveText(userRecord.email);
    await expect(readOnlyValue("Name")).toHaveText(userRecord.name);

    // Company and access details remain informational only
    await expect(readOnlyValue("Role")).toHaveText(userRecord.role);
    await expect(readOnlyValue("Status")).toHaveText(userRecord.status);

    await expect(readOnlyValue("Company")).toHaveText(companyRecord.name);

    // Verification status surfaces as text, not an editable control
    await expect(readOnlyValue("Email Verified")).toHaveText(
      String(userRecord.emailVerified),
    );

    await expect(page.getByRole("textbox")).toHaveCount(0);
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(page.getByRole("spinbutton")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /edit/i })).toHaveCount(0);
  });
});
