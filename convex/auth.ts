import { action } from "./_generated/server";
import { v } from "convex/values";
/* eslint-disable @typescript-eslint/no-unused-expressions */
("use node");
/* eslint-enable @typescript-eslint/no-unused-expressions */

import { betterAuth } from "better-auth";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { createConvexAdapter, convertFromStorage } from "./_lib/authAdapter";
import type { Doc, Id } from "./_generated/dataModel";

const DEFAULT_BASE_URL =
  process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:5173";
const DEFAULT_SECRET = process.env.BETTER_AUTH_SECRET ?? "dev-secret";

const trustedOrigins = (() => {
  const envOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (!envOrigins) return [DEFAULT_BASE_URL];
  return envOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
})();

const createAuth = (ctx: ActionCtx) =>
  betterAuth({
    baseURL: DEFAULT_BASE_URL,
    secret: DEFAULT_SECRET,
    rateLimit: { enabled: false },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
    },
    trustedOrigins,
    advanced: {
      disableCSRFCheck: true,
      useSecureCookies: false,
    },
    user: {
      modelName: "users",
      fields: {
        name: "name",
        email: "email",
        emailVerified: "emailVerified",
        image: "image",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      additionalFields: {
        companyId: { type: "string", required: false, fieldName: "companyId" },
        role: { type: "string", required: false, fieldName: "role" },
        status: { type: "string", required: false, fieldName: "status" },
      },
    },
    session: {
      modelName: "authSessions",
      fields: {
        token: "token",
        userId: "userId",
        expiresAt: "expiresAt",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
        ipAddress: "ipAddress",
        userAgent: "userAgent",
      },
    },
    account: {
      modelName: "authAccounts",
      fields: {
        accountId: "accountId",
        providerId: "providerId",
        userId: "userId",
        accessToken: "accessToken",
        refreshToken: "refreshToken",
        idToken: "idToken",
        accessTokenExpiresAt: "accessTokenExpiresAt",
        refreshTokenExpiresAt: "refreshTokenExpiresAt",
        scope: "scope",
        password: "password",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
    },
    verification: {
      modelName: "authVerifications",
      fields: {
        identifier: "identifier",
        value: "value",
        expiresAt: "expiresAt",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
    },
    database: () => createConvexAdapter(ctx),
  });

const serializeUser = (raw: Record<string, unknown>) => ({
  ...raw,
  companyId: raw.companyId ? String(raw.companyId) : raw.companyId,
  createdAt:
    raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt,
  updatedAt:
    raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw.updatedAt,
});

export const signIn = action({
  args: {
    email: v.string(),
    password: v.string(),
    rememberMe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const auth = createAuth(ctx);
    try {
      const result = await auth.api.signInEmail({
        body: {
          email: args.email,
          password: args.password,
          rememberMe: args.rememberMe ?? true,
        },
        headers: new Headers(),
        request: new Request(`${auth.options.baseURL}/sign-in/email`, {
          method: "POST",
        }),
      });

      return {
        token: result.token,
        user: serializeUser(result.user as Record<string, unknown>),
      };
    } catch (error) {
      if (error && typeof error === "object" && "body" in error) {
        throw new Error(
          (error as { body?: { message?: string } }).body?.message ??
            "Unable to sign in"
        );
      }
      throw error;
    }
  },
});

export const signUp = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    companyName: v.optional(v.string()),
    companyTimezone: v.optional(v.string()),
    companyPlan: v.optional(v.string()),
    invitationToken: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ token: string; user: Record<string, unknown> }> => {
    const auth = createAuth(ctx);
    const now = Date.now();
    const emailLower = args.email.trim().toLowerCase();

    let companyId: Id<"companies">;
    let roleForUser = "member";

    if (args.invitationToken) {
      const invitation = (await ctx.runQuery(
        internal.companyStore.getInvitationByToken,
        {
          token: args.invitationToken,
        }
      )) as (Doc<"companyInvitations"> & Record<string, unknown>) | null;
      if (!invitation || invitation.status !== "pending") {
        throw new Error("This invitation is no longer valid");
      }
      if (invitation.expiresAt < now) {
        await ctx.runMutation(internal.companyStore.updateInvitation, {
          id: invitation._id,
          patch: { status: "expired" },
        });
        throw new Error("This invitation has expired");
      }
      if (invitation.email.toLowerCase() !== emailLower) {
        throw new Error(
          "This invitation was sent to a different email address"
        );
      }
      companyId = invitation.companyId;
      roleForUser = invitation.role ?? "agent";
    } else {
      const companyName = args.companyName?.trim();
      if (!companyName) {
        throw new Error("Company name is required to create a new account");
      }
      const companyDoc = (await ctx.runMutation(
        internal.companyStore.createCompany,
        {
          name: companyName,
          timezone: args.companyTimezone ?? "UTC",
          plan: args.companyPlan ?? "starter",
          createdAt: now,
        }
      )) as Doc<"companies">;
      companyId = companyDoc._id;
      roleForUser = "owner";
    }

    const result = (await auth.api.signUpEmail({
      body: {
        email: emailLower,
        password: args.password,
        name: args.name,
      },
      headers: new Headers(),
      request: new Request(`${auth.options.baseURL}/sign-up/email`, {
        method: "POST",
      }),
    })) as { token: string; user: Record<string, unknown> };

    const users = (await ctx.runQuery(internal.authStore.getAll, {
      table: "users",
    })) as Array<Record<string, unknown>>;
    const existingUserDoc = users.find((doc) => doc.id === result.user.id);

    const baseUserData: Record<string, unknown> = {
      id: result.user.id,
      companyId,
      email: emailLower,
      name: args.name,
      role: roleForUser,
      status: "active",
      emailVerified: result.user.emailVerified ?? false,
      updatedAt: now,
    };

    if (existingUserDoc) {
      await ctx.runMutation(internal.authStore.patch, {
        table: "users",
        documentId: existingUserDoc._id,
        patch: {
          ...baseUserData,
          createdAt: existingUserDoc.createdAt ?? now,
        },
      });
    } else {
      await ctx.runMutation(internal.authStore.insert, {
        table: "users",
        doc: {
          ...baseUserData,
          createdAt: now,
        },
      });
    }

    if (args.invitationToken) {
      const invitation = (await ctx.runQuery(
        internal.companyStore.getInvitationByToken,
        {
          token: args.invitationToken,
        }
      )) as (Doc<"companyInvitations"> & Record<string, unknown>) | null;
      if (invitation) {
        await ctx.runMutation(internal.companyStore.updateInvitation, {
          id: invitation._id,
          patch: {
            status: "accepted",
            expiresAt: now,
          },
        });
      }
    }

    const updatedUsers = (await ctx.runQuery(internal.authStore.getAll, {
      table: "users",
    })) as Array<Record<string, unknown>>;
    const finalUserDoc = updatedUsers.find((doc) => doc.id === result.user.id);
    if (finalUserDoc) {
      result.user = {
        ...result.user,
        ...convertFromStorage("users", finalUserDoc),
      };
    }

    return {
      token: result.token,
      user: serializeUser(result.user as Record<string, unknown>),
    };
  },
});

export const validateSession = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const sessions = (await ctx.runQuery(internal.authStore.getAll, {
      table: "authSessions",
    })) as Array<Record<string, unknown>>;
    const sessionDoc = sessions.find((doc) => doc.token === token);
    if (!sessionDoc) return null;
    if (
      typeof sessionDoc.expiresAt === "number" &&
      sessionDoc.expiresAt <= Date.now()
    ) {
      await ctx.runMutation(internal.authStore.remove, {
        table: "authSessions",
        documentId: sessionDoc._id,
      });
      return null;
    }

    const users = (await ctx.runQuery(internal.authStore.getAll, {
      table: "users",
    })) as Array<Record<string, unknown>>;
    const userDoc = users.find((doc) => doc.id === sessionDoc.userId);
    if (!userDoc) return null;

    return {
      session: {
        token: sessionDoc.token,
        userId: sessionDoc.userId,
        expiresAt:
          typeof sessionDoc.expiresAt === "number"
            ? new Date(sessionDoc.expiresAt).toISOString()
            : sessionDoc.expiresAt,
        createdAt:
          typeof sessionDoc.createdAt === "number"
            ? new Date(sessionDoc.createdAt).toISOString()
            : sessionDoc.createdAt,
        updatedAt:
          typeof sessionDoc.updatedAt === "number"
            ? new Date(sessionDoc.updatedAt).toISOString()
            : sessionDoc.updatedAt,
      },
      user: serializeUser(convertFromStorage("users", userDoc)),
    };
  },
});

export const signOut = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const sessions = (await ctx.runQuery(internal.authStore.getAll, {
      table: "authSessions",
    })) as Array<Record<string, unknown>>;
    const sessionDoc = sessions.find((doc) => doc.token === token);
    if (!sessionDoc) return;
    await ctx.runMutation(internal.authStore.remove, {
      table: "authSessions",
      documentId: sessionDoc._id,
    });
  },
});
