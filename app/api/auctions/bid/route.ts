import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API endpoint for placing bids on auctions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { auctionId, amount, amountHbar, bidderId, businessId, bidderAccountId, walletAddress } = body

    console.log('📥 [BID API] Received bid:', { auctionId, amount, amountHbar, bidderAccountId, walletAddress })

    // Validate required fields
    if (!auctionId || !amount || !bidderAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: auctionId, amount, and bidderAccountId (wallet address)' },
        { status: 400 }
      )
    }

    // Check if auction exists and is active
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amountHbar: 'desc' },
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

    // Validate bid amount
    const currentHighestBid = auction.bids[0]?.amountHbar || 0
    const minimumBid = Math.max(auction.reservePrice || 0, currentHighestBid) * 1.05

    if (amountHbar < minimumBid) {
      return NextResponse.json(
        { 
          error: `Bid must be at least ${minimumBid.toFixed(2)} HBAR (5% above current bid)`,
          minimumBid 
        },
        { status: 400 }
      )
    }

    // For now, we'll use a mock business/bidder if not provided
    // In production, this should come from authenticated user session
    const mockBusinessId = businessId || 'mock-business-id'
    const mockBidderId = bidderId || 'mock-bidder-id'

    // Check if business exists, create mock if needed
    let business = await prisma.business.findFirst({
      where: { id: mockBusinessId }
    })

    if (!business) {
      // Get the first business from database as fallback
      business = await prisma.business.findFirst()
      
      if (!business) {
        return NextResponse.json(
          { error: 'No business found. Please create a business account first.' },
          { status: 400 }
        )
      }
    }

    // Check if bidder exists, get first user as fallback
    let bidder = await prisma.businessUser.findFirst({
      where: { id: mockBidderId }
    })

    if (!bidder) {
      bidder = await prisma.businessUser.findFirst({
        where: { businessId: business.id }
      })

      if (!bidder) {
        return NextResponse.json(
          { error: 'No bidder user found. Please create a user account first.' },
          { status: 400 }
        )
      }
    }

    // Mark previous winning bid as not winning
    if (currentHighestBid) {
      await prisma.bid.updateMany({
        where: {
          auctionId: auction.id,
          isWinning: true
        },
        data: {
          isWinning: false
        }
      })
    }

    // Create new bid
    const bid = await prisma.bid.create({
      data: {
        auctionId: auction.id,
        amount: parseFloat(amount.toString()),
        amountHbar: parseFloat(amountHbar.toString()),
        currency: 'HBAR',
        businessId: business.id,
        bidderId: bidder.id,
        bidderWalletAddress: (bidderAccountId || walletAddress) as string, // Store wallet address for settlement
        isWinning: true,
        isActive: true
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            isVerified: true
          }
        },
        bidder: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }) as any

    // Update auction current bid
    await prisma.auction.update({
      where: { id: auction.id },
      data: {
        currentBid: parseFloat(amountHbar.toString())
      }
    })

    console.log('✅ [BID API] Bid placed successfully:', {
      bidId: bid.id,
      amount: bid.amountHbar,
      walletAddress: bid.bidderWalletAddress
    })

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully',
      bid: {
        id: bid.id,
        amount: bid.amountHbar,
        bidder: `${bid.bidder.firstName} ${bid.bidder.lastName}`,
        business: bid.business.name,
        bidderWalletAddress: bid.bidderWalletAddress, // ✅ Include wallet address in response
        timestamp: bid.createdAt
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ [BID API] Error placing bid:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to place bid',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
