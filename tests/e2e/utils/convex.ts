import type { Route } from "@playwright/test";
import { jsonToConvex, type ValueJSON } from "convex/values";

export type ConvexSuccessBody = {
  status: "success";
  value: unknown;
  logLines: unknown[];
};

export const convexSuccessResponse = (value: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    status: "success",
    value,
    logLines: [],
  } satisfies ConvexSuccessBody),
});

export type DecodedConvexRequest = {
  path?: string;
  args: Record<string, unknown>;
};

export const decodeConvexRequest = (route: Route): DecodedConvexRequest => {
  const bodyText = route.request().postData() ?? "{}";
  const body = JSON.parse(bodyText) as {
    path?: string;
    args?: ValueJSON[];
  };

  const [encodedArgs] = body.args ?? [];
  const decodedArgs = encodedArgs
    ? (jsonToConvex(encodedArgs) as Record<string, unknown>)
    : {};

  return { path: body.path, args: decodedArgs };
};

export const fulfillConvexSuccess = (route: Route, value: unknown) =>
  route.fulfill(convexSuccessResponse(value));
