import { expect, test, type Page } from "@playwright/test";
import { setupConvexAuth, type AuthUser } from "./utils/convex-auth";

type PhoneNumberDoc = {
  _id: string;
  e164: string;
  assignedPropertyId?: string | null;
  assignedQueue?: string | null;
};

type PropertyDoc = {
  _id: string;
  name: string;
};

type ConvexMocksConfig = {
  numbers: PhoneNumberDoc[];
  properties: PropertyDoc[];
  user?: Partial<AuthUser>;
};

const setupPhoneNumberMocks = async (
  page: Page,
  config: ConvexMocksConfig,
): Promise<void> => {
  const auth = await setupConvexAuth(page, {
    user: config.user,
    handleQuery: ({ path, args }) => {
      if (path === "admin:list") {
        const table = String(args.table ?? "");
        if (table === "numbers") {
          return {
            data: config.numbers,
            total: config.numbers.length,
          };
        }
        if (table === "properties") {
          return {
            data: config.properties,
            total: config.properties.length,
          };
        }
        return { data: [], total: 0 };
      }

      if (path === "admin:getMany") {
        const table = String(args.table ?? "");
        if (table === "properties") {
          const ids = Array.isArray(args.ids)
            ? (args.ids as unknown[]).map(String)
            : [];
          return config.properties.filter((property) =>
            ids.includes(String(property._id)),
          );
        }
        return [];
      }

      return undefined;
    },
  });

  await auth.primeSession();
};

test.describe("Phone numbers list", () => {
  const properties: PropertyDoc[] = [
    { _id: "property_1", name: "Sunset Villas" },
    { _id: "property_2", name: "Maple Square" },
  ];

  test("renders phone numbers with assignments and actions", async ({
    page,
  }) => {
    await setupPhoneNumberMocks(page, {
      properties,
      numbers: [
        {
          _id: "numbers_1",
          e164: "+15551234567",
          assignedPropertyId: "property_1",
          assignedQueue: "Leasing",
        },
        {
          _id: "numbers_2",
          e164: "+15559876543",
          assignedPropertyId: null,
          assignedQueue: null,
        },
      ],
    });

    await page.goto("/#/numbers");
    await page.getByRole("link", { name: "Phone Numbers" }).click();

    await expect(
      page.getByRole("heading", { level: 2, name: "Phone Numbers" }),
    ).toBeVisible();

    const headerCells = page.locator("table tr").first().locator("th,td");
    await expect(headerCells.nth(1)).toHaveText("Phone Number");
    await expect(headerCells.nth(2)).toHaveText("Assigned Property");
    await expect(headerCells.nth(3)).toHaveText("Assigned Queue");
    await expect(headerCells.nth(4)).toHaveText("Actions");

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(2);

    const firstRowCells = rows.nth(0).locator("td");
    await expect(firstRowCells.nth(1)).toHaveText("+15551234567");
    await expect(firstRowCells.nth(2)).toHaveText("Sunset Villas");
    await expect(firstRowCells.nth(3)).toHaveText("Leasing");
    await expect(
      firstRowCells.nth(4).getByRole("button", { name: "Change assignment" }),
    ).toBeVisible();

    const secondRowCells = rows.nth(1).locator("td");
    await expect(secondRowCells.nth(1)).toHaveText("+15559876543");
    await expect(secondRowCells.nth(2)).toHaveText("Unassigned");
    await expect(secondRowCells.nth(3)).toHaveText("Unassigned");
    await expect(
      secondRowCells.nth(4).getByRole("button", { name: "Assign property" }),
    ).toBeVisible();
  });

  test("shows an empty state when no phone numbers exist", async ({ page }) => {
    await setupPhoneNumberMocks(page, {
      properties,
      numbers: [],
    });

    await page.goto("/#/numbers");
    await page.getByRole("link", { name: "Phone Numbers" }).click();

    await expect(
      page.getByRole("heading", { level: 2, name: "Phone Numbers" }),
    ).toBeVisible();
    await expect(page.getByText("No results found.")).toBeVisible();
  });
});
