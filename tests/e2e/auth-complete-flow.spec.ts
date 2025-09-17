import { test, expect } from "@playwright/test";

test.describe("Complete Authentication Flow E2E Tests", () => {
  test("should complete full sign-up and sign-in flow", async ({ page }) => {
    // Navigate to sign-up page
    await page.goto("/auth/signup");

    // Fill out sign-up form
    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");

    // Submit form
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should redirect to sign-in page with success message
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByText("Account created successfully")).toBeVisible();

    // Fill out sign-in form
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    // Submit sign-in form
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should redirect to homepage and show user as logged in
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Logged in as Test User")).toBeVisible();
  });

  test("should show validation errors for invalid sign-up data", async ({
    page,
  }) => {
    await page.goto("/auth/signup");

    // Try to submit empty form
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should show validation errors
    await expect(page.getByLabel("Full Name")).toHaveAttribute("required");
    await expect(page.getByLabel("Email")).toHaveAttribute("required");
    await expect(page.getByLabel("Password")).toHaveAttribute("required");
  });

  test("should show error for password mismatch", async ({ page }) => {
    await page.goto("/auth/signup");

    // Fill form with mismatched passwords
    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByLabel("Confirm Password").fill("differentpassword");

    await page.getByRole("button", { name: "Create Account" }).click();

    // Should show password mismatch error
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("should show error for short password", async ({ page }) => {
    await page.goto("/auth/signup");

    // Fill form with short password
    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByLabel("Confirm Password").fill("short");

    await page.getByRole("button", { name: "Create Account" }).click();

    // Should show password length error
    await expect(
      page.getByText("Password must be at least 8 characters long"),
    ).toBeVisible();
  });

  test("should show error for invalid sign-in credentials", async ({
    page,
  }) => {
    await page.goto("/auth/signin");

    // Try to sign in with non-existent user
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("wrongpassword");

    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show error
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("should have proper autocomplete attributes", async ({ page }) => {
    await page.goto("/auth/signup");

    // Check autocomplete attributes
    await expect(page.getByLabel("Full Name")).toHaveAttribute(
      "autocomplete",
      "name",
    );
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    await expect(page.getByLabel("Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    await expect(page.getByLabel("Confirm Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );

    await page.goto("/auth/signin");

    // Check sign-in autocomplete attributes
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    await expect(page.getByLabel("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  test("should navigate between sign-in and sign-up pages", async ({
    page,
  }) => {
    // Start at sign-up page
    await page.goto("/auth/signup");

    // Click link to sign-in page
    await page.getByText("sign in to your existing account").click();
    await expect(page).toHaveURL("/auth/signin");

    // Click link back to sign-up page
    await page.getByText("create a new account").click();
    await expect(page).toHaveURL("/auth/signup");
  });

  test("should handle loading states correctly", async ({ page }) => {
    await page.goto("/auth/signin");

    // Fill form and submit
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    // Click submit and immediately check for loading state
    const submitButton = page.getByRole("button", { name: "Sign In" });
    await submitButton.click();

    // Should show loading state (button disabled and text changed)
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText("Signing in...");
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/auth/signup");

    // Check that form is still usable on mobile
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Account" }),
    ).toBeVisible();

    // Check that form elements are properly sized for mobile
    const nameInput = page.getByLabel("Full Name");
    const nameInputBox = await nameInput.boundingBox();
    expect(nameInputBox?.width).toBeGreaterThan(200); // Should be reasonably wide
  });
});
