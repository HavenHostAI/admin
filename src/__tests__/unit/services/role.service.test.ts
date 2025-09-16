import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleService, PermissionService } from "@/services/role.service";
import type {
  RoleRepository,
  PermissionRepository,
} from "@/repositories/interfaces/role.repository";
import type { Role, Permission } from "@/types/openapi";

// Mock repositories
const mockRoleRepository: RoleRepository = {
  createRole: vi.fn(),
  getRoleById: vi.fn(),
  getRoleByName: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  listRoles: vi.fn(),
  getRolePermissions: vi.fn(),
  assignPermissionToRole: vi.fn(),
  removePermissionFromRole: vi.fn(),
  getRoleUsers: vi.fn(),
  canDeleteRole: vi.fn(),
};

const mockPermissionRepository: PermissionRepository = {
  getAllPermissions: vi.fn(),
  getPermissionById: vi.fn(),
  getPermissionByResourceAndAction: vi.fn(),
  createPermission: vi.fn(),
};

const mockRole: Role = {
  id: "role_123",
  name: "Content Manager",
  description: "Can manage content and moderate posts",
  is_system: false,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

const mockPermission: Permission = {
  id: "perm_123",
  name: "Create Posts",
  resource: "posts",
  action: "create",
  description: "Allows creating new posts",
  created_at: "2024-01-15T10:30:00Z",
};

describe("RoleService", () => {
  let roleService: RoleService;

  beforeEach(() => {
    vi.clearAllMocks();
    roleService = new RoleService(mockRoleRepository, mockPermissionRepository);
  });

  describe("createRole", () => {
    it("should successfully create a role with valid data", async () => {
      vi.mocked(mockRoleRepository.getRoleByName).mockResolvedValue(null);
      vi.mocked(mockRoleRepository.createRole).mockResolvedValue(mockRole);

      const result = await roleService.createRole({
        name: "Content Manager",
        description: "Can manage content and moderate posts",
      });

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.getRoleByName).toHaveBeenCalledWith(
        "Content Manager",
      );
      expect(mockRoleRepository.createRole).toHaveBeenCalledWith({
        name: "Content Manager",
        description: "Can manage content and moderate posts",
      });
    });

    it("should throw error for empty role name", async () => {
      await expect(
        roleService.createRole({
          name: "",
          description: "Valid description",
        }),
      ).rejects.toThrow("Role name is required");
    });

    it("should throw error for role name too long", async () => {
      const longName = "a".repeat(101);
      await expect(
        roleService.createRole({
          name: longName,
          description: "Valid description",
        }),
      ).rejects.toThrow("Role name must be 100 characters or less");
    });

    it("should throw error for empty description", async () => {
      await expect(
        roleService.createRole({
          name: "Valid Name",
          description: "",
        }),
      ).rejects.toThrow("Role description is required");
    });

    it("should throw error for description too long", async () => {
      const longDescription = "a".repeat(501);
      await expect(
        roleService.createRole({
          name: "Valid Name",
          description: longDescription,
        }),
      ).rejects.toThrow("Role description must be 500 characters or less");
    });

    it("should throw error if role name already exists", async () => {
      vi.mocked(mockRoleRepository.getRoleByName).mockResolvedValue(mockRole);

      await expect(
        roleService.createRole({
          name: "Content Manager",
          description: "Valid description",
        }),
      ).rejects.toThrow("Role with this name already exists");
    });

    it("should throw error for invalid permission", async () => {
      vi.mocked(mockRoleRepository.getRoleByName).mockResolvedValue(null);
      vi.mocked(mockPermissionRepository.getPermissionById).mockResolvedValue(
        null,
      );

      await expect(
        roleService.createRole({
          name: "Content Manager",
          description: "Valid description",
          permissions: ["invalid-permission"],
        }),
      ).rejects.toThrow("Permission with ID invalid-permission not found");
    });
  });

  describe("getRoleById", () => {
    it("should return role for valid ID", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);

      const result = await roleService.getRoleById("role_123");

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.getRoleById).toHaveBeenCalledWith("role_123");
    });

    it("should return null for non-existent role", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(null);

      const result = await roleService.getRoleById("non-existent");

      expect(result).toBeNull();
    });

    it("should throw error for empty ID", async () => {
      await expect(roleService.getRoleById("")).rejects.toThrow(
        "Role ID is required",
      );
    });
  });

  describe("updateRole", () => {
    it("should successfully update role", async () => {
      const updatedRole = { ...mockRole, name: "Updated Role" };
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockRoleRepository.getRoleByName).mockResolvedValue(null);
      vi.mocked(mockRoleRepository.updateRole).mockResolvedValue(updatedRole);

      const result = await roleService.updateRole("role_123", {
        name: "Updated Role",
      });

      expect(result).toEqual(updatedRole);
      expect(mockRoleRepository.updateRole).toHaveBeenCalledWith("role_123", {
        name: "Updated Role",
      });
    });

    it("should throw error if role not found", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(null);

      await expect(
        roleService.updateRole("non-existent", { name: "Updated Role" }),
      ).rejects.toThrow("Role not found");
    });

    it("should throw error for empty role name", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);

      await expect(
        roleService.updateRole("role_123", { name: "" }),
      ).rejects.toThrow("Role name is required");
    });

    it("should throw error if role name is already taken", async () => {
      const otherRole = { ...mockRole, id: "other_role" };
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockRoleRepository.getRoleByName).mockResolvedValue(otherRole);

      await expect(
        roleService.updateRole("role_123", { name: "Taken Name" }),
      ).rejects.toThrow("Role name is already taken by another role");
    });
  });

  describe("deleteRole", () => {
    it("should successfully delete role", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockRoleRepository.canDeleteRole).mockResolvedValue(true);
      vi.mocked(mockRoleRepository.deleteRole).mockResolvedValue();

      await roleService.deleteRole("role_123");

      expect(mockRoleRepository.deleteRole).toHaveBeenCalledWith("role_123");
    });

    it("should throw error if role not found", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(null);

      await expect(roleService.deleteRole("non-existent")).rejects.toThrow(
        "Role not found",
      );
    });

    it("should throw error if role is system role", async () => {
      const systemRole = { ...mockRole, is_system: true };
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(systemRole);

      await expect(roleService.deleteRole("role_123")).rejects.toThrow(
        "Cannot delete system roles",
      );
    });

    it("should throw error if role has users assigned", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockRoleRepository.canDeleteRole).mockResolvedValue(false);

      await expect(roleService.deleteRole("role_123")).rejects.toThrow(
        "Cannot delete role: users are still assigned to this role",
      );
    });
  });

  describe("listRoles", () => {
    it("should return paginated role list", async () => {
      const mockResponse = {
        roles: [mockRole],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      };

      vi.mocked(mockRoleRepository.listRoles).mockResolvedValue(mockResponse);

      const result = await roleService.listRoles({ page: 1, limit: 20 });

      expect(result).toEqual(mockResponse);
      expect(mockRoleRepository.listRoles).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
    });

    it("should throw error for invalid limit", async () => {
      await expect(roleService.listRoles({ limit: 101 })).rejects.toThrow(
        "Limit must be between 1 and 100",
      );
    });
  });

  describe("assignPermissionToRole", () => {
    it("should successfully assign permission to role", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockPermissionRepository.getPermissionById).mockResolvedValue(
        mockPermission,
      );
      vi.mocked(mockRoleRepository.getRolePermissions).mockResolvedValue([]);
      vi.mocked(mockRoleRepository.assignPermissionToRole).mockResolvedValue();

      await roleService.assignPermissionToRole("role_123", "perm_123");

      expect(mockRoleRepository.assignPermissionToRole).toHaveBeenCalledWith(
        "role_123",
        "perm_123",
        undefined,
      );
    });

    it("should throw error if role not found", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(null);

      await expect(
        roleService.assignPermissionToRole("non-existent", "perm_123"),
      ).rejects.toThrow("Role not found");
    });

    it("should throw error if permission not found", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockPermissionRepository.getPermissionById).mockResolvedValue(
        null,
      );

      await expect(
        roleService.assignPermissionToRole("role_123", "non-existent"),
      ).rejects.toThrow("Permission not found");
    });

    it("should throw error if role already has permission", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockPermissionRepository.getPermissionById).mockResolvedValue(
        mockPermission,
      );
      vi.mocked(mockRoleRepository.getRolePermissions).mockResolvedValue([
        mockPermission,
      ]);

      await expect(
        roleService.assignPermissionToRole("role_123", "perm_123"),
      ).rejects.toThrow("Role already has this permission");
    });
  });

  describe("removePermissionFromRole", () => {
    it("should successfully remove permission from role", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockRoleRepository.getRolePermissions).mockResolvedValue([
        mockPermission,
      ]);
      vi.mocked(
        mockRoleRepository.removePermissionFromRole,
      ).mockResolvedValue();

      await roleService.removePermissionFromRole("role_123", "perm_123");

      expect(mockRoleRepository.removePermissionFromRole).toHaveBeenCalledWith(
        "role_123",
        "perm_123",
      );
    });

    it("should throw error if role not found", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(null);

      await expect(
        roleService.removePermissionFromRole("non-existent", "perm_123"),
      ).rejects.toThrow("Role not found");
    });

    it("should throw error if role does not have permission", async () => {
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockRoleRepository.getRolePermissions).mockResolvedValue([]);

      await expect(
        roleService.removePermissionFromRole("role_123", "perm_123"),
      ).rejects.toThrow("Role does not have this permission");
    });
  });
});

describe("PermissionService", () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    vi.clearAllMocks();
    permissionService = new PermissionService(mockPermissionRepository);
  });

  describe("getAllPermissions", () => {
    it("should return all permissions", async () => {
      vi.mocked(mockPermissionRepository.getAllPermissions).mockResolvedValue([
        mockPermission,
      ]);

      const result = await permissionService.getAllPermissions();

      expect(result).toEqual([mockPermission]);
      expect(mockPermissionRepository.getAllPermissions).toHaveBeenCalled();
    });
  });

  describe("getPermissionById", () => {
    it("should return permission for valid ID", async () => {
      vi.mocked(mockPermissionRepository.getPermissionById).mockResolvedValue(
        mockPermission,
      );

      const result = await permissionService.getPermissionById("perm_123");

      expect(result).toEqual(mockPermission);
      expect(mockPermissionRepository.getPermissionById).toHaveBeenCalledWith(
        "perm_123",
      );
    });

    it("should return null for non-existent permission", async () => {
      vi.mocked(mockPermissionRepository.getPermissionById).mockResolvedValue(
        null,
      );

      const result = await permissionService.getPermissionById("non-existent");

      expect(result).toBeNull();
    });

    it("should throw error for empty ID", async () => {
      await expect(permissionService.getPermissionById("")).rejects.toThrow(
        "Permission ID is required",
      );
    });
  });

  describe("createPermission", () => {
    it("should successfully create permission", async () => {
      vi.mocked(
        mockPermissionRepository.getPermissionByResourceAndAction,
      ).mockResolvedValue(null);
      vi.mocked(mockPermissionRepository.createPermission).mockResolvedValue(
        mockPermission,
      );

      const result = await permissionService.createPermission({
        name: "Create Posts",
        resource: "posts",
        action: "create",
        description: "Allows creating new posts",
      });

      expect(result).toEqual(mockPermission);
      expect(mockPermissionRepository.createPermission).toHaveBeenCalledWith({
        name: "Create Posts",
        resource: "posts",
        action: "create",
        description: "Allows creating new posts",
      });
    });

    it("should throw error for empty permission name", async () => {
      await expect(
        permissionService.createPermission({
          name: "",
          resource: "posts",
          action: "create",
        }),
      ).rejects.toThrow("Permission name is required");
    });

    it("should throw error for empty resource", async () => {
      await expect(
        permissionService.createPermission({
          name: "Create Posts",
          resource: "",
          action: "create",
        }),
      ).rejects.toThrow("Resource is required");
    });

    it("should throw error for empty action", async () => {
      await expect(
        permissionService.createPermission({
          name: "Create Posts",
          resource: "posts",
          action: "",
        }),
      ).rejects.toThrow("Action is required");
    });

    it("should throw error if permission already exists", async () => {
      vi.mocked(
        mockPermissionRepository.getPermissionByResourceAndAction,
      ).mockResolvedValue(mockPermission);

      await expect(
        permissionService.createPermission({
          name: "Create Posts",
          resource: "posts",
          action: "create",
        }),
      ).rejects.toThrow(
        "Permission for this resource and action combination already exists",
      );
    });
  });
});
