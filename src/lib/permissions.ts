import type { User, Permission } from "~/types/openapi";

/**
 * Permission checking utilities for role-based access control
 */

export interface PermissionCheck {
  resource: string;
  action: string;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: User,
  permission: PermissionCheck,
  userPermissions?: Permission[],
): boolean {
  // If userPermissions is provided, use it directly
  if (userPermissions) {
    return userPermissions.some(
      (p) =>
        p.resource === permission.resource && p.action === permission.action,
    );
  }

  // Otherwise, check if user has the permission through their roles
  // This would require fetching user permissions from the database
  // For now, we'll implement basic role-based checks
  return hasRolePermission(user, permission);
}

/**
 * Check if a user has permission based on their role
 * This is a simplified check - in a full implementation, you'd check actual permissions
 */
export function hasRolePermission(
  user: User,
  permission: PermissionCheck,
): boolean {
  // Basic role hierarchy: admin > manager > agent > viewer
  const roleHierarchy = {
    admin: 4,
    manager: 3,
    agent: 2,
    viewer: 1,
  };

  const userRoleLevel =
    roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;

  // Define minimum role levels for different actions
  const actionRequirements: Record<string, Record<string, number>> = {
    properties: {
      create: 3, // Manager+
      update: 3, // Manager+
      delete: 4, // Admin only
      read: 1, // Viewer+
    },
    users: {
      create: 4, // Admin only
      update: 4, // Admin only
      delete: 4, // Admin only
      read: 2, // Agent+
    },
    roles: {
      create: 4, // Admin only
      update: 4, // Admin only
      delete: 4, // Admin only
      read: 2, // Agent+
    },
  };

  const requiredLevel =
    actionRequirements[permission.resource]?.[permission.action] || 1;
  return userRoleLevel >= requiredLevel;
}

/**
 * Check if user can create properties (Manager+)
 */
export function canCreateProperty(user: User): boolean {
  return hasRolePermission(user, { resource: "properties", action: "create" });
}

/**
 * Check if user can update properties (Manager+)
 */
export function canUpdateProperty(user: User): boolean {
  return hasRolePermission(user, { resource: "properties", action: "update" });
}

/**
 * Check if user can delete properties (Admin only)
 */
export function canDeleteProperty(user: User): boolean {
  return hasRolePermission(user, { resource: "properties", action: "delete" });
}

/**
 * Check if user can read properties (Viewer+)
 */
export function canReadProperty(user: User): boolean {
  return hasRolePermission(user, { resource: "properties", action: "read" });
}

/**
 * Get user's effective permissions for a resource
 */
export function getUserPermissionsForResource(
  user: User,
  resource: string,
  userPermissions?: Permission[],
): Permission[] {
  if (userPermissions) {
    return userPermissions.filter((p) => p.resource === resource);
  }

  // Return permissions based on role hierarchy
  const rolePermissions: Permission[] = [];
  const roleHierarchy = {
    admin: 4,
    manager: 3,
    agent: 2,
    viewer: 1,
  };

  const userRoleLevel =
    roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;

  // Define permissions for each role level
  const rolePermissionMap: Record<number, string[]> = {
    4: ["create", "update", "delete", "read"], // Admin
    3: ["create", "update", "read"], // Manager
    2: ["read"], // Agent
    1: ["read"], // Viewer
  };

  const allowedActions = rolePermissionMap[userRoleLevel] || [];

  return allowedActions.map((action) => ({
    id: `${resource}-${action}`,
    name: `${action} ${resource}`,
    resource,
    action,
    description: `Permission to ${action} ${resource}`,
    created_at: new Date(),
  }));
}
