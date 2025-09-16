import type {
  RoleRepository,
  PermissionRepository,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleListFilters,
  RoleListResponse,
} from "~/repositories/interfaces/role.repository";
import type { Role, Permission } from "~/types/openapi";

export class RoleService {
  constructor(
    private roleRepository: RoleRepository,
    private permissionRepository: PermissionRepository,
  ) {}

  async createRole(data: CreateRoleRequest): Promise<Role> {
    // Business rule: Validate role name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Role name is required");
    }

    if (data.name.length > 100) {
      throw new Error("Role name must be 100 characters or less");
    }

    // Business rule: Validate description
    if (!data.description || data.description.trim().length === 0) {
      throw new Error("Role description is required");
    }

    if (data.description.length > 500) {
      throw new Error("Role description must be 500 characters or less");
    }

    // Business rule: Check if role name already exists
    const existingRole = await this.roleRepository.getRoleByName(data.name);
    if (existingRole) {
      throw new Error("Role with this name already exists");
    }

    // Business rule: Validate permissions if provided
    if (data.permissions && data.permissions.length > 0) {
      for (const permissionId of data.permissions) {
        const permission =
          await this.permissionRepository.getPermissionById(permissionId);
        if (!permission) {
          throw new Error(`Permission with ID ${permissionId} not found`);
        }
      }
    }

    return await this.roleRepository.createRole(data);
  }

  async getRoleById(id: string): Promise<Role | null> {
    if (!id) {
      throw new Error("Role ID is required");
    }

    return await this.roleRepository.getRoleById(id);
  }

  async getRoleByName(name: string): Promise<Role | null> {
    if (!name) {
      throw new Error("Role name is required");
    }

    return await this.roleRepository.getRoleByName(name);
  }

  async updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
    if (!id) {
      throw new Error("Role ID is required");
    }

    // Business rule: Check if role exists
    const existingRole = await this.roleRepository.getRoleById(id);
    if (!existingRole) {
      throw new Error("Role not found");
    }

    // Business rule: Validate role name if provided
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error("Role name is required");
      }

      if (data.name.length > 100) {
        throw new Error("Role name must be 100 characters or less");
      }

      // Check if name is already taken by another role
      if (data.name !== existingRole.name) {
        const roleWithName = await this.roleRepository.getRoleByName(data.name);
        if (roleWithName && roleWithName.id !== id) {
          throw new Error("Role name is already taken by another role");
        }
      }
    }

    // Business rule: Validate description if provided
    if (data.description !== undefined) {
      if (!data.description || data.description.trim().length === 0) {
        throw new Error("Role description is required");
      }

      if (data.description.length > 500) {
        throw new Error("Role description must be 500 characters or less");
      }
    }

    // Business rule: Validate permissions if provided
    if (data.permissions !== undefined) {
      for (const permissionId of data.permissions) {
        const permission =
          await this.permissionRepository.getPermissionById(permissionId);
        if (!permission) {
          throw new Error(`Permission with ID ${permissionId} not found`);
        }
      }
    }

    return await this.roleRepository.updateRole(id, data);
  }

  async deleteRole(id: string): Promise<void> {
    if (!id) {
      throw new Error("Role ID is required");
    }

    // Business rule: Check if role exists
    const existingRole = await this.roleRepository.getRoleById(id);
    if (!existingRole) {
      throw new Error("Role not found");
    }

    // Business rule: Check if role is a system role
    if (existingRole.is_system) {
      throw new Error("Cannot delete system roles");
    }

    // Business rule: Check if role can be deleted (no users assigned)
    const canDelete = await this.roleRepository.canDeleteRole(id);
    if (!canDelete) {
      throw new Error(
        "Cannot delete role: users are still assigned to this role",
      );
    }

    await this.roleRepository.deleteRole(id);
  }

  async listRoles(filters: RoleListFilters = {}): Promise<RoleListResponse> {
    // Business rule: Validate pagination parameters
    if (filters.page && filters.page < 1) {
      throw new Error("Page must be greater than 0");
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      throw new Error("Limit must be between 1 and 100");
    }

    return await this.roleRepository.listRoles(filters);
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }

    // Business rule: Check if role exists
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    return await this.roleRepository.getRolePermissions(roleId);
  }

  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
    assignedBy?: string,
  ): Promise<void> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }

    if (!permissionId) {
      throw new Error("Permission ID is required");
    }

    // Business rule: Check if role exists
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Business rule: Check if permission exists
    const permission =
      await this.permissionRepository.getPermissionById(permissionId);
    if (!permission) {
      throw new Error("Permission not found");
    }

    // Business rule: Check if role already has this permission
    const rolePermissions =
      await this.roleRepository.getRolePermissions(roleId);
    const hasPermission = rolePermissions.some((p) => p.id === permissionId);
    if (hasPermission) {
      throw new Error("Role already has this permission");
    }

    await this.roleRepository.assignPermissionToRole(
      roleId,
      permissionId,
      assignedBy,
    );
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }

    if (!permissionId) {
      throw new Error("Permission ID is required");
    }

    // Business rule: Check if role exists
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Business rule: Check if role has this permission
    const rolePermissions =
      await this.roleRepository.getRolePermissions(roleId);
    const hasPermission = rolePermissions.some((p) => p.id === permissionId);
    if (!hasPermission) {
      throw new Error("Role does not have this permission");
    }

    await this.roleRepository.removePermissionFromRole(roleId, permissionId);
  }

  async getRoleUsers(roleId: string): Promise<string[]> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }

    // Business rule: Check if role exists
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    return await this.roleRepository.getRoleUsers(roleId);
  }

  async canDeleteRole(roleId: string): Promise<boolean> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }

    return await this.roleRepository.canDeleteRole(roleId);
  }
}

export class PermissionService {
  constructor(private permissionRepository: PermissionRepository) {}

  async getAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.getAllPermissions();
  }

  async getPermissionById(id: string): Promise<Permission | null> {
    if (!id) {
      throw new Error("Permission ID is required");
    }

    return await this.permissionRepository.getPermissionById(id);
  }

  async getPermissionByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    if (!resource) {
      throw new Error("Resource is required");
    }

    if (!action) {
      throw new Error("Action is required");
    }

    return await this.permissionRepository.getPermissionByResourceAndAction(
      resource,
      action,
    );
  }

  async createPermission(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    // Business rule: Validate permission name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Permission name is required");
    }

    if (data.name.length > 100) {
      throw new Error("Permission name must be 100 characters or less");
    }

    // Business rule: Validate resource
    if (!data.resource || data.resource.trim().length === 0) {
      throw new Error("Resource is required");
    }

    if (data.resource.length > 50) {
      throw new Error("Resource must be 50 characters or less");
    }

    // Business rule: Validate action
    if (!data.action || data.action.trim().length === 0) {
      throw new Error("Action is required");
    }

    if (data.action.length > 20) {
      throw new Error("Action must be 20 characters or less");
    }

    // Business rule: Check if permission already exists for this resource/action combination
    const existingPermission =
      await this.permissionRepository.getPermissionByResourceAndAction(
        data.resource,
        data.action,
      );
    if (existingPermission) {
      throw new Error(
        "Permission for this resource and action combination already exists",
      );
    }

    return await this.permissionRepository.createPermission(data);
  }
}
