import type { Page } from "@playwright/test";

type MockPropertyType =
  | "server"
  | "domain"
  | "ssl_certificate"
  | "database"
  | "storage";

type MockPropertyStatus = "active" | "inactive" | "maintenance" | "suspended";

type MockProperty = {
  id: string;
  name: string;
  description?: string;
  type: MockPropertyType;
  status: MockPropertyStatus;
  configuration: Record<string, unknown>;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type MockUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type MockPermission = {
  id: string;
  name: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
  description?: string;
  created_at: string;
};

type MockRole = {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  permissionIds: string[];
  created_at: string;
  updated_at: string;
};

type MockPost = { id: string; name: string; createdAt: string };

type MockState = {
  counters: {
    property: number;
    user: number;
    role: number;
    post: number;
  };
  auth: {
    forceCredentialsError: boolean;
  };
  properties: MockProperty[];
  users: MockUser[];
  permissions: MockPermission[];
  roles: MockRole[];
  posts: MockPost[];
  tenant: {
    stats: {
      totalUsers: number;
      monthlyGrowth: string;
      activeServers: number;
      uptime: string;
      databaseSize: string;
      alerts: number;
      completedTasks: number;
    };
    recentActivity: Array<{
      id: string;
      action: string;
      user: string;
      time: string;
      status: "success" | "warning" | "info";
    }>;
    performance: {
      responseTime: number;
      throughput: number;
      errorRate: number;
      cpuUsage: number;
      memoryUsage: number;
      storageUsage: number;
    };
    settings: {
      tenantName: string;
      timezone: string;
      emailNotifications: boolean;
      systemAlerts: boolean;
      performanceWarnings: boolean;
    };
  };
};

declare global {
  interface Window {
    __mockState?: MockState;
  }
}

const nowIso = () => new Date().toISOString();

const PROPERTY_TYPES: MockPropertyType[] = [
  "server",
  "domain",
  "ssl_certificate",
  "database",
  "storage",
];

const PROPERTY_STATUSES: MockPropertyStatus[] = [
  "active",
  "inactive",
  "maintenance",
  "suspended",
];

const isMockPropertyType = (value: unknown): value is MockPropertyType =>
  typeof value === "string" && (PROPERTY_TYPES as string[]).includes(value);

const isMockPropertyStatus = (value: unknown): value is MockPropertyStatus =>
  typeof value === "string" && (PROPERTY_STATUSES as string[]).includes(value);

const createInitialState = (): MockState => ({
  counters: {
    property: 3,
    user: 3,
    role: 3,
    post: 1,
  },
  auth: {
    forceCredentialsError: false,
  },
  properties: [
    {
      id: "prop_1",
      name: "Test Server 1",
      description: "A test server for E2E testing",
      type: "server",
      status: "active",
      configuration: { cpu: "2 cores", memory: "4GB" },
      owner_id: "user_1",
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: "prop_2",
      name: "Test Domain 1",
      description: "A test domain for E2E testing",
      type: "domain",
      status: "active",
      configuration: { domain: "example.test" },
      owner_id: "user_1",
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ],
  users: [
    {
      id: "user_1",
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: "user_2",
      email: "test@example.com",
      name: "Test User",
      role: "viewer",
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ],
  permissions: [
    {
      id: "perm_1",
      name: "Manage Users",
      resource: "users",
      action: "manage",
      description: "Manage user accounts",
      created_at: nowIso(),
    },
    {
      id: "perm_2",
      name: "Manage Properties",
      resource: "properties",
      action: "manage",
      description: "Manage properties",
      created_at: nowIso(),
    },
    {
      id: "perm_3",
      name: "Read Properties",
      resource: "properties",
      action: "read",
      description: "Read properties",
      created_at: nowIso(),
    },
  ],
  roles: [
    {
      id: "role_1",
      name: "admin",
      description: "Administrator role",
      is_system: true,
      permissionIds: ["perm_1", "perm_2", "perm_3"],
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: "role_2",
      name: "manager",
      description: "Manager role",
      is_system: false,
      permissionIds: ["perm_2", "perm_3"],
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ],
  posts: [],
  tenant: {
    stats: {
      totalUsers: 42,
      monthlyGrowth: "5%",
      activeServers: 6,
      uptime: "99.95%",
      databaseSize: "12 GB",
      alerts: 1,
      completedTasks: 8,
    },
    recentActivity: [
      {
        id: "activity_1",
        action: "User registration",
        user: "Alice",
        time: "5 minutes ago",
        status: "success",
      },
      {
        id: "activity_2",
        action: "Server maintenance",
        user: "Bob",
        time: "20 minutes ago",
        status: "info",
      },
      {
        id: "activity_3",
        action: "Database backup",
        user: "System",
        time: "1 hour ago",
        status: "success",
      },
    ],
    performance: {
      responseTime: 42,
      throughput: 1200,
      errorRate: 0.4,
      cpuUsage: 35,
      memoryUsage: 62,
      storageUsage: 48,
    },
    settings: {
      tenantName: "My Tenant",
      timezone: "UTC",
      emailNotifications: true,
      systemAlerts: true,
      performanceWarnings: false,
    },
  },
});

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  }
  return {};
};

export async function setupMSW(page: Page) {
  const seedState = createInitialState();

  await page.addInitScript(
    ({ seed }) => {
      const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

      const normalizeEmail = (email: unknown) =>
        typeof email === "string" ? email.trim().toLowerCase() : "";

      const decodeInput = (value: unknown): Record<string, unknown> => {
        if (!value || typeof value !== "object") return {};
        const maybeJson = value as { json?: unknown };
        if (typeof maybeJson.json === "object" && maybeJson.json !== null) {
          return toRecord(maybeJson.json);
        }
        return toRecord(value);
      };

      const parseTrpcInputs = (
        url: string,
        init?: RequestInit,
      ): [Record<string, unknown>, ...Record<string, unknown>[]] => {
        const inputs: Record<string, unknown>[] = [];

        if (init?.body) {
          try {
            const parsed = JSON.parse(init.body as string);
            const values = Array.isArray(parsed)
              ? parsed
              : Object.values(parsed);
            values.forEach((entry) => inputs.push(decodeInput(entry)));
          } catch {
            // ignore malformed body
          }
        }

        if (!inputs.length) {
          try {
            const urlObj = new URL(url, window.location.origin);
            const inputParam = urlObj.searchParams.get("input");
            if (inputParam) {
              const parsed = JSON.parse(decodeURIComponent(inputParam));
              const values = Array.isArray(parsed)
                ? parsed
                : Object.values(parsed);
              values.forEach((entry) => inputs.push(decodeInput(entry)));
            }
          } catch {
            // ignore
          }
        }

        if (!inputs.length) {
          inputs.push({});
        }

        return inputs as [
          Record<string, unknown>,
          ...Record<string, unknown>[],
        ];
      };

      const trpcResponse = (data: unknown) =>
        new Response(JSON.stringify([{ result: { data: { json: data } } }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const trpcError = (message: string) =>
        new Response(
          JSON.stringify([
            {
              error: {
                message,
                data: { code: "BAD_REQUEST", httpStatus: 400 },
              },
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );

      const successResponse = (
        data: Record<string, unknown> = { success: true },
      ) => trpcResponse(data);

      const findRolePermissions = (
        state: MockState,
        role: MockState["roles"][number],
      ) =>
        role.permissionIds
          .map((id) =>
            state.permissions.find((permission) => permission.id === id),
          )
          .filter(
            (permission): permission is MockState["permissions"][number] =>
              Boolean(permission),
          )
          .map((permission) => ({ ...permission }));

      const ensureState = () => {
        if (!window.__mockState) {
          window.__mockState = clone(seed);
        }
        return window.__mockState;
      };

      const originalFetch = window.fetch.bind(window);

      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const state = ensureState();

        if (url.includes("/api/auth/session")) {
          return new Response(
            JSON.stringify({
              user: {
                id: "user_1",
                email: "admin@example.com",
                name: "Admin User",
                role: "admin",
              },
              expires: new Date(Date.now() + 86400000).toISOString(),
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url.includes("/api/auth/callback/credentials")) {
          if (state.auth.forceCredentialsError) {
            state.auth.forceCredentialsError = false;
            return new Response(
              JSON.stringify({
                error: "CredentialsSignin",
                ok: false,
                status: 401,
                url: null,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          return new Response(
            JSON.stringify({ ok: true, status: 200, url: "/tenant" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url.includes("/api/trpc/property.list")) {
          const [params] = parseTrpcInputs(url, init);
          const page = Number(params.page ?? 1);
          const limit = Number(params.limit ?? 10);
          let items = state.properties.filter((property) => property.is_active);

          if (typeof params.search === "string" && params.search) {
            const term = params.search.toLowerCase();
            items = items.filter(
              (property) =>
                property.name.toLowerCase().includes(term) ||
                (property.description ?? "").toLowerCase().includes(term),
            );
          }

          if (typeof params.type === "string" && params.type) {
            items = items.filter((property) => property.type === params.type);
          }

          if (typeof params.status === "string" && params.status) {
            items = items.filter(
              (property) => property.status === params.status,
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 25));

          const total = items.length;
          const totalPages = Math.max(1, Math.ceil(total / limit));
          const start = (page - 1) * limit;
          const pageItems = items.slice(start, start + limit);

          return trpcResponse({
            properties: clone(pageItems),
            total,
            page,
            limit,
            total_pages: totalPages,
          });
        }

        if (url.includes("/api/trpc/property.create")) {
          const [params] = parseTrpcInputs(url, init);
          if (!params.name || typeof params.name !== "string") {
            return trpcError("Property name is required");
          }

          const id = `prop_${state.counters.property++}`;
          const timestamp = new Date().toISOString();
          const property: MockProperty = {
            id,
            name: params.name,
            description:
              typeof params.description === "string" ? params.description : "",
            type: isMockPropertyType(params.type) ? params.type : "server",
            status: isMockPropertyStatus(params.status)
              ? params.status
              : "active",
            configuration:
              typeof params.configuration === "object"
                ? (params.configuration as Record<string, unknown>)
                : {},
            owner_id:
              typeof params.owner_id === "string" ? params.owner_id : "user_1",
            is_active: true,
            created_at: timestamp,
            updated_at: timestamp,
          };

          state.properties.push(property);
          return trpcResponse(clone(property));
        }

        if (url.includes("/api/trpc/property.update")) {
          const [params] = parseTrpcInputs(url, init);
          const id = typeof params.id === "string" ? params.id : "";
          const property = state.properties.find((item) => item.id === id);
          if (!property) {
            return trpcError("Property not found");
          }

          if (typeof params.name === "string") {
            property.name = params.name;
          }
          if (typeof params.description === "string") {
            property.description = params.description;
          }
          if (isMockPropertyType(params.type)) {
            property.type = params.type;
          }
          if (isMockPropertyStatus(params.status)) {
            property.status = params.status;
          }
          if (typeof params.configuration === "object") {
            property.configuration = params.configuration as Record<
              string,
              unknown
            >;
          }
          property.updated_at = new Date().toISOString();

          return trpcResponse(clone(property));
        }

        if (url.includes("/api/trpc/property.delete")) {
          const [params] = parseTrpcInputs(url, init);
          const id = typeof params.id === "string" ? params.id : "";
          state.properties = state.properties.filter(
            (property) => property.id !== id,
          );
          return successResponse();
        }

        if (url.includes("/api/trpc/user.list")) {
          const [params] = parseTrpcInputs(url, init);
          const page = Number(params.page ?? 1);
          const limit = Number(params.limit ?? 10);

          let items = [...state.users];

          if (typeof params.search === "string" && params.search) {
            const term = params.search.toLowerCase();
            items = items.filter(
              (user) =>
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term),
            );
          }

          if (typeof params.role === "string" && params.role) {
            const roleMatch = state.roles.find(
              (role) => role.id === params.role,
            );
            const roleName = roleMatch?.name ?? params.role;
            items = items.filter((user) => user.role === roleName);
          }

          if (typeof params.status === "string" && params.status) {
            const active = params.status === "active";
            items = items.filter((user) => user.is_active === active);
          }

          const total = items.length;
          const totalPages = Math.max(1, Math.ceil(total / limit));
          const start = (page - 1) * limit;
          const pageItems = items.slice(start, start + limit);

          return trpcResponse({
            users: clone(pageItems),
            pagination: {
              total,
              page,
              limit,
              total_pages: totalPages,
              has_next: page < totalPages,
              has_prev: page > 1,
            },
          });
        }

        if (url.includes("/api/trpc/user.create")) {
          const [params] = parseTrpcInputs(url, init);
          const email = normalizeEmail(params.email);
          if (!email) {
            return trpcError("Email is required");
          }
          const exists = state.users.find((user) => user.email === email);
          if (exists) {
            return trpcError("User already exists");
          }

          const id = `user_${state.counters.user++}`;
          const timestamp = new Date().toISOString();
          const user = {
            id,
            email,
            name: typeof params.name === "string" ? params.name : "",
            role: typeof params.role === "string" ? params.role : "viewer",
            is_active:
              typeof params.is_active === "boolean" ? params.is_active : true,
            created_at: timestamp,
            updated_at: timestamp,
          } satisfies MockState["users"][number];

          state.users.push(user);
          return trpcResponse(clone(user));
        }

        if (url.includes("/api/trpc/user.update")) {
          const [params] = parseTrpcInputs(url, init);
          const id = typeof params.id === "string" ? params.id : "";
          const user = state.users.find((item) => item.id === id);
          if (!user) {
            return trpcError("User not found");
          }

          if (typeof params.name === "string") {
            user.name = params.name;
          }
          if (typeof params.email === "string") {
            user.email = normalizeEmail(params.email);
          }
          if (typeof params.role === "string") {
            user.role = params.role;
          }
          if (typeof params.is_active === "boolean") {
            user.is_active = params.is_active;
          }
          user.updated_at = new Date().toISOString();

          return trpcResponse(clone(user));
        }

        if (url.includes("/api/trpc/user.delete")) {
          const [params] = parseTrpcInputs(url, init);
          const id = typeof params.id === "string" ? params.id : "";
          state.users = state.users.filter((user) => user.id !== id);
          return successResponse();
        }

        if (url.includes("/api/trpc/user.assignRole")) {
          const [params] = parseTrpcInputs(url, init);
          const userId = typeof params.userId === "string" ? params.userId : "";
          const roleId = typeof params.roleId === "string" ? params.roleId : "";
          const user = state.users.find((item) => item.id === userId);
          const role = state.roles.find((item) => item.id === roleId);
          if (!user || !role) {
            return trpcError("Unable to assign role");
          }
          user.role = role.name;
          user.updated_at = new Date().toISOString();
          return successResponse();
        }

        if (url.includes("/api/trpc/user.removeRole")) {
          const [params] = parseTrpcInputs(url, init);
          const userId = typeof params.userId === "string" ? params.userId : "";
          const user = state.users.find((item) => item.id === userId);
          if (!user) {
            return trpcError("Unable to remove role");
          }
          user.role = "viewer";
          user.updated_at = new Date().toISOString();
          return successResponse();
        }

        if (url.includes("/api/trpc/role.list")) {
          const [params] = parseTrpcInputs(url, init);
          const page = Number(params.page ?? 1);
          const limit = Number(params.limit ?? 10);

          let items = [...state.roles];

          if (typeof params.search === "string" && params.search) {
            const term = params.search.toLowerCase();
            items = items.filter((role) =>
              role.name.toLowerCase().includes(term),
            );
          }

          const total = items.length;
          const totalPages = Math.max(1, Math.ceil(total / limit));
          const start = (page - 1) * limit;
          const pageItems = items.slice(start, start + limit).map((role) => ({
            ...clone(role),
            permissions: findRolePermissions(state, role),
          }));

          return trpcResponse({
            roles: pageItems,
            pagination: {
              total,
              page,
              limit,
              total_pages: totalPages,
              has_next: page < totalPages,
              has_prev: page > 1,
            },
          });
        }

        if (url.includes("/api/trpc/role.create")) {
          const [params] = parseTrpcInputs(url, init);
          if (!params.name || typeof params.name !== "string") {
            return trpcError("Role name is required");
          }

          const id = `role_${state.counters.role++}`;
          const timestamp = new Date().toISOString();
          const role = {
            id,
            name: params.name,
            description:
              typeof params.description === "string" ? params.description : "",
            is_system: false,
            permissionIds: [] as string[],
            created_at: timestamp,
            updated_at: timestamp,
          } satisfies MockState["roles"][number];

          state.roles.push(role);
          return trpcResponse({
            ...clone(role),
            permissions: findRolePermissions(state, role),
          });
        }

        if (url.includes("/api/trpc/role.update")) {
          const [params] = parseTrpcInputs(url, init);
          const id = typeof params.id === "string" ? params.id : "";
          const role = state.roles.find((item) => item.id === id);
          if (!role) {
            return trpcError("Role not found");
          }

          if (typeof params.name === "string") {
            role.name = params.name;
          }
          if (typeof params.description === "string") {
            role.description = params.description;
          }
          role.updated_at = new Date().toISOString();

          return trpcResponse({
            ...clone(role),
            permissions: findRolePermissions(state, role),
          });
        }

        if (url.includes("/api/trpc/role.delete")) {
          const [params] = parseTrpcInputs(url, init);
          const id = typeof params.id === "string" ? params.id : "";
          state.roles = state.roles.filter((role) => role.id !== id);
          return successResponse();
        }

        if (url.includes("/api/trpc/role.assignPermission")) {
          const [params] = parseTrpcInputs(url, init);
          const roleId = typeof params.roleId === "string" ? params.roleId : "";
          const permissionId =
            typeof params.permissionId === "string" ? params.permissionId : "";
          const role = state.roles.find((item) => item.id === roleId);
          const permission = state.permissions.find(
            (item) => item.id === permissionId,
          );
          if (!role || !permission) {
            return trpcError("Unable to assign permission");
          }
          if (!role.permissionIds.includes(permissionId)) {
            role.permissionIds.push(permissionId);
            role.updated_at = new Date().toISOString();
          }
          return successResponse();
        }

        if (url.includes("/api/trpc/role.removePermission")) {
          const [params] = parseTrpcInputs(url, init);
          const roleId = typeof params.roleId === "string" ? params.roleId : "";
          const permissionId =
            typeof params.permissionId === "string" ? params.permissionId : "";
          const role = state.roles.find((item) => item.id === roleId);
          if (!role) {
            return trpcError("Unable to remove permission");
          }
          role.permissionIds = role.permissionIds.filter(
            (idItem) => idItem !== permissionId,
          );
          role.updated_at = new Date().toISOString();
          return successResponse();
        }

        if (url.includes("/api/trpc/permission.getAll")) {
          return trpcResponse(clone(state.permissions));
        }

        if (url.includes("/api/trpc/tenant.getStats")) {
          return trpcResponse(clone(state.tenant.stats));
        }

        if (url.includes("/api/trpc/tenant.getRecentActivity")) {
          return trpcResponse(clone(state.tenant.recentActivity));
        }

        if (url.includes("/api/trpc/tenant.getPerformanceMetrics")) {
          return trpcResponse(clone(state.tenant.performance));
        }

        if (url.includes("/api/trpc/tenant.updateSettings")) {
          const [params] = parseTrpcInputs(url, init);
          if (typeof params.tenantName === "string") {
            state.tenant.settings.tenantName = params.tenantName;
          }
          if (typeof params.timezone === "string") {
            state.tenant.settings.timezone = params.timezone;
          }
          if (typeof params.emailNotifications === "boolean") {
            state.tenant.settings.emailNotifications =
              params.emailNotifications;
          }
          if (typeof params.systemAlerts === "boolean") {
            state.tenant.settings.systemAlerts = params.systemAlerts;
          }
          if (typeof params.performanceWarnings === "boolean") {
            state.tenant.settings.performanceWarnings =
              params.performanceWarnings;
          }
          return successResponse();
        }

        if (url.includes("/api/trpc/post.hello")) {
          return trpcResponse({ greeting: "Hello from mocked tRPC" });
        }

        if (url.includes("/api/trpc/post.create")) {
          const [params] = parseTrpcInputs(url, init);
          if (!params.name || typeof params.name !== "string") {
            return trpcError("Post title is required");
          }
          const id = `post_${state.counters.post++}`;
          const timestamp = new Date().toISOString();
          state.posts.push({ id, name: params.name, createdAt: timestamp });
          return successResponse({
            id,
            name: params.name,
            createdAt: timestamp,
          });
        }

        if (url.includes("/api/trpc/post.getLatest")) {
          const latest = state.posts.length
            ? state.posts[state.posts.length - 1]
            : null;
          return trpcResponse(latest);
        }

        return originalFetch(input, init);
      };
    },
    { seed: seedState },
  );
}
