import { describe, it, expect } from "vitest";
import {
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
} from "~/server/db/schema";

const getColumns = (table: unknown) => {
  const symbol = Object.getOwnPropertySymbols(table as object).find((sym) =>
    sym.toString().includes("Columns"),
  );
  return symbol ? (table as any)[symbol] : {};
};

const getForeignTableNames = (table: unknown) => {
  const fkSymbol = Object.getOwnPropertySymbols(table as object).find((sym) =>
    sym.toString().includes("PgInlineForeignKeys"),
  );
  if (!fkSymbol) return [] as string[];

  const inlineForeignKeys = (table as any)[fkSymbol] as Array<any>;
  return inlineForeignKeys.map((fk) => {
    const { foreignTable } = fk.reference();
    const nameSymbol = Object.getOwnPropertySymbols(foreignTable).find((sym) =>
      sym.toString().includes("Name"),
    );
    return nameSymbol ? foreignTable[nameSymbol] : "";
  });
};

describe("Database Schema Validation", () => {
  describe("Users table", () => {
    it("includes expected columns", () => {
      const columnKeys = Object.keys(getColumns(users));

      expect(columnKeys).toEqual(
        expect.arrayContaining([
          "id",
          "email",
          "password",
          "role",
          "is_active",
          "created_at",
          "updated_at",
        ]),
      );
    });

    it("sets defaults and constraints", () => {
      expect(users.role.default).toBe("viewer");
      expect(users.is_active.default).toBe(true);
      expect(users.email.isUnique).toBe(true);
    });
  });

  describe("Roles table", () => {
    it("includes expected columns", () => {
      const columnKeys = Object.keys(getColumns(roles));

      expect(columnKeys).toEqual(
        expect.arrayContaining(["id", "name", "description", "is_system"]),
      );
    });

    it("exposes timestamps with defaults", () => {
      expect(roles.created_at.hasDefault).toBe(true);
      expect(roles.updated_at.hasDefault).toBe(true);
    });
  });

  describe("Permissions table", () => {
    it("includes expected columns", () => {
      const columnKeys = Object.keys(getColumns(permissions));

      expect(columnKeys).toEqual(
        expect.arrayContaining([
          "id",
          "name",
          "resource",
          "action",
          "description",
        ]),
      );
    });
  });

  describe("User-Role relationships", () => {
    it("enforces foreign key constraints", () => {
      const fkTargets = getForeignTableNames(userRoles);

      expect(fkTargets).toEqual(
        expect.arrayContaining(["admin_user", "admin_role"]),
      );
    });
  });

  describe("Role-Permission relationships", () => {
    it("enforces foreign key constraints", () => {
      const fkTargets = getForeignTableNames(rolePermissions);

      expect(fkTargets).toEqual(
        expect.arrayContaining(["admin_role", "admin_permission"]),
      );
    });
  });
});
