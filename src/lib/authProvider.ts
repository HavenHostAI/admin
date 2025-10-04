import type { AuthProvider } from "ra-core";
import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { resolveConvexUrl } from "./convexUrl";
import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  loadStoredUser,
  saveStoredUser,
  setStoredToken,
} from "./authStorage";

type StoredAuthUser = {
  id?: string | null;
  _id?: string | null;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string | null;
  status?: string | null;
  companyId?: Id<"companies"> | null;
};

let client: ConvexHttpClient | null = null;

const getClient = () => {
  const convexUrl = resolveConvexUrl(
    "VITE_CONVEX_URL must be defined to enable authentication in the admin UI.",
  );

  if (!client) {
    client = new ConvexHttpClient(convexUrl);
  }

  return client;
};

export const authProvider: AuthProvider = {
  async login({ email, password }) {
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
        const convex = getClient();
        await convex.action(api.auth.signOut, { token });
      } catch (error) {
        console.warn("Failed to revoke session", error);
      }
    }
    clearStoredToken();
    clearStoredUser();
  },

  async checkAuth() {
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
      return null;
    }

    const id = user.id ?? user._id ?? undefined;
    if (!id) {
      throw new Error("User identity is not available");
    }

    const { email, name, image, role, status, companyId } = user;
    const typedCompanyId = companyId ?? undefined;

    return {
      id,
      fullName: name ?? email,
      avatar: image ?? undefined,
      email,
      name: name ?? undefined,
      image: image ?? undefined,
      role: role ?? undefined,
      status: status ?? undefined,
      companyId: typedCompanyId,
    };
  },
};
