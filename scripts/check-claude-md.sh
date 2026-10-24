#!/bin/sh
# Block the commit when project setup changes but CLAUDE.md isn't staged.
# If CLAUDE.md is still accurate, commit with CLAUDE_MD_OK=1.

[ "$CLAUDE_MD_OK" = "1" ] && exit 0

staged=$(git diff --cached --name-only --diff-filter=ACMDR)
echo "$staged" | grep -qx "CLAUDE.md" && exit 0

# Config files: any change counts
config=$(echo "$staged" | grep -E '^(sst\.config\.ts|package\.json|Dockerfile|\.dockerignore|tsconfig\.json|lefthook\.yml|\.oxfmtrc\.json|\.oxlintrc\.json|\.github/.*|scripts/.*)$')
# Source files: only added, deleted, or renamed ones (a new module, not a small edit)
src=$(git diff --cached --name-only --diff-filter=ADR | grep -E '^src/')

changed=$(printf '%s\n%s\n' "$config" "$src" | grep -v '^$')
[ -z "$changed" ] && exit 0

echo "These changes may make CLAUDE.md out of date:"
echo "$changed" | sed 's/^/  - /'
echo "Update CLAUDE.md and stage it, or commit with CLAUDE_MD_OK=1 if it's still accurate."
exit 1
