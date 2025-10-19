import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Check NFT status (listed, auctioned, etc.)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tokenId = searchParams.get('tokenId')
    const serialNumberStr = searchParams.get('serialNumber')

    if (!tokenId || !serialNumberStr) {
      return NextResponse.json(
        { error: 'Missing tokenId or serialNumber' },
        { status: 400 }
      )
    }

    const serialNumber = parseInt(serialNumberStr)
    if (isNaN(serialNumber)) {
      return NextResponse.json(
        { error: 'Invalid serialNumber' },
        { status: 400 }
      )
    }

    console.log('🔍 [NFT STATUS] Checking status for:', { tokenId, serialNumber })

    // Find the NFT asset
    const nftAsset = await prisma.nFTAsset.findFirst({
      where: {
        tokenId,
        serialNumber
      },
      include: {
        marketplaceListing: true,
        auction: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    })

    if (!nftAsset) {
      // NFT not in database yet - not listed or auctioned
      return NextResponse.json({
        isListed: false,
        isAuctioned: false
      })
    }

    // Check if listed on marketplace
    const isListed = nftAsset.marketplaceListing?.status === 'ACTIVE'
    const listingId = isListed ? nftAsset.marketplaceListing?.id : undefined

    // Check if in active auction
    const isAuctioned = nftAsset.auction ? nftAsset.auction.status === 'ACTIVE' : false
    const auctionId = isAuctioned && nftAsset.auction ? nftAsset.auction.id : undefined

    console.log('✅ [NFT STATUS] Status:', { 
      isListed, 
      isAuctioned, 
      listingId, 
      auctionId,
      nftStatus: nftAsset.status 
    })

    return NextResponse.json({
      isListed,
      isAuctioned,
      listingId,
      auctionId,
      nftStatus: nftAsset.status
    })

  } catch (error: any) {
    console.error('❌ [NFT STATUS] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check NFT status',
        message: error.message
      },
      { status: 500 }
    )
  }
}
