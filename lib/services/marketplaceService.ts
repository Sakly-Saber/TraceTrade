import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface MarketplaceItem {
  id: string
  tokenId: string
  serialNumber: number
  name: string
  description: string
  image: string
  price: number
  currency: string
  seller: string
  category: string
  location: string[]
  status: 'active' | 'auction' | 'sold'
  rating: number
  verified: boolean
  views: number
  likes: number
  type: 'marketplace' | 'auction'
  createdAt: Date
  auctionEndTime?: Date
  currentBid?: number
  totalBids?: number
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

export async function getMarketplaceItems(): Promise<MarketplaceItem[]> {
  try {
    // Get NFT assets with their collections and businesses
    const nftAssets = await prisma.nFTAsset.findMany({
      include: {
        collection: {
          include: {
            business: true
          }
        },
        auction: true,
        owner: true
      },
      where: {
        status: {
          in: ['MINTED', 'LISTED']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to marketplace items format
    const marketplaceItems: MarketplaceItem[] = nftAssets.map(asset => {
      const assetData = asset.assetData ? JSON.parse(asset.assetData) : {}
      
      // Parse location from asset data or use business location
      const locationArray = asset.location ? 
        [asset.location] : 
        [asset.owner.country, asset.owner.state].filter(Boolean)

      // Determine status
      let status: 'active' | 'auction' | 'sold' = 'active'
      if (asset.auction) {
        status = 'auction'
      } else if (asset.status === 'SOLD') {
        status = 'sold'
      }

      // Create attributes from asset data
      const attributes = [
        { trait_type: 'Standard', value: 'HIP-412' },
        { trait_type: 'Category', value: asset.collection.category },
        { trait_type: 'Asset Type', value: asset.collection.assetType },
        ...(asset.quantity ? [{ trait_type: 'Quantity', value: `${asset.quantity} ${asset.unit || 'units'}` }] : []),
        ...(asset.quality ? [{ trait_type: 'Quality', value: asset.quality }] : []),
        ...(asset.location ? [{ trait_type: 'Location', value: asset.location }] : []),
        // Add custom attributes from asset data
        ...Object.entries(assetData).map(([key, value]) => ({
          trait_type: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: String(value)
        }))
      ]

      return {
        id: asset.id,
        tokenId: asset.tokenId,
        serialNumber: asset.serialNumber,
        name: asset.name,
        description: asset.description,
        image: asset.imageUrl || asset.aiImageUrl || '/crystal-glass-bg.png',
        price: asset.currentPrice || 0,
        currency: 'ℏ',
        seller: asset.createdBy,
        category: asset.collection.category.toLowerCase(),
        location: locationArray,
        status,
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
        verified: asset.owner.isVerified,
        views: Math.floor(Math.random() * 500) + 50, // Random views
        likes: Math.floor(Math.random() * 100) + 10, // Random likes
        type: asset.auction ? 'auction' : 'marketplace',
        createdAt: new Date(asset.createdAt), // Convert to Date object
        auctionEndTime: asset.auction?.endTime ? new Date(asset.auction.endTime) : undefined,
        currentBid: asset.auction?.currentBid,
        totalBids: asset.auction ? 12 : 0, // Mock total bids for auctions
        attributes
      }
    })

    return marketplaceItems
  } catch (error) {
    console.error('Error fetching marketplace items:', error)
    throw new Error('Failed to fetch marketplace items')
  }
}

export async function getMarketplaceItemById(id: string): Promise<MarketplaceItem | null> {
  try {
    const asset = await prisma.nFTAsset.findUnique({
      where: { id },
      include: {
        collection: {
          include: {
            business: true
          }
        },
        auction: true,
        owner: true
      }
    })

    if (!asset) return null

    const assetData = asset.assetData ? JSON.parse(asset.assetData) : {}
    const locationArray = asset.location ? 
      [asset.location] : 
      [asset.owner.country, asset.owner.state].filter(Boolean)

    let status: 'active' | 'auction' | 'sold' = 'active'
    if (asset.auction) {
      status = 'auction'
    } else if (asset.status === 'SOLD') {
      status = 'sold'
    }

    const attributes = [
      { trait_type: 'Standard', value: 'HIP-412' },
      { trait_type: 'Category', value: asset.collection.category },
      { trait_type: 'Asset Type', value: asset.collection.assetType },
      ...(asset.quantity ? [{ trait_type: 'Quantity', value: `${asset.quantity} ${asset.unit || 'units'}` }] : []),
      ...(asset.quality ? [{ trait_type: 'Quality', value: asset.quality }] : []),
      ...(asset.location ? [{ trait_type: 'Location', value: asset.location }] : []),
      ...Object.entries(assetData).map(([key, value]) => ({
        trait_type: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: String(value)
      }))
    ]

    return {
      id: asset.id,
      tokenId: asset.tokenId,
      serialNumber: asset.serialNumber,
      name: asset.name,
      description: asset.description,
      image: asset.imageUrl || asset.aiImageUrl || '/crystal-glass-bg.png',
      price: asset.currentPrice || 0,
      currency: 'ℏ',
      seller: asset.createdBy,
      category: asset.collection.category.toLowerCase(),
      location: locationArray,
      status,
      rating: 4.5 + Math.random() * 0.5,
      verified: asset.owner.isVerified,
      views: Math.floor(Math.random() * 500) + 50,
      likes: Math.floor(Math.random() * 100) + 10,
      type: asset.auction ? 'auction' : 'marketplace',
      createdAt: new Date(asset.createdAt), // Convert to Date object
      auctionEndTime: asset.auction?.endTime ? new Date(asset.auction.endTime) : undefined,
      currentBid: asset.auction?.currentBid,
      totalBids: asset.auction ? 12 : 0,
      attributes
    }
  } catch (error) {
    console.error('Error fetching marketplace item:', error)
    throw new Error('Failed to fetch marketplace item')
  }
}

export async function searchMarketplaceItems(filters: {
  search?: string
  category?: string
  location?: string[]
  priceRange?: [number, number]
  status?: string
  verified?: boolean
  sortBy?: string
}): Promise<MarketplaceItem[]> {
  // For now, return all items and let the frontend handle filtering
  // This can be optimized later with proper database queries
  return getMarketplaceItems()
}
