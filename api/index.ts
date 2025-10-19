import express from "express"
import cors from "cors"
import { config } from "dotenv"
import { lotsRouter } from "./routes/lots"
import { auctionsRouter } from "./routes/auctions"
import { adminRouter } from "./routes/admin"
import { hcsRouter } from "./routes/hcs"
import { ipfsRouter } from "./routes/ipfs"
import aiRouter from "./routes/ai"
import workflowsRouter from "./routes/workflows"
import { blockchainEventListener } from "./services/blockchain-events"
import { errorHandler } from "./middleware/error-handler"
import { rateLimiter } from "./middleware/rate-limiter"

// Load environment variables
config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(rateLimiter)

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
})

// API Routes
app.use("/api/lots", lotsRouter)
app.use("/api/auctions", auctionsRouter)
app.use("/api/admin", adminRouter)
app.use("/api/hcs", hcsRouter)
app.use("/api/ipfs", ipfsRouter)
app.use("/api/ai", aiRouter)
app.use("/api/workflows", workflowsRouter)

// Error handling
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TraceTrade API server running on port ${PORT}`)

  // Start blockchain event listener
  blockchainEventListener
    .start()
    .then(() => console.log("📡 Blockchain event listener started"))
    .catch(console.error)
})

export default app
