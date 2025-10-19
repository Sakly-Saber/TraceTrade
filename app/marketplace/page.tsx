"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Filter, 
  Grid, 
  List,
  Star,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Eye,
  Heart,
  ExternalLink,
  Gavel,
  ShoppingCart,
  Menu,
  Loader2
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { MarketplaceSidebar, type MarketplaceFilters } from "@/components/marketplace-sidebar"
import { VerticalFilterTrigger } from "@/components/vertical-filter-trigger"
import { EnhancedNFTCard } from "@/components/enhanced-nft-card"
import { useWallet } from "@/hooks/use-wallet"
import { cn } from "@/lib/utils"
import type { MarketplaceItem } from "@/lib/services/marketplaceService"

export default function MarketplacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    category: 'all',
    location: [],
    priceRange: [0, 10000000],
    status: 'all',
    rating: 0,
    verified: false,
    sortBy: 'latest'
  })

  const { isConnected, address } = useWallet()

  // Fetch marketplace items from API with pagination
  useEffect(() => {
    const fetchMarketplaceItems = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20'
        })
        
        if (filters.search) params.append('search', filters.search)
        if (filters.category !== 'all') params.append('category', filters.category)
        if (filters.status !== 'all') params.append('status', filters.status)
        if (filters.verified) params.append('verified', 'true')
        
        const response = await fetch(`/api/marketplace?${params.toString()}`)
        const result = await response.json()
        
        if (result.success) {
          setItems(result.data)
          setFilteredItems(result.data)
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages)
            setTotal(result.pagination.total)
          }
        } else {
          setError(result.error || 'Failed to fetch marketplace items')
          setItems([])
          setFilteredItems([])
        }
      } catch (err) {
        console.error('Error fetching marketplace items:', err)
        setError('Network error - failed to fetch marketplace items')
        setItems([])
        setFilteredItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchMarketplaceItems()
  }, [page, filters.search, filters.category, filters.status, filters.verified])

  // Refresh function to be passed to cards
  const handleRefresh = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20'
    })
    
    if (filters.search) params.append('search', filters.search)
    if (filters.category !== 'all') params.append('category', filters.category)
    if (filters.status !== 'all') params.append('status', filters.status)
    if (filters.verified) params.append('verified', 'true')
    
    const response = await fetch(`/api/marketplace?${params.toString()}`)
    const result = await response.json()
    
    if (result.success) {
      setItems(result.data)
      setFilteredItems(result.data)
      if (result.pagination) {
        setTotalPages(result.pagination.totalPages)
        setTotal(result.pagination.total)
      }
    }
  }

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
        item.location.some(loc => filters.location.includes(loc))
      )
    }

    // Price range filter
    filtered = filtered.filter(item => 
      item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    )

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
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        filtered.sort((a, b) => b.views - a.views)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'ending-soon':
        filtered.sort((a, b) => {
          if (!a.auctionEndTime && !b.auctionEndTime) return 0
          if (!a.auctionEndTime) return 1
          if (!b.auctionEndTime) return -1
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

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()
    
    if (diff <= 0) return "Ended"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Glassmorphic overlay background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200/20 via-transparent to-red-200/20"></div>
      
      <div className="relative z-10">
        {/* Navigation */}
        <Navigation />
        
        {/* Marketplace Sidebar */}
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
                    🛒 Marketplace
                  </h1>
                  <p className="text-muted-foreground">
                    Discover and trade tokenized assets from across Africa
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
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    placeholder="Search marketplace by name, description, or category..."
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
                    filters.sortBy !== 'latest'
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
                        filters.sortBy !== 'latest'
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results Count and Quick Filters */}
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredItems.length} of {items.length} results
              </div>
              <div className="flex items-center gap-2">
                {filters.location.length > 0 && (
                  <Badge variant="secondary">
                    📍 {filters.location.length} location{filters.location.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {filters.category !== 'all' && (
                  <Badge variant="secondary">
                    🏷️ {filters.category}
                  </Badge>
                )}
                {filters.verified && (
                  <Badge variant="secondary">
                    ✅ Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Marketplace Grid/List */}
          <div className="container mx-auto px-4 pb-12">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Card className="text-center py-12">
                  <CardContent>
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
                    <p className="text-lg text-muted-foreground">Loading marketplace items...</p>
                  </CardContent>
                </Card>
              </div>
            ) : error ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-muted-foreground mb-4">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50 text-red-500" />
                    <p className="text-lg text-red-600">Error Loading Marketplace</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs mt-2">This might be because the database is not seeded yet.</p>
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
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No items found</p>
                    <p>Try adjusting your filters or search terms</p>
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
                    price={item.price}
                    currency={item.currency}
                    type="marketplace"
                    seller={item.seller}
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
                      // Navigate to item details
                      window.location.href = `/marketplace/${item.id}`
                    }}
                    onPurchase={() => {
                      // Handle purchase
                      console.log('Purchase item:', item.id)
                    }}
                    listingData={item}
                    onRefresh={handleRefresh}
                    isOwner={isConnected && item.seller === address}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="backdrop-blur-md bg-white/50 border-blue-200/50 hover:bg-white/80"
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "backdrop-blur-md border-blue-200/50",
                          page === pageNum 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent" 
                            : "bg-white/50 hover:bg-white/80"
                        )}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="backdrop-blur-md bg-white/50 border-blue-200/50 hover:bg-white/80"
                >
                  Next
                </Button>
                
                <div className="ml-4 text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total items)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MarketplaceCardProps {
  item: MarketplaceItem
  viewMode: 'grid' | 'list'
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  isOwner: boolean
}

function MarketplaceCard({ item, viewMode, isFavorite, onToggleFavorite, isOwner }: MarketplaceCardProps) {
  const getTimeRemaining = (endTime: Date | string) => {
    const now = new Date()
    const endDateTime = endTime instanceof Date ? endTime : new Date(endTime)
    const diff = endDateTime.getTime() - now.getTime()
    
    if (diff <= 0) return "Ended"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (viewMode === 'list') {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image - Smaller */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-base">{item.name}</h3>
                    {item.verified && <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">✅</Badge>}
                    {item.status === 'auction' && <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">⚡</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(item.id)}
                  className={cn("h-8 w-8 p-0", isFavorite && "text-red-500")}
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.location.join(", ")}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {item.rating}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {item.views}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold">
                    {item.currency}{item.price.toLocaleString()}
                  </div>
                  {item.status === 'auction' && item.auctionEndTime && (
                    <div className="text-xs text-orange-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeRemaining(item.auctionEndTime)}
                    </div>
                  )}
                </div>
                
                <Button variant="outline" size="sm" className="text-xs h-8">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view - Compact design (half height)
  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 transition-all duration-300 group overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Image - Reduced aspect ratio */}
        <div className="relative h-40 overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Favorite Heart - Top Right */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(item.id)}
            className={cn(
              "absolute top-2 right-2 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm",
              isFavorite && "text-red-500"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>

          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 flex gap-1">
            {item.verified && <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">✅</Badge>}
            {item.status === 'auction' && <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">⚡</Badge>}
          </div>
        </div>
        
        {/* Content - Compact */}
        <CardContent className="p-3 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-1 mb-1">{item.name}</h3>
          
          {/* Metadata - Single line */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[60px]">{item.location[0]}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {item.rating}
            </div>
            <div className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {item.views}
            </div>
          </div>
          
          {/* Price and Action - Compact */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold">
                {item.currency}{item.price.toLocaleString()}
              </div>
              {item.status === 'auction' && item.auctionEndTime && (
                <div className="text-xs text-orange-600 flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {getTimeRemaining(item.auctionEndTime)}
                </div>
              )}
            </div>
            
            {/* View Button - Smaller */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs h-8"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}