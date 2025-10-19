import type { Request, Response, NextFunction } from "express"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 100 // Max requests per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || "unknown"
  const now = Date.now()

  // Clean up expired entries
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })

  // Initialize or get client data
  if (!store[clientId]) {
    store[clientId] = {
      count: 0,
      resetTime: now + WINDOW_MS,
    }
  }

  const clientData = store[clientId]

  // Reset if window expired
  if (clientData.resetTime < now) {
    clientData.count = 0
    clientData.resetTime = now + WINDOW_MS
  }

  // Increment request count
  clientData.count++

  // Set rate limit headers
  res.set({
    "X-RateLimit-Limit": MAX_REQUESTS.toString(),
    "X-RateLimit-Remaining": Math.max(0, MAX_REQUESTS - clientData.count).toString(),
    "X-RateLimit-Reset": new Date(clientData.resetTime).toISOString(),
  })

  // Check if limit exceeded
  if (clientData.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    })
  }

  next()
}
