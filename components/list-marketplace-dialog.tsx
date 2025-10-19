'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Store, DollarSign, Lock, CheckCircle2, Sparkles, AlertCircle, Loader2 } from 'lucide-react'

interface ListMarketplaceDialogProps {
  isOpen: boolean
  onClose: () => void
  nft: {
    name: string
    description?: string
    image?: string
    tokenId: string
    serialNumber: number
    symbol?: string
    attributes?: any[]
    metadataUri?: string
  }
  walletAddress: string
  userId?: string
  onSuccess?: () => void
}

export function ListMarketplaceDialog({
  isOpen,
  onClose,
  nft,
  walletAddress,
  userId,
  onSuccess
}: ListMarketplaceDialogProps) {
  const [step, setStep] = useState<'details' | 'allowance'>('details')
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingListingId, setPendingListingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleListNFT = async () => {
    setError('')
    const priceHbar = parseFloat(price)
    
    if (isNaN(priceHbar) || priceHbar <= 0) {
      setError('Please enter a valid price')
      return
    }

    setIsLoading(true)
    try {
      // Extract CID from the Pinata URL if it exists
      let extractedCID = ''
      if (nft.image && nft.image.includes('/ipfs/')) {
        extractedCID = nft.image.split('/ipfs/')[1]?.split('?')[0]?.split(':')[0] || ''
      }
      
      const res = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          priceHbar,
          seller: walletAddress,
          ownerId: userId || walletAddress,
          collectionId: nft.tokenId,
          walletAddress,
          status: 'PENDING',
          nftData: {
            name: nft.name,
            description: nft.description,
            imageUrl: nft.image || '',
            aiImageUrl: nft.image || '',
            aiImageCID: extractedCID,
            metadataUri: nft.metadataUri || '',
            symbol: nft.symbol,
            attributes: nft.attributes
          }
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setPendingListingId(data.listing?.id || null)
        setStep('allowance')
      } else {
        setError(data.error || 'Failed to create listing')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantAllowance = async () => {
    if (!pendingListingId) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Import HashConnect and Hedera SDK
      const { initHashConnect, getHashConnectInstance, executeTransaction } = await import('@/lib/hashconnect')
      await initHashConnect()
      
      const hashconnect = getHashConnectInstance()
      if (!hashconnect) {
        throw new Error('Failed to initialize HashConnect')
      }

      const { AccountAllowanceApproveTransaction, AccountId, TokenId, NftId } = await import('@hashgraph/sdk')
      const OPERATOR_ACCOUNT_ID = process.env.NEXT_PUBLIC_OPERATOR_ACCOUNT_ID || '0.0.5145195'

      // Create NFT ID and allowance transaction
      const nftId = new NftId(TokenId.fromString(nft.tokenId), nft.serialNumber)
      const transaction = new AccountAllowanceApproveTransaction()
        .approveTokenNftAllowance(
          nftId,
          AccountId.fromString(walletAddress),
          AccountId.fromString(OPERATOR_ACCOUNT_ID)
        )

      // Execute transaction
      const result = await executeTransaction(transaction, walletAddress)

      if (!result.success || !result.transactionId) {
        throw new Error('Transaction failed')
      }

      // Update listing status to ACTIVE
      const updateRes = await fetch('/api/allowance/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'listing',
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          seller: walletAddress,
          allowanceTransactionId: result.transactionId,
          priceHbar: parseFloat(price)
        })
      })

      const data = await updateRes.json()
      if (data.success) {
        onSuccess?.()
        handleClose()
      } else {
        setError(data.error || 'Failed to update listing status')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to grant allowance')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('details')
    setPrice('')
    setError('')
    setPendingListingId(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 border-2 border-emerald-200/50 shadow-2xl overflow-hidden">
        
        {/* Step 1: Listing Details */}
        {step === 'details' && (
          <>
            {/* Animated Header */}
            <div className="relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl"></div>
              
              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                    <Store className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">
                      List on Marketplace
                    </DialogTitle>
                    <DialogDescription className="text-white/90 text-base">
                      Set your price and list your NFT for sale
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              {/* NFT Preview */}
              <div className="rounded-xl border-2 border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-5 shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500"></div>
                    <img 
                      src={nft.image} 
                      alt={nft.name}
                      className="relative w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-xl"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white shadow-lg">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{nft.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{nft.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      Serial #{nft.serialNumber}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Price Input */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Listing Price
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter price in HBAR"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-14 text-lg pr-16 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-lg">
                    ℏ
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Set a competitive price to attract buyers
                </p>
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Info Box */}
              <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Next Step</p>
                  <p className="text-sm text-blue-700">
                    After setting your price, you'll need to approve the marketplace to transfer your NFT when sold.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleListNFT}
                  disabled={!price || isLoading}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Listing...
                    </>
                  ) : (
                    <>
                      Continue
                      <Sparkles className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Grant Allowance */}
        {step === 'allowance' && (
          <>
            <div className="relative bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              
              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">
                      Grant Allowance
                    </DialogTitle>
                    <DialogDescription className="text-white/90 text-base">
                      Approve marketplace to transfer your NFT
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              {/* Success Message */}
              <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">Listing Created!</h3>
                <p className="text-gray-600">
                  Your NFT listing has been created at <span className="font-bold text-emerald-600">{price} ℏ</span>
                </p>
              </div>

              {/* NFT Preview */}
              <div className="rounded-xl border-2 border-purple-200/60 bg-gradient-to-br from-purple-50/60 via-white to-violet-50/40 p-5 shadow-lg">
                <div className="flex items-center gap-5">
                  <img 
                    src={nft.image} 
                    alt={nft.name}
                    className="w-20 h-20 rounded-xl object-cover ring-4 ring-white shadow-lg"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{nft.name}</h3>
                    <p className="text-sm text-gray-600">Serial #{nft.serialNumber}</p>
                  </div>
                </div>
              </div>

              {/* Allowance Explanation */}
              <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">What is allowance?</p>
                    <p className="text-sm text-blue-700">
                      Granting allowance allows the marketplace to automatically transfer your NFT to the buyer when purchased. This ensures instant delivery without requiring your approval for each sale.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
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
                  Cancel
                </Button>
                <Button
                  onClick={handleGrantAllowance}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Granting Allowance...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Grant Allowance
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
