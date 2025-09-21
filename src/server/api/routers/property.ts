import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { PropertyService } from "@/services/property.service";
import { createRepositories } from "@/repositories";
import type { Session } from "next-auth";
import type { User as ServiceUser } from "~/types/api";

const repositories = createRepositories();
const propertyService = new PropertyService(repositories.propertyRepository);

// Zod schemas that match OpenAPI spec
const PropertyTypeSchema = z.enum([
  "server",
  "domain",
  "ssl_certificate",
  "database",
  "storage",
]);

const PropertyStatusSchema = z.enum([
  "active",
  "inactive",
  "maintenance",
  "suspended",
]);

const CreatePropertySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: PropertyTypeSchema,
  status: PropertyStatusSchema,
  configuration: z.record(z.unknown()).optional(),
  owner_id: z.string().optional(),
});

const UpdatePropertySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  type: PropertyTypeSchema.optional(),
  status: PropertyStatusSchema.optional(),
  configuration: z.record(z.unknown()).optional(),
  owner_id: z.string().optional(),
  is_active: z.boolean().optional(),
});

const PropertyListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: PropertyTypeSchema.optional(),
  status: PropertyStatusSchema.optional(),
});

const mapSessionUserToServiceUser = (
  sessionUser: Session["user"],
): ServiceUser => {
  const allowedRoles: ServiceUser["role"][] = ["admin", "editor", "viewer"];
  const role = allowedRoles.includes(sessionUser.role as ServiceUser["role"])
    ? (sessionUser.role as ServiceUser["role"])
    : "viewer";

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? "",
    name: sessionUser.name ?? "",
    image: sessionUser.image ?? undefined,
    role,
    is_active: true,
    email_verified: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const getServiceUser = (session: Session): ServiceUser => {
  if (!session.user) {
    throw new Error("Session does not include a user");
  }

  return mapSessionUserToServiceUser(session.user);
};

export const propertyRouter = createTRPCRouter({
  list: protectedProcedure
    .input(PropertyListSchema)
    .query(async ({ input, ctx }) => {
      const user = getServiceUser(ctx.session);
      return await propertyService.listProperties(user, input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = getServiceUser(ctx.session);
      return await propertyService.getPropertyById(input.id, user);
    }),

  create: protectedProcedure
    .input(CreatePropertySchema)
    .mutation(async ({ input, ctx }) => {
      const user = getServiceUser(ctx.session);
      return await propertyService.createProperty(input, user);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(UpdatePropertySchema))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const user = getServiceUser(ctx.session);
      return await propertyService.updateProperty(id, updateData, user);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = getServiceUser(ctx.session);
      await propertyService.deleteProperty(input.id, user);
      return { success: true };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = getServiceUser(ctx.session);
      return await propertyService.deactivateProperty(input.id, user);
    }),

  activate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = getServiceUser(ctx.session);
      return await propertyService.activateProperty(input.id, user);
    }),

  count: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: PropertyTypeSchema.optional(),
        status: PropertyStatusSchema.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = getServiceUser(ctx.session);
      return await propertyService.getPropertyCount(user, input);
    }),
});
