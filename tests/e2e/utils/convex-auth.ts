import { type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "../../../src/lib/authStorage";

type ConvexArgs = Record<string, unknown>;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  status: string;
};

type ConvexRequest = {
  path?: string;
  args: ConvexArgs;
};

type ConvexCall = ConvexArgs;

type SetupOptions = {
  user?: Partial<AuthUser>;
  handleQuery?: (request: ConvexRequest) => unknown | Promise<unknown>;
  handleAction?: (request: ConvexRequest) => unknown | Promise<unknown>;
};

type PrimeSessionOptions = {
  token?: string;
  user?: Partial<AuthUser>;
};

export type ConvexAuthMocks = {
  signUpCalls: ConvexCall[];
  signInCalls: ConvexCall[];
  validateSessionCalls: ConvexCall[];
  getCurrentUser: () => AuthUser;
  getActiveToken: () => string | null;
  primeSession: (options?: PrimeSessionOptions) => Promise<void>;
};

const baseUser: AuthUser = {
  id: "user_1",
  email: "test.user@example.com",
  name: "Test User",
  role: "owner",
  companyId: "company_1",
  status: "active",
};

const createDashboardFallback = () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const windowLength = 7;
  const callsOverTime = Array.from({ length: windowLength }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (windowLength - index - 1));
    return {
      date: date.toISOString().slice(0, 10),
      count: 0,
    };
  });

  return {
    metrics: {
      callsHandled: 0,
      aiResolutionRate: 0,
      openEscalations: 0,
      unitsUnderManagement: 0,
    },
    charts: {
      callsOverTime,
      escalationsByPriority: [],
    },
    lastUpdated: null,
  };
};

const dashboardFallback = createDashboardFallback();

const convexSuccessResponse = (value: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    status: "success",
    value,
    logLines: [],
  }),
});

type PersistSessionPayload = {
  tokenKey: string;
  userKey: string;
  tokenValue: string;
  storedUser: AuthUser;
};

const persistSessionStorage = ({
  tokenKey,
  userKey,
  tokenValue,
  storedUser,
}: PersistSessionPayload) => {
  window.localStorage.setItem(tokenKey, tokenValue);
  window.localStorage.setItem(userKey, JSON.stringify(storedUser));
};

const decodeConvexRequest = (route: Route): ConvexRequest => {
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

const respond = (route: Route, value: unknown) =>
  route.fulfill(convexSuccessResponse(value));

export const setupConvexAuth = async (
  page: Page,
  options: SetupOptions = {},
): Promise<ConvexAuthMocks> => {
  const signUpCalls: ConvexCall[] = [];
  const signInCalls: ConvexCall[] = [];
  const validateSessionCalls: ConvexCall[] = [];

  let currentUser: AuthUser = { ...baseUser, ...options.user };
  let activeToken: string | null = null;

  const primeSession = async ({ token, user }: PrimeSessionOptions = {}) => {
    const nextUser: AuthUser = { ...currentUser, ...user };
    const sessionToken = token ?? "test-session-token";
    currentUser = nextUser;
    activeToken = sessionToken;

    const payload: PersistSessionPayload = {
      tokenKey: TOKEN_STORAGE_KEY,
      userKey: USER_STORAGE_KEY,
      tokenValue: sessionToken,
      storedUser: nextUser,
    };

    await page.addInitScript(persistSessionStorage, payload);

    if (!page.url().startsWith("about:")) {
      try {
        await page.evaluate(persistSessionStorage, payload);
      } catch (_error) {
        // When the page has not navigated to a real origin yet (e.g. about:blank),
        // Chromium throws a security error for localStorage access. That's fine –
        // the init script will populate storage as soon as navigation happens.
      }
    }
  };

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  const handleQuery = async (route: Route) => {
    const request = decodeConvexRequest(route);

    if (options.handleQuery) {
      const result = await options.handleQuery(request);
      if (typeof result !== "undefined") {
        return respond(route, result);
      }
    }

    if (request.path === "admin:dashboard") {
      return respond(route, dashboardFallback);
    }

    if (request.path?.startsWith("admin:")) {
      return respond(route, { data: [], total: 0 });
    }

    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", (route) => respond(route, {}));

  await page.route("**/api/action", async (route) => {
    const request = decodeConvexRequest(route);
    const { path, args } = request;

    if (options.handleAction) {
      const result = await options.handleAction(request);
      if (typeof result !== "undefined") {
        return respond(route, result);
      }
    }

    if (path === "auth:signUp") {
      signUpCalls.push(args);
      currentUser = {
        ...currentUser,
        id: "user_signup",
        email: String(args.email ?? currentUser.email),
        name: String(args.name ?? currentUser.name),
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
    getActiveToken: () => activeToken,
    primeSession,
  };
};
