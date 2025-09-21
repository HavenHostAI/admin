import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Polyfills for Radix components in JSDOM
if (typeof HTMLElement !== "undefined") {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
}

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock tRPC
const mockRefetch = vi.fn();
const mockMutate = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock("~/trpc/react", () => ({
  api: {
    property: {
      list: {
        useQuery: vi.fn(() => ({
          data: {
            properties: [
              {
                id: "1",
                name: "Test Server",
                description: "A test server",
                type: "server",
                status: "active",
                configuration: {},
                owner_id: "user1",
                is_active: true,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
          },
          isLoading: false,
          error: null,
          refetch: mockRefetch,
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutate: mockMutate,
          isPending: false,
          error: null,
        })),
      },
      update: {
        useMutation: vi.fn(() => ({
          mutate: mockMutate,
          isPending: false,
          error: null,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutateAsync: mockMutateAsync,
        })),
      },
    },
  },
}));

// Mock environment variables
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.AUTH_SECRET = "test-secret";

type DeleteBuilder = {
  where: (...args: unknown[]) => Promise<void>;
};

interface TestContext {
  db: {
    delete: (...args: unknown[]) => DeleteBuilder;
  };
  schema: Record<string, Record<string, { isNotNull: () => void }>>;
  cleanup: () => Promise<void>;
}

const noopAsync = async () => undefined;

export const createTestContext = (): TestContext => {
  const deleteBuilder: DeleteBuilder = {
    where: noopAsync,
  };

  const schema = new Proxy(
    {},
    {
      get: () =>
        new Proxy(
          {},
          {
            get: () => ({
              isNotNull: () => ({}),
            }),
          },
        ),
    },
  ) as TestContext["schema"];

  return {
    db: {
      delete: () => ({ ...deleteBuilder }),
    },
    schema,
    cleanup: noopAsync,
  };
};
