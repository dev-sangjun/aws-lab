---
name: end-lab
description: Tear down the dev stage at the end of a lab — run `sst remove`, restore `sst-env.d.ts`, and verify nothing billable is left on AWS.
disable-model-invocation: true
---

# End lab

The user typed `/end-lab`, which is their go-ahead to run `sst remove` for them. This is the one exception to the CLAUDE.md rule that the user runs every command that changes AWS. Only touch stage `dev`; never another stage.

## 1. Check AWS access

```bash
aws sts get-caller-identity --profile dev
```

If the SSO session has expired, stop and ask the user to run `! aws sso login --profile dev`, then continue.

## 2. Remove the stage

Run it in the background (RDS, VPC Lambda ENIs, and Transfer Family servers can take several minutes to delete) and wait for the completion notification:

```bash
bunx sst remove --stage dev
```

- If it fails, show the error. Retry once for transient errors (e.g. an ENI or security group still "in use" right after a VPC Lambda is deleted — wait a minute first).
- Never pass `--force`, and never delete resources by hand without asking the user.

## 3. Restore `sst-env.d.ts`

`sst remove` rewrites it empty, but CI typechecks against the committed version:

```bash
git restore sst-env.d.ts
```

## 4. Verify (read-only)

Look for anything left with the stage's tags:

```bash
aws resourcegroupstaggingapi get-resources --profile dev --region us-east-1 \
  --tag-filters Key=sst:app,Values=aws-lab Key=sst:stage,Values=dev \
  --query 'ResourceTagMappingList[].ResourceARN' --output text
```

The tagging API can list just-deleted resources for a while, so confirm any hit with the service's own `describe-*`/`list-*` call. Also check the billable services directly, filtered to `aws-lab-dev`:

- `aws elbv2 describe-load-balancers`, `aws ecs list-clusters`
- `aws rds describe-db-instances`, `aws elasticache describe-cache-clusters`
- `aws ec2 describe-instances --filters Name=instance-state-name,Values=pending,running,stopping,stopped` (bastion / NAT instances), `aws ec2 describe-nat-gateways --filter Name=state,Values=available,pending`
- `aws lambda list-functions`, `aws sqs list-queues`, `aws apigatewayv2 get-apis`
- `aws transfer list-servers`

The SST bootstrap (S3 `sst-asset-…`/`sst-state-…`, ECR repo `sst-asset`, SSM `/sst/bootstrap`) and the `aws-lab` SST state stay on purpose; don't report them as leftovers.

## 5. Report

In Korean, in a few lines: whether `sst remove` succeeded, that `sst-env.d.ts` was restored, and either "남은 과금 리소스 없음" or the exact leftovers with what they cost. If something is left, ask before deleting it.
