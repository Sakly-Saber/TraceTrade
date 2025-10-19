import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, MapPin, Star, Shield } from "lucide-react"
import { NewsStream } from "@/components/news-stream"
import { CommodityPriceTicker } from "@/components/commodity-price-ticker"
import { Navigation } from "@/components/navigation"

export default function MarketplacePage() {
  const products = [
    {
      id: 1,
      title: "Premium Copper Ore",
      description: "High-grade copper ore, 25% purity",
      quantity: "100 tons",
      price: "$2,450,000",
      location: "Lagos, Nigeria",
      seller: "Mining Corp Ltd",
      rating: 4.8,
      verified: true,
      image: "/copper-ore-mining.png",
    },
    {
      id: 2,
      title: "Organic Cocoa Beans",
      description: "Fair trade certified organic cocoa",
      quantity: "50 tons",
      price: "$1,890,000",
      location: "Accra, Ghana",
      seller: "Ghana Cocoa Board",
      rating: 4.9,
      verified: true,
      image: "/cocoa-beans-agricultural.png",
    },
    {
      id: 3,
      title: "Industrial Generator",
      description: "500kW diesel generator, low hours",
      quantity: "1 unit",
      price: "$3,200,000",
      location: "Johannesburg, South Africa",
      seller: "Power Solutions SA",
      rating: 4.7,
      verified: true,
      image: "/industrial-generator.png",
    },
    {
      id: 4,
      title: "Raw Cotton Bales",
      description: "Premium quality raw cotton",
      quantity: "200 bales",
      price: "$850,000",
      location: "Kano, Nigeria",
      seller: "Cotton Farmers Coop",
      rating: 4.6,
      verified: false,
      image: "/cotton-bales-agricultural.png",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Glassmorphic overlay background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-200/20 via-transparent to-blue-200/20"></div>
      <div className="relative z-10">
        {/* Navigation */}
        <Navigation />
        
        {/* Page Header */}
        <div className="border-b border-white/30 bg-white/40 backdrop-blur-md">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Marketplace</h1>
                <p className="text-muted-foreground text-lg">Discover premium African commodities and equipment</p>
              </div>
              <Button size="lg" className="bg-white/80 backdrop-blur-md border border-white/30 hover:bg-white/90 shadow-lg text-primary hover:text-primary">
                List Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search products, commodities, equipment..." className="pl-10 bg-white/80 backdrop-blur-sm border border-white/50" />
            </div>
            <Select>
              <SelectTrigger className="w-full lg:w-48 bg-white/80 backdrop-blur-sm border border-white/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minerals">Minerals</SelectItem>
                <SelectItem value="agriculture">Agriculture</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="textiles">Textiles</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full lg:w-48 bg-white/80 backdrop-blur-sm border border-white/50">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nigeria">Nigeria</SelectItem>
                <SelectItem value="ghana">Ghana</SelectItem>
                <SelectItem value="south-africa">South Africa</SelectItem>
                <SelectItem value="kenya">Kenya</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm border border-white/50 hover:bg-white/90">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Commodity Price Ticker */}
        <CommodityPriceTicker />

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 mt-8">
          <p className="text-muted-foreground">Showing {products.length} results</p>
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content with Sidebar Layout */}
        <div className="flex gap-6">
          {/* Main Product Grid */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{products.map((product) => (
            <Card key={product.id} className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-gray-100/50 to-gray-200/50 rounded-t-lg overflow-hidden">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={product.verified ? "default" : "secondary"} className="text-xs bg-white/80 backdrop-blur-sm border border-white/50">
                    {product.verified ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      "Unverified"
                    )}
                  </Badge>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                </div>
                <CardTitle className="font-serif text-lg">{product.title}</CardTitle>
                <CardDescription className="text-sm">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{product.quantity}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 mr-1" />
                    {product.location}
                  </div>
                  <div className="text-sm text-muted-foreground">by {product.seller}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{product.price}</span>
                  <Button size="sm" className="bg-primary/90 backdrop-blur-sm hover:bg-primary shadow-lg">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          </div>

          {/* Right Sidebar with Live Activity */}
          <div className="w-96 h-screen sticky top-0">
            <NewsStream />
          </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="bg-white/80 backdrop-blur-md border border-white/30 hover:bg-white/90 shadow-lg">
            Load More Products
          </Button>
        </div>
      </div>
    </div>
  )
}
