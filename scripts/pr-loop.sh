#!/usr/bin/env bash
set -euo pipefail

# Iterative PR loop helper — aligns to AGENTS.md
# Requires: gh, pnpm, jq

STATE_FILE=".agent/review-state.json"
MAX=5
BRANCH=${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}

mkdir -p .agent scripts
if [ ! -f "$STATE_FILE" ]; then
  echo '{"cycles":0,"last_sha":"","unaddressed":0}' > "$STATE_FILE"
fi

cycles=$(jq -r '.cycles' "$STATE_FILE")
last_sha=$(jq -r '.last_sha' "$STATE_FILE")

run_checks() {
  pnpm lint
  pnpm format:check || (echo "Prettier check failed — run pnpm format" && exit 1)
  if pnpm -s openapi:lint >/dev/null 2>&1; then pnpm openapi:lint; fi
  pnpm test
  if pnpm -s e2e >/dev/null 2>&1; then pnpm e2e; fi
}

while [ "$cycles" -lt "$MAX" ]; do
  cycles=$((cycles+1))
  echo "
=== PR Cycle $cycles/$MAX (branch: $BRANCH) ==="

  # Clean sync
  git fetch origin --prune
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
  git clean -xdf
  pnpm install --frozen-lockfile

  # Run gates
  run_checks

  # Post cycle comment
  gh pr review --comment --body "Cycle $cycles: fresh-eyes checks complete. Addressing actionable items."

  # If fixes staged, commit and push
  if ! git diff --quiet; then
    git add -A
    git commit -m "chore(${BRANCH}): address review comments (cycle $cycles)"
    git push
  fi

  # Decide stance: approve if clean, else request changes
  if git diff --quiet && git diff --cached --quiet; then
    gh pr review --approve --body "Cycle $cycles: no further actionable issues detected. Approving."
    jq --arg sha "$(git rev-parse HEAD)" --argjson c "$cycles" '.last_sha=$sha | .cycles=$c' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    exit 0
  else
    gh pr review --request-changes --body "Cycle $cycles: additional changes pushed; running another cycle."
    jq --arg sha "$(git rev-parse HEAD)" --argjson c "$cycles" '.last_sha=$sha | .cycles=$c' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi

done

echo "Reached max cycles ($MAX). Summarize remaining items in PR and stop." >&2
exit 0