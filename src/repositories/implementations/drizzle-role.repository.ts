import { eq, and, or, like, count, desc } from "drizzle-orm";
import { db } from "../../server/db";
import {
  roles,
  permissions,
  userRoles,
  rolePermissions,
} from "../../server/db/schema";
import type {
  RoleRepository,
  PermissionRepository,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleListFilters,
  RoleListResponse,
} from "../interfaces/role.repository";
import type { Role, Permission } from "~/types/openapi";

// Extended role type
type DrizzleRole = {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
};

// Extended permission type
type DrizzlePermission = {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: Date | null;
};

export class DrizzleRoleRepository implements RoleRepository {
  private readonly DEFAULT_PAGE_SIZE = 20;

  private mapDrizzleRoleToRole(drizzleRole: DrizzleRole): Role {
    return {
      id: drizzleRole.id,
      name: drizzleRole.name,
      description: drizzleRole.description ?? "",
      is_system: drizzleRole.is_system ?? false,
      created_at:
        drizzleRole.created_at?.toISOString() ?? new Date().toISOString(),
      updated_at:
        drizzleRole.updated_at?.toISOString() ?? new Date().toISOString(),
    };
  }

  private mapDrizzlePermissionToPermission(
    drizzlePermission: DrizzlePermission,
  ): Permission {
    return {
      id: drizzlePermission.id,
      name: drizzlePermission.name,
      resource: drizzlePermission.resource,
      action: drizzlePermission.action,
      description: drizzlePermission.description ?? "",
      created_at:
        drizzlePermission.created_at?.toISOString() ?? new Date().toISOString(),
    };
  }

  async createRole(data: CreateRoleRequest): Promise<Role> {
    // Insert role
    const [newRole] = await db
      .insert(roles)
      .values({
        name: data.name,
        description: data.description,
      })
      .returning();

    // Assign permissions if provided
    if (data.permissions && data.permissions.length > 0) {
      const permissionAssignments = data.permissions.map((permissionId) => ({
        role_id: newRole.id,
        permission_id: permissionId,
      }));

      await db.insert(rolePermissions).values(permissionAssignments);
    }

    return this.mapDrizzleRoleToRole(newRole as DrizzleRole);
  }

  async getRoleById(id: string): Promise<Role | null> {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id),
    });

    if (!role) {
      return null;
    }

    return this.mapDrizzleRoleToRole(role as DrizzleRole);
  }

  async getRoleByName(name: string): Promise<Role | null> {
    const role = await db.query.roles.findFirst({
      where: eq(roles.name, name),
    });

    if (!role) {
      return null;
    }

    return this.mapDrizzleRoleToRole(role as DrizzleRole);
  }

  async updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
    const updateData: Partial<DrizzleRole> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;

    const [updatedRole] = await db
      .update(roles)
      .set(updateData)
      .where(eq(roles.id, id))
      .returning();

    // Update permissions if provided
    if (data.permissions !== undefined) {
      // Remove existing permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.role_id, id));

      // Add new permissions
      if (data.permissions.length > 0) {
        const permissionAssignments = data.permissions.map((permissionId) => ({
          role_id: id,
          permission_id: permissionId,
        }));

        await db.insert(rolePermissions).values(permissionAssignments);
      }
    }

    return this.mapDrizzleRoleToRole(updatedRole as DrizzleRole);
  }

  async deleteRole(id: string): Promise<void> {
    // Check if role can be deleted (no users assigned)
    const canDelete = await this.canDeleteRole(id);
    if (!canDelete) {
      throw new Error(
        "Cannot delete role: users are still assigned to this role",
      );
    }

    // Delete role (cascade will handle role_permissions)
    await db.delete(roles).where(eq(roles.id, id));
  }

  async listRoles(filters: RoleListFilters = {}): Promise<RoleListResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? this.DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    if (filters.search) {
      whereConditions.push(
        or(
          like(roles.name, `%${filters.search}%`),
          like(roles.description, `%${filters.search}%`),
        ),
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(roles)
      .where(whereClause);

    const total = totalResult?.count ?? 0;

    // Get roles
    const roleList = await db
      .select()
      .from(roles)
      .where(whereClause)
      .orderBy(desc(roles.created_at))
      .limit(limit)
      .offset(offset);

    const mappedRoles = roleList.map((role) =>
      this.mapDrizzleRoleToRole(role as DrizzleRole),
    );

    return {
      roles: mappedRoles,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
    };
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePermissionsList = await db
      .select({
        permission: permissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
      .where(eq(rolePermissions.role_id, roleId));

    return rolePermissionsList.map((item) =>
      this.mapDrizzlePermissionToPermission(
        item.permission as DrizzlePermission,
      ),
    );
  }

  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
    assignedBy?: string,
  ): Promise<void> {
    await db.insert(rolePermissions).values({
      role_id: roleId,
      permission_id: permissionId,
      assigned_by: assignedBy,
    });
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role_id, roleId),
          eq(rolePermissions.permission_id, permissionId),
        ),
      );
  }

  async getRoleUsers(roleId: string): Promise<string[]> {
    const roleUsers = await db
      .select({ user_id: userRoles.user_id })
      .from(userRoles)
      .where(eq(userRoles.role_id, roleId));

    return roleUsers.map((item) => item.user_id);
  }

  async canDeleteRole(roleId: string): Promise<boolean> {
    const roleUsers = await this.getRoleUsers(roleId);
    return roleUsers.length === 0;
  }
}

export class DrizzlePermissionRepository implements PermissionRepository {
  private mapDrizzlePermissionToPermission(
    drizzlePermission: DrizzlePermission,
  ): Permission {
    return {
      id: drizzlePermission.id,
      name: drizzlePermission.name,
      resource: drizzlePermission.resource,
      action: drizzlePermission.action,
      description: drizzlePermission.description ?? "",
      created_at:
        drizzlePermission.created_at?.toISOString() ?? new Date().toISOString(),
    };
  }

  async getAllPermissions(): Promise<Permission[]> {
    const permissionList = await db
      .select()
      .from(permissions)
      .orderBy(permissions.resource, permissions.action);

    return permissionList.map((permission) =>
      this.mapDrizzlePermissionToPermission(permission as DrizzlePermission),
    );
  }

  async getPermissionById(id: string): Promise<Permission | null> {
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, id),
    });

    if (!permission) {
      return null;
    }

    return this.mapDrizzlePermissionToPermission(
      permission as DrizzlePermission,
    );
  }

  async getPermissionByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    const permission = await db.query.permissions.findFirst({
      where: and(
        eq(permissions.resource, resource),
        eq(permissions.action, action),
      ),
    });

    if (!permission) {
      return null;
    }

    return this.mapDrizzlePermissionToPermission(
      permission as DrizzlePermission,
    );
  }

  async createPermission(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    const [newPermission] = await db
      .insert(permissions)
      .values({
        name: data.name,
        resource: data.resource,
        action: data.action,
        description: data.description,
      })
      .returning();

    return this.mapDrizzlePermissionToPermission(
      newPermission as DrizzlePermission,
    );
  }
}
