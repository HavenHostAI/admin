import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
// Note: Using string literal type instead of AdapterAccount type due to next-auth v5 beta compatibility
type AdapterAccountType = "oauth" | "email" | "credentials";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `admin_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull().unique(),
  password: d.varchar({ length: 255 }).notNull(),
  role: d.varchar({ length: 50 }).default("viewer"),
  is_active: d.boolean().default(true),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  created_at: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccountType>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// Roles table
export const roles = createTable(
  "role",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 100 }).notNull().unique(),
    description: d.varchar({ length: 500 }),
    is_system: d.boolean().default(false),
    created_at: d
      .timestamp({
        mode: "date",
        withTimezone: true,
      })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: d
      .timestamp({
        mode: "date",
        withTimezone: true,
      })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("role_name_idx").on(t.name),
    index("role_system_idx").on(t.is_system),
  ],
);

// Permissions table
export const permissions = createTable(
  "permission",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 100 }).notNull(),
    resource: d.varchar({ length: 50 }).notNull(),
    action: d.varchar({ length: 20 }).notNull(),
    description: d.varchar({ length: 500 }),
    created_at: d
      .timestamp({
        mode: "date",
        withTimezone: true,
      })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("permission_resource_action_idx").on(t.resource, t.action),
    index("permission_name_idx").on(t.name),
  ],
);

// User roles junction table
export const userRoles = createTable(
  "user_role",
  (d) => ({
    user_id: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role_id: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assigned_at: d
      .timestamp({
        mode: "date",
        withTimezone: true,
      })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    assigned_by: d.varchar({ length: 255 }).references(() => users.id),
  }),
  (t) => [
    primaryKey({ columns: [t.user_id, t.role_id] }),
    index("user_role_user_idx").on(t.user_id),
    index("user_role_role_idx").on(t.role_id),
  ],
);

// Role permissions junction table
export const rolePermissions = createTable(
  "role_permission",
  (d) => ({
    role_id: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission_id: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    assigned_at: d
      .timestamp({
        mode: "date",
        withTimezone: true,
      })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    assigned_by: d.varchar({ length: 255 }).references(() => users.id),
  }),
  (t) => [
    primaryKey({ columns: [t.role_id, t.permission_id] }),
    index("role_permission_role_idx").on(t.role_id),
    index("role_permission_permission_idx").on(t.permission_id),
  ],
);

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.user_id], references: [users.id] }),
  role: one(roles, { fields: [userRoles.role_id], references: [roles.id] }),
  assignedBy: one(users, {
    fields: [userRoles.assigned_by],
    references: [users.id],
  }),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.role_id],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permission_id],
      references: [permissions.id],
    }),
    assignedBy: one(users, {
      fields: [rolePermissions.assigned_by],
      references: [users.id],
    }),
  }),
);

// Update users relations to include roles
export const usersRelationsUpdated = relations(users, ({ many }) => ({
  accounts: many(accounts),
  userRoles: many(userRoles),
}));
