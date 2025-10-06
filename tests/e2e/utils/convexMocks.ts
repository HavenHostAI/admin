import { type Page, type Route } from "@playwright/test";
import { convexToJson, jsonToConvex } from "convex/values";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  status: string;
};

type ConvexCall = Record<string, unknown>;

type ConvexMocks = {
  signUpCalls: ConvexCall[];
  signInCalls: ConvexCall[];
  validateSessionCalls: ConvexCall[];
  getCurrentUser: () => AuthUser;
};

type QueryHandler = (
  args: Record<string, unknown>,
) => unknown | Promise<unknown>;

type MutationHandler = (
  args: Record<string, unknown>,
) => unknown | Promise<unknown>;

type ActionHandler = (
  args: Record<string, unknown>,
) => unknown | Promise<unknown>;

type ExposedQueryPayload = {
  path: string;
  args: unknown[];
};

declare global {
  interface Window {
    __convexHandleQuery: (
      payload: ExposedQueryPayload,
    ) => Promise<{ value: unknown }>;
  }
}

type SetupConvexMocksOptions = {
  user?: Partial<AuthUser>;
  queryHandlers?: Record<string, QueryHandler>;
  mutationHandlers?: Record<string, MutationHandler>;
  actionHandlers?: Record<string, ActionHandler>;
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
    route.fulfill(convexSuccessResponse(convexToJson(value)));

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  await page.exposeFunction(
    "__convexHandleQuery",
    async ({ path, args }: ExposedQueryPayload) => {
      const handler = options.queryHandlers?.[path];
      if (!handler) {
        return { value: null };
      }

      const decodedArgs = (args ?? []).map((arg) =>
        jsonToConvex(arg as unknown),
      );
      const firstArg =
        decodedArgs.length > 0
          ? (decodedArgs[0] as Record<string, unknown>)
          : {};
      const result = await handler(firstArg);
      if (typeof result === "undefined") {
        return { value: null };
      }
      return { value: convexToJson(result) };
    },
  );

  await page.addInitScript(() => {
    const encodeU64 = (value: number) => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setBigUint64(0, BigInt(value), true);
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoa(binary);
    };

    const OriginalWebSocket = window.WebSocket;

    type ConvexMessage = {
      type: string;
      baseVersion?: number;
      newVersion?: number;
      modifications?: Array<
        | { type: "Add"; queryId: number; udfPath: string; args: unknown[] }
        | { type: "Remove"; queryId: number }
      >;
      tokenType?: string;
      baseIdentityVersion?: number;
    };

    class ConvexMockWebSocket {
      static readonly CONNECTING = OriginalWebSocket.CONNECTING;
      static readonly OPEN = OriginalWebSocket.OPEN;
      static readonly CLOSING = OriginalWebSocket.CLOSING;
      static readonly CLOSED = OriginalWebSocket.CLOSED;

      readonly url: string = "";
      readonly protocol: string = "";
      readonly extensions = "";
      readonly bufferedAmount = 0;
      binaryType: BinaryType = "blob";
      readyState = OriginalWebSocket.CONNECTING;

      onopen: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent<string>) => void) | null = null;

      private readonly listeners = new Map<
        string,
        Set<(event: Event) => void>
      >();
      private querySetVersion = 0;
      private identityVersion = 0;
      private timestamp = 0;
      private readonly isConvexSocket: boolean;
      private closed = false;

      constructor(url: string | URL, protocols?: string | string[]) {
        const urlString = typeof url === "string" ? url : url.toString();
        this.isConvexSocket = urlString.includes("/api");

        if (!this.isConvexSocket) {
          // Delegate to the original WebSocket implementation for non-Convex URLs.
          return new OriginalWebSocket(
            url,
            protocols,
          ) as unknown as ConvexMockWebSocket;
        }

        this.url = urlString;
        if (Array.isArray(protocols)) {
          this.protocol = protocols[0] ?? "";
        } else {
          this.protocol = protocols ?? "";
        }

        queueMicrotask(() => {
          if (this.closed) {
            return;
          }
          this.readyState = OriginalWebSocket.OPEN;
          const event = new Event("open");
          this.dispatchEvent(event);
        });
      }

      addEventListener(type: string, listener: (event: Event) => void) {
        if (!this.listeners.has(type)) {
          this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(listener);
      }

      removeEventListener(type: string, listener: (event: Event) => void) {
        this.listeners.get(type)?.delete(listener);
      }

      dispatchEvent(event: Event) {
        const listeners = this.listeners.get(event.type);
        if (listeners) {
          for (const listener of listeners) {
            listener(event);
          }
        }

        switch (event.type) {
          case "open": {
            this.onopen?.(event);
            break;
          }
          case "message": {
            this.onmessage?.(event as MessageEvent<string>);
            break;
          }
          case "close": {
            this.onclose?.(event as CloseEvent);
            break;
          }
          case "error": {
            this.onerror?.(event);
            break;
          }
          default:
            break;
        }
      }

      private async handleModifyQuerySet(message: ConvexMessage) {
        const modifications = message.modifications ?? [];

        const resolvedModifications = await Promise.all(
          modifications.map(async (modification) => {
            if (modification.type === "Add") {
              try {
                const response = await window.__convexHandleQuery({
                  path: modification.udfPath,
                  args: modification.args,
                });
                return {
                  type: "QueryUpdated" as const,
                  queryId: modification.queryId,
                  value: response.value,
                  logLines: [] as string[],
                  journal: null,
                };
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                return {
                  type: "QueryFailed" as const,
                  queryId: modification.queryId,
                  errorMessage,
                  logLines: [] as string[],
                  errorData: null,
                  journal: null,
                };
              }
            }

            return {
              type: "QueryRemoved" as const,
              queryId: modification.queryId,
            };
          }),
        );

        if (typeof message.baseVersion === "number") {
          this.querySetVersion = message.baseVersion;
        }

        const startVersion = {
          querySet: this.querySetVersion,
          ts: encodeU64(this.timestamp),
          identity: this.identityVersion,
        };

        const endQuerySet =
          message.newVersion ??
          (typeof message.baseVersion === "number"
            ? message.baseVersion + 1
            : this.querySetVersion + 1);

        this.querySetVersion = endQuerySet;
        this.timestamp += 1;

        const endVersion = {
          querySet: endQuerySet,
          ts: encodeU64(this.timestamp),
          identity: this.identityVersion,
        };

        const transition = {
          type: "Transition",
          startVersion,
          endVersion,
          modifications: resolvedModifications,
          clientClockSkew: 0,
          serverTs: Date.now(),
        };

        const event = new MessageEvent("message", {
          data: JSON.stringify(transition),
        });

        this.dispatchEvent(event);
      }

      private handleAuthenticate(message: ConvexMessage) {
        if (typeof message.baseVersion === "number") {
          this.identityVersion = message.baseVersion;
        }
      }

      send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        if (!this.isConvexSocket || typeof data !== "string") {
          return;
        }

        const message = JSON.parse(data) as ConvexMessage;

        if (message.type === "ModifyQuerySet") {
          this.handleModifyQuerySet(message).catch((error) => {
            console.error("Convex mock WebSocket error", error);
            const event = new Event("error");
            this.dispatchEvent(event);
          });
          return;
        }

        if (message.type === "Authenticate") {
          this.handleAuthenticate(message);
          return;
        }
      }

      close(code?: number, reason?: string) {
        if (this.closed) {
          return;
        }
        this.readyState = OriginalWebSocket.CLOSED;
        this.closed = true;
        const event = new CloseEvent("close", { code, reason: reason ?? "" });
        this.dispatchEvent(event);
      }

      get CONNECTING() {
        return OriginalWebSocket.CONNECTING;
      }

      get OPEN() {
        return OriginalWebSocket.OPEN;
      }

      get CLOSING() {
        return OriginalWebSocket.CLOSING;
      }

      get CLOSED() {
        return OriginalWebSocket.CLOSED;
      }
    }

    Object.defineProperty(window, "WebSocket", {
      configurable: true,
      writable: true,
      value: ConvexMockWebSocket as unknown as typeof WebSocket,
    });
  });

  const handleQuery = async (route: Route) => {
    const { path, args } = decodeConvexRequest(route);
    const recordArgs = (args ?? {}) as Record<string, unknown>;

    if (path) {
      const handler = options.queryHandlers?.[path];
      if (handler) {
        const value = await handler(recordArgs);
        if (typeof value !== "undefined") {
          await respond(route, value);
          return;
        }
      }
    }

    if (path?.startsWith("admin:")) {
      await respond(route, { data: [], total: 0 });
      return;
    }

    await respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", async (route) => {
    const { path, args } = decodeConvexRequest(route);
    const recordArgs = (args ?? {}) as Record<string, unknown>;

    if (path) {
      const handler = options.mutationHandlers?.[path];
      if (handler) {
        const value = await handler(recordArgs);
        if (typeof value !== "undefined") {
          await respond(route, value);
          return;
        }
      }
    }

    await respond(route, {});
  });

  await page.route("**/api/action", async (route) => {
    const { path, args } = decodeConvexRequest(route);
    const recordArgs = (args ?? {}) as Record<string, unknown>;

    if (path === "auth:signUp") {
      signUpCalls.push(recordArgs);
      currentUser = {
        ...currentUser,
        id: "user_signup",
        email: (recordArgs.email as string | undefined) ?? currentUser.email,
        name: (recordArgs.name as string | undefined) ?? currentUser.name,
        role: "owner",
      };
      activeToken = "test-signup-token";
      await respond(route, { token: activeToken, user: currentUser });
      return;
    }

    if (path === "auth:signIn") {
      signInCalls.push(recordArgs);
      currentUser = {
        ...currentUser,
        email: (recordArgs.email as string | undefined) ?? currentUser.email,
      };
      activeToken = "test-session-token";
      await respond(route, { token: activeToken, user: currentUser });
      return;
    }

    if (path === "auth:validateSession") {
      validateSessionCalls.push(recordArgs);
      if (!activeToken) {
        await respond(route, null);
        return;
      }
      const now = new Date();
      await respond(route, {
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
      return;
    }

    if (path === "auth:signOut") {
      activeToken = null;
      await respond(route, {});
      return;
    }

    if (path) {
      const handler = options.actionHandlers?.[path];
      if (handler) {
        const value = await handler(recordArgs);
        if (typeof value !== "undefined") {
          await respond(route, value);
          return;
        }
      }
    }

    await respond(route, {});
  });

  return {
    signUpCalls,
    signInCalls,
    validateSessionCalls,
    getCurrentUser: () => currentUser,
  };
};

export type { AuthUser, ConvexMocks, SetupConvexMocksOptions };
