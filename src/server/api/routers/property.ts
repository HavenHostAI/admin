import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { PropertyService } from "@/services/property.service";
import { createRepositories } from "@/repositories";

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

export const propertyRouter = createTRPCRouter({
  list: protectedProcedure
    .input(PropertyListSchema)
    .query(async ({ input, ctx }) => {
      return await propertyService.listProperties(ctx.session.user, input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await propertyService.getPropertyById(input.id, ctx.session.user);
    }),

  create: protectedProcedure
    .input(CreatePropertySchema)
    .mutation(async ({ input, ctx }) => {
      return await propertyService.createProperty(input, ctx.session.user);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(UpdatePropertySchema))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      return await propertyService.updateProperty(
        id,
        updateData,
        ctx.session.user,
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await propertyService.deleteProperty(input.id, ctx.session.user);
      return { success: true };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await propertyService.deactivateProperty(
        input.id,
        ctx.session.user,
      );
    }),

  activate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await propertyService.activateProperty(input.id, ctx.session.user);
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
      return await propertyService.getPropertyCount(ctx.session.user, input);
    }),
});
