import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "@/services/auth.service";
import type { AuthRepository } from "@/repositories/interfaces/auth.repository";
import type { User, Session } from "@/types/openapi";

// Mock repository
const mockAuthRepository: AuthRepository = {
  authenticateUser: vi.fn(),
  createSession: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  deleteSession: vi.fn(),
  generateAccessToken: vi.fn(),
  validateAccessToken: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
};

const mockUser: User = {
  id: "user_123",
  email: "test@example.com",
  name: "Test User",
  image: "",
  role: "viewer",
  is_active: true,
  email_verified: "2024-01-15T10:30:00Z",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

const mockSession: Session = {
  user: mockUser,
  expires: "2024-12-31T23:59:59Z",
};

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockAuthRepository);
  });

  describe("login", () => {
    it("should successfully login with valid credentials", async () => {
      vi.mocked(mockAuthRepository.authenticateUser).mockResolvedValue(mockUser);
      vi.mocked(mockAuthRepository.createSession).mockResolvedValue(mockSession);
      vi.mocked(mockAuthRepository.generateAccessToken).mockReturnValue("mock-token");

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
        access_token: "mock-token",
      });
      expect(mockAuthRepository.authenticateUser).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });

    it("should throw error for invalid email format", async () => {
      await expect(
        authService.login({
          email: "invalid-email",
          password: "password123",
        }),
      ).rejects.toThrow("Invalid email format");
    });

    it("should throw error for short password", async () => {
      await expect(
        authService.login({
          email: "test@example.com",
          password: "short",
        }),
      ).rejects.toThrow("Password must be at least 8 characters long");
    });

    it("should throw error for invalid credentials", async () => {
      vi.mocked(mockAuthRepository.authenticateUser).mockResolvedValue(null);

      await expect(
        authService.login({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error for inactive user", async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      vi.mocked(mockAuthRepository.authenticateUser).mockResolvedValue(inactiveUser);

      await expect(
        authService.login({
          email: "test@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("Account is deactivated");
    });
  });

  describe("logout", () => {
    it("should successfully logout with valid session token", async () => {
      vi.mocked(mockAuthRepository.deleteSession).mockResolvedValue();

      await authService.logout("valid-session-token");

      expect(mockAuthRepository.deleteSession).toHaveBeenCalledWith("valid-session-token");
    });

    it("should throw error for missing session token", async () => {
      await expect(authService.logout("")).rejects.toThrow("Session token is required");
    });
  });

  describe("getSession", () => {
    it("should return session for valid token", async () => {
      vi.mocked(mockAuthRepository.getSession).mockResolvedValue(mockSession);

      const result = await authService.getSession("valid-token");

      expect(result).toEqual(mockSession);
      expect(mockAuthRepository.getSession).toHaveBeenCalledWith("valid-token");
    });

    it("should return null for invalid token", async () => {
      vi.mocked(mockAuthRepository.getSession).mockResolvedValue(null);

      const result = await authService.getSession("invalid-token");

      expect(result).toBeNull();
    });

    it("should return null for empty token", async () => {
      const result = await authService.getSession("");

      expect(result).toBeNull();
    });
  });

  describe("refreshToken", () => {
    it("should refresh token for valid session", async () => {
      vi.mocked(mockAuthRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockAuthRepository.generateAccessToken).mockReturnValue("new-token");

      const result = await authService.refreshToken("valid-session-token");

      expect(result).toEqual({ access_token: "new-token" });
    });

    it("should throw error for invalid session", async () => {
      vi.mocked(mockAuthRepository.getSession).mockResolvedValue(null);

      await expect(authService.refreshToken("invalid-token")).rejects.toThrow("Invalid session");
    });
  });

  describe("validateToken", () => {
    it("should return user for valid token", async () => {
      vi.mocked(mockAuthRepository.validateAccessToken).mockResolvedValue(mockUser);

      const result = await authService.validateToken("valid-token");

      expect(result).toEqual(mockUser);
    });

    it("should return null for invalid token", async () => {
      vi.mocked(mockAuthRepository.validateAccessToken).mockResolvedValue(null);

      const result = await authService.validateToken("invalid-token");

      expect(result).toBeNull();
    });

    it("should return null for empty token", async () => {
      const result = await authService.validateToken("");

      expect(result).toBeNull();
    });
  });
});
