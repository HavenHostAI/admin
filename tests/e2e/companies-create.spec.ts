import { expect, test } from "@playwright/test";

import {
  decodeConvexRequest,
  fulfillConvexResponse,
  setupConvexMocks,
} from "./utils/convexMocks";
import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";

type AdminCreateCall = {
  table?: string;
  data?: Record<string, unknown>;
  meta?: unknown;
};

test.describe("Company creation", () => {
  test("allows admins to create a company with normalized payload", async ({
    page,
  }) => {
    let lastCreatedDoc: Record<string, unknown> | null = null;
    const mocks = await setupConvexMocks(page, {
      queryHandlers: {
        "admin:get": async ({ table, id }) => {
          if (table === "companies" && lastCreatedDoc) {
            const targetId = typeof id === "string" ? id : String(id);
            if (
              targetId ===
              String(
                (lastCreatedDoc._id as string | undefined) ??
                  (lastCreatedDoc.id as string | undefined),
              )
            ) {
              return lastCreatedDoc;
            }
          }
          return null;
        },
      },
    });
    const adminCreateCalls: AdminCreateCall[] = [];

    const createdCompanyId = "company_new";
    const companyName = "HavenHost Beta";
    const timezone = "America/Los_Angeles";
    const logoUrl = "https://cdn.example.com/logo.svg";
    const greetingName = "HavenHost Concierge";
    const createdAt = 1_725_571_200_000;

    await page.route("**/api/mutation", async (route) => {
      const { path, args } = decodeConvexRequest(route);

      if (path === "admin:create") {
        const payload = args as AdminCreateCall;
        adminCreateCalls.push({
          table: payload.table,
          data: payload.data ? { ...payload.data } : undefined,
          meta: payload.meta,
        });

        const document = {
          _id: createdCompanyId,
          _creationTime: Date.now(),
          ...(payload.data ?? {}),
        };

        lastCreatedDoc = document;
        await fulfillConvexResponse(route, document);
        return;
      }

      await route.fallback();
    });

    await page.goto("/login");

    await page.getByLabel("Email").fill("owner@example.com");
    await page.getByLabel("Password").fill("owner-password!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: /dashboard/i }),
    ).toBeVisible();

    const companiesLink = page.getByRole("link", { name: /companies/i });
    await expect(companiesLink).toBeVisible();
    await companiesLink.click();

    await page.waitForURL(/\/companies(?:$|[?#])/);
    await expect(
      page.getByRole("heading", { level: 2, name: /companies/i }),
    ).toBeVisible();

    const createLink = page.getByRole("link", { name: /^create$/i });
    await expect(createLink).toBeVisible();
    await createLink.click();

    await page.waitForURL(/\/companies\/create(?:$|[?#])/);
    await expect(
      page.getByRole("heading", { level: 2, name: /create company/i }),
    ).toBeVisible();

    const nameInput = page.getByRole("textbox", { name: /^name$/i });
    await expect(nameInput).toBeVisible();
    await nameInput.fill(companyName);

    const planSelect = page.getByRole("combobox").first();
    await expect(planSelect).toBeVisible();
    await planSelect.click();
    await page.getByRole("option", { name: "Growth" }).click();

    await page.getByRole("textbox", { name: /^timezone$/i }).fill(timezone);
    await page
      .getByRole("textbox", { name: "Branding · Logo URL" })
      .fill(logoUrl);
    await page
      .getByRole("textbox", { name: "Branding · Greeting Name" })
      .fill(greetingName);
    await page
      .getByRole("spinbutton", { name: "Created At (epoch ms)" })
      .fill(createdAt.toString());

    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText("Element created")).toBeVisible();
    await page.waitForURL(
      new RegExp(`/companies/${createdCompanyId}(?:$|[?#])`),
    );
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: new RegExp(`^Company ${companyName}$`, "i"),
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Show", exact: true }),
    ).toHaveAttribute(
      "href",
      new RegExp(`/companies/${createdCompanyId}/show/?$`),
    );

    await expect.poll(() => adminCreateCalls.length).toBe(1);

    const [payload] = adminCreateCalls;

    expect(payload).toMatchObject({
      table: "companies",
      data: {
        name: companyName,
        plan: "growth",
        timezone,
        branding: {
          logoUrl,
          greetingName,
        },
        createdAt,
      },
    });

    await expect
      .poll(() =>
        page.evaluate(
          (key) => window.localStorage.getItem(key),
          TOKEN_STORAGE_KEY,
        ),
      )
      .toBe("test-session-token");

    expect(mocks.signInCalls).toHaveLength(1);
    expect(mocks.validateSessionCalls.length).toBeGreaterThan(0);
  });
});
