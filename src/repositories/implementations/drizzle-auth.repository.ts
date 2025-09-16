import { eq } from "drizzle-orm";
import { db } from "../../server/db";
import { users, sessions } from "../../server/db/schema";
import type { AuthRepository } from "../interfaces/auth.repository";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// Extended user type that includes the new database fields
type DrizzleUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  password: string;
  role: string | null;
  is_active: boolean | null;
  emailVerified: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

// Local type definitions
interface User {
  id: string;
  email: string;
  name: string;
  image: string;
  role: "viewer" | "editor" | "admin";
  is_active: boolean;
  email_verified: string | null;
  created_at: string;
  updated_at: string;
  password?: string; // Added for production readiness
}

interface Session {
  user: User;
  expires: string;
}

// JWT payload interface for type safety
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export class DrizzleAuthRepository implements AuthRepository {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN = "7d";
  private readonly DEFAULT_ROLE: User["role"] = "viewer";

  constructor() {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error(
        "NEXTAUTH_SECRET environment variable must be set for JWT signing.",
      );
    }
    this.JWT_SECRET = process.env.NEXTAUTH_SECRET;
  }

  async authenticateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return null;
    }

    if (!user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password as string);

    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? "",
      image: user.image ?? "",
      role: (user.role as User["role"]) ?? this.DEFAULT_ROLE,
      is_active: (user as DrizzleUser).is_active ?? true,
      email_verified: user.emailVerified?.toISOString() ?? null,
      created_at: (user as DrizzleUser).created_at?.toISOString() ?? new Date().toISOString(),
      updated_at: (user as DrizzleUser).updated_at?.toISOString() ?? new Date().toISOString(),
    };
  }

  async createSession(userId: string): Promise<Session> {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days

    // Use randomBytes to generate a secure random session token
    const sessionToken = randomBytes(32).toString("hex");

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
        name: session.user.name ?? "",
        image: session.user.image ?? "",
        role: (session.user.role as User["role"]) ?? this.DEFAULT_ROLE,
        is_active: (session.user as DrizzleUser).is_active ?? true,
        email_verified: session.user.emailVerified?.toISOString() ?? null,
        created_at:
          (session.user as DrizzleUser).created_at?.toISOString() ?? new Date().toISOString(),
        updated_at:
          (session.user as DrizzleUser).updated_at?.toISOString() ?? new Date().toISOString(),
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
        role: user.role,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN },
    );
  }

  async validateAccessToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
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
      name: user.name ?? "",
      image: user.image ?? "",
      role: (user.role as User["role"]) ?? this.DEFAULT_ROLE,
      is_active: (user as DrizzleUser).is_active ?? true,
      email_verified: user.emailVerified?.toISOString() ?? null,
      created_at: (user as DrizzleUser).created_at?.toISOString() ?? new Date().toISOString(),
      updated_at: (user as DrizzleUser).updated_at?.toISOString() ?? new Date().toISOString(),
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
      name: user.name ?? "",
      image: user.image ?? "",
      role: (user.role as User["role"]) ?? this.DEFAULT_ROLE,
      is_active: (user as DrizzleUser).is_active ?? true,
      email_verified: user.emailVerified?.toISOString() ?? null,
      created_at: (user as DrizzleUser).created_at?.toISOString() ?? new Date().toISOString(),
      updated_at: (user as DrizzleUser).updated_at?.toISOString() ?? new Date().toISOString(),
    };
  }
}
