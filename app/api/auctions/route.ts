import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { normalizeIpfsUrl } from '@/lib/utils'

// Helper to extract image URL from IPFS metadata
async function getImageFromMetadata(metadataUri: string): Promise<string | null> {
  if (!metadataUri) return null
  
  try {
    // Convert ipfs:// to https://
    let url = metadataUri
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '')
      url = `https://ipfs.io/ipfs/${cid}`
    }
    
    const response = await fetch(url, { 
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (!response.ok) return null
    
    const metadata = await response.json()
    
    // Extract image URL from metadata
    let imageUrl = metadata.image || metadata.imageUrl || null
    
    if (imageUrl) {
      // Convert ipfs:// to https://ipfs.io if needed
      if (imageUrl.startsWith('ipfs://')) {
        const cid = imageUrl.replace('ipfs://', '').replace(/^ipfs\//, '')
        imageUrl = `https://ipfs.io/ipfs/${cid}`
      }
      // Replace Pinata subdomain with public gateway
      else if (imageUrl.includes('amaranth-bitter-falcon-175.mypinata.cloud')) {
        const cid = imageUrl.split('/ipfs/')[1]
        imageUrl = `https://ipfs.io/ipfs/${cid}`
      }
    }
    
    return imageUrl
    
  } catch (error) {
    console.error('❌ Error fetching metadata:', error)
    return null
  }
}

// GET - Fetch auctions with pagination, filtering, and search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const businessId = searchParams.get('businessId')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}
    
    // Default to active auctions for marketplace view
    if (status) {
      where.status = status
    } else {
      where.status = 'ACTIVE' // Only show active by default
    }
    
    if (category && category !== 'all') where.category = category
    if (businessId) where.businessId = businessId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { commodityType: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch auctions with pagination
    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          bids: {
            orderBy: { amountHbar: 'desc' },
            take: 1 // Get highest bid only
          },
          nftAssets: {
            include: {
              owner: true
            }
          },
          business: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              walletAddress: true,
              country: true
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              bids: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { endTime: 'asc' } // Ending soon first
      }),
      prisma.auction.count({ where })
    ])

    // Transform to frontend format
    const transformedAuctions = await Promise.all(auctions.map(async (auction: any) => {
      const nft = auction.nftAssets?.[0]
      const highestBid = auction.bids?.[0]
      
      // Try to get image from metadata first, fallback to stored URLs
      let imageUrl = nft?.imageUrl || nft?.aiImageUrl || ''
      
      // If we have metadataUri, fetch the actual image URL from metadata
      if (auction.metadataUri) {
        const metadataImage = await getImageFromMetadata(auction.metadataUri)
        if (metadataImage) {
          imageUrl = metadataImage
        }
      }
      
      // Debug log for first auction
      if (auction === auctions[0]) {
        console.log('🔍 API DEBUG - First Auction:')
        console.log('  metadataUri:', auction.metadataUri)
        console.log('  Raw imageUrl from DB:', nft?.imageUrl)
        console.log('  Final image URL:', imageUrl)
      }
      
      return {
        id: auction.id,
        tokenId: nft?.tokenId || '',
        serialNumber: nft?.serialNumber || 0,
        name: auction.title,
        description: auction.description || '',
        image: imageUrl,
        currentBid: highestBid?.amountHbar || 0,
        reservePrice: auction.reservePrice || 0,
        currency: 'ℏ',
        seller: auction.business?.walletAddress || '0.0.unknown',
        category: auction.category || 'other',
        location: [auction.business?.country || 'Africa'],
        status: auction.status.toLowerCase(),
        rating: 4.5, // TODO: Calculate from reviews
        verified: auction.business?.isVerified || false,
        views: 0, // TODO: Add views tracking
        likes: 0, // TODO: Add favorites count
        totalBids: auction._count?.bids || 0,
        watchers: 0, // TODO: Add watchers feature
        progress: highestBid && auction.reservePrice > 0 
          ? Math.min(100, (highestBid.amountHbar / auction.reservePrice) * 100) 
          : 0,
        auctionEndTime: auction.endTime,
        createdAt: auction.createdAt,
        attributes: nft?.metadata ? 
          (typeof nft.metadata === 'object' ? 
            Object.entries(nft.metadata as Record<string, any>).map(([key, value]) => ({
              trait_type: key,
              value: String(value)
            })) : []
          ) : []
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedAuctions,
      count: transformedAuctions.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('❌ [AUCTIONS API] Error fetching auctions:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch auctions', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
  
  const user = await prisma.businessUser.findUnique({
    where: { id: decoded.userId },
    include: { business: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}


export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    const body = await request.json()

    const {
      title,
      description,
      category,
      commodityType,
      quantity,
      unit,
      quality,
      location,
      certifications,
      reservePrice,
      currency = 'HBAR',
      startTime,
      endTime,
      tokenId,
      nftContract,
      metadataUri
    } = body

    // Validate required fields
    if (!title || !description || !category || !commodityType || !quantity || !unit || !reservePrice || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startTime)
    const end = new Date(endTime)
    const now = new Date()

    if (start <= now) {
      return NextResponse.json(
        { error: 'Start time must be in the future' },
        { status: 400 }
      )
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Create auction
    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        category,
        commodityType,
        quantity: parseFloat(quantity),
        unit,
        quality,
        location,
        certifications,
        reservePrice: parseFloat(reservePrice),
        currency,
        startTime: start,
        endTime: end,
        tokenId,
        nftContract,
        metadataUri,
        businessId: user.businessId,
        createdById: user.id,
        status: 'PENDING'
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Auction created successfully',
      auction
    }, { status: 201 })

  } catch (error) {
    console.error('Create auction error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}