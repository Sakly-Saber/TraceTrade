'use client'

import { useState } from 'react'
import { 
  CompactAssetFilter, 
  HorizontalAssetFilter, 
  AssetFilterTabs,
  type FilterSelection 
} from '@/components/filters/reusable-asset-filters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Clock, 
  Gavel,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  PlayCircle
} from "lucide-react"

interface AuctionLot {
  id: string
  title: string
  description: string
  industry: string
  subIndustry: string
  specificAsset: string
  startingBid: string
  currentBid: string
  minBidIncrement: string
  totalBids: number
  status: 'upcoming' | 'active' | 'ending-soon' | 'ended' | 'cancelled'
  startTime: string
  endTime: string
  timeRemaining: string
  image: string
  verified: boolean
  reserveMet: boolean
  seller: {
    name: string
    rating: number
    verified: boolean
  }
}

interface AuctionFiltersProps {
  auctions: AuctionLot[]
  onFilteredAuctionsChange: (auctions: AuctionLot[]) => void
  variant?: 'horizontal' | 'compact' | 'tabs'
}

const auctionStatusIcons = {
  'upcoming': Calendar,
  'active': PlayCircle,
  'ending-soon': AlertCircle,
  'ended': CheckCircle,
  'cancelled': AlertCircle
}

const auctionStatusColors = {
  'upcoming': 'bg-blue-100 text-blue-800 border-blue-200',
  'active': 'bg-green-100 text-green-800 border-green-200',
  'ending-soon': 'bg-orange-100 text-orange-800 border-orange-200',
  'ended': 'bg-gray-100 text-gray-800 border-gray-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200'
}

export function AuctionFilters({ 
  auctions, 
  onFilteredAuctionsChange, 
  variant = 'horizontal' 
}: AuctionFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [bidRange, setBidRange] = useState({ min: '', max: '' })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('ending-soon')
  const [filterSelection, setFilterSelection] = useState<FilterSelection>({
    industry: '',
    subIndustry: '',
    specificAsset: ''
  })

  const filterAuctions = (
    currentAuctions: AuctionLot[],
    search: string,
    filters: FilterSelection,
    status: string,
    timeRange: string,
    bidMin: string,
    bidMax: string,
    sort: string
  ) => {
    let filtered = [...currentAuctions]

    // Text search
    if (search) {
      filtered = filtered.filter(auction => 
        auction.title.toLowerCase().includes(search.toLowerCase()) ||
        auction.description.toLowerCase().includes(search.toLowerCase()) ||
        auction.specificAsset.toLowerCase().includes(search.toLowerCase()) ||
        auction.seller.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Industry filters
    if (filters.industry) {
      filtered = filtered.filter(auction => auction.industry === filters.industry)
    }
    if (filters.subIndustry) {
      filtered = filtered.filter(auction => auction.subIndustry === filters.subIndustry)
    }
    if (filters.specificAsset) {
      filtered = filtered.filter(auction => auction.specificAsset === filters.specificAsset)
    }

    // Status filter
    if (status !== 'all') {
      if (status === 'live') {
        filtered = filtered.filter(auction => 
          auction.status === 'active' || auction.status === 'ending-soon'
        )
      } else {
        filtered = filtered.filter(auction => auction.status === status)
      }
    }

    // Time-based filter
    if (timeRange !== 'all') {
      const now = new Date()
      filtered = filtered.filter(auction => {
        const endTime = new Date(auction.endTime)
        const timeDiff = endTime.getTime() - now.getTime()
        const hoursRemaining = timeDiff / (1000 * 60 * 60)

        switch (timeRange) {
          case 'ending-1h':
            return hoursRemaining <= 1 && hoursRemaining > 0
          case 'ending-24h':
            return hoursRemaining <= 24 && hoursRemaining > 0
          case 'ending-week':
            return hoursRemaining <= 168 && hoursRemaining > 0
          case 'new':
            const startTime = new Date(auction.startTime)
            const sinceStart = now.getTime() - startTime.getTime()
            const hoursSinceStart = sinceStart / (1000 * 60 * 60)
            return hoursSinceStart <= 24
          default:
            return true
        }
      })
    }

    // Bid range filter
    if (bidMin) {
      const min = parseFloat(bidMin)
      filtered = filtered.filter(auction => {
        const currentBid = parseFloat(auction.currentBid.replace('$', '').replace(',', ''))
        return currentBid >= min
      })
    }
    if (bidMax) {
      const max = parseFloat(bidMax)
      filtered = filtered.filter(auction => {
        const currentBid = parseFloat(auction.currentBid.replace('$', '').replace(',', ''))
        return currentBid <= max
      })
    }

    // Sorting
    switch (sort) {
      case 'ending-soon':
        filtered.sort((a, b) => {
          const endA = new Date(a.endTime).getTime()
          const endB = new Date(b.endTime).getTime()
          return endA - endB
        })
        break
      case 'bid-low':
        filtered.sort((a, b) => {
          const bidA = parseFloat(a.currentBid.replace('$', '').replace(',', ''))
          const bidB = parseFloat(b.currentBid.replace('$', '').replace(',', ''))
          return bidA - bidB
        })
        break
      case 'bid-high':
        filtered.sort((a, b) => {
          const bidA = parseFloat(a.currentBid.replace('$', '').replace(',', ''))
          const bidB = parseFloat(b.currentBid.replace('$', '').replace(',', ''))
          return bidB - bidA
        })
        break
      case 'most-bids':
        filtered.sort((a, b) => b.totalBids - a.totalBids)
        break
      case 'newest':
        filtered.sort((a, b) => {
          const startA = new Date(a.startTime).getTime()
          const startB = new Date(b.startTime).getTime()
          return startB - startA
        })
        break
      default:
        break
    }

    return filtered
  }

  const handleFilterChange = (newFilters: FilterSelection) => {
    setFilterSelection(newFilters)
    const filtered = filterAuctions(auctions, searchTerm, newFilters, statusFilter, timeFilter, bidRange.min, bidRange.max, sortBy)
    onFilteredAuctionsChange(filtered)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch)
    const filtered = filterAuctions(auctions, newSearch, filterSelection, statusFilter, timeFilter, bidRange.min, bidRange.max, sortBy)
    onFilteredAuctionsChange(filtered)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    const filtered = filterAuctions(auctions, searchTerm, filterSelection, newStatus, timeFilter, bidRange.min, bidRange.max, sortBy)
    onFilteredAuctionsChange(filtered)
  }

  const handleTimeFilterChange = (newTimeFilter: string) => {
    setTimeFilter(newTimeFilter)
    const filtered = filterAuctions(auctions, searchTerm, filterSelection, statusFilter, newTimeFilter, bidRange.min, bidRange.max, sortBy)
    onFilteredAuctionsChange(filtered)
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    const filtered = filterAuctions(auctions, searchTerm, filterSelection, statusFilter, timeFilter, bidRange.min, bidRange.max, newSort)
    onFilteredAuctionsChange(filtered)
  }

  const renderAssetFilter = () => {
    const options = {
      showSpecificAssets: true,
      placeholder: {
        industry: "All Industries",
        subIndustry: "All Categories", 
        specificAsset: "All Asset Types"
      }
    }

    switch (variant) {
      case 'compact':
        return (
          <CompactAssetFilter 
            onFilterChange={handleFilterChange}
            options={options}
            initialSelection={filterSelection}
            className="w-full"
          />
        )
      case 'tabs':
        return (
          <AssetFilterTabs 
            onFilterChange={handleFilterChange}
            options={options}
            initialSelection={filterSelection}
            className="w-full"
          />
        )
      default:
        return (
          <HorizontalAssetFilter 
            onFilterChange={handleFilterChange}
            options={options}
            initialSelection={filterSelection}
            className="w-full"
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Quick Actions */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search auctions by title, asset type, or seller..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="all">All Auctions</option>
            <option value="live">Live Auctions</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="ending-soon">Ending Soon</option>
            <option value="ended">Ended</option>
          </select>
          
          <select 
            value={timeFilter}
            onChange={(e) => handleTimeFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="all">All Times</option>
            <option value="ending-1h">Ending in 1 Hour</option>
            <option value="ending-24h">Ending in 24 Hours</option>
            <option value="ending-week">Ending This Week</option>
            <option value="new">New (Last 24h)</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="ending-soon">Ending Soon</option>
            <option value="newest">Newest First</option>
            <option value="bid-low">Lowest Bid</option>
            <option value="bid-high">Highest Bid</option>
            <option value="most-bids">Most Bids</option>
          </select>
        </div>
      </div>

      {/* Asset Type Filters */}
      {renderAssetFilter()}

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'ending-soon' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('ending-soon')}
          className="flex items-center gap-1"
        >
          <Clock className="w-3 h-3" />
          Ending Soon
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('active')}
          className="flex items-center gap-1"
        >
          <Gavel className="w-3 h-3" />
          Live Bidding
        </Button>
        <Button
          variant={timeFilter === 'new' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTimeFilterChange('new')}
          className="flex items-center gap-1"
        >
          <TrendingUp className="w-3 h-3" />
          New Listings
        </Button>
      </div>

      {/* Active Filters Summary */}
      {(searchTerm || filterSelection.industry || statusFilter !== 'all' || timeFilter !== 'all') && (
        <Card className="bg-orange-50/50 border-orange-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-orange-800">Active Filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {filterSelection.industry && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Industry: {filterSelection.industry}
                  </Badge>
                )}
                {filterSelection.subIndustry && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Category: {filterSelection.subIndustry}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Status: {statusFilter}
                  </Badge>
                )}
                {timeFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Time: {timeFilter}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterSelection({ industry: '', subIndustry: '', specificAsset: '' })
                  setStatusFilter('all')
                  setTimeFilter('all')
                  setSortBy('ending-soon')
                  onFilteredAuctionsChange(auctions)
                }}
                className="text-orange-700 hover:text-orange-900"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auction Status Legend */}
      <Card className="bg-gray-50/50">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-gray-700">Status Legend:</span>
            {Object.entries(auctionStatusColors).map(([status, colorClass]) => {
              const IconComponent = auctionStatusIcons[status as keyof typeof auctionStatusIcons]
              return (
                <div key={status} className="flex items-center gap-1">
                  <IconComponent className="w-3 h-3" />
                  <Badge className={`text-xs ${colorClass}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Export types for use in auction pages
export type { AuctionLot, AuctionFiltersProps }
export { CompactAssetFilter, HorizontalAssetFilter, AssetFilterTabs } from '@/components/filters/reusable-asset-filters'