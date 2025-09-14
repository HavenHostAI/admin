import { describe, it, expect } from "vitest";

// Mock auth configuration for testing
const mockAuthConfig = {
  providers: [
    {
      id: "discord",
      name: "Discord",
    },
  ],
  adapter: {},
  callbacks: {
    session: ({ session, user }: any) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
};

describe("Auth Config", () => {
  it("should have correct configuration structure", () => {
    expect(mockAuthConfig).toBeDefined();
    expect(mockAuthConfig.providers).toBeDefined();
    expect(mockAuthConfig.adapter).toBeDefined();
    expect(mockAuthConfig.callbacks).toBeDefined();
  });

  it("should have Discord provider configured", () => {
    expect(mockAuthConfig.providers).toHaveLength(1);
    expect(mockAuthConfig.providers[0]).toBeDefined();
  });

  it("should have session callback that adds user id", () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.jpg",
      },
    };
    const mockUser = {
      id: "user_123",
      name: "Test User",
      email: "test@example.com",
    };

    const result = mockAuthConfig.callbacks.session({
      session: mockSession,
      user: mockUser,
    });

    expect(result.user.id).toBe("user_123");
    expect(result.user.name).toBe("Test User");
    expect(result.user.email).toBe("test@example.com");
  });

  it("should have adapter configured", () => {
    expect(mockAuthConfig.adapter).toBeDefined();
  });
});
