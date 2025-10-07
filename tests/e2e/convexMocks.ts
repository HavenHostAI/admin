import { expect, type Page } from "@playwright/test";

import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";
import {
  setupConvexMocks as baseSetupConvexMocks,
  type ConvexMocks as BaseConvexMocks,
  type QueryHandler,
  type SetupConvexMocksOptions,
} from "./utils/convexMocks";

export type AdminListResult = {
  data: Array<Record<string, unknown>>;
  total?: number;
};

type AdminTableState = {
  rows: AdminListResult["data"];
  total: number;
  byId: Map<string, Record<string, unknown>>;
};

export type ConvexMocks = BaseConvexMocks & {
  setAdminListResponse: (table: string, response: AdminListResult) => void;
};

const getRecordIdentifier = (record: Record<string, unknown>) => {
  const rawId =
    (record as { _id?: unknown })._id ?? (record as { id?: unknown }).id;
  if (typeof rawId === "string" || typeof rawId === "number") {
    return String(rawId);
  }
  return null;
};

const cloneRow = (row: Record<string, unknown>) => ({ ...row });

const wrapQueryHandler = (
  path: string,
  fallback: QueryHandler,
  userHandlers: Record<string, QueryHandler> | undefined,
): QueryHandler => {
  const userHandler = userHandlers?.[path];
  if (!userHandler) {
    return fallback;
  }
  return async (args) => {
    const result = await userHandler(args);
    if (typeof result !== "undefined") {
      return result;
    }
    return fallback(args);
  };
};

export const setupConvexMocks = async (
  page: Page,
  options: SetupConvexMocksOptions = {},
): Promise<ConvexMocks> => {
  const adminTables = new Map<string, AdminTableState>();

  const userQueryHandlers = options.queryHandlers ?? {};

  const getAdminTable = (tableName: unknown) => {
    if (typeof tableName !== "string") {
      return null;
    }
    return adminTables.get(tableName) ?? null;
  };

  const adminQueryHandlers: Record<string, QueryHandler> = {
    "admin:list": wrapQueryHandler(
      "admin:list",
      (args) => {
        const table = getAdminTable(args.table);
        if (!table) {
          return { data: [], total: 0 };
        }
        return {
          data: table.rows.map(cloneRow),
          total: table.total,
        };
      },
      userQueryHandlers,
    ),
    "admin:get": wrapQueryHandler(
      "admin:get",
      (args) => {
        const table = getAdminTable(args.table);
        const id = args.id;
        if (!table || (typeof id !== "string" && typeof id !== "number")) {
          return null;
        }
        return table.byId.get(String(id)) ?? null;
      },
      userQueryHandlers,
    ),
    "admin:getMany": wrapQueryHandler(
      "admin:getMany",
      (args) => {
        const table = getAdminTable(args.table);
        const ids = args.ids;
        if (!table || !Array.isArray(ids)) {
          return [];
        }
        return ids
          .map((value) => table.byId.get(String(value)))
          .filter((value): value is Record<string, unknown> => !!value)
          .map(cloneRow);
      },
      userQueryHandlers,
    ),
    "admin:getManyReference": wrapQueryHandler(
      "admin:getManyReference",
      (args) => {
        const table = getAdminTable(args.table);
        const target = args.target;
        const id = args.id;
        if (
          !table ||
          typeof target !== "string" ||
          (typeof id !== "string" && typeof id !== "number")
        ) {
          return { data: [], total: 0 };
        }
        const matches = table.rows.filter((row) => {
          const value = (row as Record<string, unknown>)[target];
          return String(value) === String(id);
        });
        return { data: matches.map(cloneRow), total: matches.length };
      },
      userQueryHandlers,
    ),
  };

  const mocks = await baseSetupConvexMocks(page, {
    ...options,
    queryHandlers: {
      ...userQueryHandlers,
      ...adminQueryHandlers,
    },
  });

  const setAdminListResponse: ConvexMocks["setAdminListResponse"] = (
    table,
    response,
  ) => {
    const rows = response.data.map(cloneRow);
    const byId = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const id = getRecordIdentifier(row);
      if (id) {
        byId.set(id, row);
      }
    }
    adminTables.set(table, {
      rows,
      total: response.total ?? rows.length,
      byId,
    });
  };

  return {
    ...mocks,
    setAdminListResponse,
  };
};

export const pollForStoredToken = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        (key) => window.localStorage.getItem(key),
        TOKEN_STORAGE_KEY,
      ),
    )
    .toBe("test-session-token");

export type { SetupConvexMocksOptions } from "./utils/convexMocks";
