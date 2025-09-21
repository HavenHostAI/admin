import type {
  UserRepository,
  CreateUserRequest,
  UpdateUserRequest,
  UserListFilters,
  UserListResponse,
} from "~/repositories/interfaces/user.repository";
import type { RoleRepository } from "~/repositories/interfaces/role.repository";
import type { User, Role, Permission } from "~/types/api";

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
  ) {}

  async createUser(data: CreateUserRequest): Promise<User> {
    // Business rule: Validate email format
    if (!this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    // Business rule: Validate password strength
    if (!this.isValidPassword(data.password)) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Business rule: Check if email already exists
    const existingUser = await this.userRepository.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Business rule: Validate role if provided
    if (data.role) {
      const role = await this.roleRepository.getRoleByName(data.role);
      if (!role) {
        throw new Error("Invalid role specified");
      }
    }

    return await this.userRepository.createUser(data);
  }

  async getUserById(id: string): Promise<User | null> {
    if (!id) {
      throw new Error("User ID is required");
    }

    return await this.userRepository.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error("Email is required");
    }

    return await this.userRepository.getUserByEmail(email);
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Business rule: Check if user exists
    const existingUser = await this.userRepository.getUserById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Business rule: Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    // Business rule: Check if email is already taken by another user
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.getUserByEmail(
        data.email,
      );
      if (userWithEmail && userWithEmail.id !== id) {
        throw new Error("Email is already taken by another user");
      }
    }

    // Business rule: Validate role if provided
    if (data.role) {
      const role = await this.roleRepository.getRoleByName(data.role);
      if (!role) {
        throw new Error("Invalid role specified");
      }
    }

    return await this.userRepository.updateUser(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Business rule: Check if user exists
    const existingUser = await this.userRepository.getUserById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Business rule: Prevent self-deletion (this would be checked at the API level with current user context)
    // For now, we'll just deactivate the user
    await this.userRepository.deleteUser(id);
  }

  async listUsers(filters: UserListFilters = {}): Promise<UserListResponse> {
    // Business rule: Validate pagination parameters
    if (filters.page && filters.page < 1) {
      throw new Error("Page must be greater than 0");
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      throw new Error("Limit must be between 1 and 100");
    }

    return await this.userRepository.listUsers(filters);
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Business rule: Check if user exists
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await this.userRepository.getUserRoles(userId);
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy?: string,
  ): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!roleId) {
      throw new Error("Role ID is required");
    }

    // Business rule: Check if user exists
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Business rule: Check if role exists
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Business rule: Check if user already has this role
    const userRoles = await this.userRepository.getUserRoles(userId);
    const hasRole = userRoles.some((r) => r.id === roleId);
    if (hasRole) {
      throw new Error("User already has this role");
    }

    await this.userRepository.assignRoleToUser(userId, roleId, assignedBy);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!roleId) {
      throw new Error("Role ID is required");
    }

    // Business rule: Check if user exists
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Business rule: Check if user has this role
    const userRoles = await this.userRepository.getUserRoles(userId);
    const hasRole = userRoles.some((r) => r.id === roleId);
    if (!hasRole) {
      throw new Error("User does not have this role");
    }

    await this.userRepository.removeRoleFromUser(userId, roleId);
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Business rule: Check if user exists
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await this.userRepository.getUserPermissions(userId);
  }

  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!resource) {
      throw new Error("Resource is required");
    }

    if (!action) {
      throw new Error("Action is required");
    }

    return await this.userRepository.hasPermission(userId, resource, action);
  }

  async activateUser(id: string): Promise<void> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Business rule: Check if user exists
    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new Error("User not found");
    }

    await this.userRepository.activateUser(id);
  }

  async deactivateUser(id: string): Promise<void> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Business rule: Check if user exists
    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new Error("User not found");
    }

    await this.userRepository.deactivateUser(id);
  }

  // Private validation methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }
}
