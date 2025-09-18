import { describe, it, expect } from "vitest";
import { users } from "~/server/db/schema";

describe("Database Migrations", () => {
  it("defines required columns for users table", () => {
    expect(users.id.primary).toBe(true);
    expect(users.email.notNull).toBe(true);
    expect(users.password.notNull).toBe(true);
  });

  it("enforces unique email constraint", () => {
    expect(users.email.isUnique).toBe(true);
  });

  it("applies sensible default values", () => {
    expect(users.role.default).toBe("viewer");
    expect(users.is_active.default).toBe(true);
  });

  it("configures auditing timestamps with defaults", () => {
    expect(users.created_at.hasDefault).toBe(true);
    expect(users.updated_at.hasDefault).toBe(true);
  });

  it("generates secure identifiers and stores bcrypt hashes", () => {
    expect(typeof users.id.defaultFn).toBe("function");
    expect(typeof users.updated_at.onUpdateFn).toBe("function");
    expect(users.password.length).toBeGreaterThanOrEqual(60);
  });

  it("exposes optional metadata columns", () => {
    expect(users.image).toBeDefined();
    expect(users.emailVerified).toBeDefined();
  });
});
