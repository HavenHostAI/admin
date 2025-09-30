"use node";
import type { Adapter, Where } from "better-auth";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";

const DATE_FIELDS: Record<string, Set<string>> = {
  user: new Set(["createdAt", "updatedAt"]),
  users: new Set(["createdAt", "updatedAt"]),
  session: new Set(["createdAt", "updatedAt", "expiresAt"]),
  sessions: new Set(["createdAt", "updatedAt", "expiresAt"]),
  authSessions: new Set(["createdAt", "updatedAt", "expiresAt"]),
  account: new Set([
    "createdAt",
    "updatedAt",
    "accessTokenExpiresAt",
    "refreshTokenExpiresAt",
  ]),
  accounts: new Set([
    "createdAt",
    "updatedAt",
    "accessTokenExpiresAt",
    "refreshTokenExpiresAt",
  ]),
  authAccounts: new Set([
    "createdAt",
    "updatedAt",
    "accessTokenExpiresAt",
    "refreshTokenExpiresAt",
  ]),
  verification: new Set(["createdAt", "updatedAt", "expiresAt"]),
  verifications: new Set(["createdAt", "updatedAt", "expiresAt"]),
  authVerifications: new Set(["createdAt", "updatedAt", "expiresAt"]),
  companyInvitations: new Set(["createdAt", "expiresAt"]),
  invitation: new Set(["createdAt", "expiresAt"]),
  invitations: new Set(["createdAt", "expiresAt"]),
};

type StoredDoc = Record<string, unknown> & { _id: string };

const generateRandomId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};

const ensureAdapterId = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : generateRandomId();

export const convertToStorage = (
  model: string,
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const dateFields = DATE_FIELDS[model] ?? new Set<string>();
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === "id") {
      result.id = ensureAdapterId(value);
      continue;
    }
    if (dateFields.has(key)) {
      if (value instanceof Date) {
        result[key] = value.valueOf();
      } else if (typeof value === "number") {
        result[key] = value;
      } else if (typeof value === "string") {
        const parsed = new Date(value);
        result[key] = parsed.valueOf();
      } else {
        result[key] = value;
      }
      continue;
    }
    result[key] = value;
  }
  if (!("id" in result)) {
    result.id = ensureAdapterId(undefined);
  }
  return result;
};

export const convertFromStorage = (
  model: string,
  doc: Record<string, unknown>,
): Record<string, unknown> => {
  const dateFields = DATE_FIELDS[model] ?? new Set<string>();
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key === "_id") continue;
    if (dateFields.has(key) && typeof value === "number") {
      result[key] = new Date(value);
    } else {
      result[key] = value;
    }
  }
  if (!("id" in result)) {
    result.id = ensureAdapterId(undefined);
  }
  return result;
};

const normalizeWhereValue = (value: Where["value"]) => {
  if (value instanceof Date) return value.valueOf();
  return value;
};

const compare = (
  fieldValue: unknown,
  operator: NonNullable<Where["operator"]> | "eq",
  compareValue: unknown,
) => {
  switch (operator) {
    case "eq":
      return fieldValue === compareValue;
    case "ne":
      return (
        fieldValue !== undefined &&
        compareValue !== undefined &&
        fieldValue !== compareValue
      );
    case "lt":
      return typeof fieldValue === "number" && typeof compareValue === "number"
        ? fieldValue < compareValue
        : typeof fieldValue === "string" && typeof compareValue === "string"
          ? fieldValue < compareValue
          : false;
    case "lte":
      return typeof fieldValue === "number" && typeof compareValue === "number"
        ? fieldValue <= compareValue
        : typeof fieldValue === "string" && typeof compareValue === "string"
          ? fieldValue <= compareValue
          : false;
    case "gt":
      return typeof fieldValue === "number" && typeof compareValue === "number"
        ? fieldValue > compareValue
        : typeof fieldValue === "string" && typeof compareValue === "string"
          ? fieldValue > compareValue
          : false;
    case "gte":
      return (
        (typeof fieldValue === "number" &&
          typeof compareValue === "number" &&
          fieldValue >= compareValue) ||
        (typeof fieldValue === "string" &&
          typeof compareValue === "string" &&
          fieldValue >= compareValue)
      );
    case "in":
      return Array.isArray(compareValue)
        ? compareValue.includes(fieldValue)
        : false;
    case "not_in":
      return Array.isArray(compareValue)
        ? !compareValue.includes(fieldValue)
        : true;
    case "contains":
      return typeof fieldValue === "string" && typeof compareValue === "string"
        ? fieldValue.includes(compareValue)
        : false;
    case "starts_with":
      return typeof fieldValue === "string" && typeof compareValue === "string"
        ? fieldValue.startsWith(compareValue)
        : false;
    case "ends_with":
      return typeof fieldValue === "string" && typeof compareValue === "string"
        ? fieldValue.endsWith(compareValue)
        : false;
    default:
      return fieldValue === compareValue;
  }
};

const matchesWhere = (
  model: string,
  doc: Record<string, unknown>,
  where: Where[] = [],
) => {
  if (!where?.length) return true;
  const normalizedDoc = convertFromStorage(model, doc);
  let accumulator = true;
  let connector: "AND" | "OR" = "AND";
  for (const condition of where) {
    const op = condition.operator ?? "eq";
    const value = normalizedDoc[condition.field];
    const targetValue = normalizeWhereValue(condition.value);
    const candidate = compare(
      value instanceof Date ? value.valueOf() : value,
      op,
      targetValue instanceof Date ? targetValue.valueOf() : targetValue,
    );
    if (connector === "AND") {
      accumulator = accumulator && candidate;
    } else {
      accumulator = accumulator || candidate;
    }
    connector = condition.connector ?? "AND";
  }
  return accumulator;
};

const sortDocuments = (
  model: string,
  docs: StoredDoc[],
  sortBy?: { field: string; direction: "asc" | "desc" },
) => {
  if (!sortBy) return docs;
  const { field, direction } = sortBy;
  const factor = direction === "asc" ? 1 : -1;
  return [...docs].sort((a, b) => {
    const docA = convertFromStorage(model, a);
    const docB = convertFromStorage(model, b);
    const aValue = docA[field];
    const bValue = docB[field];
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return -1 * factor;
    if (bValue == null) return factor;
    const baseA = aValue instanceof Date ? aValue.valueOf() : aValue;
    const baseB = bValue instanceof Date ? bValue.valueOf() : bValue;
    if (baseA < baseB) return -1 * factor;
    if (baseA > baseB) return 1 * factor;
    return 0;
  });
};

const filterDocs = (model: string, docs: StoredDoc[], where?: Where[]) => {
  if (!where?.length) return docs;
  return docs.filter((doc) => matchesWhere(model, doc, where));
};

const applyUpdate = (
  doc: StoredDoc,
  update: Partial<StoredDoc>,
): StoredDoc => ({
  ...doc,
  ...update,
});

export const createConvexAdapter = (ctx: ActionCtx): Adapter => {
  const modelToTable = (model: string) =>
    model as keyof typeof DATE_FIELDS | string;

  const fetchAllDocs = async (table: string) =>
    (await ctx.runQuery(internal.authStore.getAll, { table })) as StoredDoc[];

  const insertDoc = async (table: string, doc: Record<string, unknown>) =>
    (await ctx.runMutation(internal.authStore.insert, {
      table,
      doc,
    })) as StoredDoc;

  const patchDoc = async (
    table: string,
    docId: string,
    patch: Record<string, unknown>,
  ) =>
    (await ctx.runMutation(internal.authStore.patch, {
      table,
      documentId: docId,
      patch,
    })) as StoredDoc;

  const deleteDoc = async (table: string, docId: string) => {
    await ctx.runMutation(internal.authStore.remove, {
      table,
      documentId: docId,
    });
  };

  const adapter = {
    id: "convex",
    async create({
      model,
      data,
    }: {
      model: string;
      data: Record<string, unknown>;
    }) {
      const table = modelToTable(model);
      const storage = convertToStorage(table, data);
      const inserted: StoredDoc = await insertDoc(table, storage);
      return convertFromStorage(table, inserted);
    },
    async findOne({ model, where }: { model: string; where?: Where[] }) {
      const table = modelToTable(model);
      const docs = await fetchAllDocs(table);
      const match = filterDocs(table, docs, where)[0];
      return match ? convertFromStorage(table, match) : null;
    },
    async findMany({ model, where, limit, sortBy, offset }) {
      const table = modelToTable(model);
      let docs = await fetchAllDocs(table);
      docs = filterDocs(table, docs, where);
      docs = sortDocuments(table, docs, sortBy);
      if (offset) docs = docs.slice(offset);
      if (limit != null) docs = docs.slice(0, limit);
      return docs.map((doc) => convertFromStorage(table, doc)) as Record<
        string,
        unknown
      >[];
    },
    async count({ model, where }) {
      const table = modelToTable(model);
      const docs = await fetchAllDocs(table);
      return filterDocs(table, docs, where).length;
    },
    async update({ model, where, update }) {
      const table = modelToTable(model);
      const docs = await fetchAllDocs(table);
      const matches = filterDocs(table, docs, where);
      if (!matches.length) return null;
      const storageUpdate = convertToStorage(
        table,
        update as Record<string, unknown>,
      );
      delete (storageUpdate as Record<string, unknown>).id;
      let updatedDoc: Record<string, unknown> | null = null;
      for (const doc of matches) {
        const merged = applyUpdate(doc, storageUpdate);
        await patchDoc(table, doc._id, storageUpdate);
        if (!updatedDoc) {
          updatedDoc = merged;
        }
      }
      return updatedDoc
        ? (convertFromStorage(table, updatedDoc) as Record<string, unknown>)
        : null;
    },
    async updateMany({ model, where, update }) {
      const table = modelToTable(model);
      const docs = await fetchAllDocs(table);
      const matches = filterDocs(table, docs, where);
      if (!matches.length) return 0;
      const storageUpdate = convertToStorage(
        table,
        update as Record<string, unknown>,
      );
      delete (storageUpdate as Record<string, unknown>).id;
      for (const doc of matches) {
        await patchDoc(table, doc._id, storageUpdate);
      }
      return matches.length;
    },
    async delete({ model, where }) {
      const table = modelToTable(model);
      const docs = await fetchAllDocs(table);
      const matches = filterDocs(table, docs, where);
      if (!matches.length) return;
      for (const doc of matches) {
        await deleteDoc(table, doc._id);
      }
    },
    async deleteMany({ model, where }) {
      const table = modelToTable(model);
      const docs = await fetchAllDocs(table);
      const matches = filterDocs(table, docs, where);
      for (const doc of matches) {
        await deleteDoc(table, doc._id);
      }
      return matches.length;
    },
    async transaction(callback) {
      const { transaction: _ignored, ...rest } = adapter;
      return callback(rest);
    },
  } as Adapter;

  return adapter;
};
