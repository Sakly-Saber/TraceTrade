import { Router } from "express"
import { fetchAuditMessages, subscribeToAuditMessages } from "../../lib/hedera-consensus"

const router = Router()

/**
 * GET /api/hcs/messages - Get audit messages from HCS
 */
router.get("/messages", async (req, res) => {
  try {
    const { limit = "100" } = req.query
    const limitNum = Math.min(Number.parseInt(limit as string), 1000) // Max 1000 messages

    const messages = await fetchAuditMessages(limitNum)

    res.json({
      messages,
      count: messages.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching HCS messages:", error)
    res.status(500).json({ error: "Failed to fetch audit messages" })
  }
})

/**
 * GET /api/hcs/stream - Server-Sent Events stream for real-time audit messages
 */
router.get("/stream", (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  })

  // Send initial connection message
  res.write("data: " + JSON.stringify({ type: "connected", timestamp: Date.now() }) + "\n\n")

  // Subscribe to HCS messages
  const unsubscribe = subscribeToAuditMessages(
    (message) => {
      // Send message to client
      res.write(
        "data: " +
          JSON.stringify({
            type: "audit_message",
            data: message,
            timestamp: Date.now(),
          }) +
          "\n\n",
      )
    },
    (error) => {
      // Send error to client
      res.write(
        "data: " +
          JSON.stringify({
            type: "error",
            error: error.message,
            timestamp: Date.now(),
          }) +
          "\n\n",
      )
    },
  )

  // Handle client disconnect
  req.on("close", () => {
    unsubscribe()
    res.end()
  })

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write("data: " + JSON.stringify({ type: "heartbeat", timestamp: Date.now() }) + "\n\n")
  }, 30000) // Every 30 seconds

  req.on("close", () => {
    clearInterval(heartbeat)
  })
})

/**
 * GET /api/hcs/messages/auction/:id - Get audit messages for specific auction
 */
router.get("/messages/auction/:id", async (req, res) => {
  try {
    const auctionId = Number.parseInt(req.params.id)

    if (isNaN(auctionId)) {
      return res.status(400).json({ error: "Invalid auction ID" })
    }

    const allMessages = await fetchAuditMessages(1000)

    // Filter messages for this auction
    const auctionMessages = allMessages.filter((message) => message.data && message.data.auctionId === auctionId)

    res.json({
      auctionId,
      messages: auctionMessages,
      count: auctionMessages.length,
    })
  } catch (error) {
    console.error("Error fetching auction audit messages:", error)
    res.status(500).json({ error: "Failed to fetch auction audit messages" })
  }
})

export { router as hcsRouter }
