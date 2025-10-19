"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe, Menu, Wallet, User, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useWallet } from "@/hooks/use-wallet"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Auctions", href: "/auctions" },
  { name: "Tokenization", href: "/tokenization" },
  { name: "AI Tools", href: "/ai-tools" },
  { name: "Workflows", href: "/workflows" },
  { name: "Dashboard", href: "/dashboard" },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { address, isConnected, isConnecting, connect, connectMetaMask, connectHashPack, disconnect, walletType } = useWallet()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-serif font-bold text-foreground">TraceTrade</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm text-muted-foreground hover:text-foreground transition-colors py-1",
                  pathname === item.href && "text-foreground font-medium",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                {/* Wallet Connection */}
                {isConnected ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center space-x-1.5 h-8 text-xs">
                        <Wallet className="w-3.5 h-3.5" />
                        <span className="text-xs">{formatAddress(address!)}</span>
                        <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                          {walletType === 'hashpack' ? 'HashPack' : 'MetaMask'}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={disconnect}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" disabled={isConnecting} className="flex items-center space-x-1.5 h-8 text-xs">
                        <Wallet className="w-3.5 h-3.5" />
                        <span className="text-xs">{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                        {!isConnecting && <ChevronDown className="w-3 h-3" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={connectHashPack}>
                        <Wallet className="w-4 h-4 mr-2" />
                        HashPack
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={connectMetaMask}>
                        <Wallet className="w-4 h-4 mr-2" />
                        MetaMask
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.firstName}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-lg text-muted-foreground hover:text-foreground transition-colors",
                      pathname === item.href && "text-foreground font-medium",
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-border pt-4 space-y-3">
                  {isAuthenticated ? (
                    <>
                      {/* Mobile Wallet Connection */}
                      {isConnected ? (
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground px-2">
                            Connected: {formatAddress(address!)} ({walletType === 'hashpack' ? 'HashPack' : 'MetaMask'})
                          </div>
                          <Button variant="outline" className="w-full justify-start bg-transparent" onClick={disconnect}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Disconnect Wallet
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start bg-transparent" 
                            onClick={connectHashPack}
                            disabled={isConnecting}
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            {isConnecting ? 'Connecting...' : 'Connect HashPack'}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start bg-transparent" 
                            onClick={connectMetaMask}
                            disabled={isConnecting}
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                          </Button>
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground px-2">
                        Welcome, {user?.firstName}
                      </div>
                      <Button variant="outline" className="w-full justify-start bg-transparent" onClick={logout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          <User className="w-4 h-4 mr-2" />
                          Sign In
                        </Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
