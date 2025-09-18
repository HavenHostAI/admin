import { DrizzleAuthRepository } from "./implementations/drizzle-auth.repository";
import { DrizzleUserRepository } from "./implementations/drizzle-user.repository";
import {
  DrizzleRoleRepository,
  DrizzlePermissionRepository,
} from "./implementations/drizzle-role.repository";
import { DrizzlePropertyRepository } from "./implementations/drizzle-property.repository";

// Export types
export type { AuthRepository } from "./interfaces/auth.repository";
export type { UserRepository } from "./interfaces/user.repository";
export type {
  RoleRepository,
  PermissionRepository,
} from "./interfaces/role.repository";
export type { PropertyRepository } from "./interfaces/property.repository";

// Factory function for creating repositories
export const createRepositories = () => ({
  authRepository: new DrizzleAuthRepository(),
  userRepository: new DrizzleUserRepository(),
  roleRepository: new DrizzleRoleRepository(),
  permissionRepository: new DrizzlePermissionRepository(),
  propertyRepository: new DrizzlePropertyRepository(),
});

// Type for repository container
export type Repositories = ReturnType<typeof createRepositories>;
