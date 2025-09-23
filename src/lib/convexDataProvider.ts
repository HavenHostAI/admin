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
  type UpdateManyParams,
  type UpdateManyResult,
  type UpdateParams,
  type UpdateResult,
} from "ra-core";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const resourceOperations = {
  posts: {
    list: api.posts.list,
    get: api.posts.get,
    getMany: api.posts.getMany,
    getManyReference: api.posts.getManyReference,
    create: api.posts.create,
    update: api.posts.update,
    updateMany: api.posts.updateMany,
    deleteOne: api.posts.del,
    deleteMany: api.posts.deleteMany,
  },
  comments: {
    list: api.comments.list,
    get: api.comments.get,
    getMany: api.comments.getMany,
    getManyReference: api.comments.getManyReference,
    create: api.comments.create,
    update: api.comments.update,
    updateMany: api.comments.updateMany,
    deleteOne: api.comments.del,
    deleteMany: api.comments.deleteMany,
  },
  users: {
    list: api.users.list,
    get: api.users.get,
    getMany: api.users.getMany,
    getManyReference: api.users.getManyReference,
    create: api.users.create,
    update: api.users.update,
    updateMany: api.users.updateMany,
    deleteOne: api.users.del,
    deleteMany: api.users.deleteMany,
  },
} as const;

type ResourceName = keyof typeof resourceOperations;

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
  if (resource in resourceOperations) {
    return resource as ResourceName;
  }
  throw new Error(`Unknown resource "${resource}" for Convex data provider.`);
};

const toIdentifier = (id: Id<any> | string): string => String(id);

const mapDoc = (doc: any) => {
  if (!doc) {
    throw new Error("Convex returned an empty document.");
  }

  const { _id, ...rest } = doc;
  return {
    id: toIdentifier(_id),
    ...rest,
  };
};

const mapDocs = (docs: any[]) => docs.map(mapDoc);

const dataProvider: DataProvider = {
  async getList(resource: string, params: GetListParams): Promise<GetListResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.query(
      resourceOperations[resourceKey].list,
      {
        pagination: params.pagination,
        sort: params.sort,
        filter: params.filter,
      },
    );

    return {
      data: mapDocs(response.data),
      total: response.total,
    };
  },

  async getOne(resource: string, params: GetOneParams): Promise<GetOneResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.query(resourceOperations[resourceKey].get, {
      id: String(params.id),
    });

    return { data: mapDoc(response) };
  },

  async getMany(resource: string, params: GetManyParams): Promise<GetManyResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.query(
      resourceOperations[resourceKey].getMany,
      {
        ids: params.ids.map(String),
      },
    );

    return { data: mapDocs(response) };
  },

  async getManyReference(
    resource: string,
    params: GetManyReferenceParams,
  ): Promise<GetManyReferenceResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.query(
      resourceOperations[resourceKey].getManyReference,
      {
        target: params.target,
        id: String(params.id),
        pagination: params.pagination,
        sort: params.sort,
        filter: params.filter,
      },
    );

    return {
      data: mapDocs(response.data),
      total: response.total,
    };
  },

  async create(resource: string, params: CreateParams): Promise<CreateResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(
      resourceOperations[resourceKey].create,
      {
        data: params.data as any,
      },
    );

    return { data: mapDoc(response) };
  },

  async update(resource: string, params: UpdateParams): Promise<UpdateResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(
      resourceOperations[resourceKey].update,
      {
        id: String(params.id),
        data: params.data as any,
      },
    );

    return { data: mapDoc(response) };
  },

  async updateMany(
    resource: string,
    params: UpdateManyParams,
  ): Promise<UpdateManyResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(
      resourceOperations[resourceKey].updateMany,
      {
        ids: params.ids.map(String),
        data: params.data as any,
      },
    );

    return { data: response.map(toIdentifier) };
  },

  async delete(resource: string, params: DeleteParams): Promise<DeleteResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(
      resourceOperations[resourceKey].deleteOne,
      {
        id: String(params.id),
      },
    );

    return { data: mapDoc(response) };
  },

  async deleteMany(
    resource: string,
    params: DeleteManyParams,
  ): Promise<DeleteManyResult> {
    const resourceKey = assertResourceName(resource);
    const convex = getClient();
    const response = await convex.mutation(
      resourceOperations[resourceKey].deleteMany,
      {
        ids: params.ids.map(String),
      },
    );

    return { data: response.map(toIdentifier) };
  },
};

export default dataProvider;
