"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/hooks/use-wallet"
import { useAuction } from "@/hooks/use-auction"
import { Loader2, TrendingUp } from "lucide-react"

interface BidFormProps {
  auctionId: number
  currentBid: string
  minBid: string
  currency: string
}

export function BidForm({ auctionId, currentBid, minBid, currency }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isConnected, connect, address } = useWallet()
  const { placeBid } = useAuction(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bidAmount || !isConnected || !address) {
      console.error('❌ Cannot place bid:', { bidAmount, isConnected, address })
      return
    }

    setIsSubmitting(true)
    try {
      console.log('📤 [BID-FORM] Placing bid with wallet:', address)
      await placeBid(auctionId.toString(), bidAmount, currency, address)
      setBidAmount("")
      alert('✅ Bid placed successfully!')
    } catch (error) {
      console.error("❌ Failed to place bid:", error)
      alert(`Failed to place bid: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Place Your Bid
          </CardTitle>
          <CardDescription>Connect your wallet to participate in this auction</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => connect()} className="w-full">
            Connect Wallet to Bid
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Place Your Bid
        </CardTitle>
        <CardDescription>
          Current highest bid: {currentBid} {currency}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bidAmount">Your Bid Amount</Label>
            <div className="relative">
              <Input
                id="bidAmount"
                type="number"
                placeholder={`Minimum: ${minBid}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="pr-16"
                min={minBid}
                step="0.01"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {currency}
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              • Minimum bid: {minBid} {currency}
            </p>
            <p>• Your bid must be higher than the current bid</p>
            <p>• Funds will be held in escrow until auction ends</p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !bidAmount}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Bid...
              </>
            ) : (
              `Place Bid: ${bidAmount || "0"} ${currency}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
