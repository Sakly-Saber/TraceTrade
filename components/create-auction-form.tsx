"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Gavel, DollarSign, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWallet } from "@/hooks/use-wallet"

export interface AuctionFormData {
  nftTokenId: string
  nftSerialNumber: number
  title: string
  description: string
  category: string
  location: string
  reservePrice: number
  startingBid: number
  duration: number // in hours
  endDate: Date | undefined
  terms: string
}

interface CreateAuctionFormProps {
  nft?: {
    tokenId: string
    serialNumber: number
    name: string
    description: string
    image: string
  }
  onSubmit: (data: AuctionFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function CreateAuctionForm({ nft, onSubmit, onCancel, isLoading }: CreateAuctionFormProps) {
  const [formData, setFormData] = useState<AuctionFormData>({
    nftTokenId: nft?.tokenId || '',
    nftSerialNumber: nft?.serialNumber || 1,
    title: nft?.name || '',
    description: nft?.description || '',
    category: 'mining',
    location: 'Nigeria',
    reservePrice: 1000000,
    startingBid: 500000,
    duration: 24, // 24 hours default
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    terms: 'Standard auction terms apply. Payment required within 48 hours of auction end.'
  })

  const { isConnected } = useWallet()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    onSubmit(formData)
  }

  const updateFormData = (updates: Partial<AuctionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleDurationChange = (hours: number) => {
    const newEndDate = new Date(Date.now() + hours * 60 * 60 * 1000)
    updateFormData({ duration: hours, endDate: newEndDate })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <Gavel className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Create Live Auction</h2>
        <p className="text-muted-foreground">
          List your NFT for auction and let bidders compete for it
        </p>
      </div>

      {/* NFT Preview */}
      {nft && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">{nft.name}</h3>
                <p className="text-sm text-muted-foreground">Token ID: {nft.tokenId}</p>
                <p className="text-sm text-muted-foreground">Serial: #{nft.serialNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Auction Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Enter auction title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Describe your NFT and what makes it special..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => updateFormData({ category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mining">⛏️ Mining & Extraction</SelectItem>
                    <SelectItem value="agriculture">🌾 Agriculture</SelectItem>
                    <SelectItem value="real-estate">🏠 Real Estate</SelectItem>
                    <SelectItem value="energy">⚡ Energy</SelectItem>
                    <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                    <SelectItem value="art">🎨 Art & Collectibles</SelectItem>
                    <SelectItem value="technology">💻 Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={formData.location} onValueChange={(value) => updateFormData({ location: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                    <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                    <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                    <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                    <SelectItem value="Egypt">🇪🇬 Egypt</SelectItem>
                    <SelectItem value="Morocco">🇲🇦 Morocco</SelectItem>
                    <SelectItem value="Ethiopia">🇪🇹 Ethiopia</SelectItem>
                    <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startingBid">Starting Bid ($)</Label>
                <Input
                  id="startingBid"
                  type="number"
                  value={formData.startingBid}
                  onChange={(e) => updateFormData({ startingBid: parseInt(e.target.value) || 0 })}
                  min="1000"
                  step="1000"
                  required
                />
                <p className="text-xs text-muted-foreground">Minimum bid amount</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservePrice">Reserve Price ($)</Label>
                <Input
                  id="reservePrice"
                  type="number"
                  value={formData.reservePrice}
                  onChange={(e) => updateFormData({ reservePrice: parseInt(e.target.value) || 0 })}
                  min={formData.startingBid}
                  step="1000"
                  required
                />
                <p className="text-xs text-muted-foreground">Minimum price to sell</p>
              </div>
            </div>

            {formData.reservePrice < formData.startingBid && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Reserve price should be higher than or equal to starting bid
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auction Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Auction Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[1, 6, 12, 24, 48, 72, 168].map((hours) => (
                  <Button
                    key={hours}
                    type="button"
                    variant={formData.duration === hours ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDurationChange(hours)}
                    className="text-xs"
                  >
                    {hours < 24 ? `${hours}h` : `${hours / 24}d`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP 'at' p") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => updateFormData({ endDate: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="terms">Auction Terms</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => updateFormData({ terms: e.target.value })}
                placeholder="Enter any specific terms or conditions for this auction..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            disabled={isLoading || !isConnected || formData.reservePrice < formData.startingBid}
          >
            {isLoading ? (
              <>Creating Auction...</>
            ) : (
              <>
                <Gavel className="h-4 w-4 mr-2" />
                Create Auction
              </>
            )}
          </Button>
        </div>

        {!isConnected && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
            <p className="text-sm text-orange-800">
              🔗 Please connect your wallet to create an auction
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

// Simplified version for marketplace listing
export function CreateListingForm({ nft, onSubmit, onCancel, isLoading }: CreateAuctionFormProps) {
  const [formData, setFormData] = useState<AuctionFormData>({
    nftTokenId: nft?.tokenId || '',
    nftSerialNumber: nft?.serialNumber || 1,
    title: nft?.name || '',
    description: nft?.description || '',
    category: 'mining',
    location: 'Nigeria',
    reservePrice: 1000000,
    startingBid: 1000000, // Same as reserve for fixed price
    duration: 0, // No duration for marketplace listing
    endDate: undefined,
    terms: 'Fixed price listing. Payment required upon purchase.'
  })

  const { isConnected } = useWallet()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    onSubmit(formData)
  }

  const updateFormData = (updates: Partial<AuctionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <div className="text-2xl">🛒</div>
        </div>
        <h2 className="text-2xl font-bold">List on Marketplace</h2>
        <p className="text-muted-foreground">
          List your NFT for fixed price sale on the marketplace
        </p>
      </div>

      {/* NFT Preview */}
      {nft && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">{nft.name}</h3>
                <p className="text-sm text-muted-foreground">Token ID: {nft.tokenId}</p>
                <p className="text-sm text-muted-foreground">Serial: #{nft.serialNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Listing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Listing Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Enter listing title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Describe your NFT..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => updateFormData({ category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mining">⛏️ Mining & Extraction</SelectItem>
                    <SelectItem value="agriculture">🌾 Agriculture</SelectItem>
                    <SelectItem value="real-estate">🏠 Real Estate</SelectItem>
                    <SelectItem value="energy">⚡ Energy</SelectItem>
                    <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                    <SelectItem value="art">🎨 Art & Collectibles</SelectItem>
                    <SelectItem value="technology">💻 Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={formData.location} onValueChange={(value) => updateFormData({ location: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                    <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                    <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                    <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                    <SelectItem value="Egypt">🇪🇬 Egypt</SelectItem>
                    <SelectItem value="Morocco">🇲🇦 Morocco</SelectItem>
                    <SelectItem value="Ethiopia">🇪🇹 Ethiopia</SelectItem>
                    <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fixed Price
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Sale Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.reservePrice}
                onChange={(e) => {
                  const price = parseInt(e.target.value) || 0
                  updateFormData({ reservePrice: price, startingBid: price })
                }}
                min="1000"
                step="1000"
                required
              />
              <p className="text-xs text-muted-foreground">Fixed price for immediate sale</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            disabled={isLoading || !isConnected}
          >
            {isLoading ? (
              <>Creating Listing...</>
            ) : (
              <>
                🛒 List for Sale
              </>
            )}
          </Button>
        </div>

        {!isConnected && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
            <p className="text-sm text-orange-800">
              🔗 Please connect your wallet to list your NFT
            </p>
          </div>
        )}
      </form>
    </div>
  )
}