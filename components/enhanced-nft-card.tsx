"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BuyNowModal } from "@/components/buy-now-modal"
import { 
  Heart, 
  Eye, 
  Clock, 
  Gavel, 
  ShoppingCart,
  MapPin,
  TrendingUp,
  ExternalLink,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketplaceItem } from "@/lib/services/marketplaceService"

interface EnhancedNFTCardProps {
  id: string
  name: string
  description: string
  image: string
  price: number
  currency?: string
  type: 'marketplace' | 'auction'
  
  // Marketplace specific
  seller?: string
  verified?: boolean
  priceHbar?: number
  collection?: string
  
  // Auction specific
  currentBid?: number
  totalBids?: number
  auctionEndTime?: Date | string
  reservePrice?: number
  
  // Common
  category?: string
  location?: string[]
  views?: number
  likes?: number
  tokenId?: string
  serialNumber?: number
  
  // Actions
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onViewDetails?: () => void
  onPurchase?: () => void
  onPlaceBid?: () => void
  isOwner?: boolean
  
  // Full listing data for modal
  listingData?: MarketplaceItem
  onRefresh?: () => void
}

export function EnhancedNFTCard({
  id,
  name,
  description,
  image,
  price,
  currency = "ℏ",
  type,
  seller,
  verified,
  priceHbar,
  collection,
  currentBid,
  totalBids,
  auctionEndTime,
  reservePrice,
  category,
  location,
  views,
  likes,
  tokenId,
  serialNumber,
  isFavorite = false,
  onToggleFavorite,
  onViewDetails,
  onPurchase,
  onPlaceBid,
  isOwner = false,
  listingData,
  onRefresh
}: EnhancedNFTCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)

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

  const displayPrice = type === 'auction' && currentBid ? currentBid : price
  const isAuctionActive = type === 'auction' && auctionEndTime && new Date(auctionEndTime) > new Date()

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl backdrop-blur-xl",
        "bg-gradient-to-br from-white/60 via-white/40 to-blue-50/30",
        "border border-white/30 shadow-lg hover:shadow-2xl",
        "transition-all duration-500 hover:scale-[1.02] transform"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Badges - Top Right Corner */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {verified && (
          <Badge className="bg-green-500 text-white text-xs shadow-md">
            ✓ Verified
          </Badge>
        )}
        {type === 'auction' && isAuctionActive && (
          <Badge className="bg-red-500 text-white text-xs shadow-md animate-pulse">
            🔴 Live
          </Badge>
        )}
        {category && (
          <Badge className="bg-blue-500/90 text-white text-xs shadow-md">
            {category}
          </Badge>
        )}
      </div>

      {/* NFT Image - Compact */}
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 group">
        {/* Use regular img tag - matches dashboard implementation */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              const placeholder = document.createElement('div')
              placeholder.className = 'flex flex-col items-center justify-center h-full space-y-2 relative'
              placeholder.innerHTML = `
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                  <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span class="text-xs text-gray-500">Image unavailable</span>
              `
              parent.appendChild(placeholder)
            }
          }}
        />
        
        {/* Overlay with quick actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
          <Button
            size="sm"
            className="bg-white/95 hover:bg-white text-gray-900 text-xs shadow-lg"
            onClick={onViewDetails}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </Button>
          {onToggleFavorite && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "bg-white/95 hover:bg-white shadow-lg",
                isFavorite && "text-red-500"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
              }}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
          )}
        </div>

        {/* Token ID Badge - Top Left */}
        {tokenId && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
            {tokenId.slice(0, 10)}...
          </div>
        )}
      </div>

      {/* Content - Compact */}
      <div className="p-4 space-y-3">
        {/* Title & Description - Compact */}
        <div>
          <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
            {description}
          </p>
        </div>

        {/* Stats - Horizontal Compact Row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{views}</span>
              </div>
            )}
            {likes !== undefined && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{likes}</span>
              </div>
            )}
            {type === 'auction' && totalBids !== undefined && (
              <div className="flex items-center gap-1">
                <Gavel className="w-3 h-3" />
                <span>{totalBids}</span>
              </div>
            )}
          </div>
          
          {/* Location - Compact */}
          {location && location.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{location[0]}</span>
            </div>
          )}
        </div>

        {/* Price Section - Compact */}
        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-xl p-3 backdrop-blur-sm border border-blue-100/50">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">
              {type === 'auction' ? (currentBid ? 'Current Bid' : 'Starting') : 'Price'}
            </div>
            <div className="text-lg font-bold text-gray-900 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>{currency}{displayPrice.toLocaleString()}</span>
            </div>
          
            {/* Auction Timer - Compact */}
            {type === 'auction' && auctionEndTime && (
              <div className="flex items-center gap-1.5 text-xs mt-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className={cn(
                  "font-semibold",
                  isAuctionActive ? "text-blue-600" : "text-gray-500"
                )}>
                  {isAuctionActive ? getTimeRemaining(auctionEndTime) : "Ended"}
                </span>
              </div>
            )}

            {/* Reserve Price - Compact */}
            {type === 'auction' && reservePrice && (
              <div className="text-[10px] text-gray-500 mt-1">
                Reserve: {currency}{reservePrice.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Compact Grid */}
        <div className="grid gap-2 border-t border-white/20 pt-3">
          {/* Main Action Button */}
          {!isOwner && (
            <Button
              className={cn(
                "w-full transition-all duration-300 text-xs py-2 shadow-md hover:shadow-lg",
                type === 'auction'
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
                "text-white"
              )}
              onClick={() => {
                if (type === 'auction') {
                  onPlaceBid?.()
                } else {
                  setShowBuyModal(true)
                }
              }}
            >
              {type === 'auction' ? (
                <>
                  <Gavel className="w-3 h-3 mr-1.5" />
                  Place Bid
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 mr-1.5" />
                  Buy Now
                </>
              )}
            </Button>
          )}

          {isOwner && (
            <Badge className="w-full justify-center py-2 bg-gray-100 text-gray-700 text-xs">
              Your Listing
            </Badge>
          )}

          {/* Seller Info - Compact */}
          {type === 'marketplace' && seller && (
            <div className="text-center pt-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Seller</div>
              <div className="text-xs font-mono text-gray-600 mt-0.5">
                {seller.slice(0, 6)}...{seller.slice(-4)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Now Modal */}
      {listingData && (
        <BuyNowModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          listing={listingData}
          onSuccess={() => {
            setShowBuyModal(false)
            onRefresh?.()
          }}
        />
      )}
    </div>
  )
}
