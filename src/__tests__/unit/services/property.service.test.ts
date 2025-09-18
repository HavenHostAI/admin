import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyService } from "@/services/property.service";
import type { PropertyRepository } from "@/repositories/interfaces/property.repository";

describe("PropertyService", () => {
  let propertyService: PropertyService;
  let mockPropertyRepository: PropertyRepository;
  let mockUser: any;
  let mockManagerUser: any;
  let mockAdminUser: any;

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

    // Mock users with different roles
    mockUser = {
      id: "user_123",
      name: "Test User",
      email: "test@example.com",
      role: "viewer",
      is_active: true,
    };

    mockManagerUser = {
      id: "manager_123",
      name: "Test Manager",
      email: "manager@example.com",
      role: "manager",
      is_active: true,
    };

    mockAdminUser = {
      id: "admin_123",
      name: "Test Admin",
      email: "admin@example.com",
      role: "admin",
      is_active: true,
    };
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

      const result = await propertyService.getPropertyById(
        "prop_123",
        mockUser,
      );

      expect(mockPropertyRepository.findById).toHaveBeenCalledWith("prop_123");
      expect(result).toEqual(mockProperty);
    });

    it("should return null when property not found", async () => {
      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(null);

      const result = await propertyService.getPropertyById(
        "nonexistent",
        mockUser,
      );

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

      const result = await propertyService.listProperties(mockUser, {
        page: 1,
        limit: 20,
      });

      expect(mockPropertyRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        owner_id: "user_123", // Should include tenant filtering
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

      const result = await propertyService.createProperty(
        createData,
        mockManagerUser,
      );

      expect(mockPropertyRepository.findByName).toHaveBeenCalledWith(
        "New Server",
      );
      expect(mockPropertyRepository.create).toHaveBeenCalledWith({
        ...createData,
        name: "New Server", // normalized
        owner_id: "manager_123", // Should be set to current user
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

      await expect(
        propertyService.createProperty(createData, mockManagerUser),
      ).rejects.toThrow("Property with this name already exists");
    });

    it("should throw error for invalid SSL certificate status", async () => {
      const createData = {
        name: "SSL Cert",
        type: "ssl_certificate" as const,
        status: "maintenance" as const,
      };

      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(null);

      await expect(
        propertyService.createProperty(createData, mockManagerUser),
      ).rejects.toThrow("SSL certificates cannot be in maintenance status");
    });

    it("should throw error for invalid storage status", async () => {
      const createData = {
        name: "Storage Unit",
        type: "storage" as const,
        status: "suspended" as const,
      };

      vi.mocked(mockPropertyRepository.findByName).mockResolvedValue(null);

      await expect(
        propertyService.createProperty(createData, mockManagerUser),
      ).rejects.toThrow("Storage cannot be suspended");
    });
  });

  describe("updateProperty", () => {
    it("should update property successfully", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Old Server",
        type: "server" as const,
        status: "active" as const,
        configuration: {},
        owner_id: "manager_123", // Match the manager user ID
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
        mockManagerUser,
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
        propertyService.updateProperty(
          "nonexistent",
          { name: "New Name" },
          mockManagerUser,
        ),
      ).rejects.toThrow("Property not found");
    });

    it("should throw error if new name already exists", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Old Server",
        type: "server" as const,
        status: "active" as const,
        configuration: {},
        owner_id: "manager_123", // Match the manager user ID
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
        propertyService.updateProperty(
          "prop_123",
          { name: "Existing Server" },
          mockManagerUser,
        ),
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
        configuration: {},
        owner_id: "admin_123", // Match the admin user ID
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

      await propertyService.deleteProperty("prop_123", mockAdminUser);

      expect(mockPropertyRepository.findById).toHaveBeenCalledWith("prop_123");
      expect(mockPropertyRepository.update).toHaveBeenCalledWith("prop_123", {
        is_active: false,
      });
    });

    it("should throw error if property not found", async () => {
      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(null);

      await expect(
        propertyService.deleteProperty("nonexistent", mockAdminUser),
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
        configuration: {},
        owner_id: "manager_123", // Match the manager user ID
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

      const result = await propertyService.deactivateProperty(
        "prop_123",
        mockManagerUser,
      );

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
        configuration: {},
        owner_id: "manager_123", // Match the manager user ID
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

      const result = await propertyService.activateProperty(
        "prop_123",
        mockManagerUser,
      );

      expect(result).toEqual(activatedProperty);
    });
  });

  describe("getPropertyCount", () => {
    it("should return property count", async () => {
      vi.mocked(mockPropertyRepository.count).mockResolvedValue(5);

      const result = await propertyService.getPropertyCount(mockUser, {
        type: "server",
      });

      expect(mockPropertyRepository.count).toHaveBeenCalledWith({
        type: "server",
        owner_id: "user_123", // Should include tenant filtering
      });
      expect(result).toBe(5);
    });
  });

  describe("Permission and Tenant Filtering", () => {
    it("should throw error when viewer tries to create property", async () => {
      const createData = {
        name: "New Server",
        description: "New server description",
        type: "server" as const,
        status: "active" as const,
      };

      await expect(
        propertyService.createProperty(createData, mockUser), // viewer user
      ).rejects.toThrow("Insufficient permissions to create properties");
    });

    it("should throw error when viewer tries to update property", async () => {
      const updateData = { name: "Updated Server" };

      await expect(
        propertyService.updateProperty("prop_123", updateData, mockUser), // viewer user
      ).rejects.toThrow("Insufficient permissions to update properties");
    });

    it("should throw error when manager tries to delete property", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Test Server",
        description: "Test description",
        type: "server" as const,
        status: "active" as const,
        configuration: {},
        owner_id: "manager_123",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        existingProperty,
      );

      await expect(
        propertyService.deleteProperty("prop_123", mockManagerUser), // manager user
      ).rejects.toThrow("Insufficient permissions to delete properties");
    });

    it("should throw error when user tries to update property they don't own", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Test Server",
        description: "Test description",
        type: "server" as const,
        status: "active" as const,
        configuration: {},
        owner_id: "other_user_123", // Different owner
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        existingProperty,
      );

      await expect(
        propertyService.updateProperty(
          "prop_123",
          { name: "Updated" },
          mockManagerUser,
        ),
      ).rejects.toThrow("Property not found or access denied");
    });

    it("should throw error when user tries to delete property they don't own", async () => {
      const existingProperty = {
        id: "prop_123",
        name: "Test Server",
        description: "Test description",
        type: "server" as const,
        status: "active" as const,
        configuration: {},
        owner_id: "other_user_123", // Different owner
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPropertyRepository.findById).mockResolvedValue(
        existingProperty,
      );

      await expect(
        propertyService.deleteProperty("prop_123", mockAdminUser),
      ).rejects.toThrow("Property not found or access denied");
    });
  });
});
