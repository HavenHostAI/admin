import "../../../tests/setup";
import { rest } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { authProvider } from "@/lib/authProvider";
import { server } from "../../../tests/setup";

const TOKEN_KEY = "better-auth:token";
const USER_KEY = "better-auth:user";

describe("authProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores the session token and user details on login", async () => {
    const email = "admin@example.com";
    const password = "password";
    const user = { id: "user_1", email, role: "admin" };

    server.use(
      rest.post("http://test.convex/actions/auth/signIn", async (req, res, ctx) => {
        const body = await req.json();
        expect(body).toEqual({ email, password });
        return res(ctx.json({ token: "session-token", user }));
      }),
    );

    await authProvider.login({ email, password });

    expect(localStorage.getItem(TOKEN_KEY)).toBe("session-token");
    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(user));
  });

  it("clears persisted credentials when the session is no longer valid", async () => {
    localStorage.setItem(TOKEN_KEY, "expired-token");
    localStorage.setItem(USER_KEY, JSON.stringify({ id: "user_1" }));

    server.use(
      rest.post("http://test.convex/actions/auth/validateSession", (_req, res, ctx) =>
        res(ctx.json(null)),
      ),
    );

    await expect(authProvider.checkAuth()).rejects.toThrowError("Session expired");

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});
