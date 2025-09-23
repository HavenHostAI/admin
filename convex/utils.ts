import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id, TableNames } from "./_generated/dataModel";

type ListArgs = {
  pagination?: { page?: number; perPage?: number };
  sort?: { field?: string; order?: "ASC" | "DESC" } | null;
  filter?: Record<string, unknown> | null;
};

type ReferenceArgs = ListArgs & {
  target: string;
  id: string;
};

export const listDocuments = async (
  ctx: QueryCtx,
  table: TableNames,
  args: ListArgs,
) => {
  const { pagination, sort, filter } = args;
  const allDocs = await ctx.db.query(table).collect();
  const filtered = applyFilter(allDocs, filter ?? {});
  const sorted = applySort(filtered, sort);
  const { data, total } = applyPagination(sorted, pagination);

  return { data, total };
};

export const listReference = async (
  ctx: QueryCtx,
  table: TableNames,
  args: ReferenceArgs,
) => {
  const { target, id, ...rest } = args;
  return listDocuments(ctx, table, {
    ...rest,
    filter: {
      ...(rest.filter ?? {}),
      [target]: id,
    },
  });
};

export const getDocumentOrThrow = async (
  ctx: QueryCtx,
  table: TableNames,
  id: string,
) => {
  const convexId = normalizeOrThrow(ctx, table, id);
  const doc = await ctx.db.get(convexId);
  if (!doc) {
    throw new Error(`No ${table} record found for id ${id}`);
  }
  return doc;
};

export const getManyDocuments = async (
  ctx: QueryCtx,
  table: TableNames,
  ids: string[],
) => {
  const records = await Promise.all(
    ids.map(async (rawId) => {
      const convexId = ctx.db.normalizeId(table, rawId);
      if (!convexId) return null;
      return ctx.db.get(convexId);
    }),
  );

  return records.filter((doc): doc is NonNullable<typeof doc> => !!doc);
};

export const createDocument = async (
  ctx: MutationCtx,
  table: TableNames,
  data: Record<string, unknown>,
) => {
  const id = await ctx.db.insert(table, data as any);
  return (await ctx.db.get(id))!;
};

export const updateDocument = async (
  ctx: MutationCtx,
  table: TableNames,
  id: string,
  data: Record<string, unknown>,
) => {
  const convexId = normalizeOrThrow(ctx, table, id);
  await ctx.db.patch(convexId, data as any);
  return (await ctx.db.get(convexId))!;
};

export const deleteDocument = async (
  ctx: MutationCtx,
  table: TableNames,
  id: string,
) => {
  const convexId = normalizeOrThrow(ctx, table, id);
  const existing = await ctx.db.get(convexId);
  if (!existing) {
    throw new Error(`No ${table} record found for id ${id}`);
  }
  await ctx.db.delete(convexId);
  return existing;
};

export const deleteManyDocuments = async (
  ctx: MutationCtx,
  table: TableNames,
  ids: string[],
) => {
  const deletedIds: string[] = [];

  for (const rawId of ids) {
    const convexId = ctx.db.normalizeId(table, rawId);
    if (!convexId) continue;
    const existing = await ctx.db.get(convexId);
    if (!existing) continue;
    await ctx.db.delete(convexId);
    deletedIds.push(rawId);
  }

  return deletedIds;
};

export const updateManyDocuments = async (
  ctx: MutationCtx,
  table: TableNames,
  ids: string[],
  data: Record<string, unknown>,
) => {
  const updatedIds: string[] = [];

  for (const rawId of ids) {
    const convexId = ctx.db.normalizeId(table, rawId);
    if (!convexId) continue;
    await ctx.db.patch(convexId, data as any);
    updatedIds.push(rawId);
  }

  return updatedIds;
};

const applyFilter = (
  records: Array<Record<string, unknown>>,
  filters: Record<string, unknown>,
) => {
  const filterEntries = Object.entries(filters ?? {});
  if (filterEntries.length === 0) return records;

  return records.filter((record) =>
    filterEntries.every(([key, value]) => get(record, key) === value),
  );
};

const applySort = (
  records: Array<Record<string, unknown>>,
  sort?: { field?: string; order?: "ASC" | "DESC" } | null,
) => {
  if (!sort?.field) return records;
  const direction = sort.order === "DESC" ? -1 : 1;
  const field = sort.field;

  return [...records].sort((a, b) => {
    const aValue = get(a, field);
    const bValue = get(b, field);

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return -direction;
    if (bValue == null) return direction;
    if (aValue < bValue) return -direction;
    if (aValue > bValue) return direction;
    return 0;
  });
};

const applyPagination = (
  records: Array<Record<string, unknown>>,
  pagination?: { page?: number; perPage?: number },
) => {
  if (!pagination?.perPage) {
    return {
      data: records,
      total: records.length,
    };
  }

  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const perPage = pagination.perPage;
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    data: records.slice(start, end),
    total: records.length,
  };
};

export const normalizeOrThrow = <TableName extends TableNames>(
  ctx: QueryCtx | MutationCtx,
  table: TableName,
  id: string,
) => {
  const convexId = ctx.db.normalizeId(table, id);
  if (!convexId) {
    throw new Error(`Invalid id ${id} for table ${table}`);
  }
  return convexId as Id<TableName>;
};

const get = (record: Record<string, unknown>, path: string) => {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") {
      return undefined;
    }
    if (Array.isArray(acc)) {
      const index = Number(key);
      if (Number.isNaN(index)) {
        return undefined;
      }
      return (acc as unknown[])[index] as unknown;
    }
    return (acc as Record<string, unknown>)[key];
  }, record);
};

export const listArgsValidator = {
  pagination: v.optional(
    v.object({
      page: v.optional(v.number()),
      perPage: v.optional(v.number()),
    }),
  ),
  sort: v.optional(
    v.object({
      field: v.optional(v.string()),
      order: v.optional(v.union(v.literal("ASC"), v.literal("DESC"))),
    }),
  ),
  filter: v.optional(v.any()),
};

export const referenceArgsValidator = {
  ...listArgsValidator,
  target: v.string(),
  id: v.string(),
};
