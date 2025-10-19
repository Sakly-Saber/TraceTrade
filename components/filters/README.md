# Reusable Asset Filter Components - Integration Guide

This guide shows how to integrate the new reusable filter components into your existing pages.

## Available Components

### 1. Base Filter Components
- `CompactAssetFilter` - Collapsible filter panel, perfect for sidebars
- `HorizontalAssetFilter` - Inline filter bar, perfect for top navigation
- `AssetFilterTabs` - Tab-based filter interface, perfect for main content areas

### 2. Page-Specific Filters
- `MarketplaceFilters` - Complete filtering solution for marketplace pages
- `AuctionFilters` - Complete filtering solution for auction pages

## Integration Examples

### Example 1: Marketplace Page Integration

```tsx
'use client'

import { useState } from 'react'
import { MarketplaceFilters, type MarketplaceAsset } from '@/components/filters'

export default function MarketplacePage() {
  const [assets] = useState<MarketplaceAsset[]>([
    // Your asset data here
  ])
  const [filteredAssets, setFilteredAssets] = useState<MarketplaceAsset[]>(assets)

  return (
    <div>
      <MarketplaceFilters 
        assets={assets}
        onFilteredAssetsChange={setFilteredAssets}
        variant="horizontal" // or "compact" or "tabs"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map(asset => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  )
}
```

### Example 2: Auction Page Integration

```tsx
'use client'

import { useState } from 'react'
import { AuctionFilters, type AuctionLot } from '@/components/filters'

export default function AuctionsPage() {
  const [auctions] = useState<AuctionLot[]>([
    // Your auction data here
  ])
  const [filteredAuctions, setFilteredAuctions] = useState<AuctionLot[]>(auctions)

  return (
    <div>
      <AuctionFilters 
        auctions={auctions}
        onFilteredAuctionsChange={setFilteredAuctions}
        variant="horizontal" // or "compact" or "tabs"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAuctions.map(auction => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </div>
  )
}
```

### Example 3: Custom Page with Basic Filters

```tsx
'use client'

import { useState } from 'react'
import { HorizontalAssetFilter, type FilterSelection } from '@/components/filters'

export default function CustomPage() {
  const [filterSelection, setFilterSelection] = useState<FilterSelection>({
    industry: '',
    subIndustry: '',
    specificAsset: ''
  })

  const handleFilterChange = (selection: FilterSelection) => {
    setFilterSelection(selection)
    // Apply filters to your data
    console.log('Filter changed:', selection)
  }

  return (
    <div>
      <HorizontalAssetFilter 
        onFilterChange={handleFilterChange}
        options={{
          showSpecificAssets: true,
          placeholder: {
            industry: "Choose industry...",
            subIndustry: "Choose category...",
            specificAsset: "Choose asset type..."
          }
        }}
        initialSelection={filterSelection}
      />
      
      {/* Your filtered content here */}
    </div>
  )
}
```

## Filter Variants

### Compact Filter (Sidebar)
```tsx
<CompactAssetFilter 
  onFilterChange={handleFilterChange}
  options={{ showSpecificAssets: true }}
  className="w-full max-w-sm"
/>
```

### Horizontal Filter (Top Bar)
```tsx
<HorizontalAssetFilter 
  onFilterChange={handleFilterChange}
  options={{ showSpecificAssets: true }}
  className="w-full"
/>
```

### Tab-based Filter (Main Content)
```tsx
<AssetFilterTabs 
  onFilterChange={handleFilterChange}
  options={{ showSpecificAssets: true }}
  className="w-full"
/>
```

## Configuration Options

### FilterOptions Interface
```tsx
interface FilterOptions {
  showSpecificAssets?: boolean    // Show third-tier asset selection
  placeholder?: {
    industry?: string
    subIndustry?: string
    specificAsset?: string
  }
  size?: 'sm' | 'md' | 'lg'      // Component size
  variant?: 'default' | 'compact' | 'detailed'  // Visual style
}
```

### FilterSelection Interface
```tsx
interface FilterSelection {
  industry: string      // Industry ID
  subIndustry: string   // Sub-industry ID
  specificAsset: string // Specific asset name
}
```

## Integration with Existing State

```tsx
const [filters, setFilters] = useState({
  industry: 'mining-extraction',
  subIndustry: 'copper-mining',
  specificAsset: 'Copper Ore'
})

<HorizontalAssetFilter 
  onFilterChange={(selection) => {
    setFilters(selection)
    // Update your filtered data
  }}
  initialSelection={filters}
  options={{
    showSpecificAssets: true,
    placeholder: {
      industry: "All Industries",
      subIndustry: "All Categories",
      specificAsset: "All Assets"
    }
  }}
/>
```

## Features

✅ **3-Tier Hierarchical Filtering** - Industry → Sub-Industry → Specific Asset  
✅ **Beautiful Animations** - Smooth transitions and hover effects  
✅ **Consistent Styling** - Matches existing design system  
✅ **TypeScript Support** - Full type safety and IntelliSense  
✅ **Flexible Configuration** - Customizable placeholders and options  
✅ **Performance Optimized** - Efficient filtering algorithms  
✅ **Responsive Design** - Works on all screen sizes  
✅ **Accessibility** - ARIA labels and keyboard navigation  

## Next Steps

1. Import the desired filter component into your page
2. Set up state management for filtered data
3. Configure filter options and placeholders
4. Style the component to match your page layout
5. Test the filtering functionality with your data