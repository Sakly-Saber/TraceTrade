'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Gavel, TrendingUp, Users, Clock } from "lucide-react"

interface AuctionStats {
  liveAuctions: number
  todaysSales: string
  activeBidders: number
  endingSoon: number
}

class AuctionStatsTracker {
  private static instance: AuctionStatsTracker
  private currentStats: AuctionStats

  private constructor() {
    this.currentStats = {
      liveAuctions: 24,
      todaysSales: "$12.8M",
      activeBidders: 156,
      endingSoon: 8
    }
  }

  static getInstance(): AuctionStatsTracker {
    if (!AuctionStatsTracker.instance) {
      AuctionStatsTracker.instance = new AuctionStatsTracker()
    }
    return AuctionStatsTracker.instance
  }

  updateStats(): AuctionStats {
    // Live auctions occasionally change (new ones start, some end)
    if (Math.random() > 0.85) {
      this.currentStats.liveAuctions += Math.random() > 0.5 ? 1 : -1
      this.currentStats.liveAuctions = Math.max(20, Math.min(30, this.currentStats.liveAuctions))
    }

    // Today's sales keep growing
    const currentValue = parseFloat(this.currentStats.todaysSales.replace('$', '').replace('M', ''))
    const increment = (Math.random() * 0.5) + 0.1 // 0.1M to 0.6M increase
    const newValue = currentValue + increment
    this.currentStats.todaysSales = `$${newValue.toFixed(1)}M`

    // Active bidders fluctuate
    if (Math.random() > 0.7) {
      const change = Math.floor(Math.random() * 6) - 2 // -2 to +3 change
      this.currentStats.activeBidders += change
      this.currentStats.activeBidders = Math.max(140, Math.min(200, this.currentStats.activeBidders))
    }

    // Ending soon changes as auctions end and new ones approach deadline
    if (Math.random() > 0.8) {
      this.currentStats.endingSoon += Math.random() > 0.5 ? 1 : -1
      this.currentStats.endingSoon = Math.max(5, Math.min(15, this.currentStats.endingSoon))
    }

    return { ...this.currentStats }
  }

  getCurrentStats(): AuctionStats {
    return { ...this.currentStats }
  }
}

const statsTracker = AuctionStatsTracker.getInstance()

export function AuctionStatsBar() {
  const [stats, setStats] = useState<AuctionStats>(statsTracker.getCurrentStats())

  useEffect(() => {
    // Update stats every 8 seconds
    const interval = setInterval(() => {
      const newStats = statsTracker.updateStats()
      setStats(newStats)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Gavel className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.liveAuctions}</p>
              <p className="text-sm text-muted-foreground">Live Auctions</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.todaysSales}</p>
              <p className="text-sm text-muted-foreground">Today's Sales</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.activeBidders}</p>
              <p className="text-sm text-muted-foreground">Active Bidders</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-chart-2" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.endingSoon}</p>
              <p className="text-sm text-muted-foreground">Ending Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}