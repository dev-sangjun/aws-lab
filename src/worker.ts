import type { SQSBatchResponse, SQSEvent } from "aws-lambda"

// Runs once per cold start; kept on warm starts
const bootedAt = new Date().toISOString()

export const handler = async (event: SQSEvent) => {
  console.log(`batch size=${event.Records.length} bootedAt=${bootedAt}`)

  // IDs of the messages that failed
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = []

  for (const record of event.Records) {
    try {
      const job = JSON.parse(record.body)
      const receiveCount = record.attributes.ApproximateReceiveCount

      console.log(`job=${record.messageId} try=${receiveCount} body=${record.body}`)

      if (job.fail) {
        throw new Error(`job ${record.messageId} failed`)
      }

      await new Promise((r) => setTimeout(r, 1000))
    } catch (error) {
      console.error(`job=${record.messageId} error=${(error as Error).message}`)
      batchItemFailures.push({
        itemIdentifier: record.messageId,
      })
    }
  }

  // Only these are retried (needs partialResponses); the rest are deleted
  return {
    batchItemFailures,
  }
}
