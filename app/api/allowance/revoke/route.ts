import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Revoke allowance and remove listing/cancel auction
 * Called after user successfully revokes NFT allowance via HashConnect
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      type, // 'listing' or 'auction'
      tokenId,
      serialNumber,
      seller,
      revokeTransactionId
    } = await req.json()

    console.log('🔓 [ALLOWANCE] Revoke request:', { type, tokenId, serialNumber, seller, revokeTransactionId })

    if (!type || !tokenId || !serialNumber || !seller) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (type === 'listing') {
      // Find active listing
      const listing = await prisma.marketplaceListing.findFirst({
        where: {
          nftAsset: {
            tokenId,
            serialNumber
          },
          seller,
          status: 'ACTIVE'
        },
        include: {
          nftAsset: true
        }
      })

      if (!listing) {
        return NextResponse.json(
          { success: false, error: 'Active listing not found' },
          { status: 404 }
        )
      }

      // Update listing to CANCELLED and revoke allowance
      const updatedListing = await prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          status: 'CANCELLED',
          allowanceGranted: false,
          allowanceTransactionId: null
        }
      })

      // Update NFT status back to MINTED (no longer listed)
      if (listing.nftAsset) {
        await prisma.nFTAsset.update({
          where: { id: listing.nftAsset.id },
          data: {
            status: 'MINTED'
          }
        })
      }

      console.log('✅ [ALLOWANCE] Listing removed:', updatedListing.id)

      return NextResponse.json({
        success: true,
        message: 'Listing removed and allowance revoked',
        listing: updatedListing
      })

    } else if (type === 'auction') {
      // Find active auction
      const auction = await prisma.auction.findFirst({
        where: {
          nftAssets: {
            some: {
              tokenId,
              serialNumber
            }
          },
          status: { in: ['ACTIVE', 'PENDING'] }
        },
        include: {
          nftAssets: true,
          bids: true
        }
      })

      if (!auction) {
        return NextResponse.json(
          { success: false, error: 'Active auction not found' },
          { status: 404 }
        )
      }

      // Check if auction has bids
      if (auction.bids && auction.bids.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Cannot cancel auction with existing bids. Please contact support.' },
          { status: 400 }
        )
      }

      // Update auction to CANCELLED
      const updatedAuction = await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: 'CANCELLED',
          allowanceGranted: false,
          allowanceTransactionId: null
        }
      })

      // Update NFT status back to MINTED
      if (auction.nftAssets && auction.nftAssets.length > 0) {
        await prisma.nFTAsset.updateMany({
          where: {
            id: { in: auction.nftAssets.map(nft => nft.id) }
          },
          data: {
            status: 'MINTED',
            auctionId: null
          }
        })
      }

      console.log('✅ [ALLOWANCE] Auction cancelled:', updatedAuction.id)

      return NextResponse.json({
        success: true,
        message: 'Auction cancelled and allowance revoked',
        auction: updatedAuction
      })

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "listing" or "auction"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('❌ [ALLOWANCE] Revoke error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to revoke allowance', details: error.message },
      { status: 500 }
    )
  }
}
