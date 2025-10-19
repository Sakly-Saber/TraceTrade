"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface AuctionTimerProps {
  endTime: Date
  className?: string
}

export function AuctionTimer({ endTime, className = "" }: AuctionTimerProps) {
  const [timeLeft, setTimeLeft] = useState("")
  const [isEnded, setIsEnded] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const end = endTime.getTime()
      const difference = end - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`)
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`)
        }
        setIsEnded(false)
      } else {
        setTimeLeft("Auction Ended")
        setIsEnded(true)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className={`h-4 w-4 ${isEnded ? "text-muted-foreground" : "text-primary"}`} />
      <span className={`font-medium ${isEnded ? "text-muted-foreground" : "text-foreground"}`}>{timeLeft}</span>
    </div>
  )
}
