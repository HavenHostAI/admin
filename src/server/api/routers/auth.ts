import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { AuthService } from "../../../services/auth.service";
import { createRepositories } from "../../../repositories";
import { validateUserRole } from "@/lib/constants";
import type { LoginResponse, Session } from "../../../types/api";

// Factory function for creating auth service instances
const createAuthService = () => {
  const repositories = createRepositories();
  return new AuthService(
    repositories.authRepository,
    repositories.userRepository,
  );
};

type SessionUserInput = {
  id: string;
  role?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

const mapSessionUserToApiUser = (
  sessionUser: SessionUserInput,
): Session["user"] => {
  const role = validateUserRole(sessionUser.role);

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? "",
    name: sessionUser.name ?? "",
    image: sessionUser.image ?? undefined,
    role,
    is_active: true,
    email_verified: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

// Zod schemas that match OpenAPI spec
const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const authRouter = createTRPCRouter({
  login: publicProcedure.input(LoginSchema).mutation(async ({ input }) => {
    const authService = createAuthService();
    return (await authService.login(input)) satisfies LoginResponse;
  }),

  logout: protectedProcedure
    .input(z.object({ sessionToken: z.string().optional() }).optional())
    .mutation(async ({ input }) => {
      const authService = createAuthService();
      const sessionToken = input?.sessionToken;
      if (sessionToken) {
        await authService.logout(sessionToken);
      }
      return { message: "Logged out successfully" } as const;
    }),

  session: protectedProcedure
    .input(z.object({ sessionToken: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const authService = createAuthService();
      const sessionToken = input?.sessionToken;
      if (sessionToken) {
        const session = await authService.getSession(sessionToken);
        if (!session) {
          throw new Error("Session not found or expired");
        }

        return session satisfies Session;
      }

      if (!ctx.session?.user) {
        throw new Error("No active session found");
      }

      return {
        user: mapSessionUserToApiUser(ctx.session.user as SessionUserInput),
        expires: ctx.session.expires ?? new Date().toISOString(),
      } satisfies Session;
    }),

  refresh: protectedProcedure
    .input(z.object({ sessionToken: z.string().optional() }).optional())
    .mutation(async ({ input }) => {
      const authService = createAuthService();
      const sessionToken = input?.sessionToken;
      if (!sessionToken) {
        throw new Error("Session token is required to refresh");
      }

      return await authService.refreshToken(sessionToken);
    }),

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
