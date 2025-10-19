"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Gavel, TrendingUp, Info, Loader2, Zap, Award, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface BidDialogProps {
  isOpen: boolean
  onClose: () => void
  auction: {
    id: string
    name: string
    image: string
    currentBid: number
    currentBidHbar: number
    minBidIncrementPct: number
    reservePrice: number
    currency: string
  }
  walletAddress?: string
  onSuccess?: () => void
}

export function BidDialog({ isOpen, onClose, auction, walletAddress, onSuccess }: BidDialogProps) {
  const [bidAmount, setBidAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedQuickBid, setSelectedQuickBid] = useState<number | null>(null)

  // Calculate minimum bid with fallbacks for undefined values
  const incrementPct = auction.minBidIncrementPct || 5 // Default 5%
  const currentBid = auction.currentBidHbar || 0
  
  const minBid = currentBid > 0 
    ? currentBid * (1 + incrementPct / 100)
    : (auction.reservePrice || 1)

  const minBidFormatted = minBid.toFixed(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!walletAddress) {
      toast.error("Please connect your wallet first")
      return
    }

    const bidValue = parseFloat(bidAmount)

    // Validations
    if (isNaN(bidValue) || bidValue <= 0) {
      toast.error("Please enter a valid bid amount")
      return
    }

    if (bidValue < minBid) {
      toast.error(`Minimum bid is ${minBidFormatted} HBAR`)
      return
    }

    setSubmitting(true)

    try {
      toast.loading("Placing your bid...", { id: "bid-toast" })

      const response = await fetch("/api/auctions/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId: auction.id,
          bidAmountHbar: bidValue,
          bidderAccountId: walletAddress,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Bid API error response:', result)
        toast.error(result.error || result.message || "Failed to place bid", { 
          id: "bid-toast",
          description: result.details || undefined
        })
        return
      }

      if (result.success) {
        toast.success(`Bid placed successfully! Your bid: ${bidValue} HBAR`, { id: "bid-toast" })
        setBidAmount("")
        onClose()
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.reload()
        }
      } else {
        toast.error(result.error || "Failed to place bid", { id: "bid-toast" })
      }
    } catch (error) {
      console.error("Bid error:", error)
      toast.error("Network error - failed to place bid. Please check your connection and try again.", { id: "bid-toast" })
    } finally {
      setSubmitting(false)
    }
  }

  const suggestedBids = [
    { amount: minBid, label: "Min", icon: null },
    { amount: minBid * 1.1, label: "+10%", icon: TrendingUp },
    { amount: minBid * 1.25, label: "+25%", icon: Zap },
    { amount: minBid * 1.5, label: "+50%", icon: Award }
  ]
  
  const handleQuickBid = (amount: number, index: number) => {
    setBidAmount(amount.toFixed(2))
    setSelectedQuickBid(index)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-2 border-blue-200/50 shadow-2xl overflow-hidden">
        {/* Animated Header with Gradient */}
        <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 p-8 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl"></div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-xl transform hover:scale-110 transition-transform duration-300">
                <Gavel className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-white mb-1 tracking-tight">Place Your Bid</DialogTitle>
                <DialogDescription className="text-white/90 text-base">
                  Make a competitive bid on this auction
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Auction Preview Card with Glass Morphism */}
          <div className="rounded-xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50/60 via-white to-purple-50/40 backdrop-blur-md p-5 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02]">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500 animate-pulse"></div>
                <img
                  src={auction.image || '/placeholder-nft.png'}
                  alt={auction.name}
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
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-white shadow-lg">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-3">{auction.name}</h3>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Current Bid</span>
                    <span className="font-bold text-lg text-green-600">{auction.currentBidHbar.toFixed(2)} ℏ</span>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Reserve Price</span>
                    <span className="font-semibold text-lg text-gray-700">{auction.reservePrice.toFixed(2)} ℏ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Bid Info Card */}
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 backdrop-blur-sm p-5 flex items-start gap-4 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Info className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-blue-900 mb-1">Minimum bid: {minBidFormatted} HBAR</p>
              <p className="text-sm text-blue-700">
                Includes {incrementPct}% increment over current bid
              </p>
            </div>
          </div>

          {/* Quick Bid Options */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Quick Bid</Label>
            <div className="grid grid-cols-4 gap-3">
              {suggestedBids.map((bid, index) => {
                const Icon = bid.icon
                const isSelected = selectedQuickBid === index
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleQuickBid(bid.amount, index)}
                    className={`relative overflow-hidden rounded-xl p-4 border-2 transition-all duration-300 transform hover:scale-105 ${
                      isSelected 
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-105' 
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className="relative">
                      {Icon && <Icon className={`h-4 w-4 mx-auto mb-1 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />}
                      <div className={`text-xs font-medium mb-1 ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>{bid.label}</div>
                      <div className={`text-sm font-bold ${isSelected ? 'text-green-600' : 'text-gray-900'}`}>
                        {bid.amount.toFixed(1)} ℏ
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bid Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="bidAmount" className="text-sm font-semibold text-gray-700">
              Your Bid Amount (HBAR)
            </Label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
              <div className="relative">
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min={minBid}
                  value={bidAmount}
                  onChange={(e) => {
                    setBidAmount(e.target.value)
                    setSelectedQuickBid(null)
                  }}
                  placeholder={`Min: ${minBidFormatted} HBAR`}
                  className="h-14 text-lg font-semibold pr-14 border-2 border-gray-200 focus:border-green-500 rounded-xl shadow-sm"
                  disabled={submitting}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-green-600">
                  ℏ
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !bidAmount || parseFloat(bidAmount) < minBid}
              className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Placing Bid...
                </>
              ) : (
                <>
                  <Gavel className="mr-2 h-5 w-5" />
                  Place Bid
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
