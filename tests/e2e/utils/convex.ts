import { type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  status: string;
};

export type ConvexCall = Record<string, unknown>;

export type ConvexRequest = {
  path?: string;
  args: Record<string, unknown>;
};

export type ConvexRouteHandler = (context: {
  route: Route;
  request: ConvexRequest;
  respond: (value: unknown) => Promise<void>;
}) => Promise<boolean | void> | boolean | void;

export type SetupConvexMocksOptions = {
  user?: Partial<AuthUser>;
  onQuery?: ConvexRouteHandler;
  onAction?: ConvexRouteHandler;
};

export type ConvexMocks = {
  signUpCalls: ConvexCall[];
  signInCalls: ConvexCall[];
  validateSessionCalls: ConvexCall[];
  getCurrentUser: () => AuthUser;
};

const baseUser: AuthUser = {
  id: "user_1",
  email: "test.user@example.com",
  name: "Test User",
  role: "owner",
  companyId: "company_1",
  status: "active",
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

export const setupConvexMocks = async (
  page: Page,
  options: SetupConvexMocksOptions = {},
): Promise<ConvexMocks> => {
  const signUpCalls: ConvexCall[] = [];
  const signInCalls: ConvexCall[] = [];
  const validateSessionCalls: ConvexCall[] = [];

  let activeToken: string | null = null;
  let currentUser: AuthUser = { ...baseUser, ...options.user };

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  const handleQuery = async (route: Route) => {
    const request = decodeConvexRequest(route);
    if (options.onQuery) {
      const handled = await options.onQuery({
        route,
        request,
        respond: (value) => respond(route, value),
      });
      if (handled) {
        return;
      }
    }
    const { path } = request;
    if (path?.startsWith("admin:")) {
      return respond(route, { data: [], total: 0 });
    }
    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", (route) => respond(route, {}));

  await page.route("**/api/action", async (route) => {
    const request = decodeConvexRequest(route);

    if (options.onAction) {
      const handled = await options.onAction({
        route,
        request,
        respond: (value) => respond(route, value),
      });
      if (handled) {
        return;
      }
    }

    const { path, args } = request;

    if (path === "auth:signUp") {
      signUpCalls.push(args);
      currentUser = {
        ...currentUser,
        id: "user_signup",
        email: String(args.email ?? currentUser.email),
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
        email: String(args.email ?? currentUser.email),
      };
      activeToken = "test-session-token";
      return respond(route, { token: activeToken, user: currentUser });
    }

    if (path === "auth:validateSession") {
      validateSessionCalls.push(args);
      if (!activeToken || args.token !== activeToken) {
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

    if (path === "auth:signOut") {
      activeToken = null;
      return respond(route, null);
    }

    return respond(route, {});
  });

  return {
    signUpCalls,
    signInCalls,
    validateSessionCalls,
    getCurrentUser: () => currentUser,
  };
};
