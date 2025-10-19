"use client"

import { useState, useEffect, useCallback } from "react"

export function useAuction(auctionId: number | null) {
  const [auction, setAuction] = useState<any | null>(null)
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAuction = useCallback(async () => {
    if (!auctionId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch from backend API instead of blockchain
      const response = await fetch(`/api/auctions/${auctionId}`)
      const data = await response.json()

      setAuction(data)
      setBids(data.bids || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch auction")
    } finally {
      setLoading(false)
    }
  }, [auctionId])

  const placeBid = useCallback(
    async (auctionIdStr: string, amount: string, currency: string, walletAddress?: string) => {
      try {
        console.log('📤 [USE-AUCTION] Placing bid:', { auctionId: auctionIdStr, amount, currency, walletAddress })

        // Get wallet address if not provided
        let bidderAccountId = walletAddress
        if (!bidderAccountId) {
          // Try to get from wallet hook or other source
          console.warn('⚠️ [USE-AUCTION] No wallet address provided, trying to get from wallet...')
          // This should be passed from the calling component
        }

        const response = await fetch('/api/auctions/bid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auctionId: auctionIdStr,
            amount: parseFloat(amount),
            amountHbar: parseFloat(amount),
            currency: currency || 'HBAR',
            bidderAccountId: bidderAccountId, // ✅ Send wallet address for settlement
            walletAddress: bidderAccountId
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to place bid')
        }

        console.log('✅ [USE-AUCTION] Bid placed successfully:', data)

        // Refresh auction data
        await fetchAuction()

        return data.bid
      } catch (err) {
        console.error('❌ [USE-AUCTION] Failed to place bid:', err)
        throw new Error(err instanceof Error ? err.message : "Failed to place bid")
      }
    },
    [fetchAuction],
  )

  const settleAuction = useCallback(async () => {
    if (!auctionId) throw new Error("No auction ID")

    try {
      // Settle via backend API
      const response = await fetch(`/api/auctions/${auctionId}/settle`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to settle auction')
      }

      // Refresh auction data
      await fetchAuction()

      return data.transactionId
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to settle auction")
    }
  }, [auctionId, fetchAuction])

  useEffect(() => {
    fetchAuction()
  }, [fetchAuction])

  // Set up polling for real-time updates (could be replaced with WebSocket later)
  useEffect(() => {
    if (!auctionId) return

    const interval = setInterval(() => {
      fetchAuction()
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [auctionId, fetchAuction])

  return {
    auction,
    bids,
    loading,
    error,
    placeBid,
    settleAuction,
    refetch: fetchAuction,
  }
}

export function useAuctions() {
  const [auctions, setAuctions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAuctions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch from backend API
      const response = await fetch('/api/auctions')
      const data = await response.json()
      
      setAuctions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch auctions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  return {
    auctions,
    loading,
    error,
    refetch: fetchAuctions,
  }
}
