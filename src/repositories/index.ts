import { DrizzleAuthRepository } from "./implementations/drizzle-auth.repository";

// Factory function for creating repositories
export const createRepositories = () => ({
  authRepository: new DrizzleAuthRepository(),
});

// Type for repository container
export type Repositories = ReturnType<typeof createRepositories>;
