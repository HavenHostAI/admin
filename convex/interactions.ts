import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

import type { Id, Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;
const SNIPPET_MAX_LENGTH = 400;
const textDecoder = new TextDecoder();

type ReviewerSummary = {
  id: string;
  name: string | null;
  email: string | null;
};

type AuthenticatedCtx = QueryCtx | MutationCtx;

type AuthIdentity = NonNullable<
  Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>
>;

const extractUserIdFromIdentity = (identity: AuthIdentity) => {
  if (identity.subject) {
    return identity.subject;
  }

  if (typeof identity.tokenIdentifier === "string") {
    const segments = identity.tokenIdentifier.split(":");
    return segments[segments.length - 1] ?? identity.tokenIdentifier;
  }

  return null;
};

const requireViewerWithCompany = async (
  ctx: AuthenticatedCtx,
): Promise<Doc<"users"> & { companyId: Id<"companies"> }> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const authUserId = extractUserIdFromIdentity(identity);
  if (!authUserId) {
    throw new Error("Unable to resolve authenticated user");
  }

  const matches = await ctx.db
    .query("users")
    .withIndex("by_auth_id", (q) => q.eq("id", authUserId))
    .collect();

  let viewer = matches[0] ?? null;

  if (!viewer && typeof identity.tokenIdentifier === "string") {
    const sessionMatches = await ctx.db
      .query("authSessions")
      .withIndex("by_token", (q) => q.eq("token", identity.tokenIdentifier))
      .collect();

    const session = sessionMatches[0] ?? null;
    if (session) {
      const userMatches = await ctx.db
        .query("users")
        .withIndex("by_auth_id", (q) => q.eq("id", session.userId))
        .collect();
      viewer = userMatches[0] ?? null;
    }
  }

  if (!viewer) {
    throw new Error("Authenticated user not found");
  }

  if (!viewer.companyId) {
    throw new Error("User is not linked to a company");
  }

  return viewer as Doc<"users"> & { companyId: Id<"companies"> };
};

const assertCompanyAccess = async (
  ctx: AuthenticatedCtx,
  companyId: Id<"companies">,
) => {
  const viewer = await requireViewerWithCompany(ctx);
  if (viewer.companyId !== companyId) {
    throw new Error("Not authorized to access this company");
  }
  return viewer;
};

const clampLimit = (limit?: number | null) => {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(limit, MAX_LIMIT));
};

const normaliseWhitespace = (value: string) =>
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const extractFromJson = (raw: string): string | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      if (Array.isArray((parsed as { segments?: unknown }).segments)) {
        const segments = (parsed as { segments: unknown[] }).segments
          .map((segment) => {
            if (typeof segment === "string") return segment;
            if (segment && typeof segment === "object") {
              const maybeSegment = segment as Record<string, unknown>;
              if (typeof maybeSegment.text === "string") {
                return maybeSegment.text;
              }
              if (typeof maybeSegment.content === "string") {
                return maybeSegment.content;
              }
            }
            return "";
          })
          .filter(Boolean)
          .join(" ");
        if (segments.trim().length > 0) {
          return segments;
        }
      }

      if (Array.isArray((parsed as { messages?: unknown }).messages)) {
        const messages = (parsed as { messages: unknown[] }).messages
          .map((message) => {
            if (typeof message === "string") return message;
            if (message && typeof message === "object") {
              const maybeMessage = message as Record<string, unknown>;
              if (typeof maybeMessage.content === "string") {
                return maybeMessage.content;
              }
              if (typeof maybeMessage.text === "string") {
                return maybeMessage.text;
              }
            }
            return "";
          })
          .filter(Boolean)
          .join(" ");
        if (messages.trim().length > 0) {
          return messages;
        }
      }
    }
  } catch (_error) {
    // Ignore JSON parse errors and fall back to the raw string.
  }
  return null;
};

const decodeStoragePayload = async (
  ctx: QueryCtx,
  reference: string | null | undefined,
): Promise<string | null> => {
  if (!reference) return null;
  const stored = await ctx.storage.get(reference);
  if (!stored) return null;

  if (typeof stored === "string") {
    return stored;
  }

  if (stored instanceof ArrayBuffer) {
    return textDecoder.decode(stored);
  }

  if (ArrayBuffer.isView(stored)) {
    return textDecoder.decode(stored);
  }

  return null;
};

const buildTranscriptSnippet = async (
  ctx: QueryCtx,
  reference: string | null | undefined,
): Promise<string | null> => {
  const decoded = await decodeStoragePayload(ctx, reference);
  if (!decoded) return null;

  const parsed = extractFromJson(decoded);
  const source = normaliseWhitespace(parsed ?? decoded);
  if (!source) return null;

  if (source.length <= SNIPPET_MAX_LENGTH) {
    return source;
  }
  return `${source.slice(0, SNIPPET_MAX_LENGTH - 1)}…`;
};

const resolveReviewer = async (
  ctx: QueryCtx,
  reviewerId: string | null | undefined,
): Promise<ReviewerSummary | null> => {
  if (!reviewerId) return null;

  const matches = await ctx.db
    .query("users")
    .withIndex("by_auth_id", (q) => q.eq("id", reviewerId))
    .collect();

  const reviewer = matches[0];
  if (!reviewer) {
    return {
      id: reviewerId,
      name: null,
      email: null,
    };
  }

  return {
    id: reviewer.id,
    name: reviewer.name ?? reviewer.email ?? null,
    email: reviewer.email ?? null,
  };
};

export const listForCompany = query({
  args: {
    companyId: v.id("companies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertCompanyAccess(ctx, args.companyId);
    const limit = clampLimit(args.limit);

    const [properties, interactions] = await Promise.all([
      ctx.db
        .query("properties")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("interactions")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect(),
    ]);

    const propertyMap = new Map<Id<"properties">, Doc<"properties">>();
    for (const property of properties) {
      propertyMap.set(property._id, property);
    }

    const sorted = interactions
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);

    const totalUnreviewed = sorted.reduce(
      (count, interaction) => (interaction.reviewedAt ? count : count + 1),
      0,
    );

    const limited = sorted.slice(0, limit);

    return {
      interactions: limited.map((interaction) => ({
        id: interaction._id,
        createdAt: interaction.createdAt,
        channel: interaction.channel,
        result: interaction.result,
        intent: interaction.intent,
        durationSec: interaction.durationSec,
        propertyId: interaction.propertyId,
        propertyName:
          propertyMap.get(interaction.propertyId)?.name ?? "Unknown property",
        reviewedAt: interaction.reviewedAt ?? null,
        reviewedByUserId: interaction.reviewedByUserId ?? null,
      })),
      stats: {
        total: sorted.length,
        unreviewed: totalUnreviewed,
      },
    };
  },
});

export const getDetails = query({
  args: {
    interactionId: v.id("interactions"),
  },
  handler: async (ctx, args) => {
    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) {
      return null;
    }

    await assertCompanyAccess(ctx, interaction.companyId);

    const property = await ctx.db.get(interaction.propertyId);
    const transcriptSnippet = await buildTranscriptSnippet(
      ctx,
      interaction.transcriptRef,
    );
    const reviewer = await resolveReviewer(ctx, interaction.reviewedByUserId);

    return {
      id: interaction._id,
      createdAt: interaction.createdAt,
      channel: interaction.channel,
      intent: interaction.intent,
      result: interaction.result,
      durationSec: interaction.durationSec,
      propertyId: interaction.propertyId,
      propertyName: property?.name ?? "Unknown property",
      transcriptSnippet,
      reviewedAt: interaction.reviewedAt ?? null,
      reviewedBy: reviewer,
      reviewedByUserId: interaction.reviewedByUserId ?? null,
    };
  },
});

export const markReviewed = mutation({
  args: {
    interactionId: v.id("interactions"),
    reviewerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) {
      throw new Error("Interaction not found");
    }

    const viewer = await assertCompanyAccess(ctx, interaction.companyId);

    const reviewedAt = Date.now();
    const reviewerId = args.reviewerId ?? viewer.id;

    await ctx.db.patch(args.interactionId, {
      reviewedAt,
      reviewedByUserId: reviewerId,
    });

    return {
      reviewedAt,
      reviewedByUserId: reviewerId,
    };
  },
});
