import { Router } from "express"
import { getAuctionHouseContract } from "../../lib/blockchain"
import { ethers } from "ethers"

const router = Router()

/**
 * GET /api/auctions - Get all auctions
 */
router.get("/", async (req, res) => {
  try {
    const { status, seller, limit = "20", offset = "0" } = req.query

    const contract = await getAuctionHouseContract()
    const auctionCount = await contract.auctionCount()

    const auctions = []
    const limitNum = Number.parseInt(limit as string)
    const offsetNum = Number.parseInt(offset as string)

    // Fetch auctions with pagination
    const startId = Math.max(1, auctionCount.toNumber() - offsetNum - limitNum + 1)
    const endId = Math.min(auctionCount.toNumber(), auctionCount.toNumber() - offsetNum)

    for (let i = endId; i >= startId; i--) {
      try {
        const auction = await contract.getAuction(i)
        const currentTime = Math.floor(Date.now() / 1000)

        // Determine auction status
        let auctionStatus = "upcoming"
        if (currentTime >= auction.startTime.toNumber()) {
          if (currentTime < auction.endTime.toNumber()) {
            auctionStatus = "live"
          } else if (auction.settled) {
            auctionStatus = "settled"
          } else {
            auctionStatus = "ended"
          }
        }

        // Apply status filter
        if (status && auctionStatus !== status) {
          continue
        }

        // Apply seller filter
        if (seller && auction.seller.toLowerCase() !== (seller as string).toLowerCase()) {
          continue
        }

        auctions.push({
          id: i,
          ...auction,
          status: auctionStatus,
          timeLeft: Math.max(0, auction.endTime.toNumber() - currentTime),
          reservePrice: ethers.utils.formatEther(auction.reservePrice),
          highestBid: ethers.utils.formatEther(auction.highestBid),
          startTime: auction.startTime.toNumber(),
          endTime: auction.endTime.toNumber(),
        })
      } catch (error) {
        console.error(`Error fetching auction ${i}:`, error)
      }
    }

    res.json({
      auctions,
      total: auctionCount.toNumber(),
      limit: limitNum,
      offset: offsetNum,
    })
  } catch (error) {
    console.error("Error fetching auctions:", error)
    res.status(500).json({ error: "Failed to fetch auctions" })
  }
})

/**
 * GET /api/auctions/:id - Get specific auction
 */
router.get("/:id", async (req, res) => {
  try {
    const auctionId = Number.parseInt(req.params.id)

    if (isNaN(auctionId) || auctionId < 1) {
      return res.status(400).json({ error: "Invalid auction ID" })
    }

    const contract = await getAuctionHouseContract()
    const auction = await contract.getAuction(auctionId)
    const bids = await contract.getBids(auctionId)

    const currentTime = Math.floor(Date.now() / 1000)

    // Determine auction status
    let status = "upcoming"
    if (currentTime >= auction.startTime.toNumber()) {
      if (currentTime < auction.endTime.toNumber()) {
        status = "live"
      } else if (auction.settled) {
        status = "settled"
      } else {
        status = "ended"
      }
    }

    const formattedAuction = {
      id: auctionId,
      seller: auction.seller,
      nftContract: auction.nftContract,
      tokenId: auction.tokenId.toString(),
      currency: auction.currency,
      reservePrice: ethers.utils.formatEther(auction.reservePrice),
      startTime: auction.startTime.toNumber(),
      endTime: auction.endTime.toNumber(),
      settled: auction.settled,
      highestBidder: auction.highestBidder,
      highestBid: ethers.utils.formatEther(auction.highestBid),
      feeBps: auction.feeBps,
      metadataURI: auction.metadataURI,
      status,
      timeLeft: Math.max(0, auction.endTime.toNumber() - currentTime),
      bids: bids.map((bid: any) => ({
        bidder: bid.bidder,
        amount: ethers.utils.formatEther(bid.amount),
        timestamp: bid.timestamp.toNumber(),
        txHash: bid.txHash,
      })),
    }

    res.json(formattedAuction)
  } catch (error) {
    console.error("Error fetching auction:", error)
    res.status(500).json({ error: "Failed to fetch auction" })
  }
})

/**
 * GET /api/auctions/:id/bids - Get auction bid history
 */
router.get("/:id/bids", async (req, res) => {
  try {
    const auctionId = Number.parseInt(req.params.id)

    if (isNaN(auctionId) || auctionId < 1) {
      return res.status(400).json({ error: "Invalid auction ID" })
    }

    const contract = await getAuctionHouseContract()
    const bids = await contract.getBids(auctionId)

    const formattedBids = bids.map((bid: any) => ({
      bidder: bid.bidder,
      amount: ethers.utils.formatEther(bid.amount),
      timestamp: bid.timestamp.toNumber(),
      txHash: bid.txHash,
      date: new Date(bid.timestamp.toNumber() * 1000).toISOString(),
    }))

    res.json({
      auctionId,
      bids: formattedBids,
      totalBids: formattedBids.length,
    })
  } catch (error) {
    console.error("Error fetching auction bids:", error)
    res.status(500).json({ error: "Failed to fetch auction bids" })
  }
})

/**
 * GET /api/auctions/live - Get only live auctions
 */
router.get("/live", async (req, res) => {
  try {
    const contract = await getAuctionHouseContract()
    const auctionCount = await contract.auctionCount()
    const currentTime = Math.floor(Date.now() / 1000)

    const liveAuctions = []

    for (let i = 1; i <= auctionCount.toNumber(); i++) {
      try {
        const auction = await contract.getAuction(i)

        // Check if auction is live
        if (
          currentTime >= auction.startTime.toNumber() &&
          currentTime < auction.endTime.toNumber() &&
          !auction.settled
        ) {
          liveAuctions.push({
            id: i,
            seller: auction.seller,
            nftContract: auction.nftContract,
            tokenId: auction.tokenId.toString(),
            currency: auction.currency,
            reservePrice: ethers.utils.formatEther(auction.reservePrice),
            highestBid: ethers.utils.formatEther(auction.highestBid),
            highestBidder: auction.highestBidder,
            endTime: auction.endTime.toNumber(),
            timeLeft: auction.endTime.toNumber() - currentTime,
            metadataURI: auction.metadataURI,
            status: "live",
          })
        }
      } catch (error) {
        console.error(`Error fetching auction ${i}:`, error)
      }
    }

    // Sort by time left (ending soonest first)
    liveAuctions.sort((a, b) => a.timeLeft - b.timeLeft)

    res.json({
      auctions: liveAuctions,
      count: liveAuctions.length,
    })
  } catch (error) {
    console.error("Error fetching live auctions:", error)
    res.status(500).json({ error: "Failed to fetch live auctions" })
  }
})

/**
 * GET /api/auctions/stats - Get auction statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const contract = await getAuctionHouseContract()
    const auctionCount = await contract.auctionCount()
    const currentTime = Math.floor(Date.now() / 1000)

    let totalVolume = ethers.BigNumber.from(0)
    let liveCount = 0
    let settledCount = 0
    let upcomingCount = 0
    let endedCount = 0

    for (let i = 1; i <= auctionCount.toNumber(); i++) {
      try {
        const auction = await contract.getAuction(i)

        // Add to volume if settled
        if (auction.settled && auction.highestBid.gt(0)) {
          totalVolume = totalVolume.add(auction.highestBid)
          settledCount++
        }

        // Count by status
        if (currentTime < auction.startTime.toNumber()) {
          upcomingCount++
        } else if (currentTime < auction.endTime.toNumber() && !auction.settled) {
          liveCount++
        } else if (!auction.settled) {
          endedCount++
        }
      } catch (error) {
        console.error(`Error processing auction ${i} for stats:`, error)
      }
    }

    res.json({
      totalAuctions: auctionCount.toNumber(),
      liveAuctions: liveCount,
      settledAuctions: settledCount,
      upcomingAuctions: upcomingCount,
      endedAuctions: endedCount,
      totalVolume: ethers.utils.formatEther(totalVolume),
      averageValue: settledCount > 0 ? ethers.utils.formatEther(totalVolume.div(settledCount)) : "0",
    })
  } catch (error) {
    console.error("Error fetching auction stats:", error)
    res.status(500).json({ error: "Failed to fetch auction stats" })
  }
})

export { router as auctionsRouter }
