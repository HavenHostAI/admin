import type { User, Session } from "~/types/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthRepository {
  // User authentication
  authenticateUser(email: string, password: string): Promise<User | null>;

  // Session management
  createSession(userId: string): Promise<Session>;
  getSession(sessionToken: string): Promise<Session | null>;
  refreshSession(sessionToken: string): Promise<Session | null>;
  deleteSession(sessionToken: string): Promise<void>;

  // Token management
  generateAccessToken(user: User): string;
  validateAccessToken(token: string): Promise<User | null>;

  // User lookup
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
}
