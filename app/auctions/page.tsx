"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  Gavel, 
  Clock, 
  Users, 
  TrendingUp, 
  Eye,
  Filter,
  Menu,
  Heart,
  Star,
  MapPin,
  DollarSign,
  Grid,
  List,
  ExternalLink,
  Loader2
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { MarketplaceSidebar, type MarketplaceFilters } from "@/components/marketplace-sidebar"
import { VerticalFilterTrigger } from "@/components/vertical-filter-trigger"
import { EnhancedNFTCard } from "@/components/enhanced-nft-card"
import { BidModal } from "@/components/bid-modal"
import { useWallet } from "@/hooks/use-wallet"
import { cn } from "@/lib/utils"

export default function AuctionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [items, setItems] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)
  
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    category: 'all',
    location: [],
    priceRange: [0, 10000000],
    status: 'all',
    rating: 0,
    verified: false,
    sortBy: 'ending-soon'
  })

  const { isConnected, address } = useWallet()

  // Fetch auction items from API
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/auctions')
        const result = await response.json()
        
        if (result.success) {
          // Convert date strings to Date objects
          const transformedData = result.data.map((item: any) => ({
            ...item,
            auctionEndTime: new Date(item.auctionEndTime),
            createdAt: new Date(item.createdAt)
          }))
          
          // Debug: Log first item's image URL
          if (transformedData.length > 0) {
            console.log('🖼️ First auction image URL:', transformedData[0].image)
            console.log('📋 First auction data:', transformedData[0])
          }
          
          setItems(transformedData)
          setFilteredItems(transformedData)
        } else {
          setError(result.error || 'Failed to fetch auctions')
          setItems([])
          setFilteredItems([])
        }
      } catch (err) {
        console.error('Error fetching auctions:', err)
        setError('Network error - failed to fetch auctions')
        setItems([])
        setFilteredItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchAuctions()
  }, [])

  // Apply filters whenever filters change
  useEffect(() => {
    let filtered = [...items]

    // Text search
    if (filters.search) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.category.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category)
    }

    // Location filter
    if (filters.location.length > 0) {
      filtered = filtered.filter(item => 
        item.location.some((loc: string) => filters.location.includes(loc))
      )
    }

    // Price range filter (based on current bid or reserve price)
    filtered = filtered.filter(item => {
      const price = item.currentBid > 0 ? item.currentBid : item.reservePrice
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status)
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(item => item.rating >= filters.rating)
    }

    // Verified filter
    if (filters.verified) {
      filtered = filtered.filter(item => item.verified)
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (parseFloat(a.currentBid) || parseFloat(a.reservePrice) || 0) - (parseFloat(b.currentBid) || parseFloat(b.reservePrice) || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (parseFloat(b.currentBid) || parseFloat(b.reservePrice) || 0) - (parseFloat(a.currentBid) || parseFloat(a.reservePrice) || 0))
        break
      case 'popular':
        filtered.sort((a, b) => (b.watchers || 0) - (a.watchers || 0))
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'ending-soon':
        filtered.sort((a, b) => {
          const aTime = a.auctionEndTime instanceof Date ? a.auctionEndTime.getTime() : new Date(a.auctionEndTime).getTime()
          const bTime = b.auctionEndTime instanceof Date ? b.auctionEndTime.getTime() : new Date(b.auctionEndTime).getTime()
          return aTime - bTime
        })
        break
      default: // 'latest'
        filtered.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
          return bTime - aTime
        })
    }

    setFilteredItems(filtered)
  }, [filters, items])

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const getTimeRemaining = (endTime: Date | string) => {
    const now = new Date()
    const endDate = typeof endTime === 'string' ? new Date(endTime) : endTime
    const diff = endDate.getTime() - now.getTime()
    
    if (diff <= 0) return "Ended"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    return `${minutes}m ${seconds}s`
  }

  const getAuctionStatus = (item: any) => {
    const now = new Date()
    const endDate = typeof item.auctionEndTime === 'string' ? new Date(item.auctionEndTime) : item.auctionEndTime
    if (endDate <= now) return 'ended'
    if (item.currentBid === 0 && now < endDate) return 'upcoming'
    return 'live'
  }

  const handleOpenBidModal = (auction: any) => {
    setSelectedAuction(auction)
    setIsBidModalOpen(true)
  }

  const handlePlaceBid = async (amount: number) => {
    if (!selectedAuction) return

    try {
      // TODO: Implement actual bid placement with HashConnect
      const response = await fetch('/api/auctions/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auctionId: selectedAuction.id,
          amount: amount,
          amountHbar: amount,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to place bid')
      }

      const result = await response.json()
      
      // Refresh auctions to show new bid
      const updatedResponse = await fetch('/api/auctions')
      const updatedResult = await updatedResponse.json()
      
      if (updatedResult.success) {
        setItems(updatedResult.data)
        setFilteredItems(updatedResult.data)
      }

      alert('Bid placed successfully!')
    } catch (error) {
      console.error('Error placing bid:', error)
      alert('Failed to place bid. Please try again.')
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Glassmorphic overlay background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200/20 via-transparent to-red-200/20"></div>
      
      <div className="relative z-10">
        {/* Navigation */}
        <Navigation />
        
        {/* Auction Sidebar */}
        <MarketplaceSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        {/* Overlay when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Main Content */}
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-80" : "ml-0"
        )}>
          {/* Page Header */}
          <div className="border-b border-white/30 bg-white/40 backdrop-blur-md">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                    ⚡ Live Auctions
                  </h1>
                  <p className="text-muted-foreground">
                    Bid on premium tokenized assets across Africa
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Search Bar with Filter Button */}
              <div className="mt-6 flex items-center gap-3">
                <div className="relative flex-1 max-w-2xl">
                  <Gavel className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    placeholder="Search auctions by name, description, or location..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-12 pr-4 py-6 text-base bg-white shadow-lg border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300 rounded-xl transition-all"
                  />
                </div>
                
                {/* Enhanced Filter Button */}
                <Button
                  size="lg"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 px-6 py-6 rounded-xl border-0"
                >
                  <Filter className="h-5 w-5" />
                  <span className="font-semibold">Filters</span>
                  {[
                    filters.search !== '',
                    filters.category !== 'all',
                    filters.location.length > 0,
                    filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000000,
                    filters.status !== 'all',
                    filters.rating > 0,
                    filters.verified,
                    filters.sortBy !== 'ending-soon'
                  ].filter(Boolean).length > 0 && (
                    <Badge className="ml-1 px-2 py-1 text-xs bg-white text-orange-600 hover:bg-white">
                      {[
                        filters.search !== '',
                        filters.category !== 'all',
                        filters.location.length > 0,
                        filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000000,
                        filters.status !== 'all',
                        filters.rating > 0,
                        filters.verified,
                        filters.sortBy !== 'ending-soon'
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Auction Stats */}
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-md">
                      <Gavel className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Live Auctions</p>
                      <p className="text-2xl font-bold text-green-900">{filteredItems.filter(item => getAuctionStatus(item) === 'live').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl shadow-md">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Upcoming</p>
                      <p className="text-2xl font-bold text-blue-900">{filteredItems.filter(item => getAuctionStatus(item) === 'upcoming').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Total Bidders</p>
                      <p className="text-2xl font-bold text-purple-900">{filteredItems.reduce((sum, item) => sum + item.watchers, 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-md">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-700">Total Volume</p>
                      <p className="text-2xl font-bold text-orange-900">ℏ{(filteredItems.reduce((sum, item) => sum + item.currentBid, 0) / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Auction Grid/List */}
          <div className="container mx-auto px-4 pb-12">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Card className="text-center py-12">
                  <CardContent>
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-purple-500" />
                    <p className="text-lg text-muted-foreground">Loading auctions...</p>
                  </CardContent>
                </Card>
              </div>
            ) : error ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-muted-foreground mb-4">
                    <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50 text-red-500" />
                    <p className="text-lg text-red-600">Error Loading Auctions</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs mt-2">This might be because no auctions are active yet.</p>
                  </div>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="mr-2"
                  >
                    Retry
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setError(null)
                      setItems([])
                      setFilteredItems([])
                    }}
                  >
                    Continue Without Data
                  </Button>
                </CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-muted-foreground mb-4">
                    <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No auctions found</p>
                    <p>Try adjusting your filters</p>
                  </div>
                  <Button onClick={() => setFilters(prev => ({ ...prev, search: '', category: 'all', location: [], verified: false }))}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={cn(
                "gap-6",
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              )}>
                {filteredItems.map((item) => (
                  <EnhancedNFTCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    image={item.image}
                    price={item.reservePrice}
                    currency={item.currency}
                    type="auction"
                    currentBid={item.currentBid}
                    totalBids={item.totalBids}
                    auctionEndTime={item.auctionEndTime}
                    reservePrice={item.reservePrice}
                    verified={item.verified}
                    category={item.category}
                    location={item.location}
                    views={item.views}
                    likes={item.likes}
                    tokenId={item.tokenId}
                    serialNumber={item.serialNumber}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    onViewDetails={() => {
                      window.location.href = `/auctions/${item.id}`
                    }}
                    onPlaceBid={() => {
                      handleOpenBidModal(item)
                    }}
                    isOwner={isConnected && item.seller === address}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bid Modal */}
        {selectedAuction && (
          <BidModal
            isOpen={isBidModalOpen}
            onClose={() => {
              setIsBidModalOpen(false)
              setSelectedAuction(null)
            }}
            auction={{
              id: selectedAuction.id,
              name: selectedAuction.name,
              image: selectedAuction.image,
              currentBid: selectedAuction.currentBid,
              reservePrice: selectedAuction.reservePrice,
              currency: 'HBAR'
            }}
            onPlaceBid={handlePlaceBid}
          />
        )}
      </div>
    </div>
  )
}


interface AuctionCardProps {
  item: any
  viewMode: 'grid' | 'list'
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  isOwner: boolean
}

function AuctionCard({ item, viewMode, isFavorite, onToggleFavorite, isOwner }: AuctionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [auctionStatus, setAuctionStatus] = useState('live')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const diff = item.auctionEndTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeRemaining("Ended")
        setAuctionStatus('ended')
        return
      }
      
      if (item.currentBid === 0 && now < item.auctionEndTime) {
        const startDiff = item.auctionEndTime.getTime() - now.getTime()
        if (startDiff > 0) {
          setAuctionStatus('upcoming')
          setTimeRemaining(`Starting in ${Math.floor(startDiff / (1000 * 60 * 60))}h`)
          return
        }
      }
      
      setAuctionStatus('live')
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [item.auctionEndTime, item.currentBid])

  if (viewMode === 'list') {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Image */}
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('❌ Failed to load list view image:', item.image)
                  const target = e.currentTarget
                  
                  // Try alternative IPFS gateways
                  if (target.src.includes('cf-ipfs.com')) {
                    const hash = target.src.split('/ipfs/')[1]
                    target.src = `https://dweb.link/ipfs/${hash}`
                    console.log('🔄 Retrying with dweb.link:', target.src)
                  } else if (target.src.includes('dweb.link')) {
                    const hash = target.src.split('/ipfs/')[1]
                    target.src = `https://ipfs.io/ipfs/${hash}`
                    console.log('🔄 Retrying with ipfs.io:', target.src)
                  } else {
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      const icon = document.createElement('div')
                      icon.innerHTML = '🖼️'
                      icon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;opacity:0.5'
                      parent.appendChild(icon)
                    }
                  }
                }}
              />
              {auctionStatus === 'live' && (
                <div className="absolute top-2 left-2">
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    🔴 LIVE
                  </Badge>
                </div>
              )}
              {auctionStatus === 'upcoming' && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    ⏳ UPCOMING
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    {item.verified && <Badge variant="secondary">✅ Verified</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(item.id)}
                  className={cn(isFavorite && "text-red-500")}
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {item.location.join(", ")}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {item.watchers} watching
                </div>
                <div className="flex items-center gap-1">
                  <Gavel className="h-4 w-4" />
                  {item.totalBids} bids
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current: {item.currency}{item.currentBid.toLocaleString()}</span>
                  <span>Reserve: {item.currency}{item.reservePrice.toLocaleString()}</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {item.currency}{item.currentBid.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current Bid
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-orange-600">
                      {timeRemaining}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Time Left
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {auctionStatus === 'live' && (
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600">
                      <Gavel className="h-4 w-4 mr-2" />
                      Place Bid
                    </Button>
                  )}
                  {auctionStatus === 'upcoming' && (
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Watch Auction
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 transition-all duration-300 group relative">
      <div className="relative">
        {/* Image */}
        <div className="aspect-square rounded-t-lg overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onLoad={() => {
              console.log('✅ Image loaded successfully:', item.image)
            }}
            onError={(e) => {
              console.error('❌ Failed to load image:', item.image)
              console.error('❌ Actual src attribute:', e.currentTarget.src)
              const target = e.currentTarget
              
              // Try alternative IPFS gateways
              if (target.src.includes('cf-ipfs.com')) {
                // Try dweb.link gateway
                const hash = target.src.split('/ipfs/')[1]
                target.src = `https://dweb.link/ipfs/${hash}`
                console.log('🔄 Retrying with dweb.link:', target.src)
              } else if (target.src.includes('dweb.link')) {
                // Try ipfs.io gateway
                const hash = target.src.split('/ipfs/')[1]
                target.src = `https://ipfs.io/ipfs/${hash}`
                console.log('🔄 Retrying with ipfs.io:', target.src)
              } else {
                // All gateways failed, show placeholder
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  const icon = document.createElement('div')
                  icon.innerHTML = '🖼️'
                  icon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:64px;opacity:0.5'
                  parent.appendChild(icon)
                }
              }
            }}
          />
        </div>
        
        {/* Overlay Actions */}
        <div className="absolute top-3 left-3">
          {auctionStatus === 'live' && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              🔴 LIVE
            </Badge>
          )}
          {auctionStatus === 'upcoming' && (
            <Badge variant="secondary" className="text-xs">
              ⏳ UPCOMING
            </Badge>
          )}
        </div>
        
        <div className="absolute top-3 right-3 flex gap-2">
          {item.verified && <Badge variant="secondary" className="text-xs">✅</Badge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(item.id)}
            className={cn(
              "bg-white/80 backdrop-blur-sm hover:bg-white",
              isFavorite && "text-red-500"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold line-clamp-1">{item.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Current</span>
            <span>Reserve</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-green-600">{item.currency}{item.currentBid.toLocaleString()}</span>
            <span>{item.currency}{item.reservePrice.toLocaleString()}</span>
          </div>
          <Progress value={item.progress} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {item.watchers}
          </div>
          <div className="flex items-center gap-1">
            <Gavel className="h-3 w-3" />
            {item.totalBids} bids
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.location[0]}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">
            {timeRemaining}
          </div>
          <div className="text-xs text-muted-foreground">Time Left</div>
        </div>
        
        <div className="space-y-2">
          {auctionStatus === 'live' && (
            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <Gavel className="h-4 w-4 mr-2" />
              Place Bid
            </Button>
          )}
          {auctionStatus === 'upcoming' && (
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Watch Auction
            </Button>
          )}
          {auctionStatus === 'ended' && (
            <Button variant="secondary" className="w-full" disabled>
              Auction Ended
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}