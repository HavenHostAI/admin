import { expect, test, type Page, type Route } from "@playwright/test";
import { jsonToConvex } from "convex/values";
import { TOKEN_STORAGE_KEY } from "../../src/lib/authStorage";

type ConvexCall = Record<string, unknown>;

type KnowledgeBaseMocks = {
  auth: {
    signIn: ConvexCall[];
    validateSession: ConvexCall[];
  };
  knowledgeBase: {
    listFaqs: ConvexCall[];
    listLocalRecommendations: ConvexCall[];
    listProperties: ConvexCall[];
  };
};

type ConvexRequest = {
  path?: string;
  args: ConvexCall;
};

const baseUser = {
  id: "user_knowledge_base",
  email: "owner@example.com",
  name: "Ops Owner",
  role: "owner",
  companyId: "company_1",
  status: "active",
};

const knowledgeBaseFixtures = {
  properties: [
    { id: "property_1", name: "Main Street Loft" },
    { id: "property_2", name: "Lakeside Retreat" },
  ],
  faqs: [
    {
      id: "faq_1",
      propertyId: "property_1",
      text: "Self check-in instructions are emailed 3 days before arrival.",
      category: "Check-in",
      tags: ["arrival", "self-check-in"],
      updatedAt: new Date("2024-01-04T10:15:00Z").getTime(),
    },
  ],
  localRecs: [
    {
      id: "local_1",
      propertyId: "property_2",
      name: "Sunrise Cafe",
      category: "Food & Drink",
      url: "https://sunrise.example.com",
      tips: "Try the seasonal latte flight.",
      hours: "8am – 2pm",
      tags: ["brunch", "local"],
      updatedAt: new Date("2024-01-10T09:00:00Z").getTime(),
    },
  ],
} as const;

const convexSuccessResponse = (value: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    status: "success",
    value,
    logLines: [],
  }),
});

const decodeConvexRequest = (route: Route): ConvexRequest => {
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
  const knowledgeBaseCalls = {
    listFaqs: [] as ConvexCall[],
    listLocalRecommendations: [] as ConvexCall[],
    listProperties: [] as ConvexCall[],
  };

  const authCalls = {
    signIn: [] as ConvexCall[],
    validateSession: [] as ConvexCall[],
  };

  let activeToken: string | null = null;

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
    const { path, args } = decodeConvexRequest(route);

    if (path === "knowledgeBase:listProperties") {
      knowledgeBaseCalls.listProperties.push(args);
      return respond(route, knowledgeBaseFixtures.properties);
    }

    if (path === "knowledgeBase:listFaqs") {
      knowledgeBaseCalls.listFaqs.push(args);
      return respond(route, knowledgeBaseFixtures.faqs);
    }

    if (path === "knowledgeBase:listLocalRecommendations") {
      knowledgeBaseCalls.listLocalRecommendations.push(args);
      return respond(route, knowledgeBaseFixtures.localRecs);
    }

    if (path === "admin:list" || path === "admin:getManyReference") {
      return respond(route, { data: [], total: 0 });
    }

    if (path === "admin:getMany") {
      return respond(route, []);
    }

    if (path === "admin:get") {
      return respond(route, {});
    }

    return respond(route, null);
  };

  await page.route("**/api/query", handleQuery);
  await page.route("**/api/query_at_ts", (route) => respond(route, null));
  await page.route("**/api/mutation", (route) => respond(route, {}));

  await page.route("**/api/action", (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === "auth:signIn") {
      authCalls.signIn.push(args);
      activeToken = "test-session-token";
      return respond(route, {
        token: activeToken,
        user: baseUser,
      });
    }

    if (path === "auth:validateSession") {
      authCalls.validateSession.push(args);
      if (!activeToken || args.token !== activeToken) {
        return respond(route, null);
      }
      const now = new Date();
      return respond(route, {
        session: {
          token: activeToken,
          userId: baseUser.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        user: baseUser,
      });
    }

    if (path === "auth:signOut") {
      activeToken = null;
      return respond(route, {});
    }

    return respond(route, null);
  });

  return {
    auth: authCalls,
    knowledgeBase: knowledgeBaseCalls,
  };
};

test.describe("Knowledge Base tabs", () => {
  test("switching between FAQs and local recommendations loads the correct data", async ({
    page,
  }) => {
    const mocks = await setupKnowledgeBaseMocks(page);

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

    const knowledgeBaseLink = page.getByRole("link", {
      name: "Knowledge Base",
    });
    await expect(knowledgeBaseLink).toBeVisible();
    await knowledgeBaseLink.click();

    await expect(page).toHaveURL(/\/knowledge-base/);
    await expect(
      page.getByRole("heading", { name: "Property knowledge base" }),
    ).toBeVisible();

    const faqTab = page.getByRole("tab", { name: "FAQs" });
    const localTab = page.getByRole("tab", { name: "Local recommendations" });
    const faqPanel = page.getByRole("tabpanel", { name: "FAQs" });
    const localPanel = page.getByRole("tabpanel", {
      name: "Local recommendations",
    });

    await expect(faqTab).toHaveAttribute("data-state", "active");
    await expect(localTab).toHaveAttribute("data-state", "inactive");
    await expect(faqPanel).toBeVisible();
    await expect(localPanel).toBeHidden();

    await expect(
      page.getByText(knowledgeBaseFixtures.faqs[0].text, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(knowledgeBaseFixtures.properties[0].name, { exact: true }),
    ).toBeVisible();

    await expect
      .poll(() => mocks.knowledgeBase.listProperties.length)
      .toBeGreaterThan(0);
    await expect
      .poll(() => mocks.knowledgeBase.listFaqs.length)
      .toBeGreaterThan(0);

    const [firstFaqArgs] = mocks.knowledgeBase.listFaqs;
    const [firstPropertyArgs] = mocks.knowledgeBase.listProperties;
    expect(firstFaqArgs).toEqual({});
    expect(firstPropertyArgs).toEqual({});

    await localTab.click();

    await expect(localTab).toHaveAttribute("data-state", "active");
    await expect(faqTab).toHaveAttribute("data-state", "inactive");
    await expect(localPanel).toBeVisible();
    await expect(faqPanel).toBeHidden();

    await expect(localPanel).toContainText(
      knowledgeBaseFixtures.localRecs[0].name,
    );
    await expect(localPanel).toContainText(
      knowledgeBaseFixtures.localRecs[0].tips,
    );
    await expect(localPanel).toContainText(
      knowledgeBaseFixtures.properties[1].name,
    );

    await expect
      .poll(() => mocks.knowledgeBase.listLocalRecommendations.length)
      .toBeGreaterThan(0);

    const [firstLocalArgs] = mocks.knowledgeBase.listLocalRecommendations;
    expect(firstLocalArgs).toEqual({});

    const url = new URL(page.url());
    const tabParam = url.searchParams.get("tab");

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "Property knowledge base" }),
    ).toBeVisible();

    const refreshedUrl = new URL(page.url());
    const refreshedTabParam = refreshedUrl.searchParams.get("tab");

    if (tabParam) {
      expect(refreshedTabParam).toBe(tabParam);
    } else {
      expect(refreshedTabParam).toBeNull();
    }

    const refreshedFaqTab = page.getByRole("tab", { name: "FAQs" });
    const refreshedLocalTab = page.getByRole("tab", {
      name: "Local recommendations",
    });

    if (refreshedTabParam) {
      await expect(refreshedLocalTab).toHaveAttribute("data-state", "active");
      await expect(
        page.getByText(knowledgeBaseFixtures.localRecs[0].name, {
          exact: true,
        }),
      ).toBeVisible();
    } else {
      await expect(refreshedFaqTab).toHaveAttribute("data-state", "active");
      await expect(
        page.getByText(knowledgeBaseFixtures.faqs[0].text, { exact: true }),
      ).toBeVisible();
    }
  });
});
