import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyService } from "@/services/property.service";
import type { PropertyRepository } from "@/repositories/interfaces/property.repository";

describe("PropertyService", () => {
  let propertyService: PropertyService;
  let mockPropertyRepository: PropertyRepository;

  beforeEach(() => {
    mockPropertyRepository = {
      findById: vi.fn(),
      findByName: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };
    propertyService = new PropertyService(mockPropertyRepository);
  });

  describe("getPropertyById", () => {
    it("should return property when found", async () => {
      const mockProperty = {
        id: "prop_123",
        name: "Test Server",
        description: "Test description",
        type: "server" as const,
        status: "active" as const,
        configuration: { cpu: "4 cores" },
        owner_id: "user_123",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        mockProperty,
      );

      const result = await propertyService.getPropertyById("prop_123");

      expect(mockPropertyRepository.findById).toHaveBeenCalledWith("prop_123");
      expect(result).toEqual(mockProperty);
    });

    it("should return null when property not found", async () => {
      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(null);

      const result = await propertyService.getPropertyById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getPropertyByName", () => {
    it("should return property when found by name", async () => {
      const mockProperty = {
        id: "prop_123",
        name: "Test Server",
        description: "Test description",
        type: "server" as const,
        status: "active" as const,
        configuration: { cpu: "4 cores" },
        owner_id: "user_123",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(
        mockProperty,
      );

      const result = await propertyService.getPropertyByName("Test Server");

      expect(mockPropertyRepository.findByName).toHaveBeenCalledWith(
        "Test Server",
      );
      expect(result).toEqual(mockProperty);
    });
  });

  describe("listProperties", () => {
    it("should return properties list with pagination", async () => {
      const mockResult = {
        properties: [
          {
            id: "prop_123",
            name: "Test Server",
            description: "Test description",
            type: "server" as const,
            status: "active" as const,
            configuration: { cpu: "4 cores" },
            owner_id: "user_123",
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      };

      vi.mocked(mockPropertyRepository.findAll).mockResolvedValue(mockResult);

      const result = await propertyService.listProperties({
        page: 1,
        limit: 20,
      });

      expect(mockPropertyRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("createProperty", () => {
    it("should create property successfully", async () => {
      const createData = {
        name: "New Server",
        description: "New server description",
        type: "server" as const,
        status: "active" as const,
        configuration: { cpu: "2 cores" },
        owner_id: "user_123",
      };

      const createdProperty = {
        id: "prop_456",
        ...createData,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockPropertyRepository.create).mockResolvedValue(
        createdProperty,
      );

      const result = await propertyService.createProperty(createData);

      expect(mockPropertyRepository.findByName).toHaveBeenCalledWith(
        "New Server",
      );
      expect(mockPropertyRepository.create).toHaveBeenCalledWith({
        ...createData,
        name: "New Server", // normalized
      });
      expect(result).toEqual(createdProperty);
    });

    it("should throw error if property name already exists", async () => {
      const createData = {
        name: "Existing Server",
        type: "server" as const,
        status: "active" as const,
      };

      const existingProperty = {
        id: "prop_123",
        name: "Existing Server",
        type: "server" as const,
        status: "active" as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(
        existingProperty,
      );

      await expect(propertyService.createProperty(createData)).rejects.toThrow(
        "Property with this name already exists",
      );
    });

    it("should throw error for invalid SSL certificate status", async () => {
      const createData = {
        name: "SSL Cert",
        type: "ssl_certificate" as const,
        status: "maintenance" as const,
      };

      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(null);

      await expect(propertyService.createProperty(createData)).rejects.toThrow(
        "SSL certificates cannot be in maintenance status",
      );
    });

    it("should throw error for invalid storage status", async () => {
      const createData = {
        name: "Storage Unit",
        type: "storage" as const,
        status: "suspended" as const,
      };

      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(null);

      await expect(propertyService.createProperty(createData)).rejects.toThrow(
        "Storage cannot be suspended",
      );
    });
  });

  describe("updateProperty", () => {
    it("should update property successfully", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Old Server",
        type: "server" as const,
        status: "active" as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updateData = {
        name: "Updated Server",
        description: "Updated description",
      };

      const updatedProperty = {
        ...existingProperty,
        ...updateData,
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        existingProperty,
      );
      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockPropertyRepository.update).mockResolvedValue(
        updatedProperty,
      );

      const result = await propertyService.updateProperty(
        "prop_123",
        updateData,
      );

      expect(mockPropertyRepository.findById).toHaveBeenCalledWith("prop_123");
      expect(mockPropertyRepository.update).toHaveBeenCalledWith("prop_123", {
        ...updateData,
        name: "Updated Server", // normalized
      });
      expect(result).toEqual(updatedProperty);
    });

    it("should throw error if property not found", async () => {
      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(null);

      await expect(
        propertyService.updateProperty("nonexistent", { name: "New Name" }),
      ).rejects.toThrow("Property not found");
    });

    it("should throw error if new name already exists", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Old Server",
        type: "server" as const,
        status: "active" as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const conflictingProperty = {
        id: "prop_456",
        name: "Existing Server",
        type: "server" as const,
        status: "active" as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        existingProperty,
      );
      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(
        conflictingProperty,
      );

      await expect(
        propertyService.updateProperty("prop_123", { name: "Existing Server" }),
      ).rejects.toThrow("Property with this name already exists");
    });
  });

  describe("deleteProperty", () => {
    it("should soft delete property by deactivating", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Test Server",
        type: "server" as const,
        status: "active" as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        existingProperty,
      );
      vi.mocked(mockPropertyRepository.update).mockResolvedValue({
        ...existingProperty,
        is_active: false,
      });

      await propertyService.deleteProperty("prop_123");

      expect(mockPropertyRepository.findById).toHaveBeenCalledWith("prop_123");
      expect(mockPropertyRepository.update).toHaveBeenCalledWith("prop_123", {
        is_active: false,
      });
    });

    it("should throw error if property not found", async () => {
      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(null);

      await expect(
        propertyService.deleteProperty("nonexistent"),
      ).rejects.toThrow("Property not found");
    });
  });

  describe("deactivateProperty", () => {
    it("should deactivate property", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Test Server",
        type: "server" as const,
        status: "active" as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const deactivatedProperty = {
        ...existingProperty,
        is_active: false,
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        existingProperty,
      );
      vi.mocked(mockPropertyRepository.update).mockResolvedValue(
        deactivatedProperty,
      );

      const result = await propertyService.deactivateProperty("prop_123");

      expect(result).toEqual(deactivatedProperty);
    });
  });

  describe("activateProperty", () => {
    it("should activate property", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Test Server",
        type: "server" as const,
        status: "active" as const,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const activatedProperty = {
        ...existingProperty,
        is_active: true,
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        existingProperty,
      );
      vi.mocked(mockPropertyRepository.update).mockResolvedValue(
        activatedProperty,
      );

      const result = await propertyService.activateProperty("prop_123");

      expect(result).toEqual(activatedProperty);
    });
  });

  describe("getPropertyCount", () => {
    it("should return property count", async () => {
      vi.mocked(mockPropertyRepository.count).mockResolvedValue(5);

      const result = await propertyService.getPropertyCount({ type: "server" });

      expect(mockPropertyRepository.count).toHaveBeenCalledWith({
        type: "server",
      });
      expect(result).toBe(5);
    });
  });
});
