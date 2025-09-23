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
  referenceArgsValidator,
  updateDocument,
  updateManyDocuments,
  listReference,
} from "./utils";

const TABLE_NAME = "posts";

export const list = query({
  args: listArgsValidator,
  handler: async (ctx, args) => listDocuments(ctx, TABLE_NAME, args),
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => getDocumentOrThrow(ctx, TABLE_NAME, args.id),
});

export const getMany = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, args) => getManyDocuments(ctx, TABLE_NAME, args.ids),
});

export const getManyReference = query({
  args: referenceArgsValidator,
  handler: async (ctx, args) => listReference(ctx, TABLE_NAME, args),
});

export const create = mutation({
  args: {
    data: v.object({
      title: v.string(),
      body: v.string(),
      published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) =>
    createDocument(ctx, TABLE_NAME, {
      ...args.data,
      published: args.data.published ?? false,
    }),
});

export const update = mutation({
  args: {
    id: v.string(),
    data: v.object({
      title: v.string(),
      body: v.string(),
      published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) =>
    updateDocument(ctx, TABLE_NAME, args.id, {
      ...args.data,
      published: args.data.published ?? false,
    }),
});

export const updateMany = mutation({
  args: {
    ids: v.array(v.string()),
    data: v.object({
      title: v.optional(v.string()),
      body: v.optional(v.string()),
      published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) =>
    updateManyDocuments(ctx, TABLE_NAME, args.ids, args.data),
});

export const del = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => deleteDocument(ctx, TABLE_NAME, args.id),
});

export const deleteMany = mutation({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, args) => deleteManyDocuments(ctx, TABLE_NAME, args.ids),
});
