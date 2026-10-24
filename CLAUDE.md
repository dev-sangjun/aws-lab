# aws-lab

Hands-on labs for learning AWS one service at a time with SST v4. Each lab ends with a commit and a summary in `docs/labs/`.

## Stack

- **Infrastructure:** SST v4.17.2, all in `sst.config.ts`. Check `.sst/platform/src/components/aws/*.ts` before using an SST API; don't rely on older SST versions' docs.
- **App:** Express 5 + TypeScript. `src/index.ts` is the ECS API; `src/worker.ts` is the Lambda that processes SQS jobs. Keep Express; don't switch to `Bun.serve`.
- **Linked resources:** read them with `Resource` from `"sst"` (e.g. `Resource.JobQueue.url`). Their types live in `sst-env.d.ts`, which SST rewrites after `sst deploy` (not after `sst diff`).
- **Runtime:** Node.js 22 (`node:22-alpine` in the `Dockerfile`, Node.js on Lambda). Bun is only the package manager and build tool, so don't use Bun runtime APIs (`Bun.serve`, `Bun.file`, `bun:sqlite`) in `src/`.
- **Build:** the Docker image uses `bun build` with no type check, because `sst-env.d.ts` can be stale before the first deploy. Type checks run locally, in the hook, and in CI.
- **AWS:** region `us-east-1`, profile `dev`, stage `dev`.

## Commands

```bash
bun install                    # install dependencies
bun run dev                    # run the API locally (tsx watch)
bun run build                  # bundle src/index.ts to dist/ (bun build, no type check)
bun run typecheck              # tsc --noEmit
bun run check                  # lint + format check + type check (same as CI)
bun run format                 # format everything with oxfmt
bunx sst deploy --stage dev    # create or update everything on AWS
bunx sst remove --stage dev    # delete everything after a lab
```

## Conventions

- Code comments are in English, short, and say what a line is for.
- `README.md` and `docs/labs/*.md` are in English. Each lab adds `docs/labs/NN-<slug>.md` and a row in the README lab table.
- Commits follow Conventional Commits: `<type>: <subject>`, lowercase, imperative.
- Formatting is oxfmt (no semicolons, double quotes, 2-space indent); linting is oxlint. Both are set in `.oxfmtrc.json` and `.oxlintrc.json`.

## Pre-commit hook and CI

- `bun install` installs a lefthook pre-commit hook (`lefthook.yml`): it formats and lint-fixes the staged files, re-stages them, then runs the type check.
- The hook also blocks the commit when project setup changed but `CLAUDE.md` isn't staged (`scripts/check-claude-md.sh`). That covers config files (`sst.config.ts`, `package.json`, `Dockerfile`, `tsconfig.json`, lint/format/hook/CI config, `scripts/`) and added, deleted, or renamed files in `src/`. Update this file to match, or commit with `CLAUDE_MD_OK=1` only when it's still accurate.
- If a commit fails the hook, fix the reported problem and commit again until it passes. Never skip it with `--no-verify` or `LEFTHOOK=0`.
- GitHub Actions (`.github/workflows/ci.yml`) runs the same checks on pushes to `main` and on pull requests.

## Working on a lab

- The user types the lab code and runs every command that changes AWS (`sst deploy`, `sst remove`, console changes). Explain and review; don't edit lab code or deploy unless asked.
- Read-only AWS checks are fine (`describe-*`, `list-*`, `get-*`, `logs tail`).
- Resources cost money while they run (the ALB and Fargate tasks most of all), so end every lab with `sst remove`.
- `/start-lab` (`.claude/skills/start-lab/`) switches to a lab's `feature/<slug>` branch, creating it from the latest main if needed.
- Exception: when the user types `/end-lab` (`.claude/skills/end-lab/`), run `sst remove --stage dev` for them, restore `sst-env.d.ts`, and verify nothing billable is left.
- AWS console paths are written with the English UI labels, e.g. `Lambda → Functions → <fn> → Configuration → Triggers`.
