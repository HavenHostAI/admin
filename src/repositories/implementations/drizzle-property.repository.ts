import { eq, desc, count, and, or, like } from "drizzle-orm";
import { db } from "@/server/db";
import { properties } from "@/server/db/schema";
import { isValidPropertyType, isValidPropertyStatus } from "@/lib/constants";
import type {
  PropertyRepository,
  Property,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyListOptions,
  PropertyListResult,
} from "../interfaces/property.repository";

type DbProperty = typeof properties.$inferSelect;

export class DrizzlePropertyRepository implements PropertyRepository {
  private mapDbPropertyToProperty(dbProperty: DbProperty): Property {
    // Validate property type and handle data integrity issues
    if (!isValidPropertyType(dbProperty.type)) {
      const errorMessage = `[DrizzlePropertyRepository] Invalid property type '${dbProperty.type}' for property '${dbProperty.id}'.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Validate property status and handle data integrity issues
    if (!isValidPropertyStatus(dbProperty.status)) {
      const errorMessage = `[DrizzlePropertyRepository] Invalid property status '${dbProperty.status}' for property '${dbProperty.id}'.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    return {
      id: dbProperty.id,
      name: dbProperty.name,
      description: dbProperty.description ?? undefined,
      type: isValidPropertyType(dbProperty.type) ? dbProperty.type : "server",
      status: isValidPropertyStatus(dbProperty.status)
        ? dbProperty.status
        : "active",
      configuration:
        (dbProperty.configuration as Record<string, unknown> | null) ?? {},
      owner_id: dbProperty.owner_id ?? undefined,
      is_active: dbProperty.is_active ?? true,
      created_at: dbProperty.created_at,
      updated_at: dbProperty.updated_at ?? dbProperty.created_at,
    };
  }

  async findById(id: string): Promise<Property | null> {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    return result[0] ? this.mapDbPropertyToProperty(result[0]) : null;
  }

  async findByName(name: string): Promise<Property | null> {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.name, name))
      .limit(1);
    return result[0] ? this.mapDbPropertyToProperty(result[0]) : null;
  }

  async findAll(options?: PropertyListOptions): Promise<PropertyListResult> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (options?.search) {
      conditions.push(
        or(
          like(properties.name, `%${options.search}%`),
          like(properties.description, `%${options.search}%`),
        ),
      );
    }

    if (options?.type) {
      conditions.push(eq(properties.type, options.type));
    }

    if (options?.status) {
      conditions.push(eq(properties.status, options.status));
    }

    if (options?.owner_id) {
      conditions.push(eq(properties.owner_id, options.owner_id));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(properties)
      .where(whereClause);
    const total = totalResult[0]?.count ?? 0;

    // Get properties with pagination
    const propertiesList = await db
      .select()
      .from(properties)
      .where(whereClause)
      .orderBy(desc(properties.created_at))
      .limit(limit)
      .offset(offset);
    const total_pages = Math.ceil(total / limit);

    return {
      properties: propertiesList.map((dbProperty) =>
        this.mapDbPropertyToProperty(dbProperty),
      ),
      total,
      page,
      limit,
      total_pages,
    };
  }

  async create(data: CreatePropertyData): Promise<Property> {
    const result = await db
      .insert(properties)
      .values({
        name: data.name,
        description: data.description,
        type: data.type,
        status: data.status,
        configuration: data.configuration,
        owner_id: data.owner_id,
      })
      .returning();

    return this.mapDbPropertyToProperty(result[0]!);
  }

  async update(id: string, data: UpdatePropertyData): Promise<Property> {
    const result = await db
      .update(properties)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    return this.mapDbPropertyToProperty(result[0]!);
  }

  async delete(id: string): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  async count(
    options?: Omit<PropertyListOptions, "page" | "limit">,
  ): Promise<number> {
    const conditions = [];

    if (options?.search) {
      conditions.push(
        or(
          like(properties.name, `%${options.search}%`),
          like(properties.description, `%${options.search}%`),
        ),
      );
    }

    if (options?.type) {
      conditions.push(eq(properties.type, options.type));
    }

    if (options?.status) {
      conditions.push(eq(properties.status, options.status));
    }

    if (options?.owner_id) {
      conditions.push(eq(properties.owner_id, options.owner_id));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: count() })
      .from(properties)
      .where(whereClause);

    return result[0]?.count ?? 0;
  }
}
