import { expect, test } from "@playwright/test";
import { pollForStoredToken } from "./convexMocks";
import { setupConvexAuth } from "./utils/convex-auth";

test.describe("Authentication flows", () => {
  test("allows a new owner to sign up and sign in", async ({ page }) => {
    const mocks = await setupConvexAuth(page);

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const openSignUp = page.getByRole("button", { name: /create one/i });
    await expect(openSignUp).toBeVisible();
    await openSignUp.click();
    await expect(
      page.getByRole("heading", { level: 1, name: /create an account/i }),
    ).toBeVisible();

    const nameField = page.getByPlaceholder("Jane Doe");
    await expect(nameField).toBeVisible();
    await nameField.fill("New Owner");
    await page.getByLabel("Email").fill("New.Owner@Example.com");
    await page.getByLabel("Company Name").fill("HavenHost");
    await page.getByLabel("Password").fill("Sup3rSecret!");
    await page.getByRole("button", { name: "Create account" }).click();

    const companiesNav = page.getByRole("link", { name: /^companies$/i });
    await expect(companiesNav).toBeVisible();
    await companiesNav.click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 2, name: /companies/i }),
    ).toBeVisible();

    await pollForStoredToken(page);

    expect(mocks.signUpCalls).toHaveLength(1);
    expect(mocks.signUpCalls[0]).toMatchObject({
      email: "new.owner@example.com",
      name: "New Owner",
      companyName: "HavenHost",
      password: "Sup3rSecret!",
    });

    expect(mocks.signInCalls).toHaveLength(1);
    expect(mocks.signInCalls[0]).toMatchObject({
      email: "new.owner@example.com",
      password: "Sup3rSecret!",
    });

    expect(mocks.validateSessionCalls.length).toBeGreaterThan(0);
  });

  test("allows an existing user to sign in", async ({ page }) => {
    const mocks = await setupConvexAuth(page, {
      user: { id: "user_existing", name: "Existing Owner" },
    });

    await page.goto("/login");

    await page.getByLabel("Email").fill("OWNER@example.com  ");
    await page.getByLabel("Password").fill("owner-password!");
    await page.getByRole("button", { name: "Sign in" }).click();

    const companiesNav = page.getByRole("link", { name: /^companies$/i });
    await expect(companiesNav).toBeVisible();
    await companiesNav.click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 2, name: /companies/i }),
    ).toBeVisible();

    await pollForStoredToken(page);

    expect(mocks.signUpCalls).toHaveLength(0);
    expect(mocks.signInCalls).toHaveLength(1);
    expect(mocks.signInCalls[0]).toMatchObject({
      email: "owner@example.com",
      password: "owner-password!",
    });

    expect(mocks.validateSessionCalls.length).toBeGreaterThan(0);
  });
});
