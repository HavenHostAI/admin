import { describe, it, expect } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Create test database connection
const testConn = postgres(
  process.env.DATABASE_URL ||
    "postgresql://postgres:wE7kifrgZfUy1Mpd@localhost:5432/admin",
);
const testDb = drizzle(testConn);

describe("Database Migrations", () => {
  it("should be able to create a user with all required fields", async () => {
    const hashedPassword = await bcrypt.hash("testpassword123", 12);

    const testUser = {
      email: "migration-test@example.com",
      name: "Migration Test User",
      password: hashedPassword,
      role: "admin",
      is_active: true,
    };

    // This test will fail if the database schema is not up to date
    const [insertedUser] = await testDb
      .insert(users)
      .values(testUser)
      .returning();

    expect(insertedUser).toBeDefined();
    expect(insertedUser.email).toBe(testUser.email);
    expect(insertedUser.name).toBe(testUser.name);
    expect(insertedUser.role).toBe(testUser.role);
    expect(insertedUser.is_active).toBe(testUser.is_active);
    expect(insertedUser.created_at).toBeDefined();
    expect(insertedUser.updated_at).toBeDefined();

    // Clean up
    await testDb.delete(users).where(eq(users.id, insertedUser.id));
  });

  it("should handle user creation with minimal required fields", async () => {
    const hashedPassword = await bcrypt.hash("testpassword123", 12);

    const testUser = {
      email: "minimal-test@example.com",
      name: "Minimal Test User",
      password: hashedPassword,
    };

    const [insertedUser] = await testDb
      .insert(users)
      .values(testUser)
      .returning();

    expect(insertedUser).toBeDefined();
    expect(insertedUser.email).toBe(testUser.email);
    expect(insertedUser.name).toBe(testUser.name);
    expect(insertedUser.role).toBe("viewer"); // Default value
    expect(insertedUser.is_active).toBe(true); // Default value

    // Clean up
    await testDb.delete(users).where(eq(users.id, insertedUser.id));
  });

  it("should enforce unique email constraint", async () => {
    const hashedPassword = await bcrypt.hash("testpassword123", 12);
    const email = "unique-test@example.com";

    const testUser = {
      email,
      name: "Unique Test User",
      password: hashedPassword,
    };

    // Insert first user
    const [firstUser] = await testDb.insert(users).values(testUser).returning();

    expect(firstUser).toBeDefined();

    // Try to insert second user with same email - should fail
    await expect(
      testDb
        .insert(users)
        .values({
          ...testUser,
          name: "Another User",
        })
        .returning(),
    ).rejects.toThrow();

    // Clean up
    await testDb.delete(users).where(eq(users.id, firstUser.id));
  });

  it("should handle password hashing correctly", async () => {
    const plainPassword = "testpassword123";
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const testUser = {
      email: "password-test@example.com",
      name: "Password Test User",
      password: hashedPassword,
    };

    const [insertedUser] = await testDb
      .insert(users)
      .values(testUser)
      .returning();

    // Verify password is hashed (not plain text)
    expect(insertedUser.password).not.toBe(plainPassword);
    expect(insertedUser.password).toBe(hashedPassword);

    // Verify we can check the password
    const isValidPassword = await bcrypt.compare(
      plainPassword,
      insertedUser.password,
    );
    expect(isValidPassword).toBe(true);

    // Clean up
    await testDb.delete(users).where(eq(users.id, insertedUser.id));
  });
});
