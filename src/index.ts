import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs"
import express from "express"
import os from "os"
import { Resource } from "sst"

const app = express()
const PORT = Number(process.env.PORT ?? 3000)
const startedAt = new Date().toISOString()
const VERSION = "v1"

const sqs = new SQSClient({})

app.use(express.json())

// ALB health check
app.get("/health", (_req, res) => {
  res.status(200).send("ok")
})

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from ECS!",
    version: VERSION,
    host: os.hostname(),
    startedAt,
  })
})

// Deliberately crashes the server to observe ECS auto-recovery
app.post("/crash", (_req, res) => {
  res.send("crashing...")
  setTimeout(() => {
    process.exit(1)
  }, 100)
})

app.post("/jobs", async (req, res) => {
  const result = await sqs.send(
    new SendMessageCommand({
      QueueUrl: Resource.JobQueue.url, // Queue URL, from the SST link
      MessageBody: JSON.stringify({
        ...req.body,
        from: os.hostname(), // Which ECS Task sent it
        sentAt: new Date().toISOString(),
      }),
    }),
  )

  // 202: queued, not processed yet
  res.status(202).json({ queued: true, messageId: result.MessageId })
})

app.listen(PORT, () => {
  console.log(`Listening on :${PORT}`)
})
