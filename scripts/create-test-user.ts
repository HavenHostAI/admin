import { db } from "../src/server/db";
import { users } from "../src/server/db/schema";
import bcrypt from "bcryptjs";

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "admin@example.com"),
    });

    if (existingUser) {
      console.log("Test user already exists:", existingUser.email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Create test user
    const [newUser] = await db
      .insert(users)
      .values({
        email: "admin@example.com",
        name: "Admin User",
        password: hashedPassword,
        role: "admin",
        is_active: true,
      })
      .returning();

    if (newUser) {
      console.log("Test user created successfully:");
      console.log("Email: admin@example.com");
      console.log("Password: password123");
      console.log("Role: admin");
      console.log("User ID:", newUser.id);
    } else {
      console.error("Failed to create test user");
    }
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

createTestUser();
