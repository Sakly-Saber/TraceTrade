"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useWallet } from "@/hooks/use-wallet"
import { Wallet, Copy, ExternalLink, LogOut } from "lucide-react"

export function WalletConnect() {
  const { address, isConnected, connect, disconnect, isConnecting, walletType, connectSpecificWallet } = useWallet()
  const [isOpen, setIsOpen] = useState(false)

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  if (isConnected && address) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Wallet className="h-4 w-4" />
            {address.slice(0, 6)}...{address.slice(-4)}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Wallet Connected</DialogTitle>
            <DialogDescription>
              Your {walletType === 'hashconnect' ? 'HashPack' : 'MetaMask'} wallet is connected to Hedera B2B Marketplace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-mono text-sm">{address}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={copyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Type</p>
                <p className="font-medium">{walletType === 'hashconnect' ? 'HashPack (HashConnect)' : 'MetaMask'}</p>
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="destructive" onClick={disconnect} className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isConnecting}>
          <Wallet className="h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose your preferred wallet to connect to Hedera B2B Marketplace
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button 
            onClick={() => connectSpecificWallet('hashconnect')} 
            className="w-full gap-2 justify-start p-6"
            variant="outline"
            disabled={isConnecting}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div className="text-left">
              <p className="font-medium">HashPack (Recommended)</p>
              <p className="text-sm text-muted-foreground">Native Hedera wallet</p>
            </div>
          </Button>
          
          <Button 
            onClick={() => connectSpecificWallet('metamask')} 
            className="w-full gap-2 justify-start p-6"
            variant="outline"
            disabled={isConnecting}
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="text-left">
              <p className="font-medium">MetaMask</p>
              <p className="text-sm text-muted-foreground">EVM compatible wallet</p>
            </div>
          </Button>
          
          <div className="text-center">
            <Button 
              onClick={() => {
                connect()
                setIsOpen(false)
              }} 
              variant="link"
              disabled={isConnecting}
            >
              Auto-detect wallet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
