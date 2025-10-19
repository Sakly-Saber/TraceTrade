// Twelve Data API Service for Commodity Prices
// API Documentation: https://twelvedata.com/docs

export interface TwelveDataPrice {
  symbol: string
  name: string
  exchange: string
  price: string
  change: string
  percent_change: string
  timestamp: string
}

export interface CommodityData {
  name: string
  symbol: string
  price: number
  change: number
  changePercent: number
  unit: string
  lastUpdated: string
}

// Commodity symbols available in Twelve Data
const COMMODITY_SYMBOLS = {
  'GC=F': { name: 'Gold', unit: 'USD/oz' },
  'SI=F': { name: 'Silver', unit: 'USD/oz' },
  'CL=F': { name: 'Crude Oil', unit: 'USD/bbl' },
  'ZC=F': { name: 'Corn', unit: 'USD/bu' },
  'HG=F': { name: 'Copper', unit: 'USD/lb' },
  'ZW=F': { name: 'Wheat', unit: 'USD/bu' },
  'KC=F': { name: 'Coffee', unit: 'USD/lb' },
  'CC=F': { name: 'Cocoa', unit: 'USD/t' },
  'CT=F': { name: 'Cotton', unit: 'USD/lb' },
  'NG=F': { name: 'Natural Gas', unit: 'USD/MMBtu' },
  'PL=F': { name: 'Platinum', unit: 'USD/oz' },
  'PA=F': { name: 'Palladium', unit: 'USD/oz' }
}

class CommodityPriceService {
  private apiKey: string
  private baseUrl = 'https://api.twelvedata.com'
  private cache: Map<string, { data: CommodityData[], timestamp: number }> = new Map()
  private cacheExpiry = 60 * 60 * 1000 // 1 hour in milliseconds

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Fetch real-time commodity prices from Twelve Data API
   */
  async fetchCommodityPrices(): Promise<CommodityData[]> {
    try {
      // Check cache first
      const cached = this.cache.get('commodity_prices')
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('📦 Using cached commodity data')
        return cached.data
      }

      console.log('🔄 Fetching fresh commodity data from Twelve Data API...')
      
      const symbols = Object.keys(COMMODITY_SYMBOLS)
      const symbolString = symbols.join(',')
      
      const url = `${this.baseUrl}/price?symbol=${symbolString}&apikey=${this.apiKey}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Handle both single symbol and multiple symbols response format
      const prices = Array.isArray(data) ? data : [data]
      
      const commodityData: CommodityData[] = prices.map((item: any) => {
        const symbolInfo = COMMODITY_SYMBOLS[item.symbol as keyof typeof COMMODITY_SYMBOLS]
        
        if (!symbolInfo) {
          console.warn(`Unknown commodity symbol: ${item.symbol}`)
          return null
        }

        return {
          name: symbolInfo.name,
          symbol: item.symbol,
          price: parseFloat(item.price) || 0,
          change: parseFloat(item.change) || 0,
          changePercent: parseFloat(item.percent_change) || 0,
          unit: symbolInfo.unit,
          lastUpdated: new Date().toISOString()
        }
      }).filter((item): item is CommodityData => item !== null) // Type-safe filter

      // Cache the results
      this.cache.set('commodity_prices', {
        data: commodityData,
        timestamp: Date.now()
      })

      console.log(`✅ Fetched ${commodityData.length} commodity prices`)
      return commodityData

    } catch (error) {
      console.error('❌ Failed to fetch commodity prices:', error)
      throw error
    }
  }

  /**
   * Get cached data or fallback to mock data
   */
  getCachedOrMockData(): CommodityData[] {
    const cached = this.cache.get('commodity_prices')
    if (cached) {
      return cached.data
    }

    // Return mock data as fallback
    return this.generateMockCommodities()
  }

  /**
   * Generate mock commodity data (fallback)
   */
  private generateMockCommodities(): CommodityData[] {
    const basePrices = {
      'Gold': { price: 1950.45, unit: 'USD/oz' },
      'Silver': { price: 23.67, unit: 'USD/oz' },
      'Crude Oil': { price: 89.34, unit: 'USD/bbl' },
      'Corn': { price: 4.89, unit: 'USD/bu' },
      'Copper': { price: 8.76, unit: 'USD/lb' },
      'Wheat': { price: 6.23, unit: 'USD/bu' },
      'Coffee': { price: 1.45, unit: 'USD/lb' },
      'Cocoa': { price: 2789.00, unit: 'USD/t' },
      'Cotton': { price: 0.73, unit: 'USD/lb' },
      'Natural Gas': { price: 2.98, unit: 'USD/MMBtu' },
      'Platinum': { price: 925.30, unit: 'USD/oz' },
      'Iron Ore': { price: 112.50, unit: 'USD/t' },
      'Aluminum': { price: 2156.00, unit: 'USD/t' },
      'Zinc': { price: 2487.50, unit: 'USD/t' },
      'Nickel': { price: 20125.00, unit: 'USD/t' }
    }

    return Object.entries(basePrices).map(([name, data]) => {
      const fluctuation = (Math.random() - 0.5) * 0.1 // ±5% max change
      const currentPrice = data.price * (1 + fluctuation)
      const change = currentPrice - data.price
      const changePercent = (change / data.price) * 100

      return {
        name,
        symbol: name.replace(/\s+/g, '').toUpperCase(),
        price: parseFloat(currentPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        unit: data.unit,
        lastUpdated: new Date().toISOString()
      }
    })
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Create singleton instance
const commodityService = new CommodityPriceService('6036d4aba84b49a6b245a4b0d3125b1c')

export default commodityService