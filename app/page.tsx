"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Gavel, Shield, Zap, Globe, TrendingUp, Wallet } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { WalletConnect } from "@/components/wallet-connect"
import { useWallet } from "@/hooks/use-wallet"
import Link from "next/link"

export default function HomePage() {
  const { isConnected, address } = useWallet()

  return (
    <div className="min-h-screen relative">
      {/* Crystal Glass Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/crystal-glass-whisk-bg.jpg)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px]"></div>
      </div>
      
      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <Badge className="mb-4 bg-white/60 backdrop-blur-sm border border-white/30 text-blue-700 shadow-lg" variant="secondary">
              <Zap className="w-3 h-3 mr-1" />
              Powered by Blockchain & AI
            </Badge>
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent drop-shadow-lg">
                The Smarter , AI Powerd , Decentralized
              </span>
              <span className="text-primary block drop-shadow-lg">B2B Marketplace and auction</span>
            </h2>
            <p className="text-xl text-gray-800 mb-8 max-w-3xl mx-auto drop-shadow-md bg-white/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              Trade commodities with confidence through our blockchain-secured marketplace. Real-world asset tokenization,
              transparent auctions, and AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isConnected ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 shadow-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <WalletConnect />
              )}
              <Link href="/signup">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/80 backdrop-blur-md border-white/30 hover:bg-white/90 shadow-lg">
                  Sign Up Business
                </Button>
              </Link>
              <Link href="/auctions">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/80 backdrop-blur-md border-white/30 hover:bg-white/90 shadow-lg">
                  <Gavel className="w-5 h-5 mr-2" />
                  View Auctions
                </Button>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
              type="text"
              placeholder="Search commodities, minerals, agricultural products..."
              className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-md border border-white/30 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-ring shadow-lg"
            />
            <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 shadow-lg">Search</Button>
          </div>
        </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-serif font-bold text-gray-900 mb-4 drop-shadow-lg">Why Choose TraceTrade?</h3>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
                Advanced technology meets traditional trading for unprecedented transparency and efficiency
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-white/80 backdrop-blur-md border border-white/30 hover:shadow-2xl transition-all duration-300 shadow-xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-50/80 border border-blue-200/50 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="font-serif text-gray-900">Blockchain Security</CardTitle>
                  <CardDescription className="text-gray-600">
                    Every transaction secured by Hedera blockchain with immutable audit trails
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-white/80 backdrop-blur-md border border-white/30 hover:shadow-2xl transition-all duration-300 shadow-xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-50/80 border border-green-200/50 rounded-lg flex items-center justify-center mb-4">
                    <Gavel className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="font-serif text-gray-900">Smart Auctions</CardTitle>
                  <CardDescription className="text-gray-600">
                    AI-powered auctioneer with transparent bidding and automated settlements
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-white/80 backdrop-blur-md border border-white/30 hover:shadow-2xl transition-all duration-300 shadow-xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-50/80 border border-purple-200/50 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="font-serif text-gray-900">Asset Tokenization</CardTitle>
                  <CardDescription className="text-gray-600">
                    Convert real-world commodities into tradeable digital assets with NFT certificates
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Active Auctions Preview */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-serif font-bold text-gray-900 drop-shadow-lg">Live Auctions</h3>
              <Link href="/auctions">
                <Button variant="outline" className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white/90 shadow-lg">View All Auctions</Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Premium Copper Ore",
                description: "100 tons, Grade 25%",
                currentBid: "$2,450,000",
                timeLeft: "2h 34m",
                bids: 12,
              },
              {
                title: "Organic Cocoa Beans",
                description: "50 tons, Fair Trade Certified",
                currentBid: "$1,890,000",
                timeLeft: "5h 12m",
                bids: 8,
              },
              {
                title: "Industrial Generator",
                description: "500kW Diesel Generator",
                currentBid: "$3,200,000",
                timeLeft: "1d 3h",
                bids: 15,
              },
            ].map((auction, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-md border border-white/30 hover:shadow-2xl transition-all duration-300 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs bg-blue-50/80 text-blue-700 border-blue-200/50">
                      Live Auction
                    </Badge>
                    <span className="text-sm text-gray-600">{auction.bids} bids</span>
                  </div>
                  <CardTitle className="font-serif text-gray-900">{auction.title}</CardTitle>
                  <CardDescription className="text-gray-600">{auction.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Bid</p>
                      <p className="text-2xl font-bold text-green-600">{auction.currentBid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Time Left</p>
                      <p className="text-lg font-semibold text-gray-900">{auction.timeLeft}</p>
                    </div>
                  </div>
                  <Button className="w-full shadow-lg" disabled={!isConnected}>
                    <Gavel className="w-4 h-4 mr-2" />
                    {isConnected ? 'Place Bid' : 'Connect Wallet to Bid'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </section>

        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-md border-t border-white/30 py-12 px-4 shadow-xl">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                <span className="font-serif font-bold text-foreground">TraceTrade</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Empowering African businesses through blockchain-secured B2B trading.
              </p>
            </div>
            <div>
              <h4 className="font-serif font-semibold text-foreground mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Marketplace
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Auctions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Tokenization
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    AI Tools
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-semibold text-foreground mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 TraceTrade. All rights reserved. Powered by Hedera blockchain technology.</p>
          </div>
        </div>
        </footer>
      </div>
    </div>
  )
}
