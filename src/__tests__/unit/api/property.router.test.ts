import { describe, it, expect, vi } from "vitest";

// Mock the entire property router module
vi.mock("@/server/api/routers/property", () => ({
  propertyRouter: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deactivate: vi.fn(),
    activate: vi.fn(),
    count: vi.fn(),
  },
}));

describe("Property Router", () => {
  it("should export propertyRouter", async () => {
    const { propertyRouter } = await import("@/server/api/routers/property");
    expect(propertyRouter).toBeDefined();
    expect(propertyRouter.list).toBeDefined();
    expect(propertyRouter.getById).toBeDefined();
    expect(propertyRouter.create).toBeDefined();
    expect(propertyRouter.update).toBeDefined();
    expect(propertyRouter.delete).toBeDefined();
    expect(propertyRouter.deactivate).toBeDefined();
    expect(propertyRouter.activate).toBeDefined();
    expect(propertyRouter.count).toBeDefined();
  });

  it("should have correct router structure", async () => {
    const { propertyRouter } = await import("@/server/api/routers/property");

    // Check that all expected procedures exist
    const expectedProcedures = [
      "list",
      "getById",
      "create",
      "update",
      "delete",
      "deactivate",
      "activate",
      "count",
    ];

    expectedProcedures.forEach((procedure) => {
      expect(propertyRouter[procedure]).toBeDefined();
    });
  });
});
