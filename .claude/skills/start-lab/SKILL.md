---
name: start-lab
description: Start (or resume) a lab — switch to its feature branch, creating it from an up-to-date main if it doesn't exist. Use when the user types /start-lab or says they want to start or continue a numbered lab ("Lab 4 시작하자", "lab 5 이어서 하자").
---

# Start lab

## 1. Pick the lab number

- Use the number in the arguments or the user's message.
- Otherwise infer it only when the conversation makes it unambiguous (e.g. we just finished planning Lab 4).
- Otherwise ask with AskUserQuestion, no preamble. The recommended option is the next lab: the highest `NN` in `docs/labs/NN-*.md` plus one. Offer it and the two after it.

## 2. Branch name

| Lab | Branch                       |
| --- | ---------------------------- |
| 02  | `feature/lambda-sqs`         |
| 03  | `feature/rds-postgres`       |
| 04  | `feature/migration-pipeline` |
| 05  | `feature/cognito-auth`       |
| 06  | `feature/s3-presigned`       |
| 07  | `feature/s3-sftp`            |
| 08  | `feature/event-bus`          |
| 09  | `feature/cron-notifications` |
| 10  | `feature/appsync`            |
| 11  | `feature/load-redis`         |
| 12  | `feature/db-scaling`         |

For a lab not in the table, propose `feature/<short-slug>` in the question and add the row here once the user agrees. The slug should match the lab's `docs/labs/NN-<slug>.md`.

## 3. Check the working tree

Run `git status --short`. If there are uncommitted changes, ask what to do (commit first, stash, or carry them onto the lab branch). Never discard them.

## 4. Switch

```bash
git fetch origin
```

- **Local branch exists** → `git switch <branch>`. If it's behind `origin/<branch>`, say so and offer `git pull --ff-only`.
- **Only on origin** → `git switch --track origin/<branch>`.
- **Nowhere** → branch from the latest main:

  ```bash
  git switch main
  git pull --ff-only
  git switch -c <branch>
  ```

If `git pull --ff-only` fails (local main diverged), stop and report; don't merge or reset.

## 5. Report

In Korean, two or three lines: which lab, which branch, whether it was created or switched to, and the commit it's on (`git log -1 --oneline`). Don't push the new branch.
