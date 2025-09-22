import { expect, test } from "@playwright/test";
import { setupMSW } from "./helpers/msw-setup";

test.describe("Complete Authentication Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  test("sign-up redirects to sign-in with success message", async ({
    page,
  }) => {
    await page.goto("/auth/signup");

    const uniqueEmail = `playwright-${Date.now()}@example.com`;

    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");

    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 });
    await expect(
      page.getByText("Account created successfully. Please sign in."),
    ).toBeVisible();
  });

  test("shows validation errors for empty sign-up submission", async ({
    page,
  }) => {
    await page.goto("/auth/signup");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByLabel("Full Name")).toHaveAttribute("required");
    await expect(page.getByLabel("Email")).toHaveAttribute("required");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "required",
    );
  });

  test("shows password mismatch error", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("differentpassword");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("enforces minimum password length", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "minlength",
      "8",
    );
  });

  test("credentials form displays graceful error on failure", async ({
    page,
  }) => {
    await page.goto("/auth/signin");
    await page.evaluate(() => {
      if (window.__mockState) {
        window.__mockState.auth.forceCredentialsError = true;
      }
    });
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrongpassword");
    await page
      .getByRole("button", { name: /^Sign In$/ })
      .first()
      .click();
    await expect(
      page.locator("form").locator("text=An error occurred. Please try again."),
    ).toBeVisible();
  });

  test("has appropriate autocomplete attributes", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByLabel("Full Name")).toHaveAttribute(
      "autocomplete",
      "name",
    );
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    await expect(page.getByLabel("Confirm Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );

    await page.goto("/auth/signin");
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  test("allows navigation between auth pages", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByText("sign in to your existing account").click();
    await expect(page).toHaveURL("/auth/signin");
    await page.getByText("create a new account").click();
    await expect(page).toHaveURL("/auth/signup");
  });

  test("sign-up form renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/auth/signup");
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Account" }),
    ).toBeVisible();
  });
});
