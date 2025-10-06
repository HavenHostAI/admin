import { expect, test, type Page } from "@playwright/test";
import { setupConvexMocks } from "./utils/convexMocks";
import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";

const signInAsOwner = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByLabel("Password").fill("owner-password!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: /dashboard/i }),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(
        (key) => window.localStorage.getItem(key),
        TOKEN_STORAGE_KEY,
      ),
    )
    .toBe("test-session-token");
};

test.describe("Users list", () => {
  test("renders the user directory with records", async ({ page }) => {
    const companies = [
      { _id: "companies/1", name: "HavenHost" },
      { _id: "companies/2", name: "Nova Estates" },
    ];
    const users = [
      {
        _id: "users/1",
        email: "agent.alpha@example.com",
        role: "agent",
        status: "active",
        emailVerified: true,
        companyId: companies[0]._id,
      },
      {
        _id: "users/2",
        email: "manager.beta@example.com",
        role: "manager",
        status: "invited",
        emailVerified: false,
        companyId: companies[1]._id,
      },
    ];

    await setupConvexMocks(page, {
      queryHandlers: {
        "admin:list": (args) => {
          const table = String(args.table ?? "");
          if (table === "users") {
            return { data: users, total: users.length };
          }
          return { data: [], total: 0 };
        },
        "admin:getMany": (args) => {
          const table = String(args.table ?? "");
          if (table === "companies") {
            const ids = Array.isArray(args.ids)
              ? args.ids.map((value) => String(value))
              : [];
            return companies.filter((company) => ids.includes(company._id));
          }
          return [];
        },
      },
    });

    await signInAsOwner(page);
    await page.goto("/users");
    await expect(page).toHaveURL(/\/users$/);

    await expect(
      page.getByRole("heading", { level: 2, name: /users/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: users[0].email }),
    ).toBeVisible();

    const headerTexts = await page
      .locator("thead th")
      .evaluateAll((cells) =>
        cells
          .map((cell) => cell.textContent?.trim() ?? "")
          .filter((text) => text.length > 0),
      );

    expect(headerTexts).toEqual([
      "Email",
      "Role",
      "Status",
      "Email Verified",
      "Company",
    ]);

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(users.length);

    const readRow = async (index: number) => {
      const cellTexts = await rows
        .nth(index)
        .locator("td")
        .evaluateAll((cells) =>
          cells.map((cell) => cell.textContent?.trim() ?? ""),
        );
      if (cellTexts[0] === "") {
        cellTexts.shift();
      }
      return cellTexts;
    };

    const firstRow = await readRow(0);
    expect(firstRow).toEqual([
      users[0].email,
      users[0].role,
      users[0].status,
      users[0].emailVerified ? "true" : "false",
      companies[0].name,
    ]);

    const secondRow = await readRow(1);
    expect(secondRow).toEqual([
      users[1].email,
      users[1].role,
      users[1].status,
      users[1].emailVerified ? "true" : "false",
      companies[1].name,
    ]);
  });

  test("renders the empty state when no users exist", async ({ page }) => {
    await setupConvexMocks(page, {
      queryHandlers: {
        "admin:list": (args) => {
          const table = String(args.table ?? "");
          if (table === "users") {
            return { data: [], total: 0 };
          }
          return { data: [], total: 0 };
        },
      },
    });

    await signInAsOwner(page);
    await page.goto("/users");
    await expect(page).toHaveURL(/\/users$/);

    await expect(
      page.getByRole("heading", { level: 2, name: /users/i }),
    ).toBeVisible();
    await expect(page.getByText("No results found.")).toBeVisible();
  });
});
