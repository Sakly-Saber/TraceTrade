export interface MarketAnalysis {
  recommendedReservePrice: number
  priceRange: { min: number; max: number }
  marketTrend: "bullish" | "bearish" | "neutral"
  confidence: number
  factors: string[]
  historicalData: {
    averagePrice: number
    volume: number
    transactions: number
  }
}

export interface BidAnalysis {
  isSuspicious: boolean
  riskLevel: "low" | "medium" | "high"
  reasons: string[]
  recommendation: "approve" | "flag" | "reject"
  bidderReputation: number
}

export interface TreasuryInsights {
  cashFlow: {
    incoming: number
    outgoing: number
    net: number
  }
  riskAssessment: {
    level: "low" | "medium" | "high"
    factors: string[]
  }
  recommendations: string[]
  optimalBidAmount: number
}

class AIAuctioneer {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_AI_API_KEY || ""
  }

  async analyzeMarket(commodity: string, quantity: number, grade?: string): Promise<MarketAnalysis> {
    // Simulate AI market analysis
    const basePrice = this.getBasePriceForCommodity(commodity)
    const qualityMultiplier = this.getQualityMultiplier(grade)
    const marketConditions = await this.getMarketConditions(commodity)

    const recommendedPrice = basePrice * quantity * qualityMultiplier * marketConditions.trendMultiplier

    return {
      recommendedReservePrice: Math.round(recommendedPrice),
      priceRange: {
        min: Math.round(recommendedPrice * 0.8),
        max: Math.round(recommendedPrice * 1.3),
      },
      marketTrend: marketConditions.trend,
      confidence: 0.85,
      factors: [
        `Current ${commodity} market is ${marketConditions.trend}`,
        `Quality grade ${grade || "standard"} affects pricing`,
        `Quantity ${quantity} tons influences bulk pricing`,
        "Regional demand is stable",
        "Supply chain conditions are favorable",
      ],
      historicalData: {
        averagePrice: Math.round(basePrice * 0.9),
        volume: 1250,
        transactions: 45,
      },
    }
  }

  async analyzeBid(bidAmount: number, bidderAddress: string, auctionData: any): Promise<BidAnalysis> {
    const currentBid = Number.parseFloat(auctionData.currentBid || "0")
    const reservePrice = Number.parseFloat(auctionData.reservePrice || "0")

    // Analyze bid patterns
    const bidIncrease = bidAmount - currentBid
    const bidToReserveRatio = bidAmount / reservePrice

    let isSuspicious = false
    let riskLevel: "low" | "medium" | "high" = "low"
    const reasons: string[] = []

    // Suspicious bid detection logic
    if (bidIncrease > currentBid * 2) {
      isSuspicious = true
      riskLevel = "high"
      reasons.push("Unusually large bid increase")
    }

    if (bidToReserveRatio > 5) {
      isSuspicious = true
      riskLevel = "medium"
      reasons.push("Bid significantly exceeds market value")
    }

    // Mock bidder reputation (in real implementation, would check on-chain history)
    const bidderReputation = this.calculateBidderReputation(bidderAddress)

    if (bidderReputation < 0.3) {
      riskLevel = "medium"
      reasons.push("New or low-reputation bidder")
    }

    return {
      isSuspicious,
      riskLevel,
      reasons,
      recommendation: isSuspicious ? "flag" : "approve",
      bidderReputation,
    }
  }

  private getBasePriceForCommodity(commodity: string): number {
    const prices: Record<string, number> = {
      copper: 8500,
      cocoa: 3200,
      gold: 65000,
      oil: 85,
      generator: 15000,
      machinery: 25000,
    }

    const key = commodity.toLowerCase()
    for (const [k, v] of Object.entries(prices)) {
      if (key.includes(k)) return v
    }
    return 5000 // default
  }

  private getQualityMultiplier(grade?: string): number {
    if (!grade) return 1.0

    const gradeMultipliers: Record<string, number> = {
      premium: 1.3,
      high: 1.2,
      standard: 1.0,
      low: 0.8,
    }

    const key = grade.toLowerCase()
    return gradeMultipliers[key] || 1.0
  }

  private async getMarketConditions(commodity: string) {
    // Simulate market condition analysis
    const trends: Array<"bullish" | "bearish" | "neutral"> = ["bullish", "neutral", "bearish"]
    const trend = trends[Math.floor(Math.random() * trends.length)]

    const trendMultipliers = {
      bullish: 1.15,
      neutral: 1.0,
      bearish: 0.9,
    }

    return {
      trend,
      trendMultiplier: trendMultipliers[trend],
    }
  }

  private calculateBidderReputation(address: string): number {
    // Mock reputation calculation (would use on-chain data in production)
    const hash = address.slice(-4)
    const num = Number.parseInt(hash, 16)
    return Math.min(0.3 + (num / 65535) * 0.7, 1.0)
  }
}

class AITreasurer {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_AI_API_KEY || ""
  }

  async analyzeTreasury(walletAddress: string, activeAuctions: any[], bidHistory: any[]): Promise<TreasuryInsights> {
    // Calculate cash flow
    const incoming = this.calculateIncoming(activeAuctions)
    const outgoing = this.calculateOutgoing(bidHistory)

    // Risk assessment
    const riskFactors = this.assessRisks(activeAuctions, bidHistory)

    // Generate recommendations
    const recommendations = this.generateRecommendations(incoming, outgoing, riskFactors)

    return {
      cashFlow: {
        incoming,
        outgoing,
        net: incoming - outgoing,
      },
      riskAssessment: {
        level: riskFactors.level,
        factors: riskFactors.factors,
      },
      recommendations,
      optimalBidAmount: this.calculateOptimalBidAmount(incoming, outgoing),
    }
  }

  async optimizePaymentStrategy(
    auctionValue: number,
    paymentOptions: string[],
  ): Promise<{
    recommendedOption: string
    savings: number
    reasoning: string[]
  }> {
    // Analyze payment options and recommend optimal strategy
    const analysis = paymentOptions.map((option) => ({
      option,
      cost: this.calculatePaymentCost(auctionValue, option),
      benefits: this.getPaymentBenefits(option),
    }))

    const optimal = analysis.reduce((best, current) => (current.cost < best.cost ? current : best))

    const baseline = analysis.find((a) => a.option === "standard") || analysis[0]

    return {
      recommendedOption: optimal.option,
      savings: baseline.cost - optimal.cost,
      reasoning: [
        `${optimal.option} offers the lowest transaction costs`,
        `Estimated savings: ${(((baseline.cost - optimal.cost) / baseline.cost) * 100).toFixed(1)}%`,
        ...optimal.benefits,
      ],
    }
  }

  private calculateIncoming(auctions: any[]): number {
    return auctions.filter((a) => a.status === "won").reduce((sum, a) => sum + Number.parseFloat(a.finalBid || "0"), 0)
  }

  private calculateOutgoing(bidHistory: any[]): number {
    return bidHistory
      .filter((b) => b.status === "active")
      .reduce((sum, b) => sum + Number.parseFloat(b.amount || "0"), 0)
  }

  private assessRisks(auctions: any[], bidHistory: any[]) {
    const factors: string[] = []
    let level: "low" | "medium" | "high" = "low"

    const totalExposure = bidHistory.reduce((sum, b) => sum + Number.parseFloat(b.amount || "0"), 0)
    const activeAuctions = auctions.filter((a) => a.status === "active").length

    if (totalExposure > 1000000) {
      level = "high"
      factors.push("High total bid exposure")
    }

    if (activeAuctions > 10) {
      level = level === "high" ? "high" : "medium"
      factors.push("Many active auctions")
    }

    if (factors.length === 0) {
      factors.push("Portfolio is well-balanced")
    }

    return { level, factors }
  }

  private generateRecommendations(incoming: number, outgoing: number, risks: any): string[] {
    const recommendations: string[] = []

    if (outgoing > incoming * 1.5) {
      recommendations.push("Consider reducing bid amounts to improve cash flow")
    }

    if (risks.level === "high") {
      recommendations.push("Diversify auction participation to reduce risk")
    }

    if (incoming > outgoing * 2) {
      recommendations.push("Strong cash position - consider increasing bid activity")
    }

    recommendations.push("Monitor market trends for optimal timing")

    return recommendations
  }

  private calculateOptimalBidAmount(incoming: number, outgoing: number): number {
    const netCashFlow = incoming - outgoing
    const riskTolerance = 0.3 // 30% of available funds

    return Math.max(netCashFlow * riskTolerance, 10000)
  }

  private calculatePaymentCost(amount: number, option: string): number {
    const fees: Record<string, number> = {
      standard: amount * 0.025,
      express: amount * 0.035,
      crypto: amount * 0.015,
      bank_transfer: amount * 0.01,
    }

    return fees[option] || fees["standard"]
  }

  private getPaymentBenefits(option: string): string[] {
    const benefits: Record<string, string[]> = {
      crypto: ["Faster settlement", "Lower fees", "Transparent on-chain"],
      bank_transfer: ["Traditional method", "Widely accepted"],
      express: ["Immediate processing", "Priority support"],
      standard: ["Reliable", "Most common option"],
    }

    return benefits[option] || []
  }
}

// Export singleton instances
export const aiAuctioneer = new AIAuctioneer()
export const aiTreasurer = new AITreasurer()

// Utility functions for AI integration
export const formatCurrency = (amount: number, currency = "HBAR"): string => {
  // For HBAR, format with ℏ symbol and up to 4 decimal places
  if (currency === "HBAR") {
    return `ℏ${amount.toLocaleString("en-US", { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 4 
    })}`
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}
