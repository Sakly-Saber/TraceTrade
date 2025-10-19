"use client"

import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface VerticalFilterTriggerProps {
  onClick: () => void
  filterCount?: number
  className?: string
}

export function VerticalFilterTrigger({ 
  onClick, 
  filterCount = 0, 
  className 
}: VerticalFilterTriggerProps) {
  return (
    <div className={cn(
      "fixed left-6 top-1/2 -translate-y-1/2 z-30",
      className
    )}>
      <Button
        onClick={onClick}
        variant="outline"
        className={cn(
          "h-44 w-14 rounded-2xl bg-gradient-to-b from-white/95 via-white/90 to-white/85",
          "backdrop-blur-xl border border-white/40 shadow-2xl",
          "hover:from-white hover:via-white/95 hover:to-white/90",
          "hover:shadow-3xl hover:scale-105 hover:border-blue-200/60",
          "transition-all duration-300 ease-out",
          "flex flex-col items-center justify-center gap-3 p-3",
          "group relative overflow-hidden"
        )}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/3 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Glowing effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/10 to-purple-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <Filter className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors duration-300 relative z-10 drop-shadow-sm" />
        
        {/* Decorative line */}
        <div className="w-6 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 relative z-10" />
        
        <br></br>
        {/* Vertical "Filters" text */}
        <span 
          className="text-sm font-semibold text-gray-700 group-hover:text-gray-800 inline-block relative z-10 tracking-wider"
          style={{ 
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center',
            whiteSpace: 'nowrap',
            letterSpacing: '1px',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          FILTERS
        </span>
      
        {/* Filter count badge */}
        {filterCount > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-white shadow-lg animate-pulse"
          >
            {filterCount}
          </Badge>
        )}
        
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </Button>
    </div>
  )
}