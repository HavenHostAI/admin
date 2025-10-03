import type { AuthProvider } from "ra-core";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  loadStoredUser,
  saveStoredUser,
  setStoredToken,
} from "./authStorage";

type StoredAuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string | null;
  status?: string | null;
  companyId?: string | null;
};

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
    setStoredToken(result.token);
    saveStoredUser(result.user);
  },

  async logout() {
    const token = getStoredToken();
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
    clearStoredToken();
    clearStoredUser();
  },

  async checkAuth() {
    if (!convexUrl) {
      return Promise.reject(missingConvexUrlError());
    }

    const token = getStoredToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
    const convex = getClient();
    const session = await convex.action(api.auth.validateSession, { token });
    if (!session) {
      clearStoredToken();
      clearStoredUser();
      throw new Error("Session expired");
    }
    saveStoredUser(session.user);
  },

  async checkError() {
    return;
  },

  async getPermissions() {
    const user = loadStoredUser<StoredAuthUser>();
    return user?.role ?? null;
  },

  async getIdentity() {
    const user = loadStoredUser<StoredAuthUser>();
    if (!user) {
      throw new Error("User identity is not available");
    }

    const { id, email, name, image, role, status, companyId } = user;

    return {
      id,
      fullName: name ?? email,
      avatar: image ?? undefined,
      email,
      name: name ?? undefined,
      image: image ?? undefined,
      role: role ?? undefined,
      status: status ?? undefined,
      companyId: companyId ?? undefined,
    };
  },
};
