import { eq, desc, count, and, or, like, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { properties } from "@/server/db/schema";
import type {
  PropertyRepository,
  Property,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyListOptions,
  PropertyListResult,
} from "../interfaces/property.repository";

export class DrizzlePropertyRepository implements PropertyRepository {
  async findById(id: string): Promise<Property | null> {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findByName(name: string): Promise<Property | null> {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.name, name))
      .limit(1);
    return result[0] || null;
  }

  async findAll(options?: PropertyListOptions): Promise<PropertyListResult> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(properties)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    // Get properties with pagination
    let query = db
      .select()
      .from(properties)
      .orderBy(desc(properties.created_at))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      query = query.where(whereClause);
    }

    const propertiesList = await query;
    const total_pages = Math.ceil(total / limit);

    return {
      properties: propertiesList,
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

    return result[0]!;
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

    return result[0]!;
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: count() })
      .from(properties)
      .where(whereClause);

    return result[0]?.count || 0;
  }
}
