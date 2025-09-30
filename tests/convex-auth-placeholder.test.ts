import { describe, expect, it, vi } from "vitest";

import { removeInvitationPlaceholder, __test } from "../convex/authHelpers";
import { internal } from "../convex/_generated/api";

describe("removeInvitationPlaceholder", () => {
  it("removes invited placeholder users for matching email and company", async () => {
    const email = "invitee@example.com";
    const emailLower = email.toLowerCase();
    const companyId = "company_1";

    const placeholderDoc = {
      _id: "placeholderDocId",
      id: "invitation:token-123",
      email,
      status: "invited",
      companyId,
    } as Record<string, unknown>;

    const runQuery = vi.fn(async () => [placeholderDoc]);
    const runMutation = vi.fn(async () => null);

    await removeInvitationPlaceholder(
      {
        runQuery,
        runMutation,
      } as never,
      emailLower,
      companyId as never,
    );

    expect(runQuery).toHaveBeenCalledWith(internal.authStore.getAll, {
      table: "users",
    });
    expect(runMutation).toHaveBeenCalledWith(internal.authStore.remove, {
      table: "users",
      documentId: placeholderDoc._id,
    });
  });

  it("ignores users that are not invitation placeholders", async () => {
    const emailLower = "existing@example.com";
    const companyId = "company_1";

    const runQuery = vi.fn(async () => [
      {
        _id: "existing",
        id: "user_123",
        email: emailLower,
        status: "active",
        companyId,
      },
    ]);
    const runMutation = vi.fn(async () => null);

    await removeInvitationPlaceholder(
      {
        runQuery,
        runMutation,
      } as never,
      emailLower,
      companyId as never,
    );

    expect(runMutation).not.toHaveBeenCalled();
  });
});

describe("isInvitationPlaceholder", () => {
  const { isInvitationPlaceholder } = __test;

  it("identifies placeholder users by id prefix", () => {
    const result = isInvitationPlaceholder(
      {
        id: "invitation:abc",
        email: "user@example.com",
        companyId: "company_1",
        status: "pending",
      },
      "user@example.com",
      "company_1" as never,
    );

    expect(result).toBe(true);
  });

  it("identifies placeholder users by invited status", () => {
    const result = isInvitationPlaceholder(
      {
        id: "user_123",
        email: "user@example.com",
        companyId: "company_1",
        status: "invited",
      },
      "user@example.com",
      "company_1" as never,
    );

    expect(result).toBe(true);
  });

  it("rejects records for other companies", () => {
    const result = isInvitationPlaceholder(
      {
        id: "invitation:abc",
        email: "user@example.com",
        companyId: "company_2",
        status: "invited",
      },
      "user@example.com",
      "company_1" as never,
    );

    expect(result).toBe(false);
  });
});
