'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { XCircle, Lock, AlertTriangle, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface CancelListingDialogProps {
  isOpen: boolean
  onClose: () => void
  nft: {
    id: string // listing ID
    name: string
    description?: string
    image?: string
    tokenId: string
    serialNumber: number
  }
  listingPrice?: number
  walletAddress: string
  onSuccess?: () => void
}

export function CancelListingDialog({
  isOpen,
  onClose,
  nft,
  listingPrice,
  walletAddress,
  onSuccess
}: CancelListingDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCancel = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/marketplace/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          seller: walletAddress
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        onSuccess?.()
        handleClose()
      } else {
        setError(data.error || 'Failed to cancel listing')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel listing')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-red-50/30 border-2 border-red-200/50 shadow-2xl overflow-hidden">
        
        {/* Animated Header */}
        <div className="relative bg-gradient-to-r from-red-500 via-rose-500 to-red-600 p-8 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-400/20 rounded-full blur-2xl"></div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                <XCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">
                  Cancel Listing
                </DialogTitle>
                <DialogDescription className="text-white/90 text-base">
                  Remove your NFT from the marketplace
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          {/* NFT Preview */}
          <div className="rounded-xl border-2 border-red-200/60 bg-gradient-to-br from-red-50/60 via-white to-rose-50/40 p-5 shadow-lg">
            <div className="flex items-center gap-5">
              <img 
                src={nft.image} 
                alt={nft.name}
                className="w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-xl"
              />
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-2">{nft.name}</h3>
                <p className="text-sm text-gray-600 mb-2">Serial #{nft.serialNumber}</p>
                {listingPrice && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                    Listed at {listingPrice} ℏ
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50/80 to-yellow-50/60 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">Revoke Allowance</p>
              <p className="text-sm text-amber-700">
                This will revoke the marketplace's permission to transfer your NFT, effectively removing it from sale.
              </p>
            </div>
          </div>

          {/* What Happens */}
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 p-5 space-y-3">
            <p className="text-sm font-semibold text-blue-900 mb-2">What happens next:</p>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Listing will be removed from marketplace</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Marketplace permission will be revoked</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>NFT will remain in your collection</span>
              </li>
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
              Keep Listing
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 mr-2" />
                  Cancel Listing
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
