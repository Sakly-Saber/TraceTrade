import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIpfsUrl } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        nftAsset: {
          include: {
            collection: true
          }
        },
        sellerBusiness: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Transform to frontend format
    // Transform to frontend format
    const response = {
      id: listing.id,
      name: listing.nftAsset?.name || `NFT ${listing.nftAsset?.tokenId}`,
      description: listing.nftAsset?.description || 'No description available',
  image: normalizeIpfsUrl(listing.nftAsset?.aiImageCID, listing.nftAsset?.imageUrl || listing.nftAsset?.aiImageUrl),
      price: listing.priceHbar || 0,
      category: listing.nftAsset?.collection?.category || 'AGRICULTURAL',
      location: listing.nftAsset?.location ? [listing.nftAsset.location] : ['Digital'],
      views: 0, // TODO: Implement view tracking
      likes: 0, // TODO: Implement favorites
      tokenId: listing.nftAsset?.tokenId || '',
      serialNumber: listing.nftAsset?.serialNumber || 0,
      seller: listing.seller || 'Unknown',
      sellerName: listing.sellerBusiness?.name || 'Anonymous',
      verified: true,
      status: listing.status,
      currency: 'HBAR',
      attributes: listing.nftAsset?.assetData ? 
        (typeof listing.nftAsset.assetData === 'string' ? 
          JSON.parse(listing.nftAsset.assetData) : 
          listing.nftAsset.assetData) : 
        {}
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}
