import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  companies: defineTable({
    name: v.string(),
    timezone: v.string(),
    branding: v.optional(
      v.object({
        logoUrl: v.optional(v.string()),
        greetingName: v.optional(v.string()),
      }),
    ),
    plan: v.string(),
    createdAt: v.number(),
  }).index("by_plan", ["plan"]),

  users: defineTable({
    id: v.string(),
    companyId: v.optional(v.id("companies")),
    email: v.string(),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company_email", ["companyId", "email"])
    .index("by_auth_id", ["id"]),

  properties: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      }),
    ),
    timeZone: v.optional(v.string()),
    flags: v.optional(
      v.object({
        noCodeOverPhone: v.optional(v.boolean()),
        alwaysEscalateLockout: v.optional(v.boolean()),
        upsellEnabled: v.optional(v.boolean()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_name", ["companyId", "name"]),

  propertyConfigs: defineTable({
    propertyId: v.id("properties"),
    access: v.optional(
      v.object({
        lockType: v.string(),
        code: v.optional(v.string()),
        instructions: v.string(),
        backup: v.optional(v.string()),
      }),
    ),
    wifi: v.optional(
      v.object({
        ssid: v.string(),
        password: v.string(),
        tips: v.optional(v.string()),
      }),
    ),
    checkin: v.optional(
      v.object({
        time: v.string(),
        instructions: v.string(),
      }),
    ),
    checkout: v.optional(
      v.object({
        time: v.string(),
        instructions: v.string(),
        eligibleForLate: v.optional(v.boolean()),
      }),
    ),
    parking: v.optional(
      v.object({
        instructions: v.string(),
        notes: v.optional(v.string()),
        permitRequired: v.optional(v.boolean()),
      }),
    ),
    rules: v.optional(
      v.object({
        pets: v.optional(v.boolean()),
        smoking: v.optional(v.boolean()),
        parties: v.optional(v.boolean()),
        quietHours: v.optional(
          v.object({
            start: v.string(),
            end: v.string(),
          }),
        ),
        extraFees: v.optional(
          v.object({
            feeName: v.string(),
            amount: v.number(),
          }),
        ),
      }),
    ),
    amenities: v.optional(
      v.object({
        ac: v.optional(v.boolean()),
        heating: v.optional(v.boolean()),
        laundry: v.optional(v.boolean()),
        tv: v.optional(v.boolean()),
        streamingApps: v.optional(v.array(v.string())),
        hotTub: v.optional(v.boolean()),
        pool: v.optional(v.boolean()),
        other: v.optional(v.string()),
      }),
    ),
    contacts: v.optional(
      v.object({
        onCall: v.array(
          v.object({
            name: v.string(),
            phone: v.string(),
            role: v.string(),
          }),
        ),
        vendors: v.optional(
          v.array(
            v.object({
              type: v.string(),
              name: v.string(),
              phone: v.string(),
            }),
          ),
        ),
        emergency: v.optional(
          v.object({
            police: v.optional(v.string()),
            fire: v.optional(v.string()),
            medical: v.optional(v.string()),
          }),
        ),
      }),
    ),
    upsells: v.optional(
      v.object({
        lateCheckout: v.optional(
          v.object({
            price: v.number(),
          }),
        ),
        midStayClean: v.optional(
          v.object({
            price: v.number(),
          }),
        ),
        other: v.optional(
          v.array(
            v.object({
              name: v.string(),
              price: v.number(),
            }),
          ),
        ),
      }),
    ),
    languages: v.optional(v.array(v.string())),
  }).index("by_property", ["propertyId"]),

  numbers: defineTable({
    companyId: v.id("companies"),
    e164: v.string(),
    assignedPropertyId: v.optional(v.id("properties")),
    assignedQueue: v.optional(v.string()),
    hours: v.optional(
      v.object({
        daily: v.optional(
          v.array(
            v.object({
              day: v.string(),
              open: v.string(),
              close: v.string(),
            }),
          ),
        ),
        fallbackNumber: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_property", ["assignedPropertyId"]),

  faqs: defineTable({
    propertyId: v.id("properties"),
    text: v.string(),
    tags: v.array(v.string()),
    embedding: v.optional(v.array(v.float64())),
    updatedAt: v.number(),
  })
    .index("by_property", ["propertyId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["propertyId"],
    }),

  localRecs: defineTable({
    propertyId: v.id("properties"),
    name: v.string(),
    category: v.string(),
    url: v.optional(v.string()),
    tips: v.optional(v.string()),
    hours: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    updatedAt: v.number(),
  })
    .index("by_property", ["propertyId"])
    .index("by_category", ["propertyId", "category"])
    .vectorIndex("recs_by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["propertyId", "category"],
    }),

  integrations: defineTable({
    companyId: v.id("companies"),
    type: v.string(),
    status: v.string(),
    secretsEncrypted: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
  }).index("by_company_type", ["companyId", "type"]),

  interactions: defineTable({
    companyId: v.id("companies"),
    propertyId: v.id("properties"),
    channel: v.string(),
    intent: v.string(),
    result: v.string(),
    durationSec: v.number(),
    createdAt: v.number(),
    piiHash: v.optional(v.string()),
    transcriptRef: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_createdAt", ["companyId", "createdAt"])
    .index("by_property", ["propertyId"])
    .index("by_intent", ["intent"]),

  escalations: defineTable({
    companyId: v.id("companies"),
    propertyId: v.id("properties"),
    priority: v.string(),
    topic: v.string(),
    status: v.string(),
    assigneeContact: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    summary: v.optional(v.string()),
    transcriptRef: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_createdAt", ["companyId", "createdAt"])
    .index("by_property_status", ["propertyId", "status"])
    .index("by_priority", ["propertyId", "priority"]),

  notifications: defineTable({
    escalationId: v.optional(v.id("escalations")),
    companyId: v.id("companies"),
    type: v.string(),
    to: v.string(),
    status: v.string(),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_escalation", ["escalationId"])
    .index("by_company", ["companyId"]),

  billingUsage: defineTable({
    companyId: v.id("companies"),
    month: v.string(),
    units: v.number(),
    minutes: v.number(),
    amountCents: v.number(),
  }).index("by_company_month", ["companyId", "month"]),

  auditLogs: defineTable({
    companyId: v.id("companies"),
    actorUserId: v.id("users"),
    entityType: v.string(),
    entityId: v.string(),
    action: v.string(),
    diff: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_entity", ["entityType", "entityId"]),

  companyInvitations: defineTable({
    token: v.string(),
    companyId: v.id("companies"),
    email: v.string(),
    invitedByUserId: v.id("users"),
    role: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_company_email", ["companyId", "email"]),

  authAccounts: defineTable({
    id: v.string(),
    userId: v.string(),
    providerId: v.string(),
    accountId: v.string(),
    password: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider_account", ["providerId", "accountId"]),

  authSessions: defineTable({
    id: v.string(),
    userId: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  authVerifications: defineTable({
    id: v.string(),
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_identifier", ["identifier"]),

  aiSettings: defineTable({
    companyId: v.id("companies"),
    propertyId: v.optional(v.id("properties")),
    greeting: v.optional(v.string()),
    tone: v.optional(v.string()),
    modelVersion: v.optional(v.string()),
    escalationKeywords: v.optional(v.array(v.string())),
    codeDisclosurePolicy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company_property", ["companyId", "propertyId"]),

  // API keys for tenants to authenticate third‑party services.
  apiKeys: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    key: v.string(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_key", ["key"]),

  // Webhook registrations for outbound notifications.
  webhooks: defineTable({
    companyId: v.id("companies"),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.optional(v.string()),
    status: v.string(),
    lastPingAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_company", ["companyId"]),

  // Do‑not‑call numbers to comply with customers’ preferences.
  dncNumbers: defineTable({
    companyId: v.id("companies"),
    phone: v.string(),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_company_phone", ["companyId", "phone"]),

  // Data retention settings controlling how long to store interactions.
  dataRetentionSettings: defineTable({
    companyId: v.id("companies"),
    conversationRetentionDays: v.optional(v.number()),
    interactionRetentionDays: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"]),

  // Evaluation results for nightly QA or test suites.
  evalResults: defineTable({
    companyId: v.id("companies"),
    propertyId: v.id("properties"),
    testName: v.string(),
    result: v.string(),
    score: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_property_test", ["propertyId", "testName"])
    .index("by_company", ["companyId"]),
});
