"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Info, ShoppingCart, Sparkles, Package, Lock } from "lucide-react"
import { toast } from "sonner"

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  listing: {
    id: string
    nft: {
      name: string
      image?: string
      tokenId: string
      serialNumber: number
    }
    priceHbar: number
    seller: string
  }
  buyerAccountId?: string
  onSuccess?: () => void
}

const OPERATOR_ACCOUNT_ID = process.env.NEXT_PUBLIC_OPERATOR_ACCOUNT_ID || '0.0.6854036'

export function PurchaseModal({ isOpen, onClose, listing, buyerAccountId, onSuccess }: PurchaseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'confirm' | 'signing' | 'complete'>('confirm')

  const handlePurchase = async () => {
    if (!buyerAccountId) {
      setError('Please connect your wallet first')
      return
    }

    setIsProcessing(true)
    setError(null)
    setStep('signing')

    try {
      toast.loading("Processing purchase...", { id: "purchase-toast" })

      console.log('🔄 [PURCHASE] Ensuring HashConnect is initialized...')
      
      // Import and initialize HashConnect properly like minting page does
      const { initHashConnect, getHashConnectInstance, getPairingData, executeTransaction } = await import('@/lib/hashconnect')
      await initHashConnect()
      
      // Get HashConnect instance
      const hashconnect = getHashConnectInstance()
      if (!hashconnect) {
        throw new Error('Failed to initialize HashConnect. Please refresh the page and try again.')
      }

      console.log('✅ [PURCHASE] HashConnect instance ready')

      // Get pairing data
      const pairingData = getPairingData()
      if (!pairingData || !pairingData.accountIds || pairingData.accountIds.length === 0) {
        throw new Error('No wallet paired. Please connect your wallet from the navbar.')
      }

      console.log('✅ [PURCHASE] Wallet connected')

      // Import Hedera SDK
      const { TransferTransaction, AccountId, TokenId, NftId, Hbar, TokenAssociateTransaction } = await import('@hashgraph/sdk')

      // Check if token is associated with buyer's account
      console.log('🔍 [PURCHASE] Checking token association status...')
      const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com'
      const tokenCheckResponse = await fetch(`${MIRROR_NODE_URL}/api/v1/accounts/${buyerAccountId}/tokens`)
      const tokenCheckData = await tokenCheckResponse.json()
      const isAssociated = tokenCheckData.tokens?.some((t: any) => t.token_id === listing.nft.tokenId)

      // If token is not associated, associate it first
      if (!isAssociated) {
        console.log('⚠️ [PURCHASE] Token not associated, associating now...')
        toast.loading("Associating token with your account...", { id: "purchase-toast" })

        const associateTransaction = new TokenAssociateTransaction()
          .setAccountId(AccountId.fromString(buyerAccountId))
          .setTokenIds([TokenId.fromString(listing.nft.tokenId)])

        console.log('💳 [PURCHASE] Sending token association to wallet...')
        const associateResult = await executeTransaction(associateTransaction, buyerAccountId)

        console.log('✅ [PURCHASE] Token association result:', associateResult)

        if (!associateResult.success) {
          throw new Error('Failed to associate token with your account. Please try again.')
        }

        console.log('✅ [PURCHASE] Token associated successfully:', associateResult.transactionId)
        toast.success("Token associated! Proceeding with purchase...", { id: "purchase-toast" })

        // Small delay to ensure association is confirmed on-chain
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.log('✅ [PURCHASE] Token already associated with buyer account')
      }

      console.log('🛒 [PURCHASE] Starting atomic swap...', {
        listingId: listing.id,
        nft: `${listing.nft.tokenId}@${listing.nft.serialNumber}`,
        price: listing.priceHbar,
        buyer: buyerAccountId,
        seller: listing.seller
      })

      // Create atomic swap transaction
      // 1. Buyer sends HBAR to seller
      // 2. Operator transfers NFT to buyer (using allowance)
      const nftId = new NftId(
        TokenId.fromString(listing.nft.tokenId),
        listing.nft.serialNumber
      )

      const transaction = new TransferTransaction()
        // Buyer pays HBAR to seller
        .addHbarTransfer(
          AccountId.fromString(buyerAccountId),
          Hbar.fromString(`-${listing.priceHbar}`)
        )
        .addHbarTransfer(
          AccountId.fromString(listing.seller),
          Hbar.fromString(`${listing.priceHbar}`)
        )
        // Operator transfers NFT to buyer (using pre-approved allowance)
        .addApprovedNftTransfer(
          nftId,
          AccountId.fromString(listing.seller),
          AccountId.fromString(buyerAccountId)
        )

      console.log('💳 [PURCHASE] Sending transaction to wallet...')

      // Use executeTransaction like minting and allowance modals
      const result = await executeTransaction(transaction, buyerAccountId)

      console.log('✅ [PURCHASE] Transaction result:', result)

      if (!result.success) {
        throw new Error('Transaction failed')
      }

      const transactionId = result.transactionId
      if (!transactionId) {
        throw new Error('No transaction ID received')
      }

      console.log('✅ [PURCHASE] Transaction submitted:', transactionId)

      // Update database via API
      const apiResponse = await fetch('/api/marketplace/complete-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          buyerAccountId: buyerAccountId,
          transactionId: transactionId,
          priceHbar: listing.priceHbar
        })
      })

      const apiResult = await apiResponse.json()

      if (!apiResponse.ok || !apiResult.success) {
        console.error('❌ [PURCHASE] API error:', apiResult)
        
        // Check for token not associated error from backend
        if (apiResult.code === 'TOKEN_NOT_ASSOCIATED') {
          throw new Error('Token association was not properly set. Please refresh and try again.')
        }
        
        throw new Error(apiResult.error || 'Failed to complete purchase in database')
      }

      console.log('✅ [PURCHASE] Purchase completed successfully!')

      toast.success(`Purchase successful! NFT is now yours.`, { id: "purchase-toast" })
      
      setStep('complete')
      setTimeout(() => {
        onClose()
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.reload()
        }
      }, 2000)

    } catch (err: any) {
      console.error('❌ [PURCHASE] Error:', err)
      const errorMessage = err.message || 'Failed to complete purchase. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage, { id: "purchase-toast" })
      setStep('confirm')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-2 border-blue-200/50 shadow-2xl overflow-hidden">
        {/* Animated Header with Gradient */}
        <div className="relative bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 p-8 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl"></div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl transform hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">Complete Purchase</DialogTitle>
                <DialogDescription className="text-white/90 text-base">
                  Secure atomic swap - NFT and payment transferred together
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          {/* NFT Preview Card */}
          <div className="rounded-xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/40 backdrop-blur-md p-5 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02]">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500 animate-pulse"></div>
                {listing.nft.image ? (
                  <img
                    src={listing.nft.image}
                    alt={listing.nft.name}
                    className="relative w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-xl"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        const icon = document.createElement('div')
                        icon.innerHTML = '🖼️'
                        icon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;opacity:0.5'
                        parent.appendChild(icon)
                      }
                    }}
                  />
                ) : (
                  <div className="relative w-24 h-24 rounded-xl ring-4 ring-white shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Package className="h-12 w-12 text-white/50" />
                  </div>
                )}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white shadow-lg">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-3">{listing.nft.name}</h3>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Token ID</span>
                    <span className="font-semibold text-sm text-gray-700">{listing.nft.tokenId}</span>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Serial #</span>
                    <span className="font-semibold text-sm text-gray-700">#{listing.nft.serialNumber}</span>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Price</span>
                    <span className="font-bold text-lg text-blue-600">{listing.priceHbar.toFixed(2)} ℏ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Atomic Swap Info */}
          <Alert className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <AlertDescription className="flex-1 pt-2">
                <p className="text-base font-bold text-blue-900 mb-1">Secure Atomic Swap</p>
                <p className="text-sm text-blue-700">
                  Your payment ({listing.priceHbar.toFixed(2)} ℏ) and the NFT will be transferred in a single atomic transaction. 
                  Both transfers happen together or not at all - fully secure!
                </p>
              </AlertDescription>
            </div>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50/80 to-rose-50/60 backdrop-blur-sm shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <AlertDescription className="flex-1 pt-1.5">
                  <p className="text-sm font-semibold text-red-900">{error}</p>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Success State */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-xl mb-4 animate-bounce">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Purchase Complete!</p>
              <p className="text-sm text-gray-600">The NFT is now in your wallet</p>
            </div>
          )}

          {/* Action Buttons */}
          {step !== 'complete' && (
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {step === 'signing' ? 'Check Your Wallet...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Buy for {listing.priceHbar.toFixed(2)} ℏ
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
