'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronRight,
  Factory,
  Home,
  Wheat,
  Zap,
  Mountain,
  Building,
  Truck,
  Leaf,
  HardHat,
  Anchor,
  DollarSign
} from "lucide-react"
import { INDUSTRY_DATA } from '@/lib/data/industry-filters'

// Type definitions for filter interfaces
export interface FilterSelection {
  industry: string
  subIndustry: string
  specificAsset: string
}

export interface FilterOptions {
  showSpecificAssets?: boolean
  placeholder?: {
    industry?: string
    subIndustry?: string
    specificAsset?: string
  }
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'detailed'
}

export interface ReusableFilterProps {
  onFilterChange: (selection: FilterSelection) => void
  options?: FilterOptions
  initialSelection?: Partial<FilterSelection>
  className?: string
}

const industryIcons: Record<string, any> = {
  'mining-extraction': Mountain,
  'real-estate': Home,
  'agriculture': Wheat,
  'energy': Zap,
  'manufacturing': Factory,
  'construction': Building,
  'transportation': Truck,
  'environmental': Leaf,
  'infrastructure': HardHat,
  'maritime': Anchor,
  'financial-instruments': DollarSign
}

export function CompactAssetFilter({ 
  onFilterChange, 
  options = {}, 
  initialSelection = {},
  className = ""
}: ReusableFilterProps) {
  const [selection, setSelection] = useState<FilterSelection>({
    industry: initialSelection.industry || '',
    subIndustry: initialSelection.subIndustry || '',
    specificAsset: initialSelection.specificAsset || ''
  })
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSelectionChange = (key: keyof FilterSelection, value: string) => {
    const newSelection = { ...selection, [key]: value }
    
    // Reset dependent fields
    if (key === 'industry') {
      newSelection.subIndustry = ''
      newSelection.specificAsset = ''
    } else if (key === 'subIndustry') {
      newSelection.specificAsset = ''
    }
    
    setSelection(newSelection)
    onFilterChange(newSelection)
  }

  const clearFilters = () => {
    const emptySelection = { industry: '', subIndustry: '', specificAsset: '' }
    setSelection(emptySelection)
    onFilterChange(emptySelection)
  }

  const hasActiveFilters = selection.industry || selection.subIndustry || selection.specificAsset

  const selectedIndustryData = selection.industry ? INDUSTRY_DATA.find(ind => ind.id === selection.industry) : null
  const selectedSubIndustryData = selectedIndustryData && selection.subIndustry 
    ? selectedIndustryData.subIndustries.find(sub => sub.id === selection.subIndustry) : null

  return (
    <Card className={`bg-white/80 backdrop-blur-sm border border-gray-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <CardTitle className="text-lg font-semibold">Filter Assets</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selection.industry && (
              <Badge variant="secondary" className="text-xs">
                {selectedIndustryData?.name}
              </Badge>
            )}
            {selection.subIndustry && (
              <Badge variant="secondary" className="text-xs">
                {selectedSubIndustryData?.name}
              </Badge>
            )}
            {selection.specificAsset && (
              <Badge variant="secondary" className="text-xs">
                {selection.specificAsset}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Industry Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Industry</label>
            <Select value={selection.industry} onValueChange={(value) => handleSelectionChange('industry', value)}>
              <SelectTrigger>
                <SelectValue placeholder={options.placeholder?.industry || "Select industry..."} />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_DATA.map((industry) => {
                  const IconComponent = industryIcons[industry.id] || Factory
                  return (
                    <SelectItem key={industry.id} value={industry.id}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {industry.name}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-Industry Selection */}
          {selection.industry && selectedIndustryData && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sub-Industry</label>
              <Select value={selection.subIndustry} onValueChange={(value) => handleSelectionChange('subIndustry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={options.placeholder?.subIndustry || "Select sub-industry..."} />
                </SelectTrigger>
                <SelectContent>
                  {selectedIndustryData.subIndustries.map((subIndustry) => (
                    <SelectItem key={subIndustry.id} value={subIndustry.id}>
                      {subIndustry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Specific Asset Selection */}
          {options.showSpecificAssets && selection.subIndustry && selectedSubIndustryData && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Specific Asset</label>
              <Select value={selection.specificAsset} onValueChange={(value) => handleSelectionChange('specificAsset', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={options.placeholder?.specificAsset || "Select specific asset..."} />
                </SelectTrigger>
                <SelectContent>
                  {selectedSubIndustryData.specificAssets.map((asset) => (
                    <SelectItem key={asset} value={asset}>
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function HorizontalAssetFilter({ 
  onFilterChange, 
  options = {}, 
  initialSelection = {},
  className = ""
}: ReusableFilterProps) {
  const [selection, setSelection] = useState<FilterSelection>({
    industry: initialSelection.industry || '',
    subIndustry: initialSelection.subIndustry || '',
    specificAsset: initialSelection.specificAsset || ''
  })

  const handleSelectionChange = (key: keyof FilterSelection, value: string) => {
    const newSelection = { ...selection, [key]: value }
    
    // Reset dependent fields
    if (key === 'industry') {
      newSelection.subIndustry = ''
      newSelection.specificAsset = ''
    } else if (key === 'subIndustry') {
      newSelection.specificAsset = ''
    }
    
    setSelection(newSelection)
    onFilterChange(newSelection)
  }

  const selectedIndustryData = selection.industry ? INDUSTRY_DATA.find(ind => ind.id === selection.industry) : null
  const selectedSubIndustryData = selectedIndustryData && selection.subIndustry 
    ? selectedIndustryData.subIndustries.find(sub => sub.id === selection.subIndustry) : null

  return (
    <div className={`flex flex-wrap items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 ${className}`}>
      {/* Industry Selection */}
      <div className="flex-1 min-w-48">
        <Select value={selection.industry} onValueChange={(value) => handleSelectionChange('industry', value)}>
          <SelectTrigger>
            <SelectValue placeholder={options.placeholder?.industry || "All Industries"} />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_DATA.map((industry) => {
              const IconComponent = industryIcons[industry.id] || Factory
              return (
                <SelectItem key={industry.id} value={industry.id}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    {industry.name}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-Industry Selection */}
      <div className="flex-1 min-w-48">
        <Select 
          value={selection.subIndustry} 
          onValueChange={(value) => handleSelectionChange('subIndustry', value)}
          disabled={!selection.industry}
        >
          <SelectTrigger>
            <SelectValue placeholder={options.placeholder?.subIndustry || "All Sub-Industries"} />
          </SelectTrigger>
          <SelectContent>
            {selectedIndustryData?.subIndustries.map((subIndustry) => (
              <SelectItem key={subIndustry.id} value={subIndustry.id}>
                {subIndustry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Specific Asset Selection */}
      {options.showSpecificAssets && (
        <div className="flex-1 min-w-48">
          <Select 
            value={selection.specificAsset} 
            onValueChange={(value) => handleSelectionChange('specificAsset', value)}
            disabled={!selection.subIndustry}
          >
            <SelectTrigger>
              <SelectValue placeholder={options.placeholder?.specificAsset || "All Assets"} />
            </SelectTrigger>
            <SelectContent>
              {selectedSubIndustryData?.specificAssets.map((asset) => (
                <SelectItem key={asset} value={asset}>
                  {asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filter Button */}
      {(selection.industry || selection.subIndustry || selection.specificAsset) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const emptySelection = { industry: '', subIndustry: '', specificAsset: '' }
            setSelection(emptySelection)
            onFilterChange(emptySelection)
          }}
          className="whitespace-nowrap"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}

export function AssetFilterTabs({ 
  onFilterChange, 
  options = {}, 
  initialSelection = {},
  className = ""
}: ReusableFilterProps) {
  const [selection, setSelection] = useState<FilterSelection>({
    industry: initialSelection.industry || '',
    subIndustry: initialSelection.subIndustry || '',
    specificAsset: initialSelection.specificAsset || ''
  })

  const handleIndustrySelect = (industryId: string) => {
    const newSelection = { 
      industry: industryId, 
      subIndustry: '', 
      specificAsset: '' 
    }
    setSelection(newSelection)
    onFilterChange(newSelection)
  }

  const selectedIndustryData = selection.industry ? INDUSTRY_DATA.find(ind => ind.id === selection.industry) : null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Industry Tabs */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Industries</h3>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_DATA.map((industry) => {
            const IconComponent = industryIcons[industry.id] || Factory
            const isSelected = selection.industry === industry.id
            
            return (
              <button
                key={industry.id}
                onClick={() => handleIndustrySelect(industry.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {industry.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sub-Industry Selection */}
      {selectedIndustryData && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Sub-Industries</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {selectedIndustryData.subIndustries.map((subIndustry) => {
              const isSelected = selection.subIndustry === subIndustry.id
              
              return (
                <button
                  key={subIndustry.id}
                  onClick={() => {
                    const newSelection = { 
                      ...selection, 
                      subIndustry: subIndustry.id, 
                      specificAsset: '' 
                    }
                    setSelection(newSelection)
                    onFilterChange(newSelection)
                  }}
                  className={`p-3 rounded-lg text-sm text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-200 text-blue-800'
                      : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{subIndustry.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {subIndustry.specificAssets.length} assets
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Export all components and types
export { INDUSTRY_DATA } from '@/lib/data/industry-filters'