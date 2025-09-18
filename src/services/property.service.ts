import type { PropertyRepository } from "@/repositories/interfaces/property.repository";
import type {
  Property,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyListOptions,
  PropertyListResult,
} from "@/repositories/interfaces/property.repository";

export class PropertyService {
  constructor(private propertyRepository: PropertyRepository) {}

  async getPropertyById(id: string): Promise<Property | null> {
    return await this.propertyRepository.findById(id);
  }

  async getPropertyByName(name: string): Promise<Property | null> {
    return await this.propertyRepository.findByName(name);
  }

  async listProperties(
    options?: PropertyListOptions,
  ): Promise<PropertyListResult> {
    return await this.propertyRepository.findAll(options);
  }

  async createProperty(data: CreatePropertyData): Promise<Property> {
    // Business rule: Validate property name uniqueness
    const existingProperty = await this.propertyRepository.findByName(
      data.name,
    );
    if (existingProperty) {
      throw new Error("Property with this name already exists");
    }

    // Business rule: Validate property type and status combination
    this.validatePropertyTypeAndStatus(data.type, data.status);

    // Business rule: Normalize property name
    const normalizedData = {
      ...data,
      name: this.normalizePropertyName(data.name),
    };

    return await this.propertyRepository.create(normalizedData);
  }

  async updateProperty(
    id: string,
    data: UpdatePropertyData,
  ): Promise<Property> {
    // Business rule: Check if property exists
    const existingProperty = await this.propertyRepository.findById(id);
    if (!existingProperty) {
      throw new Error("Property not found");
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

  async deleteProperty(id: string): Promise<void> {
    // Business rule: Check if property exists
    const existingProperty = await this.propertyRepository.findById(id);
    if (!existingProperty) {
      throw new Error("Property not found");
    }

    // Business rule: Soft delete by deactivating
    await this.propertyRepository.update(id, { is_active: false });
  }

  async deactivateProperty(id: string): Promise<Property> {
    return await this.updateProperty(id, { is_active: false });
  }

  async activateProperty(id: string): Promise<Property> {
    return await this.updateProperty(id, { is_active: true });
  }

  async getPropertyCount(
    options?: Omit<PropertyListOptions, "page" | "limit">,
  ): Promise<number> {
    return await this.propertyRepository.count(options);
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
