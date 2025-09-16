import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { RoleService, PermissionService } from "~/services/role.service";
import { createRepositories } from "~/repositories";

// Lazy initialization of services to avoid environment variable issues during import
const getServices = () => {
  const repositories = createRepositories();
  return {
    roleService: new RoleService(
      repositories.roleRepository,
      repositories.permissionRepository,
    ),
    permissionService: new PermissionService(repositories.permissionRepository),
  };
};

export const roleRouter = createTRPCRouter({
  // Role CRUD operations
  create: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, "Role name is required")
          .max(100, "Role name too long"),
        description: z
          .string()
          .min(1, "Description is required")
          .max(500, "Description too long"),
        permissions: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { roleService } = getServices();
      return await roleService.createRole(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { roleService } = getServices();
      return await roleService.getRoleById(input.id);
    }),

  getByName: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const { roleService } = getServices();
      return await roleService.getRoleByName(input.name);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().min(1).max(500).optional(),
        permissions: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { roleService } = getServices();
      const { id, ...updateData } = input;
      return await roleService.updateRole(id, updateData);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { roleService } = getServices();
      await roleService.deleteRole(input.id);
      return { success: true, message: "Role deleted successfully" };
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(20),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { roleService } = getServices();
      return await roleService.listRoles(input);
    }),

  // Role permission management
  getPermissions: protectedProcedure
    .input(z.object({ roleId: z.string() }))
    .query(async ({ input }) => {
      const { roleService } = getServices();
      return await roleService.getRolePermissions(input.roleId);
    }),

  assignPermission: protectedProcedure
    .input(
      z.object({
        roleId: z.string(),
        permissionId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { roleService } = getServices();
      await roleService.assignPermissionToRole(
        input.roleId,
        input.permissionId,
        ctx.session?.user?.id,
      );
      return { success: true, message: "Permission assigned successfully" };
    }),

  removePermission: protectedProcedure
    .input(
      z.object({
        roleId: z.string(),
        permissionId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { roleService } = getServices();
      await roleService.removePermissionFromRole(
        input.roleId,
        input.permissionId,
      );
      return { success: true, message: "Permission removed successfully" };
    }),

  // Role user management
  getUsers: protectedProcedure
    .input(z.object({ roleId: z.string() }))
    .query(async ({ input }) => {
      const { roleService } = getServices();
      return await roleService.getRoleUsers(input.roleId);
    }),

  canDelete: protectedProcedure
    .input(z.object({ roleId: z.string() }))
    .query(async ({ input }) => {
      const { roleService } = getServices();
      return await roleService.canDeleteRole(input.roleId);
    }),
});

export const permissionRouter = createTRPCRouter({
  // Permission operations
  getAll: protectedProcedure.query(async () => {
    const { permissionService } = getServices();
    return await permissionService.getAllPermissions();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { permissionService } = getServices();
      return await permissionService.getPermissionById(input.id);
    }),

  getByResourceAndAction: protectedProcedure
    .input(
      z.object({
        resource: z.string(),
        action: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { permissionService } = getServices();
      return await permissionService.getPermissionByResourceAndAction(
        input.resource,
        input.action,
      );
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, "Permission name is required")
          .max(100, "Permission name too long"),
        resource: z
          .string()
          .min(1, "Resource is required")
          .max(50, "Resource name too long"),
        action: z
          .string()
          .min(1, "Action is required")
          .max(20, "Action name too long"),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { permissionService } = getServices();
      return await permissionService.createPermission(input);
    }),
});
