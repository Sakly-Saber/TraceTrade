import type { Request, Response, NextFunction } from "express"

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("API Error:", error)

  // Multer errors
  if (error.message.includes("File too large")) {
    return res.status(413).json({ error: "File too large" })
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({ error: "Invalid file type" })
  }

  // Blockchain errors
  if (error.message.includes("execution reverted")) {
    return res.status(400).json({ error: "Transaction failed: " + error.message })
  }

  // IPFS errors
  if (error.message.includes("IPFS")) {
    return res.status(503).json({ error: "IPFS service unavailable" })
  }

  // Default error
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : undefined,
  })
}
