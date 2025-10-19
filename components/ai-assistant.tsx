"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  Loader2,
  Sparkles,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  className?: string
}

export function AIAssistant({ className }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "✨ Hi! I'm your AI tokenization expert. I can help you understand asset tokenization, navigate the marketplace, evaluate investments, and guide you through successful trades. What would you like to explore today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment, or feel free to explore the platform while I get back online! 🔄",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    if (!isVisible) return null

    return (
      <div className={cn(
        "fixed bottom-2 right-2 z-50",
        className
      )}>
        <div className="relative group">
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "h-60 w-60 relative transition-all duration-500 ease-out",
              "transform hover:scale-105 hover:-translate-y-3",
              "focus:outline-none"
            )}
            style={{ 
              background: 'transparent',
              animation: 'gentleBob 4s ease-in-out infinite'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div className="w-60 h-60 flex items-center justify-center">
                <iframe
                  src="https://my.spline.design/genkubgreetingrobot-IDKWH3uWrbohuK3UNpkqlRTx/"
                  frameBorder="0"
                  width="280"
                  height="280"
                  className="transform scale-90"
                  style={{ 
                    pointerEvents: 'none',
                    background: 'transparent',
                    marginTop: '-20px',
                    marginLeft: '-10px'
                  }}
                  title="AI Assistant 3D Robot"
                />
              </div>
            </div>

            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-3xl animate-pulse" />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute top-6 right-8 w-2 h-2 bg-blue-400/60 rounded-full"
                style={{ animation: 'floatParticle 6s ease-in-out infinite' }}
              />
              <div 
                className="absolute top-12 left-6 w-1.5 h-1.5 bg-purple-400/50 rounded-full"
                style={{ animation: 'floatParticle 8s ease-in-out infinite 2s' }}
              />
              <div 
                className="absolute bottom-6 right-4 w-2 h-2 bg-green-400/40 rounded-full"
                style={{ animation: 'floatParticle 7s ease-in-out infinite 4s' }}
              />
            </div>
          </button>

          {/* Compact controls for the launcher: minimize (open minimized) and close (hide) */}
          <div className="absolute -top-2 -right-2 flex items-center gap-2">
            <button
              title="Open minimized"
              onClick={() => { setIsOpen(true); setIsMinimized(true) }}
              className="h-8 w-8 bg-white/90 backdrop-blur-sm rounded-full border border-white/20 shadow-md flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Minimize2 className="h-4 w-4 text-gray-700" />
            </button>
            <button
              title="Close assistant"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 bg-white/90 backdrop-blur-sm rounded-full border border-white/20 shadow-md flex items-center justify-center hover:scale-105 transition-transform"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>
          </div>

          <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
            <div className="bg-black/80 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl whitespace-nowrap shadow-2xl">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4" />
                <span>Ask me about tokenization!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "fixed bottom-2 right-2 z-50",
      className
    )}>
      {/* Beautiful Glassmorphic Chat Window - Much Larger */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        "bg-white/90 backdrop-blur-xl border border-white/20",
        "shadow-2xl shadow-blue-500/10",
        // fixed height when open so the scroll area can manage overflow
        isMinimized ? "h-20 w-96" : "w-96 h-[32rem] flex flex-col"
      )}>
        {/* Floating controls (always visible) - ensures user can minimize/close even when scrolled */}
        {!isMinimized && (
          <div className="absolute top-2 right-2 z-[100] flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/30">
            <button
              aria-label={isMinimized ? 'Restore chat' : 'Minimize chat'}
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 p-0 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-3.5 w-3.5 text-gray-700" /> : <Minimize2 className="h-3.5 w-3.5 text-gray-700" />}
            </button>
            <button
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 p-0 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-gray-700" />
            </button>
          </div>
        )}
        {/* Glassmorphic background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white/20 to-purple-50/30" />
        
        {/* Header */}
        <CardHeader className="relative pb-3 px-4 py-3 border-b border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Compact gradient avatar instead of iframe */}
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                <Bot className="h-6 w-6 text-white" />
              </div>
               <div>
                 <CardTitle className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                   AI Tokenization Expert
                 </CardTitle>
                 <div className="flex items-center gap-1">
                   <div className="h-2 w-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
                   <span className="text-xs text-gray-600">Ready to help</span>
                   <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                 </div>
               </div>
             </div>
             {/* Always-visible header controls */}
             <div className="flex items-center gap-1">
              <button
                aria-label={isMinimized ? 'Restore chat' : 'Minimize chat'}
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 hover:bg-white/20 text-gray-600 hover:text-blue-600 transition-colors rounded-full flex items-center justify-center"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                aria-label="Close chat"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-white/20 text-gray-600 hover:text-red-500 transition-colors rounded-full flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <CardContent className="relative p-0 flex flex-col flex-1 min-h-0">
             {/* Messages - constrained height to leave room for input */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.length === 0 && !isLoading && (
                    <div className="text-center text-sm text-gray-500 py-8">
                      <p>No messages yet. Ask me anything about tokenization or the marketplace!</p>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 max-w-[85%]",
                        message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg",
                        message.role === 'assistant' 
                          ? "bg-gradient-to-br from-blue-500 to-purple-600" 
                          : "bg-gradient-to-br from-gray-400 to-gray-600"
                      )}>
                        {message.role === 'assistant' ? (
                          <Bot className="h-3 w-3 text-white" />
                        ) : (
                          <User className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border border-blue-300/20"
                            : "bg-white/80 text-gray-800 border border-gray-200/50"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-gray-200/50 shadow-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input - Always visible at bottom */}
            <div className="flex-shrink-0 relative p-3 border-t border-white/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
               <div className="flex gap-2">
                 <Input
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyPress={handleKeyPress}
                   placeholder="Ask about tokenization, trading, or platform features..."
                   className="flex-1 text-sm bg-white/90 backdrop-blur-sm border border-white/30 focus:border-blue-300 shadow-sm"
                   disabled={isLoading}
                 />
                 <Button
                   onClick={sendMessage}
                   disabled={!input.trim() || isLoading}
                   size="sm"
                   className="px-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg border-0"
                 >
                   <Send className="h-4 w-4" />
                 </Button>
               </div>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to send • Shift+Enter for new line
              </p>
             </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}