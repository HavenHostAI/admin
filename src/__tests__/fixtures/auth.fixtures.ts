export const mockUser = {
  id: "user_123",
  name: "Test User",
  email: "test@example.com",
  image: "https://example.com/avatar.jpg",
  emailVerified: new Date("2024-01-01T00:00:00Z"),
};

export const mockSession = {
  user: mockUser,
  expires: new Date("2024-12-31T23:59:59Z").toISOString(),
};

export const mockAccount = {
  userId: mockUser.id,
  type: "oauth" as const,
  provider: "discord",
  providerAccountId: "discord_123",
  access_token: "access_token_123",
  refresh_token: "refresh_token_123",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "Bearer",
  scope: "identify email",
};
