'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ban, AlertTriangle, Loader2, ShieldAlert, CheckCircle2, Clock } from 'lucide-react'

interface StopAuctionDialogProps {
  isOpen: boolean
  onClose: () => void
  auction: {
    id: string
    tokenId: string
    serialNumber: number
    nftName: string
    nftImage?: string
    startingBid: number
    currentBid?: number
    totalBids?: number
    endTime: Date
  }
  walletAddress: string
  onSuccess?: () => void
}

export function StopAuctionDialog({
  isOpen,
  onClose,
  auction,
  walletAddress,
  onSuccess
}: StopAuctionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStopAuction = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auctions/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: auction.tokenId,
          serialNumber: auction.serialNumber,
          seller: walletAddress
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        onSuccess?.()
        handleClose()
      } else {
        setError(data.error || 'Failed to stop auction')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stop auction')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  const hasBids = (auction.totalBids || 0) > 0
  const timeRemaining = new Date(auction.endTime).getTime() - Date.now()
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 border-2 border-orange-200/50 shadow-2xl overflow-hidden">
        
        {/* Animated Header */}
        <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-8 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl"></div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                <Ban className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">
                  Stop Auction
                </DialogTitle>
                <DialogDescription className="text-white/90 text-base">
                  End this auction early
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          {/* NFT Preview */}
          <div className="rounded-xl border-2 border-orange-200/60 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 p-5 shadow-lg">
            <div className="flex items-center gap-5">
              <img 
                src={auction.nftImage} 
                alt={auction.nftName}
                className="w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-xl"
              />
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-2">{auction.nftName}</h3>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                    Starting: {auction.startingBid} ℏ
                  </Badge>
                  {auction.currentBid && auction.currentBid > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Current: {auction.currentBid} ℏ
                    </Badge>
                  )}
                  {auction.totalBids && auction.totalBids > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      {auction.totalBids} bids
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning - Has Bids */}
          {hasBids && (
            <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50/80 to-rose-50/60 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">Warning: Active Bids</p>
                <p className="text-sm text-red-700">
                  This auction has {auction.totalBids} active bid{auction.totalBids !== 1 ? 's' : ''}. Stopping it may disappoint bidders and affect your reputation.
                </p>
              </div>
            </div>
          )}

          {/* Time Remaining */}
          {hoursRemaining > 0 && (
            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-blue-700 text-sm font-semibold">Time Remaining</span>
                <p className="text-blue-900 font-bold text-lg">{hoursRemaining} hours</p>
              </div>
            </div>
          )}

          {/* What Happens */}
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 p-5 space-y-3">
            <p className="text-sm font-semibold text-blue-900 mb-2">What happens next:</p>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Auction will be canceled immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Marketplace permission will be revoked</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>NFT will return to your collection</span>
              </li>
              {hasBids && (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-amber-700">All bids will be voided (no refunds needed - HBAR wasn't transferred)</span>
                </li>
              )}
            </ul>
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50"
              disabled={isLoading}
            >
              Keep Auction
            </Button>
            <Button
              onClick={handleStopAuction}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <Ban className="h-5 w-5 mr-2" />
                  Stop Auction
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
