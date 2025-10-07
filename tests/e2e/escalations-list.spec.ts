import { expect, test } from "@playwright/test";
import { setupConvexMocks } from "./utils/convexMocks";

test.describe("Escalations list", () => {
  test("renders escalation metadata and opens the detail drawer", async ({
    page,
  }) => {
    const filtersResponse = {
      properties: [
        { id: "property_1", name: "Oceanview Apartments" },
        { id: "property_2", name: "Downtown Lofts" },
      ],
      priorities: ["high", "medium", "low"],
      statuses: ["open", "resolved"],
    };

    const createdAt = Date.UTC(2024, 2, 15, 14, 30);

    const escalationsResponse = [
      {
        id: "esc_1",
        propertyId: "property_1",
        propertyName: "Oceanview Apartments",
        priority: "high",
        status: "open",
        topic: "Broken elevator on the 12th floor",
        assigneeContact: "Sam Supervisor",
        createdAt,
      },
    ];

    const detailResponse = {
      ...escalationsResponse[0],
      summary: "Guest reported the elevator is stuck. Maintenance is en route.",
      resolvedAt: null,
      transcriptRef: "call-20240315-1430",
    };

    await setupConvexMocks(page, {
      queryHandlers: {
        "escalations:listFilters": () => filtersResponse,
        "escalations:listEscalations": () => escalationsResponse,
        "escalations:getEscalation": () => detailResponse,
      },
    });

    await page.goto("/escalations");
    await page.waitForLoadState("networkidle");

    const row = page
      .getByRole("row", { name: /Broken elevator on the 12th floor/i })
      .first();
    await expect(row).toBeVisible();

    await expect(
      row.locator('[data-slot="badge"]', { hasText: "High" }),
    ).toBeVisible();
    await expect(
      row.locator('[data-slot="badge"]', { hasText: "Open" }),
    ).toBeVisible();
    await expect(row.getByText("Sam Supervisor")).toBeVisible();
    await expect(row.locator(".lucide-user-round")).toBeVisible();

    const expectedTimestamp = await page.evaluate(
      (timestamp) =>
        new Date(timestamp).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      createdAt,
    );

    await expect(row.getByText(expectedTimestamp)).toBeVisible();

    await row.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(
      drawer.getByText(
        "Guest reported the elevator is stuck. Maintenance is en route.",
      ),
    ).toBeVisible();
    await expect(drawer.getByText("call-20240315-1430")).toBeVisible();
  });
});
