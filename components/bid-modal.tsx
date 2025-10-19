"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Gavel, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BidModalProps {
  isOpen: boolean
  onClose: () => void
  auction: {
    id: string
    name: string
    image: string
    currentBid: number
    reservePrice: number
    currency?: string
  }
  onPlaceBid: (amount: number) => Promise<void>
}

export function BidModal({ isOpen, onClose, auction, onPlaceBid }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentBid = auction.currentBid || 0
  const reservePrice = auction.reservePrice || 0
  const minimumBid = currentBid > 0 ? currentBid * 1.05 : reservePrice * 1.05
  
  const quickBidPercentages = [
    { label: "Min", value: minimumBid, suffix: "ℏ" },
    { label: "+10%", value: minimumBid * 1.10, suffix: "ℏ" },
    { label: "+25%", value: minimumBid * 1.25, suffix: "ℏ" },
    { label: "+50%", value: minimumBid * 1.50, suffix: "ℏ" }
  ]

  const handleQuickBid = (value: number) => {
    setBidAmount(value.toFixed(2))
  }

  const handleSubmit = async () => {
    const amount = parseFloat(bidAmount)
    if (amount < minimumBid) {
      alert(`Minimum bid is ${minimumBid.toFixed(2)} HBAR`)
      return
    }

    setIsSubmitting(true)
    try {
      await onPlaceBid(amount)
      onClose()
      setBidAmount("")
    } catch (error) {
      console.error('Failed to place bid:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="relative flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Gavel className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Place Your Bid</DialogTitle>
              <p className="text-emerald-100 text-sm mt-1">Make a competitive bid on this auction</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Auction Info Card */}
          <div className="bg-white rounded-xl border-2 border-emerald-100 p-4 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Auction Image */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={auction.image || '/placeholder-nft.png'}
                  alt={auction.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      const icon = document.createElement('div')
                      icon.innerHTML = '🖼️'
                      icon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:32px;opacity:0.5'
                      parent.appendChild(icon)
                    }
                  }}
                />
                <div className="absolute top-1 right-1">
                  <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 border-0">
                    ✓
                  </Badge>
                </div>
              </div>

              {/* Auction Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{auction.name}</h3>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Current Bid</p>
                    <p className="text-sm font-bold text-emerald-600">
                      {currentBid.toFixed(2)} ℏ
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Reserve Price</p>
                    <p className="text-sm font-bold text-gray-700">
                      {reservePrice.toFixed(2)} ℏ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Bid Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
            <div className="mt-0.5">
              <div className="bg-blue-500 rounded-full p-1.5">
                <Info className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 text-sm">
                Minimum bid: {minimumBid.toFixed(2)} HBAR
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Includes 5% increment over current bid
              </p>
            </div>
          </div>

          {/* Quick Bid Buttons */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-3">Quick Bid</label>
            <div className="grid grid-cols-4 gap-2">
              {quickBidPercentages.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickBid(option.value)}
                  className={cn(
                    "relative rounded-lg border-2 p-3 text-center transition-all hover:scale-105",
                    bidAmount === option.value.toFixed(2)
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-white hover:border-emerald-300"
                  )}
                >
                  <div className="text-xs text-gray-500 mb-1">{option.label}</div>
                  <div className="font-bold text-sm text-gray-900">
                    {option.value.toFixed(1)} {option.suffix}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Bid Input */}
          <div>
            <label htmlFor="bidAmount" className="text-sm font-medium text-gray-700 block mb-2">
              Your Bid Amount (HBAR)
            </label>
            <div className="relative">
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min={minimumBid}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Min: ${minimumBid.toFixed(2)} HBAR`}
                className="h-12 text-base pr-12 border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold text-lg">ℏ</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!bidAmount || parseFloat(bidAmount) < minimumBid || isSubmitting}
              className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/30"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Placing Bid...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4 mr-2" />
                  Place Bid
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
