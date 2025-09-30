# Agent Operating Guide

These directives consolidate the previous `.cursor/rules` files.

## always-tdd.mdc

---

alwaysApply: true
description: Always follow test-driven development practices

---

# Test-Driven Development

- Start by writing or updating an automated test that fails because the desired behaviour does not yet exist.
- Run the relevant test command to observe the failure before making implementation changes.
- Implement the minimal code necessary to make the failing test(s) pass.
- Re-run the test suite (or focused tests) to confirm the fix.
- Only then proceed to refactor or extend the code, keeping the test suite green at each step.
- Prefer unit or integration tests that align with the project's existing testing stack (Vitest for unit, Playwright for e2e) unless the user specifies otherwise.

## husky-precommit.mdc

---

alwaysApply: true
description: Ensure Husky pre-commit checks pass before completing tasks

---

# Husky Pre-commit Checks

- All Husky pre-commit checks must pass before a task can be deemed complete.

## context7.mdc

---

alwaysApply: true
description: Always refer to context7 MCP server

---

# Context7 Usage

Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.

Here is the MCP server connection info you should use:

```
{
    "mcpServers": {
            "context7": {
            "url": "https://mcp.context7.com/mcp",
            "headers": {
                "CONTEXT7_API_KEY": "ctx7sk-2eb90c4c-9e22-4a72-9782-ce94954b3c1f"
            }
        }
    }
}
```

## conventional-commits.mdc

---

alwaysApply: true
description: Write conventional commits (feat/fix/chore/etc.)

---

# Conventional Commits

Always use conventional commit format for all git commits in this project.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

### Primary Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Additional Types

- **ci**: Changes to our CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies
- **revert**: Reverts a previous commit

## Examples

### Features

```bash
# New feature
feat: add user authentication system

# Feature with scope
feat(auth): add JWT token validation

# Feature with breaking change
feat(api): change user endpoint response format

BREAKING CHANGE: The user endpoint now returns user data in a nested 'data' object instead of directly.
```

### Bug Fixes

```bash
# Simple bug fix
fix: resolve memory leak in user service

# Bug fix with scope
fix(ui): correct button alignment in user form

# Bug fix with issue reference
fix: prevent duplicate user creation

Fixes #123
```

### Documentation

```bash
# Documentation updates
docs: update API documentation for user endpoints

# README updates
docs: add installation instructions to README

# Code comments
docs: add JSDoc comments to user service methods
```

### Style Changes

```bash
# Code formatting
style: format code with prettier

# Linting fixes
style: fix ESLint warnings in user components

# Import organization
style: organize imports in user service
```

### Refactoring

```bash
# Code refactoring
refactor: extract user validation logic to separate utility

# Architecture changes
refactor(api): restructure user endpoints for better organization

# Performance refactoring
refactor: optimize user query performance
```

### Performance

```bash
# Performance improvements
perf: optimize user list loading with pagination

# Database optimization
perf(db): add index to user email field

# Bundle size optimization
perf: reduce bundle size by removing unused dependencies
```

### Tests

```bash
# Adding tests
test: add unit tests for user service

# Test improvements
test: improve user form component test coverage

# Test fixes
test: fix flaky user authentication tests
```

### Chores

```bash
# Dependency updates
chore: update dependencies to latest versions

# Build process changes
chore: update webpack configuration

# Tooling updates
chore: update ESLint configuration

# Package management
chore: add pnpm lockfile
```

### CI/CD

```bash
# CI configuration
ci: add GitHub Actions workflow for testing

# Deployment changes
ci: update deployment configuration for staging

# Build pipeline
ci: add automated dependency updates
```

### Build

```bash
# Build system changes
build: update webpack to version 5

# Dependencies
build: add new development dependencies

# Configuration
build: update TypeScript configuration
```

### Revert

```bash
# Revert commits
revert: revert "feat: add user authentication system"

# Revert with reason
revert: revert "fix: resolve memory leak in user service"

This reverts commit abc123. The fix caused issues with user session management.
```

## Scopes

Use scopes to indicate the area of the codebase affected:

### Common Scopes

- **auth**: Authentication and authorization
- **api**: API endpoints and routes
- **ui**: User interface components
- **db**: Database related changes
- **config**: Configuration files
- **deps**: Dependencies
- **docs**: Documentation
- **test**: Testing related changes
- **ci**: Continuous integration
- **build**: Build system

### Examples with Scopes

```bash
feat(auth): add OAuth2 integration
fix(api): resolve user endpoint validation error
docs(ui): update component documentation
refactor(db): optimize user queries
chore(deps): update React to version 18
test(api): add integration tests for user endpoints
```

## Breaking Changes

Indicate breaking changes in the footer:

```bash
feat(api): change user response format

BREAKING CHANGE: The user API now returns user data in a nested 'data' object.
Update your client code to access user properties via response.data.user.

Before:
{
  "id": 1,
  "name": "John Doe"
}

After:
{
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe"
    }
  }
}
```

## Issue References

Reference issues in the footer:

```bash
fix: resolve user authentication bug

Fixes #123
Closes #456
Resolves #789
```

## Multi-line Commits

For complex changes, use the body to provide more details:

```bash
feat(auth): implement multi-factor authentication

Add support for TOTP-based two-factor authentication:
- Generate QR codes for authenticator apps
- Validate TOTP tokens during login
- Store backup codes for account recovery
- Add UI components for 2FA setup

Closes #234
```

## Commit Message Guidelines

### Description

- Use imperative mood ("add feature" not "added feature")
- Start with lowercase letter
- No period at the end
- Maximum 50 characters for the subject line
- Be descriptive but concise

### Body

- Wrap at 72 characters
- Explain what and why, not how
- Use bullet points for multiple changes
- Reference issues and pull requests

### Footer

- Reference issues with "Fixes #123"
- Indicate breaking changes with "BREAKING CHANGE:"
- Use "Co-authored-by:" for multiple authors

## Examples by Context

### Linear Issue Integration

```bash
feat(HAV-24): implement user login and logout functionality

- Add JWT token authentication
- Implement login form with validation
- Add logout functionality with token cleanup
- Update user state management

References: Linear HAV-24
```

### Feature Development

```bash
feat(user-management): add user role management

- Add role assignment interface
- Implement role-based permissions
- Update user service with role validation
- Add tests for role management

Closes #45
```

### Bug Fixes

```bash
fix(auth): resolve session timeout issue

The session was expiring prematurely due to incorrect token validation.
This fix ensures proper token lifetime calculation and extends
session duration to match the configured timeout.

Fixes #67
```

### Documentation Updates

```bash
docs: update API documentation for v2.0

- Add new endpoint documentation
- Update authentication examples
- Include error response schemas
- Add rate limiting information
```

### Dependency Updates

```bash
chore(deps): update React and Next.js to latest versions

- Update React to 18.2.0
- Update Next.js to 13.4.0
- Update related dependencies
- Fix breaking changes in components

BREAKING CHANGE: Some components may need updates due to React 18 changes
```

## Automation

### Commitizen Integration

```json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

### Husky Pre-commit Hook

```bash
#!/bin/sh
# .husky/commit-msg
npx --no -- commitlint --edit $1
```

### Commitlint Configuration

```javascript
// commitlint.config.js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "ci",
        "build",
        "revert",
      ],
    ],
  },
};
```

## Best Practices

1. **Be Consistent**: Always use conventional commit format
2. **Be Descriptive**: Write clear, concise commit messages
3. **Use Scopes**: Include relevant scopes when applicable
4. **Reference Issues**: Link commits to issues and PRs
5. **Indicate Breaking Changes**: Always note breaking changes
6. **Keep It Simple**: One logical change per commit
7. **Use Present Tense**: Write in imperative mood
8. **Be Specific**: Avoid vague descriptions like "fix stuff"

## convex_rules.mdc

---

description: Guidelines and best practices for building Convex projects, including database schema design, queries, mutations, and real-world examples
globs: **/\*.ts,**/_.tsx,\*\*/_.js,\*_/_.jsx

---

# Convex guidelines

## Function guidelines

### New function syntax

- ALWAYS use the new function syntax for Convex functions. For example:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";
export const f = query({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Function body
  },
});
```

### Http endpoint syntax

- HTTP endpoints are defined in `convex/http.ts` and require an `httpAction` decorator. For example:

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
const http = httpRouter();
http.route({
  path: "/echo",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.bytes();
    return new Response(body, { status: 200 });
  }),
});
```

- HTTP endpoints are always registered at the exact path you specify in the `path` field. For example, if you specify `/api/someRoute`, the endpoint will be registered at `/api/someRoute`.

### Validators

- Below is an example of an array validator:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export default mutation({
  args: {
    simpleArray: v.array(v.union(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    //...
  },
});
```

- Below is an example of a schema with validators that codify a discriminated union type:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  results: defineTable(
    v.union(
      v.object({
        kind: v.literal("error"),
        errorMessage: v.string(),
      }),
      v.object({
        kind: v.literal("success"),
        value: v.number(),
      }),
    ),
  ),
});
```

- Always use the `v.null()` validator when returning a null value. Below is an example query that returns a null value:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const exampleQuery = query({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("This query returns a null value");
    return null;
  },
});
```

- Here are the valid Convex types along with their respective validators:
  Convex Type | TS/JS type | Example Usage | Validator for argument validation and schemas | Notes |
  | ----------- | ------------| -----------------------| -----------------------------------------------| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
  | Id | string | `doc._id` | `v.id(tableName)` | |
  | Null | null | `null` | `v.null()` | JavaScript's `undefined` is not a valid Convex value. Functions the return `undefined` or do not return will return `null` when called from a client. Use `null` instead. |
  | Int64 | bigint | `3n` | `v.int64()` | Int64s only support BigInts between -2^63 and 2^63-1. Convex supports `bigint`s in most modern browsers. |
  | Float64 | number | `3.1` | `v.number()` | Convex supports all IEEE-754 double-precision floating point numbers (such as NaNs). Inf and NaN are JSON serialized as strings. |
  | Boolean | boolean | `true` | `v.boolean()` |
  | String | string | `"abc"` | `v.string()` | Strings are stored as UTF-8 and must be valid Unicode sequences. Strings must be smaller than the 1MB total size limit when encoded as UTF-8. |
  | Bytes | ArrayBuffer | `new ArrayBuffer(8)` | `v.bytes()` | Convex supports first class bytestrings, passed in as `ArrayBuffer`s. Bytestrings must be smaller than the 1MB total size limit for Convex types. |
  | Array | Array] | `[1, 3.2, "abc"]` | `v.array(values)` | Arrays can have at most 8192 values. |
  | Object | Object | `{a: "abc"}` | `v.object({property: value})` | Convex only supports "plain old JavaScript objects" (objects that do not have a custom prototype). Objects can have at most 1024 entries. Field names must be nonempty and not start with "$" or "_". |
| Record      | Record      | `{"a": "1", "b": "2"}` | `v.record(keys, values)`                       | Records are objects at runtime, but can have dynamic keys. Keys must be only ASCII characters, nonempty, and not start with "$" or "\_". |

### Function registration

- Use `internalQuery`, `internalMutation`, and `internalAction` to register internal functions. These functions are private and aren't part of an app's API. They can only be called by other Convex functions. These functions are always imported from `./_generated/server`.
- Use `query`, `mutation`, and `action` to register public functions. These functions are part of the public API and are exposed to the public Internet. Do NOT use `query`, `mutation`, or `action` to register sensitive internal functions that should be kept private.
- You CANNOT register a function through the `api` or `internal` objects.
- ALWAYS include argument and return validators for all Convex functions. This includes all of `query`, `internalQuery`, `mutation`, `internalMutation`, `action`, and `internalAction`. If a function doesn't return anything, include `returns: v.null()` as its output validator.
- If the JavaScript implementation of a Convex function doesn't have a return value, it implicitly returns `null`.

### Function calling

- Use `ctx.runQuery` to call a query from a query, mutation, or action.
- Use `ctx.runMutation` to call a mutation from a mutation or action.
- Use `ctx.runAction` to call an action from an action.
- ONLY call an action from another action if you need to cross runtimes (e.g. from V8 to Node). Otherwise, pull out the shared code into a helper async function and call that directly instead.
- Try to use as few calls from actions to queries and mutations as possible. Queries and mutations are transactions, so splitting logic up into multiple calls introduces the risk of race conditions.
- All of these calls take in a `FunctionReference`. Do NOT try to pass the callee function directly into one of these calls.
- When using `ctx.runQuery`, `ctx.runMutation`, or `ctx.runAction` to call a function in the same file, specify a type annotation on the return value to work around TypeScript circularity limitations. For example,

```
export const f = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});

export const g = query({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    const result: string = await ctx.runQuery(api.example.f, { name: "Bob" });
    return null;
  },
});
```

### Function references

- Function references are pointers to registered Convex functions.
- Use the `api` object defined by the framework in `convex/_generated/api.ts` to call public functions registered with `query`, `mutation`, or `action`.
- Use the `internal` object defined by the framework in `convex/_generated/api.ts` to call internal (or private) functions registered with `internalQuery`, `internalMutation`, or `internalAction`.
- Convex uses file-based routing, so a public function defined in `convex/example.ts` named `f` has a function reference of `api.example.f`.
- A private function defined in `convex/example.ts` named `g` has a function reference of `internal.example.g`.
- Functions can also registered within directories nested within the `convex/` folder. For example, a public function `h` defined in `convex/messages/access.ts` has a function reference of `api.messages.access.h`.

### Api design

- Convex uses file-based routing, so thoughtfully organize files with public query, mutation, or action functions within the `convex/` directory.
- Use `query`, `mutation`, and `action` to define public functions.
- Use `internalQuery`, `internalMutation`, and `internalAction` to define private, internal functions.

### Pagination

- Paginated queries are queries that return a list of results in incremental pages.
- You can define pagination using the following syntax:

```ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
export const listWithExtraArg = query({
  args: { paginationOpts: paginationOptsValidator, author: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("author"), args.author))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

Note: `paginationOpts` is an object with the following properties:

- `numItems`: the maximum number of documents to return (the validator is `v.number()`)
- `cursor`: the cursor to use to fetch the next page of documents (the validator is `v.union(v.string(), v.null())`)
- A query that ends in `.paginate()` returns an object that has the following properties: - page (contains an array of documents that you fetches) - isDone (a boolean that represents whether or not this is the last page of documents) - continueCursor (a string that represents the cursor to use to fetch the next page of documents)

## Validator guidelines

- `v.bigint()` is deprecated for representing signed 64-bit integers. Use `v.int64()` instead.
- Use `v.record()` for defining a record type. `v.map()` and `v.set()` are not supported.

## Schema guidelines

- Always define your schema in `convex/schema.ts`.
- Always import the schema definition functions from `convex/server`:
- System fields are automatically added to all documents and are prefixed with an underscore. The two system fields that are automatically added to all documents are `_creationTime` which has the validator `v.number()` and `_id` which has the validator `v.id(tableName)`.
- Always include all index fields in the index name. For example, if an index is defined as `["field1", "field2"]`, the index name should be "by_field1_and_field2".
- Index fields must be queried in the same order they are defined. If you want to be able to query by "field1" then "field2" and by "field2" then "field1", you must create separate indexes.

## Typescript guidelines

- You can use the helper typescript type `Id` imported from './\_generated/dataModel' to get the type of the id for a given table. For example if there is a table called 'users' you can use `Id<'users'>` to get the type of the id for that table.
- If you need to define a `Record` make sure that you correctly provide the type of the key and value in the type. For example a validator `v.record(v.id('users'), v.string())` would have the type `Record<Id<'users'>, string>`. Below is an example of using `Record` with an `Id` type in a query:

```ts
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const exampleQuery = query({
  args: { userIds: v.array(v.id("users")) },
  returns: v.record(v.id("users"), v.string()),
  handler: async (ctx, args) => {
    const idToUsername: Record<Id<"users">, string> = {};
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (user) {
        idToUsername[user._id] = user.username;
      }
    }

    return idToUsername;
  },
});
```

- Be strict with types, particularly around id's of documents. For example, if a function takes in an id for a document in the 'users' table, take in `Id<'users'>` rather than `string`.
- Always use `as const` for string literals in discriminated union types.
- When using the `Array` type, make sure to always define your arrays as `const array: Array<T> = [...];`
- When using the `Record` type, make sure to always define your records as `const record: Record<KeyType, ValueType> = {...};`
- Always add `@types/node` to your `package.json` when using any Node.js built-in modules.

## Full text search guidelines

- A query for "10 messages in channel '#general' that best match the query 'hello hi' in their body" would look like:

const messages = await ctx.db
.query("messages")
.withSearchIndex("search_body", (q) =>
q.search("body", "hello hi").eq("channel", "#general"),
)
.take(10);

## Query guidelines

- Do NOT use `filter` in queries. Instead, define an index in the schema and use `withIndex` instead.
- Convex queries do NOT support `.delete()`. Instead, `.collect()` the results, iterate over them, and call `ctx.db.delete(row._id)` on each result.
- Use `.unique()` to get a single document from a query. This method will throw an error if there are multiple documents that match the query.
- When using async iteration, don't use `.collect()` or `.take(n)` on the result of a query. Instead, use the `for await (const row of query)` syntax.

### Ordering

- By default Convex always returns documents in ascending `_creationTime` order.
- You can use `.order('asc')` or `.order('desc')` to pick whether a query is in ascending or descending order. If the order isn't specified, it defaults to ascending.
- Document queries that use indexes will be ordered based on the columns in the index and can avoid slow table scans.

## Mutation guidelines

- Use `ctx.db.replace` to fully replace an existing document. This method will throw an error if the document does not exist.
- Use `ctx.db.patch` to shallow merge updates into an existing document. This method will throw an error if the document does not exist.

## Action guidelines

- Always add `"use node";` to the top of files containing actions that use Node.js built-in modules.
- Never use `ctx.db` inside of an action. Actions don't have access to the database.
- Below is an example of the syntax for an action:

```ts
import { action } from "./_generated/server";

export const exampleAction = action({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("This action does not return anything");
    return null;
  },
});
```

## Scheduling guidelines

### Cron guidelines

- Only use the `crons.interval` or `crons.cron` methods to schedule cron jobs. Do NOT use the `crons.hourly`, `crons.daily`, or `crons.weekly` helpers.
- Both cron methods take in a FunctionReference. Do NOT try to pass the function directly into one of these methods.
- Define crons by declaring the top-level `crons` object, calling some methods on it, and then exporting it as default. For example,

```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const empty = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("empty");
  },
});

const crons = cronJobs();

// Run `internal.crons.empty` every two hours.
crons.interval("delete inactive users", { hours: 2 }, internal.crons.empty, {});

export default crons;
```

- You can register Convex functions within `crons.ts` just like any other file.
- If a cron calls an internal function, always import the `internal` object from '\_generated/api', even if the internal function is registered in the same file.

## File storage guidelines

- Convex includes file storage for large files like images, videos, and PDFs.
- The `ctx.storage.getUrl()` method returns a signed URL for a given file. It returns `null` if the file doesn't exist.
- Do NOT use the deprecated `ctx.storage.getMetadata` call for loading a file's metadata.

                    Instead, query the `_storage` system table. For example, you can use `ctx.db.system.get` to get an `Id<"_storage">`.

```
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type FileMetadata = {
    _id: Id<"_storage">;
    _creationTime: number;
    contentType?: string;
    sha256: string;
    size: number;
}

export const exampleQuery = query({
    args: { fileId: v.id("_storage") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const metadata: FileMetadata | null = await ctx.db.system.get(args.fileId);
        console.log(metadata);
        return null;
    },
});
```

- Convex storage stores items as `Blob` objects. You must convert all items to/from a `Blob` when using Convex storage.

# Examples:

## Example: chat-app

### Task

```
Create a real-time chat application backend with AI responses. The app should:
- Allow creating users with names
- Support multiple chat channels
- Enable users to send messages to channels
- Automatically generate AI responses to user messages
- Show recent message history

The backend should provide APIs for:
1. User management (creation)
2. Channel management (creation)
3. Message operations (sending, listing)
4. AI response generation using OpenAI's GPT-4

Messages should be stored with their channel, author, and content. The system should maintain message order
and limit history display to the 10 most recent messages per channel.

```

### Analysis

1. Task Requirements Summary:

- Build a real-time chat backend with AI integration
- Support user creation
- Enable channel-based conversations
- Store and retrieve messages with proper ordering
- Generate AI responses automatically

2. Main Components Needed:

- Database tables: users, channels, messages
- Public APIs for user/channel management
- Message handling functions
- Internal AI response generation system
- Context loading for AI responses

3. Public API and Internal Functions Design:
   Public Mutations:

- createUser:
  - file path: convex/index.ts
  - arguments: {name: v.string()}
  - returns: v.object({userId: v.id("users")})
  - purpose: Create a new user with a given name
- createChannel:
  - file path: convex/index.ts
  - arguments: {name: v.string()}
  - returns: v.object({channelId: v.id("channels")})
  - purpose: Create a new channel with a given name
- sendMessage:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels"), authorId: v.id("users"), content: v.string()}
  - returns: v.null()
  - purpose: Send a message to a channel and schedule a response from the AI

Public Queries:

- listMessages:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.array(v.object({
    \_id: v.id("messages"),
    \_creationTime: v.number(),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    }))
  - purpose: List the 10 most recent messages from a channel in descending creation order

Internal Functions:

- generateResponse:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.null()
  - purpose: Generate a response from the AI for a given channel
- loadContext:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.array(v.object({
    \_id: v.id("messages"),
    \_creationTime: v.number(),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    }))
- writeAgentResponse:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels"), content: v.string()}
  - returns: v.null()
  - purpose: Write an AI response to a given channel

4. Schema Design:

- users
  - validator: { name: v.string() }
  - indexes: <none>
- channels
  - validator: { name: v.string() }
  - indexes: <none>
- messages
  - validator: { channelId: v.id("channels"), authorId: v.optional(v.id("users")), content: v.string() }
  - indexes
    - by_channel: ["channelId"]

5. Background Processing:

- AI response generation runs asynchronously after each user message
- Uses OpenAI's GPT-4 to generate contextual responses
- Maintains conversation context using recent message history

### Implementation

#### package.json

```typescript
{
  "name": "chat-app",
  "description": "This example shows how to build a chat app without authentication.",
  "version": "1.0.0",
  "dependencies": {
    "convex": "^1.17.4",
    "openai": "^4.79.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

#### tsconfig.json

```typescript
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "exclude": ["convex"],
  "include": ["**/src/**/*.tsx", "**/src/**/*.ts", "vite.config.ts"]
}
```

#### convex/index.ts

```typescript
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";

/**
 * Create a user with a given name.
 */
export const createUser = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", { name: args.name });
  },
});

/**
 * Create a channel with a given name.
 */
export const createChannel = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("channels"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("channels", { name: args.name });
  },
});

/**
 * List the 10 most recent messages from a channel in descending creation order.
 */
export const listMessages = query({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      channelId: v.id("channels"),
      authorId: v.optional(v.id("users")),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);
    return messages;
  },
});

/**
 * Send a message to a channel and schedule a response from the AI.
 */
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    const user = await ctx.db.get(args.authorId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: args.authorId,
      content: args.content,
    });
    await ctx.scheduler.runAfter(0, internal.index.generateResponse, {
      channelId: args.channelId,
    });
    return null;
  },
});

const openai = new OpenAI();

export const generateResponse = internalAction({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.index.loadContext, {
      channelId: args.channelId,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: context,
    });
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    await ctx.runMutation(internal.index.writeAgentResponse, {
      channelId: args.channelId,
      content,
    });
    return null;
  },
});

export const loadContext = internalQuery({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);

    const result = [];
    for (const message of messages) {
      if (message.authorId) {
        const user = await ctx.db.get(message.authorId);
        if (!user) {
          throw new Error("User not found");
        }
        result.push({
          role: "user" as const,
          content: `${user.name}: ${message.content}`,
        });
      } else {
        result.push({ role: "assistant" as const, content: message.content });
      }
    }
    return result;
  },
});

export const writeAgentResponse = internalMutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      content: args.content,
    });
    return null;
  },
});
```

#### convex/schema.ts

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  channels: defineTable({
    name: v.string(),
  }),

  users: defineTable({
    name: v.string(),
  }),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
  }).index("by_channel", ["channelId"]),
});
```

#### src/App.tsx

```typescript
export default function App() {
  return <div>Hello World</div>;
}
```

## esm-modules.mdc

---

alwaysApply: true
description: Always use ESM (ECMAScript Modules) syntax

---

# ESM Module Usage

Always use ESM (ECMAScript Modules) syntax for imports and exports in this project.

## Guidelines

- **Use `import` statements** instead of `require()`
- **Use `export` statements** instead of `module.exports`
- **Use `export default`** for default exports
- **Use named exports** with `export { }` syntax
- **Use dynamic imports** with `import()` when needed for code splitting

## Examples

### Correct ESM Syntax

```javascript
// Import statements
import React from "react";
import { useState, useEffect } from "react";
import * as utils from "./utils";
import { Button } from "./components/ui/button";

// Export statements
export const myFunction = () => {};
export default MyComponent;
export { Button, Input, Card };
```

### Avoid CommonJS

```javascript
// ❌ Don't use CommonJS
const React = require("react");
const { useState } = require("react");
module.exports = MyComponent;
exports.myFunction = () => {};
```

## File Extensions

- Use `.js` or `.ts` files with ESM syntax
- Ensure `package.json` has `"type": "module"` if using `.js` files
- TypeScript files (`.ts`, `.tsx`) should use ESM syntax by default

## Dynamic Imports

Use dynamic imports for code splitting and lazy loading:

```javascript
const LazyComponent = lazy(() => import("./LazyComponent"));
const module = await import("./some-module");
```

## no-linting-errors.mdc

---

alwaysApply: true
description: Don't leave any linting errors

---

# No Linting Errors

Always ensure code is free of linting errors before completing any task.

## Guidelines

- **Fix all linting errors** before finishing any code changes
- **Run linter checks** after making modifications
- **Address warnings** when they indicate potential issues
- **Follow project linting rules** consistently
- **Use proper formatting** (Prettier, ESLint)
- **Resolve TypeScript errors** immediately

## Common Linting Issues to Fix

### ESLint Errors

```typescript
// ❌ Unused variables
const unusedVariable = "test"; // ESLint: 'unusedVariable' is assigned a value but never used

// ✅ Remove unused variables or prefix with underscore
const _unusedVariable = "test"; // or remove entirely

// ❌ Missing dependencies in useEffect
useEffect(() => {
  fetchData(userId);
}, []); // ESLint: React Hook useEffect has a missing dependency: 'userId'

// ✅ Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ❌ Console statements in production code
console.log("Debug info"); // ESLint: Unexpected console statement

// ✅ Use proper logging or remove
// Use a proper logger or remove console statements
```

### TypeScript Errors

```typescript
// ❌ Missing type annotations
function processUser(user) {
  // TypeScript: Parameter 'user' implicitly has an 'any' type
  return user.name;
}

// ✅ Add proper type annotations
function processUser(user: User): string {
  return user.name;
}

// ❌ Unhandled null/undefined
const user = await getUserById(id);
const name = user.name; // TypeScript: Object is possibly 'null'

// ✅ Handle null/undefined cases
const user = await getUserById(id);
if (!user) {
  throw new Error("User not found");
}
const name = user.name;

// ❌ Missing return type
async function fetchData() {
  // TypeScript: Return type is implicitly 'any'
  return await api.getData();
}

// ✅ Specify return type
async function fetchData(): Promise<Data> {
  return await api.getData();
}
```

### Import/Export Issues

```typescript
// ❌ Unused imports
import React, { useState, useEffect } from "react"; // ESLint: 'useEffect' is defined but never used

// ✅ Remove unused imports
import React, { useState } from "react";

// ❌ Missing file extensions in imports
import { Button } from "./components/Button"; // ESLint: Missing file extension

// ✅ Use proper file extensions
import { Button } from "./components/Button.tsx";

// ❌ Default export issues
export default function Component() {} // ESLint: Prefer named exports

// ✅ Use named exports when possible
export function Component() {}
```

## Workflow

### Before Completing Any Task:

1. **Check for linting errors** using your IDE or command line
2. **Fix all errors** before marking task as complete
3. **Address warnings** that indicate real issues
4. **Ensure code formatting** is consistent
5. **Verify TypeScript compilation** passes

### Command Line Checks

```bash
# Check for ESLint errors
npm run lint

# Check for TypeScript errors
npm run type-check

# Fix auto-fixable issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### IDE Integration

- **Enable ESLint extension** in your IDE
- **Enable TypeScript checking** in your IDE
- **Enable Prettier formatting** on save
- **Fix errors as you type** when possible

## Error Categories

### Critical (Must Fix)

- TypeScript compilation errors
- ESLint errors that break functionality
- Missing required dependencies
- Unhandled null/undefined cases

### Important (Should Fix)

- ESLint warnings about potential bugs
- Unused variables or imports
- Missing type annotations
- Console statements in production code

### Style (Nice to Fix)

- Formatting inconsistencies
- Naming convention violations
- Import order issues
- Trailing commas or semicolons

## Examples

### Fixing Common Issues

```typescript
// Before (with linting errors)
import React, { useState, useEffect } from "react";
import { Button } from "./Button";

function UserComponent({ userId }) {
  const [user, setUser] = useState();

  useEffect(() => {
    fetchUser(userId);
  }, []);

  const fetchUser = async (id) => {
    const response = await api.getUser(id);
    setUser(response.data);
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <Button onClick={() => console.log("clicked")}>Click me</Button>
    </div>
  );
}

// After (linting errors fixed)
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./Button";
import type { User } from "@/types/user";

interface UserComponentProps {
  userId: string;
}

function UserComponent({ userId }: UserComponentProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await api.getUser(id);
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  }, []);

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <Button onClick={() => handleClick()}>Click me</Button>
    </div>
  );

  function handleClick(): void {
    // Handle click logic here
  }
}
```

## Tools and Configuration

### ESLint Configuration

Ensure your `.eslintrc.js` or `eslint.config.js` includes:

- TypeScript support
- React hooks rules
- Import/export rules
- Unused variable detection

### Prettier Configuration

Ensure your `prettier.config.js` is configured for:

- Consistent formatting
- Semicolon usage
- Quote preferences
- Line length limits

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

- Strict mode enabled
- No implicit any
- Strict null checks
- Proper module resolution

## openapi-driven-development.mdc

---

globs: _.ts,_.tsx,_.yaml,_.yml
description: Follow OpenAPI-driven development: update spec first, generate types, then implement

---

# OpenAPI-Driven Development

Always follow OpenAPI-driven development workflow: update the OpenAPI specification first, generate types, then implement the code.

## Workflow

1. **Design API** - Update OpenAPI specification
2. **Generate Types** - Generate TypeScript types from spec
3. **Implement** - Write code using generated types
4. **Validate** - Ensure implementation matches specification

## File Structure

```
openapi/
├── openapi.yaml          # Main OpenAPI specification
├── dist/
│   └── openapi.yaml      # Bundled specification
├── components/
│   ├── schemas/          # Reusable schemas
│   ├── responses/        # Common responses
│   └── parameters/       # Common parameters
└── paths/
    ├── auth.yaml         # Authentication endpoints
    ├── users.yaml        # User management endpoints
    └── posts.yaml        # Post management endpoints
```

## OpenAPI Specification Example

```yaml
# openapi/openapi.yaml
openapi: 3.0.3
info:
  title: HavenHost Admin API
  description: Admin API for HavenHost platform
  version: 1.0.0
  contact:
    name: API Support
    email: support@havenhost.com

servers:
  - url: https://api.havenhost.com/v1
    description: Production server
  - url: http://localhost:3000/api/v1
    description: Development server

paths:
  /users:
    get:
      summary: List users
      description: Retrieve a paginated list of users
      tags:
        - Users
      parameters:
        - $ref: "#/components/parameters/PageParam"
        - $ref: "#/components/parameters/LimitParam"
        - $ref: "#/components/parameters/SearchParam"
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserListResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "500":
          $ref: "#/components/responses/InternalServerError"

    post:
      summary: Create user
      description: Create a new user account
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUserRequest"
      responses:
        "201":
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "409":
          $ref: "#/components/responses/Conflict"

  /users/{userId}:
    get:
      summary: Get user
      description: Retrieve a specific user by ID
      tags:
        - Users
      parameters:
        - $ref: "#/components/parameters/UserIdParam"
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserResponse"
        "404":
          $ref: "#/components/responses/NotFound"

    put:
      summary: Update user
      description: Update an existing user
      tags:
        - Users
      parameters:
        - $ref: "#/components/parameters/UserIdParam"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateUserRequest"
      responses:
        "200":
          description: User updated successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserResponse"
        "404":
          $ref: "#/components/responses/NotFound"

    delete:
      summary: Delete user
      description: Delete a user account
      tags:
        - Users
      parameters:
        - $ref: "#/components/parameters/UserIdParam"
      responses:
        "204":
          description: User deleted successfully
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    User:
      type: object
      required:
        - id
        - first_name
        - last_name
        - email_address
        - created_at
        - updated_at
        - is_active
      properties:
        id:
          type: integer
          format: int64
          example: 1
        first_name:
          type: string
          minLength: 1
          maxLength: 255
          example: "John"
        last_name:
          type: string
          minLength: 1
          maxLength: 255
          example: "Doe"
        email_address:
          type: string
          format: email
          maxLength: 255
          example: "john.doe@example.com"
        role:
          type: string
          enum: [admin, editor, viewer]
          default: viewer
          example: "editor"
        is_active:
          type: boolean
          default: true
          example: true
        created_at:
          type: string
          format: date-time
          example: "2024-01-15T10:30:00Z"
        updated_at:
          type: string
          format: date-time
          example: "2024-01-15T10:30:00Z"

    CreateUserRequest:
      type: object
      required:
        - first_name
        - last_name
        - email_address
      properties:
        first_name:
          type: string
          minLength: 1
          maxLength: 255
          example: "John"
        last_name:
          type: string
          minLength: 1
          maxLength: 255
          example: "Doe"
        email_address:
          type: string
          format: email
          maxLength: 255
          example: "john.doe@example.com"
        role:
          type: string
          enum: [admin, editor, viewer]
          default: viewer
          example: "editor"

    UpdateUserRequest:
      type: object
      properties:
        first_name:
          type: string
          minLength: 1
          maxLength: 255
          example: "John"
        last_name:
          type: string
          minLength: 1
          maxLength: 255
          example: "Doe"
        email_address:
          type: string
          format: email
          maxLength: 255
          example: "john.doe@example.com"
        role:
          type: string
          enum: [admin, editor, viewer]
          example: "editor"
        is_active:
          type: boolean
          example: true

    UserResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          $ref: "#/components/schemas/User"

    UserListResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: array
          items:
            $ref: "#/components/schemas/User"
        pagination:
          $ref: "#/components/schemas/Pagination"

    Pagination:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
          example: 1
        limit:
          type: integer
          minimum: 1
          maximum: 100
          example: 20
        total:
          type: integer
          example: 150
        total_pages:
          type: integer
          example: 8

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
          example: "Validation failed"
        details:
          type: array
          items:
            type: string
          example:
            ["Email is required", "First name must be at least 1 character"]

  parameters:
    UserIdParam:
      name: userId
      in: path
      required: true
      schema:
        type: integer
        format: int64
      example: 1

    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
        default: 1
      example: 1

    LimitParam:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
      example: 20

    SearchParam:
      name: search
      in: query
      schema:
        type: string
        maxLength: 255
      example: "john"

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"

    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"

    Conflict:
      description: Resource conflict
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"

    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

## Type Generation

### Package.json Scripts

```json
{
  "scripts": {
    "openapi:lint": "spectral lint openapi/openapi.yaml",
    "openapi:bundle": "redocly bundle openapi/openapi.yaml -o openapi/dist/openapi.yaml",
    "openapi:types": "openapi-typescript openapi/dist/openapi.yaml -o src/types/openapi.d.ts",
    "openapi:docs": "redocly build-docs openapi/dist/openapi.yaml -o docs/api",
    "openapi:validate": "pnpm openapi:lint && pnpm openapi:bundle && pnpm openapi:types"
  }
}
```

### Generated Types Usage

```typescript
// src/types/openapi.d.ts (generated)
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  role?: "admin" | "editor" | "viewer";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email_address: string;
  role?: "admin" | "editor" | "viewer";
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email_address?: string;
  role?: "admin" | "editor" | "viewer";
  is_active?: boolean;
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: Pagination;
}
```

## Implementation Using Generated Types

### Repository Interface

```typescript
// src/repositories/interfaces/user.repository.ts
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/types/openapi";

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<User[]>;
  create(data: CreateUserRequest): Promise<User>;
  update(id: number, data: UpdateUserRequest): Promise<User>;
  delete(id: number): Promise<void>;
  count(options?: { search?: string }): Promise<number>;
}
```

### Service Implementation

```typescript
// src/services/user.service.ts
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/types/openapi";
import type { UserRepository } from "@/repositories/interfaces/user.repository";

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: CreateUserRequest): Promise<User> {
    // Business logic using OpenAPI types
    const existingUser = await this.userRepository.findByEmail(
      data.email_address,
    );
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    return await this.userRepository.create(data);
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    return await this.userRepository.update(id, data);
  }
}
```

### TRPC Router Implementation

```typescript
// src/server/api/routers/user.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { UserService } from "@/services/user.service";
import { createRepositories } from "@/repositories";
import type { CreateUserRequest, UpdateUserRequest } from "@/types/openapi";

const repositories = createRepositories();
const userService = new UserService(repositories.userRepository);

// Zod schemas that match OpenAPI spec
const CreateUserSchema = z.object({
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  email_address: z.string().email().max(255),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
});

const UpdateUserSchema = z.object({
  first_name: z.string().min(1).max(255).optional(),
  last_name: z.string().min(1).max(255).optional(),
  email_address: z.string().email().max(255).optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  is_active: z.boolean().optional(),
});

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(CreateUserSchema)
    .mutation(async ({ input }): Promise<CreateUserRequest> => {
      return await userService.createUser(input);
    }),

  update: publicProcedure
    .input(z.object({ id: z.number() }).merge(UpdateUserSchema))
    .mutation(async ({ input }): Promise<UpdateUserRequest> => {
      const { id, ...updateData } = input;
      return await userService.updateUser(id, updateData);
    }),
});
```

### Frontend Component

```typescript
// src/components/UserForm.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import type { CreateUserRequest } from "@/types/openapi";

interface UserFormProps {
  onSuccess?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    first_name: "",
    last_name: "",
    email_address: "",
    role: "viewer",
  });

  const createUser = api.user.create.useMutation({
    onSuccess: () => {
      onSuccess?.();
      setFormData({
        first_name: "",
        last_name: "",
        email_address: "",
        role: "viewer",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="First Name"
        value={formData.first_name}
        onChange={(e) =>
          setFormData({ ...formData, first_name: e.target.value })
        }
        required
      />
      <Input
        placeholder="Last Name"
        value={formData.last_name}
        onChange={(e) =>
          setFormData({ ...formData, last_name: e.target.value })
        }
        required
      />
      <Input
        placeholder="Email"
        type="email"
        value={formData.email_address}
        onChange={(e) =>
          setFormData({ ...formData, email_address: e.target.value })
        }
        required
      />
      <Button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
};
```

## Development Workflow

### 1. Design API First

```bash
# Edit OpenAPI specification
vim openapi/openapi.yaml

# Validate specification
pnpm openapi:lint
```

### 2. Generate Types

```bash
# Bundle and generate types
pnpm openapi:validate
```

### 3. Implement Code

```typescript
// Use generated types in implementation
import type { User, CreateUserRequest } from "@/types/openapi";
```

### 4. Validate Implementation

```bash
# Run tests to ensure implementation matches spec
pnpm test

# Check for type errors
pnpm type-check
```

## Best Practices

### OpenAPI Specification

- Use descriptive names and examples
- Include all required fields and constraints
- Define reusable components
- Use proper HTTP status codes
- Include error responses
- Document authentication requirements

### Type Generation

- Always regenerate types after spec changes
- Use strict TypeScript configuration
- Validate generated types match expectations
- Keep generated files in version control

### Implementation

- Use generated types throughout the codebase
- Validate input data matches OpenAPI schema
- Handle all defined error responses
- Follow the specification exactly
- Write tests that verify API contract compliance

## Tools and Dependencies

```json
{
  "devDependencies": {
    "@redocly/cli": "^1.0.0",
    "@stoplight/spectral-cli": "^6.0.0",
    "openapi-typescript": "^6.0.0"
  }
}
```

## prefer-pnpm.mdc

---

alwaysApply: true
description: Prefer pnpm commands over npm/yarn

---

# Prefer pnpm Commands

Always use pnpm commands instead of npm or yarn for package management in this project.

## Guidelines

- **Use `pnpm`** for all package management operations
- **Avoid `npm`** commands unless absolutely necessary
- **Avoid `yarn`** commands unless absolutely necessary
- **Use pnpm scripts** defined in package.json
- **Follow pnpm best practices** for workspace management

## Common Commands

### Package Installation

```bash
# ✅ Use pnpm
pnpm install
pnpm add react
pnpm add -D typescript
pnpm add -O @types/node

# ❌ Avoid npm
npm install
npm install react
npm install --save-dev typescript
npm install --save-optional @types/node

# ❌ Avoid yarn
yarn install
yarn add react
yarn add -D typescript
yarn add -O @types/node
```

### Development Scripts

```bash
# ✅ Use pnpm
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm format
pnpm type-check

# ❌ Avoid npm
npm run dev
npm run build
npm run test
npm run lint
npm run format
npm run type-check

# ❌ Avoid yarn
yarn dev
yarn build
yarn test
yarn lint
yarn format
yarn type-check
```

### Package Management

```bash
# ✅ Use pnpm
pnpm remove react
pnpm update
pnpm outdated
pnpm audit
pnpm list
pnpm why react

# ❌ Avoid npm
npm uninstall react
npm update
npm outdated
npm audit
npm list
npm why react

# ❌ Avoid yarn
yarn remove react
yarn upgrade
yarn outdated
yarn audit
yarn list
yarn why react
```

### Workspace Commands

```bash
# ✅ Use pnpm workspace commands
pnpm -r build
pnpm -r test
pnpm -r lint
pnpm --filter @myorg/package build
pnpm --filter @myorg/package add react

# ❌ Avoid npm workspace commands
npm run build --workspaces
npm run test --workspaces
npm run lint --workspaces
```

## Package.json Scripts

Ensure package.json scripts use pnpm:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Benefits of pnpm

- **Faster installation**: Uses hard links and symlinks
- **Disk space efficient**: Shared dependency storage
- **Strict dependency resolution**: Prevents phantom dependencies
- **Better workspace support**: Native monorepo support
- **Security**: Better isolation of dependencies
- **Compatibility**: Drop-in replacement for npm

## Configuration Files

### .npmrc

```ini
# Use pnpm registry
registry=https://registry.npmjs.org/

# Enable strict peer dependencies
strict-peer-dependencies=true

# Use pnpm store
store-dir=~/.pnpm-store

# Enable shamefully-hoist for compatibility
shamefully-hoist=true
```

### pnpm-workspace.yaml (for monorepos)

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "tools/*"
```

## CI/CD Integration

### GitHub Actions

```yaml
# ✅ Use pnpm in CI
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Get pnpm store directory
  shell: bash
  run: |
    echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

- name: Setup pnpm cache
  uses: actions/cache@v3
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

## Migration from npm/yarn

### From npm

```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install with pnpm
pnpm install
```

### From yarn

```bash
# Remove node_modules and yarn.lock
rm -rf node_modules yarn.lock

# Install with pnpm
pnpm install
```

## Troubleshooting

### Common Issues

```bash
# Clear pnpm cache
pnpm store prune

# Check pnpm version
pnpm --version

# Update pnpm
npm install -g pnpm@latest

# Check for phantom dependencies
pnpm list --depth=0
```

### Performance Issues

```bash
# Use pnpm with specific settings
pnpm install --prefer-offline
pnpm install --no-optional
pnpm install --ignore-scripts
```

## Documentation References

When documenting commands or providing examples:

- Always use `pnpm` in README files
- Update installation instructions to use pnpm
- Ensure CI/CD documentation uses pnpm
- Update development setup guides

## react-functional-components.mdc

---

globs: _.tsx,_.jsx
description: Prefer functional components in React

---

# React Functional Components

Always prefer functional components over class components in React.

## Guidelines

- **Use functional components** with hooks instead of class components
- **Use React.FC** or explicit return type annotations for TypeScript
- **Use hooks** for state management (`useState`, `useReducer`)
- **Use hooks** for side effects (`useEffect`, `useLayoutEffect`)
- **Use custom hooks** for reusable logic
- **Avoid class components** unless absolutely necessary for legacy compatibility

## Examples

### Correct Functional Component Usage

```typescript
import React, { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    onUpdate?.(updatedUser);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

export default UserProfile;
```

### Custom Hook Example

```typescript
import { useState, useEffect } from "react";

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useUser = (userId: string): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserById(userId);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  return { user, loading, error, refetch: fetchUser };
};
```

### Avoid Class Components

```typescript
// ❌ Don't use class components
class UserProfile extends React.Component<UserProfileProps, UserProfileState> {
  constructor(props: UserProfileProps) {
    super(props);
    this.state = {
      user: null,
      loading: true,
    };
  }

  componentDidMount() {
    this.fetchUser();
  }

  fetchUser = async () => {
    // ... implementation
  };

  render() {
    // ... render logic
  }
}
```

## Hook Guidelines

- **useState**: For local component state
- **useEffect**: For side effects and lifecycle events
- **useContext**: For consuming React context
- **useMemo**: For expensive calculations
- **useCallback**: For memoizing functions
- **Custom hooks**: For reusable stateful logic

## TypeScript Integration

- Use `React.FC<Props>` for component type annotation
- Define proper interfaces for props
- Use generic types when appropriate
- Leverage TypeScript's strict mode for better type safety

## registry.mdc

---

description: Rules for using components from the registry
globs:
alwaysApply: true

---

## Rules for using components

Here are some rules to follow when using components in this project:

- If using shadcn-admin-kit mcp and a registry url is provided, always check the mcp for components (call get_items) before creating your own.
- Only attempt to add items from the registry that actually exist in the registry (call get_items if necessary).
- If asked to initialize or create a new Admin, or to customize the resources, use the usage section below as guide to create or edit the Admin component.
- Always check if the TS config needs to be fixed (see below).

## Fixing the TS config

When you initialize a new Admin:

Set the `verbatimModuleSyntax` option to `false` in the `tsconfig.app.json` file.

```json
{
  // ...
  "compilerOptions": {
    // ...
    // (keep the other options)
    // ...
    "verbatimModuleSyntax": false
  }
}
```

## Usage

### Use `<Admin>` As Root Component

The entry point of your application is the `<Admin>` component.

You'll need to specify a Data Provider to let the Admin know how to fetch data from the API.

If no Data Provider was specified, simply use `ra-data-json-server`, and typicode's JSONPlaceholder as endpoint: https://jsonplaceholder.typicode.com/.

You will need to install the `ra-data-json-server` package first:

```bash
npm install ra-data-json-server
```

Here is an example showing how to use it:

```tsx
import { Admin } from "@/components/admin/admin";
import jsonServerProvider from "ra-data-json-server";

const dataProvider = jsonServerProvider(
  "https://jsonplaceholder.typicode.com/",
);

export const App = () => (
  <Admin dataProvider={dataProvider}>{/* Resources go here */}</Admin>
);
```

### Declare Resources

Then, you'll need to declare the routes of the application. `shadcn-admin-kit` allows to define CRUD routes (list, edit, create, show) for each resource. Use the `<Resource>` component from `ra-core` (which was automatically added to your dependencies) to define CRUD routes.

For each resource, you have to specify a `name` (which will map to the resources exposed by the API endpoint) and the `list`, `edit`, `create` and `show` components to use.

If you used JSONPlaceholder at the previous step, you can pick among the following 6 resources:

- posts
- comments
- albums
- photos
- todos
- users

If no instruction was given on what component to use for the CRUD routes, you can use the built-in guessers for the list, show and edit views. The guessers will automatically generate code based on the data returned by the API.

Here is an example of how to use the guessers with a resource named `posts`:

```tsx
import { Resource } from "ra-core";
import jsonServerProvider from "ra-data-json-server";
import { Admin } from "@/components/admin/admin";
import { ListGuesser } from "@/components/admin/list-guesser";
import { ShowGuesser } from "@/components/admin/show-guesser";
import { EditGuesser } from "@/components/admin/edit-guesser";

const dataProvider = jsonServerProvider(
  "https://jsonplaceholder.typicode.com/",
);

export const App = () => (
  <Admin dataProvider={dataProvider}>
    <Resource
      name="posts"
      list={ListGuesser}
      edit={EditGuesser}
      show={ShowGuesser}
    />
  </Admin>
);
```

Use the example above to generate the component code and adapt the resources to your needs.

## shadcn-ui.mdc

---

alwaysApply: true
description: Use shadcn/ui components for all UI elements

---

# shadcn/ui Component Usage

Always use shadcn/ui components wherever possible for UI elements in this project.

## Guidelines

- **Prefer shadcn/ui components** over custom components or other UI libraries
- **Install new shadcn/ui components** when needed using: `npx shadcn@latest add [component-name]`
- **Use existing shadcn/ui components** from the `components/ui/` directory
- **Follow shadcn/ui patterns** for styling and component composition
- **Extend shadcn/ui components** when customization is needed rather than building from scratch

## Common Components

Use these shadcn/ui components for common UI patterns:

- `Button` for all button elements
- `Input` for form inputs
- `Card` for content containers
- `Dialog` for modals and overlays
- `Table` for data display
- `Form` for form handling
- `Badge` for status indicators
- `Alert` for notifications
- `Tabs` for tabbed interfaces
- `DropdownMenu` for dropdowns
- `Select` for select inputs
- `Checkbox` and `RadioGroup` for form controls

## Installation

When you need a new component, install it with:

```bash
npx shadcn@latest add [component-name]
```

This will automatically add the component to your `components/ui/` directory with proper TypeScript types and styling.

## testing-stack.mdc

---

globs: _.test.ts,_.test.tsx,_.spec.ts,_.spec.tsx
description: Use Vitest for unit tests, Testing Library for component tests, and Playwright for e2e tests

---

# Testing Stack

Use the following testing tools for different types of tests in this project.

## Testing Tools

- **Vitest**: Unit tests and integration tests
- **Testing Library**: Component tests and user interaction tests
- **Playwright**: End-to-end tests and browser automation

## Test File Organization

```
src/
├── __tests__/
│   ├── unit/           # Vitest unit tests
│   │   ├── utils.test.ts
│   │   ├── services.test.ts
│   │   └── repositories.test.ts
│   ├── components/     # Testing Library component tests
│   │   ├── Button.test.tsx
│   │   ├── UserForm.test.tsx
│   │   └── UserList.test.tsx
│   └── integration/    # Vitest integration tests
│       ├── api.test.ts
│       └── auth.test.ts
├── tests/
│   └── e2e/           # Playwright e2e tests
│       ├── auth.spec.ts
│       ├── user-management.spec.ts
│       └── admin-dashboard.spec.ts
```

## Vitest - Unit Tests

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

### Unit Test Examples

```typescript
// src/__tests__/unit/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatDate, calculateAge, validateEmail } from "@/utils/helpers";

describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("January 15, 2024");
  });

  it("should handle invalid dates", () => {
    expect(formatDate(new Date("invalid"))).toBe("Invalid Date");
  });
});

describe("calculateAge", () => {
  it("should calculate age correctly", () => {
    const birthDate = new Date("1990-01-01");
    const currentDate = new Date("2024-01-01");
    expect(calculateAge(birthDate, currentDate)).toBe(34);
  });
});

describe("validateEmail", () => {
  it("should validate correct email addresses", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name+tag@domain.co.uk")).toBe(true);
  });

  it("should reject invalid email addresses", () => {
    expect(validateEmail("invalid-email")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
  });
});
```

### Service Layer Tests

```typescript
// src/__tests__/unit/services/user.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "@/services/user.service";
import type { UserRepository } from "@/repositories/interfaces/user.repository";

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      count: vi.fn(),
    };
    userService = new UserService(mockUserRepository);
  });

  describe("createUser", () => {
    it("should create user successfully", async () => {
      const userData = {
        first_name: "John",
        last_name: "Doe",
        email_address: "john@example.com",
      };

      const createdUser = {
        id: 1,
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        userData.email_address,
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(createdUser);
    });

    it("should throw error if email already exists", async () => {
      const userData = {
        first_name: "John",
        last_name: "Doe",
        email_address: "john@example.com",
      };

      const existingUser = {
        id: 1,
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      await expect(userService.createUser(userData)).rejects.toThrow(
        "User with this email already exists",
      );
    });
  });
});
```

## Testing Library - Component Tests

### Configuration

```typescript
// src/__tests__/setup.ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

### Component Test Examples

```typescript
// src/__tests__/components/Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("should render with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should apply correct variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive");
  });
});
```

### Form Component Tests

```typescript
// src/__tests__/components/UserForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserForm } from "@/components/UserForm";

describe("UserForm", () => {
  it("should render form fields", () => {
    render(<UserForm onSuccess={vi.fn()} />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create user/i })).toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<UserForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should show validation errors for invalid data", async () => {
    const user = userEvent.setup();
    render(<UserForm onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), "invalid-email");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

## Playwright - E2E Tests

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    await page.fill('[data-testid="email-input"]', "admin@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('[data-testid="email-input"]', "invalid@example.com");
    await page.fill('[data-testid="password-input"]', "wrongpassword");
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "Invalid credentials",
    );
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "admin@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL("/login");
  });
});
```

### User Management E2E Tests

```typescript
// tests/e2e/user-management.spec.ts
import { test, expect } from "@playwright/test";

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "admin@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');
    await page.goto("/users");
  });

  test("should create new user", async ({ page }) => {
    await page.click('[data-testid="create-user-button"]');

    await page.fill('[data-testid="first-name-input"]', "John");
    await page.fill('[data-testid="last-name-input"]', "Doe");
    await page.fill('[data-testid="email-input"]', "john.doe@example.com");
    await page.click('[data-testid="save-user-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator("text=John Doe")).toBeVisible();
  });

  test("should edit existing user", async ({ page }) => {
    await page.click('[data-testid="edit-user-button"]');

    await page.fill('[data-testid="first-name-input"]', "Jane");
    await page.click('[data-testid="save-user-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator("text=Jane Doe")).toBeVisible();
  });

  test("should delete user", async ({ page }) => {
    await page.click('[data-testid="delete-user-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator("text=John Doe")).not.toBeVisible();
  });
});
```

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug"
  }
}
```

## Best Practices

### Unit Tests

- Test individual functions and methods
- Mock external dependencies
- Use descriptive test names
- Test edge cases and error conditions
- Keep tests fast and isolated

### Component Tests

- Test user interactions, not implementation details
- Use `data-testid` attributes for reliable element selection
- Test accessibility features
- Mock API calls and external services
- Test loading and error states

### E2E Tests

- Test critical user journeys
- Use page object model for complex pages
- Test across different browsers
- Include visual regression tests when needed
- Keep tests independent and parallelizable

## Test Data Management

```typescript
// src/__tests__/fixtures/user.fixtures.ts
export const mockUsers = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email_address: "john@example.com",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    is_active: true,
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email_address: "jane@example.com",
    created_at: new Date("2024-01-02"),
    updated_at: new Date("2024-01-02"),
    is_active: false,
  },
];
```

## typescript-preferred.mdc

---

alwaysApply: true
description: Always use TypeScript over plain JavaScript

---

# TypeScript Usage

Always prefer TypeScript over plain JavaScript in this project.

## Guidelines

- **Use `.ts` files** for TypeScript modules and utilities
- **Use `.tsx` files** for React components with TypeScript
- **Avoid `.js` files** unless absolutely necessary for specific tooling
- **Define proper types** for all functions, variables, and interfaces
- **Use strict TypeScript configuration** with proper type checking

## File Extensions

- **`.ts`** - TypeScript modules, utilities, and non-React code
- **`.tsx`** - React components with TypeScript
- **`.js`** - Only for configuration files that require it (e.g., `next.config.js`, `prettier.config.js`)

## Type Definitions

Always define types for:

- Function parameters and return types
- Component props interfaces
- API response types
- Database schema types
- State management types

## Examples

### Correct TypeScript Usage

```typescript
// Define interfaces for props
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// Type function parameters and return values
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Type component props
const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};
```

### Avoid Plain JavaScript

```javascript
// ❌ Don't use plain JavaScript
const Button = ({ children, onClick, variant, disabled }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
```

## Configuration

Ensure `tsconfig.json` is properly configured with:

- Strict type checking enabled
- Proper module resolution
- Target modern JavaScript features
- Include all necessary paths and types
