export const mockPost = {
  id: 1,
  name: "Test Post",
  createdById: "user_123",
  createdAt: new Date("2024-01-15T10:30:00Z"),
  updatedAt: new Date("2024-01-15T10:30:00Z"),
};

export const mockPosts = [
  mockPost,
  {
    id: 2,
    name: "Another Post",
    createdById: "user_456",
    createdAt: new Date("2024-01-14T09:15:00Z"),
    updatedAt: new Date("2024-01-14T09:15:00Z"),
  },
  {
    id: 3,
    name: "Third Post",
    createdById: "user_123",
    createdAt: new Date("2024-01-13T14:20:00Z"),
    updatedAt: new Date("2024-01-13T14:20:00Z"),
  },
];
