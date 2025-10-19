'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Coins, Calendar, Users, Activity } from "lucide-react"

// Types
export interface TokenCollection {
  tokenId: string
  name: string
  symbol: string
  category: string
  assetType: string
  maxSupply: number
  description: string
  createdAt: string
  status: 'active' | 'pending' | 'inactive'
}

export interface CreateTokenConfig {
  name: string
  symbol: string
  category: string
  assetType: string
  maxSupply: number
  description: string
}

interface CollectionSelectorProps {
  selectedCollection: TokenCollection | null
  onCollectionSelect: (collection: TokenCollection) => void
  onCreateNew: (config: CreateTokenConfig) => Promise<void>
}

// Mock collections data - replace with actual API call
const mockCollections: TokenCollection[] = [
  {
    tokenId: "0.0.12345",
    name: "African Commodities Collection",
    symbol: "AFCM",
    category: "Agriculture",
    assetType: "Commodity",
    maxSupply: 1000000,
    description: "Tokenized agricultural commodities from across Africa",
    createdAt: "2024-01-15T10:30:00Z",
    status: "active"
  },
  {
    tokenId: "0.0.67890",
    name: "Mining Assets Collection",
    symbol: "MINE",
    category: "Mining",
    assetType: "Natural Resource",
    maxSupply: 500000,
    description: "Digital tokens representing mining rights and mineral assets",
    createdAt: "2024-01-10T14:22:00Z",
    status: "active"
  },
  {
    tokenId: "0.0.11111",
    name: "Industrial Equipment Collection",
    symbol: "INEQ",
    category: "Manufacturing",
    assetType: "Equipment",
    maxSupply: 250000,
    description: "Tokenized industrial machinery and equipment assets",
    createdAt: "2024-01-05T09:15:00Z",
    status: "pending"
  }
]

export function CollectionSelector({ selectedCollection, onCollectionSelect, onCreateNew }: CollectionSelectorProps) {
  const [collections, setCollections] = useState<TokenCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state for creating new collection
  const [newCollection, setNewCollection] = useState<CreateTokenConfig>({
    name: '',
    symbol: '',
    category: '',
    assetType: '',
    maxSupply: 1000000,
    description: ''
  })

  // Load collections on mount
  useEffect(() => {
    const loadCollections = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/tokens/list')
        // const data = await response.json()
        // setCollections(data.collections || [])
        
        // For now, use mock data
        setTimeout(() => {
          setCollections(mockCollections)
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error('Failed to load collections:', error)
        setCollections(mockCollections) // Fallback to mock data
        setIsLoading(false)
      }
    }

    loadCollections()
  }, [])

  const handleCreateCollection = async () => {
    if (!newCollection.name || !newCollection.symbol || !newCollection.category) {
      alert('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    try {
      await onCreateNew(newCollection)
      setIsDialogOpen(false)
      setNewCollection({
        name: '',
        symbol: '',
        category: '',
        assetType: '',
        maxSupply: 1000000,
        description: ''
      })
    } catch (error) {
      console.error('Failed to create collection:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const categoryOptions = [
    'Agriculture',
    'Mining',
    'Manufacturing',
    'Energy',
    'Real Estate',
    'Transportation',
    'Technology',
    'Other'
  ]

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading collections...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create New Collection Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Select Collection</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Token Collection</DialogTitle>
              <DialogDescription>
                Set up a new token collection for your assets on Hedera blockchain.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., African Gold Collection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  value={newCollection.symbol}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  placeholder="e.g., AGLD"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={newCollection.category} 
                  onValueChange={(value) => setNewCollection(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <Input
                  id="assetType"
                  value={newCollection.assetType}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, assetType: e.target.value }))}
                  placeholder="e.g., Commodity, Equipment, Rights"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSupply">Max Supply</Label>
                <Input
                  id="maxSupply"
                  type="number"
                  value={newCollection.maxSupply}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, maxSupply: parseInt(e.target.value) || 1000000 }))}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your token collection..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCollection}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? 'Creating...' : 'Create Collection'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections Found</h3>
          <p className="text-gray-600 mb-4">Create your first token collection to get started.</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card 
              key={collection.tokenId}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedCollection?.tokenId === collection.tokenId 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onCollectionSelect(collection)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{collection.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Token ID: {collection.tokenId}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={collection.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {collection.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Symbol:</span>
                    <span className="font-medium">{collection.symbol}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{collection.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Max Supply:</span>
                    <span className="font-medium">{collection.maxSupply.toLocaleString()}</span>
                  </div>

                  {collection.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {collection.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Collection Summary */}
      {selectedCollection && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-900">Selected Collection</span>
          </div>
          <p className="text-blue-800">
            <span className="font-semibold">{selectedCollection.name}</span> ({selectedCollection.symbol}) - {selectedCollection.category}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Token ID: {selectedCollection.tokenId}
          </p>
        </div>
      )}
    </div>
  )
}
