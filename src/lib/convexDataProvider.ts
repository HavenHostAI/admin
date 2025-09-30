import {
  type CreateParams,
  type CreateResult,
  type DataProvider,
  type DeleteManyParams,
  type DeleteManyResult,
  type DeleteParams,
  type DeleteResult,
  type GetListParams,
  type GetListResult,
  type GetManyParams,
  type GetManyReferenceParams,
  type GetManyReferenceResult,
  type GetManyResult,
  type GetOneParams,
  type GetOneResult,
  type Identifier,
  type UpdateManyParams,
  type UpdateManyResult,
  type UpdateParams,
  type UpdateResult,
} from "ra-core";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { TableNames } from "../../convex/_generated/dataModel";

const TABLES = [
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
] as const satisfies readonly TableNames[];

type ResourceName = (typeof TABLES)[number];

let client: ConvexHttpClient | null = null;

const getClient = () => {
  if (!client) {
    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      throw new Error(
        "VITE_CONVEX_URL is required to initialise the Convex data provider.",
      );
    }
    client = new ConvexHttpClient(convexUrl);
  }

  return client;
};

const assertResourceName = (resource: string): ResourceName => {
  if ((TABLES as ReadonlyArray<string>).includes(resource)) {
    return resource as ResourceName;
  }

  throw new Error(
    `Unknown resource "${resource}". Expected one of: ${TABLES.join(", ")}`,
  );
};

const toIdentifier = (id: string | Identifier): Identifier =>
  typeof id === "string" ? id : String(id);

const mapDoc = (doc: Record<string, unknown>) => {
  if (!doc) {
    throw new Error("Convex returned an empty document.");
  }

  const { _id, ...rest } = doc;
  return {
    id: toIdentifier(_id as string),
    ...rest,
  };
};

const mapDocs = (docs: Record<string, unknown>[]) => docs.map(mapDoc);

const sanitizeData = (data: Record<string, unknown>) => {
  const { id: _id, _id: __internalId, ...rest } = data;
  return rest;
};

const dataProvider: DataProvider = {
  async getList(
    resource: string,
    params: GetListParams,
  ): Promise<GetListResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.query(api.admin.list, {
      table,
      pagination: params.pagination,
      sort: params.sort,
      filter: params.filter,
    });

    return {
      data: mapDocs(response.data),
      total: response.total,
    };
  },

  async getOne(resource: string, params: GetOneParams): Promise<GetOneResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.query(api.admin.get, {
      table,
      id: String(params.id),
    });

    return { data: mapDoc(response) };
  },

  async getMany(
    resource: string,
    params: GetManyParams,
  ): Promise<GetManyResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.query(api.admin.getMany, {
      table,
      ids: params.ids.map((id) => String(id)),
    });

    return { data: mapDocs(response) };
  },

  async getManyReference(
    resource: string,
    params: GetManyReferenceParams,
  ): Promise<GetManyReferenceResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.query(api.admin.getManyReference, {
      table,
      target: params.target,
      id: String(params.id),
      pagination: params.pagination,
      sort: params.sort,
      filter: params.filter,
    });

    return {
      data: mapDocs(response.data),
      total: response.total,
    };
  },

  async create(resource: string, params: CreateParams): Promise<CreateResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(api.admin.create, {
      table,
      data: sanitizeData(params.data as Record<string, unknown>),
      meta: params.meta,
    });

    return { data: mapDoc(response) };
  },

  async update(resource: string, params: UpdateParams): Promise<UpdateResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(api.admin.update, {
      table,
      id: String(params.id),
      data: sanitizeData(params.data as Record<string, unknown>),
      meta: params.meta,
    });

    return { data: mapDoc(response) };
  },

  async updateMany(
    resource: string,
    params: UpdateManyParams,
  ): Promise<UpdateManyResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(api.admin.updateMany, {
      table,
      ids: params.ids.map((id) => String(id)),
      data: sanitizeData(params.data as Record<string, unknown>),
      meta: params.meta,
    });

    return { data: response.map(toIdentifier) };
  },

  async delete(resource: string, params: DeleteParams): Promise<DeleteResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(api.admin.del, {
      table,
      id: String(params.id),
      meta: params.meta,
      previousData: params.previousData,
    });

    return { data: mapDoc(response) };
  },

  async deleteMany(
    resource: string,
    params: DeleteManyParams,
  ): Promise<DeleteManyResult> {
    const table = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(api.admin.deleteMany, {
      table,
      ids: params.ids.map((id) => String(id)),
      meta: params.meta,
    });

    return { data: response.map(toIdentifier) };
  },
};

export default dataProvider;
