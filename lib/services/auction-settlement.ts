/**
 * Auction Completion Service
 * Handles final settlement of auctions with ATOMIC transactions:
 * - Transfer HBAR from winner to seller (minus platform fee)
 * - Transfer NFT from seller to winner
 * - Both happen in ONE transaction (all or nothing)
 */

import { 
  TransferTransaction, 
  TokenAssociateTransaction,
  Hbar,
  AccountId,
  PrivateKey,
  Client
} from '@hashgraph/sdk'

interface AuctionSettlement {
  auctionId: string
  nftTokenId: string
  nftSerialNumber: number
  winnerAccountId: string
  sellerAccountId: string
  finalBidAmount: number
  platformFeePercent?: number
  operatorAccountId: string
  operatorPrivateKey: string
}

/**
 * Settle auction with ATOMIC transaction
 * This ensures BOTH transfers happen together or neither happens
 */
export async function settleAuctionAtomic(settlement: AuctionSettlement): Promise<{
  success: boolean
  transactionId: string
  sellerReceived: number
  platformFee: number
}> {
  
  try {
    console.log('🔄 [ATOMIC SETTLEMENT] Starting auction settlement:', settlement.auctionId)

    // Create Hedera client with operator credentials
    const client = Client.forTestnet() // or forMainnet()
    client.setOperator(
      AccountId.fromString(settlement.operatorAccountId),
      PrivateKey.fromString(settlement.operatorPrivateKey)
    )

    // Calculate amounts
    const platformFeePercent = settlement.platformFeePercent || 2.5 // 2.5% default
    const feeAmount = (settlement.finalBidAmount * platformFeePercent) / 100
    const sellerAmount = settlement.finalBidAmount - feeAmount

    console.log(`💰 Final Bid: ${settlement.finalBidAmount} ℏ`)
    console.log(`💵 Platform Fee (${platformFeePercent}%): ${feeAmount.toFixed(2)} ℏ`)
    console.log(`💸 Seller Receives: ${sellerAmount.toFixed(2)} ℏ`)

    // ATOMIC TRANSACTION: NFT + HBAR transfer in ONE transaction
    // If ANY part fails, the ENTIRE transaction fails
    console.log('⚡ [ATOMIC SETTLEMENT] Creating ATOMIC transfer transaction...')
    
    const atomicTransfer = new TransferTransaction()
      // NFT Transfer: Seller → Winner
      .addNftTransfer(
        settlement.nftTokenId,
        settlement.nftSerialNumber,
        AccountId.fromString(settlement.sellerAccountId), // from seller
        AccountId.fromString(settlement.winnerAccountId)  // to winner
      )
      // HBAR Transfer: Winner → Seller (minus platform fee)
      .addHbarTransfer(
        AccountId.fromString(settlement.winnerAccountId),
        new Hbar(-settlement.finalBidAmount) // debit winner
      )
      .addHbarTransfer(
        AccountId.fromString(settlement.sellerAccountId),
        new Hbar(sellerAmount) // credit seller (after fee)
      )
      // Platform fee: Winner → Operator
      .addHbarTransfer(
        AccountId.fromString(settlement.operatorAccountId),
        new Hbar(feeAmount) // platform fee
      )
      .setTransactionMemo(`Auction Settlement: ${settlement.auctionId}`)

    // Freeze transaction
    const frozenTx = await atomicTransfer.freezeWith(client)

    console.log('🔐 [ATOMIC SETTLEMENT] Transaction frozen, executing...')
    
    // Execute the ATOMIC transaction
    const txResponse = await frozenTx.execute(client)
    
    console.log('⏳ [ATOMIC SETTLEMENT] Waiting for consensus...')
    
    // Get receipt to confirm success
    const receipt = await txResponse.getReceipt(client)

    if (receipt.status.toString() !== 'SUCCESS') {
      throw new Error(`Transaction failed with status: ${receipt.status.toString()}`)
    }

    const txId = txResponse.transactionId.toString()
    
    console.log('✅ [ATOMIC SETTLEMENT] Transaction successful!')
    console.log(`📝 Transaction ID: ${txId}`)
    console.log(`🎯 Status: ${receipt.status.toString()}`)
    console.log(`🖼️  NFT ${settlement.nftTokenId}#${settlement.nftSerialNumber} → ${settlement.winnerAccountId}`)
    console.log(`💵 ${settlement.finalBidAmount} ℏ → ${settlement.sellerAccountId}`)

    return {
      success: true,
      transactionId: txId,
      sellerReceived: sellerAmount,
      platformFee: feeAmount
    }

  } catch (error: any) {
    console.error('❌ [ATOMIC SETTLEMENT] Transaction failed:', error)
    console.error('❌ [ATOMIC SETTLEMENT] Error details:', error.message)
    throw new Error(`Atomic settlement failed: ${error.message}`)
  }
}

/**
 * Complete auction and execute atomic settlement
 * Called automatically when auction timer ends
 */
export async function completeAuction(
  auctionId: string,
  prisma: any,
  operatorAccountId: string,
  operatorPrivateKey: string
) {
  try {
    console.log(`🏁 [AUCTION COMPLETE] Processing auction: ${auctionId}`)
    
    // 1. Get auction details with all related data
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        nftAssets: {
          include: {
            owner: true
          }
        },
        bids: {
          where: { isWinning: true },
          include: {
            business: true,
            bidder: true
          },
          orderBy: { amountHbar: 'desc' },
          take: 1
        }
      }
    })

    if (!auction) {
      throw new Error(`Auction not found: ${auctionId}`)
    }

    // 2. Verify auction has ended
    if (new Date() < auction.endTime) {
      throw new Error(`Auction has not ended yet. Ends at: ${auction.endTime}`)
    }

    // 3. Check if already settled
    if (auction.isSettled) {
      console.log(`⚠️  [AUCTION COMPLETE] Auction already settled: ${auctionId}`)
      return { success: true, message: 'Already settled', auctionId }
    }

    // 4. Get winning bid
    const winningBid = auction.bids[0]
    
    if (!winningBid) {
      console.log(`⚠️  [AUCTION COMPLETE] No bids found for auction: ${auctionId}`)
      
      // Update auction status to ENDED (no winner)
      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          status: 'ENDED',
          isSettled: true
        }
      })

      // Return NFT to seller (update status back to MINTED)
      if (auction.nftAssets.length > 0) {
        await prisma.nFTAsset.update({
          where: { id: auction.nftAssets[0].id },
          data: {
            status: 'MINTED',
            auctionId: null
          }
        })
      }
      
      return { success: true, message: 'No bids - NFT returned to seller', auctionId }
    }

    const nft = auction.nftAssets[0]
    if (!nft) {
      throw new Error('No NFT associated with auction')
    }

    // Get seller wallet address (from NFT creator or business)
    const sellerWallet = nft.createdBy || nft.owner?.walletAddress
    if (!sellerWallet) {
      console.error(`❌ [WALLET] Could not find seller wallet for NFT:`, {
        nftId: nft.id,
        createdBy: nft.createdBy,
        ownerWallet: nft.owner?.walletAddress
      })
      throw new Error('Seller wallet address not found')
    }
    console.log(`✅ [WALLET] Found seller in NFT.createdBy: ${sellerWallet}`)

    // Get winner wallet address (from bid record - newly added field)
    const winnerWallet = winningBid.bidderWalletAddress
    if (!winnerWallet) {
      console.error(`❌ [WALLET] Could not find winner wallet for bid ${winningBid.id}`)
      console.error(`❌ [WALLET] Bid details:`, {
        bidId: winningBid.id,
        bidderWalletAddress: winningBid.bidderWalletAddress,
        businessId: winningBid.businessId,
        bidderId: winningBid.bidderId
      })
      throw new Error(`Could not find winner wallet address for bid ${winningBid.id}`)
    }
    console.log(`✅ [WALLET] Found winner wallet: ${winnerWallet}`)

    console.log(`🎯 [AUCTION COMPLETE] Winner: ${winnerWallet}`)
    console.log(`💰 [AUCTION COMPLETE] Final bid: ${winningBid.amountHbar} ℏ`)

    // 5. Execute ATOMIC settlement
    console.log(`⚡ [AUCTION COMPLETE] Executing atomic settlement...`)
    
    const settlementResult = await settleAuctionAtomic({
      auctionId: auction.id,
      nftTokenId: nft.tokenId,
      nftSerialNumber: nft.serialNumber,
      winnerAccountId: winnerWallet,
      sellerAccountId: sellerWallet,
      finalBidAmount: winningBid.amountHbar,
      platformFeePercent: 2.5,
      operatorAccountId,
      operatorPrivateKey
    })

    // 6. Update database - mark as settled
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: 'ENDED',
        isSettled: true,
        winnerId: winningBid.businessId
      }
    })

    // 7. Update NFT ownership
    await prisma.nFTAsset.update({
      where: { id: nft.id },
      data: {
        ownerId: winningBid.businessId,
        status: 'MINTED',
        auctionId: null,
        lastSalePrice: winningBid.amountHbar
      }
    })

    // 8. Update bid with transaction ID
    await prisma.bid.update({
      where: { id: winningBid.id },
      data: {
        txHash: settlementResult.transactionId
      }
    })

    console.log(`✅ [AUCTION COMPLETE] Auction ${auctionId} settled successfully!`)
    console.log(`📝 Transaction: ${settlementResult.transactionId}`)

    return {
      success: true,
      auctionId,
      transactionId: settlementResult.transactionId,
      winner: winnerWallet,
      finalBid: winningBid.amountHbar,
      sellerReceived: settlementResult.sellerReceived,
      platformFee: settlementResult.platformFee
    }
    
  } catch (error: any) {
    console.error(`❌ [AUCTION COMPLETE] Error:`, error)
    
    // Mark auction as failed settlement
    try {
      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          status: 'FAILED',
          // Store error in a notes field if available
        }
      })
    } catch (dbError) {
      console.error(`❌ [AUCTION COMPLETE] Failed to update auction status:`, dbError)
    }
    
    throw error
  }
}
