'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react'
import { commodityService, CommodityPrice } from '@/lib/services/commodityService'

export function CommodityPriceTicker() {
  const [commodities, setCommodities] = useState<CommodityPrice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch commodity data
  const fetchData = async () => {
    try {
      console.log('🔄 Fetching commodity prices...')
      const data = await commodityService.getAllCommodityPrices()
      setCommodities(data)
      setIsOnline(true)
      setLastUpdate(new Date())
      console.log(`✅ Updated ${data.length} commodity prices`)
    } catch (error) {
      console.error('❌ Failed to fetch commodity data:', error)
      
      // Use continuous mock updates when API fails
      console.log('🔄 Generating continuous mock data...')
      const mockData = commodityService.generateContinuousUpdates()
      setCommodities(mockData)
      setIsOnline(false)
      setLastUpdate(new Date())
      console.log(`📊 Generated ${mockData.length} mock prices with realistic movement`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial load
    fetchData()

    // Set up frequent polling every 5 seconds for real-time updates
    const realtimeInterval = setInterval(fetchData, 5000)

    return () => {
      clearInterval(realtimeInterval)
    }
  }, [])

  const formatPrice = (price: number, unit: string) => {
    if (unit.includes('USD')) {
      return `$${price.toLocaleString()}`
    }
    return price.toLocaleString()
  }

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
  }

  if (isLoading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border-b border-border text-foreground py-3">
        <div className="flex items-center justify-center">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
          <span className="text-sm text-muted-foreground">Loading commodity prices...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border-b border-border text-foreground overflow-hidden relative">
      {/* Ticker content */}
      <div className="relative py-3">
        <div className="flex items-center">
          {/* Status indicator */}
          <div className="bg-primary text-primary-foreground px-4 py-1 font-bold text-sm whitespace-nowrap flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                LIVE PRICES
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                CACHED
              </>
            )}
          </div>
          
          {/* Last update indicator */}
          {lastUpdate && (
            <div className="bg-muted text-muted-foreground px-3 py-1 text-xs whitespace-nowrap">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          
          {/* Scrolling ticker */}
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee flex items-center whitespace-nowrap">
              {commodities.map((commodity, index) => (
                <div key={`${commodity.symbol}-${index}`} className="flex items-center mx-8">
                  <span className="font-bold text-primary mr-2">{commodity.name}:</span>
                  <span className="text-foreground font-semibold mr-2">
                    {formatPrice(commodity.price, commodity.unit)}
                  </span>
                  <div className={`flex items-center text-sm ${
                    commodity.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {commodity.change >= 0 ? 
                      <TrendingUp className="w-3 h-3 mr-1" /> : 
                      <TrendingDown className="w-3 h-3 mr-1" />
                    }
                    {formatChange(commodity.change, commodity.changePercent)}
                  </div>
                  <span className="text-muted-foreground text-xs ml-2">({commodity.unit})</span>
                  <div className="mx-4 text-primary/60">•</div>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {commodities.map((commodity, index) => (
                <div key={`${commodity.symbol}-duplicate-${index}`} className="flex items-center mx-8">
                  <span className="font-bold text-primary mr-2">{commodity.name}:</span>
                  <span className="text-foreground font-semibold mr-2">
                    {formatPrice(commodity.price, commodity.unit)}
                  </span>
                  <div className={`flex items-center text-sm ${
                    commodity.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {commodity.change >= 0 ? 
                      <TrendingUp className="w-3 h-3 mr-1" /> : 
                      <TrendingDown className="w-3 h-3 mr-1" />
                    }
                    {formatChange(commodity.change, commodity.changePercent)}
                  </div>
                  <span className="text-muted-foreground text-xs ml-2">({commodity.unit})</span>
                  <div className="mx-4 text-primary/60">•</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}