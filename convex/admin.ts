import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  createDocument,
  deleteDocument,
  deleteManyDocuments,
  getDocumentOrThrow,
  getManyDocuments,
  listArgsValidator,
  listDocuments,
  listReference,
  referenceArgsValidator,
  updateDocument,
  updateManyDocuments,
  normalizeOrThrow,
} from "./utils";
import type { TableNames } from "./_generated/dataModel";

const tables: TableNames[] = [
  "companies",
  "users",
  "properties",
  "propertyConfigs",
  "numbers",
  "faqs",
  "localRecs",
  "integrations",
  "interactions",
  "escalations",
  "notifications",
  "billingUsage",
  "auditLogs",
  "companyInvitations",
  "authSessions",
  "authAccounts",
  "authVerifications",
];

const ensureTable = (table: string): TableNames => {
  if (tables.includes(table as TableNames)) {
    return table as TableNames;
  }
  throw new Error(`Unknown table "${table}".`);
};

export const list = query({
  args: {
    table: v.string(),
    ...listArgsValidator,
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    return listDocuments(ctx, table, args);
  },
});

export const get = query({
  args: {
    table: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    return getDocumentOrThrow(ctx, table, args.id);
  },
});

export const getMany = query({
  args: {
    table: v.string(),
    ids: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    return getManyDocuments(ctx, table, args.ids);
  },
});

export const getManyReference = query({
  args: {
    table: v.string(),
    ...referenceArgsValidator,
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    return listReference(ctx, table, args);
  },
});

export const create = mutation({
  args: {
    table: v.string(),
    data: v.any(),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    const { data } = args;
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid data payload for create mutation");
    }
    const { id: _id, ...rest } = data as Record<string, unknown>;
    return createDocument(ctx, table, rest);
  },
});

export const update = mutation({
  args: {
    table: v.string(),
    id: v.string(),
    data: v.any(),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    const { data } = args;
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid data payload for update mutation");
    }
    const { id: _id, ...rest } = data as Record<string, unknown>;
    return updateDocument(ctx, table, args.id, rest);
  },
});

export const updateMany = mutation({
  args: {
    table: v.string(),
    ids: v.array(v.string()),
    data: v.any(),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    const { data } = args;
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid data payload for updateMany mutation");
    }
    const { id: _id, ...rest } = data as Record<string, unknown>;
    return updateManyDocuments(ctx, table, args.ids, rest);
  },
});

export const del = mutation({
  args: {
    table: v.string(),
    id: v.string(),
    meta: v.optional(v.any()),
    previousData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    return deleteDocument(ctx, table, args.id);
  },
});

export const deleteMany = mutation({
  args: {
    table: v.string(),
    ids: v.array(v.string()),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    return deleteManyDocuments(ctx, table, args.ids);
  },
});

export const normalizeId = query({
  args: {
    table: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const table = ensureTable(args.table);
    return normalizeOrThrow(ctx, table, args.id);
  },
});
