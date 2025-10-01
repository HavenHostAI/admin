import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

const CLOSED_ESCALATION_STATUSES = new Set([
  "closed",
  "resolved",
  "completed",
  "dismissed",
  "cancelled",
]);

type PropertySummary = {
  id: string;
  name: string;
};

type EscalationListItem = {
  id: string;
  propertyId: string;
  propertyName: string;
  priority: string;
  status: string;
  topic: string;
  assigneeContact: string | null;
  createdAt: number;
};

type EscalationDetail = EscalationListItem & {
  summary: string | null;
  resolvedAt: number | null;
  transcriptRef: string | null;
};

type FilterResponse = {
  properties: PropertySummary[];
  priorities: string[];
  statuses: string[];
};

const formatPropertySummary = (doc: Doc<"properties">): PropertySummary => ({
  id: doc._id,
  name: doc.name,
});

const formatListItem = (
  escalation: Doc<"escalations">,
  property: Doc<"properties"> | null,
): EscalationListItem => ({
  id: escalation._id,
  propertyId: escalation.propertyId,
  propertyName: property?.name ?? "Unknown property",
  priority: escalation.priority,
  status: escalation.status,
  topic: escalation.topic,
  assigneeContact: escalation.assigneeContact ?? null,
  createdAt: escalation.createdAt,
});

export const listEscalations = query({
  args: {
    propertyId: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<EscalationListItem[]> => {
    const propertyFilter = args.propertyId
      ? ctx.db.normalizeId("properties", args.propertyId)
      : null;

    let escalationQuery = ctx.db.query("escalations");
    if (propertyFilter) {
      escalationQuery = escalationQuery.withIndex("by_property_status", (q) =>
        q.eq("propertyId", propertyFilter),
      );
    }

    const escalations = await escalationQuery.collect();

    const priorityFilter = args.priority?.trim().toLowerCase();
    const statusFilter = args.status?.trim().toLowerCase();

    const filtered = escalations.filter((escalation) => {
      const priority = escalation.priority.trim().toLowerCase();
      const status = escalation.status.trim().toLowerCase();
      if (priorityFilter && priority !== priorityFilter) {
        return false;
      }
      if (statusFilter && status !== statusFilter) {
        return false;
      }
      return true;
    });

    const uniquePropertyIds = Array.from(
      new Set(filtered.map((escalation) => escalation.propertyId)),
    );
    const propertyDocs = await Promise.all(
      uniquePropertyIds.map((propertyId) => ctx.db.get(propertyId)),
    );
    const propertyMap = new Map<Id<"properties">, Doc<"properties"> | null>(
      uniquePropertyIds.map((propertyId, index) => [
        propertyId,
        propertyDocs[index] ?? null,
      ]),
    );

    return filtered
      .map((escalation) =>
        formatListItem(
          escalation,
          propertyMap.get(escalation.propertyId) ?? null,
        ),
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listFilters = query({
  args: {},
  handler: async (ctx): Promise<FilterResponse> => {
    const [properties, escalations] = await Promise.all([
      ctx.db.query("properties").collect(),
      ctx.db.query("escalations").collect(),
    ]);

    const priorities = new Set<string>();
    const statuses = new Set<string>();

    for (const escalation of escalations) {
      const priority = escalation.priority?.trim();
      if (priority) {
        priorities.add(priority);
      }
      const status = escalation.status?.trim();
      if (status) {
        statuses.add(status);
      }
    }

    return {
      properties: properties
        .map(formatPropertySummary)
        .sort((a, b) => a.name.localeCompare(b.name)),
      priorities: Array.from(priorities).sort((a, b) => a.localeCompare(b)),
      statuses: Array.from(statuses).sort((a, b) => a.localeCompare(b)),
    };
  },
});

export const getEscalation = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args): Promise<EscalationDetail | null> => {
    const escalationId = ctx.db.normalizeId("escalations", args.id);
    if (!escalationId) {
      return null;
    }

    const escalation = await ctx.db.get(escalationId);
    if (!escalation) {
      return null;
    }

    const property = await ctx.db.get(escalation.propertyId);

    return {
      ...formatListItem(escalation, property),
      summary: escalation.summary ?? null,
      resolvedAt: escalation.resolvedAt ?? null,
      transcriptRef: escalation.transcriptRef ?? null,
    };
  },
});

export const assignContact = mutation({
  args: {
    id: v.string(),
    contact: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<EscalationDetail | null> => {
    const escalationId = ctx.db.normalizeId("escalations", args.id);
    if (!escalationId) {
      throw new Error("Escalation not found");
    }

    const escalation = await ctx.db.get(escalationId);
    if (!escalation) {
      throw new Error("Escalation not found");
    }

    const contact = args.contact?.trim() ?? "";
    const normalizedContact = contact || undefined;

    await ctx.db.patch(escalationId, {
      assigneeContact: normalizedContact,
    });

    if (normalizedContact) {
      await ctx.db.insert("notifications", {
        escalationId,
        companyId: escalation.companyId,
        type: "escalation.assignment",
        to: normalizedContact,
        status: "pending",
        attempts: 0,
        createdAt: Date.now(),
      });
    }

    const property = await ctx.db.get(escalation.propertyId);

    return {
      ...formatListItem(
        { ...escalation, assigneeContact: normalizedContact },
        property,
      ),
      summary: escalation.summary ?? null,
      resolvedAt: escalation.resolvedAt ?? null,
      transcriptRef: escalation.transcriptRef ?? null,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args): Promise<EscalationDetail | null> => {
    const escalationId = ctx.db.normalizeId("escalations", args.id);
    if (!escalationId) {
      throw new Error("Escalation not found");
    }

    const escalation = await ctx.db.get(escalationId);
    if (!escalation) {
      throw new Error("Escalation not found");
    }

    const status = args.status.trim();
    const isClosed = CLOSED_ESCALATION_STATUSES.has(status.toLowerCase());
    const resolvedAt = isClosed ? Date.now() : undefined;

    await ctx.db.patch(escalationId, {
      status,
      resolvedAt,
    });

    if (escalation.assigneeContact) {
      await ctx.db.insert("notifications", {
        escalationId,
        companyId: escalation.companyId,
        type: "escalation.status",
        to: escalation.assigneeContact,
        status: "pending",
        attempts: 0,
        createdAt: Date.now(),
      });
    }

    const property = await ctx.db.get(escalation.propertyId);

    return {
      ...formatListItem(
        {
          ...escalation,
          status,
          resolvedAt: resolvedAt ?? escalation.resolvedAt,
        },
        property,
      ),
      summary: escalation.summary ?? null,
      resolvedAt: resolvedAt ?? escalation.resolvedAt ?? null,
      transcriptRef: escalation.transcriptRef ?? null,
    };
  },
});
