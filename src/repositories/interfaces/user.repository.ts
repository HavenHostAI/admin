import type { User, Role, Permission } from "~/types/api";

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}

export interface UserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: "active" | "inactive";
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface UserRepository {
  // User CRUD operations
  createUser(data: CreateUserRequest): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: UpdateUserRequest): Promise<User>;
  deleteUser(id: string): Promise<void>;
  listUsers(filters?: UserListFilters): Promise<UserListResponse>;

  // User role management
  getUserRoles(userId: string): Promise<Role[]>;
  assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy?: string,
  ): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;

  // User permissions
  getUserPermissions(userId: string): Promise<Permission[]>;
  hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean>;

  // User status management
  activateUser(id: string): Promise<void>;
  deactivateUser(id: string): Promise<void>;
}
