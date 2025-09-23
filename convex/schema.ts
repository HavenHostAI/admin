import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    body: v.string(),
    published: v.optional(v.boolean()),
  }),
  comments: defineTable({
    postId: v.id("posts"),
    author: v.string(),
    body: v.string(),
  }),
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.string(),
  }).index("email", ["email"]),
});
