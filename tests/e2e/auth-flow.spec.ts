import { expect, test } from "@playwright/test";
import { setupMSW } from "./helpers/msw-setup";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  test("home page shows sign in call to action", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Create T3 App" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("can navigate from home to sign-in and back", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/auth/signin");
    await page.getByText("create a new account").click();
    await expect(page).toHaveURL("/auth/signup");
  });

  test("sign-in form validates required fields", async ({ page }) => {
    await page.goto("/auth/signin");
    const submitButton = page.getByRole("button", { name: "Sign In" });
    await submitButton.click();
    await expect(page.getByLabel("Email")).toHaveAttribute("required");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "required",
    );
  });

  test("sign-in attempt surfaces error when backend unavailable", async ({
    page,
  }) => {
    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page
      .getByRole("button", { name: /^Sign In$/ })
      .first()
      .click();
    await expect(
      page.locator("form").locator("text=An error occurred. Please try again."),
    ).toBeVisible();
  });

  test("home page layout adapts on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Create T3 App" }),
    ).toBeVisible();
    const hero = await page.locator("main").boundingBox();
    expect(hero?.width ?? 0).toBeGreaterThan(200);
  });
});
