import { eq, and, or, like, count, desc, asc } from "drizzle-orm";
import { db } from "../../server/db";
import {
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
} from "../../server/db/schema";
import type {
  UserRepository,
  CreateUserRequest,
  UpdateUserRequest,
  UserListFilters,
  UserListResponse,
} from "../interfaces/user.repository";
import type { User, Role, Permission } from "~/types/openapi";
import bcrypt from "bcryptjs";

// Extended user type that includes the new database fields
type DrizzleUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  password: string;
  role: string | null;
  is_active: boolean | null;
  emailVerified: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

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

export class DrizzleUserRepository implements UserRepository {
  private readonly DEFAULT_ROLE: User["role"] = "viewer";
  private readonly DEFAULT_PAGE_SIZE = 20;

  private mapDrizzleUserToUser(drizzleUser: DrizzleUser): User {
    return {
      id: drizzleUser.id,
      email: drizzleUser.email,
      name: drizzleUser.name ?? "",
      image: drizzleUser.image ?? "",
      role: (drizzleUser.role as User["role"]) ?? this.DEFAULT_ROLE,
      is_active: drizzleUser.is_active ?? true,
      email_verified: drizzleUser.emailVerified?.toISOString() ?? null,
      created_at:
        drizzleUser.created_at?.toISOString() ?? new Date().toISOString(),
      updated_at:
        drizzleUser.updated_at?.toISOString() ?? new Date().toISOString(),
    };
  }

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

  async createUser(data: CreateUserRequest): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role ?? this.DEFAULT_ROLE,
        is_active: data.is_active ?? true,
      })
      .returning();

    return this.mapDrizzleUserToUser(newUser as DrizzleUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return null;
    }

    return this.mapDrizzleUserToUser(user as DrizzleUser);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return null;
    }

    return this.mapDrizzleUserToUser(user as DrizzleUser);
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const updateData: Partial<DrizzleUser> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return this.mapDrizzleUserToUser(updatedUser as DrizzleUser);
  }

  async deleteUser(id: string): Promise<void> {
    // Soft delete by deactivating the user
    await db.update(users).set({ is_active: false }).where(eq(users.id, id));
  }

  async listUsers(filters: UserListFilters = {}): Promise<UserListResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? this.DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    if (filters.search) {
      whereConditions.push(
        or(
          like(users.name, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`),
        ),
      );
    }

    if (filters.role) {
      whereConditions.push(eq(users.role, filters.role));
    }

    if (filters.status) {
      const isActive = filters.status === "active";
      whereConditions.push(eq(users.is_active, isActive));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const total = totalResult?.count ?? 0;

    // Get users
    const userList = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.created_at))
      .limit(limit)
      .offset(offset);

    const mappedUsers = userList.map((user) =>
      this.mapDrizzleUserToUser(user as DrizzleUser),
    );

    return {
      users: mappedUsers,
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

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRolesList = await db
      .select({
        role: roles,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.role_id, roles.id))
      .where(eq(userRoles.user_id, userId));

    return userRolesList.map((item) =>
      this.mapDrizzleRoleToRole(item.role as DrizzleRole),
    );
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy?: string,
  ): Promise<void> {
    await db.insert(userRoles).values({
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.user_id, userId), eq(userRoles.role_id, roleId)));
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userPermissions = await db
      .select({
        permission: permissions,
      })
      .from(userRoles)
      .innerJoin(
        rolePermissions,
        eq(userRoles.role_id, rolePermissions.role_id),
      )
      .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
      .where(eq(userRoles.user_id, userId));

    return userPermissions.map((item) =>
      this.mapDrizzlePermissionToPermission(
        item.permission as DrizzlePermission,
      ),
    );
  }

  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const permission = await db
      .select({ id: permissions.id })
      .from(userRoles)
      .innerJoin(
        rolePermissions,
        eq(userRoles.role_id, rolePermissions.role_id),
      )
      .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
      .where(
        and(
          eq(userRoles.user_id, userId),
          eq(permissions.resource, resource),
          eq(permissions.action, action),
        ),
      )
      .limit(1);

    return permission.length > 0;
  }

  async activateUser(id: string): Promise<void> {
    await db.update(users).set({ is_active: true }).where(eq(users.id, id));
  }

  async deactivateUser(id: string): Promise<void> {
    await db.update(users).set({ is_active: false }).where(eq(users.id, id));
  }
}
