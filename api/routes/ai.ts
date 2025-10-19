import { Router } from "express"
import { aiAuctioneer, aiTreasurer } from "../../lib/ai-services"
import { validateRequest } from "../middleware/validation"
import { z } from "zod"

const router = Router()

// Market analysis endpoint
const marketAnalysisSchema = z.object({
  commodity: z.string().min(1),
  quantity: z.number().positive(),
  grade: z.string().optional(),
})

router.post("/market-analysis", validateRequest(marketAnalysisSchema), async (req, res) => {
  try {
    const { commodity, quantity, grade } = req.body

    const analysis = await aiAuctioneer.analyzeMarket(commodity, quantity, grade)

    res.json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    console.error("Market analysis error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to analyze market",
    })
  }
})

// Bid analysis endpoint
const bidAnalysisSchema = z.object({
  bidAmount: z.number().positive(),
  bidderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  auctionData: z.object({
    currentBid: z.string(),
    reservePrice: z.string(),
    endTime: z.number(),
    bids: z.number(),
  }),
})

router.post("/bid-analysis", validateRequest(bidAnalysisSchema), async (req, res) => {
  try {
    const { bidAmount, bidderAddress, auctionData } = req.body

    const analysis = await aiAuctioneer.analyzeBid(bidAmount, bidderAddress, auctionData)

    res.json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    console.error("Bid analysis error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to analyze bid",
    })
  }
})

// Treasury insights endpoint
const treasuryInsightsSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  activeAuctions: z.array(z.any()).optional().default([]),
  bidHistory: z.array(z.any()).optional().default([]),
})

router.post("/treasury-insights", validateRequest(treasuryInsightsSchema), async (req, res) => {
  try {
    const { walletAddress, activeAuctions, bidHistory } = req.body

    const insights = await aiTreasurer.analyzeTreasury(walletAddress, activeAuctions, bidHistory)

    res.json({
      success: true,
      data: insights,
    })
  } catch (error) {
    console.error("Treasury insights error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to analyze treasury",
    })
  }
})

// Payment optimization endpoint
const paymentOptimizationSchema = z.object({
  auctionValue: z.number().positive(),
  paymentOptions: z.array(z.string()).min(1),
})

router.post("/payment-optimization", validateRequest(paymentOptimizationSchema), async (req, res) => {
  try {
    const { auctionValue, paymentOptions } = req.body

    const optimization = await aiTreasurer.optimizePaymentStrategy(auctionValue, paymentOptions)

    res.json({
      success: true,
      data: optimization,
    })
  } catch (error) {
    console.error("Payment optimization error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to optimize payment strategy",
    })
  }
})

// AI recommendations for auction creation
router.post("/auction-recommendations", async (req, res) => {
  try {
    const { commodity, quantity, grade, targetMarket } = req.body

    // Generate comprehensive auction recommendations
    const marketAnalysis = await aiAuctioneer.analyzeMarket(commodity, quantity, grade)

    const recommendations = {
      pricing: {
        recommendedReserve: marketAnalysis.recommendedReservePrice,
        priceRange: marketAnalysis.priceRange,
        confidence: marketAnalysis.confidence,
      },
      timing: {
        optimalDuration: "7 days",
        bestStartTime: "Monday 9:00 AM WAT",
        reasoning: "Peak trading hours for African commodities",
      },
      marketing: {
        targetAudience: ["Mining companies", "Export traders", "Industrial manufacturers"],
        keySellingPoints: marketAnalysis.factors,
        suggestedCategories: ["Minerals", "Raw Materials", "Export Grade"],
      },
      riskFactors: [
        "Market volatility in copper prices",
        "Seasonal demand fluctuations",
        "Currency exchange rate impacts",
      ],
    }

    res.json({
      success: true,
      data: recommendations,
    })
  } catch (error) {
    console.error("Auction recommendations error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate auction recommendations",
    })
  }
})

export default router
