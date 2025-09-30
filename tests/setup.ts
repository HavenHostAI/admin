import { createRequire } from "node:module";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

const require = createRequire(import.meta.url);
const { setupServer } = require("msw/node");

vi.stubEnv("VITE_CONVEX_URL", "http://test.convex");

export const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

const FUNCTION_NAME_SYMBOL = Symbol.for("functionName");

const buildPath = (reference: unknown) => {
  if (typeof reference === "string") {
    return reference.replace(/:/g, "/");
  }

  if (reference && typeof reference === "object") {
    const name = (reference as Record<symbol, string>)[FUNCTION_NAME_SYMBOL];
    if (typeof name === "string") {
      return name.replace(/:/g, "/");
    }
  }

  throw new Error("Invalid Convex function reference");
};

class MockConvexHttpClient {
  constructor(private readonly baseUrl: string) {}

  private async request(
    type: "queries" | "mutations" | "actions",
    reference: unknown,
    args: Record<string, unknown> | undefined,
  ) {
    const response = await fetch(
      `${this.baseUrl}/${type}/${buildPath(reference)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(args ?? {}),
      },
    );

    if (!response.ok) {
      const error = new Error(
        `Convex ${type} request to ${this.baseUrl} failed with status ${response.status}`,
      );
      try {
        (error as { body?: unknown }).body = await response.clone().json();
      } catch (_error) {
        (error as { body?: unknown }).body = undefined;
      }
      throw error;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
  }

  query(reference: unknown, args?: Record<string, unknown>) {
    return this.request("queries", reference, args);
  }

  mutation(reference: unknown, args?: Record<string, unknown>) {
    return this.request("mutations", reference, args);
  }

  action(reference: unknown, args?: Record<string, unknown>) {
    return this.request("actions", reference, args);
  }
}

vi.mock("convex/browser", () => ({
  ConvexHttpClient: MockConvexHttpClient,
}));
