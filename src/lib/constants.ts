// Property type constants
export const PROPERTY_TYPES = [
  "server",
  "domain",
  "ssl_certificate",
  "database",
  "storage",
] as const;
export const PROPERTY_STATUSES = [
  "active",
  "inactive",
  "maintenance",
  "suspended",
] as const;

// Property type labels for display
export const PROPERTY_TYPE_LABELS = {
  server: "Server",
  domain: "Domain",
  ssl_certificate: "SSL Certificate",
  database: "Database",
  storage: "Storage",
} as const;

// Status colors for badges
export const STATUS_COLORS = {
  active: "default",
  inactive: "secondary",
  maintenance: "destructive",
  suspended: "outline",
} as const;

// Type guards for property validation
export const isValidPropertyType = (
  value: unknown,
): value is (typeof PROPERTY_TYPES)[number] => {
  return (
    typeof value === "string" &&
    PROPERTY_TYPES.includes(value as (typeof PROPERTY_TYPES)[number])
  );
};

export const isValidPropertyStatus = (
  value: unknown,
): value is (typeof PROPERTY_STATUSES)[number] => {
  return (
    typeof value === "string" &&
    PROPERTY_STATUSES.includes(value as (typeof PROPERTY_STATUSES)[number])
  );
};

// Role validation constants and utilities
export const ALLOWED_ROLES = ["admin", "editor", "viewer"] as const;

export const validateUserRole = (
  role: unknown,
): (typeof ALLOWED_ROLES)[number] => {
  return ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])
    ? (role as (typeof ALLOWED_ROLES)[number])
    : "viewer";
};
