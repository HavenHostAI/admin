import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

type LocalRecommendation = {
  id: string;
  propertyId: string;
  name: string;
  category: string;
  url: string | null;
  tips: string | null;
  hours: string | null;
  tags: string[];
  updatedAt: number;
};

type SaveLocalArgs = {
  id?: string;
  propertyId: string;
  name: string;
  category: string;
  url?: string;
  tips?: string;
  hours?: string;
  tags?: string[];
};

type KnowledgeBaseMocks = {
  saveCalls: SaveLocalArgs[];
  saveResponses: LocalRecommendation[];
  deleteCalls: string[];
  deleteSettled: number;
};

const convexSuccessResponse = (value: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    status: "success",
    value,
    logLines: [],
  }),
});

const decodeConvexRequest = (route: Route) => {
  const bodyText = route.request().postData() ?? "{}";
  const body = JSON.parse(bodyText) as {
    path?: string;
    args?: unknown[];
  };
  const [encodedArgs] = body.args ?? [];
  const decodedArgs = encodedArgs
    ? (jsonToConvex(encodedArgs as unknown) as Record<string, unknown>)
    : {};
  return { path: body.path, args: decodedArgs };
};

const setupKnowledgeBaseMocks = async (
  page: Page,
): Promise<KnowledgeBaseMocks> => {
  const token = "test-admin-session";
  const storedUser = {
    id: "user_owner",
    email: "owner@example.com",
    name: "Operator Owner",
    role: "owner",
  };

  const properties = [
    { id: "property_1", name: "Riverside Retreat" },
    { id: "property_2", name: "Hudson Loft" },
  ];

  let localRecommendations: LocalRecommendation[] = [
    {
      id: "rec_1",
      propertyId: "property_1",
      name: "Sunrise Cafe",
      category: "Food & Drink",
      url: "https://sunrise.example.com",
      tips: "Grab a window seat for the best river view.",
      hours: "Daily 7am – 2pm",
      tags: ["brunch", "coffee"],
      updatedAt: 1_700_000_000_000,
    },
    {
      id: "rec_2",
      propertyId: "property_2",
      name: "City Nights Walking Tour",
      category: "Activities",
      url: "https://citynights.example.com",
      tips: "Wear comfortable shoes for the hills.",
      hours: "Fri & Sat 8pm",
      tags: ["nightlife", "outdoors"],
      updatedAt: 1_700_000_500_000,
    },
  ];

  const mocks: KnowledgeBaseMocks = {
    saveCalls: [],
    saveResponses: [],
    deleteCalls: [],
    deleteSettled: 0,
  };

  await page.addInitScript(
    (
      tokenKey: string,
      tokenValue: string,
      userKey: string,
      userValue: unknown,
    ) => {
      window.localStorage.setItem(tokenKey, tokenValue);
      window.localStorage.setItem(userKey, JSON.stringify(userValue));
    },
    TOKEN_STORAGE_KEY,
    token,
    USER_STORAGE_KEY,
    storedUser,
  );

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  const handleQuery = (route: Route) => {
    const { path } = decodeConvexRequest(route);
    if (path === "knowledgeBase:listProperties") {
      return respond(route, properties);
    }
    if (path === "knowledgeBase:listLocalRecommendations") {
      return respond(route, localRecommendations);
    }
    if (path === "knowledgeBase:listFaqs") {
      return respond(route, []);
    }
    return respond(route, null);
  };

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

  await page.route("**/api/mutation", async (route) => {
    const { path, args } = decodeConvexRequest(route);
    if (path === "knowledgeBase:saveLocalRecommendation") {
      const payload: SaveLocalArgs = {
        id: typeof args.id === "string" ? args.id : undefined,
        propertyId: String(args.propertyId ?? ""),
        name: String(args.name ?? ""),
        category: String(args.category ?? ""),
        url: typeof args.url === "string" ? args.url : undefined,
        tips: typeof args.tips === "string" ? args.tips : undefined,
        hours: typeof args.hours === "string" ? args.hours : undefined,
        tags: Array.isArray(args.tags)
          ? (args.tags.filter(
              (tag): tag is string => typeof tag === "string",
            ) as string[])
          : [],
      };
      mocks.saveCalls.push(payload);

      const now = Date.now();
      const response: LocalRecommendation = {
        id:
          payload.id ??
          `rec_${Math.random().toString(36).slice(2, 8)}${Math.random()
            .toString(36)
            .slice(2, 5)}`,
        propertyId: payload.propertyId,
        name: payload.name,
        category: payload.category,
        url: payload.url ?? null,
        tips: payload.tips ?? null,
        hours: payload.hours ?? null,
        tags: payload.tags ?? [],
        updatedAt: now,
      };

      const existingIndex = localRecommendations.findIndex(
        (rec) => rec.id === response.id,
      );
      if (existingIndex >= 0) {
        localRecommendations[existingIndex] = response;
      } else {
        localRecommendations = [...localRecommendations, response];
      }

      mocks.saveResponses.push(response);
      return respond(route, response);
    }

    if (path === "knowledgeBase:deleteLocalRecommendation") {
      const id = String(args.id ?? "");
      mocks.deleteCalls.push(id);
      localRecommendations = localRecommendations.filter(
        (rec) => rec.id !== id,
      );
      await new Promise((resolve) => setTimeout(resolve, 250));
      await respond(route, {});
      mocks.deleteSettled += 1;
      return;
    }

    if (path?.startsWith("knowledgeBase:")) {
      return respond(route, {});
    }

    return respond(route, null);
  });

  await page.route("**/api/action", (route) => {
    const { path } = decodeConvexRequest(route);
    if (path === "auth:validateSession") {
      const timestamp = new Date().toISOString();
      return respond(route, {
        session: {
          token,
          userId: storedUser.id,
          createdAt: timestamp,
          updatedAt: timestamp,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        },
        user: storedUser,
      });
    }

    return respond(route, {});
  });

  return mocks;
};

test.describe("Knowledge base local recommendations", () => {
  test("supports filtering and recommendation CRUD", async ({ page }) => {
    const mocks = await setupKnowledgeBaseMocks(page);

    await page.goto("/knowledge-base");
    await page.waitForLoadState("networkidle");

    const localTabTrigger = page.getByRole("tab", {
      name: /local recommendations/i,
    });
    await localTabTrigger.click();

    const localTab = page.getByRole("tabpanel", {
      name: /local recommendations/i,
    });
    const localRows = localTab.locator("tbody tr");

    await expect(localRows).toHaveCount(2);

    const propertyFilter = localTab.getByRole("combobox").first();
    await propertyFilter.click();
    await page.getByRole("option", { name: "Hudson Loft" }).click();
    await expect(localRows).toHaveCount(1);
    await expect(localRows.first()).toContainText("Hudson Loft");

    await propertyFilter.click();
    await page.getByRole("option", { name: "All properties" }).click();
    await expect(localRows).toHaveCount(2);

    const categoryFilter = localTab.getByRole("combobox").nth(1);
    await categoryFilter.click();
    await page.getByRole("option", { name: "Food & Drink" }).last().click();
    await expect(localRows).toHaveCount(1);
    await expect(localRows.first()).toContainText("Sunrise Cafe");

    const searchInput = localTab.getByPlaceholder("Search recommendations");
    await searchInput.fill("sunrise");
    await expect(localRows).toHaveCount(1);
    await expect(localRows.first()).toContainText("Sunrise Cafe");

    await searchInput.fill("");
    await categoryFilter.click();
    await page.getByRole("option", { name: "All categories" }).last().click();
    await expect(localRows).toHaveCount(2);

    await localTab.getByRole("button", { name: "Add recommendation" }).click();

    const createDialog = page.getByRole("dialog", {
      name: /add recommendation/i,
    });
    await expect(createDialog).toBeVisible();

    const dialogComboboxes = createDialog.getByRole("combobox");
    await dialogComboboxes.first().click();
    await page.getByRole("option", { name: "Riverside Retreat" }).click();

    await createDialog.getByLabel("Name").fill("Night Owl Diner");

    await dialogComboboxes.nth(1).click();
    await page.getByRole("option", { name: "Food & Drink" }).last().click();

    await createDialog
      .getByLabel("Website (optional)")
      .fill(" https://nightowl.example.com ");
    await createDialog
      .getByLabel("Tips (optional)")
      .fill(" Order the pancakes after midnight. ");
    await createDialog.getByLabel("Hours (optional)").fill(" 24 hours ");

    const tagInput = createDialog.getByPlaceholder("Add descriptors");
    await tagInput.fill(" Cozy ");
    await createDialog.getByRole("button", { name: "Add" }).click();

    await createDialog.getByRole("button", { name: "Save" }).click();
    await expect(createDialog).not.toBeVisible();

    await expect.poll(() => mocks.saveCalls.length).toBe(1);

    await expect(localRows).toHaveCount(3);
    await expect(localRows.filter({ hasText: "Night Owl Diner" })).toHaveCount(
      1,
    );
    await expect(localRows.filter({ hasText: "#cozy" })).toHaveCount(1);

    const [createPayload] = mocks.saveCalls;
    expect(createPayload).toEqual(
      expect.objectContaining({
        id: undefined,
        propertyId: "property_1",
        name: "Night Owl Diner",
        category: "Food & Drink",
        url: "https://nightowl.example.com",
        tips: "Order the pancakes after midnight.",
        hours: "24 hours",
        tags: ["cozy"],
      }),
    );

    const sunriseRow = localRows.filter({ hasText: "Sunrise Cafe" });
    await sunriseRow
      .getByRole("button", { name: "Edit recommendation" })
      .click();

    const editDialog = page.getByRole("dialog", {
      name: /edit recommendation/i,
    });
    await expect(editDialog).toBeVisible();

    await editDialog.getByLabel("Hours (optional)").fill("Mon – Fri 7am – 4pm");
    await editDialog.getByRole("button", { name: "Save" }).click();
    await expect(editDialog).not.toBeVisible();

    await expect.poll(() => mocks.saveCalls.length).toBe(2);

    const updatePayload = mocks.saveCalls[1];
    expect(updatePayload).toEqual(
      expect.objectContaining({
        id: "rec_1",
        hours: "Mon – Fri 7am – 4pm",
        tags: ["brunch", "coffee"],
      }),
    );

    const createdRecord = mocks.saveResponses.find(
      (response) => response.name === "Night Owl Diner",
    );
    expect(createdRecord).toBeDefined();

    const createdRow = localRows.filter({ hasText: "Night Owl Diner" });
    await createdRow
      .getByRole("button", { name: "Delete recommendation" })
      .click();

    const deleteConfirm = page.getByRole("dialog", {
      name: /delete recommendation\?/i,
    });
    await expect(deleteConfirm).toBeVisible();
    expect(mocks.deleteSettled).toBe(0);
    await deleteConfirm.getByRole("button", { name: "Delete" }).click();
    const pendingSettled = mocks.deleteSettled;
    await expect(deleteConfirm).not.toBeVisible();

    await expect(localRows.filter({ hasText: "Night Owl Diner" })).toHaveCount(
      0,
    );
    await expect(localRows).toHaveCount(2);

    await expect.poll(() => mocks.deleteCalls.length).toBe(1);
    await expect.poll(() => mocks.deleteSettled).toBe(pendingSettled + 1);

    const [deletedId] = mocks.deleteCalls;
    expect(deletedId).toBe(createdRecord?.id);
  });
});
