// Commodity Price Service with Static Data Fallback
// Using static data until paid API is available
// To switch to live API: Set useStaticData = false and add valid API key

export interface CommodityPrice {
  name: string
  symbol: string
  price: number
  change: number
  changePercent: number
  unit: string
  lastUpdate: string
}

export interface TwelveDataResponse {
  symbol: string
  name: string
  price: string
  day_change: string
  change_percent: string
  previous_close: string
}

// List of commodity symbols supported by Twelve Data
const COMMODITY_SYMBOLS = [
  { symbol: 'GC=F', name: 'Gold', unit: 'USD/oz' },
  { symbol: 'SI=F', name: 'Silver', unit: 'USD/oz' },
  { symbol: 'CL=F', name: 'Crude Oil', unit: 'USD/bbl' },
  { symbol: 'ZC=F', name: 'Corn', unit: 'USD/bu' },
  { symbol: 'HG=F', name: 'Copper', unit: 'USD/lb' },
  { symbol: 'ZW=F', name: 'Wheat', unit: 'USD/bu' },
  { symbol: 'KC=F', name: 'Coffee', unit: 'USD/lb' },
  { symbol: 'CC=F', name: 'Cocoa', unit: 'USD/t' },
  { symbol: 'CT=F', name: 'Cotton', unit: 'USD/lb' },
  { symbol: 'NG=F', name: 'Natural Gas', unit: 'USD/MMBtu' },
  { symbol: 'PL=F', name: 'Platinum', unit: 'USD/oz' },
]

// Static commodity data (updated manually until we get paid API)
const STATIC_COMMODITY_DATA: Record<string, CommodityPrice> = {
  'GC=F': {
    name: 'Gold',
    symbol: 'GC=F',
    price: 1925.31,
    change: -13.68,
    changePercent: -0.71,
    unit: 'USD/oz',
    lastUpdate: new Date().toISOString()
  },
  'SI=F': {
    name: 'Silver',
    symbol: 'SI=F',
    price: 23.27,
    change: 0.12,
    changePercent: 0.53,
    unit: 'USD/oz',
    lastUpdate: new Date().toISOString()
  },
  'CL=F': {
    name: 'Crude Oil',
    symbol: 'CL=F',
    price: 86.68,
    change: -1.06,
    changePercent: -1.21,
    unit: 'USD/bbl',
    lastUpdate: new Date().toISOString()
  },
  'ZC=F': {
    name: 'Corn',
    symbol: 'ZC=F',
    price: 4.8,
    change: -0.04,
    changePercent: -0.91,
    unit: 'USD/bu',
    lastUpdate: new Date().toISOString()
  },
  'HG=F': {
    name: 'Copper',
    symbol: 'HG=F',
    price: 8.75,
    change: 0.08,
    changePercent: 0.96,
    unit: 'USD/lb',
    lastUpdate: new Date().toISOString()
  },
  'ZW=F': {
    name: 'Wheat',
    symbol: 'ZW=F',
    price: 5.45,
    change: 0.02,
    changePercent: 0.37,
    unit: 'USD/bu',
    lastUpdate: new Date().toISOString()
  },
  'KC=F': {
    name: 'Coffee',
    symbol: 'KC=F',
    price: 1.65,
    change: -0.03,
    changePercent: -1.79,
    unit: 'USD/lb',
    lastUpdate: new Date().toISOString()
  },
  'CC=F': {
    name: 'Cocoa',
    symbol: 'CC=F',
    price: 3250.00,
    change: 15.50,
    changePercent: 0.48,
    unit: 'USD/t',
    lastUpdate: new Date().toISOString()
  },
  'CT=F': {
    name: 'Cotton',
    symbol: 'CT=F',
    price: 0.73,
    change: -0.01,
    changePercent: -1.35,
    unit: 'USD/lb',
    lastUpdate: new Date().toISOString()
  },
  'NG=F': {
    name: 'Natural Gas',
    symbol: 'NG=F',
    price: 2.85,
    change: 0.05,
    changePercent: 1.79,
    unit: 'USD/MMBtu',
    lastUpdate: new Date().toISOString()
  },
  'PL=F': {
    name: 'Platinum',
    symbol: 'PL=F',
    price: 925.50,
    change: -8.25,
    changePercent: -0.88,
    unit: 'USD/oz',
    lastUpdate: new Date().toISOString()
  }
}

class CommodityPriceService {
  private apiKey: string
  private baseUrl = 'https://api.twelvedata.com'
  private cache: Map<string, { data: CommodityPrice; timestamp: number }> = new Map()
  private cacheTimeout = 3600000 // 1 hour cache
  private priceHistory: Map<string, number[]> = new Map()
  private lastPrices: Map<string, number> = new Map()
  private useStaticData = true // Set to false when paid API is available

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY || ''
    if (!this.apiKey) {
      console.warn('⚠️ Twelve Data API key not found. Using static data.')
      this.useStaticData = true
    }
    this.initializePriceHistory()
  }

  private initializePriceHistory() {
    // Initialize with realistic base prices
    const basePrices: Record<string, number> = {
      'GC=F': 1950, 'SI=F': 23, 'CL=F': 89, 'ZC=F': 4.8, 'HG=F': 8.7,
      'ZW=F': 6.2, 'KC=F': 1.4, 'CC=F': 2780, 'CT=F': 0.73, 'NG=F': 2.98, 'PL=F': 925
    }

    COMMODITY_SYMBOLS.forEach(({ symbol }) => {
      const basePrice = basePrices[symbol] || 100
      this.lastPrices.set(symbol, basePrice)
      this.priceHistory.set(symbol, [basePrice])
    })
  }

  private generateRealisticPriceMovement(symbol: string, currentPrice: number): number {
    // Get price history for trend analysis
    const history = this.priceHistory.get(symbol) || [currentPrice]
    
    // Calculate volatility based on commodity type
    const volatilityMap: Record<string, number> = {
      'GC=F': 0.015,  // Gold - moderate volatility
      'SI=F': 0.025,  // Silver - higher volatility
      'CL=F': 0.030,  // Oil - high volatility
      'ZC=F': 0.020,  // Corn - moderate volatility
      'HG=F': 0.025,  // Copper - moderate-high volatility
      'ZW=F': 0.018,  // Wheat - moderate volatility
      'KC=F': 0.028,  // Coffee - high volatility
      'CC=F': 0.022,  // Cocoa - moderate volatility
      'CT=F': 0.024,  // Cotton - moderate volatility
      'NG=F': 0.035,  // Natural Gas - very high volatility
      'PL=F': 0.020   // Platinum - moderate volatility
    }

    const volatility = volatilityMap[symbol] || 0.020

    // Calculate trend based on recent price movements
    let trend = 0
    if (history.length > 3) {
      const recent = history.slice(-3)
      const oldPrice = recent[0]
      const newPrice = recent[recent.length - 1]
      trend = (newPrice - oldPrice) / oldPrice
    }

    // Mean reversion factor (prices tend to revert to mean over time)
    const basePrice = this.lastPrices.get(symbol) || currentPrice
    const deviation = (currentPrice - basePrice) / basePrice
    const meanReversion = -deviation * 0.1

    // Random component
    const randomComponent = (Math.random() - 0.5) * volatility

    // Combine factors with some momentum
    const momentum = trend * 0.3
    const totalChange = momentum + meanReversion + randomComponent

    // Apply change
    const newPrice = currentPrice * (1 + totalChange)
    
    // Update history (keep last 20 prices)
    history.push(newPrice)
    if (history.length > 20) {
      history.shift()
    }
    this.priceHistory.set(symbol, history)

    return newPrice
  }

  private async fetchCommodityPrice(symbol: string, name: string, unit: string): Promise<CommodityPrice | null> {
    // Use static data instead of API for now
    if (this.useStaticData) {
      const staticData = STATIC_COMMODITY_DATA[symbol]
      if (staticData) {
        console.log(`📊 Using static data for ${name}:`, staticData.price)
        return {
          ...staticData,
          lastUpdate: new Date().toISOString()
        }
      }
    }

    // Fallback to API (when useStaticData is false and API key exists)
    if (!this.apiKey) {
      return this.generateMockPrice(symbol, name, unit)
    }

    try {
      const url = `${this.baseUrl}/price?symbol=${symbol}&apikey=${this.apiKey}`
      console.log(`🔄 Fetching ${name} price from:`, url.replace(this.apiKey, 'API_KEY'))
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error(`❌ API Error for ${name}:`, response.status, response.statusText)
        return this.generateMockPrice(symbol, name, unit)
      }

      const data = await response.json()
      
      if (data.code && data.message) {
        console.error(`❌ Twelve Data Error for ${name}:`, data.message)
        return this.generateMockPrice(symbol, name, unit)
      }

      const price = parseFloat(data.price || '0')
      const previousClose = parseFloat(data.previous_close || price.toString())
      const change = price - previousClose
      const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0

      return {
        name,
        symbol,
        price,
        change,
        changePercent,
        unit,
        lastUpdate: new Date().toISOString()
      }
    } catch (error) {
      console.error(`❌ Network error fetching ${name}:`, error)
      return this.generateMockPrice(symbol, name, unit)
    }
  }

  private generateMockPrice(symbol: string, name: string, unit: string): CommodityPrice {
    // Get current price or initialize
    const currentPrice = this.lastPrices.get(symbol) || 100
    
    // Generate new price with realistic movement
    const newPrice = this.generateRealisticPriceMovement(symbol, currentPrice)
    
    // Calculate change from previous price
    const change = newPrice - currentPrice
    const changePercent = currentPrice !== 0 ? (change / currentPrice) * 100 : 0

    // Update last price
    this.lastPrices.set(symbol, newPrice)

    return {
      name,
      symbol,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      unit,
      lastUpdate: new Date().toISOString()
    }
  }

  // Method to continuously generate new prices (called every few seconds)
  generateContinuousUpdates(): CommodityPrice[] {
    return COMMODITY_SYMBOLS.map(({ symbol, name, unit }) => {
      return this.generateMockPrice(symbol, name, unit)
    })
  }

  async getAllCommodityPrices(): Promise<CommodityPrice[]> {
    console.log('🚀 Fetching commodity prices...')
    
    const promises = COMMODITY_SYMBOLS.map(async ({ symbol, name, unit }) => {
      // Check cache first
      const cached = this.cache.get(symbol)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 Using cached data for ${name}`)
        return cached.data
      }

      // Fetch fresh data
      const price = await this.fetchCommodityPrice(symbol, name, unit)
      if (price) {
        this.cache.set(symbol, { data: price, timestamp: Date.now() })
      }
      return price
    })

    const results = await Promise.all(promises)
    const validPrices = results.filter((price): price is CommodityPrice => price !== null)
    
    console.log(`✅ Fetched ${validPrices.length}/${COMMODITY_SYMBOLS.length} commodity prices`)
    return validPrices
  }

  // Get API usage info
  getApiInfo() {
    return {
      hasApiKey: !!this.apiKey,
      cacheSize: this.cache.size,
      supportedCommodities: COMMODITY_SYMBOLS.length,
      usingStaticData: this.useStaticData
    }
  }

  // Method to switch between static and live data (for future use)
  public enableLiveData(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey
    }
    this.useStaticData = false
    console.log('✅ Switched to live API data')
  }

  public enableStaticData() {
    this.useStaticData = true
    console.log('📊 Switched to static data')
  }

  public isUsingStaticData(): boolean {
    return this.useStaticData
  }
}

// Singleton instance
export const commodityService = new CommodityPriceService()

// Export for direct use
export { CommodityPriceService }