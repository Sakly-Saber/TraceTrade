import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIpfsUrl } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        nftAssets: {
          include: {
            collection: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        bids: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
          include: {
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      )
    }

    // Get the first NFT asset (auctions typically have one NFT)
    const nft = auction.nftAssets[0]
    
    // Transform to frontend format
    const response = {
      id: auction.id,
      startingBid: auction.reservePrice || 0,
      reservePrice: auction.reservePrice || 0,
      currentBid: auction.currentBid || 0,
      auctionEndTime: auction.endTime.toISOString(),
      status: auction.status,
      nftAssets: [{
        name: nft?.name || auction.title,
        description: nft?.description || auction.description,
        imageUrl: normalizeIpfsUrl(nft?.aiImageCID, nft?.imageUrl),
        aiImageUrl: normalizeIpfsUrl(nft?.aiImageCID, nft?.aiImageUrl),
        tokenId: auction.tokenId || nft?.tokenId || '',
        serialNumber: nft?.serialNumber || 0,
        collection: nft?.collection ? {
          name: nft.collection.name
        } : undefined
      }],
      bids: auction.bids.map(bid => ({
        id: bid.id,
        amount: bid.amount || 0,
        createdAt: bid.createdAt.toISOString(),
        bidder: {
          id: bid.bidder?.id || '',
          firstName: bid.bidder?.firstName || 'Unknown',
          lastName: bid.bidder?.lastName || 'Bidder'
        }
      })),
      createdBy: {
        firstName: auction.createdBy?.firstName || 'Unknown',
        lastName: auction.createdBy?.lastName || 'Seller',
        email: auction.createdBy?.email || ''
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching auction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auction' },
      { status: 500 }
    )
  }
}
