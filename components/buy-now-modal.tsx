"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle2,
  Wallet,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  Zap
} from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import type { MarketplaceItem } from "@/lib/services/marketplaceService"

interface BuyNowModalProps {
  isOpen: boolean
  onClose: () => void
  listing: MarketplaceItem
  onSuccess?: () => void
}

export function BuyNowModal({ isOpen, onClose, listing, onSuccess }: BuyNowModalProps) {
  const { address, isConnected, balance, connect, walletType } = useWallet()
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm')
  const [error, setError] = useState<string>('')
  const [transactionId, setTransactionId] = useState<string>('')

  const handlePurchase = async () => {
    try {
      setStep('processing')
      setError('')

      // 1. Check wallet connection
      if (!isConnected || !address) {
        setError('Please connect your wallet first')
        setStep('error')
        return
      }

      // 1.5 Initialize HashConnect if needed (for HashPack wallet)
      if (walletType === 'hashpack') {
        try {
          console.log('🔄 [BUY NOW] Initializing HashConnect...')
          const { initHashConnect, getPairingData, connectHashPack } = await import('@/lib/hashconnect')
          
          await initHashConnect()
          
          const pairingData = getPairingData()
          if (!pairingData || !pairingData.accountIds || pairingData.accountIds.length === 0) {
            console.log('🔁 [BUY NOW] No pairing data, attempting to pair...')
            await connectHashPack()
          }
          
          console.log('✅ [BUY NOW] HashConnect initialized and paired')
        } catch (initError: any) {
          console.error('❌ [BUY NOW] HashConnect initialization failed:', initError)
          setError('Failed to initialize wallet connection. Please try reconnecting your wallet.')
          setStep('error')
          return
        }
      }

      // 2. Check balance
      const priceInHbar = listing.price || 0
      const balanceInHbar = parseFloat(balance?.replace('ℏ', '') || '0')
      
      if (balanceInHbar < priceInHbar) {
        setError(`Insufficient balance. You need ${priceInHbar} HBAR but only have ${balanceInHbar} HBAR`)
        setStep('error')
        return
      }

      // 3. Check not buying own NFT
      if (address === listing.seller) {
        setError('You cannot buy your own NFT')
        setStep('error')
        return
      }

      console.log('🛒 [BUY NOW] Initiating purchase...', {
        listingId: listing.id,
        buyer: address,
        price: priceInHbar
      })

      // 4. Call validation API to get transaction data
      const response = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          buyerAccountId: address
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Purchase validation failed')
      }

      console.log('✅ [BUY NOW] Purchase validated', data)

      // 5. Build HBAR payment transaction
      // Buyer sends HBAR directly to seller
      const { TransferTransaction, AccountId, Hbar, HbarUnit } = await import('@hashgraph/sdk')
      const { executeTransaction } = await import('@/lib/hashconnect')

      const txData = data.transactionData
      
      // Direct payment from buyer to seller
      console.log('💰 [BUY NOW] Building HBAR payment transaction...')
      
      // Build the transaction WITHOUT setting transaction ID
      // Let HashConnect handle the transaction ID generation
      const paymentTransaction = new TransferTransaction()
        .addHbarTransfer(
          AccountId.fromString(txData.buyer),
          Hbar.from(-txData.priceHbar, HbarUnit.Hbar) // Debit from buyer
        )
        .addHbarTransfer(
          AccountId.fromString(txData.seller),
          Hbar.from(txData.priceHbar, HbarUnit.Hbar) // Credit to seller
        )

      console.log('📝 [BUY NOW] Sending HBAR payment to wallet for signature...')

      // Execute payment transaction via HashConnect (buyer signs)
      // Pass the account ID so we can generate the transaction ID
      const paymentResult = await executeTransaction(paymentTransaction, address, txData.buyer)

      if (!paymentResult.success) {
        throw new Error('Payment transaction failed')
      }

      const paymentTxId = paymentResult.transactionId
      if (!paymentTxId || paymentTxId === 'unknown') {
        throw new Error('No payment transaction ID received')
      }

      console.log('✅ [BUY NOW] Payment sent to seller:', paymentTxId)
      console.log('🔍 [BUY NOW] Transaction ID type:', typeof paymentTxId)
      console.log('🔍 [BUY NOW] Transaction ID format check:', {
        hasAt: paymentTxId.includes('@'),
        hasDash: paymentTxId.includes('-'),
        hasDot: paymentTxId.includes('.'),
        length: paymentTxId.length
      })

      // 6. Trigger backend NFT transfer using operator key
      console.log('🔄 [BUY NOW] Requesting NFT transfer from backend...')
      const nftTransferResponse = await fetch('/api/marketplace/execute-nft-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          buyerAccountId: address,
          paymentTransactionId: paymentTxId
        })
      })

      const nftTransferData = await nftTransferResponse.json()
      
      if (!nftTransferData.success) {
        throw new Error(nftTransferData.error || 'NFT transfer failed')
      }

      console.log('✅ [BUY NOW] NFT transferred:', nftTransferData)
      const nftTxId = nftTransferData.transactionId

      // Store both transaction IDs for display
      const combinedTxId = `Payment: ${paymentTxId}\nNFT Transfer: ${nftTxId}`

      console.log('✅ [BUY NOW] Purchase completed successfully!', {
        payment: paymentTxId,
        nftTransfer: nftTxId
      })

      // The backend already updated the database, no need for complete-purchase endpoint
      console.log('✅ [BUY NOW] Purchase complete!')

      setTransactionId(combinedTxId)
      setStep('success')

      // Call success callback after short delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }

    } catch (err: any) {
      console.error('❌ [BUY NOW] Error:', err)
      setError(err.message || 'Failed to complete purchase')
      setStep('error')
    }
  }

  const handleClose = () => {
    if (step !== 'processing') {
      setStep('confirm')
      setError('')
      setTransactionId('')
      onClose()
    }
  }

  const priceInHbar = listing.price || 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-2 border-blue-200/50 shadow-2xl overflow-hidden">
        
        {/* Confirm Step */}
        {step === 'confirm' && (
          <>
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
                    <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">Purchase NFT</DialogTitle>
                    <DialogDescription className="text-white/90 text-base">
                      Complete your purchase on Hedera blockchain
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              {/* NFT Preview Card with Glass Morphism */}
              <div className="rounded-xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50/60 via-white to-purple-50/40 backdrop-blur-md p-5 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500 animate-pulse"></div>
                    <img 
                      src={listing.image} 
                      alt={listing.name}
                      className="relative w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-xl"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white shadow-lg">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-3">{listing.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{listing.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {listing.category || 'NFT Collection'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Price Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50/60 p-4 shadow-md">
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1">Price</span>
                  <span className="font-bold text-2xl text-blue-600">{priceInHbar} ℏ</span>
                </div>

                <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50/60 p-4 shadow-md">
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1">Your Balance</span>
                  <span className="font-bold text-2xl text-gray-700">{balance || '0 ℏ'}</span>
                </div>
              </div>

              {isConnected && (
                <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50/60 p-4 flex items-center gap-3 shadow-md">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-green-700 text-sm font-semibold block">Connected Wallet</span>
                    <span className="font-mono text-xs text-green-600">
                      {address?.slice(0, 10)}...{address?.slice(-6)}
                    </span>
                  </div>
                </div>
              )}

              {/* Atomic Transaction Notice */}
              <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 backdrop-blur-sm p-5 flex items-start gap-4 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-blue-900 mb-1">Atomic Transaction</p>
                  <p className="text-sm text-blue-700">
                    This purchase will transfer both the NFT to you and HBAR to the seller in a single atomic transaction. The transaction cannot be reversed once completed.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {!isConnected ? (
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    onClick={() => connect()}
                  >
                    <Wallet className="h-5 w-5 mr-2" />
                    Connect Wallet
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleClose} 
                      className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handlePurchase}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Buy Now
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <>
            {/* Animated Header */}
            <div className="relative bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              
              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-white mb-1">Processing Purchase...</DialogTitle>
                    <DialogDescription className="text-white/90 text-base">
                      Executing atomic transaction on Hedera
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-md">
                  <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 font-medium">Transferring NFT to your wallet</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 shadow-md">
                  <div className="h-3 w-3 bg-purple-600 rounded-full animate-pulse delay-75"></div>
                  <span className="text-gray-700 font-medium">Transferring HBAR to seller</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-md">
                  <div className="h-3 w-3 bg-green-600 rounded-full animate-pulse delay-150"></div>
                  <span className="text-gray-700 font-medium">Updating ownership records</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <>
            {/* Success Header */}
            <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              
              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-white mb-1">Purchase Successful!</DialogTitle>
                    <DialogDescription className="text-white/90 text-base">
                      The NFT is now in your wallet
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              {transactionId && (
                <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg space-y-4">
                  {transactionId.includes('\n') ? (
                    // Multiple transaction IDs (payment + NFT transfer)
                    <>
                      {transactionId.split('\n').map((txLine, idx) => {
                        const [label, txId] = txLine.split(': ')
                        return (
                          <div key={idx} className="space-y-2">
                            <p className="text-sm font-semibold text-green-700">{label}:</p>
                            <code className="text-xs font-mono bg-white px-4 py-3 rounded-lg border-2 border-green-300 block break-all text-gray-700 shadow-sm">
                              {txId}
                            </code>
                            <a 
                              href={`https://hashscan.io/testnet/transaction/${txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            >
                              View {label} on HashScan
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    // Single transaction ID
                    <>
                      <p className="text-sm font-semibold text-green-700 mb-3">Transaction ID:</p>
                      <code className="text-xs font-mono bg-white px-4 py-3 rounded-lg border-2 border-green-300 block break-all text-gray-700 shadow-sm">
                        {transactionId}
                      </code>
                      <a 
                        href={`https://hashscan.io/testnet/transaction/${transactionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        View on HashScan
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </>
                  )}
                </div>
              )}
              
              <Button 
                onClick={handleClose} 
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Close
              </Button>
            </div>
          </>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <>
            {/* Error Header */}
            <div className="relative bg-gradient-to-r from-red-500 via-rose-500 to-red-600 p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              
              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-white mb-1">Purchase Failed</DialogTitle>
                    <DialogDescription className="text-white/90 text-base">
                      Something went wrong with the transaction
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6 shadow-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose} 
                  className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 font-semibold"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => setStep('confirm')} 
                  className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
