import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Create test database connection
const testConn = postgres(
  process.env.DATABASE_URL ||
    "postgresql://postgres:wE7kifrgZfUy1Mpd@localhost:5432/admin",
);
const testDb = drizzle(testConn);

describe("Database Schema Validation", () => {
  beforeAll(async () => {
    // Ensure database is connected and schema is up to date
  });

  afterAll(async () => {
    // Clean up any test data if needed
  });

  describe("Users table", () => {
    it("should have all required columns", async () => {
      // Test that we can query the users table structure
      // This will fail if the role column doesn't exist
      const result = await testDb
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          password: users.password,
          role: users.role,
          is_active: users.is_active,
          emailVerified: users.emailVerified,
          image: users.image,
          created_at: users.created_at,
          updated_at: users.updated_at,
        })
        .from(users)
        .limit(1);

      // If this query succeeds, all columns exist
      expect(result).toBeDefined();
    });

    it("should allow inserting a user with role", async () => {
      const testUser = {
        email: "test@example.com",
        name: "Test User",
        password: "hashedpassword",
        role: "viewer",
        is_active: true,
      };

      // This will fail if the role column doesn't exist
      const [insertedUser] = await testDb
        .insert(users)
        .values(testUser)
        .returning();

      expect(insertedUser).toBeDefined();
      expect(insertedUser.role).toBe("viewer");

      // Clean up
      await testDb.delete(users).where(eq(users.id, insertedUser.id));
    });

    it("should have proper default values", async () => {
      const testUser = {
        email: "test2@example.com",
        name: "Test User 2",
        password: "hashedpassword",
      };

      const [insertedUser] = await testDb
        .insert(users)
        .values(testUser)
        .returning();

      expect(insertedUser.role).toBe("viewer"); // Default role
      expect(insertedUser.is_active).toBe(true); // Default is_active

      // Clean up
      await testDb.delete(users).where(eq(users.id, insertedUser.id));
    });
  });

  describe("Roles table", () => {
    it("should have all required columns", async () => {
      const result = await testDb
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          is_system: roles.is_system,
          created_at: roles.created_at,
          updated_at: roles.updated_at,
        })
        .from(roles)
        .limit(1);

      expect(result).toBeDefined();
    });
  });

  describe("Permissions table", () => {
    it("should have all required columns", async () => {
      const result = await testDb
        .select({
          id: permissions.id,
          name: permissions.name,
          resource: permissions.resource,
          action: permissions.action,
          description: permissions.description,
          created_at: permissions.created_at,
        })
        .from(permissions)
        .limit(1);

      expect(result).toBeDefined();
    });
  });

  describe("User-Role relationships", () => {
    it("should allow creating user-role relationships", async () => {
      // Create a test user
      const [testUser] = await testDb
        .insert(users)
        .values({
          email: "test3@example.com",
          name: "Test User 3",
          password: "hashedpassword",
        })
        .returning();

      // Create a test role
      const [testRole] = await testDb
        .insert(roles)
        .values({
          name: "test-role",
          description: "Test role for testing",
        })
        .returning();

      // Create user-role relationship
      const [userRole] = await testDb
        .insert(userRoles)
        .values({
          user_id: testUser.id,
          role_id: testRole.id,
        })
        .returning();

      expect(userRole).toBeDefined();
      expect(userRole.user_id).toBe(testUser.id);
      expect(userRole.role_id).toBe(testRole.id);

      // Clean up
      await testDb.delete(userRoles).where(eq(userRoles.user_id, testUser.id));
      await testDb.delete(users).where(eq(users.id, testUser.id));
      await testDb.delete(roles).where(eq(roles.id, testRole.id));
    });
  });
});
