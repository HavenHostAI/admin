import type { PropertyRepository } from "@/repositories/interfaces/property.repository";
import type {
  Property,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyListOptions,
  PropertyListResult,
} from "@/repositories/interfaces/property.repository";
import type { User } from "~/types/openapi";
import {
  canCreateProperty,
  canUpdateProperty,
  canDeleteProperty,
  canReadProperty,
} from "@/lib/permissions";

export class PropertyService {
  constructor(private propertyRepository: PropertyRepository) {}

  async getPropertyById(id: string, user: User): Promise<Property | null> {
    // Permission check: User must be able to read properties
    if (!canReadProperty(user)) {
      throw new Error("Insufficient permissions to view properties");
    }

    const property = await this.propertyRepository.findById(id);

    // Tenant filtering: Only return property if user owns it
    if (property && property.owner_id !== user.id) {
      throw new Error("Property not found or access denied");
    }

    return property;
  }

  async getPropertyByName(name: string): Promise<Property | null> {
    return await this.propertyRepository.findByName(name);
  }

  async listProperties(
    user: User,
    options?: PropertyListOptions,
  ): Promise<PropertyListResult> {
    // Permission check: User must be able to read properties
    if (!canReadProperty(user)) {
      throw new Error("Insufficient permissions to view properties");
    }

    // Tenant filtering: Only show properties owned by the current user
    const tenantFilteredOptions = {
      ...options,
      owner_id: user.id, // Filter by current user's ID
    };

    return await this.propertyRepository.findAll(tenantFilteredOptions);
  }

  async createProperty(
    data: CreatePropertyData,
    user: User,
  ): Promise<Property> {
    // Permission check: User must be able to create properties (Manager+)
    if (!canCreateProperty(user)) {
      throw new Error("Insufficient permissions to create properties");
    }

    // Business rule: Validate property name uniqueness
    const existingProperty = await this.propertyRepository.findByName(
      data.name,
    );
    if (existingProperty) {
      throw new Error("Property with this name already exists");
    }

    // Business rule: Validate property type and status combination
    this.validatePropertyTypeAndStatus(data.type, data.status);

    // Business rule: Normalize data and set owner
    const normalizedData = {
      ...data,
      name: this.normalizePropertyName(data.name),
      owner_id: user.id, // Set the current user as the owner
    };

    return await this.propertyRepository.create(normalizedData);
  }

  async updateProperty(
    id: string,
    data: UpdatePropertyData,
    user: User,
  ): Promise<Property> {
    // Permission check: User must be able to update properties (Manager+)
    if (!canUpdateProperty(user)) {
      throw new Error("Insufficient permissions to update properties");
    }

    // Business rule: Check if property exists
    const existingProperty = await this.propertyRepository.findById(id);
    if (!existingProperty) {
      throw new Error("Property not found");
    }

    // Tenant filtering: Only allow updating properties owned by the current user
    if (existingProperty.owner_id !== user.id) {
      throw new Error("Property not found or access denied");
    }

    // Business rule: Validate name uniqueness if name is being updated
    if (data.name && data.name !== existingProperty.name) {
      const nameExists = await this.propertyRepository.findByName(data.name);
      if (nameExists) {
        throw new Error("Property with this name already exists");
      }
    }

    // Business rule: Validate property type and status combination
    if (data.type && data.status) {
      this.validatePropertyTypeAndStatus(data.type, data.status);
    } else if (data.type) {
      this.validatePropertyTypeAndStatus(data.type, existingProperty.status);
    } else if (data.status) {
      this.validatePropertyTypeAndStatus(existingProperty.type, data.status);
    }

    // Business rule: Normalize data if provided
    const normalizedData = {
      ...data,
      name: data.name ? this.normalizePropertyName(data.name) : undefined,
    };

    return await this.propertyRepository.update(id, normalizedData);
  }

  async deleteProperty(id: string, user: User): Promise<void> {
    // Permission check: User must be able to delete properties (Admin only)
    if (!canDeleteProperty(user)) {
      throw new Error("Insufficient permissions to delete properties");
    }

    // Business rule: Check if property exists
    const existingProperty = await this.propertyRepository.findById(id);
    if (!existingProperty) {
      throw new Error("Property not found");
    }

    // Tenant filtering: Only allow deleting properties owned by the current user
    if (existingProperty.owner_id !== user.id) {
      throw new Error("Property not found or access denied");
    }

    // Business rule: Soft delete by deactivating
    await this.propertyRepository.update(id, { is_active: false });
  }

  async deactivateProperty(id: string, user: User): Promise<Property> {
    return await this.updateProperty(id, { is_active: false }, user);
  }

  async activateProperty(id: string, user: User): Promise<Property> {
    return await this.updateProperty(id, { is_active: true }, user);
  }

  async getPropertyCount(
    user: User,
    options?: Omit<PropertyListOptions, "page" | "limit">,
  ): Promise<number> {
    // Permission check: User must be able to read properties
    if (!canReadProperty(user)) {
      throw new Error("Insufficient permissions to view properties");
    }

    // Tenant filtering: Only count properties owned by the current user
    const tenantFilteredOptions = {
      ...options,
      owner_id: user.id, // Filter by current user's ID
    };

    return await this.propertyRepository.count(tenantFilteredOptions);
  }

  // Private business logic methods
  private validatePropertyTypeAndStatus(
    type: "server" | "domain" | "ssl_certificate" | "database" | "storage",
    status: "active" | "inactive" | "maintenance" | "suspended",
  ): void {
    // Business rule: SSL certificates cannot be in maintenance status
    if (type === "ssl_certificate" && status === "maintenance") {
      throw new Error("SSL certificates cannot be in maintenance status");
    }

    // Business rule: Storage cannot be suspended
    if (type === "storage" && status === "suspended") {
      throw new Error("Storage cannot be suspended");
    }
  }

  private normalizePropertyName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .substring(0, 255);
  }
}
