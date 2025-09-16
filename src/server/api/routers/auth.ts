import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { AuthService } from "../../../services/auth.service";
import { createRepositories } from "../../../repositories";
import type {
  LoginRequest,
  LoginResponse,
  Session,
} from "../../../types/openapi";

// Factory function for creating auth service instances
const createAuthService = () => {
  const repositories = createRepositories();
  return new AuthService(
    repositories.authRepository,
    repositories.userRepository,
    repositories.roleRepository,
  );
};

// Zod schemas that match OpenAPI spec
const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input }): Promise<LoginResponse> => {
      const authService = createAuthService();
      return await authService.login(input);
    }),

  logout: protectedProcedure.mutation(
    async ({ ctx }): Promise<{ message: string }> => {
      // Extract session token from context (this would need to be implemented)
      const sessionToken = ctx.session?.sessionToken;
      if (!sessionToken) {
        throw new Error("No active session found");
      }

      const authService = createAuthService();
      await authService.logout(sessionToken);
      return { message: "Logged out successfully" };
    },
  ),

  session: protectedProcedure.query(async ({ ctx }): Promise<Session> => {
    // Extract session token from context
    const sessionToken = ctx.session?.sessionToken;
    if (!sessionToken) {
      throw new Error("No active session found");
    }

    const authService = createAuthService();
    const session = await authService.getSession(sessionToken);
    if (!session) {
      throw new Error("Session not found or expired");
    }

    return session;
  }),

  refresh: protectedProcedure.mutation(
    async ({ ctx }): Promise<{ access_token: string }> => {
      // Extract session token from context
      const sessionToken = ctx.session?.sessionToken;
      if (!sessionToken) {
        throw new Error("No active session found");
      }

      const authService = createAuthService();
      return await authService.refreshToken(sessionToken);
    },
  ),

  // Role-based access control procedures
  getUserRoles: protectedProcedure.query(async ({ ctx }): Promise<string[]> => {
    if (!ctx.session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const authService = createAuthService();
    return await authService.getUserRoles(ctx.session.user.id);
  }),

  hasRole: protectedProcedure
    .input(z.object({ roleName: z.string() }))
    .query(async ({ ctx, input }): Promise<boolean> => {
      if (!ctx.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const authService = createAuthService();
      return await authService.hasRole(ctx.session.user.id, input.roleName);
    }),

  hasPermission: protectedProcedure
    .input(
      z.object({
        resource: z.string(),
        action: z.string(),
      }),
    )
    .query(async ({ ctx, input }): Promise<boolean> => {
      if (!ctx.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const authService = createAuthService();
      return await authService.hasPermission(
        ctx.session.user.id,
        input.resource,
        input.action,
      );
    }),

  hasAnyRole: protectedProcedure
    .input(z.object({ roleNames: z.array(z.string()) }))
    .query(async ({ ctx, input }): Promise<boolean> => {
      if (!ctx.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const authService = createAuthService();
      return await authService.hasAnyRole(ctx.session.user.id, input.roleNames);
    }),

  hasAllRoles: protectedProcedure
    .input(z.object({ roleNames: z.array(z.string()) }))
    .query(async ({ ctx, input }): Promise<boolean> => {
      if (!ctx.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const authService = createAuthService();
      return await authService.hasAllRoles(
        ctx.session.user.id,
        input.roleNames,
      );
    }),

  canAccessResource: protectedProcedure
    .input(
      z.object({
        resource: z.string(),
        action: z.string(),
      }),
    )
    .query(async ({ ctx, input }): Promise<boolean> => {
      if (!ctx.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const authService = createAuthService();
      return await authService.canAccessResource(
        ctx.session.user.id,
        input.resource,
        input.action,
      );
    }),
});
