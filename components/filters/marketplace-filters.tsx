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
  SlidersHorizontal, 
  Grid, 
  List,
  Star,
  TrendingUp,
  DollarSign,
  Users,
  Eye
} from "lucide-react"

interface MarketplaceAsset {
  id: string
  title: string
  description: string
  industry: string
  subIndustry: string
  specificAsset: string
  tokenSupply: string
  tokenPrice: string
  totalValue: string
  status: 'active' | 'pending' | 'sold'
  holders: number
  tradingVolume: string
  priceChange24h: number
  image: string
  rating: number
  verified: boolean
}

interface MarketplaceFiltersProps {
  assets: MarketplaceAsset[]
  onFilteredAssetsChange: (assets: MarketplaceAsset[]) => void
  variant?: 'horizontal' | 'compact' | 'tabs'
}

export function MarketplaceFilters({ 
  assets, 
  onFilteredAssetsChange, 
  variant = 'horizontal' 
}: MarketplaceFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('latest')
  const [filterSelection, setFilterSelection] = useState<FilterSelection>({
    industry: '',
    subIndustry: '',
    specificAsset: ''
  })

  const filterAssets = (
    currentAssets: MarketplaceAsset[],
    search: string,
    filters: FilterSelection,
    status: string,
    priceMin: string,
    priceMax: string,
    sort: string
  ) => {
    let filtered = [...currentAssets]

    // Text search
    if (search) {
      filtered = filtered.filter(asset => 
        asset.title.toLowerCase().includes(search.toLowerCase()) ||
        asset.description.toLowerCase().includes(search.toLowerCase()) ||
        asset.specificAsset.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Industry filters
    if (filters.industry) {
      filtered = filtered.filter(asset => asset.industry === filters.industry)
    }
    if (filters.subIndustry) {
      filtered = filtered.filter(asset => asset.subIndustry === filters.subIndustry)
    }
    if (filters.specificAsset) {
      filtered = filtered.filter(asset => asset.specificAsset === filters.specificAsset)
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(asset => asset.status === status)
    }

    // Price range filter
    if (priceMin) {
      const min = parseFloat(priceMin)
      filtered = filtered.filter(asset => {
        const price = parseFloat(asset.tokenPrice.replace('$', ''))
        return price >= min
      })
    }
    if (priceMax) {
      const max = parseFloat(priceMax)
      filtered = filtered.filter(asset => {
        const price = parseFloat(asset.tokenPrice.replace('$', ''))
        return price <= max
      })
    }

    // Sorting
    switch (sort) {
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.tokenPrice.replace('$', ''))
          const priceB = parseFloat(b.tokenPrice.replace('$', ''))
          return priceA - priceB
        })
        break
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.tokenPrice.replace('$', ''))
          const priceB = parseFloat(b.tokenPrice.replace('$', ''))
          return priceB - priceA
        })
        break
      case 'volume':
        filtered.sort((a, b) => {
          const volumeA = parseFloat(a.tradingVolume.replace('$', '').replace(',', ''))
          const volumeB = parseFloat(b.tradingVolume.replace('$', '').replace(',', ''))
          return volumeB - volumeA
        })
        break
      case 'holders':
        filtered.sort((a, b) => b.holders - a.holders)
        break
      default:
        // Latest (by ID for now)
        filtered.sort((a, b) => b.id.localeCompare(a.id))
    }

    return filtered
  }

  const handleFilterChange = (newFilters: FilterSelection) => {
    setFilterSelection(newFilters)
    const filtered = filterAssets(assets, searchTerm, newFilters, statusFilter, priceRange.min, priceRange.max, sortBy)
    onFilteredAssetsChange(filtered)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch)
    const filtered = filterAssets(assets, newSearch, filterSelection, statusFilter, priceRange.min, priceRange.max, sortBy)
    onFilteredAssetsChange(filtered)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    const filtered = filterAssets(assets, searchTerm, filterSelection, newStatus, priceRange.min, priceRange.max, sortBy)
    onFilteredAssetsChange(filtered)
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    const filtered = filterAssets(assets, searchTerm, filterSelection, statusFilter, priceRange.min, priceRange.max, newSort)
    onFilteredAssetsChange(filtered)
  }

  const renderAssetFilter = () => {
    const options = {
      showSpecificAssets: true,
      placeholder: {
        industry: "All Industries",
        subIndustry: "All Sub-Industries", 
        specificAsset: "All Assets"
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
            placeholder="Search assets by name, description, or type..."
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="latest">Latest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="volume">Trading Volume</option>
            <option value="holders">Most Holders</option>
          </select>
        </div>
      </div>

      {/* Asset Type Filters */}
      {renderAssetFilter()}

      {/* Active Filters Summary */}
      {(searchTerm || filterSelection.industry || statusFilter !== 'all') && (
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {filterSelection.industry && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Industry: {filterSelection.industry}
                  </Badge>
                )}
                {filterSelection.subIndustry && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Sub: {filterSelection.subIndustry}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Status: {statusFilter}
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
                  setSortBy('latest')
                  onFilteredAssetsChange(assets)
                }}
                className="text-blue-700 hover:text-blue-900"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Export types for use in marketplace page
export type { MarketplaceAsset, MarketplaceFiltersProps }
export { CompactAssetFilter, HorizontalAssetFilter, AssetFilterTabs } from '@/components/filters/reusable-asset-filters'