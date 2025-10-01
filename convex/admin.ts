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

const AI_RESOLUTION_KEYWORDS = [
  "ai",
  "assistant",
  "automated",
  "auto",
  "bot",
  "virtual",
];

const CLOSED_ESCALATION_STATUSES = new Set([
  "closed",
  "resolved",
  "completed",
  "dismissed",
  "cancelled",
]);

const DEFAULT_DASHBOARD_WINDOW_DAYS = 7;

const clampWindow = (days: number | undefined) => {
  if (!days || Number.isNaN(days)) {
    return DEFAULT_DASHBOARD_WINDOW_DAYS;
  }
  return Math.max(1, Math.min(30, Math.floor(days)));
};

const createDateWindow = (days: number) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const window: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    window.push(date.toISOString().slice(0, 10));
  }
  return window;
};

const getDateKey = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
};

const isCallChannel = (channel: string | undefined) => {
  if (!channel) return true;
  const value = channel.toLowerCase();
  return (
    value.includes("call") ||
    value.includes("phone") ||
    value.includes("voice") ||
    value.includes("telephony")
  );
};

const formatPriorityLabel = (priority: string | undefined) => {
  if (!priority) return "Unspecified";
  const trimmed = priority.trim();
  if (!trimmed) return "Unspecified";
  return trimmed
    .split(/\s+/)
    .map((segment) =>
      segment ? segment[0].toUpperCase() + segment.slice(1).toLowerCase() : "",
    )
    .join(" ");
};

const PRIORITY_ORDER = ["Critical", "High", "Medium", "Low", "Unspecified"];

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

export const dashboard = query({
  args: {
    companyId: v.id("companies"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const windowDays = clampWindow(args.days);
    const timeline = createDateWindow(windowDays);
    const timelineSet = new Set(timeline);

    const windowStartKey = timeline[0];
    const windowEndKey = timeline[timeline.length - 1];
    const windowStart = Date.parse(`${windowStartKey}T00:00:00.000Z`);
    const windowEndExclusive = Date.parse(`${windowEndKey}T23:59:59.999Z`) + 1;

    const [properties, interactions, escalations] = await Promise.all([
      ctx.db
        .query("properties")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("interactions")
        .withIndex("by_company_createdAt", (q) =>
          q
            .eq("companyId", args.companyId)
            .gte("createdAt", windowStart)
            .lt("createdAt", windowEndExclusive),
        )
        .collect(),
      ctx.db
        .query("escalations")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect(),
    ]);

    const relevantEscalations = escalations.filter(
      (escalation) => escalation.companyId === args.companyId,
    );

    const callInteractions = interactions.filter((interaction) =>
      isCallChannel(interaction.channel),
    );

    const windowedCalls = callInteractions.filter((interaction) =>
      timelineSet.has(getDateKey(interaction.createdAt)),
    );

    const callsByDate = new Map<string, number>(
      timeline.map((date) => [date, 0]),
    );

    for (const interaction of windowedCalls) {
      const key = getDateKey(interaction.createdAt);
      if (callsByDate.has(key)) {
        callsByDate.set(key, (callsByDate.get(key) ?? 0) + 1);
      }
    }

    const callsOverTime = timeline.map((date) => ({
      date,
      count: callsByDate.get(date) ?? 0,
    }));

    const aiResolvedCount = windowedCalls.reduce((total, interaction) => {
      const result = (interaction.result ?? "").toLowerCase();
      return AI_RESOLUTION_KEYWORDS.some((keyword) => result.includes(keyword))
        ? total + 1
        : total;
    }, 0);

    const closedStatuses = CLOSED_ESCALATION_STATUSES;
    const openEscalations = relevantEscalations.filter((escalation) => {
      const status = (escalation.status ?? "").toLowerCase();
      return !closedStatuses.has(status);
    });

    const escalationPriorityMap = new Map<string, number>();
    for (const escalation of openEscalations) {
      const label = formatPriorityLabel(escalation.priority);
      escalationPriorityMap.set(
        label,
        (escalationPriorityMap.get(label) ?? 0) + 1,
      );
    }

    const escalationsByPriority = Array.from(
      escalationPriorityMap.entries(),
      ([priority, value]) => ({ priority, value }),
    ).sort((a, b) => {
      const aIndex = PRIORITY_ORDER.indexOf(a.priority);
      const bIndex = PRIORITY_ORDER.indexOf(b.priority);
      const safeA = aIndex === -1 ? PRIORITY_ORDER.length : aIndex;
      const safeB = bIndex === -1 ? PRIORITY_ORDER.length : bIndex;
      return safeA - safeB;
    });

    const totalCalls = windowedCalls.length;
    const aiResolutionRate =
      totalCalls === 0 ? 0 : aiResolvedCount / totalCalls;

    return {
      metrics: {
        callsHandled: totalCalls,
        aiResolutionRate,
        openEscalations: openEscalations.length,
        unitsUnderManagement: properties.length,
      },
      charts: {
        callsOverTime,
        escalationsByPriority,
      },
      lastUpdated: Date.now(),
    };
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
