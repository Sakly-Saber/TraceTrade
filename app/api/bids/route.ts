import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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

    const { auctionId, amount, currency = 'NGN', txHash } = body

    // Validate required fields
    if (!auctionId || !amount) {
      return NextResponse.json(
        { error: 'Auction ID and amount are required' },
        { status: 400 }
      )
    }

    // Get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    })

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    // Check if auction is active
    if (auction.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Auction is not active' },
        { status: 400 }
      )
    }

    // Check if auction has ended
    if (new Date() > auction.endTime) {
      return NextResponse.json(
        { error: 'Auction has ended' },
        { status: 400 }
      )
    }

    // Check if auction has started
    if (new Date() < auction.startTime) {
      return NextResponse.json(
        { error: 'Auction has not started yet' },
        { status: 400 }
      )
    }

    // Check if bidder is the auction creator
    if (auction.businessId === user.businessId) {
      return NextResponse.json(
        { error: 'Cannot bid on your own auction' },
        { status: 400 }
      )
    }

    const bidAmount = parseFloat(amount)

    // Check if bid is higher than reserve price
    if (bidAmount < auction.reservePrice) {
      return NextResponse.json(
        { error: `Bid must be at least ${auction.reservePrice} ${auction.currency}` },
        { status: 400 }
      )
    }

    // Check if bid is higher than current highest bid
    const highestBid = auction.bids[0]
    if (highestBid && bidAmount <= highestBid.amount) {
      return NextResponse.json(
        { error: `Bid must be higher than current bid of ${highestBid.amount} ${auction.currency}` },
        { status: 400 }
      )
    }

    // Create bid in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark previous bids as not winning
      await tx.bid.updateMany({
        where: { auctionId },
        data: { isWinning: false }
      })

      // Create new bid
      const bid = await tx.bid.create({
        data: {
          amount: bidAmount,
          currency,
          txHash,
          auctionId,
          businessId: user.businessId,
          bidderId: user.id,
          isWinning: true
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            }
          },
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      })

      // Update auction current bid
      await tx.auction.update({
        where: { id: auctionId },
        data: { currentBid: bidAmount }
      })

      return bid
    })

    return NextResponse.json({
      message: 'Bid placed successfully',
      bid: result
    }, { status: 201 })

  } catch (error) {
    console.error('Place bid error:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auctionId = searchParams.get('auctionId')
    const businessId = searchParams.get('businessId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    
    if (auctionId) where.auctionId = auctionId
    if (businessId) where.businessId = businessId

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              isVerified: true,
            }
          },
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          auction: {
            select: {
              id: true,
              title: true,
              status: true,
              endTime: true,
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.bid.count({ where })
    ])

    return NextResponse.json({
      bids,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get bids error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}