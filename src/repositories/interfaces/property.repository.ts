export interface Property {
  id: string;
  name: string;
  description?: string;
  type: "server" | "domain" | "ssl_certificate" | "database" | "storage";
  status: "active" | "inactive" | "maintenance" | "suspended";
  configuration?: Record<string, unknown>;
  owner_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePropertyData {
  name: string;
  description?: string;
  type: "server" | "domain" | "ssl_certificate" | "database" | "storage";
  status: "active" | "inactive" | "maintenance" | "suspended";
  configuration?: Record<string, unknown>;
  owner_id?: string;
}

export interface UpdatePropertyData {
  name?: string;
  description?: string;
  type?: "server" | "domain" | "ssl_certificate" | "database" | "storage";
  status?: "active" | "inactive" | "maintenance" | "suspended";
  configuration?: Record<string, unknown>;
  owner_id?: string;
  is_active?: boolean;
}

export interface PropertyListOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: "server" | "domain" | "ssl_certificate" | "database" | "storage";
  status?: "active" | "inactive" | "maintenance" | "suspended";
}

export interface PropertyListResult {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PropertyRepository {
  findById(id: string): Promise<Property | null>;
  findByName(name: string): Promise<Property | null>;
  findAll(options?: PropertyListOptions): Promise<PropertyListResult>;
  create(data: CreatePropertyData): Promise<Property>;
  update(id: string, data: UpdatePropertyData): Promise<Property>;
  delete(id: string): Promise<void>;
  count(options?: Omit<PropertyListOptions, "page" | "limit">): Promise<number>;
}
