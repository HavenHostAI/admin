import { describe, it, expect, vi } from "vitest";
import { DrizzlePropertyRepository } from "@/repositories/implementations/drizzle-property.repository";

// Mock the database and schema
vi.mock("@/server/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "test-id" }]),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([{ id: "test-id" }]),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({ id: "test-id" }),
    }),
  },
}));

vi.mock("@/server/db/schema", () => ({
  properties: {
    id: "id",
    name: "name",
    description: "description",
    type: "type",
    status: "status",
    configuration: "configuration",
    owner_id: "owner_id",
    is_active: "is_active",
    created_at: "created_at",
    updated_at: "updated_at",
  },
  users: {
    id: "id",
    name: "name",
    email: "email",
    password: "password",
  },
}));

describe("DrizzlePropertyRepository", () => {
  let repository: DrizzlePropertyRepository;

  beforeEach(() => {
    repository = new DrizzlePropertyRepository();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create repository instance", () => {
      expect(repository).toBeInstanceOf(DrizzlePropertyRepository);
    });
  });

  describe("interface compliance", () => {
    it("should have all required methods", () => {
      expect(typeof repository.findById).toBe("function");
      expect(typeof repository.findByName).toBe("function");
      expect(typeof repository.findAll).toBe("function");
      expect(typeof repository.create).toBe("function");
      expect(typeof repository.update).toBe("function");
      expect(typeof repository.delete).toBe("function");
      expect(typeof repository.count).toBe("function");
    });
  });

  describe("method signatures", () => {
    it("should accept correct parameters for findById", async () => {
      // This test ensures the method signature is correct
      await expect(repository.findById("test-id")).resolves.toBeDefined();
    });

    it("should accept correct parameters for findByName", async () => {
      await expect(repository.findByName("test-name")).resolves.toBeDefined();
    });

    it("should accept correct parameters for findAll", async () => {
      await expect(
        repository.findAll({ page: 1, limit: 10 }),
      ).resolves.toBeDefined();
    });

    it("should accept correct parameters for create", async () => {
      const propertyData = {
        name: "Test Server",
        type: "server" as const,
        status: "active" as const,
      };
      await expect(repository.create(propertyData)).resolves.toBeDefined();
    });

    it("should accept correct parameters for update", async () => {
      const updateData = {
        name: "Updated Server",
      };
      await expect(
        repository.update("test-id", updateData),
      ).resolves.toBeDefined();
    });

    it("should accept correct parameters for delete", async () => {
      await expect(repository.delete("test-id")).resolves.toBeUndefined();
    });

    it("should accept correct parameters for count", async () => {
      await expect(repository.count({ type: "server" })).resolves.toBeDefined();
    });
  });
});
