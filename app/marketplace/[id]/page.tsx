"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "@/components/navigation"
import {
  ShoppingCart,
  Shield,
  MapPin,
  Heart,
  Eye,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from "lucide-react"

interface MarketplaceListing {
  id: string
  name: string
  description: string
  image: string
  price: number
  category: string
  location: string[]
  views: number
  likes: number
  tokenId: string
  serialNumber: number
  seller: string
  sellerName: string
  verified: boolean
  status: string
  currency: string
  attributes: any
}

export default function MarketplaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<MarketplaceListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/marketplace/${listingId}`)
        
        if (!response.ok) {
          throw new Error('Listing not found')
        }
        
        const data = await response.json()
        setListing(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      fetchListing()
    }
  }, [listingId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading listing...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertDescription className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              {error || 'Listing not found'}
            </AlertDescription>
          </Alert>
          <div className="text-center mt-6">
            <Button onClick={() => router.push('/marketplace')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          onClick={() => router.push('/marketplace')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Card */}
            <Card className="overflow-hidden border-2 border-blue-200/60 bg-white/80 backdrop-blur">
              <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100">
                {listing.image ? (
                  <img
                    src={listing.image}
                    alt={listing.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        const icon = document.createElement('div')
                        icon.innerHTML = '🖼️'
                        icon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:96px;opacity:0.5'
                        parent.appendChild(icon)
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p>No image available</p>
                    </div>
                  </div>
                )}
                {listing.verified && (
                  <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </Card>

            {/* Details Tabs */}
            <Card className="border-2 border-blue-200/60 bg-white/80 backdrop-blur">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                  <TabsTrigger value="seller">Seller Info</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Description</h3>
                      <p className="text-gray-600">{listing.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Token ID</p>
                        <p className="font-mono text-sm">{listing.tokenId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Serial Number</p>
                        <p className="font-mono text-sm">{listing.serialNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <Badge variant="secondary">{listing.category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {listing.location.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attributes" className="p-6">
                  <div className="space-y-3">
                    {listing.attributes && typeof listing.attributes === 'object' ? (
                      Object.entries(listing.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-sm text-gray-600">{String(value)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No additional attributes available</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="seller" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Seller Name</p>
                      <p className="font-semibold">{listing.sellerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Wallet Address</p>
                      <p className="font-mono text-sm break-all">{listing.seller}</p>
                    </div>
                    {listing.verified && (
                      <Badge className="bg-green-100 text-green-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified Seller
                      </Badge>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="border-2 border-blue-200/60 bg-white/80 backdrop-blur sticky top-4">
              <CardHeader>
                <CardTitle className="text-2xl">{listing.name}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {listing.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {listing.likes}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {listing.price.toFixed(2)} {listing.currency}
                  </p>
                </div>

                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" size="lg">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Buy Now
                </Button>

                <Button variant="outline" className="w-full">
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </Button>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                      {listing.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-2 border-blue-200/60 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Secure Transaction</p>
                    <p className="text-gray-500 text-xs">Powered by Hedera blockchain</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">View on Explorer</p>
                    <a 
                      href={`https://hashscan.io/mainnet/token/${listing.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-xs hover:underline"
                    >
                      HashScan →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
