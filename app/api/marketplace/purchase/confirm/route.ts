/**
 * Marketplace Purchase Confirmation API
 * Step 2: Confirm transaction and update database
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { listingId, transactionId, buyerAddress } = await req.json()

    // Validate input
    if (!listingId || !transactionId || !buyerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, transactionId, buyerAddress' },
        { status: 400 }
      )
    }

    // Get listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        nftAsset: true
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Listing is not active' },
        { status: 400 }
      )
    }

    // Ensure buyer business exists (create lightweight record if missing)
    let buyerBusiness = await prisma.business.findFirst({ where: { walletAddress: buyerAddress } })
    if (!buyerBusiness) {
      buyerBusiness = await prisma.business.create({
        data: {
          name: `Buyer ${buyerAddress.slice(0, 10)}`,
          email: `${buyerAddress.replace(/\./g, '_')}@hedera.network`,
          phone: '000-000-0000',
          address: 'Unknown',
          city: 'Unknown',
          state: 'Unknown',
          country: 'Unknown',
          businessType: 'SOLE_PROPRIETORSHIP',
          industry: 'OTHER',
          walletAddress: buyerAddress
        }
      })
    }

    // Transfer ownership and mark listing/asset as sold atomically
    await prisma.$transaction([
      prisma.marketplaceListing.update({
        where: { id: listingId },
        data: {
          status: 'SOLD'
        }
      }),
      prisma.nFTAsset.update({
        where: { id: listing.nftAssetId },
        data: {
          status: 'SOLD',
          lastSalePrice: listing.priceHbar,
          ownerId: buyerBusiness.id
        }
      })
    ])

    console.log(`✅ [MARKETPLACE] Purchase confirmed for listing ${listingId}`)
    console.log(`   Transaction: ${transactionId}`)
    console.log(`   Buyer: ${buyerAddress}`)

    return NextResponse.json({
      success: true,
      message: 'Purchase confirmed successfully',
      transactionId,
      listingId
    })

  } catch (error: any) {
    console.error('❌ [MARKETPLACE] Purchase confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
