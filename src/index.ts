import express from "express"
import os from "os"

const app = express()
const PORT = Number(process.env.PORT ?? 3000)
const startedAt = new Date().toISOString()
const VERSION = "v1"

// ALB health check
app.get("/health", (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Listening on :${PORT}`)
})
