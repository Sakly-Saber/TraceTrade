"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  X, 
  Filter,
  Search,
  Map,
  Star,
  Clock,
  DollarSign,
  Users,
  Package,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"

// Compact Africa Map Component for Sidebar
function CompactAfricaMap({ onCountrySelect, selectedCountries = [] }: {
  onCountrySelect: (country: string) => void
  selectedCountries: string[]
}) {
  const [countries, setCountries] = useState<Array<{id: string, name: string, path: string}>>([])
  const [svgViewBox, setSvgViewBox] = useState<string>('0 0 750 950')
  const [hoveredCountry, setHoveredCountry] = useState<string>('')

  // Load the real Africa SVG on component mount
  useEffect(() => {
    let cancelled = false
    async function loadSvg() {
      try {
        const res = await fetch('/africa.svg')
        if (!res.ok) return
        const text = await res.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'image/svg+xml')

        // Get viewBox from the SVG
        const svgEl = doc.querySelector('svg')
        if (svgEl?.getAttribute('viewBox')) {
          setSvgViewBox(svgEl.getAttribute('viewBox') || '0 0 750 950')
        } else if (svgEl?.getAttribute('width') && svgEl?.getAttribute('height')) {
          // Use width/height as fallback
          const w = svgEl.getAttribute('width')
          const h = svgEl.getAttribute('height')
          setSvgViewBox(`0 0 ${w} ${h}`)
        }

        const paths = Array.from(doc.querySelectorAll('path')) as SVGPathElement[]
        
        // Filter for African countries only
        const AFRICAN_ISO2 = new Set([
          'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','SZ','ET',
          'GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW',
          'ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','EH','ZM','ZW'
        ])

        const AFRICAN_NAME_HINTS = [
          'algeria','angola','benin','botswana','burkina','burundi','cape','cameroon','central african','chad','comoros',
          'congo','democratic republic of congo','republic of congo','cote','ivoire','ivory coast','djibouti','egypt',
          'equatorial guinea','eritrea','eswatini','swaziland','ethiopia','gabon','gambia','ghana','guinea',
          'guinea-bissau','kenya','lesotho','liberia','libya','madagascar','malawi','mali','mauritania','mauritius','morocco',
          'mozambique','namibia','niger','nigeria','rwanda','sao tome','senegal','seychelles',
          'sierra leone','somalia','south africa','south sudan','sudan','tanzania','togo','tunisia','uganda','zambia','zimbabwe'
        ]

        const normalize = (s: string) =>
          s.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

        const parsed = paths
          .filter(p => {
            const rawId = p.id && p.id.trim()
            const hasD = !!p.getAttribute('d')
            if (!rawId || !hasD) return false

            const up = rawId.toUpperCase()
            if (up.length === 2 && AFRICAN_ISO2.has(up)) return true

            const title = (p.getAttribute('title') || p.getAttribute('name') || '').toString()
            const normTitle = normalize(title)
            if (normTitle && AFRICAN_NAME_HINTS.some(h => normTitle.includes(h))) return true

            const normId = normalize(rawId)
            if (AFRICAN_NAME_HINTS.some(h => normId.includes(h))) return true

            return false
          })
          .map(p => {
            const title = p.getAttribute('title') || ''
            const name = p.getAttribute('name') || ''
            const id = p.id || ''
            
            // Use title if available (like "Angola", "Nigeria"), otherwise use name, otherwise use id
            const displayName = title || name || id
            
            return {
              id: id.trim(),
              name: displayName.trim(),
              path: p.getAttribute('d') || ''
            }
          })

        if (!cancelled) setCountries(parsed)
      } catch (err) {
        console.error('Failed to load africa.svg:', err)
      }
    }

    loadSvg()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="w-full relative">
      {/* Hovered Country Display */}
      {hoveredCountry && (
        <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-sm z-10">
          {hoveredCountry}
        </div>
      )}
      
      <div className="w-full h-64 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border p-2 relative">
        {countries.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading Africa map...</div>
          </div>
        )}
        
        {countries.length > 0 && (
          <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 rounded text-xs text-gray-600">
            {countries.length} countries
          </div>
        )}
        
        <svg
          viewBox={svgViewBox}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          {/* Countries */}
          {countries.map((country) => (
            <g key={country.id}>
              <path
                d={country.path}
                fill={
                  selectedCountries.includes(country.name) 
                    ? "#2563eb" 
                    : hoveredCountry === country.name
                    ? "#93c5fd"
                    : "#f8fafc"
                }
                stroke="#64748b"
                strokeWidth="0.8"
                className="cursor-pointer transition-all duration-200"
                onClick={() => onCountrySelect(country.name)}
                onMouseEnter={() => setHoveredCountry(country.name)}
                onMouseLeave={() => setHoveredCountry('')}
              >
                <title>{country.name}</title>
              </path>
            </g>
          ))}
        </svg>
      </div>
      
      {selectedCountries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedCountries.map((country) => (
            <Badge key={country} variant="secondary" className="text-xs">
              {country}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onCountrySelect(country)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export interface MarketplaceFilters {
  search: string
  category: string
  location: string[]
  priceRange: [number, number]
  status: string
  rating: number
  verified: boolean
  sortBy: string
}

interface MarketplaceSidebarProps {
  isOpen: boolean
  onClose: () => void
  filters: MarketplaceFilters
  onFiltersChange: (filters: MarketplaceFilters) => void
  className?: string
}

export function MarketplaceSidebar({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange,
  className 
}: MarketplaceSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    location: true,
    price: true,
    category: true,
    status: false,
    quality: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateFilters = (updates: Partial<MarketplaceFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      location: [],
      priceRange: [0, 10000000],
      status: 'all',
      rating: 0,
      verified: false,
      sortBy: 'latest'
    })
  }

  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value !== '' && value !== 'all'
    if (typeof value === 'number') return value > 0
    if (typeof value === 'boolean') return value
    return false
  }).length

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-lg border-r border-white/30 transform transition-transform duration-300 ease-in-out overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-white/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-base">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="bg-blue-500 text-xs h-5">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-xs h-7 px-2"
            >
              Clear All
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-3 space-y-3">
        {/* Search Filter */}
        <Card className="border-white/30 bg-white/50">
          <CardHeader 
            className="pb-1 px-3 py-2 cursor-pointer" 
            onClick={() => toggleSection('search')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <CardTitle className="text-sm">Search</CardTitle>
              </div>
              {expandedSections.search ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </CardHeader>
          {expandedSections.search && (
            <CardContent className="pt-0 px-3 pb-3">
              <Input
                placeholder="Search NFTs, assets..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full"
              />
            </CardContent>
          )}
        </Card>

        {/* Location Filter with Compact Map */}
        <Card className="border-white/30 bg-white/50">
          <CardHeader 
            className="pb-1 px-3 py-2 cursor-pointer" 
            onClick={() => toggleSection('location')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                <CardTitle className="text-sm">Location</CardTitle>
              </div>
              {expandedSections.location ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </CardHeader>
          {expandedSections.location && (
            <CardContent className="pt-0 px-3 pb-3">
              <CompactAfricaMap
                onCountrySelect={(country) => {
                  const newLocation = filters.location.includes(country)
                    ? filters.location.filter(l => l !== country)
                    : [...filters.location, country]
                  updateFilters({ location: newLocation })
                }}
                selectedCountries={filters.location}
              />
            </CardContent>
          )}
        </Card>

        {/* Price Range Filter */}
        <Card className="border-white/30 bg-white/50">
          <CardHeader 
            className="pb-1 px-3 py-2 cursor-pointer" 
            onClick={() => toggleSection('price')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <CardTitle className="text-sm">Price Range</CardTitle>
              </div>
              {expandedSections.price ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </CardHeader>
          {expandedSections.price && (
            <CardContent className="pt-0 px-3 pb-3 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>${filters.priceRange[0].toLocaleString()}</span>
                  <span>${filters.priceRange[1].toLocaleString()}</span>
                </div>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                  max={10000000}
                  min={0}
                  step={10000}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Min</label>
                  <Input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      updateFilters({ priceRange: [value, filters.priceRange[1]] })
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Max</label>
                  <Input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 10000000
                      updateFilters({ priceRange: [filters.priceRange[0], value] })
                    }}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Category Filter */}
        <Card className="border-white/30 bg-white/50">
          <CardHeader 
            className="pb-1 px-3 py-2 cursor-pointer" 
            onClick={() => toggleSection('category')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <CardTitle className="text-sm">Category</CardTitle>
              </div>
              {expandedSections.category ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </CardHeader>
          {expandedSections.category && (
            <CardContent className="pt-0 px-3 pb-3">
              <Select value={filters.category} onValueChange={(value) => updateFilters({ category: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="agriculture">🌾 Agriculture</SelectItem>
                  <SelectItem value="mining">⛏️ Mining & Extraction</SelectItem>
                  <SelectItem value="real-estate">🏠 Real Estate</SelectItem>
                  <SelectItem value="energy">⚡ Energy</SelectItem>
                  <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                  <SelectItem value="art">🎨 Art & Collectibles</SelectItem>
                  <SelectItem value="technology">💻 Technology</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          )}
        </Card>

        {/* Status Filter */}
        <Card className="border-white/30 bg-white/50">
          <CardHeader 
            className="pb-2 cursor-pointer" 
            onClick={() => toggleSection('status')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <CardTitle className="text-sm">Status</CardTitle>
              </div>
              {expandedSections.status ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections.status && (
            <CardContent className="pt-0">
              <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">🟢 Active</SelectItem>
                  <SelectItem value="auction">⚡ Live Auction</SelectItem>
                  <SelectItem value="sold">✅ Sold</SelectItem>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          )}
        </Card>

        {/* Quality Filter */}
        <Card className="border-white/30 bg-white/50">
          <CardHeader 
            className="pb-2 cursor-pointer" 
            onClick={() => toggleSection('quality')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <CardTitle className="text-sm">Quality & Trust</CardTitle>
              </div>
              {expandedSections.quality ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections.quality && (
            <CardContent className="pt-0 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Minimum Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Star
                      key={rating}
                      className={cn(
                        "h-5 w-5 cursor-pointer",
                        rating <= filters.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      )}
                      onClick={() => updateFilters({ rating: rating === filters.rating ? 0 : rating })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={filters.verified}
                  onCheckedChange={(checked: boolean) => updateFilters({ verified: !!checked })}
                />
                <label htmlFor="verified" className="text-sm">
                  ✅ Verified Assets Only
                </label>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Sort By */}
        <Card className="border-white/30 bg-white/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sort By
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">🕒 Latest</SelectItem>
                <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                <SelectItem value="popular">🔥 Most Popular</SelectItem>
                <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                <SelectItem value="ending-soon">⏰ Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-white/30 p-4">
        <Button 
          onClick={() => {
            // Apply filters - this could trigger a refetch or filter application
            console.log('Applying filters:', filters)
          }}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          Apply Filters ({activeFilterCount})
        </Button>
      </div>
    </div>
  )
}