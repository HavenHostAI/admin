import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { KNOWLEDGE_BASE_EMBEDDING_DIMENSION } from "./constants";

type FaqDoc = Doc<"faqs">;
type LocalRecDoc = Doc<"localRecs">;

type FaqResponse = {
  id: string;
  propertyId: string;
  text: string;
  category: string | null;
  tags: string[];
  updatedAt: number;
};

type LocalRecResponse = {
  id: string;
  propertyId: string;
  name: string;
  category: string;
  url: string | null;
  tips: string | null;
  hours: string | null;
  tags: string[];
  updatedAt: number;
};

type PropertySummary = {
  id: string;
  name: string;
};

const sanitizeTags = (tags: string[] | undefined) => {
  if (!tags) return [];
  const seen = new Set<string>();
  const sanitized: string[] = [];
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    sanitized.push(trimmed);
  }
  return sanitized;
};

const formatFaq = (doc: FaqDoc): FaqResponse => ({
  id: doc._id,
  propertyId: doc.propertyId,
  text: doc.text,
  category: doc.category ?? null,
  tags: doc.tags ?? [],
  updatedAt: doc.updatedAt,
});

const formatLocalRec = (doc: LocalRecDoc): LocalRecResponse => ({
  id: doc._id,
  propertyId: doc.propertyId,
  name: doc.name,
  category: doc.category,
  url: doc.url ?? null,
  tips: doc.tips ?? null,
  hours: doc.hours ?? null,
  tags: doc.tags ?? [],
  updatedAt: doc.updatedAt,
});

const computeMockEmbedding = (content: string) => {
  const accumulator = new Array<number>(KNOWLEDGE_BASE_EMBEDDING_DIMENSION).fill(
    0,
  );
  if (!content) {
    return accumulator;
  }
  const normalized = content.normalize("NFKD");
  for (let index = 0; index < normalized.length; index += 1) {
    const charCode = normalized.charCodeAt(index);
    accumulator[index % KNOWLEDGE_BASE_EMBEDDING_DIMENSION] += charCode / 255;
  }
  return accumulator.map((value) => Number(value.toFixed(6)));
};

export const listFaqs = query({
  args: {
    propertyId: v.optional(v.string()),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<FaqResponse[]> => {
    const propertyId = args.propertyId
      ? ctx.db.normalizeId("properties", args.propertyId)
      : null;

    const search = args.search?.trim().toLowerCase() ?? "";
    const category = args.category?.trim().toLowerCase() ?? "";

    let faqsQuery = ctx.db.query("faqs");
    if (propertyId) {
      faqsQuery = faqsQuery.withIndex("by_property", (q) =>
        q.eq("propertyId", propertyId),
      );
    }

    const faqs = await faqsQuery.collect();

    return faqs
      .filter((faq) => {
        if (category && (faq.category ?? "").toLowerCase() !== category) {
          return false;
        }
        if (!search) {
          return true;
        }
        const haystack = [
          faq.text,
          faq.category ?? "",
          faq.tags?.join(" ") ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      })
      .map(formatFaq);
  },
});

export const listLocalRecommendations = query({
  args: {
    propertyId: v.optional(v.string()),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<LocalRecResponse[]> => {
    const propertyId = args.propertyId
      ? ctx.db.normalizeId("properties", args.propertyId)
      : null;

    const search = args.search?.trim().toLowerCase() ?? "";
    const category = args.category?.trim().toLowerCase() ?? "";

    let recsQuery = ctx.db.query("localRecs");
    if (propertyId) {
      recsQuery = recsQuery.withIndex("by_property", (q) =>
        q.eq("propertyId", propertyId),
      );
    }

    const recs = await recsQuery.collect();

    return recs
      .filter((rec) => {
        if (category && rec.category.toLowerCase() !== category) {
          return false;
        }
        if (!search) {
          return true;
        }
        const haystack = [
          rec.name,
          rec.category,
          rec.url ?? "",
          rec.tips ?? "",
          rec.hours ?? "",
          rec.tags?.join(" ") ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      })
      .map(formatLocalRec);
  },
});

export const listProperties = query({
  args: {},
  handler: async (ctx): Promise<PropertySummary[]> => {
    const properties = await ctx.db.query("properties").collect();
    return properties
      .map((property) => ({
        id: property._id,
        name: property.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const saveFaq = mutation({
  args: {
    id: v.optional(v.string()),
    propertyId: v.string(),
    text: v.string(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<FaqResponse> => {
    const propertyId = ctx.db.normalizeId("properties", args.propertyId);
    if (!propertyId) {
      throw new Error("Invalid property id supplied for FAQ entry.");
    }

    const trimmedText = args.text.trim();
    if (!trimmedText) {
      throw new Error("FAQ text cannot be empty.");
    }

    const tags = sanitizeTags(args.tags);
    const category = args.category?.trim() || undefined;

    let faqId: Id<"faqs">;
    if (args.id) {
      const normalizedFaqId = ctx.db.normalizeId("faqs", args.id);
      if (!normalizedFaqId) {
        throw new Error("Unknown FAQ id supplied for update.");
      }
      faqId = normalizedFaqId;
      await ctx.db.patch(faqId, {
        propertyId,
        text: trimmedText,
        tags,
        category,
        embedding: undefined,
        updatedAt: Date.now(),
      });
    } else {
      faqId = await ctx.db.insert("faqs", {
        propertyId,
        text: trimmedText,
        category,
        tags,
        embedding: undefined,
        updatedAt: Date.now(),
      });
    }

    const saved = await ctx.db.get(faqId);
    if (!saved) {
      throw new Error("Failed to persist FAQ entry.");
    }

    await ctx.scheduler.runAfter(
      0,
      internal.knowledgeBase.generateFaqEmbedding,
      {
        id: faqId,
      },
    );

    return formatFaq(saved);
  },
});

export const deleteFaq = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const faqId = ctx.db.normalizeId("faqs", args.id);
    if (!faqId) {
      throw new Error("Unknown FAQ id supplied for deletion.");
    }
    await ctx.db.delete(faqId);
  },
});

export const saveLocalRecommendation = mutation({
  args: {
    id: v.optional(v.string()),
    propertyId: v.string(),
    name: v.string(),
    category: v.string(),
    url: v.optional(v.string()),
    tips: v.optional(v.string()),
    hours: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<LocalRecResponse> => {
    const propertyId = ctx.db.normalizeId("properties", args.propertyId);
    if (!propertyId) {
      throw new Error("Invalid property id supplied for recommendation entry.");
    }

    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new Error("Recommendation name cannot be empty.");
    }

    const trimmedCategory = args.category.trim();
    if (!trimmedCategory) {
      throw new Error("Recommendation category cannot be empty.");
    }

    const tags = sanitizeTags(args.tags);
    const url = args.url?.trim() || undefined;
    const tips = args.tips?.trim() || undefined;
    const hours = args.hours?.trim() || undefined;

    let recId: Id<"localRecs">;
    if (args.id) {
      const normalizedId = ctx.db.normalizeId("localRecs", args.id);
      if (!normalizedId) {
        throw new Error("Unknown recommendation id supplied for update.");
      }
      recId = normalizedId;
      await ctx.db.patch(recId, {
        propertyId,
        name: trimmedName,
        category: trimmedCategory,
        url,
        tips,
        hours,
        tags,
        embedding: undefined,
        updatedAt: Date.now(),
      });
    } else {
      recId = await ctx.db.insert("localRecs", {
        propertyId,
        name: trimmedName,
        category: trimmedCategory,
        url,
        tips,
        hours,
        tags,
        embedding: undefined,
        updatedAt: Date.now(),
      });
    }

    const saved = await ctx.db.get(recId);
    if (!saved) {
      throw new Error("Failed to persist recommendation entry.");
    }

    await ctx.scheduler.runAfter(
      0,
      internal.knowledgeBase.generateLocalRecommendationEmbedding,
      {
        id: recId,
      },
    );

    return formatLocalRec(saved);
  },
});

export const deleteLocalRecommendation = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const recId = ctx.db.normalizeId("localRecs", args.id);
    if (!recId) {
      throw new Error("Unknown recommendation id supplied for deletion.");
    }
    await ctx.db.delete(recId);
  },
});

export const generateFaqEmbedding = internalMutation({
  args: { id: v.id("faqs") },
  handler: async (ctx, args) => {
    const faq = await ctx.db.get(args.id);
    if (!faq) return;

    const content = [faq.text, faq.category ?? "", (faq.tags ?? []).join(" ")]
      .join(" ")
      .trim();
    const embedding = computeMockEmbedding(content);

    await ctx.db.patch(args.id, {
      embedding,
      updatedAt: Date.now(),
    });
  },
});

export const generateLocalRecommendationEmbedding = internalMutation({
  args: { id: v.id("localRecs") },
  handler: async (ctx, args) => {
    const rec = await ctx.db.get(args.id);
    if (!rec) return;

    const content = [
      rec.name,
      rec.category,
      rec.url ?? "",
      rec.tips ?? "",
      rec.hours ?? "",
      (rec.tags ?? []).join(" "),
    ]
      .join(" ")
      .trim();
    const embedding = computeMockEmbedding(content);

    await ctx.db.patch(args.id, {
      embedding,
      updatedAt: Date.now(),
    });
  },
});
