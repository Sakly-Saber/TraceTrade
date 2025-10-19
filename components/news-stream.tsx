'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, TrendingUp, Users, Clock } from "lucide-react"

interface SaleEvent {
  id: string
  buyerName: string
  commodity: string
  amount: string
  location: string
  timeAgo: string
  type: 'sale' | 'auction_won' | 'bid'
  metadata?: {
    saleNumber: number
    totalSales: number
    totalVolume: string
  }
}

// Realistic fake data for African commodities and names
const commodityTypes = [
  "Gold Mining Rights NFT",
  "Copper Ore Certificate",
  "Cocoa Beans Token",
  "Cotton Bale NFT", 
  "Diamond Mining Share",
  "Oil Drilling Rights",
  "Coffee Bean Certificate",
  "Palm Oil Token",
  "Cassava Farm Share",
  "Rubber Plantation NFT",
  "Timber Rights Token",
  "Iron Ore Certificate",
  "Shea Butter NFT",
  "Cashew Nut Token",
  "Gum Arabic Rights"
]

const africanNames = [
  "Kwame Asante", "Amina Hassan", "Olumide Adebayo", "Fatima Kone", 
  "Themba Mthembu", "Zara Okonkwo", "Mohamed El-Rashid", "Chiamaka Nwachukwu",
  "Kofi Mensah", "Aisha Traore", "Tunde Ogundimu", "Mariam Diallo",
  "Sipho Dlamini", "Nneka Okoro", "Youssef Benali", "Adjoa Agyeman",
  "Emeka Chukwu", "Halima Musa", "Thabo Sithole", "Kemi Adeyemi",
  "Abdul Rahman", "Chinwe Okafor", "Sekou Toure", "Zeinab Abdallah",
  "Ade Ogundipe", "Safiya Ibrahim", "Mandla Zwane", "Folake Adebisi"
]

const africanLocations = [
  "Lagos, Nigeria", "Accra, Ghana", "Cairo, Egypt", "Johannesburg, SA",
  "Nairobi, Kenya", "Casablanca, Morocco", "Addis Ababa, Ethiopia",
  "Dar es Salaam, Tanzania", "Kampala, Uganda", "Abidjan, Ivory Coast",
  "Khartoum, Sudan", "Lusaka, Zambia", "Maputo, Mozambique",
  "Dakar, Senegal", "Bamako, Mali", "Ouagadougou, Burkina Faso"
]

const saleAmounts = [
  "$1,250,000", "$890,000", "$2,100,000", "$675,000", "$3,400,000",
  "$1,850,000", "$950,000", "$2,750,000", "$1,200,000", "$4,200,000",
  "$780,000", "$1,650,000", "$2,300,000", "$1,100,000", "$3,800,000"
]

const eventTypes: Array<SaleEvent['type']> = ['sale', 'auction_won', 'bid']

// Progressive statistics system
class StatisticsTracker {
  private static instance: StatisticsTracker
  private currentValues: {
    totalSales: number
    totalVolume: number
    lastSaleId: number
  }

  private constructor() {
    this.currentValues = {
      totalSales: 1247, // Starting values
      totalVolume: 24750000, // $24.75M
      lastSaleId: 1000
    }
  }

  static getInstance(): StatisticsTracker {
    if (!StatisticsTracker.instance) {
      StatisticsTracker.instance = new StatisticsTracker()
    }
    return StatisticsTracker.instance
  }

  getNextSaleAmount(): string {
    // Generate realistic amounts that contribute to growing volume
    const baseAmounts = [675000, 890000, 1250000, 1850000, 2100000, 2750000, 3400000, 4200000]
    const variance = 0.2 // ±20% variance
    const baseAmount = baseAmounts[Math.floor(Math.random() * baseAmounts.length)]
    const amount = baseAmount * (1 + (Math.random() - 0.5) * variance)
    
    // Update volume
    this.currentValues.totalVolume += amount
    
    return `$${Math.round(amount).toLocaleString()}`
  }

  getNextSaleData() {
    this.currentValues.totalSales += Math.random() > 0.7 ? 1 : 0 // Sales increase occasionally
    this.currentValues.lastSaleId += 1

    return {
      saleNumber: this.currentValues.lastSaleId,
      totalSales: this.currentValues.totalSales,
      totalVolume: `$${(this.currentValues.totalVolume / 1000000).toFixed(1)}M`
    }
  }
}

const statsTracker = StatisticsTracker.getInstance()

function generateRandomSale(): SaleEvent {
  const getRandomItem = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
  const saleData = statsTracker.getNextSaleData()
  
  return {
    id: `SALE-${saleData.saleNumber}`,
    buyerName: getRandomItem(africanNames),
    commodity: getRandomItem(commodityTypes),
    amount: statsTracker.getNextSaleAmount(),
    location: getRandomItem(africanLocations),
    timeAgo: "Just now",
    type: getRandomItem(eventTypes),
    metadata: {
      saleNumber: saleData.saleNumber,
      totalSales: saleData.totalSales,
      totalVolume: saleData.totalVolume
    }
  }
}

function getEventIcon(type: SaleEvent['type']) {
  switch (type) {
    case 'sale':
      return <Coins className="w-4 h-4 text-green-600" />
    case 'auction_won':
      return <TrendingUp className="w-4 h-4 text-primary" />
    case 'bid':
      return <Users className="w-4 h-4 text-accent" />
    default:
      return <Coins className="w-4 h-4 text-muted-foreground" />
  }
}

function getEventText(event: SaleEvent) {
  switch (event.type) {
    case 'sale':
      return `purchased ${event.commodity} for ${event.amount}`
    case 'auction_won':
      return `won auction for ${event.commodity} with bid of ${event.amount}`
    case 'bid':
      return `placed bid of ${event.amount} on ${event.commodity}`
    default:
      return `purchased ${event.commodity} for ${event.amount}`
  }
}

function getEventBadge(type: SaleEvent['type']) {
  switch (type) {
    case 'sale':
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">SOLD</Badge>
    case 'auction_won':
      return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">WON</Badge>
    case 'bid':
      return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">BID</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">SALE</Badge>
  }
}

export function NewsStream() {
  const [events, setEvents] = useState<SaleEvent[]>([])
  const [isVisible, setIsVisible] = useState(true)

  // Initialize with some events
  useEffect(() => {
    const initialEvents = Array.from({ length: 5 }, () => generateRandomSale())
    // Set different time stamps for initial events
    initialEvents.forEach((event, index) => {
      event.timeAgo = `${index + 1}m ago`
    })
    setEvents(initialEvents)
  }, [])

  // Add new event every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateRandomSale()
      
      setEvents(prev => {
        // Age existing events
        const agedEvents = prev.map(event => ({
          ...event,
          timeAgo: event.timeAgo === "Just now" ? "1m ago" : 
                  event.timeAgo === "1m ago" ? "2m ago" :
                  event.timeAgo === "2m ago" ? "3m ago" :
                  event.timeAgo === "3m ago" ? "4m ago" :
                  event.timeAgo === "4m ago" ? "5m ago" : "5m+ ago"
        }))
        
        // Add new event at the top and keep only last 8 events
        return [newEvent, ...agedEvents].slice(0, 8)
      })
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="bg-card/95 backdrop-blur-md border border-border shadow-xl h-full flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-lg text-foreground">Live Activity</h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground transition-colors text-lg"
            >
              ×
            </button>
          </div>
          
          {/* Statistics moved to top */}
          {events.length > 0 && events[0].metadata && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center bg-accent/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-foreground">{events[0].metadata.totalSales}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Sales</div>
              </div>
              <div className="text-center bg-accent/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">{events[0].metadata.totalVolume}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Volume</div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">Recent commodity NFT transactions</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`p-4 border-b border-border hover:bg-muted/50 transition-all duration-300 ${
                index === 0 ? 'bg-accent/20 animate-pulse' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground truncate">
                      {event.buyerName}
                    </span>
                    {getEventBadge(event.type)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {getEventText(event)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{event.location}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{event.timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-muted-foreground text-center">
            🔄 Updates every minute
          </p>
        </div>
      </Card>
    </div>
  )
}