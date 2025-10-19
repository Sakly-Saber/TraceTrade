import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Update listing or auction with allowance information
 * Called after user successfully grants NFT allowance via HashConnect
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      type, // 'listing' or 'auction'
      tokenId,
      serialNumber,
      seller,
      allowanceTransactionId,
      priceHbar // Include price for validation
    } = await req.json()

    console.log('🔐 [ALLOWANCE] Grant request:', { type, tokenId, serialNumber, seller, allowanceTransactionId })

    if (!type || !tokenId || !serialNumber || !seller || !allowanceTransactionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (type === 'listing') {
      // Find the listing for this NFT
      const listing = await prisma.marketplaceListing.findFirst({
        where: {
          nftAsset: {
            tokenId,
            serialNumber
          },
          seller,
          status: { in: ['PENDING', 'ACTIVE'] }
        },
        orderBy: { createdAt: 'desc' } // Get most recent
      })

      if (!listing) {
        return NextResponse.json(
          { success: false, error: 'Listing not found. Please create listing first.' },
          { status: 404 }
        )
      }

      // Update listing with allowance info
      const updatedListing = await prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          allowanceGranted: true,
          allowanceTransactionId,
          status: 'ACTIVE' // Activate listing now that allowance is granted
        }
      })

      console.log('✅ [ALLOWANCE] Listing updated:', updatedListing.id)

      return NextResponse.json({
        success: true,
        message: 'Allowance granted for marketplace listing',
        listing: updatedListing
      })

    } else if (type === 'auction') {
      // Find the auction for this NFT
      const auction = await prisma.auction.findFirst({
        where: {
          nftAssets: {
            some: {
              tokenId,
              serialNumber
            }
          },
          businessId: {
            not: ""
          },
          status: { in: ['PENDING', 'ACTIVE'] }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!auction) {
        return NextResponse.json(
          { success: false, error: 'Auction not found. Please create auction first.' },
          { status: 404 }
        )
      }

      // Update auction with allowance info
      const updatedAuction = await prisma.auction.update({
        where: { id: auction.id },
        data: {
          allowanceGranted: true,
          allowanceTransactionId,
          status: 'ACTIVE' // Activate auction now that allowance is granted
        }
      })

      console.log('✅ [ALLOWANCE] Auction updated:', updatedAuction.id)

      return NextResponse.json({
        success: true,
        message: 'Allowance granted for auction',
        auction: updatedAuction
      })

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "listing" or "auction"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('❌ [ALLOWANCE] Grant error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update allowance', details: error.message },
      { status: 500 }
    )
  }
}
