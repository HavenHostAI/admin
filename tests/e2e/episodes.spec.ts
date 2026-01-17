import { expect, test } from "@playwright/test";

import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";
import { setupConvexMocks } from "./utils/convexMocks";

test.describe("Episodes", () => {
  test("renders episode details after selecting a card", async ({ page }) => {
    await setupConvexMocks(page);

    await page.goto("/login");

    await page.getByLabel("Email").fill("owner@example.com");
    await page.getByLabel("Password").fill("owner-password!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect
      .poll(() =>
        page.evaluate(
          (key) => window.localStorage.getItem(key),
          TOKEN_STORAGE_KEY,
        ),
      )
      .toBe("test-session-token");

    await page.goto("/episodes/episode-1");

    await expect(
      page.getByRole("heading", { name: "Episode details" }),
    ).toBeVisible();
    await expect(page.getByText("episode-1", { exact: true })).toBeVisible();
  });
});
