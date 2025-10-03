import { expect, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";

import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";

type ConvexCall = Record<string, unknown>;

export type AdminListResult = {
  data: Array<Record<string, unknown>>;
  total?: number;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  status: string;
};

export type ConvexMocks = {
  signUpCalls: ConvexCall[];
  signInCalls: ConvexCall[];
  validateSessionCalls: ConvexCall[];
  getCurrentUser: () => AuthUser;
  setAdminListResponse: (table: string, response: AdminListResult) => void;
};

const baseUser: AuthUser = {
  id: "user_1",
  email: "test.user@example.com",
  name: "Test User",
  role: "owner",
  companyId: "company_1",
  status: "active",
};

export const convexSuccessResponse = (value: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    status: "success",
    value,
    logLines: [],
  }),
});

export const decodeConvexRequest = (route: Route) => {
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

export const setupConvexMocks = async (
  page: Page,
  options: { user?: Partial<AuthUser> } = {},
): Promise<ConvexMocks> => {
  const signUpCalls: ConvexCall[] = [];
  const signInCalls: ConvexCall[] = [];
  const validateSessionCalls: ConvexCall[] = [];
  const adminTableData: Record<
    string,
    {
      rows: AdminListResult["data"];
      total: number;
      byId: Map<string, Record<string, unknown>>;
    }
  > = {};

  let activeToken: string | null = null;
  let currentUser: AuthUser = { ...baseUser, ...options.user };

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  const getRecordIdentifier = (record: Record<string, unknown>) => {
    const rawId =
      (record as { _id?: unknown })._id ?? (record as { id?: unknown }).id;
    if (typeof rawId === "string" || typeof rawId === "number") {
      return String(rawId);
    }
    return null;
  };

  const getAdminTable = (tableName: unknown) => {
    if (typeof tableName !== "string") {
      return null;
    }
    return adminTableData[tableName] ?? null;
  };

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  const handleQuery = (route: Route) => {
    const { path, args } = decodeConvexRequest(route);
    if (path === "admin:list") {
      const table = getAdminTable((args as { table?: unknown }).table);
      if (!table) {
        return respond(route, { data: [], total: 0 });
      }
      return respond(route, { data: table.rows, total: table.total });
    }
    if (path === "admin:get") {
      const table = getAdminTable((args as { table?: unknown }).table);
      const id = (args as { id?: unknown }).id;
      if (!table || (typeof id !== "string" && typeof id !== "number")) {
        return respond(route, null);
      }
      const record = table.byId.get(String(id));
      return respond(route, record ?? null);
    }
    if (path === "admin:getMany") {
      const table = getAdminTable((args as { table?: unknown }).table);
      const ids = (args as { ids?: unknown }).ids;
      if (!table || !Array.isArray(ids)) {
        return respond(route, []);
      }
      const records = ids
        .map((value) => table.byId.get(String(value)))
        .filter((value): value is Record<string, unknown> => !!value);
      return respond(route, records);
    }
    if (path === "admin:getManyReference") {
      const table = getAdminTable((args as { table?: unknown }).table);
      if (!table) {
        return respond(route, { data: [], total: 0 });
      }
      const target = (args as { target?: unknown }).target;
      const id = (args as { id?: unknown }).id;
      if (
        typeof target !== "string" ||
        (typeof id !== "string" && typeof id !== "number")
      ) {
        return respond(route, { data: [], total: 0 });
      }
      const matches = table.rows.filter((row) => {
        const value = (row as Record<string, unknown>)[target];
        return String(value) === String(id);
      });
      return respond(route, { data: matches, total: matches.length });
    }
    if (path?.startsWith("admin:")) {
      return respond(route, { data: [], total: 0 });
    }
    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", (route) => respond(route, {}));

  await page.route("**/api/action", (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "auth:signUp") {
      signUpCalls.push(args);
      currentUser = {
        ...currentUser,
        id: "user_signup",
        email: args.email as string,
        name: (args.name as string | undefined) ?? currentUser.name,
        role: "owner",
      };
      activeToken = "test-signup-token";
      return respond(route, { token: activeToken, user: currentUser });
    }

    if (path === "auth:signIn") {
      signInCalls.push(args);
      currentUser = {
        ...currentUser,
        email: args.email as string,
      };
      activeToken = "test-session-token";
      return respond(route, { token: activeToken, user: currentUser });
    }

    if (path === "auth:validateSession") {
      validateSessionCalls.push(args);
      if (!activeToken) {
        return respond(route, null);
      }
      const now = new Date();
      return respond(route, {
        session: {
          token: activeToken,
          userId: currentUser.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        user: currentUser,
      });
    }

    return respond(route, {});
  });

  return {
    signUpCalls,
    signInCalls,
    validateSessionCalls,
    getCurrentUser: () => currentUser,
    setAdminListResponse: (table, response) => {
      const rows = response.data.map((row) => ({ ...row }));
      const byId = new Map<string, Record<string, unknown>>();
      for (const row of rows) {
        const id = getRecordIdentifier(row);
        if (id) {
          byId.set(id, row);
        }
      }
      adminTableData[table] = {
        rows,
        total: response.total ?? rows.length,
        byId,
      };
    },
  };
};

export const pollForStoredToken = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        (key) => window.localStorage.getItem(key),
        TOKEN_STORAGE_KEY,
      ),
    )
    .toBe("test-session-token");
