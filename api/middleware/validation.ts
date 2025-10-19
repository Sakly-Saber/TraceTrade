import type { Request, Response, NextFunction } from "express"

export const validateLotData = (req: Request, res: Response, next: NextFunction) => {
  const { name, description, commodityType, quantity, unit, quality, location, owner } = req.body

  const errors: string[] = []

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    errors.push("Name must be at least 3 characters long")
  }

  if (!description || typeof description !== "string" || description.trim().length < 10) {
    errors.push("Description must be at least 10 characters long")
  }

  if (!commodityType || typeof commodityType !== "string") {
    errors.push("Commodity type is required")
  }

  if (!quantity || isNaN(Number.parseInt(quantity)) || Number.parseInt(quantity) <= 0) {
    errors.push("Quantity must be a positive number")
  }

  if (!unit || typeof unit !== "string") {
    errors.push("Unit is required")
  }

  if (!quality || typeof quality !== "string") {
    errors.push("Quality is required")
  }

  if (!location || typeof location !== "string") {
    errors.push("Location is required")
  }

  if (!owner || typeof owner !== "string") {
    errors.push("Owner is required")
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors })
  }

  next()
}

export const validateAuctionData = (req: Request, res: Response, next: NextFunction) => {
  const { nftContract, tokenId, reservePrice, startTime, endTime, currency } = req.body

  const errors: string[] = []

  if (!nftContract || typeof nftContract !== "string") {
    errors.push("NFT contract address is required")
  }

  if (!tokenId || isNaN(Number.parseInt(tokenId))) {
    errors.push("Valid token ID is required")
  }

  if (!reservePrice || isNaN(Number.parseFloat(reservePrice)) || Number.parseFloat(reservePrice) <= 0) {
    errors.push("Reserve price must be a positive number")
  }

  if (!startTime || isNaN(Number.parseInt(startTime))) {
    errors.push("Valid start time is required")
  }

  if (!endTime || isNaN(Number.parseInt(endTime))) {
    errors.push("Valid end time is required")
  }

  if (Number.parseInt(startTime) >= Number.parseInt(endTime)) {
    errors.push("End time must be after start time")
  }

  if (Number.parseInt(startTime) < Math.floor(Date.now() / 1000)) {
    errors.push("Start time cannot be in the past")
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors })
  }

  next()
}
