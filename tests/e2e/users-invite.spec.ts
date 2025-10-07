import { expect, test, type Page } from "@playwright/test";
import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";
import { setupConvexMocks } from "./utils/convexMocks";

const SESSION_TOKEN = "test-session-token";

const bootstrapAuthenticatedSession = async (page: Page) => {
  await page.addInitScript(
    ([key, token]) => {
      window.localStorage.setItem(key, token);
    },
    [TOKEN_STORAGE_KEY, SESSION_TOKEN],
  );
};

test.describe("User invitations", () => {
  test("invites a new user and redirects to the list", async ({ page }) => {
    const mocks = await setupConvexMocks(page, {
      initialToken: SESSION_TOKEN,
      user: { id: "owner_1", email: "owner@example.com", name: "Owner" },
    });

    await bootstrapAuthenticatedSession(page);

    await page.goto("/users/create");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { level: 2, name: /create user/i }),
    ).toBeVisible();

    await page.getByLabel("Email").fill("Agent.Invitee@example.com  ");
    await page.getByLabel("Name").fill("Agent Invitee");
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole("option", { name: "Manager" }).click();

    await page.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => mocks.inviteUserCalls.length).toBe(1);

    expect(mocks.inviteUserCalls[0]).toMatchObject({
      sessionToken: SESSION_TOKEN,
      email: "agent.invitee@example.com",
      name: "Agent Invitee",
      role: "manager",
    });

    await expect(page.getByText("Invitation sent successfully.")).toBeVisible();

    await expect(page).toHaveURL(/\/users(?:\?|$)/);
    await expect(
      page.getByRole("heading", { level: 2, name: /users/i }),
    ).toBeVisible();
  });

  test("blocks submission when the email is invalid", async ({ page }) => {
    const mocks = await setupConvexMocks(page, {
      initialToken: SESSION_TOKEN,
      user: { id: "owner_1", email: "owner@example.com", name: "Owner" },
    });

    await bootstrapAuthenticatedSession(page);

    await page.goto("/users/create");
    await page.waitForLoadState("networkidle");

    const emailField = page.getByLabel("Email");
    await emailField.fill("not-an-email");
    await page.getByLabel("Name").fill("Agent Invitee");
    await page.getByRole("button", { name: "Save" }).click();

    const validity = await emailField.evaluate((input: HTMLInputElement) => ({
      valid: input.validity.valid,
      message: input.validationMessage,
    }));

    expect(validity.valid).toBe(false);
    expect(validity.message).not.toBe("");

    await expect.poll(() => mocks.inviteUserCalls.length).toBe(0);
    await expect(page).toHaveURL(/\/users\/create(?:\?|$)/);
  });
});
