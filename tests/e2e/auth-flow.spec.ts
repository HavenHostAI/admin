import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login form on homepage", async ({ page }) => {
    await page.goto("/");

    // Check if login form elements are present
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should show validation errors for empty form submission", async ({
    page,
  }) => {
    await page.goto("/");

    const submitButton = page.getByRole("button", { name: "Sign in" });
    await submitButton.click();

    // Check for HTML5 validation (browser will show required field messages)
    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password");

    await expect(emailInput).toHaveAttribute("required");
    await expect(passwordInput).toHaveAttribute("required");
  });

  test("should handle login form interaction", async ({ page }) => {
    await page.goto("/");

    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password");
    const submitButton = page.getByRole("button", { name: "Sign in" });

    // Fill in the form
    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");

    // Verify the values are set
    await expect(emailInput).toHaveValue("test@example.com");
    await expect(passwordInput).toHaveValue("password123");

    // Submit the form
    await submitButton.click();

    // Wait for any potential network requests or state changes
    await page.waitForLoadState("networkidle");
  });

  test("should handle page refresh gracefully", async ({ page }) => {
    await page.goto("/");

    // Fill form and refresh
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify form is still functional after refresh
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check that form elements are still visible and accessible on mobile
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    // Test form interaction on mobile
    await page.getByLabel("Email").fill("mobile@example.com");
    await page.getByLabel("Password").fill("mobile123");

    await expect(page.getByLabel("Email")).toHaveValue("mobile@example.com");
    await expect(page.getByLabel("Password")).toHaveValue("mobile123");
  });
});
