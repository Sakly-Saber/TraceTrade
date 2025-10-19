"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react"
import { type EnrichedNFT } from "@/lib/services/richNFTService"
import { AllowanceModal } from "./allowance-modal"
import { ListMarketplaceDialog } from "./list-marketplace-dialog"
import { CreateAuctionDialog } from "./create-auction-dialog"
import { CancelListingDialog } from "./cancel-listing-dialog"
import { StopAuctionDialog } from "./stop-auction-dialog"

interface NFTCollectionProps {
  nfts: EnrichedNFT[]
  isLoading: boolean
  walletAddress?: string | null
  userId?: string | null
  onRefresh?: () => void | Promise<void>
}

export function NFTCollection({ nfts, isLoading, walletAddress, userId, onRefresh }: NFTCollectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading NFTs...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  // Handle undefined or null nfts array
  const nftList = nfts || []

  if (nftList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">My NFT Collection</CardTitle>
          <CardDescription>No NFTs found in your wallet</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Your NFT collection will appear here once you own some NFTs on Hedera.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">My NFT Collection</CardTitle>
        <CardDescription>
          {nftList.length} NFT{nftList.length !== 1 ? 's' : ''} in your wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nftList.map((nft) => (
            <NFTCard 
              key={`${nft.tokenId}-${nft.serialNumber}`} 
              nft={nft} 
              walletAddress={walletAddress}
              userId={userId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface NFTCardProps {
  nft: EnrichedNFT
  walletAddress?: string | null
  userId?: string | null
  onRefresh?: () => void | Promise<void>
}

interface NFTStatus {
  isListed: boolean
  isAuctioned: boolean
  listingId?: string
  auctionId?: string
}

function NFTCard({ nft, walletAddress, userId, onRefresh }: NFTCardProps) {
  const [isListing, setIsListing] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isCreatingAuction, setIsCreatingAuction] = useState(false)
  const [isCancellingAuction, setIsCancellingAuction] = useState(false)
  const [nftStatus, setNftStatus] = useState<NFTStatus>({ isListed: false, isAuctioned: false })
  const [statusLoading, setStatusLoading] = useState(true)
  
  // Enhanced Dialog States
  const [showListMarketplaceDialog, setShowListMarketplaceDialog] = useState(false)
  const [showCreateAuctionDialog, setShowCreateAuctionDialog] = useState(false)
  const [showCancelListingDialog, setShowCancelListingDialog] = useState(false)
  const [showStopAuctionDialog, setShowStopAuctionDialog] = useState(false)
  
  // Legacy allowance modal state (may be deprecated)
  const [showAllowanceModal, setShowAllowanceModal] = useState(false)
  const [allowanceMode, setAllowanceMode] = useState<'grant' | 'revoke'>('grant')
  const [allowanceType, setAllowanceType] = useState<'listing' | 'auction'>('listing')
  const [pendingPrice, setPendingPrice] = useState<number | undefined>(undefined)
  const [pendingListingId, setPendingListingId] = useState<string | null>(null)
  const [pendingAuctionData, setPendingAuctionData] = useState<any>(null)

  // Fetch NFT status on component mount
  useEffect(() => {
    fetchNFTStatus()
  }, [nft.tokenId, nft.serialNumber])

  const fetchNFTStatus = async () => {
    try {
      setStatusLoading(true)
      const response = await fetch(`/api/nft-status?tokenId=${nft.tokenId}&serialNumber=${nft.serialNumber}`)
      if (response.ok) {
        const data = await response.json()
        setNftStatus({
          isListed: data.isListed || false,
          isAuctioned: data.isAuctioned || false,
          listingId: data.listingId,
          auctionId: data.auctionId
        })
      }
    } catch (error) {
      console.error('Failed to fetch NFT status:', error)
    } finally {
      setStatusLoading(false)
    }
  }
  
  const handleListOnMarketplace = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first')
      return
    }

    // Show enhanced marketplace listing dialog
    setShowListMarketplaceDialog(true)
  }

  const handleRemoveFromMarketplace = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first')
      return
    }

    // Show enhanced cancel listing dialog
    setShowCancelListingDialog(true)
  }

  const handleCreateAuction = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first')
      return
    }

    // Show enhanced auction creation dialog
    setShowCreateAuctionDialog(true)
  }

  const handleCancelAuction = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first')
      return
    }

    // Show enhanced stop auction dialog
    setShowStopAuctionDialog(true)
  }

  // Handle successful allowance grant/revoke
  const handleAllowanceSuccess = async (transactionId: string) => {
    console.log('✅ [ALLOWANCE] Transaction completed:', transactionId)

    try {
      if (allowanceMode === 'grant') {
        // Update database with allowance info
        const response = await fetch('/api/allowance/grant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: allowanceType,
            tokenId: nft.tokenId,
            serialNumber: nft.serialNumber,
            seller: walletAddress,
            allowanceTransactionId: transactionId,
            priceHbar: pendingPrice
          })
        })

        const data = await response.json()
        if (data.success) {
          alert(`✅ ${allowanceType === 'listing' ? 'Listing is now active' : 'Auction is now live'}!\n\nYour NFT is now ${allowanceType === 'listing' ? 'available for purchase' : 'accepting bids'}.`)
          await fetchNFTStatus()
          // Refresh only NFT data instead of entire page
          if (onRefresh) {
            await onRefresh()
          }
        } else {
          alert(`⚠️ Allowance granted but database update failed:\n\n${data.error}\n\nPlease contact support with transaction ID: ${transactionId}`)
        }
      } else {
        // Revoke allowance
        const response = await fetch('/api/allowance/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: allowanceType,
            tokenId: nft.tokenId,
            serialNumber: nft.serialNumber,
            seller: walletAddress,
            revokeTransactionId: transactionId
          })
        })

        const data = await response.json()
        if (data.success) {
          alert(`✅ ${allowanceType === 'listing' ? 'Listing removed' : 'Auction cancelled'} successfully!`)
          await fetchNFTStatus()
          // Refresh only NFT data instead of entire page
          if (onRefresh) {
            await onRefresh()
          }
        } else {
          alert(`⚠️ Allowance revoked but database update failed:\n\n${data.error}\n\nPlease contact support.`)
        }
      }
    } catch (error: any) {
      console.error('❌ Database update error:', error)
      alert(`⚠️ Blockchain transaction succeeded but database update failed:\n\n${error.message}\n\nTransaction ID: ${transactionId}\n\nPlease contact support.`)
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/60 via-white/40 to-blue-50/30 border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      {/* Glassmorphic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Status Badge - Top Right */}
      {!statusLoading && (nftStatus.isListed || nftStatus.isAuctioned) && (
        <div className="absolute top-3 right-3 z-10">
          {nftStatus.isListed && (
            <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-0 shadow-lg">
              📍 Listed
            </Badge>
          )}
          {nftStatus.isAuctioned && (
            <Badge className="bg-orange-500/90 backdrop-blur-sm text-white border-0 shadow-lg">
              🔨 In Auction
            </Badge>
          )}
        </div>
      )}

      {/* NFT Image */}
      <div className="relative aspect-square overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50" />
        {nft.image ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="relative w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="flex flex-col items-center justify-center h-full space-y-2 relative">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                      <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600">No Image</span>
                  </div>
                `
              }
            }}
          />
        ) : (
          <div className="relative flex flex-col items-center justify-center h-full space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">No Image</span>
          </div>
        )}
      </div>

      {/* NFT Details - Compact */}
      <div className="relative p-4 space-y-3">
        {/* Title & ID */}
        <div>
          <h3 className="font-semibold text-base text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {nft.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-medium text-gray-500">
              {nft.symbol}
            </p>
            <span className="text-xs text-gray-400">•</span>
            <p className="text-xs text-gray-500">
              #{nft.serialNumber}
            </p>
          </div>
        </div>

        {/* Description - Compact */}
        {nft.description && (
          <p className="text-xs text-gray-600 line-clamp-1">
            {nft.description}
          </p>
        )}

        {/* Attributes - Compact Chips */}
        {nft.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {nft.attributes.slice(0, 2).map((attr, index) => (
              <div 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50"
              >
                <span className="text-[10px] font-medium text-blue-700">
                  {attr.trait_type}:
                </span>
                <span className="text-[10px] text-gray-700">
                  {attr.value}
                </span>
              </div>
            ))}
            {nft.attributes.length > 2 && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
                <span className="text-[10px] text-gray-600">
                  +{nft.attributes.length - 2}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Compact Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 mt-3 pt-3">
          {/* Only show action buttons if not listed or auctioned */}
          {!nftStatus.isListed && !nftStatus.isAuctioned && (
            <>
              {/* List on Marketplace Button */}
              <Button
                size="sm"
                onClick={handleListOnMarketplace}
                disabled={isListing || statusLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs py-2 shadow-md hover:shadow-lg transition-all"
                title="List this NFT on marketplace"
              >
                {isListing ? '⏳' : '📍'} {isListing ? 'Listing...' : 'List'}
              </Button>

              {/* Create Auction Button */}
              <Button
                size="sm"
                onClick={handleCreateAuction}
                disabled={isCreatingAuction || statusLoading}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs py-2 shadow-md hover:shadow-lg transition-all"
                title="Create an auction for this NFT"
              >
                {isCreatingAuction ? '⏳' : '🔨'} {isCreatingAuction ? 'Creating...' : 'Auction'}
              </Button>
            </>
          )}

          {/* Remove from Marketplace - Full Width */}
          {nftStatus.isListed && (
            <Button
              variant="destructive"
              size="sm"
              className="col-span-2 text-xs py-2 shadow-md hover:shadow-lg transition-all"
              onClick={handleRemoveFromMarketplace}
              disabled={isRemoving}
            >
              {isRemoving ? '⏳ Removing...' : '🗑️ Remove Listing'}
            </Button>
          )}

          {/* Cancel Auction - Full Width */}
          {nftStatus.isAuctioned && (
            <Button
              variant="destructive"
              size="sm"
              className="col-span-2 text-xs py-2 shadow-md hover:shadow-lg transition-all"
              onClick={handleCancelAuction}
              disabled={isCancellingAuction}
            >
              {isCancellingAuction ? '⏳ Cancelling...' : '❌ Cancel Auction'}
            </Button>
          )}

          {/* View on HashScan - Always visible, full width */}
          <Button
            variant="outline"
            size="sm"
            className="col-span-2 text-xs py-2 bg-white/50 backdrop-blur-sm hover:bg-white/70 border-blue-200 hover:border-blue-400 transition-all"
            onClick={() => window.open(nft.hashscanUrl, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View on HashScan
          </Button>
        </div>
      </div>

      {/* Allowance Modal - Legacy (may be deprecated) */}
      <AllowanceModal
        isOpen={showAllowanceModal}
        onClose={() => setShowAllowanceModal(false)}
        nft={{
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          name: nft.name,
          image: nft.image || undefined
        }}
        mode={allowanceMode}
        type={allowanceType}
        price={pendingPrice}
        onSuccess={handleAllowanceSuccess}
      />

      {/* Enhanced List Marketplace Dialog */}
      <ListMarketplaceDialog
        isOpen={showListMarketplaceDialog}
        onClose={() => setShowListMarketplaceDialog(false)}
        nft={{
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          name: nft.name,
          image: nft.image || undefined,
          description: nft.description,
          symbol: nft.symbol,
          attributes: nft.attributes,
          metadataUri: nft.metadataUri || undefined
        }}
        walletAddress={walletAddress || ''}
        userId={userId || ''}
        onSuccess={async () => {
          await fetchNFTStatus()
          if (onRefresh) await onRefresh()
        }}
      />

      {/* Enhanced Create Auction Dialog */}
      <CreateAuctionDialog
        isOpen={showCreateAuctionDialog}
        onClose={() => setShowCreateAuctionDialog(false)}
        nft={{
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          name: nft.name,
          image: nft.image || undefined,
          description: nft.description,
          symbol: nft.symbol,
          attributes: nft.attributes,
          metadataUri: nft.metadataUri || undefined
        }}
        walletAddress={walletAddress || ''}
        userId={userId || ''}
        onSuccess={async () => {
          await fetchNFTStatus()
          if (onRefresh) await onRefresh()
        }}
      />

      {/* Enhanced Cancel Listing Dialog */}
      <CancelListingDialog
        isOpen={showCancelListingDialog}
        onClose={() => setShowCancelListingDialog(false)}
        nft={{
          id: nftStatus.listingId || '',
          name: nft.name,
          image: nft.image || undefined,
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber
        }}
        walletAddress={walletAddress || ''}
        onSuccess={async () => {
          await fetchNFTStatus()
          if (onRefresh) await onRefresh()
        }}
      />

      {/* Enhanced Stop Auction Dialog */}
      <StopAuctionDialog
        isOpen={showStopAuctionDialog}
        onClose={() => setShowStopAuctionDialog(false)}
        auction={{
          id: nftStatus.auctionId || '',
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          nftName: nft.name,
          nftImage: nft.image || undefined,
          startingBid: 0, // TODO: Fetch from API
          currentBid: 0, // TODO: Fetch from API
          totalBids: 0, // TODO: Fetch from API
          endTime: new Date() // TODO: Fetch from API
        }}
        walletAddress={walletAddress || ''}
        onSuccess={async () => {
          await fetchNFTStatus()
          if (onRefresh) await onRefresh()
        }}
      />
    </div>
  )
}