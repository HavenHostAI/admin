"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { randomBytes } from "crypto";
import type { Doc } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const createToken = () => randomBytes(32).toString("hex");

const getSendGridConfig = () => ({
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL,
});

const getAppBaseUrl = () => process.env.APP_BASE_URL ?? "http://localhost:5173";

async function getSessionForToken(ctx: ActionCtx, token: string) {
  const sessions = (await ctx.runQuery(internal.authStore.getAll, {
    table: "authSessions",
  })) as Array<Record<string, unknown>>;
  return sessions.find((session) => session.token === token) ?? null;
}

async function getUserDocByAuthId(ctx: ActionCtx, authUserId: string) {
  const users = (await ctx.runQuery(internal.authStore.getAll, {
    table: "users",
  })) as Array<Record<string, unknown>>;
  return users.find((user) => user.id === authUserId) ?? null;
}

async function sendInvitationEmail({
  email,
  companyName,
  inviterName,
  inviteLink,
}: {
  email: string;
  companyName: string;
  inviterName?: string | null;
  inviteLink: string;
}) {
  const { apiKey, fromEmail } = getSendGridConfig();
  if (!apiKey || !fromEmail) {
    console.warn(
      "SendGrid credentials are not configured; skipping email send",
      {
        hasApiKey: Boolean(apiKey),
        hasFromEmail: Boolean(fromEmail),
        envApiKey: process.env.SENDGRID_API_KEY ? "[set]" : "[missing]",
        envFromEmail: process.env.SENDGRID_FROM_EMAIL ? "[set]" : "[missing]",
      }
    );
    return;
  }

  const subject = `You've been invited to join ${companyName}`;
  const inviterText = inviterName
    ? `${inviterName} has invited you`
    : "You've been invited";
  const plainText = `${inviterText} to join ${companyName} on HavenHost.\n\nClick the link below to create your account:\n${inviteLink}\n\nIf you did not expect this invitation, you can ignore this email.`;
  const htmlContent = `
    <p>${inviterText} to join <strong>${companyName}</strong> on HavenHost.</p>
    <p><a href="${inviteLink}" target="_blank" rel="noopener">Click here to create your account</a>.</p>
    <p>If you did not expect this invitation, you can ignore this email.</p>
  `;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email }],
          subject,
        },
      ],
      from: { email: fromEmail },
      content: [
        { type: "text/plain", value: plainText },
        { type: "text/html", value: htmlContent },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to send SendGrid email", response.status, body);
    throw new Error("Unable to send invitation email");
  }
}

export const inviteUser = action({
  args: {
    sessionToken: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emailLower = args.email.trim().toLowerCase();
    const session = await getSessionForToken(ctx, args.sessionToken);
    if (!session) {
      throw new Error("You must be signed in to invite users");
    }

    const inviter = await getUserDocByAuthId(ctx, session.userId);
    if (!inviter) {
      throw new Error("Unable to resolve current user");
    }
    if (!inviter.companyId) {
      throw new Error("Only users belonging to a company can invite others");
    }

    const company = (await ctx.runQuery(internal.companyStore.getCompany, {
      id: inviter.companyId,
    })) as Doc<"companies"> | null;
    if (!company) {
      throw new Error("Company not found");
    }

    const inviterRole = inviter.role ?? "owner";
    if (inviterRole !== "owner") {
      throw new Error("Only company owners can send invitations");
    }

    const now = Date.now();
    const token = createToken();

    const users = (await ctx.runQuery(internal.authStore.getAll, {
      table: "users",
    })) as Array<Record<string, unknown>>;
    const existingUser = users.find(
      (user) =>
        user.email?.toLowerCase() === emailLower &&
        String(user.companyId) === String(inviter.companyId)
    );

    if (existingUser && existingUser.status === "active") {
      throw new Error("A user with this email already belongs to your company");
    }

    const role = args.role ?? "agent";
    const invitationExpiresAt = now + INVITATION_TTL_MS;

    if (existingUser) {
      await ctx.runMutation(internal.authStore.patch, {
        table: "users",
        documentId: existingUser._id,
        patch: {
          id: existingUser.id?.startsWith("invitation:")
            ? existingUser.id
            : `invitation:${token}`,
          status: "invited",
          role,
          name: args.name ?? existingUser.name,
          email: emailLower,
          updatedAt: now,
        },
      });
    } else {
      await ctx.runMutation(internal.authStore.insert, {
        table: "users",
        doc: {
          id: `invitation:${token}`,
          companyId: inviter.companyId,
          email: emailLower,
          name: args.name,
          role,
          status: "invited",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    const existingInvitation = (await ctx.runQuery(
      internal.companyStore.findInvitationByCompanyEmail,
      {
        companyId: inviter.companyId,
        email: emailLower,
      }
    )) as Record<string, unknown> | null;

    if (existingInvitation) {
      await ctx.runMutation(internal.companyStore.updateInvitation, {
        id: existingInvitation._id,
        patch: {
          token,
          role,
          status: "pending",
          createdAt: now,
          expiresAt: invitationExpiresAt,
        },
      });
    } else {
      await ctx.runMutation(internal.companyStore.insertInvitation, {
        token,
        companyId: inviter.companyId,
        email: emailLower,
        invitedByUserId: inviter._id,
        role,
        status: "pending",
        createdAt: now,
        expiresAt: invitationExpiresAt,
      });
    }

    const baseUrl = getAppBaseUrl().replace(/\/$/, "");
    const inviteLink = `${baseUrl}/signup?invitation=${token}&email=${encodeURIComponent(
      emailLower
    )}`;

    await sendInvitationEmail({
      email: emailLower,
      companyName: company.name,
      inviterName: inviter.name ?? inviter.email,
      inviteLink,
    });

    return { success: true };
  },
});
