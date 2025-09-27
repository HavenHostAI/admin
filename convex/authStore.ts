import { internalMutation, internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { TableNames } from "./_generated/dataModel";

const ensureTable = (table: string): TableNames => {
  const normalized = table as TableNames;
  const known: TableNames[] = [
    "users",
    "authSessions",
    "authAccounts",
    "authVerifications",
    "companyInvitations",
  ];
  if (known.includes(normalized)) {
    return normalized;
  }

  const aliasMap: Record<string, TableNames> = {
    user: "users",
    session: "authSessions",
    account: "authAccounts",
    verification: "authVerifications",
    sessions: "authSessions",
    accounts: "authAccounts",
    verifications: "authVerifications",
    invitation: "companyInvitations",
    invitations: "companyInvitations",
  };
  const mapped = aliasMap[table];
  if (!mapped) {
    throw new ConvexError(`Unsupported auth table "${table}"`);
  }
  return mapped;
};

export const getAll = internalQuery({
  args: { table: v.string() },
  handler: async (ctx, { table }) => {
    const tableName = ensureTable(table);
    return ctx.db.query(tableName).collect();
  },
});

export const insert = internalMutation({
  args: {
    table: v.string(),
    doc: v.any(),
  },
  handler: async (ctx, { table, doc }) => {
    const tableName = ensureTable(table);
    const id = await ctx.db.insert(tableName, doc);
    return { ...(await ctx.db.get(id)), _id: id };
  },
});

export const patch = internalMutation({
  args: {
    table: v.string(),
    documentId: v.any(),
    patch: v.any(),
  },
  handler: async (ctx, { table, documentId, patch }) => {
    const tableName = ensureTable(table);
    const convexId =
      typeof documentId === "string"
        ? ctx.db.normalizeId(tableName, documentId)
        : documentId;
    if (!convexId) {
      throw new ConvexError(`Invalid id ${documentId} for table ${table}`);
    }
    await ctx.db.patch(convexId, patch);
    return { ...(await ctx.db.get(convexId)), _id: convexId };
  },
});

export const remove = internalMutation({
  args: {
    table: v.string(),
    documentId: v.any(),
  },
  handler: async (ctx, { table, documentId }) => {
    const tableName = ensureTable(table);
    const convexId =
      typeof documentId === "string"
        ? ctx.db.normalizeId(tableName, documentId)
        : documentId;
    if (!convexId) {
      throw new ConvexError(`Invalid id ${documentId} for table ${table}`);
    }
    await ctx.db.delete(convexId);
  },
});
