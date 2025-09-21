# AGENTS

> Opinionated playbook for Cursor (or any AI agent) to implement Linear issues end-to-end with **OpenAPI docs**, linting, tests, a clean branch, and a PR to `main`.

---

## High-level contract

When working on a Linear issue, the agent **must**:

1. **Create/switch to a feature branch** named `${ISSUE_ID}-${short-slug-of-issue-title}` (e.g., `HAV-24-user-login-logout`).
2. **Design/Update OpenAPI** for any API work in the issue, and keep docs in sync with code.
3. **Complete all requested work** in the issue description/acceptance criteria.
4. **Add passing automated tests** that cover _all_ stated test cases; extend existing suites as needed.
   - Unit tests with **Vitest**
   - Component/integration tests with **Testing Library**
   - End-to-end tests with **Playwright**

5. **Lint & format the codebase** and fix issues (ESLint/Prettier) before committing.
6. **Verify unrelated suites still pass** (run the full repo tests).
7. **Commit the completed work** (Husky-enforced) with a conventional message referencing the Linear issue.
8. **Create a pull request** targeting `main` with a clear summary, checklist, and links back to the Linear issue.

---

## Pre-requisites & assumptions

- Git is configured with write access to the remote.
- The repository uses **pnpm** with the following scripts:
  - `pnpm test` → runs Vitest unit + integration suites (Testing Library included)
  - `pnpm e2e` → runs Playwright tests
  - `pnpm lint` → runs ESLint (should exit nonzero on problems)
  - `pnpm format` → runs Prettier (write mode)
  - **OpenAPI tooling (mandatory for API changes)**
    - `pnpm openapi:lint` → lints OpenAPI with Spectral/Redocly
    - `pnpm openapi:bundle` → bundles `openapi/openapi.yaml` to a single `openapi/dist.yaml`
    - `pnpm openapi:types` → generates TS types/clients from the bundled spec
    - `pnpm openapi:docs` (optional) → builds static HTML docs

- **Husky is installed and configured with mandatory pre-commit hooks** to run lint, format, and tests before allowing commits.
- GitHub CLI [`gh`](https://cli.github.com/) is available for creating PRs.

> If OpenAPI scripts or configs are missing, the agent **must bootstrap them** (see **OpenAPI bootstrap** below) before proceeding with API work.

---

## Branch naming

- Format: `${ISSUE_ID}-${SHORT_SLUG}`
- `ISSUE_ID` comes directly from Linear (e.g., `HAV-24`).
- `SHORT_SLUG` is derived from the issue title:
  - lowercase
  - ASCII letters/numbers only
  - spaces and punctuation → hyphens
  - trim to \~6–8 tokens (keep meaningful terms)
  - collapse multiple hyphens

**Examples**

- `HAV-24-user-login-logout`
- `APP-311-archive-old-invoices`

---

## Algorithm (strict)

1. **Sync & Parse**
   - `git fetch --all --prune`
   - Read the active Linear issue: `ISSUE_ID`, `TITLE`, `DESCRIPTION`, `ACCEPTANCE_CRITERIA`, and any linked tasks.

2. **Create/Switch Branch**
   - `SLUG = slugify(TITLE)`
   - `BRANCH = ISSUE_ID + '-' + SLUG`
   - If branch exists: `git switch BRANCH`; else: `git switch -c BRANCH`

3. **API-first for API work**
   - If the issue **adds/changes endpoints, DTOs, errors, or auth**:
     - Update `openapi/openapi.yaml` (or create it) with:
       - Paths/methods, params, request bodies, responses (2xx/4xx/5xx), error schemas
       - Component schemas with examples, enums, pagination, and auth (bearer cookie/JWT, etc.)

     - Run `pnpm openapi:lint` and fix any violations.
     - Run `pnpm openapi:bundle && pnpm openapi:types` to generate types/clients.
     - Commit the spec change separately (`docs(openapi): …`) before implementation.

4. **Establish test baseline**
   - `pnpm test`
   - `pnpm e2e`
   - If baseline fails, record failing suites in the PR body later (do **not** mask unrelated, pre-existing failures).

5. **Implement**
   - Follow acceptance criteria using the **generated OpenAPI types** for request/response contracts.
   - Keep route handlers, services, and models aligned with the spec.

6. **Add/Update tests**
   - For each acceptance criterion and bug fix, add/extend:
     - **Vitest unit tests** (services, utils)
     - **Testing Library component tests** (UI flows)
     - **Playwright e2e tests** (happy-path + key error paths)

   - **Contract tests** for APIs (at minimum):
     - Assert handlers return shapes consistent with generated OpenAPI types (compile-time) and include example-based assertions (runtime).

7. **Lint, format, and fix issues (mandatory)**
   - `pnpm lint --fix`
   - `pnpm format`
   - `pnpm openapi:lint`

8. **Verify repository health**
   - Re-run **all** tests: `pnpm test && pnpm e2e`
   - **Must pass**. If flaky tests exist, re-run once; if still failing and unrelated, note them in PR and do not alter tests without clear reason.

9. **Commit (enforced by Husky)**
   - Husky `pre-commit` hook must run:

     ```bash
     pnpm lint && pnpm format && pnpm test && pnpm e2e && pnpm openapi:lint
     ```

   - Stage changes: `git add -A`
   - Commit message:

     ```
     feat(${ISSUE_ID}): short summary of the change

     - bullet 1 describing main change
     - bullet 2 describing tests added
     - references: Linear ${ISSUE_ID}
     ```

   - Keep messages conventional (`feat`, `fix`, `chore`, `refactor`, `test`, `docs`).

10. **Push**
    - `git push -u origin BRANCH`

11. **Create PR → main**
    - Using GitHub CLI:

      ```bash
      gh pr create \
        --base main \
        --head "$BRANCH" \
        --title "${ISSUE_ID}: ${TITLE}" \
        --body-file ./.github/PULL_REQUEST_TEMPLATE.md 2>/dev/null || true
      ```

    - If no template, construct a body (see template below) and pass `--body`.

12. **Linkage**
    - Ensure the PR description references the Linear issue (`${ISSUE_ID}`) so automations link back.

---

## PR body template (fallback)

```
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
- Types generated: `src/types/api.d.ts`
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
```

---

## OpenAPI bootstrap (only if missing)

1. **Install dev deps**

   ```bash
   pnpm add -D @redocly/cli @stoplight/spectral-cli openapi-typescript
   ```

2. **Scaffold files**
   - `openapi/openapi.yaml` — main spec source
   - `openapi/.spectral.yaml` — ruleset (optional)

3. **`package.json` scripts**

   ```json
   {
     "scripts": {
       "openapi:lint": "spectral lint openapi/openapi.yaml",
       "openapi:bundle": "redocly bundle openapi/openapi.yaml -o openapi/dist.yaml",
       "openapi:types": "openapi-typescript openapi/dist.yaml -o src/types/api.d.ts",
       "openapi:docs": "redocly build-docs openapi/dist.yaml -o docs/api"
     }
   }
   ```

4. **Husky pre-commit (add OpenAPI lint)**

   ```bash
   # .husky/pre-commit
   pnpm lint && pnpm format && pnpm test && pnpm e2e && pnpm openapi:lint
   ```

---

## Implementation snippets (for Cursor to reuse)

### Slugify (TypeScript)

```ts
export function shortSlug(input: string, maxWords = 8): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join("-")
    .replace(/-+/g, "-");
}
```

### Branch helper (shell)

```bash
ISSUE_ID="$1"
ISSUE_TITLE="$2"
SLUG=$(node ./scripts/slug.mjs "$ISSUE_TITLE")
BRANCH="${ISSUE_ID}-${SLUG}"

git fetch --all --prune
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  git switch "${BRANCH}"
else
  git switch -c "${BRANCH}"
fi
```

---

## Quality gates the agent must enforce

- **All acceptance criteria implemented** and demonstrably tested.
- **OpenAPI updated, linted, bundled, and types generated** for any API change.
- **ESLint clean** (`pnpm lint` exits 0) and **Prettier formatted**.
- **Repo tests green** (Vitest + Testing Library + Playwright).
- **Husky pre-commit hook passes** before every commit.
- **Conventional commits** with Linear ID in the subject/body.
- **Small PR** when possible; if large by nature, structured commits and clear PR sections.

---

## Done definition for the agent

- Feature branch created with correct name.
- Code + types + tests updated.
- **`pnpm lint` + `pnpm format` run and clean.**
- **OpenAPI docs present and validated**; types regenerated.
- Husky pre-commit hook enforces lint/format/test/openapi lint.
- All tests pass locally (Vitest + Testing Library + Playwright).
- Pushed remote branch and PR opened to `main` with complete PR body.
- Issue ID referenced so Linear ↔ VCS linkage is intact.

---

## Post‑PR impartial review (mandatory)

> After creating the PR, the agent must switch to a **fresh‑eyes reviewer** mode and audit the work as if it were a third party.

### Reviewer setup

1. **Sync a clean workspace** (avoid cached artifacts):

   ```bash
   git fetch origin --prune
   git checkout "$BRANCH"
   git reset --hard origin/"$BRANCH"
   git clean -xdf
   pnpm install --frozen-lockfile
   ```

2. **Rebuild & re‑run everything locally** to mirror CI:

   ```bash
   pnpm lint && pnpm format:check && pnpm openapi:lint && pnpm test && pnpm e2e
   ```

### What to review (checklist)

- **Scope & AC**: Every acceptance criterion is implemented; no unrelated changes.
- **Tests**: Adequate coverage of happy/edge/error paths; avoid over‑mocking; meaningful assertions; UI tests stable.
- **OpenAPI**: Spec matches implementation (paths, status codes, examples); types regenerated; breaking changes called out.
- **Types & DX**: No `any` leakage; strict TS passes; developer ergonomics (naming, docs, errors) are solid.
- **Performance**: No N+1, unnecessary rerenders; streaming/pagination where appropriate.
- **Security**: AuthZ/AuthN checks; input validation; secrets not logged; dependency diff reviewed.
- **Accessibility (if UI)**: Labels, roles, keyboard nav, color contrast (at least smoke‑tested).
- **Churn**: Minimize noisy formatting diffs; only intentional changes.

### GitHub review mechanics (required)

Use the GitHub CLI to post a real review—**never rubber‑stamp**:

```bash
# Summarize the diff
gh pr diff --web   # quick visual

# Leave threaded comments on specific lines (repeat as needed)
gh pr comment --body "[area] Observation / risk / suggestion (link to file/line)"

# Submit a review with a stance:
CHANGES_NEEDED=true # or false, set based on checklist
if [ "$CHANGES_NEEDED" = true ]; then
  gh pr review --request-changes --body "See inline comments. Failing checks: …"
else
  gh pr review --approve --body "Meets AC, tests green, OpenAPI aligned."
fi
```

### Comment addressing loop (max 5 cycles)

1. **Address all review comments**
   - Implement changes in new commits (or explain in PR why a suggestion is not worth addressing).
   - Update docs, types, or tests as necessary.
   - Re‑run `pnpm lint && pnpm format && pnpm openapi:lint && pnpm test && pnpm e2e`.
   - Push updates to the same branch.

2. **Update PR**
   - Amend the PR body to reflect addressed comments and remaining open points.

3. **Re‑review with fresh eyes**
   - Repeat the impartial review process above from a clean checkout.

4. **Repeat steps 1–3** until:
   - No more review comments remain, or
   - Remaining suggestions are explicitly determined not worth addressing.
   - **Failsafe:** Do not exceed 5 review cycles to avoid infinite recursion.

### PR comment template (drop into review body)

```
#### Reviewer Checklist (agent, fresh‑eyes)
- [ ] AC implemented end‑to‑end
- [ ] Unit/Integration/E2E tests adequate and stable
- [ ] OpenAPI in sync (lint passes, types regenerated)
- [ ] Lint/Format clean
- [ ] Security sanity (auth, input validation, secrets)
- [ ] Performance & a11y quick pass
- [ ] No unrelated changes or noisy diffs

**Notes:**
- Highlights:
- Risks:
- Follow‑ups (if any):
```

---

## Iterative PR loop: review → address → update (max 5 cycles)

> After the first PR is created and the **Post‑PR impartial review** is performed, the agent must iterate through review cycles to drive the PR to a clean state.

### Loop contract

- **Goal**: converge the PR to a state where either (a) there are **no more substantive comments** to make, or (b) remaining suggestions are **not worth addressing** (clearly documented why).
- **Hard cap**: **≤ 5 cycles** to avoid infinite recursion. Abort with a summary if the cap is reached.

### State

- Maintain a lightweight state file (committed) at `.agent/review-state.json`:

  ```json
  { "cycles": 0, "last_sha": "", "unaddressed": 0 }
  ```

### Algorithm

1. **Increment cycle**
   - Read `.agent/review-state.json`; `cycles++`. If `cycles > 5`, stop and summarize status in the PR.

2. **Run fresh‑eyes review** (see prior section) and post review via `gh pr review` with APPROVE or REQUEST‑CHANGES depending on the checklist.
3. **Collect actionable comments**
   - Use `gh pr view --comments --json comments` and filter for **actionable items** (bugs, missing tests, spec drift, security). Non‑actionable or low‑ROI suggestions must be **explicitly justified** in a PR comment.

4. **Address comments**
   - Implement fixes in **small commits**.
   - Update **OpenAPI** and regenerate types if API changed.
   - Re‑run gates: `pnpm lint && pnpm openapi:lint && pnpm test && pnpm e2e`.
   - Push updates.

5. **Update the PR**
   - Edit the PR body checklist to reflect addressed items.
   - Reply to each comment with either **Resolved** (include commit hash) or **Won’t fix** (include justification).

6. **Re‑review**
   - Repeat steps 2–5 until:
     - There are **no new comments** the agent would add in fresh‑eyes mode, **or**
     - Only **non‑material suggestions** remain (documented), **or**
     - **5 cycles** reached.

7. **Finalize**
   - If converged early: post a final `gh pr review --approve` with a summary.
   - If max cycles hit: post `gh pr review --comment` summarizing remaining items, risks, and why more cycles are not warranted.

# Using the PR loop files in AGENTS.md

You now have two helper files: `.agent/review-state.json` and `scripts/pr-loop.sh`. Agents must follow these rules when using them as part of the PR review loop.

---

## When to use

- **Immediately after opening the PR** (first review pass).
- **After every push that addresses review comments**.
- **Repeat until convergence** (no substantive comments remain) **or** the **5‑cycle cap** is hit.

---

## How to run (local)

```bash
# From the PR branch
scripts/pr-loop.sh
```

This script will:

1. Sync a clean workspace (`git fetch`, reset, clean).
2. Reinstall dependencies with `--frozen-lockfile`.
3. Run quality gates: `pnpm lint`, `pnpm format:check`, `pnpm openapi:lint` (if present), `pnpm test`, `pnpm e2e`.
4. Post a review comment via `gh pr review --comment`.
5. If fixes were staged/committed, push them and request another cycle.
6. If no changes are needed, approve the PR.
7. Update `.agent/review-state.json` with cycle count and last reviewed SHA.

---

## How to run (via package.json alias)

Add this script alias to `package.json` (agents must add if missing):

```json
{
  "scripts": {
    "reviewer": "scripts/pr-loop.sh"
  }
}
```

Then run:

```bash
pnpm reviewer
```

---

## State file rules

- `.agent/review-state.json` is the **canonical state** for review cycles.
- Agents must not reset this file unless restarting the loop intentionally.
- Reset example:

```bash
echo '{"cycles":0,"last_sha":"","unaddressed":0}' > .agent/review-state.json
```

---

## Workflow integration

1. **Create PR → main** (per AGENTS.md).
2. **Run** `pnpm reviewer` → Cycle 1.
3. **Address comments**, commit/push.
4. **Run** `pnpm reviewer` again → Cycle 2.
5. Repeat until either:
   - PR is approved, or
   - 5 cycles reached (stop and summarize).

---

## Agent guardrails

- Do not exceed 5 cycles (respect `.agent/review-state.json`).
- Always reply to each comment with **Resolved** (include commit hash) or **Won’t fix** (with justification).
- Never approve a PR if any checklist items fail (lint/test errors, OpenAPI drift, security issues, etc.).
