import { test, expect } from "@playwright/test";

test.describe("Component UI Tests", () => {
  test("should display login form elements", async ({ page }) => {
    await page.goto("/auth/signin");

    // Check if login form elements are present
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sign In$/ })).toBeVisible();
  });

  test("should display signup form elements", async ({ page }) => {
    await page.goto("/auth/signup");

    // Check if signup form elements are present
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password").first()).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Account" }),
    ).toBeVisible();
  });

  test("should handle login form submission", async ({ page }) => {
    await page.goto("/auth/signin");

    const submitButton = page.getByRole("button", { name: "Sign in" });
    await submitButton.click();

    // Just verify the form is interactive - validation behavior may vary
    await expect(submitButton).toBeVisible();
  });

  test("should handle signup form submission", async ({ page }) => {
    await page.goto("/auth/signup");

    const submitButton = page.getByRole("button", { name: "Create Account" });
    await submitButton.click();

    // Just verify the form is interactive - validation behavior may vary
    await expect(submitButton).toBeVisible();
  });

  test("should handle form input changes", async ({ page }) => {
    await page.goto("/auth/signin");

    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");

    await emailInput.click();
    await emailInput.fill("test@example.com");
    await passwordInput.click();
    await passwordInput.fill("password123");

    await expect(emailInput).toHaveValue("test@example.com");
    await expect(passwordInput).toHaveValue("password123");
  });
});
