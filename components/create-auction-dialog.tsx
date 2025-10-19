'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Gavel, DollarSign, Calendar, Lock, CheckCircle2, Sparkles, AlertCircle, Loader2, Clock } from 'lucide-react'

interface CreateAuctionDialogProps {
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
  businessId?: string
  onSuccess?: () => void
}

export function CreateAuctionDialog({
  isOpen,
  onClose,
  nft,
  walletAddress,
  userId,
  businessId,
  onSuccess
}: CreateAuctionDialogProps) {
  const [step, setStep] = useState<'details' | 'allowance'>('details')
  const [startingBid, setStartingBid] = useState('')
  const [reservePrice, setReservePrice] = useState('')
  const [durationHours, setDurationHours] = useState('24')
  const [durationMinutes, setDurationMinutes] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingAuctionId, setPendingAuctionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleCreateAuction = async () => {
    setError('')
    const startBid = parseFloat(startingBid)
    const reserve = parseFloat(reservePrice || '0')
    const hours = parseInt(durationHours) || 0
    const minutes = parseInt(durationMinutes) || 0
    
    // Calculate total duration in minutes
    const totalMinutes = (hours * 60) + minutes
    
    if (isNaN(startBid) || startBid <= 0) {
      setError('Please enter a valid starting bid')
      return
    }

    if (reserve && reserve < startBid) {
      setError('Reserve price must be higher than starting bid')
      return
    }

    if (totalMinutes < 30) {
      setError('Auction duration must be at least 30 minutes')
      return
    }

    setIsLoading(true)
    try {
      const endTime = new Date()
      endTime.setMinutes(endTime.getMinutes() + totalMinutes)

      const res = await fetch('/api/auctions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftAssetId: `${nft.tokenId}-${nft.serialNumber}`,
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          seller: walletAddress,
          ownerId: userId || walletAddress,
          collectionId: nft.tokenId,
          walletAddress: walletAddress,
          auctionName: nft.name || `Auction for ${nft.tokenId} #${nft.serialNumber}`,
          startingBid: startBid,
          reservePrice: reserve || startBid,
          durationHours: totalMinutes / 60, // Convert total minutes to hours
          endTime: endTime.toISOString(),
          sellerId: walletAddress,
          businessId: businessId,
          status: 'PENDING',
          nftData: {
            name: nft.name,
            description: nft.description,
            imageUrl: nft.image || '',
            aiImageUrl: nft.image || '',
            metadataUri: nft.metadataUri || '',
            symbol: nft.symbol,
            attributes: nft.attributes
          }
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setPendingAuctionId(data.auction?.id || null)
        setStep('allowance')
      } else {
        setError(data.error || 'Failed to create auction')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantAllowance = async () => {
    if (!pendingAuctionId) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Import HashConnect and Hedera SDK for allowance approval
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

      // Update auction status to ACTIVE
      const updateRes = await fetch('/api/allowance/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'auction',
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          seller: walletAddress,
          allowanceTransactionId: result.transactionId,
          priceHbar: parseFloat(startingBid)
        })
      })

      const data = await updateRes.json()
      if (data.success) {
        onSuccess?.()
        handleClose()
      } else {
        setError(data.error || 'Failed to update auction status')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to grant allowance')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('details')
    setStartingBid('')
    setReservePrice('')
    setDurationHours('24')
    setDurationMinutes('0')
    setError('')
    setPendingAuctionId(null)
    onClose()
  }

  // Calculate end date based on hours and minutes
  const hours = parseInt(durationHours) || 0
  const minutes = parseInt(durationMinutes) || 0
  const totalMinutes = (hours * 60) + minutes
  const endDate = new Date()
  endDate.setMinutes(endDate.getMinutes() + totalMinutes)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border-2 border-amber-200/50 shadow-2xl overflow-hidden">
        
        {/* Step 1: Auction Details */}
        {step === 'details' && (
          <>
            {/* Animated Header */}
            <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl"></div>
              
              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                    <Gavel className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">
                      Create Auction
                    </DialogTitle>
                    <DialogDescription className="text-white/90 text-base">
                      Set auction parameters and start bidding
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              {/* NFT Preview */}
              <div className="rounded-xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 p-5 shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500"></div>
                    <img 
                      src={nft.image} 
                      alt={nft.name}
                      className="relative w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-xl"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center ring-2 ring-white shadow-lg">
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

              {/* Auction Parameters */}
              <div className="space-y-4">
                {/* Starting Bid */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    Starting Bid
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Minimum bid amount"
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      className="h-12 text-lg pr-16 border-2 border-amber-200 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-lg">
                      ℏ
                    </span>
                  </div>
                </div>

                {/* Reserve Price (Optional) */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    Reserve Price <span className="text-sm font-normal text-gray-500">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Minimum selling price"
                      value={reservePrice}
                      onChange={(e) => setReservePrice(e.target.value)}
                      className="h-12 text-lg pr-16 border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-lg">
                      ℏ
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Won't sell below this price, even if there are bids
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Auction Duration
                  </Label>
                  
                  {/* Quick Presets - Single Row */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {[
                      { label: '1h', hours: '1', minutes: '0' },
                      { label: '2h', hours: '2', minutes: '0' },
                      { label: '6h', hours: '6', minutes: '0' },
                      { label: '12h', hours: '12', minutes: '0' },
                      { label: '24h', hours: '24', minutes: '0' },
                      { label: '48h', hours: '48', minutes: '0' }
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={durationHours === preset.hours && durationMinutes === preset.minutes ? 'default' : 'outline'}
                        onClick={() => {
                          setDurationHours(preset.hours)
                          setDurationMinutes(preset.minutes)
                        }}
                        className={`h-8 px-3 rounded-lg text-xs flex-shrink-0 ${
                          durationHours === preset.hours && durationMinutes === preset.minutes
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'border-2 hover:bg-blue-50'
                        }`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  {/* Custom Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        max="720"
                        placeholder="0"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        className="h-11 text-base border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="0"
                        value={durationMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          setDurationMinutes(Math.min(59, Math.max(0, val)).toString())
                        }}
                        className="h-11 text-base border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Duration Info */}
                  <div className="flex items-center justify-between text-xs">
                    {totalMinutes >= 30 ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {hours > 0 && `${hours}h `}{minutes > 0 && `${minutes}m`} duration
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Minimum 30 minutes required
                      </span>
                    )}
                    <span className="text-gray-500">
                      Ends: {endDate.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
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
                    After creating the auction, you'll need to approve the marketplace to transfer your NFT to the winner.
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
                  onClick={handleCreateAuction}
                  disabled={!startingBid || isLoading}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Auction...
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
                <h3 className="font-bold text-xl text-gray-900 mb-2">Auction Created!</h3>
                <p className="text-gray-600">
                  Starting bid: <span className="font-bold text-amber-600">{startingBid} ℏ</span>
                  {reservePrice && (
                    <> • Reserve: <span className="font-bold text-orange-600">{reservePrice} ℏ</span></>
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Duration: {hours > 0 && `${hours}h `}{minutes > 0 && `${minutes}m`}
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
                      Granting allowance allows the marketplace to automatically transfer your NFT to the auction winner. This ensures instant delivery when the auction ends.
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
