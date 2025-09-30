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
  "aiSettings",
  "apiKeys",
  "webhooks",
  "dncNumbers",
  "dataRetentionSettings",
  "evalResults",
];

const ensureTable = (table: string): TableNames => {
  if (tables.includes(table as TableNames)) {
    return table as TableNames;
  }
  throw new Error(`Unknown table "${table}".`);
};

/**
 * OpenAPI operation `adminList` (`POST /admin/list`).
 *
 * Returns paginated documents from the requested table with optional sort and
 * filter arguments that mirror the admin UI data provider contract.
 */
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

/**
 * OpenAPI operation `adminGet` (`POST /admin/get`).
 *
 * Fetches a single document from the target table using either a Convex id or
 * a stable external identifier recognised by `normalizeId`.
 */
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

/**
 * OpenAPI operation `adminGetMany` (`POST /admin/getMany`).
 *
 * Resolves multiple documents by id, preserving only the entries that exist in
 * the Convex store.
 */
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

/**
 * OpenAPI operation `adminGetManyReference` (`POST /admin/getManyReference`).
 *
 * Lists documents that reference a foreign id, supporting pagination, sort,
 * and additional filters for admin reference inputs.
 */
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

/**
 * OpenAPI operation `adminCreate` (`POST /admin/create`).
 *
 * Inserts a new document into the requested table after stripping client-side
 * identifiers from the payload.
 */
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

/**
 * OpenAPI operation `adminUpdate` (`POST /admin/update`).
 *
 * Partially updates an existing document, ensuring the id is normalised prior
 * to applying the requested patch.
 */
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

/**
 * OpenAPI operation `adminUpdateMany` (`POST /admin/updateMany`).
 *
 * Applies the same patch across multiple documents and returns the list of
 * external identifiers that were successfully updated.
 */
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

/**
 * OpenAPI operation `adminDelete` (`POST /admin/delete`).
 *
 * Removes a single document and returns its previous state for audit-aware
 * clients.
 */
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

/**
 * OpenAPI operation `adminDeleteMany` (`POST /admin/deleteMany`).
 *
 * Deletes multiple documents by id and returns the identifiers that were
 * successfully removed.
 */
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

/**
 * OpenAPI operation `adminNormalizeId` (`POST /admin/normalizeId`).
 *
 * Converts a human-friendly identifier into the Convex document id, throwing
 * when the value cannot be resolved.
 */
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
