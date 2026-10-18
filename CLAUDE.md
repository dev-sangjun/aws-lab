# aws-lab

Hands-on labs for learning AWS one service at a time with SST v4. Each lab ends with a commit and a summary in `docs/labs/`.

## Stack

- **Infrastructure:** SST v4.17.2, all in `sst.config.ts`. Check `.sst/platform/src/components/aws/*.ts` before using an SST API; don't rely on older SST versions' docs.
- **App:** Express 5 + TypeScript in `src/`. Keep Express; don't switch to `Bun.serve`.
- **Runtime:** Node.js 22 (`node:22-alpine` in the `Dockerfile`). Bun is only the package manager and build tool, so don't use Bun runtime APIs (`Bun.serve`, `Bun.file`, `bun:sqlite`) in `src/`.
- **AWS:** region `us-east-1`, profile `dev`, stage `dev`.

## Commands

```bash
bun install                    # install dependencies
bun run dev                    # run the API locally (tsx watch)
bun run build                  # compile src/ to dist/
bunx sst deploy --stage dev    # create or update everything on AWS
bunx sst remove --stage dev    # delete everything after a lab
```

## Conventions

- Code comments are in English, short, and say what a line is for.
- `README.md` and `docs/labs/*.md` are in English. Each lab adds `docs/labs/NN-<slug>.md` and a row in the README lab table.
- Commits follow Conventional Commits: `<type>: <subject>`, lowercase, imperative.

## Working on a lab

- The user types the lab code and runs every command that changes AWS (`sst deploy`, `sst remove`, console changes). Explain and review; don't edit lab code or deploy unless asked.
- Read-only AWS checks are fine (`describe-*`, `list-*`, `get-*`, `logs tail`).
- Resources cost money while they run (the ALB and Fargate tasks most of all), so end every lab with `sst remove`.
