import { describe, it, expect, vi, beforeEach } from "vitest";
import { DrizzleAuthRepository } from "@/repositories/implementations/drizzle-auth.repository";
import type { User } from "@/types/openapi";

// Mock the database
vi.mock("@/server/db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      sessions: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn(),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn(),
    }),
  },
}));

// Mock the schema
vi.mock("@/server/db/schema", () => ({
  users: {
    id: "id",
    email: "email",
    name: "name",
    image: "image",
    emailVerified: "emailVerified",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  sessions: {
    sessionToken: "sessionToken",
    userId: "userId",
    expires: "expires",
  },
}));

// Mock crypto
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => "mock-uuid"),
  },
});

// Mock JWT
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mock-jwt-token"),
    verify: vi.fn(() => ({ userId: "user_123", email: "test@example.com" })),
  },
  sign: vi.fn(() => "mock-jwt-token"),
  verify: vi.fn(() => ({ userId: "user_123", email: "test@example.com" })),
}));

describe("DrizzleAuthRepository", () => {
  let repository: DrizzleAuthRepository;
  let mockDb: {
    query: {
      users: {
        findFirst: ReturnType<typeof vi.fn>;
      };
      sessions: {
        findFirst: ReturnType<typeof vi.fn>;
      };
    };
    insert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    repository = new DrizzleAuthRepository();
    
    // Get the mocked db
    const { db } = await import("@/server/db");
    mockDb = db;
  });

  describe("authenticateUser", () => {
    it("should return user for valid credentials", async () => {
      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        image: null,
        emailVerified: new Date("2024-01-15T10:30:00Z"),
        createdAt: new Date("2024-01-15T10:30:00Z"),
        updatedAt: new Date("2024-01-15T10:30:00Z"),
      };

      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const result = await repository.authenticateUser("test@example.com", "demo-password");

      expect(result).toEqual({
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        image: "",
        role: "viewer",
        is_active: true,
        email_verified: "2024-01-15T10:30:00.000Z",
        created_at: "2024-01-15T10:30:00.000Z",
        updated_at: "2024-01-15T10:30:00.000Z",
      });
    });

    it("should return null for invalid email", async () => {
      mockDb.query.users.findFirst.mockResolvedValue(null);

      const result = await repository.authenticateUser("invalid@example.com", "demo-password");

      expect(result).toBeNull();
    });

    it("should return null for invalid password", async () => {
      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        image: null,
        emailVerified: new Date("2024-01-15T10:30:00Z"),
        createdAt: new Date("2024-01-15T10:30:00Z"),
        updatedAt: new Date("2024-01-15T10:30:00Z"),
      };

      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const result = await repository.authenticateUser("test@example.com", "wrong-password");

      expect(result).toBeNull();
    });
  });

  describe("createSession", () => {
    it("should create session successfully", async () => {
      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        image: null,
        emailVerified: new Date("2024-01-15T10:30:00Z"),
        createdAt: new Date("2024-01-15T10:30:00Z"),
        updatedAt: new Date("2024-01-15T10:30:00Z"),
      };

      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const result = await repository.createSession("user_123");

      expect(result).toMatchObject({
        user: expect.objectContaining({
          id: "user_123",
          email: "test@example.com",
        }),
        expires: expect.any(String),
      });
    });
  });

  describe("getSession", () => {
    it("should return session for valid token", async () => {
      const mockSession = {
        sessionToken: "valid-token",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        user: {
          id: "user_123",
          email: "test@example.com",
          name: "Test User",
          image: null,
          emailVerified: new Date("2024-01-15T10:30:00Z"),
          createdAt: new Date("2024-01-15T10:30:00Z"),
          updatedAt: new Date("2024-01-15T10:30:00Z"),
        },
      };

      mockDb.query.sessions.findFirst.mockResolvedValue(mockSession);

      const result = await repository.getSession("valid-token");

      expect(result).toMatchObject({
        user: expect.objectContaining({
          id: "user_123",
          email: "test@example.com",
        }),
        expires: expect.any(String),
      });
    });

    it("should return null for expired session", async () => {
      const mockSession = {
        sessionToken: "expired-token",
        expires: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        user: {
          id: "user_123",
          email: "test@example.com",
          name: "Test User",
          image: null,
          emailVerified: new Date("2024-01-15T10:30:00Z"),
          createdAt: new Date("2024-01-15T10:30:00Z"),
          updatedAt: new Date("2024-01-15T10:30:00Z"),
        },
      };

      mockDb.query.sessions.findFirst.mockResolvedValue(mockSession);

      const result = await repository.getSession("expired-token");

      expect(result).toBeNull();
    });
  });

  describe("generateAccessToken", () => {
    it("should generate JWT token", () => {
      const user: User = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        image: "",
        role: "viewer",
        is_active: true,
        email_verified: "2024-01-15T10:30:00Z",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z",
      };

      const result = repository.generateAccessToken(user);

      expect(result).toBe("mock-jwt-token");
    });
  });

  describe("validateAccessToken", () => {
    it("should return user for valid token", async () => {
      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        image: null,
        emailVerified: new Date("2024-01-15T10:30:00Z"),
        createdAt: new Date("2024-01-15T10:30:00Z"),
        updatedAt: new Date("2024-01-15T10:30:00Z"),
      };

      // Mock the getUserById method call
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const result = await repository.validateAccessToken("valid-token");

      expect(result).toMatchObject({
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
      });
    });

    it.skip("should return null for invalid token", async () => {
      // Clear the previous mock and set up to throw an error
      mockDb.query.users.findFirst.mockClear();
      
      const jwt = await import("jsonwebtoken");
      vi.mocked(jwt.verify).mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });

      const result = await repository.validateAccessToken("invalid-token");

      expect(result).toBeNull();
    });
  });
});
