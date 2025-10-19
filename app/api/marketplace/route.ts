import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to extract image URL from IPFS metadata
async function getImageFromMetadata(metadataUri: string): Promise<string | null> {
  if (!metadataUri) return null
  
  try {
    let url = metadataUri
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '')
      url = `https://ipfs.io/ipfs/${cid}`
    }
    
    const response = await fetch(url, { 
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) return null
    
    const metadata = await response.json()
    let imageUrl = metadata.image || metadata.imageUrl || null
    
    if (imageUrl) {
      if (imageUrl.startsWith('ipfs://')) {
        const cid = imageUrl.replace('ipfs://', '').replace(/^ipfs\//, '')
        imageUrl = `https://ipfs.io/ipfs/${cid}`
      } else if (imageUrl.includes('amaranth-bitter-falcon-175.mypinata.cloud')) {
        const cid = imageUrl.split('/ipfs/')[1]
        imageUrl = `https://ipfs.io/ipfs/${cid}`
      }
    }
    
    return imageUrl
  } catch (error) {
    return null
  }
}
import { normalizeIpfsUrl } from '@/lib/utils'

// GET - Fetch marketplace listings with pagination, filtering, and search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const businessId = searchParams.get('businessId')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const verified = searchParams.get('verified')

    // Build where clause
    const where: any = {}
    
    // Default to active listings for marketplace view
    if (status) {
      where.status = status
    } else {
      where.status = 'ACTIVE' // Only show active by default
    }
    
    if (businessId) where.sellerBusinessId = businessId
    
    // Price range filter
    if (minPrice || maxPrice) {
      where.priceHbar = {}
      if (minPrice) where.priceHbar.gte = parseFloat(minPrice)
      if (maxPrice) where.priceHbar.lte = parseFloat(maxPrice)
    }
    
    // Search across NFT asset fields
    if (search) {
      where.nftAsset = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      }
    }
    
    // Category filter (on NFT asset)
    if (category && category !== 'all') {
      where.nftAsset = {
        ...where.nftAsset,
        collection: {
          name: { contains: category, mode: 'insensitive' }
        }
      }
    }
    
    // Verified sellers only
    if (verified === 'true') {
      where.sellerBusiness = {
        isVerified: true
      }
    }

    // Fetch listings with pagination
    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: {
          nftAsset: {
            include: {
              owner: true,
              collection: true
            }
          },
          sellerBusiness: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              walletAddress: true,
              country: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.marketplaceListing.count({ where })
    ])

    // Transform to frontend format
    const transformedListings = await Promise.all(listings.map(async (listing: any) => {
      const nft = listing.nftAsset
      
      // Try to get image from metadata first, fallback to stored URLs
      let imageUrl = nft?.imageUrl || nft?.aiImageUrl || ''
      
      // If we have metadataUri, fetch the actual image URL from metadata
      if (nft?.metadataUri) {
        const metadataImage = await getImageFromMetadata(nft.metadataUri)
        if (metadataImage) {
          imageUrl = metadataImage
        }
      }
      
      return {
        id: listing.id,
        tokenId: nft?.tokenId || '',
        serialNumber: nft?.serialNumber || 0,
        name: nft?.name || 'Unnamed Asset',
        description: nft?.description || '',
        image: imageUrl, // Fetched from metadata or database
        price: listing.priceHbar || 0,
        currency: 'ℏ',
        seller: listing.seller || listing.sellerBusiness?.walletAddress || '0.0.unknown',
        sellerName: listing.sellerBusiness?.name || 'Unknown',
        category: nft?.collection?.name || 'other',
        location: nft?.location ? [nft.location] : [listing.sellerBusiness?.country || 'Africa'],
        status: listing.status.toLowerCase(),
        rating: 4.5, // TODO: Calculate from reviews
        verified: listing.sellerBusiness?.isVerified || false,
        views: 0, // TODO: Add views tracking
        likes: 0, // TODO: Add favorites count
        watchers: 0, // TODO: Add watchers feature
        listingDate: listing.createdAt,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        attributes: nft?.metadataUri ? [] : [], // TODO: Parse metadata
        quantity: nft?.quantity || null,
        unit: nft?.unit || null,
        quality: nft?.quality || null,
        certifications: nft?.certifications ? JSON.parse(nft.certifications) : []
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedListings,
      count: transformedListings.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('❌ [MARKETPLACE API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch marketplace items',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
