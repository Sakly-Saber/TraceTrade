/**
 * Auction Completion Cron Job
 * Automatically settles ended auctions
 * Should be called every minute by a scheduler
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { completeAuction } from '@/lib/services/auction-settlement'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds timeout

export async function GET(request: NextRequest) {
  try {
    // Security: Only allow requests from authorized sources
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 [CRON] Checking for ended auctions...')

    // Find all auctions that have ended but not settled
    const endedAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          lte: new Date() // ended
        },
        isSettled: false
      },
      include: {
        nftAssets: true,
        bids: {
          where: { isWinning: true },
          take: 1
        }
      }
    })

    console.log(`📋 [CRON] Found ${endedAuctions.length} auctions to process`)

    if (endedAuctions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No auctions to settle',
        processed: 0
      })
    }

    // Get operator credentials from environment
    const operatorId = process.env.HEDERA_OPERATOR_ID
    const operatorKey = process.env.HEDERA_OPERATOR_KEY

    if (!operatorId || !operatorKey) {
      console.error('❌ [CRON] Missing Hedera operator credentials')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const results = []

    // Process each ended auction
    for (const auction of endedAuctions) {
      try {
        console.log(`🏁 [CRON] Processing auction: ${auction.id}`)
        
        const result = await completeAuction(
          auction.id,
          prisma,
          operatorId,
          operatorKey
        )
        
        results.push({
          auctionId: auction.id,
          success: result.success,
          message: result.message || 'Settled successfully',
          transactionId: result.transactionId,
          winner: result.winner,
          finalBid: result.finalBid,
          sellerReceived: result.sellerReceived,
          platformFee: result.platformFee
        })
        
      } catch (error: any) {
        console.error(`❌ [CRON] Failed to settle auction ${auction.id}:`, error.message)
        
        results.push({
          auctionId: auction.id,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    console.log(`✅ [CRON] Completed: ${successCount} successful, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Processed ${endedAuctions.length} auctions`,
      processed: endedAuctions.length,
      successful: successCount,
      failed: failedCount,
      results
    })

  } catch (error: any) {
    console.error('❌ [CRON] Error in auction completion job:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process auctions',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
