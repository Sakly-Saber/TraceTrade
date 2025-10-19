'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useWallet } from '@/hooks/use-wallet'
import { Wallet, Mail, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { 
    isConnected, 
    connect, 
    address,
    isConnecting,
    error: walletError,
    connectMetaMask,
    connectHashPack,
    walletType,
    disconnect
  } = useWallet()
  const [loading, setLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [linkWalletLoading, setLinkWalletLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loginMode, setLoginMode] = useState<'credentials' | 'wallet'>('credentials')
  const [showLinkWallet, setShowLinkWallet] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Auto-switch to wallet mode if wallet is already connected
  useEffect(() => {
    if (isConnected && loginMode === 'credentials') {
      setLoginMode('wallet')
    }
  }, [isConnected, loginMode])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
    setSuccess('')
  }

  const handleLinkWallet = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password to link your wallet')
      return
    }

    setLinkWalletLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          walletType: walletType === 'hashpack' ? 'HASHPACK' : 'METAMASK',
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link wallet')
      }

      setSuccess('Wallet linked successfully! You can now sign in with your wallet.')
      setShowLinkWallet(false)
      setFormData({ email: '', password: '' })
      
      // Auto-switch to wallet mode
      setTimeout(() => {
        setLoginMode('wallet')
        setSuccess('')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link wallet')
    } finally {
      setLinkWalletLoading(false)
    }
  }

  const handleWalletLogin = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    setWalletLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/wallet-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          walletType: walletType === 'hashpack' ? 'HASHPACK' : 'METAMASK'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Wallet login failed')
      }

      // Store token and user data using auth context
      login(data.token, data.user)

      // Redirect to dashboard
      router.push('/dashboard')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet login failed')
    } finally {
      setWalletLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token and user data using auth context
      login(data.token, data.user)

      // Redirect to dashboard
      router.push('/dashboard')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your business account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginMode} onValueChange={(value) => setLoginMode(value as 'credentials' | 'wallet')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="credentials" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="wallet" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Wallet
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="border-red-200 bg-red-50 text-red-800 mt-4">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800 mt-4">
                  {success}
                </Alert>
              )}

              <TabsContent value="credentials" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                {/* Link Wallet Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Already have an account but want to enable wallet login?
                    </p>
                    {!showLinkWallet ? (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowLinkWallet(true)}
                        className="w-full"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Link Your Wallet
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {!isConnected ? (
                          <div className="space-y-3">
                            <p className="text-sm text-amber-600">
                              First, connect your wallet:
                            </p>
                            <div className="space-y-2">
                              <Button 
                                onClick={connectHashPack} 
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={isConnecting}
                              >
                                <Wallet className="w-4 h-4 mr-2" />
                                {isConnecting ? 'Connecting...' : 'Connect HashPack'}
                              </Button>
                              <Button 
                                onClick={connectMetaMask} 
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                disabled={isConnecting}
                              >
                                <Wallet className="w-4 h-4 mr-2" />
                                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                              <div className="flex items-center text-green-700 mb-1">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Wallet Connected ({walletType === 'hashpack' ? 'HashPack' : 'MetaMask'})
                              </div>
                              <p className="font-mono text-xs text-gray-600">
                                {address?.slice(0, 12)}...{address?.slice(-12)}
                              </p>
                            </div>
                            <p className="text-sm text-blue-600">
                              Enter your current credentials to link this wallet:
                            </p>
                            <Button 
                              onClick={handleLinkWallet} 
                              className="w-full bg-green-600 hover:bg-green-700"
                              disabled={linkWalletLoading || !formData.email || !formData.password}
                            >
                              {linkWalletLoading ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Linking...
                                </div>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Link Wallet to Account
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setShowLinkWallet(false)}
                          className="w-full text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="wallet" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Wallet className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Wallet Authentication
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect your wallet for secure, passwordless sign-in
                    </p>
                    
                    {!isConnected ? (
                      <div className="space-y-3">
                        <div className="text-xs text-gray-500 mb-3">
                          Supported wallets: HashPack, MetaMask
                        </div>
                        <div className="space-y-2">
                          <Button 
                            onClick={connectHashPack} 
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={isConnecting}
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            {isConnecting ? 'Connecting...' : 'Connect HashPack'}
                          </Button>
                          <Button 
                            onClick={connectMetaMask} 
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            disabled={isConnecting}
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-center text-green-700 mb-2">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <span className="font-medium">Wallet Connected</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-mono text-gray-700">
                              {address?.slice(0, 8)}...{address?.slice(-8)}
                            </p>
                            <p className="text-xs text-blue-600 font-medium">
                              {walletType === 'hashpack' ? '🔷 HashPack Wallet' : '🦊 MetaMask Wallet'}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleWalletLogin} 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                          disabled={walletLoading}
                        >
                          {walletLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Authenticating...
                            </div>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Sign In with Wallet
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {isConnected && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      🔐 Secure authentication via blockchain signature
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                  Register your business
                </Link>
              </p>
              {loginMode === 'wallet' && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                  💡 New to wallet login? Your wallet must be registered during signup first
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}