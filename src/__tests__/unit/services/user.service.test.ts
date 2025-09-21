// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "@/services/user.service";
import type {
  UserRepository,
  RoleRepository,
} from "@/repositories/interfaces/user.repository";
import type { User, Role } from "@/types/api";

// Mock repositories
const mockUserRepository: UserRepository = {
  createUser: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  listUsers: vi.fn(),
  getUserRoles: vi.fn(),
  assignRoleToUser: vi.fn(),
  removeRoleFromUser: vi.fn(),
  getUserPermissions: vi.fn(),
  hasPermission: vi.fn(),
  activateUser: vi.fn(),
  deactivateUser: vi.fn(),
};

const mockRoleRepository: RoleRepository = {
  getRoleById: vi.fn(),
  getRoleByName: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  listRoles: vi.fn(),
  getRolePermissions: vi.fn(),
  assignPermissionToRole: vi.fn(),
  removePermissionFromRole: vi.fn(),
  getRoleUsers: vi.fn(),
  canDeleteRole: vi.fn(),
};

const mockUser: User = {
  id: "user_123",
  email: "test@example.com",
  name: "Test User",
  image: "",
  role: "viewer",
  is_active: true,
  email_verified: "2024-01-15T10:30:00Z",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

const mockRole: Role = {
  id: "role_123",
  name: "editor",
  description: "Can edit content",
  is_system: false,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService(mockUserRepository, mockRoleRepository);
  });

  describe("createUser", () => {
    it("should successfully create a user with valid data", async () => {
      vi.mocked(mockUserRepository.getUserByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.createUser).mockResolvedValue(mockUser);

      const result = await userService.createUser({
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      });

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      });
    });

    it("should throw error for invalid email format", async () => {
      await expect(
        userService.createUser({
          email: "invalid-email",
          name: "Test User",
          password: "password123",
        }),
      ).rejects.toThrow("Invalid email format");
    });

    it("should throw error for short password", async () => {
      await expect(
        userService.createUser({
          email: "test@example.com",
          name: "Test User",
          password: "short",
        }),
      ).rejects.toThrow("Password must be at least 8 characters long");
    });

    it("should throw error if email already exists", async () => {
      vi.mocked(mockUserRepository.getUserByEmail).mockResolvedValue(mockUser);

      await expect(
        userService.createUser({
          email: "test@example.com",
          name: "Test User",
          password: "password123",
        }),
      ).rejects.toThrow("User with this email already exists");
    });

    it("should throw error for invalid role", async () => {
      vi.mocked(mockUserRepository.getUserByEmail).mockResolvedValue(null);
      vi.mocked(mockRoleRepository.getRoleByName).mockResolvedValue(null);

      await expect(
        userService.createUser({
          email: "test@example.com",
          name: "Test User",
          password: "password123",
          role: "invalid-role",
        }),
      ).rejects.toThrow("Invalid role specified");
    });
  });

  describe("getUserById", () => {
    it("should return user for valid ID", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);

      const result = await userService.getUserById("user_123");

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith("user_123");
    });

    it("should return null for non-existent user", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(null);

      const result = await userService.getUserById("non-existent");

      expect(result).toBeNull();
    });

    it("should throw error for empty ID", async () => {
      await expect(userService.getUserById("")).rejects.toThrow(
        "User ID is required",
      );
    });
  });

  describe("updateUser", () => {
    it("should successfully update user", async () => {
      const updatedUser = { ...mockUser, name: "Updated Name" };
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.getUserByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.updateUser).mockResolvedValue(updatedUser);

      const result = await userService.updateUser("user_123", {
        name: "Updated Name",
      });

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith("user_123", {
        name: "Updated Name",
      });
    });

    it("should throw error if user not found", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(null);

      await expect(
        userService.updateUser("non-existent", { name: "Updated Name" }),
      ).rejects.toThrow("User not found");
    });

    it("should throw error for invalid email format", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);

      await expect(
        userService.updateUser("user_123", { email: "invalid-email" }),
      ).rejects.toThrow("Invalid email format");
    });

    it("should throw error if email is already taken", async () => {
      const otherUser = { ...mockUser, id: "other_user" };
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.getUserByEmail).mockResolvedValue(otherUser);

      await expect(
        userService.updateUser("user_123", { email: "taken@example.com" }),
      ).rejects.toThrow("Email is already taken by another user");
    });
  });

  describe("deleteUser", () => {
    it("should successfully delete user", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.deleteUser).mockResolvedValue();

      await userService.deleteUser("user_123");

      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith("user_123");
    });

    it("should throw error if user not found", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(null);

      await expect(userService.deleteUser("non-existent")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("listUsers", () => {
    it("should return paginated user list", async () => {
      const mockResponse = {
        users: [mockUser],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      };

      vi.mocked(mockUserRepository.listUsers).mockResolvedValue(mockResponse);

      const result = await userService.listUsers({ page: 1, limit: 20 });

      expect(result).toEqual(mockResponse);
      expect(mockUserRepository.listUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
    });

    it("should throw error for invalid limit", async () => {
      await expect(userService.listUsers({ limit: 101 })).rejects.toThrow(
        "Limit must be between 1 and 100",
      );
    });
  });

  describe("assignRoleToUser", () => {
    it("should successfully assign role to user", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockUserRepository.getUserRoles).mockResolvedValue([]);
      vi.mocked(mockUserRepository.assignRoleToUser).mockResolvedValue();

      await userService.assignRoleToUser("user_123", "role_123");

      expect(mockUserRepository.assignRoleToUser).toHaveBeenCalledWith(
        "user_123",
        "role_123",
        undefined,
      );
    });

    it("should throw error if user not found", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(null);

      await expect(
        userService.assignRoleToUser("non-existent", "role_123"),
      ).rejects.toThrow("User not found");
    });

    it("should throw error if role not found", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(null);

      await expect(
        userService.assignRoleToUser("user_123", "non-existent"),
      ).rejects.toThrow("Role not found");
    });

    it("should throw error if user already has role", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(mockRoleRepository.getRoleById).mockResolvedValue(mockRole);
      vi.mocked(mockUserRepository.getUserRoles).mockResolvedValue([mockRole]);

      await expect(
        userService.assignRoleToUser("user_123", "role_123"),
      ).rejects.toThrow("User already has this role");
    });
  });

  describe("removeRoleFromUser", () => {
    it("should successfully remove role from user", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.getUserRoles).mockResolvedValue([mockRole]);
      vi.mocked(mockUserRepository.removeRoleFromUser).mockResolvedValue();

      await userService.removeRoleFromUser("user_123", "role_123");

      expect(mockUserRepository.removeRoleFromUser).toHaveBeenCalledWith(
        "user_123",
        "role_123",
      );
    });

    it("should throw error if user not found", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(null);

      await expect(
        userService.removeRoleFromUser("non-existent", "role_123"),
      ).rejects.toThrow("User not found");
    });

    it("should throw error if user does not have role", async () => {
      vi.mocked(mockUserRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.getUserRoles).mockResolvedValue([]);

      await expect(
        userService.removeRoleFromUser("user_123", "role_123"),
      ).rejects.toThrow("User does not have this role");
    });
  });

  describe("hasPermission", () => {
    it("should return true if user has permission", async () => {
      vi.mocked(mockUserRepository.hasPermission).mockResolvedValue(true);

      const result = await userService.hasPermission(
        "user_123",
        "posts",
        "create",
      );

      expect(result).toBe(true);
      expect(mockUserRepository.hasPermission).toHaveBeenCalledWith(
        "user_123",
        "posts",
        "create",
      );
    });

    it("should return false if user does not have permission", async () => {
      vi.mocked(mockUserRepository.hasPermission).mockResolvedValue(false);

      const result = await userService.hasPermission(
        "user_123",
        "posts",
        "delete",
      );

      expect(result).toBe(false);
    });

    it("should throw error for missing parameters", async () => {
      await expect(
        userService.hasPermission("", "posts", "create"),
      ).rejects.toThrow("User ID is required");
      await expect(
        userService.hasPermission("user_123", "", "create"),
      ).rejects.toThrow("Resource is required");
      await expect(
        userService.hasPermission("user_123", "posts", ""),
      ).rejects.toThrow("Action is required");
    });
  });
});
