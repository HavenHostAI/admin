import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { AuthService } from "../../../services/auth.service";
import { DrizzleAuthRepository } from "../../../repositories/implementations/drizzle-auth.repository";
import type { LoginRequest, LoginResponse, Session } from "../../../types/openapi";

// Create repository and service instances
const authRepository = new DrizzleAuthRepository();
const authService = new AuthService(authRepository);

// Zod schemas that match OpenAPI spec
const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input }): Promise<LoginResponse> => {
      return await authService.login(input);
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }): Promise<{ message: string }> => {
      // Extract session token from context (this would need to be implemented)
      const sessionToken = ctx.session?.sessionToken;
      if (!sessionToken) {
        throw new Error("No active session found");
      }

      await authService.logout(sessionToken);
      return { message: "Logged out successfully" };
    }),

  session: protectedProcedure
    .query(async ({ ctx }): Promise<Session> => {
      // Extract session token from context
      const sessionToken = ctx.session?.sessionToken;
      if (!sessionToken) {
        throw new Error("No active session found");
      }

      const session = await authService.getSession(sessionToken);
      if (!session) {
        throw new Error("Session not found or expired");
      }

      return session;
    }),

  refresh: protectedProcedure
    .mutation(async ({ ctx }): Promise<{ access_token: string }> => {
      // Extract session token from context
      const sessionToken = ctx.session?.sessionToken;
      if (!sessionToken) {
        throw new Error("No active session found");
      }

      return await authService.refreshToken(sessionToken);
    }),
});
