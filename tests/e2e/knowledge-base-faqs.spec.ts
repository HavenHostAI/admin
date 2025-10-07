import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";

import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../../src/lib/authStorage";

type PropertySummary = {
  id: string;
  name: string;
};

type FaqRecord = {
  id: string;
  propertyId: string;
  text: string;
  category: string | null;
  tags: string[];
  updatedAt: number;
};

type SaveFaqArgs = {
  id?: string;
  propertyId: string;
  text: string;
  category?: string;
  tags?: string[];
};

type DeleteFaqArgs = {
  id: string;
};

type ConvexArgs = Record<string, unknown>;

type KnowledgeBaseMocks = {
  getLastCreatedFaqId: () => string | null;
  saveFaqCalls: SaveFaqArgs[];
  deleteFaqCalls: DeleteFaqArgs[];
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
    ? (jsonToConvex(encodedArgs as unknown) as ConvexArgs)
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

  const properties: PropertySummary[] = [
    { id: "prop_lake", name: "Lakeside Villa" },
    { id: "prop_city", name: "City Loft" },
  ];

  const now = Date.now();

  let faqs: FaqRecord[] = [
    {
      id: "faq_wifi",
      propertyId: "prop_lake",
      text: "What is the Wi-Fi password?\nNetwork: LakesideGuest\nPassword: shoreline",
      category: "Amenities",
      tags: ["wifi", "internet"],
      updatedAt: now - 1000 * 60 * 60,
    },
    {
      id: "faq_checkout",
      propertyId: "prop_city",
      text: "Can I get a late checkout?\nPlease message support before 10am to request it.",
      category: "Policies",
      tags: ["checkout"],
      updatedAt: now - 1000 * 30,
    },
  ];

  const saveFaqCalls: SaveFaqArgs[] = [];
  const deleteFaqCalls: DeleteFaqArgs[] = [];
  let lastCreatedFaqId: string | null = null;

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

  await page.route("**/api/query_ts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  const handleQuery = (route: Route) => {
    const { path } = decodeConvexRequest(route);
    switch (path) {
      case "knowledgeBase:listProperties":
        return respond(route, properties);
      case "knowledgeBase:listFaqs":
        return respond(route, faqs);
      case "knowledgeBase:listLocalRecommendations":
        return respond(route, []);
      default:
        return respond(route, null);
    }
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", handleQuery);

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

  await page.route("**/api/mutation", (route) => {
    const { path, args } = decodeConvexRequest(route);
    if (path === "knowledgeBase:saveFaq") {
      const payload = args as SaveFaqArgs;
      const normalised: SaveFaqArgs = {
        ...payload,
        id: typeof payload.id === "string" ? payload.id : undefined,
        propertyId: String(payload.propertyId),
        text: String(payload.text),
        category:
          typeof payload.category === "string" ? payload.category : undefined,
        tags: Array.isArray(payload.tags)
          ? payload.tags.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
      };
      saveFaqCalls.push(normalised);

      const updatedRecord: FaqRecord = {
        id:
          normalised.id ??
          `faq_${Date.now().toString(36)}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        propertyId: normalised.propertyId,
        text: normalised.text,
        category: normalised.category ?? null,
        tags: normalised.tags ?? [],
        updatedAt: Date.now(),
      };

      if (normalised.id) {
        faqs = faqs.map((faq) =>
          faq.id === normalised.id ? { ...faq, ...updatedRecord } : faq,
        );
      } else {
        lastCreatedFaqId = updatedRecord.id;
        faqs = [...faqs, updatedRecord];
      }

      return respond(route, {});
    }

    if (path === "knowledgeBase:deleteFaq") {
      const payload = args as DeleteFaqArgs;
      const id = String(payload.id);
      deleteFaqCalls.push({ id });
      faqs = faqs.filter((faq) => faq.id !== id);
      return respond(route, {});
    }

    return respond(route, {});
  });

  return {
    getLastCreatedFaqId: () => lastCreatedFaqId,
    saveFaqCalls,
    deleteFaqCalls,
  };
};

test.describe("Knowledge base FAQ management", () => {
  test("supports FAQ filtering and CRUD workflows", async ({ page }) => {
    const mocks = await setupKnowledgeBaseMocks(page);

    await page.goto("/knowledge-base");

    await expect(
      page.getByRole("heading", { name: "Property knowledge base" }),
    ).toBeVisible();

    const faqTable = page.locator("table").first();
    await expect(faqTable.locator("tbody tr")).toHaveCount(2);

    const searchInput = page.getByPlaceholder("Search FAQs");
    await searchInput.fill("wifi");
    await expect(faqTable.locator("tbody tr")).toHaveCount(1);
    await expect(
      page.getByText("What is the Wi-Fi password?", { exact: false }),
    ).toBeVisible();
    await searchInput.fill("");
    await expect(faqTable.locator("tbody tr")).toHaveCount(2);

    const faqPropertyFilter = page.getByRole("combobox", {
      name: "FAQ property filter",
    });
    await faqPropertyFilter.click();
    await page.getByRole("option", { name: "City Loft" }).click();
    await expect(faqTable.locator("tbody tr")).toHaveCount(1);
    await faqPropertyFilter.click();
    await page.getByRole("option", { name: "All properties" }).click();
    await expect(faqTable.locator("tbody tr")).toHaveCount(2);

    const faqCategoryFilter = page.getByRole("combobox", {
      name: "FAQ category filter",
    });
    await faqCategoryFilter.click();
    await page.getByRole("option", { name: "Amenities" }).click();
    await expect(faqTable.locator("tbody tr")).toHaveCount(1);
    await faqCategoryFilter.click();
    await page.getByRole("option", { name: "All categories" }).click();
    await expect(faqTable.locator("tbody tr")).toHaveCount(2);

    await page.getByRole("button", { name: "Add FAQ" }).click();
    const faqDialog = page.getByRole("dialog");
    await expect(
      faqDialog.getByRole("heading", { name: "Add FAQ" }),
    ).toBeVisible();

    await faqDialog.getByRole("button", { name: "Save" }).click();
    await expect(
      faqDialog.getByRole("heading", { name: "Add FAQ" }),
    ).toBeVisible();
    expect(mocks.saveFaqCalls).toHaveLength(0);

    await faqDialog.getByRole("combobox", { name: "Property" }).click();
    await page.getByRole("option", { name: "City Loft" }).click();

    await faqDialog
      .getByLabel("FAQ content")
      .fill("How do I access the gym?\nUse your keycard on level 2.");

    await faqDialog.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Amenities" }).click();

    const tagInput = faqDialog.getByPlaceholder("Add context tags");
    await tagInput.fill("fitness");
    await page.keyboard.press("Enter");

    await faqDialog.getByRole("button", { name: "Save" }).click();
    await expect(
      faqDialog.getByRole("heading", { name: "Add FAQ" }),
    ).not.toBeVisible();

    await expect(faqTable.locator("tbody tr")).toHaveCount(3);
    await expect(
      page.getByText("How do I access the gym?", { exact: false }),
    ).toBeVisible();

    expect(mocks.saveFaqCalls).toHaveLength(1);
    expect(mocks.saveFaqCalls[0]).toMatchObject({
      id: undefined,
      propertyId: "prop_city",
      text: "How do I access the gym?\nUse your keycard on level 2.",
      category: "Amenities",
      tags: ["fitness"],
    });

    await page.getByRole("button", { name: "Edit FAQ" }).first().click();
    const editDialog = page.getByRole("dialog");
    await expect(
      editDialog.getByRole("heading", { name: "Edit FAQ" }),
    ).toBeVisible();

    await editDialog
      .getByLabel("FAQ content")
      .fill(
        "What is the Wi-Fi password?\nNetwork: LakesideGuest\nPassword: shoreline-updated",
      );

    await editDialog.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Policies" }).click();

    await editDialog.getByLabel("Remove wifi").click();
    const editTagInput = editDialog.getByPlaceholder("Add context tags");
    await editTagInput.fill("internet");
    await page.keyboard.press("Enter");

    await editDialog.getByRole("button", { name: "Save" }).click();
    await expect(
      editDialog.getByRole("heading", { name: "Edit FAQ" }),
    ).not.toBeVisible();

    await expect(
      page.getByText("Password: shoreline-updated", { exact: false }),
    ).toBeVisible();

    expect(mocks.saveFaqCalls).toHaveLength(2);
    expect(mocks.saveFaqCalls[1]).toMatchObject({
      id: "faq_wifi",
      propertyId: "prop_lake",
      text: "What is the Wi-Fi password?\nNetwork: LakesideGuest\nPassword: shoreline-updated",
      category: "Policies",
      tags: ["internet"],
    });

    const newFaqRow = page
      .getByRole("row", { name: /How do I access the gym\?/ })
      .first();
    await newFaqRow.getByRole("button", { name: "Delete FAQ" }).click();

    const confirmDialog = page.getByRole("dialog");
    await expect(
      confirmDialog.getByRole("heading", { name: "Delete FAQ?" }),
    ).toBeVisible();
    expect(mocks.deleteFaqCalls).toHaveLength(0);

    await confirmDialog.getByRole("button", { name: "Delete" }).click();
    await expect(
      confirmDialog.getByRole("heading", { name: "Delete FAQ?" }),
    ).not.toBeVisible();

    await expect(faqTable.locator("tbody tr")).toHaveCount(2);
    await expect(
      page.getByText("How do I access the gym?", { exact: false }),
    ).toHaveCount(0);

    expect(mocks.deleteFaqCalls).toHaveLength(1);
    const lastCreatedId = mocks.getLastCreatedFaqId();
    expect(mocks.deleteFaqCalls[0]).toMatchObject({ id: lastCreatedId });
  });
});
