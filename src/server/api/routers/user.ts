import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { UserService } from "~/services/user.service";
import { RoleService } from "~/services/role.service";
import { createRepositories } from "~/repositories";

// Lazy initialization of services to avoid environment variable issues during import
const getServices = () => {
  const repositories = createRepositories();
  return {
    userService: new UserService(
      repositories.userRepository,
      repositories.roleRepository,
    ),
    roleService: new RoleService(
      repositories.roleRepository,
      repositories.permissionRepository,
    ),
  };
};

export const userRouter = createTRPCRouter({
  // User CRUD operations
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email format"),
        name: z.string().min(1, "Name is required").max(255, "Name too long"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.string().optional(),
        is_active: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const { userService } = getServices();
      return await userService.createUser(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { userService } = getServices();
      return await userService.getUserById(input.id);
    }),

  getByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const { userService } = getServices();
      return await userService.getUserByEmail(input.email);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
        role: z.string().optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userService } = getServices();
      const { id, ...updateData } = input;
      return await userService.updateUser(id, updateData);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { userService } = getServices();
      await userService.deleteUser(input.id);
      return { success: true, message: "User deleted successfully" };
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(20),
        search: z.string().optional(),
        role: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { userService } = getServices();
      return await userService.listUsers(input);
    }),

  // User role management
  getRoles: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const { userService } = getServices();
      return await userService.getUserRoles(input.userId);
    }),

  assignRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        roleId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userService } = getServices();
      await userService.assignRoleToUser(
        input.userId,
        input.roleId,
        ctx.session?.user?.id,
      );
      return { success: true, message: "Role assigned successfully" };
    }),

  removeRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        roleId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userService } = getServices();
      await userService.removeRoleFromUser(input.userId, input.roleId);
      return { success: true, message: "Role removed successfully" };
    }),

  // User permissions
  getPermissions: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const { userService } = getServices();
      return await userService.getUserPermissions(input.userId);
    }),

  hasPermission: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        resource: z.string(),
        action: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { userService } = getServices();
      return await userService.hasPermission(
        input.userId,
        input.resource,
        input.action,
      );
    }),

  // User status management
  activate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { userService } = getServices();
      await userService.activateUser(input.id);
      return { success: true, message: "User activated successfully" };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { userService } = getServices();
      await userService.deactivateUser(input.id);
      return { success: true, message: "User deactivated successfully" };
    }),
});
