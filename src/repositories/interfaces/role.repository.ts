import type { Role, Permission } from "~/types/openapi";

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleListFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface RoleListResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface RoleRepository {
  // Role CRUD operations
  createRole(data: CreateRoleRequest): Promise<Role>;
  getRoleById(id: string): Promise<Role | null>;
  getRoleByName(name: string): Promise<Role | null>;
  updateRole(id: string, data: UpdateRoleRequest): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  listRoles(filters?: RoleListFilters): Promise<RoleListResponse>;

  // Role permission management
  getRolePermissions(roleId: string): Promise<Permission[]>;
  assignPermissionToRole(
    roleId: string,
    permissionId: string,
    assignedBy?: string,
  ): Promise<void>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;

  // Role user management
  getRoleUsers(roleId: string): Promise<string[]>; // Returns user IDs
  canDeleteRole(roleId: string): Promise<boolean>; // Check if role has users assigned
}

export interface PermissionRepository {
  // Permission operations
  getAllPermissions(): Promise<Permission[]>;
  getPermissionById(id: string): Promise<Permission | null>;
  getPermissionByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null>;
  createPermission(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission>;
}
