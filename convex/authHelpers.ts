import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const isInvitationPlaceholder = (
  doc: Record<string, unknown>,
  emailLower: string,
  companyId: Id<"companies">,
) => {
  const docEmail =
    typeof doc.email === "string" ? doc.email.toLowerCase() : null;
  const docCompanyId = "companyId" in doc ? String(doc.companyId ?? "") : "";
  const docStatus =
    typeof doc.status === "string" ? doc.status.toLowerCase() : null;
  const docId = typeof doc.id === "string" ? doc.id : "";

  return (
    docEmail === emailLower &&
    docCompanyId === String(companyId) &&
    (docId.startsWith("invitation:") || docStatus === "invited")
  );
};

export const removeInvitationPlaceholder = async (
  ctx: Pick<ActionCtx, "runQuery" | "runMutation">,
  emailLower: string,
  companyId: Id<"companies">,
) => {
  const authUsers = (await ctx.runQuery(internal.authStore.getAll, {
    table: "users",
  })) as Array<Record<string, unknown>>;

  const placeholderUser = authUsers.find((doc) =>
    isInvitationPlaceholder(doc, emailLower, companyId),
  );

  if (placeholderUser && "_id" in placeholderUser) {
    await ctx.runMutation(internal.authStore.remove, {
      table: "users",
      documentId: placeholderUser._id,
    });
  }
};

export const __test = { isInvitationPlaceholder };
