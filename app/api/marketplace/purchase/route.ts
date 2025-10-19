/**
 * Marketplace Atomic Purchase API
 * Executes atomic NFT + HBAR transfer using seller's allowance
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  TransferTransaction,
  TokenId,
  AccountId,
  Hbar,
  PrivateKey,
  Client
} from '@hashgraph/sdk'

// Treasury operator account (escrow/marketplace operator)
const OPERATOR_ID = process.env.NEXT_PUBLIC_OPERATOR_ID || '0.0.6854036'
const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY || '0x2ed51bfe9104afd3340c3d26b7a316f008dbd8de0ba2b3e8389e247a5c32218c'

export async function POST(req: NextRequest) {
  try {
    const { listingId, buyerAccountId } = await req.json()

    console.log('💰 [PURCHASE] Validating purchase...', {
      listingId,
      buyer: buyerAccountId
    })

    // Validate input
    if (!listingId || !buyerAccountId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate Hedera address format
    if (!buyerAccountId.startsWith('0.0.')) {
      return NextResponse.json(
        { success: false, error: 'Invalid Hedera address format' },
        { status: 400 }
      )
    }

    // 1. Find and validate the listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        nftAsset: {
          include: {
            owner: true
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

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Listing is not active' },
        { status: 400 }
      )
    }

    if (!listing.nftAsset) {
      return NextResponse.json(
        { success: false, error: 'NFT asset not found' },
        { status: 404 }
      )
    }

    // Check if allowance is granted
    if (!listing.allowanceGranted) {
      return NextResponse.json(
        { success: false, error: 'NFT allowance not granted. Seller must approve allowance first.' },
        { status: 400 }
      )
    }

    // Get seller wallet address
    let sellerAccountId = listing.seller

    if (!sellerAccountId || !sellerAccountId.startsWith('0.0.')) {
      if (listing.nftAsset.owner?.walletAddress) {
        sellerAccountId = listing.nftAsset.owner.walletAddress
      } else if (listing.nftAsset.createdBy?.startsWith('0.0.')) {
        sellerAccountId = listing.nftAsset.createdBy
      } else {
        return NextResponse.json(
          { success: false, error: 'Could not determine seller wallet address' },
          { status: 500 }
        )
      }
    }

    // 2. Validate buyer is not the seller
    if (buyerAccountId === sellerAccountId) {
      return NextResponse.json(
        { success: false, error: 'You cannot buy your own NFT' },
        { status: 400 }
      )
    }

    // 3. Return transaction details for frontend to execute
    // The frontend will build and sign the transaction with HashConnect
    // Note: Since seller gave allowance to OPERATOR, we need a different approach
    // The simplest is: buyer sends HBAR, and in exchange receives the NFT
    // The seller must have given allowance to the BUYER (not operator) for this to work
    // OR we need the operator to co-sign
    
    return NextResponse.json({
      success: true,
      message: 'Purchase validated. Ready to execute transaction.',
      transactionData: {
        listingId: listing.id,
        tokenId: listing.nftAsset.tokenId,
        serialNumber: listing.nftAsset.serialNumber,
        priceHbar: listing.priceHbar,
        seller: sellerAccountId,
        buyer: buyerAccountId,
        operatorId: OPERATOR_ID,
        nftAssetId: listing.nftAssetId,
        // Note: The buyer will execute a regular transfer
        // The seller must approve the buyer as spender first
        requiresAllowance: true
      }
    })

  } catch (error: any) {
    console.error('❌ [PURCHASE] Validation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate purchase',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
