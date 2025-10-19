import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { listingId, buyerAccountId, transactionId, priceHbar } = await req.json()

    console.log('💾 [COMPLETE-PURCHASE] Updating database...', {
      listingId,
      buyer: buyerAccountId,
      txId: transactionId,
      price: priceHbar
    })

    if (!listingId || !buyerAccountId || !transactionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId }
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Listing is not active' },
        { status: 400 }
      )
    }

    // Update listing to SOLD
    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: 'SOLD',
        soldAt: new Date(),
        transactionId: transactionId
      }
    })

    // Update NFT ownership and status using nftAssetId
    if (listing.nftAssetId) {
      await prisma.nFTAsset.update({
        where: { id: listing.nftAssetId },
        data: {
          ownerId: buyerAccountId,
          status: 'SOLD'
        }
      })
    }

    console.log('✅ [COMPLETE-PURCHASE] Database updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Purchase completed successfully',
      transactionId: transactionId
    })

  } catch (error) {
    console.error('❌ [COMPLETE-PURCHASE] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete purchase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
