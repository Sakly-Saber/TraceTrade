"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { useWallet } from "@/hooks/use-wallet"
import { useAuth } from "@/contexts/auth-context"
import {
  Gavel,
  Clock,
  Shield,
  FileText,
  MapPin,
  TrendingUp,
  AlertCircle,
  User,
  Trophy,
  Loader2,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { AIInsights } from "@/components/ai-insights"

interface Bid {
  id: string
  amount: number
  createdAt: string
  bidder: {
    id: string
    firstName: string
    lastName: string
  }
}

interface AuctionDetail {
  id: string
  startingBid: number
  reservePrice: number
  currentBid: number
  auctionEndTime: string
  status: string
  nftAssets: Array<{
    name: string
    description?: string
    imageUrl?: string
    aiImageUrl?: string
    tokenId: string
    serialNumber: number
    collection?: {
      name: string
    }
  }>
  bids: Bid[]
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const { user } = useAuth()
  
  const [auction, setAuction] = useState<AuctionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [error, setError] = useState('')
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    fetchAuction()
  }, [resolvedParams.id])

  useEffect(() => {
    if (!auction) return
    
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(auction.auctionEndTime))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [auction])

  const fetchAuction = async () => {
    try {
      const res = await fetch(`/api/auctions/${resolvedParams.id}`)
      
      if (!res.ok) {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to load auction')
        return
      }
      
      const data = await res.json()
      
      // API returns the auction object directly
      setAuction(data)
      // Set minimum bid as starting point
      const minBid = data.currentBid > 0 
        ? data.currentBid * 1.05 
        : data.startingBid
      setBidAmount(minBid.toFixed(2))
    } catch (err: any) {
      console.error('Error fetching auction:', err)
      setError(err.message || 'Failed to load auction')
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeRemaining = (endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return "Ended"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    return `${minutes}m ${seconds}s`
  }

  const handlePlaceBid = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    const amount = parseFloat(bidAmount)
    const minBid = auction!.currentBid > 0 
      ? auction!.currentBid * 1.05 
      : auction!.startingBid

    if (isNaN(amount) || amount < minBid) {
      setError(`Bid must be at least ${minBid.toFixed(2)} ℏ`)
      return
    }

    setIsPlacingBid(true)
    setError('')

    try {
      const res = await fetch('/api/auctions/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: auction!.id,
          amount: amount,
          amountHbar: amount,
          bidderAccountId: address
        })
      })

      const data = await res.json()

      if (data.success) {
        // Refresh auction data
        await fetchAuction()
        setError('')
      } else {
        setError(data.error || 'Failed to place bid')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place bid')
    } finally {
      setIsPlacingBid(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error && !auction) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Auction Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/auctions')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Auctions
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const nft = auction?.nftAssets[0]
  const isEnded = timeRemaining === "Ended"
  const minBidAmount = auction!.currentBid > 0 ? auction!.currentBid * 1.05 : auction!.startingBid

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/auctions')}
          className="mb-3 h-8 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Auctions
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left: NFT Image & Info */}
          <div>
            <Card>
              <CardContent className="p-4">
                <img
                  src={nft?.aiImageUrl || nft?.imageUrl || '/placeholder.png'}
                  alt={nft?.name}
                  className="w-full h-auto rounded-lg mb-4"
                />
                <h1 className="text-2xl font-bold mb-2">{nft?.name}</h1>
                {nft?.collection && (
                  <Badge variant="outline" className="mb-2">{nft.collection.name}</Badge>
                )}
                <p className="text-sm text-muted-foreground mb-4">{nft?.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Token ID</p>
                    <p className="font-mono text-xs">{nft?.tokenId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Serial #</p>
                    <p className="font-mono">#{nft?.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Seller</p>
                    <p className="text-xs">{auction!.createdBy.firstName} {auction!.createdBy.lastName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={isEnded ? "secondary" : "default"} className="text-xs">
                      {isEnded ? "ENDED" : "LIVE"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Bid Info & Form */}
          <div className="space-y-4">
            {/* Timer & Status */}
            <Card className={`${isEnded ? 'bg-red-50' : 'bg-green-50'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {isEnded ? 'Auction Ended' : 'Time Remaining'}
                  </span>
                  <Badge variant={isEnded ? "destructive" : "default"} className="text-xs">
                    {timeRemaining}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Current Bid Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Auction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Starting Bid</span>
                  <span className="font-bold">{auction!.startingBid} ℏ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reserve Price</span>
                  <span className="font-bold">{auction!.reservePrice} ℏ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Current Bid
                  </span>
                  <span className="font-bold text-green-600 text-lg">
                    {auction!.currentBid || auction!.startingBid} ℏ
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Total Bids</span>
                  <span className="font-bold">{auction!.bids.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Place Bid */}
            {!isEnded && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gavel className="h-4 w-4" />
                    Place Your Bid
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">Bid Amount (HBAR)</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min: ${minBidAmount.toFixed(2)}`}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        ℏ
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum bid: {minBidAmount.toFixed(2)} ℏ (5% above current)
                    </p>
                  </div>

                  {error && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !isConnected}
                    className="w-full h-9 text-sm"
                  >
                    {isPlacingBid ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Placing Bid...
                      </>
                    ) : (
                      <>
                        <Gavel className="h-4 w-4 mr-2" />
                        Place Bid
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Detailed Information Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9">
                <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                <TabsTrigger value="bids" className="text-xs">Bids</TabsTrigger>
                <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
                <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-3 mt-3">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Lot Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Commodity Type</p>
                        <p className="font-semibold">{nft?.name || 'NFT Asset'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-semibold">1 NFT</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="font-semibold">{nft?.collection?.name || 'Digital Asset'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-semibold">🌍 Blockchain</p>
                      </div>
                    </div>
                    {nft?.description && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{nft.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bids" className="space-y-3 mt-3">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Bid History</CardTitle>
                    <CardDescription className="text-xs">{auction?.bids?.length || 0} bids placed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!auction?.bids || auction.bids.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6 text-sm">No bids placed yet</p>
                    ) : (
                      <div className="space-y-2">
                        {auction.bids
                          .slice()
                          .reverse()
                          .map((bid) => (
                            <div key={bid.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                              <div>
                                <p className="font-semibold text-sm">
                                  {bid.amount.toFixed(2)} ℏ
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {bid.bidder.firstName} {bid.bidder.lastName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(bid.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="space-y-3 mt-3">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Blockchain Audit Trail</CardTitle>
                    <CardDescription className="text-xs">Immutable record on Hedera</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-2.5 bg-muted/30 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">Auction Created</p>
                          <p className="text-xs text-muted-foreground">NFT escrowed to smart contract</p>
                        </div>
                      </div>

                      {auction?.bids?.map((bid) => (
                        <div key={bid.id} className="flex items-center space-x-3 p-2.5 bg-muted/30 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              Bid: {bid.amount.toFixed(2)} ℏ
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(bid.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-3 mt-3">
                <AIInsights
                  commodity={nft?.name || "Premium Commodity"}
                  quantity={100}
                  grade="premium"
                  walletAddress={address || undefined}
                  auctionData={{
                    currentBid: auction?.currentBid.toString() || "0",
                    reservePrice: auction?.reservePrice.toString() || "0",
                    endTime: auction?.auctionEndTime || "",
                    bids: auction?.bids?.length || 0,
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Current Status */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">
                      Reserve: {auction!.reservePrice.toFixed(2)} ℏ
                    </span>
                    <span className="text-muted-foreground">
                      {auction!.reservePrice > 0 
                        ? Math.min(100, Math.round((auction!.currentBid / auction!.reservePrice) * 100))
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={auction!.reservePrice > 0 
                      ? Math.min(100, Math.round((auction!.currentBid / auction!.reservePrice) * 100))
                      : 0}
                    className="h-1.5"
                  />
                </div>

                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">Current Highest Bid</p>
                  <p className="text-2xl font-bold text-primary my-1">
                    {auction!.currentBid === 0
                      ? "No bids yet"
                      : `${auction!.currentBid.toFixed(2)} ℏ`}
                  </p>
                  {auction!.bids && auction!.bids.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      by {auction!.bids[auction!.bids.length - 1].bidder.firstName} {auction!.bids[auction!.bids.length - 1].bidder.lastName}
                    </p>
                  )}
                </div>

                <div className="text-center py-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                  <p className="text-lg font-semibold text-foreground flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1.5" />
                    {timeRemaining}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bids</span>
                  <span className="font-semibold">{auction!.bids?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reserve Price</span>
                  <span className="font-semibold">{auction!.reservePrice.toFixed(2)} ℏ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Bid</span>
                  <span className="font-semibold">{auction!.startingBid.toFixed(2)} ℏ</span>
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-semibold text-sm">
                      {auction!.createdBy.firstName} {auction!.createdBy.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="text-sm truncate">{auction!.createdBy.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
