import type { AuthRepository, LoginRequest, LoginResponse } from "../repositories/interfaces/auth.repository";
import type { User, Session } from "../types/openapi";

export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Business rule: Validate email format
    if (!this.isValidEmail(credentials.email)) {
      throw new Error("Invalid email format");
    }

    // Business rule: Validate password strength
    if (!this.isValidPassword(credentials.password)) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Business rule: Authenticate user
    const user = await this.authRepository.authenticateUser(
      credentials.email,
      credentials.password,
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Business rule: Check if user is active
    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    // Business rule: Create session
    const session = await this.authRepository.createSession(user.id);

    // Business rule: Generate access token
    const access_token = this.authRepository.generateAccessToken(user);

    return {
      user,
      session,
      access_token,
    };
  }

  async logout(sessionToken: string): Promise<void> {
    // Business rule: Validate session token
    if (!sessionToken) {
      throw new Error("Session token is required");
    }

    // Business rule: Delete session
    await this.authRepository.deleteSession(sessionToken);
  }

  async getSession(sessionToken: string): Promise<Session | null> {
    if (!sessionToken) {
      return null;
    }

    return await this.authRepository.getSession(sessionToken);
  }

  async refreshToken(sessionToken: string): Promise<{ access_token: string }> {
    // Business rule: Validate session exists
    const session = await this.authRepository.getSession(sessionToken);
    if (!session) {
      throw new Error("Invalid session");
    }

    // Business rule: Generate new token
    const access_token = this.authRepository.generateAccessToken(session.user);

    return { access_token };
  }

  async validateToken(accessToken: string): Promise<User | null> {
    if (!accessToken) {
      return null;
    }

    return await this.authRepository.validateAccessToken(accessToken);
  }

  // Private business logic methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }
}
