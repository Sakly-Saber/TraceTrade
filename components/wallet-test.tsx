'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { connectWallet, disconnectWallet } from "@/lib/blockchain"

export function WalletTestComponent() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      const address = await connectWallet()
      setAccount(address)
      console.log("✅ Wallet connected:", address)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("❌ Wallet connection failed:", err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
      setAccount(null)
      setError(null)
      console.log("✅ Wallet disconnected")
    } catch (err) {
      console.error("❌ Disconnect failed:", err)
    }
  }

  return (
    <Card className="w-96 mx-auto mt-8">
      <CardHeader>
        <CardTitle>Wallet Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!account ? (
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-green-600">
              ✅ Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </p>
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        )}
        
        {error && (
          <p className="text-sm text-red-600">
            ❌ Error: {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}