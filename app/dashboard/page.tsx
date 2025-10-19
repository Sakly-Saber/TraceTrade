"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { NFTCollection } from "@/components/nft-collection"
import { ProtectedRoute } from "@/components/protected-route"
import { useWallet } from "@/hooks/use-wallet"
import { useAuth } from "@/contexts/auth-context"
import { 
  RefreshCw, 
  Wallet, 
  TrendingUp, 
  Gavel, 
  DollarSign, 
  Award, 
  Activity,
  Eye,
  Clock,
  Trophy,
  Sparkles,
  Users,
  BarChart3,
  Crown
} from "lucide-react"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const { 
    address, 
    isConnected, 
    connect, 
    balance, 
    isLoadingBalance, 
    nfts, 
    isLoadingNFTs,
    refreshWalletData,
    walletType 
  } = useWallet()
  
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalVolume: "0.0000",
  })

  // Mock data for user's auctions and bids
  const userAuctions = [
    {
      id: 1,
      title: "Premium Copper Ore Lot #001",
      status: "live",
      currentBid: "ℏ2,450",
      timeLeft: "2h 34m",
      bids: 12,
      created: "2024-01-15",
    },
    {
      id: 2,
      title: "Industrial Generator 500kW",
      status: "ended",
      finalBid: "ℏ3,200",
      winner: "0x1234...5678",
      bids: 15,
      created: "2024-01-10",
    },
  ]

  const userBids = [
    {
      auctionId: 3,
      title: "Organic Cocoa Beans",
      bidAmount: "ℏ1,800",
      status: "outbid",
      currentBid: "ℏ1,890",
      timeLeft: "5h 12m",
    },
    {
      auctionId: 4,
      title: "Gold Mining Rights",
      bidAmount: "ℏ4,500",
      status: "winning",
      currentBid: "ℏ4,500",
      timeLeft: "1d 3h",
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative">
        {/* Crystal Glass Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/crystal-glass-whisk-bg.jpg)',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px]"></div>
        </div>
        
        <div className="relative z-10">
          <Navigation />

          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center px-3 py-1.5 bg-white/60 backdrop-blur-sm border border-white/30 text-blue-700 rounded-full text-xs font-medium mb-3 shadow-lg">
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    Premium Dashboard
                  </div>
                  <h1 className="text-3xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent drop-shadow-lg">
                      Welcome Back, {user?.firstName}!
                    </span>
                  </h1>
                  <p className="text-base text-gray-800 max-w-3xl leading-relaxed bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20 shadow-lg">
                    Manage your auctions, track bidding activity, and monitor your digital asset portfolio.
                  </p>
                  {isConnected && (
                    <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-green-50/80 backdrop-blur-sm border border-green-200/50 text-green-700 rounded-full text-xs font-medium shadow-lg">
                      <Wallet className="w-3.5 h-3.5 mr-1.5" />
                      Connected: {address?.slice(0, 6)}...{address?.slice(-4)} ({walletType === 'hashpack' ? 'HashPack' : 'MetaMask'})
                    </div>
                  )}
                </div>
                {isConnected && (
                  <Button 
                    className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white/90 shadow-lg h-9 text-sm"
                    variant="outline" 
                    onClick={() => refreshWalletData()}
                    disabled={isLoadingBalance || isLoadingNFTs}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingBalance || isLoadingNFTs) ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                )}
              </div>
            </div>

            {!isConnected && (
              <Card className="max-w-md mx-auto mb-8 bg-white/80 backdrop-blur-md border border-white/30 shadow-xl">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="font-serif text-gray-900 text-xl">Connect Wallet</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">Connect your wallet to access premium features and start trading</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => connect()} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity shadow-lg" size="lg">
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Gavel className="w-3.5 h-3.5" />
                    Total Auctions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">{stats.totalAuctions}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Active Auctions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">{stats.activeAuctions}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Total Bids
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">{stats.totalBids}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Total Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-300">{stats.totalVolume}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group border-none">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                    {isConnected ? (
                      isLoadingBalance ? (
                        <span className="flex items-center gap-2 text-base">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        `${balance || '0.0000'} HBAR`
                      )
                    ) : (
                      '---'
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NFT Collection Section */}
            {isConnected && (
              <div className="mb-8">
                <NFTCollection 
                  nfts={nfts} 
                  isLoading={isLoadingNFTs} 
                  walletAddress={address}
                  userId={user?.id}
                  onRefresh={refreshWalletData}
                />
              </div>
            )}

            {/* Marketplace Action Cards */}
            {isConnected && (
              <div className="mb-12">
                <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <div className="text-xl">🚀</div>
                        </div>
                        <div>
                          <CardTitle className="font-serif text-gray-900 text-xl">Marketplace Actions</CardTitle>
                          <CardDescription className="text-gray-600">Manage your NFTs and create new opportunities</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 border-0">
                        {nfts?.length || 0} NFTs Available
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Navigate to Marketplace */}
                      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30">
                        <CardContent 
                          className="p-6 text-center"
                          onClick={() => window.location.href = '/marketplace'}
                        >
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform">
                            <div className="text-2xl">🛒</div>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">Explore Marketplace</h3>
                          <p className="text-sm text-muted-foreground mb-4">Browse and discover amazing NFTs from across Africa</p>
                          <Button 
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            Browse Now
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Navigate to Auctions */}
                      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200/30">
                        <CardContent 
                          className="p-6 text-center"
                          onClick={() => window.location.href = '/auctions'}
                        >
                          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform">
                            <div className="text-2xl">⚡</div>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">Live Auctions</h3>
                          <p className="text-sm text-muted-foreground mb-4">Participate in exciting bidding wars and auctions</p>
                          <Button 
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                          >
                            Join Auctions
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Create New NFT */}
                      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/30">
                        <CardContent 
                          className="p-6 text-center"
                          onClick={() => window.location.href = '/tokenization'}
                        >
                          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform">
                            <div className="text-2xl">✨</div>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">Create New NFT</h3>
                          <p className="text-sm text-muted-foreground mb-4">Tokenize new assets and mint fresh NFTs</p>
                          <Button 
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            Create NFT
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Stats Row */}
                    {(nfts && nfts.length > 0) && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-100/50">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Ready to unleash the power of your {nfts.length} NFT{nfts.length > 1 ? 's' : ''}?
                          </p>
                          <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            🚀 FULL POWER • FULL ENERGY • FULL THROTTLE! 🚀
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click the action buttons on your NFTs above to get started
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* My Auctions */}
              <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Gavel className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-gray-900 text-xl">My Auctions</CardTitle>
                      <CardDescription className="text-gray-600">Auctions you've created</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userAuctions.map((auction) => (
                    <div key={auction.id} className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-2xl p-6 hover:bg-white/50 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg">{auction.title}</h3>
                        <Badge
                          variant={auction.status === "live" ? "default" : "secondary"}
                          className={`${
                            auction.status === "live" 
                              ? "bg-green-500/80 text-white border-green-400" 
                              : "bg-gray-500/80 text-white border-gray-400"
                          } backdrop-blur-sm`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-2 ${auction.status === "live" ? "bg-green-300 animate-pulse" : "bg-gray-300"}`} />
                          {auction.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                          <span className="block text-sm text-gray-600 mb-1">Current/Final Bid</span>
                          <span className="font-bold text-gray-900 text-lg">
                            {auction.status === "live" ? auction.currentBid : auction.finalBid}
                          </span>
                        </div>
                        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                          <span className="block text-sm text-gray-600 mb-1">{auction.status === "live" ? "Time Left" : "Winner"}</span>
                          <span className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            {auction.status === "live" && <Clock className="w-4 h-4" />}
                            {auction.status === "live" ? auction.timeLeft : auction.winner}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/20">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {auction.bids} bids • Created {auction.created}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white/80 backdrop-blur-sm border-white/40 hover:bg-white/90 shadow-lg"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* My Bids */}
              <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-gray-900 text-xl">My Bids</CardTitle>
                      <CardDescription className="text-gray-600">Your active bidding activity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userBids.map((bid) => (
                    <div key={bid.auctionId} className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-2xl p-6 hover:bg-white/50 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg">{bid.title}</h3>
                        <Badge
                          variant={bid.status === "winning" ? "default" : "outline"}
                          className={`${
                            bid.status === "winning" 
                              ? "bg-green-500/80 text-white border-green-400" 
                              : "bg-orange-500/80 text-white border-orange-400"
                          } backdrop-blur-sm`}
                        >
                          {bid.status === "winning" ? <Trophy className="w-3 h-3 mr-2" /> : <Activity className="w-3 h-3 mr-2" />}
                          {bid.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                          <span className="block text-sm text-gray-600 mb-1">Your Bid</span>
                          <span className="font-bold text-gray-900 text-lg">{bid.bidAmount}</span>
                        </div>
                        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                          <span className="block text-sm text-gray-600 mb-1">Current Bid</span>
                          <span className="font-bold text-gray-900 text-lg">{bid.currentBid}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/20">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Time left: {bid.timeLeft}
                        </span>
                        <div className="space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-white/80 backdrop-blur-sm border-white/40 hover:bg-white/90 shadow-lg"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Auction
                          </Button>
                          {bid.status === "outbid" && (
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity shadow-lg"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Place New Bid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
