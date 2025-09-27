import type { AuthProvider } from "ra-core";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const TOKEN_KEY = "better-auth:token";
const USER_KEY = "better-auth:user";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

const missingConvexUrlError = () => {
  const error = new Error(
    "VITE_CONVEX_URL must be defined to enable authentication in the admin UI.",
  );

  if (import.meta.env.DEV) {
    console.error(error.message);
  }

  return error;
};

let client: ConvexHttpClient | null = null;

const getClient = () => {
  if (!convexUrl) {
    throw missingConvexUrlError();
  }

  if (!client) {
    client = new ConvexHttpClient(convexUrl);
  }

  return client;
};

const persistUser = (user: unknown) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to persist user", error);
  }
};

const loadUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to parse persisted user", error);
    return null;
  }
};

export const authProvider: AuthProvider = {
  async login({ email, password }) {
    if (!convexUrl) {
      return Promise.reject(missingConvexUrlError());
    }

    const convex = getClient();
    const result = await convex.action(api.auth.signIn, {
      email,
      password,
    });
    localStorage.setItem(TOKEN_KEY, result.token);
    persistUser(result.user);
  },

  async logout() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        if (convexUrl) {
          const convex = getClient();
          await convex.action(api.auth.signOut, { token });
        }
      } catch (error) {
        console.warn("Failed to revoke session", error);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async checkAuth() {
    if (!convexUrl) {
      return Promise.reject(missingConvexUrlError());
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("Not authenticated");
    }
    const convex = getClient();
    const session = await convex.action(api.auth.validateSession, { token });
    if (!session) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      throw new Error("Session expired");
    }
    persistUser(session.user);
  },

  async checkError() {
    return;
  },

  async getPermissions() {
    const user = loadUser();
    return user?.role ?? null;
  },

  async getIdentity() {
    const user = loadUser();
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.name ?? user.email,
      avatar: user.image ?? null,
      ...user,
    };
  },
};
