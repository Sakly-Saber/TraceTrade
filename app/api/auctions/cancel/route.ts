import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Cancel auction
export async function DELETE(req: NextRequest) {
  try {
    const { tokenId, serialNumber, seller } = await req.json()

    console.log('🗑️ [AUCTION CANCEL] Request:', { tokenId, serialNumber, seller })

    // Validate required fields
    if (!tokenId || typeof serialNumber !== 'number' || !seller) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tokenId, serialNumber, seller' },
        { status: 400 }
      )
    }

    // Find the NFT asset
    const nftAsset = await prisma.nFTAsset.findFirst({
      where: {
        tokenId,
        serialNumber
      }
    })

    if (!nftAsset) {
      return NextResponse.json(
        { success: false, error: 'NFT not found in database' },
        { status: 404 }
      )
    }

    // Find the active auction
    const auction = await prisma.auction.findFirst({
      where: {
        nftAssets: {
          some: {
            id: nftAsset.id
          }
        },
        status: 'ACTIVE'
      }
    })

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'No active auction found for this NFT' },
        { status: 404 }
      )
    }

    // TODO: Verify seller after prisma generate
    // if (auction.seller && auction.seller !== seller) {
    //   return NextResponse.json(
    //     { success: false, error: 'You are not the seller of this auction' },
    //     { status: 403 }
    //   )
    // }

    // Check if there are bids
    const bidCount = await prisma.bid.count({
      where: {
        auctionId: auction.id
      }
    })

    if (bidCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot cancel auction with existing bids. Please wait for auction to end.' 
        },
        { status: 400 }
      )
    }

    console.log('📋 [AUCTION CANCEL] Found auction:', auction.id)

    // Update auction status to CANCELLED
    await prisma.auction.update({
      where: { id: auction.id },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    // Update NFT asset status back to MINTED
    await prisma.nFTAsset.update({
      where: { id: nftAsset.id },
      data: { 
        status: 'MINTED',
        auctionId: null
      }
    })

    console.log('✅ [AUCTION CANCEL] Successfully cancelled auction')

    return NextResponse.json({
      success: true,
      message: 'Auction successfully cancelled'
    })

  } catch (error: any) {
    console.error('❌ [AUCTION CANCEL] Error:', error)
    console.error('❌ [AUCTION CANCEL] Error stack:', error.stack)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cancel auction',
        message: error.message
      },
      { status: 500 }
    )
  }
}
