AGENTS

Opinionated playbook for Cursor (or any AI agent) to implement Linear issues end-to-end with OpenAPI docs, linting, tests, a clean branch, and a PR to main.

⸻

High-level contract

When working on a Linear issue, the agent must: 1. Create/switch to a feature branch named ${ISSUE_ID}-${short-slug-of-issue-title} (e.g., HAV-24-user-login-logout). 2. Design/Update OpenAPI for any API work in the issue, and keep docs in sync with code. 3. Complete all requested work in the issue description/acceptance criteria. 4. Add passing automated tests that cover all stated test cases; extend existing suites as needed.
• Unit tests with Vitest
• Component/integration tests with Testing Library
• End-to-end tests with Playwright 5. Lint & format the codebase and fix issues (ESLint/Prettier) before committing. 6. Verify unrelated suites still pass (run the full repo tests). 7. Commit the completed work (Husky-enforced) with a conventional message referencing the Linear issue. 8. Create a pull request targeting main with a clear summary, checklist, and links back to the Linear issue.

⸻

Pre-requisites & assumptions
• Git is configured with write access to the remote.
• The repository uses pnpm with the following scripts:
• pnpm test → runs Vitest unit + integration suites (Testing Library included)
• pnpm e2e → runs Playwright tests
• pnpm lint → runs ESLint (should exit nonzero on problems)
• pnpm format → runs Prettier (write mode)
• OpenAPI tooling (mandatory for API changes)
• pnpm openapi:lint → lints OpenAPI with Spectral/Redocly
• pnpm openapi:bundle → bundles openapi/openapi.yaml to a single openapi/dist.yaml
• pnpm openapi:types → generates TS types/clients from the bundled spec
• pnpm openapi:docs (optional) → builds static HTML docs
• Husky is installed and configured with mandatory pre-commit hooks to run lint, format, and tests before allowing commits.
• GitHub CLI gh is available for creating PRs.

If OpenAPI scripts or configs are missing, the agent must bootstrap them (see OpenAPI bootstrap below) before proceeding with API work.

⸻

Branch naming
• Format: ${ISSUE_ID}-${SHORT_SLUG}
• ISSUE_ID comes directly from Linear (e.g., HAV-24).
• SHORT_SLUG is derived from the issue title:
• lowercase
• ASCII letters/numbers only
• spaces and punctuation → hyphens
• trim to ~6–8 tokens (keep meaningful terms)
• collapse multiple hyphens

Examples
• HAV-24-user-login-logout
• APP-311-archive-old-invoices

⸻

Algorithm (strict) 1. Sync & Parse
• git fetch --all --prune
• Read the active Linear issue: ISSUE_ID, TITLE, DESCRIPTION, ACCEPTANCE_CRITERIA, and any linked tasks. 2. Create/Switch Branch
• SLUG = slugify(TITLE)
• BRANCH = ISSUE_ID + '-' + SLUG
• If branch exists: git switch BRANCH; else: git switch -c BRANCH 3. API-first for API work
• If the issue adds/changes endpoints, DTOs, errors, or auth:
• Update openapi/openapi.yaml (or create it) with:
• Paths/methods, params, request bodies, responses (2xx/4xx/5xx), error schemas
• Component schemas with examples, enums, pagination, and auth (bearer cookie/JWT, etc.)
• Run pnpm openapi:lint and fix any violations.
• Run pnpm openapi:bundle && pnpm openapi:types to generate types/clients.
• Commit the spec change separately (docs(openapi): …) before implementation. 4. Establish test baseline
• pnpm test
• pnpm e2e
• If baseline fails, record failing suites in the PR body later (do not mask unrelated, pre-existing failures). 5. Implement
• Follow acceptance criteria using the generated OpenAPI types for request/response contracts.
• Keep route handlers, services, and models aligned with the spec. 6. Add/Update tests
• For each acceptance criterion and bug fix, add/extend:
• Vitest unit tests (services, utils)
• Testing Library component tests (UI flows)
• Playwright e2e tests (happy-path + key error paths)
• Contract tests for APIs (at minimum):
• Assert handlers return shapes consistent with generated OpenAPI types (compile-time) and include example-based assertions (runtime). 7. Lint, format, and fix issues (mandatory)
• pnpm lint --fix
• pnpm format
• pnpm openapi:lint 8. Verify repository health
• Re-run all tests: pnpm test && pnpm e2e
• Must pass. If flaky tests exist, re-run once; if still failing and unrelated, note them in PR and do not alter tests without clear reason. 9. Commit (enforced by Husky)
• Husky pre-commit hook must run:

pnpm lint && pnpm format && pnpm test && pnpm e2e && pnpm openapi:lint

    •	Stage changes: git add -A
    •	Commit message:

feat(${ISSUE_ID}): short summary of the change

- bullet 1 describing main change
- bullet 2 describing tests added
- references: Linear ${ISSUE_ID}

  • Keep messages conventional (feat, fix, chore, refactor, test, docs).
  10. Push
      • git push -u origin BRANCH
  11. Create PR → main
      • Using GitHub CLI:

gh pr create \
 --base main \
 --head "$BRANCH" \
  --title "${ISSUE_ID}: ${TITLE}" \
 --body-file ./.github/PULL_REQUEST_TEMPLATE.md 2>/dev/null || true

    •	If no template, construct a body (see template below) and pass --body.

    12.	Linkage
    •	Ensure the PR description references the Linear issue (${ISSUE_ID}) so automations link back.

⸻

PR body template (fallback)

**Linear**: ${ISSUE_ID}
**Title**: ${TITLE}

### What & Why

- Briefly explain the change and the user impact.

### Acceptance Criteria Coverage

- [x] Criterion 1 → unit/integration test: path/to/test.spec.ts
- [x] Criterion 2 → UI test (Testing Library): path/to/component.test.tsx
- [x] Criterion 3 → e2e test (Playwright): tests/e2e/...spec.ts

### API / OpenAPI

- Spec updated: openapi/openapi.yaml (bundled: openapi/dist.yaml)
- Lint status (Spectral/Redocly): PASS ✅
- Types generated: `src/types/openapi.d.ts`
- Notable changes: new/changed endpoints, request/response DTOs, errors

### Lint & Format

- ESLint: PASS ✅ / fixed issues
- Prettier: formatted ✅

### Tests

- Added/updated: list of Vitest/Testing Library/Playwright specs
- Full run: PASS ✅ (unrelated pre-existing failures noted below)

### Unrelated Known Failures (if any)

- Package: test name – reason/evidence (do not modify without approval)

### Notes

- Migrations applied? If yes, instructions/rollback notes
- Breaking changes? None/Details

⸻

OpenAPI bootstrap (only if missing) 1. Install dev deps

pnpm add -D @redocly/cli @stoplight/spectral-cli openapi-typescript

    2.	Scaffold files
    •	openapi/openapi.yaml — main spec source
    •	openapi/.spectral.yaml — ruleset (optional)
    3.	package.json scripts

{
"scripts": {
"openapi:lint": "spectral lint openapi/openapi.yaml",
"openapi:bundle": "redocly bundle openapi/openapi.yaml -o openapi/dist.yaml",
"openapi:types": "openapi-typescript openapi/dist.yaml -o src/types/openapi.d.ts",
"openapi:docs": "redocly build-docs openapi/dist.yaml -o docs/api"
}
}

    4.	Husky pre-commit (add OpenAPI lint)

# .husky/pre-commit

pnpm lint && pnpm format && pnpm test && pnpm e2e && pnpm openapi:lint

⸻

Implementation snippets (for Cursor to reuse)

Slugify (TypeScript)

export function shortSlug(input: string, maxWords = 8): string {
return input
.toLowerCase()
.normalize('NFKD')
.replace(/[^a-z0-9\s-]/g, '')
.trim()
.split(/\s+/)
.slice(0, maxWords)
.join('-')
.replace(/-+/g, '-');
}

Branch helper (shell)

ISSUE_ID="$1"          # e.g. HAV-24
ISSUE_TITLE="$2"       # e.g. User login/logout
SLUG=$(node -e "console.log(require('./scripts/slug').shortSlug(process.argv.slice(1).join(' ')))" "$ISSUE_TITLE")
BRANCH="${ISSUE_ID}-${SLUG}"

git fetch --all --prune
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  git switch "${BRANCH}"
else
git switch -c "${BRANCH}"
fi

⸻

Quality gates the agent must enforce
• All acceptance criteria implemented and demonstrably tested.
• OpenAPI updated, linted, bundled, and types generated for any API change.
• ESLint clean (pnpm lint exits 0) and Prettier formatted.
• Repo tests green (Vitest + Testing Library + Playwright).
• Husky pre-commit hook passes before every commit.
• Conventional commits with Linear ID in the subject/body.
• Small PR when possible; if large by nature, structured commits and clear PR sections.

⸻

Done definition for the agent
• Feature branch created with correct name.
• Code + types + tests updated.
• pnpm lint + pnpm format run and clean.
• OpenAPI docs present and validated; types regenerated.
• Husky pre-commit hook enforces lint/format/test/openapi lint.
• All tests pass locally (Vitest + Testing Library + Playwright).
• Pushed remote branch and PR opened to main with complete PR body.
• Issue ID referenced so Linear ↔ VCS linkage is intact.
