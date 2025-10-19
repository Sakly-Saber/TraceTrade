"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Info, Shield, Unlock, Package, Gavel, Wallet } from 'lucide-react'
import { useWallet } from '@/hooks/use-wallet'

interface AllowanceModalProps {
  isOpen: boolean
  onClose: () => void
  nft: {
    tokenId: string
    serialNumber: number
    name: string
    image?: string
  }
  mode: 'grant' | 'revoke'
  type: 'listing' | 'auction'
  price?: number
  onSuccess: (transactionId: string) => void
}

const OPERATOR_ACCOUNT_ID = process.env.NEXT_PUBLIC_OPERATOR_ACCOUNT_ID || '0.0.6854036'

export function AllowanceModal({
  isOpen,
  onClose,
  nft,
  mode,
  type,
  price,
  onSuccess
}: AllowanceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'confirm' | 'signing' | 'complete'>('confirm')
  const [isPairingReady, setIsPairingReady] = useState(false)
  const [isCheckingPairing, setIsCheckingPairing] = useState(false)
  const { address, isConnected, connectHashPack, walletType } = useWallet()

  // Check if wallet is connected when modal opens
  useEffect(() => {
    if (isOpen && !isConnected) {
      setError('Please connect your HashPack wallet first from the navigation bar.')
    } else {
      setError(null)
    }
  }, [isOpen, isConnected])

  // When modal opens and navbar reports HashPack connected but internal pairing is missing,
  // try to initialize HashConnect and recover pairing. This mirrors tokenization page behavior.
  useEffect(() => {
    if (!isOpen) return
    if (!isConnected) return
    if (walletType !== 'hashpack') return

    let cancelled = false
    setIsCheckingPairing(true)
    setIsPairingReady(false)

    const ensurePairing = async () => {
      try {
        const { initHashConnect, getPairingData, connectHashPack } = await import('@/lib/hashconnect')
        await initHashConnect()

        // Check if pairing data already exists
        const pd = getPairingData()
        if (pd && pd.accountIds && pd.accountIds.length > 0) {
          console.log('🔁 AllowanceModal: pairing already present')
          if (!cancelled) {
            setIsPairingReady(true)
            setIsCheckingPairing(false)
            setError(null)
          }
          return
        }

        // Attempt to connect / prompt pairing modal so HashPack and HashConnect sync up
        console.log('🔁 AllowanceModal: attempting to recover HashPack pairing...')
        try {
          await connectHashPack()
          if (!cancelled) {
            console.log('🔁 AllowanceModal: pairing recovered or user paired via modal')
            setIsPairingReady(true)
            setIsCheckingPairing(false)
            setError(null)
          }
        } catch (connectErr: any) {
          console.warn('⚠️ AllowanceModal: pairing recovery failed or was cancelled', connectErr)
          if (!cancelled) {
            setIsPairingReady(false)
            setIsCheckingPairing(false)
            setError('No wallet paired. Please connect your wallet from the navbar.')
          }
        }
      } catch (err: any) {
        console.warn('⚠️ AllowanceModal: error initializing HashConnect for pairing recovery', err)
        if (!cancelled) {
          setIsPairingReady(false)
          setIsCheckingPairing(false)
          setError('Failed to initialize wallet pairing. Please refresh and try again.')
        }
      }
    }

    ensurePairing()

    return () => { 
      cancelled = true
      setIsCheckingPairing(false)
    }
  }, [isOpen, isConnected, walletType])

  const handleConnectWallet = async () => {
    try {
      setError(null)
      await connectHashPack()
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
    }
  }

  const handleAllowanceAction = async () => {
    // Double-check wallet connection
    if (!isConnected || !address) {
      setError('Please connect your wallet first from the navigation bar.')
      return
    }

    if (walletType !== 'hashpack') {
      setError('Please connect using HashPack wallet for Hedera NFT operations.')
      return
    }

    setIsProcessing(true)
    setError(null)
    setStep('signing')

    try {
      console.log('🔄 [ALLOWANCE] Starting allowance transaction...')
      console.log('🔍 [ALLOWANCE] Wallet address from hook:', address)
      console.log('🔍 [ALLOWANCE] Wallet type:', walletType)
      
      // Import HashConnect functions
      const { initHashConnect, getHashConnectInstance, executeTransaction } = await import('@/lib/hashconnect')
      
      // Ensure HashConnect is initialized
      await initHashConnect()
      
      // Get HashConnect instance
      const hashconnect = getHashConnectInstance()
      if (!hashconnect) {
        throw new Error('Failed to initialize HashConnect. Please refresh the page and try again.')
      }

      console.log('✅ [ALLOWANCE] HashConnect instance ready')

      // Import Hedera SDK
      const { AccountAllowanceApproveTransaction, AccountAllowanceDeleteTransaction, AccountId, TokenId, NftId } = await import('@hashgraph/sdk')

      console.log(`${mode === 'grant' ? '🔐' : '🔓'} [ALLOWANCE] ${mode === 'grant' ? 'Granting' : 'Revoking'} allowance...`, {
        nft: `${nft.tokenId}@${nft.serialNumber}`,
        owner: address,
        spender: OPERATOR_ACCOUNT_ID,
        mode
      })

      // Create NFT ID
      const nftId = new NftId(TokenId.fromString(nft.tokenId), nft.serialNumber)

      let transaction
      if (mode === 'grant') {
        // Grant allowance
        transaction = new AccountAllowanceApproveTransaction()
          .approveTokenNftAllowance(
            nftId,
            AccountId.fromString(address),
            AccountId.fromString(OPERATOR_ACCOUNT_ID)
          )
      } else {
        // Revoke allowance (delete allowance)
        transaction = new AccountAllowanceDeleteTransaction()
          .deleteAllTokenNftAllowances(nftId, AccountId.fromString(address))
      }

      console.log('💳 [ALLOWANCE] Sending transaction to wallet...')

      // Use executeTransaction (already imported above)
      const result = await executeTransaction(transaction, address)

      console.log('✅ [ALLOWANCE] Transaction result:', result)

      if (!result.success) {
        throw new Error('Transaction failed')
      }

      const txId = result.transactionId
      if (!txId) {
        throw new Error('No transaction ID received')
      }

      console.log(`✅ [ALLOWANCE] ${mode === 'grant' ? 'Granted' : 'Revoked'} successfully! TX: ${txId}`)

      setStep('complete')
      setTimeout(() => {
        onSuccess(txId)
        onClose()
      }, 1500)

    } catch (err: any) {
      console.error('❌ [ALLOWANCE] Error:', err)
      setError(err.message || 'Failed to process allowance. Please try again.')
      setStep('confirm')
    } finally {
      setIsProcessing(false)
    }
  }

  const actionText = mode === 'grant' 
    ? (type === 'listing' ? 'Approve Listing' : 'Approve Auction')
    : (type === 'listing' ? 'Remove Listing' : 'Cancel Auction')

  const titleText = mode === 'grant'
    ? (type === 'listing' ? 'Approve Marketplace Listing' : 'Approve Auction')
    : (type === 'listing' ? 'Revoke Marketplace Listing' : 'Revoke Auction')

  const Icon = mode === 'grant' ? Shield : Unlock

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-purple-50/30 border-2 border-purple-200/50 shadow-2xl overflow-hidden">
        {/* Animated Header with Gradient */}
        <div className={`relative ${mode === 'grant' ? 'bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600' : 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-600'} p-8 overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className={`absolute bottom-0 left-0 w-48 h-48 ${mode === 'grant' ? 'bg-violet-400/20' : 'bg-red-400/20'} rounded-full blur-2xl`}></div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl transform hover:scale-110 transition-transform duration-300">
                <Icon className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">{titleText}</DialogTitle>
                <DialogDescription className="text-white/90 text-base">
                  {mode === 'grant' 
                    ? 'Grant permission to the operator for secure transfers' 
                    : 'Revoke permission and cancel this listing'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          {/* NFT Preview Card with Glass Morphism */}
          <div className="rounded-xl border-2 border-purple-200/60 bg-gradient-to-br from-purple-50/60 via-white to-pink-50/40 backdrop-blur-md p-5 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02]">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className={`absolute -inset-2 ${mode === 'grant' ? 'bg-gradient-to-r from-purple-500 to-violet-600' : 'bg-gradient-to-r from-orange-500 to-red-600'} rounded-xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500 animate-pulse`}></div>
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
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
                  <div className="relative w-24 h-24 rounded-xl ring-4 ring-white shadow-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <Package className="h-12 w-12 text-white/50" />
                  </div>
                )}
                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${mode === 'grant' ? 'bg-purple-500' : 'bg-orange-500'} flex items-center justify-center ring-2 ring-white shadow-lg`}>
                  {type === 'listing' ? <Package className="h-3 w-3 text-white" /> : <Gavel className="h-3 w-3 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-3">{nft.name}</h3>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Token ID</span>
                    <span className="font-semibold text-sm text-gray-700">{nft.tokenId}</span>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Serial #</span>
                    <span className="font-semibold text-sm text-gray-700">#{nft.serialNumber}</span>
                  </div>
                  {price && (
                    <>
                      <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                          {type === 'auction' ? 'Starting Bid' : 'Price'}
                        </span>
                        <span className={`font-bold text-lg ${mode === 'grant' ? 'text-purple-600' : 'text-orange-600'}`}>
                          {price.toFixed(2)} ℏ
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          {mode === 'grant' ? (
            <Alert className="rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50/80 to-violet-50/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Info className="h-6 w-6 text-white" />
                </div>
                <AlertDescription className="flex-1 pt-2">
                  <p className="text-base font-bold text-purple-900 mb-1">What is an allowance?</p>
                  <p className="text-sm text-purple-700">
                    This grants the operator permission to transfer your NFT when a buyer purchases it. 
                    The operator cannot take your NFT without a buyer paying the price. This is secure and standard practice.
                  </p>
                </AlertDescription>
              </div>
            </Alert>
          ) : (
            <Alert className="rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50/80 to-red-50/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <AlertDescription className="flex-1 pt-2">
                  <p className="text-base font-bold text-orange-900 mb-1">This will immediately remove your {type}</p>
                  <p className="text-sm text-orange-700">
                    The {type} will be cancelled and the operator's permission will be revoked. 
                    Your NFT will return to your wallet.
                  </p>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50/80 to-rose-50/60 backdrop-blur-sm shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <AlertDescription className="flex-1 pt-1.5">
                  <p className="text-sm font-semibold text-red-900 mb-2">{error}</p>
                  {!isConnected && (
                    <Button
                      onClick={handleConnectWallet}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect HashPack Wallet
                    </Button>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Success State */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`w-20 h-20 rounded-full ${mode === 'grant' ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-gradient-to-br from-orange-500 to-red-600'} flex items-center justify-center shadow-xl mb-4 animate-bounce`}>
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">
                {mode === 'grant' ? 'Allowance Granted!' : 'Allowance Revoked!'}
              </p>
              <p className="text-sm text-gray-600">
                {mode === 'grant' 
                  ? `Your ${type} is now active on the marketplace` 
                  : `Your ${type} has been cancelled`}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {step !== 'complete' && (
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing || isCheckingPairing}
                className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAllowanceAction}
                disabled={isProcessing || !isConnected || isCheckingPairing || !isPairingReady}
                className={`flex-1 h-12 ${mode === 'grant' ? 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700' : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {step === 'signing' ? 'Check Your Wallet...' : 'Processing...'}
                  </>
                ) : isCheckingPairing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Checking Wallet Pairing...
                  </>
                ) : !isConnected ? (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet First
                  </>
                ) : !isPairingReady ? (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    Wallet Not Paired
                  </>
                ) : (
                  <>
                    <Icon className="mr-2 h-5 w-5" />
                    {actionText}
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
