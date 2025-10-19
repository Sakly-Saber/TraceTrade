"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  aiAuctioneer,
  aiTreasurer,
  formatCurrency,
  formatPercentage,
  type MarketAnalysis,
  type TreasuryInsights,
} from "@/lib/ai-services"
import { Brain, TrendingUp, Shield, DollarSign, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react"

interface AIInsightsProps {
  commodity?: string
  quantity?: number
  grade?: string
  walletAddress?: string
  auctionData?: any
}

export function AIInsights({ commodity, quantity, grade, walletAddress, auctionData }: AIInsightsProps) {
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null)
  const [treasuryInsights, setTreasuryInsights] = useState<TreasuryInsights | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (commodity && quantity) {
      loadMarketAnalysis()
    }
    if (walletAddress) {
      loadTreasuryInsights()
    }
  }, [commodity, quantity, grade, walletAddress])

  const loadMarketAnalysis = async () => {
    if (!commodity || !quantity) return

    setLoading(true)
    try {
      const analysis = await aiAuctioneer.analyzeMarket(commodity, quantity, grade)
      setMarketAnalysis(analysis)
    } catch (error) {
      console.error("Failed to load market analysis:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTreasuryInsights = async () => {
    if (!walletAddress) return

    try {
      // Mock data for treasury analysis
      const insights = await aiTreasurer.analyzeTreasury(walletAddress, [], [])
      setTreasuryInsights(insights)
    } catch (error) {
      console.error("Failed to load treasury insights:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-serif font-semibold">AI Insights</h2>
        <Badge variant="secondary">Powered by AI</Badge>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="market" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Analysis
          </TabsTrigger>
          <TabsTrigger value="treasury" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Treasury Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-4">
          {marketAnalysis ? (
            <>
              {/* Price Recommendation */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Price Recommendation
                  </CardTitle>
                  <CardDescription>AI-powered market analysis for {commodity}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">Recommended Reserve</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(marketAnalysis.recommendedReservePrice)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Price Range</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(marketAnalysis.priceRange.min)} -{" "}
                        {formatCurrency(marketAnalysis.priceRange.max)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Market Trend</p>
                      <Badge
                        variant={
                          marketAnalysis.marketTrend === "bullish"
                            ? "default"
                            : marketAnalysis.marketTrend === "bearish"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {marketAnalysis.marketTrend.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Confidence Level</span>
                      <span className="text-sm text-muted-foreground">
                        {formatPercentage(marketAnalysis.confidence)}
                      </span>
                    </div>
                    <Progress value={marketAnalysis.confidence * 100} className="h-2" />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Market Factors</h4>
                    <ul className="space-y-1">
                      {marketAnalysis.factors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Historical Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatCurrency(marketAnalysis.historicalData.averagePrice)}</p>
                      <p className="text-sm text-muted-foreground">Average Price</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{marketAnalysis.historicalData.volume}</p>
                      <p className="text-sm text-muted-foreground">Volume (tons)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{marketAnalysis.historicalData.transactions}</p>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {loading ? "Analyzing market data..." : "Provide commodity details to get AI market analysis"}
                  </p>
                  {!loading && commodity && quantity && (
                    <Button onClick={loadMarketAnalysis} className="mt-4">
                      Analyze Market
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="treasury" className="space-y-4">
          {treasuryInsights ? (
            <>
              {/* Cash Flow Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cash Flow Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Incoming</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(treasuryInsights.cashFlow.incoming)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Outgoing</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(treasuryInsights.cashFlow.outgoing)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">Net Flow</p>
                      <p
                        className={`text-2xl font-bold ${
                          treasuryInsights.cashFlow.net >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(treasuryInsights.cashFlow.net)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        treasuryInsights.riskAssessment.level === "low"
                          ? "default"
                          : treasuryInsights.riskAssessment.level === "medium"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {treasuryInsights.riskAssessment.level.toUpperCase()} RISK
                    </Badge>
                  </div>

                  <ul className="space-y-2">
                    {treasuryInsights.riskAssessment.factors.map((factor, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Optimal Bid Amount</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(treasuryInsights.optimalBidAmount)}
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {treasuryInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Connect your wallet to get AI treasury insights</p>
                  {walletAddress && (
                    <Button onClick={loadTreasuryInsights} className="mt-4">
                      Analyze Treasury
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
