import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createCompany = internalMutation({
  args: {
    name: v.string(),
    timezone: v.string(),
    plan: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("companies", args);
    return ctx.db.get(id);
  },
});

export const getCompany = internalQuery({
  args: { id: v.id("companies") },
  handler: (ctx, args) => ctx.db.get(args.id),
});

export const getInvitationByToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invitations = await ctx.db.query("companyInvitations").collect();
    return invitations.find((inv) => inv.token === token) ?? null;
  },
});

export const findInvitationByCompanyEmail = internalQuery({
  args: {
    companyId: v.id("companies"),
    email: v.string(),
  },
  handler: async (ctx, { companyId, email }) => {
    const emailLower = email.toLowerCase();
    const invitations = await ctx.db.query("companyInvitations").collect();
    return (
      invitations.find(
        (inv) =>
          inv.companyId === companyId && inv.email.toLowerCase() === emailLower,
      ) ?? null
    );
  },
});

export const insertInvitation = internalMutation({
  args: {
    token: v.string(),
    companyId: v.id("companies"),
    email: v.string(),
    invitedByUserId: v.id("users"),
    role: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  handler: (ctx, args) => ctx.db.insert("companyInvitations", args),
});

export const updateInvitation = internalMutation({
  args: {
    id: v.id("companyInvitations"),
    patch: v.any(),
  },
  handler: (ctx, { id, patch }) => ctx.db.patch(id, patch),
});
