import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestContext } from "../setup";
import { createRepositories } from "~/repositories";
import { RoleService } from "~/services/role.service";
import type { CreateRoleRequest } from "~/types/openapi";

describe("Role Management Integration", () => {
  const ctx = createTestContext();
  let roleService: RoleService;

  beforeEach(async () => {
    // Clear all tables for clean test state
    await ctx.db
      .delete(ctx.schema.userRoles)
      .where(ctx.schema.userRoles.user_id.isNotNull());
    await ctx.db
      .delete(ctx.schema.users)
      .where(ctx.schema.users.id.isNotNull());
    await ctx.db
      .delete(ctx.schema.rolePermissions)
      .where(ctx.schema.rolePermissions.role_id.isNotNull());
    await ctx.db
      .delete(ctx.schema.roles)
      .where(ctx.schema.roles.id.isNotNull());
    await ctx.db
      .delete(ctx.schema.permissions)
      .where(ctx.schema.permissions.id.isNotNull());

    const repositories = createRepositories();
    roleService = new RoleService(
      repositories.roleRepository,
      repositories.permissionRepository,
    );
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  describe("Role CRUD Operations", () => {
    it("should create, read, update, and delete a role", async () => {
      // Create a role
      const roleData: CreateRoleRequest = {
        name: "Admin",
        description: "Administrator role with full access",
      };

      const createdRole = await roleService.createRole(roleData);
      expect(createdRole).toMatchObject({
        name: roleData.name,
        description: roleData.description,
        is_system: false,
      });
      expect(createdRole.id).toBeDefined();
      expect(createdRole.created_at).toBeDefined();

      // Read the role
      const retrievedRole = await roleService.getRoleById(createdRole.id);
      expect(retrievedRole).toMatchObject({
        id: createdRole.id,
        name: roleData.name,
        description: roleData.description,
        is_system: false,
      });

      // Update the role
      const updatedRole = await roleService.updateRole(createdRole.id, {
        name: "Super Admin",
        description: "Super administrator role",
      });
      expect(updatedRole).toMatchObject({
        id: createdRole.id,
        name: "Super Admin",
        description: "Super administrator role",
        is_system: false,
      });

      // Delete the role
      await roleService.deleteRole(createdRole.id);
      const deletedRole = await roleService.getRoleById(createdRole.id);
      expect(deletedRole).toBeNull();
    });

    it("should list roles with pagination and search", async () => {
      // Create test roles
      const roles = [
        { name: "Admin", description: "Administrator role" },
        { name: "Editor", description: "Editor role" },
        { name: "Viewer", description: "Viewer role" },
      ];

      for (const roleData of roles) {
        await roleService.createRole(roleData);
      }

      // Test pagination
      const page1 = await roleService.listRoles({ page: 1, limit: 2 });
      expect(page1.roles).toHaveLength(2);
      expect(page1.total).toBe(3);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);

      const page2 = await roleService.listRoles({ page: 2, limit: 2 });
      expect(page2.roles).toHaveLength(1);
      expect(page2.page).toBe(2);

      // Test search
      const searchResults = await roleService.listRoles({ search: "admin" });
      expect(searchResults.roles).toHaveLength(1);
      expect(searchResults.roles[0]?.name).toBe("Admin");
    });
  });

  describe("Permission Management", () => {
    it("should create and manage permissions", async () => {
      // Create permissions
      const permission1 = await roleService.createPermission({
        name: "create_users",
        resource: "users",
        action: "create",
        description: "Create new users",
      });

      const permission2 = await roleService.createPermission({
        name: "delete_users",
        resource: "users",
        action: "delete",
        description: "Delete users",
      });

      expect(permission1).toMatchObject({
        name: "create_users",
        resource: "users",
        action: "create",
        description: "Create new users",
      });

      expect(permission2).toMatchObject({
        name: "delete_users",
        resource: "users",
        action: "delete",
        description: "Delete users",
      });

      // Get all permissions
      const allPermissions = await roleService.getAllPermissions();
      expect(allPermissions.length).toBeGreaterThanOrEqual(2);
      expect(allPermissions.some((p) => p.id === permission1.id)).toBe(true);
      expect(allPermissions.some((p) => p.id === permission2.id)).toBe(true);

      // Get permission by resource and action
      const foundPermission =
        await roleService.getPermissionByResourceAndAction("users", "create");
      expect(foundPermission).toMatchObject(permission1);
    });

    it("should assign and remove permissions from roles", async () => {
      // Create role and permissions
      const role = await roleService.createRole({
        name: "Admin",
        description: "Administrator role",
      });

      const permission1 = await roleService.createPermission({
        name: "create_users",
        resource: "users",
        action: "create",
        description: "Create new users",
      });

      const permission2 = await roleService.createPermission({
        name: "delete_users",
        resource: "users",
        action: "delete",
        description: "Delete users",
      });

      // Assign permissions to role
      await roleService.assignPermissionToRole(role.id, permission1.id);
      await roleService.assignPermissionToRole(role.id, permission2.id);

      // Check role permissions
      const rolePermissions = await roleService.getRolePermissions(role.id);
      expect(rolePermissions).toHaveLength(2);
      expect(rolePermissions.map((p) => p.id)).toContain(permission1.id);
      expect(rolePermissions.map((p) => p.id)).toContain(permission2.id);

      // Remove a permission
      await roleService.removePermissionFromRole(role.id, permission1.id);

      const updatedRolePermissions = await roleService.getRolePermissions(
        role.id,
      );
      expect(updatedRolePermissions).toHaveLength(1);
      expect(updatedRolePermissions[0]?.id).toBe(permission2.id);
    });

    it("should handle duplicate permission assignment", async () => {
      const role = await roleService.createRole({
        name: "Admin",
        description: "Administrator role",
      });

      const permission = await roleService.createPermission({
        name: "create_users",
        resource: "users",
        action: "create",
        description: "Create new users",
      });

      // Assign permission twice
      await roleService.assignPermissionToRole(role.id, permission.id);
      await roleService.assignPermissionToRole(role.id, permission.id);

      // Should still have only one permission
      const rolePermissions = await roleService.getRolePermissions(role.id);
      expect(rolePermissions).toHaveLength(1);
    });
  });

  describe("Role User Count", () => {
    it("should count users assigned to a role", async () => {
      const role = await roleService.createRole({
        name: "Admin",
        description: "Administrator role",
      });

      // Initially no users
      let userCount = await roleService.getRoleUserCount(role.id);
      expect(userCount).toBe(0);

      // Create users and assign role
      const { userRepository } = createRepositories(ctx.db);
      const user1 = await userRepository.createUser({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        status: "active",
      });

      const user2 = await userRepository.createUser({
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password123",
        status: "active",
      });

      await userRepository.assignRoleToUser(user1.id, role.id);
      await userRepository.assignRoleToUser(user2.id, role.id);

      // Check user count
      userCount = await roleService.getRoleUserCount(role.id);
      expect(userCount).toBe(2);

      // Remove one user
      await userRepository.removeRoleFromUser(user1.id, role.id);
      userCount = await roleService.getRoleUserCount(role.id);
      expect(userCount).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle duplicate role name creation", async () => {
      const roleData: CreateRoleRequest = {
        name: "Admin",
        description: "Administrator role",
      };

      await roleService.createRole(roleData);

      // Try to create another role with the same name
      await expect(roleService.createRole(roleData)).rejects.toThrow();
    });

    it("should handle non-existent role operations", async () => {
      const nonExistentId = "non-existent-id";

      await expect(roleService.getRoleById(nonExistentId)).resolves.toBeNull();
      await expect(
        roleService.updateRole(nonExistentId, { name: "New Name" }),
      ).resolves.toBeNull();
      await expect(roleService.deleteRole(nonExistentId)).rejects.toThrow();
    });

    it("should handle permission assignment to non-existent role", async () => {
      const permission = await roleService.createPermission({
        name: "create_users",
        resource: "users",
        action: "create",
        description: "Create new users",
      });

      await expect(
        roleService.assignPermissionToRole("non-existent-role", permission.id),
      ).rejects.toThrow();
    });

    it("should handle duplicate permission creation", async () => {
      const permissionData = {
        name: "create_users",
        resource: "users",
        action: "create",
        description: "Create new users",
      };

      await roleService.createPermission(permissionData);

      // Try to create another permission with the same resource and action
      await expect(
        roleService.createPermission(permissionData),
      ).rejects.toThrow();
    });
  });
});
