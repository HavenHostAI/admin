import "../../../tests/setup";
import { rest } from "msw";
import { describe, expect, it } from "vitest";

import dataProvider from "@/lib/convexDataProvider";
import { server } from "../../../tests/setup";

describe("convexDataProvider", () => {
  it("maps Convex documents to react-admin records when listing resources", async () => {
    server.use(
      rest.post("http://test.convex/queries/admin/list", async (req, res, ctx) => {
        const body = await req.json();
        expect(body).toMatchObject({
          table: "companies",
          pagination: { page: 1, perPage: 25 },
        });
        return res(
          ctx.json({
            data: [
              { _id: "1", name: "Acme", address: "1 Infinite Loop" },
              { _id: "2", name: "Beta", address: "2 Main St" },
            ],
            total: 2,
          }),
        );
      }),
    );

    const result = await dataProvider.getList("companies", {
      pagination: { page: 1, perPage: 25 },
      sort: { field: "name", order: "ASC" },
      filter: {},
    });

    expect(result).toEqual({
      data: [
        { id: "1", name: "Acme", address: "1 Infinite Loop" },
        { id: "2", name: "Beta", address: "2 Main St" },
      ],
      total: 2,
    });
  });

  it("removes protected identifiers before creating new records", async () => {
    let receivedBody: unknown;
    server.use(
      rest.post("http://test.convex/mutations/admin/create", async (req, res, ctx) => {
        receivedBody = await req.json();
        return res(ctx.json({ _id: "3", name: "Gamma" }));
      }),
    );

    const result = await dataProvider.create("companies", {
      data: {
        id: "client-generated-id",
        _id: "convex-id",
        name: "Gamma",
      },
    });

    expect(receivedBody).toEqual({
      table: "companies",
      data: { name: "Gamma" },
      meta: undefined,
    });
    expect(result).toEqual({ data: { id: "3", name: "Gamma" } });
  });
});
