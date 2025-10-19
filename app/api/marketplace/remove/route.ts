import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Remove NFT from marketplace
export async function DELETE(req: NextRequest) {
  try {
    const { tokenId, serialNumber, seller } = await req.json()

    console.log('🗑️ [MARKETPLACE REMOVE] Request:', { tokenId, serialNumber, seller })

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

    // Find the active listing
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        nftAssetId: nftAsset.id,
        seller,
        status: 'ACTIVE'
      }
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'No active listing found for this NFT' },
        { status: 404 }
      )
    }

    console.log('📋 [MARKETPLACE REMOVE] Found listing:', listing.id)

    // Update listing status to CANCELLED
    await prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    // Update NFT asset status back to MINTED
    await prisma.nFTAsset.update({
      where: { id: nftAsset.id },
      data: { status: 'MINTED' }
    })

    console.log('✅ [MARKETPLACE REMOVE] Successfully removed from marketplace')

    return NextResponse.json({
      success: true,
      message: 'NFT successfully removed from marketplace'
    })

  } catch (error: any) {
    console.error('❌ [MARKETPLACE REMOVE] Error:', error)
    console.error('❌ [MARKETPLACE REMOVE] Error stack:', error.stack)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove NFT from marketplace',
        message: error.message
      },
      { status: 500 }
    )
  }
}
