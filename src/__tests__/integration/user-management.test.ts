import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestContext } from "../setup";
import { createRepositories } from "~/repositories";
import { UserService } from "~/services/user.service";
import { RoleService } from "~/services/role.service";
import type { CreateUserRequest, CreateRoleRequest } from "~/types/openapi";

describe("User Management Integration", () => {
  const ctx = createTestContext();
  let userService: UserService;
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
    userService = new UserService(
      repositories.userRepository,
      repositories.roleRepository,
    );
    roleService = new RoleService(
      repositories.roleRepository,
      repositories.permissionRepository,
    );
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  describe("User CRUD Operations", () => {
    it("should create, read, update, and delete a user", async () => {
      // Create a user
      const userData: CreateUserRequest = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        status: "active",
      };

      const createdUser = await userService.createUser(userData);
      expect(createdUser).toMatchObject({
        name: userData.name,
        email: userData.email,
        status: userData.status,
      });
      expect(createdUser.id).toBeDefined();
      expect(createdUser.created_at).toBeDefined();

      // Read the user
      const retrievedUser = await userService.getUserById(createdUser.id);
      expect(retrievedUser).toMatchObject({
        id: createdUser.id,
        name: userData.name,
        email: userData.email,
        status: userData.status,
      });

      // Update the user
      const updatedUser = await userService.updateUser(createdUser.id, {
        name: "Jane Doe",
        status: "inactive",
      });
      expect(updatedUser).toMatchObject({
        id: createdUser.id,
        name: "Jane Doe",
        email: userData.email,
        status: "inactive",
      });

      // Delete the user
      await userService.deleteUser(createdUser.id);
      const deletedUser = await userService.getUserById(createdUser.id);
      expect(deletedUser).toBeNull();
    });

    it("should list users with pagination and filtering", async () => {
      // Create test users
      const users = [
        {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          status: "active" as const,
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
          password: "password123",
          status: "active" as const,
        },
        {
          name: "Bob Johnson",
          email: "bob@example.com",
          password: "password123",
          status: "inactive" as const,
        },
      ];

      for (const userData of users) {
        await userService.createUser(userData);
      }

      // Test pagination
      const page1 = await userService.listUsers({ page: 1, limit: 2 });
      expect(page1.users).toHaveLength(2);
      expect(page1.total).toBe(3);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);

      const page2 = await userService.listUsers({ page: 2, limit: 2 });
      expect(page2.users).toHaveLength(1);
      expect(page2.page).toBe(2);

      // Test status filtering
      const activeUsers = await userService.listUsers({ status: "active" });
      expect(activeUsers.users).toHaveLength(2);
      expect(activeUsers.users.every((user) => user.status === "active")).toBe(
        true,
      );

      const inactiveUsers = await userService.listUsers({ status: "inactive" });
      expect(inactiveUsers.users).toHaveLength(1);
      expect(
        inactiveUsers.users.every((user) => user.status === "inactive"),
      ).toBe(true);

      // Test search
      const searchResults = await userService.listUsers({ search: "john" });
      expect(searchResults.users).toHaveLength(1);
      expect(searchResults.users[0]?.name).toBe("John Doe");
    });
  });

  describe("User Role Management", () => {
    it("should assign and remove roles from users", async () => {
      // Create a user and roles
      const user = await userService.createUser({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        status: "active",
      });

      const role1 = await roleService.createRole({
        name: "Admin",
        description: "Administrator role",
      });

      const role2 = await roleService.createRole({
        name: "Editor",
        description: "Editor role",
      });

      // Assign roles
      await userService.assignRoleToUser(user.id, role1.id);
      await userService.assignRoleToUser(user.id, role2.id);

      // Check user roles
      const userRoles = await userService.getUserRoles(user.id);
      expect(userRoles).toHaveLength(2);
      expect(userRoles.map((r) => r.name)).toContain("Admin");
      expect(userRoles.map((r) => r.name)).toContain("Editor");

      // Remove a role
      await userService.removeRoleFromUser(user.id, role1.id);

      const updatedUserRoles = await userService.getUserRoles(user.id);
      expect(updatedUserRoles).toHaveLength(1);
      expect(updatedUserRoles[0]?.name).toBe("Editor");
    });

    it("should check user permissions based on roles", async () => {
      // Create user, role, and permission
      const user = await userService.createUser({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        status: "active",
      });

      const role = await roleService.createRole({
        name: "Admin",
        description: "Administrator role",
      });

      const permission = await roleService.createPermission({
        name: "manage_users",
        resource: "users",
        action: "create",
        description: "Create users",
      });

      // Assign permission to role
      await roleService.assignPermissionToRole(role.id, permission.id);

      // Assign role to user
      await userService.assignRoleToUser(user.id, role.id);

      // Check permission
      const hasPermission = await userService.hasPermission(
        user.id,
        "users",
        "create",
      );
      expect(hasPermission).toBe(true);

      // Check non-existent permission
      const hasNoPermission = await userService.hasPermission(
        user.id,
        "posts",
        "delete",
      );
      expect(hasNoPermission).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle duplicate email creation", async () => {
      const userData: CreateUserRequest = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        status: "active",
      };

      await userService.createUser(userData);

      // Try to create another user with the same email
      await expect(userService.createUser(userData)).rejects.toThrow();
    });

    it("should handle non-existent user operations", async () => {
      const nonExistentId = "non-existent-id";

      await expect(userService.getUserById(nonExistentId)).resolves.toBeNull();
      await expect(
        userService.updateUser(nonExistentId, { name: "New Name" }),
      ).resolves.toBeNull();
      await expect(userService.deleteUser(nonExistentId)).rejects.toThrow();
    });

    it("should handle role assignment to non-existent user", async () => {
      const role = await roleService.createRole({
        name: "Admin",
        description: "Administrator role",
      });

      await expect(
        userService.assignRoleToUser("non-existent-user", role.id),
      ).rejects.toThrow();
    });
  });
});
