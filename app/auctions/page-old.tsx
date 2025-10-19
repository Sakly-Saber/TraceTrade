import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Gavel, Clock, Users, TrendingUp, Eye } from "lucide-react"
import { NewsStream } from "@/components/news-stream"
import { CommodityPriceTicker } from "@/components/commodity-price-ticker"
import { AuctionStatsBar } from "@/components/auction-stats"
import { Navigation } from "@/components/navigation"

export default function AuctionsPage() {
  const auctions = [
    {
      id: 1,
      title: "Premium Copper Ore Lot #001",
      description: "100 tons of high-grade copper ore, 25% purity, certified by geological survey",
      currentBid: "$2,450,000",
      reservePrice: "$2,000,000",
      timeLeft: "2h 34m 12s",
      totalBids: 12,
      watchers: 45,
      progress: 85,
      status: "live",
      image: "/copper-ore-auction-lot.png",
    },
    {
      id: 2,
      title: "Organic Cocoa Beans - Fair Trade",
      description: "50 tons of premium organic cocoa beans, fair trade certified",
      currentBid: "$1,890,000",
      reservePrice: "$1,500,000",
      timeLeft: "5h 12m 45s",
      totalBids: 8,
      watchers: 32,
      progress: 65,
      status: "live",
      image: "/cocoa-beans-auction.png",
    },
    {
      id: 3,
      title: "Industrial Generator 500kW",
      description: "Heavy-duty diesel generator, low operating hours, full maintenance records",
      currentBid: "$3,200,000",
      reservePrice: "$2,800,000",
      timeLeft: "1d 3h 22m",
      totalBids: 15,
      watchers: 67,
      progress: 92,
      status: "live",
      image: "/industrial-generator-auction.png",
    },
    {
      id: 4,
      title: "Gold Ore Mining Rights",
      description: "Exclusive mining rights for gold ore extraction, 5-year lease",
      currentBid: "$0",
      reservePrice: "$5,000,000",
      timeLeft: "Starting in 2h",
      totalBids: 0,
      watchers: 89,
      progress: 0,
      status: "upcoming",
      image: "/gold-mining-rights.png",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Glassmorphic overlay background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 via-transparent to-purple-200/20"></div>
      <div className="relative z-10">
        {/* Navigation */}
        <Navigation />
        
        {/* Page Header with Slogan */}
        <div className="border-b border-white/30 bg-white/40 backdrop-blur-md">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Live Auctions</h1>
                <p className="text-muted-foreground text-lg">Transparent bidding powered by blockchain</p>
              </div>
              <Button size="lg" className="bg-white/80 backdrop-blur-md border border-white/30 hover:bg-white/90 shadow-lg text-primary hover:text-primary">
                Create Auction
              </Button>
            </div>
          </div>
        </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dynamic Stats Bar */}
        <AuctionStatsBar />

        {/* Commodity Price Ticker */}
        <CommodityPriceTicker />

        {/* Main Content with Sidebar Layout */}
        <div className="flex gap-6 mt-8">
          {/* Main Auction Grid */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">{auctions.map((auction) => (
            <Card key={auction.id} className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="aspect-video bg-gradient-to-br from-gray-100/50 to-gray-200/50 rounded-t-lg overflow-hidden relative">
                <img
                  src={auction.image || "/placeholder.svg"}
                  alt={auction.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge
                  className={`absolute top-3 left-3 backdrop-blur-sm ${
                    auction.status === "live"
                      ? "bg-red-500/90 text-white"
                      : auction.status === "upcoming"
                        ? "bg-blue-500/90 text-white"
                        : "bg-gray-500/90 text-white"
                  }`}
                >
                  {auction.status === "live" ? "LIVE" : "UPCOMING"}
                </Badge>
                <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                  <Eye className="w-3 h-3 text-white" />
                  <span className="text-xs text-white">{auction.watchers}</span>
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg">{auction.title}</CardTitle>
                <CardDescription className="text-sm">{auction.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bidding Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Reserve: {auction.reservePrice}</span>
                    <span className="text-muted-foreground">{auction.progress}%</span>
                  </div>
                  <Progress value={auction.progress} className="h-2" />
                </div>

                {/* Current Bid */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Bid</p>
                    <p className="text-2xl font-bold text-primary">
                      {auction.currentBid === "$0" ? "No bids yet" : auction.currentBid}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Time Left</p>
                    <p className="text-lg font-semibold text-foreground">{auction.timeLeft}</p>
                  </div>
                </div>

                {/* Bid Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{auction.totalBids} bids</span>
                  <span>{auction.watchers} watching</span>
                </div>

                {/* Action Button */}
                <Button className="w-full bg-primary/90 backdrop-blur-sm hover:bg-primary shadow-lg" disabled={auction.status === "upcoming"}>
                  <Gavel className="w-4 h-4 mr-2" />
                  {auction.status === "upcoming" ? "Auction Starting Soon" : "Place Bid"}
                </Button>
              </CardContent>
            </Card>
          ))}
            </div>
          </div>

          {/* Right Sidebar with Live Activity */}
          <div className="w-96 h-screen sticky top-0">
            <NewsStream />
          </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="bg-white/80 backdrop-blur-md border border-white/30 hover:bg-white/90 shadow-lg">
            Load More Auctions
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}
