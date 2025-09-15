import { eq } from "drizzle-orm";
import { db } from "../../server/db";
import { users, sessions } from "../../server/db/schema";
import type { AuthRepository, LoginRequest, LoginResponse } from "../interfaces/auth.repository";
import type { User, Session } from "../../types/openapi";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class DrizzleAuthRepository implements AuthRepository {
  private readonly JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";
  private readonly JWT_EXPIRES_IN = "7d";

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return null;
    }

    // In a real implementation, you would hash and compare passwords
    // For now, we'll use a simple comparison for demo purposes
    // TODO: Implement proper password hashing with bcrypt
    const isValidPassword = password === "demo-password"; // Replace with actual password check

    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || "",
      image: user.image || "",
      role: "viewer" as const,
      is_active: true,
      email_verified: user.emailVerified?.toISOString() || null,
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  async createSession(userId: string): Promise<Session> {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days

    const sessionToken = crypto.randomUUID();

    await db.insert(sessions).values({
      sessionToken,
      userId,
      expires,
    });

    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      user,
      expires: expires.toISOString(),
    };
  }

  async getSession(sessionToken: string): Promise<Session | null> {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.sessionToken, sessionToken),
      with: {
        user: true,
      },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || "",
        image: session.user.image || "",
        role: "viewer" as const,
        is_active: true,
        email_verified: session.user.emailVerified?.toISOString() || null,
        created_at: session.user.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: session.user.updatedAt?.toISOString() || new Date().toISOString(),
      },
      expires: session.expires.toISOString(),
    };
  }

  async refreshSession(sessionToken: string): Promise<Session | null> {
    const session = await this.getSession(sessionToken);
    if (!session) {
      return null;
    }

    // Create a new session
    return await this.createSession(session.user.id);
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
  }

  generateAccessToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  async validateAccessToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return await this.getUserById(decoded.userId);
    } catch {
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || "",
      image: user.image || "",
      role: "viewer" as const,
      is_active: true,
      email_verified: user.emailVerified?.toISOString() || null,
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || "",
      image: user.image || "",
      role: "viewer" as const,
      is_active: true,
      email_verified: user.emailVerified?.toISOString() || null,
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
