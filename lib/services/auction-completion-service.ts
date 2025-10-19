/**
 * Auction Completion Service
 * Automatically completes expired auctions and transfers NFTs to winners
 */

import { PrismaClient } from '@prisma/client'
import { Client, AccountId, TransferTransaction, Hbar, TokenId, NftId } from '@hashgraph/sdk'

const prisma = new PrismaClient()

// Configuration
const COMPLETION_INTERVAL = 60000 // Check every 60 seconds
const OPERATOR_ACCOUNT_ID = process.env.OPERATOR_ACCOUNT_ID || '0.0.6854036'
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY

// Hedera client for operator transactions
let hederaClient: Client | null = null

function getHederaClient(): Client {
  if (!hederaClient) {
    if (!OPERATOR_PRIVATE_KEY) {
      throw new Error('OPERATOR_PRIVATE_KEY not configured')
    }
    
    hederaClient = Client.forTestnet()
    hederaClient.setOperator(
      AccountId.fromString(OPERATOR_ACCOUNT_ID),
      OPERATOR_PRIVATE_KEY
    )
  }
  return hederaClient
}

/**
 * Complete a single auction
 */
async function completeAuction(auctionId: string): Promise<boolean> {
  try {
    console.log(`🔄 [AUCTION] Processing auction: ${auctionId}`)
    
    // Get auction with bids and NFT data
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amountHbar: 'desc' },
          take: 1
        },
        nftAssets: {
          include: {
            owner: true
          }
        }
      }
    })
    
    if (!auction) {
      console.error(`❌ [AUCTION] Auction not found: ${auctionId}`)
      return false
    }
    
    // Check if auction has allowance granted
    if (!auction.allowanceGranted) {
      console.warn(`⚠️ [AUCTION] Auction ${auctionId} has no NFT allowance granted`)
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'ENDED' }
      })
      return false
    }
    
    const highestBid = auction.bids[0]
    if (!highestBid) {
      console.log(`ℹ️ [AUCTION] No bids for auction ${auctionId}, marking as ENDED`)
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'ENDED' }
      })
      return true
    }
    
    // Get seller wallet address
    const nftAsset = auction.nftAssets[0]
    if (!nftAsset) {
      console.error(`❌ [AUCTION] No NFT asset found for auction ${auctionId}`)
      return false
    }
    
    const sellerWallet = await findSellerWallet(auction, nftAsset)
    if (!sellerWallet) {
      console.error(`❌ [AUCTION] Could not find seller wallet for auction ${auctionId}`)
      return false
    }
    
    // Get winner wallet address
    const winnerWallet = await findWinnerWallet(highestBid)
    if (!winnerWallet) {
      console.error(`❌ [AUCTION] Could not find winner wallet for auction ${auctionId}`)
      return false
    }
    
    // Validate bid amount
    if (!highestBid.amountHbar || highestBid.amountHbar <= 0) {
      console.error(`❌ [AUCTION] Invalid bid amount for auction ${auctionId}`)
      return false
    }
    
    // Check for self-bid
    if (sellerWallet === winnerWallet) {
      console.log(`⚠️ [AUCTION] Self-bid detected for auction ${auctionId}, marking as ENDED`)
      await prisma.auction.update({
        where: { id: auctionId },
        data: { 
          status: 'ENDED',
          winnerId: highestBid.bidderId
        }
      })
      return true
    }
    
    // Execute blockchain transfers
    const bidAmount = highestBid.amountHbar
    console.log(`🔄 [AUCTION] Transferring NFT and HBAR for auction ${auctionId}`)
    console.log(`   Seller: ${sellerWallet}`)
    console.log(`   Winner: ${winnerWallet}`)
    console.log(`   Amount: ${bidAmount} HBAR`)
    
    const client = getHederaClient()
    const tokenId = TokenId.fromString(nftAsset.tokenId)
    const nftId = new NftId(tokenId, nftAsset.serialNumber)
    
    // Build atomic swap transaction
    const transaction = new TransferTransaction()
      // Transfer NFT from seller to winner (using approved allowance)
      .addApprovedNftTransfer(nftId, AccountId.fromString(sellerWallet), AccountId.fromString(winnerWallet))
      // Transfer HBAR from operator to seller (operator pays on behalf of winner)
      .addHbarTransfer(AccountId.fromString(OPERATOR_ACCOUNT_ID), Hbar.fromTinybars(-bidAmount * 100_000_000))
      .addHbarTransfer(AccountId.fromString(sellerWallet), Hbar.fromTinybars(bidAmount * 100_000_000))
      .freezeWith(client)
    
    // Execute transaction
    const txResponse = await transaction.execute(client)
    const receipt = await txResponse.getReceipt(client)
    
    console.log(`✅ [AUCTION] Transaction successful: ${txResponse.transactionId.toString()}`)
    
    // Find or create winner's Business for NFT ownership
    const winnerBusiness = await findOrCreateWinnerBusiness(winnerWallet, highestBid)
    
    // Update database
    await prisma.$transaction([
      // Update auction status
      prisma.auction.update({
        where: { id: auctionId },
        data: {
          status: 'SETTLED',
          isSettled: true,
          winnerId: highestBid.bidderId
        }
      }),
      // Update NFT ownership to winner's Business
      prisma.nFTAsset.update({
        where: { id: nftAsset.id },
        data: {
          ownerId: winnerBusiness.id,
          status: 'SOLD',
          lastSalePrice: bidAmount,
          auctionId: null
        }
      })
    ])
    
    console.log(`✅ [AUCTION] Completed auction: ${auctionId}`)
    return true
    
  } catch (error: any) {
    console.error(`❌ [AUCTION] Error completing auction ${auctionId}:`, error.message)
    return false
  }
}

/**
 * Find seller wallet address (4-tier resolution)
 */
async function findSellerWallet(auction: any, nftAsset: any): Promise<string | null> {
  // Tier 1: Check NFT asset createdBy field (wallet address)
  if (nftAsset.createdBy && nftAsset.createdBy.startsWith('0.0.')) {
    console.log(`✅ [WALLET] Found seller in NFT.createdBy: ${nftAsset.createdBy}`)
    return nftAsset.createdBy
  }
  
  // Tier 2: Check auction business owner user
  if (auction.businessId) {
    const businessUsers = await prisma.businessUser.findMany({
      where: { businessId: auction.businessId }
    })
    for (const user of businessUsers) {
      const userRecord = await prisma.user.findUnique({
        where: { walletAddress: user.email }
      })
      if (userRecord) {
        console.log(`✅ [WALLET] Found seller in business users: ${userRecord.walletAddress}`)
        return userRecord.walletAddress
      }
    }
  }
  
  // Tier 3: Check business wallet address
  const business = await prisma.business.findUnique({
    where: { id: auction.businessId }
  })
  if (business?.walletAddress) {
    console.log(`✅ [WALLET] Found seller in business.walletAddress: ${business.walletAddress}`)
    return business.walletAddress
  }
  
  // Tier 4: Check NFT owner wallet
  if (nftAsset.owner?.walletAddress) {
    console.log(`✅ [WALLET] Found seller in owner.walletAddress: ${nftAsset.owner.walletAddress}`)
    return nftAsset.owner.walletAddress
  }
  
  console.error(`❌ [WALLET] Could not find seller wallet for auction ${auction.id}`)
  return null
}

/**
 * Find winner wallet address (2-tier resolution)
 */
async function findWinnerWallet(bid: any): Promise<string | null> {
  // Tier 1: Check bidder email (might be wallet address)
  if (bid.bidder && bid.bidder.email && bid.bidder.email.startsWith('0.0.')) {
    console.log(`✅ [WALLET] Found winner in bidder.email: ${bid.bidder.email}`)
    return bid.bidder.email
  }
  
  // Tier 2: Check User table by email
  if (bid.bidder && bid.bidder.email) {
    const user = await prisma.user.findUnique({
      where: { walletAddress: bid.bidder.email }
    })
    if (user) {
      console.log(`✅ [WALLET] Found winner in User table: ${user.walletAddress}`)
      return user.walletAddress
    }
  }
  
  console.error(`❌ [WALLET] Could not find winner wallet for bid ${bid.id}`)
  return null
}

/**
 * Find or create a Business for the auction winner
 */
async function findOrCreateWinnerBusiness(
  walletAddress: string,
  bid: any
): Promise<any> {
  console.log(`🔍 [AUCTION] Finding or creating Business for winner: ${walletAddress}`)
  
  // Check if User exists with this wallet
  let user = await prisma.user.findUnique({
    where: { walletAddress },
    include: { business: true }
  })
  
  // Create User if doesn't exist
  if (!user) {
    console.log(`📝 [AUCTION] Creating new User for winner: ${walletAddress}`)
    user = await prisma.user.create({
      data: {
        walletAddress,
        walletType: 'HASHCONNECT',
        email: `${walletAddress}@hedera.wallet`
      },
      include: { business: true }
    })
  }
  
  // Check if user has a Business
  let business = user.business
  if (!business && user.businessId) {
    business = await prisma.business.findUnique({
      where: { id: user.businessId }
    })
  }
  
  // Create Business if user doesn't have one
  if (!business) {
    console.log(`🏢 [AUCTION] Creating new Business for winner: ${walletAddress}`)
    business = await prisma.business.create({
      data: {
        name: `Winner ${walletAddress}`,
        email: `${walletAddress}@hedera.wallet`,
        phone: 'N/A',
        address: 'Hedera Network',
        city: 'Blockchain',
        state: 'Decentralized',
        country: 'Global',
        businessType: 'SOLE_PROPRIETORSHIP',
        industry: 'OTHER',
        walletAddress,
        walletType: 'HASHCONNECT',
        status: 'ACTIVE'
      }
    })
    
    // Link Business to User
    await prisma.user.update({
      where: { id: user.id },
      data: { businessId: business.id }
    })
    
    console.log(`🔗 [AUCTION] Linked Business ${business.id} to User ${user.id}`)
  }
  
  console.log(`✅ [AUCTION] Winner Business ready: ${business.id}`)
  return business
}

/**
 * Complete all expired auctions
 */
async function completeExpiredAuctions(): Promise<void> {
  try {
    const now = new Date()
    
    // Find all ACTIVE auctions that have ended
    const expiredAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          lte: now
        }
      },
      select: {
        id: true,
        title: true,
        endTime: true
      }
    })
    
    if (expiredAuctions.length === 0) {
      return
    }
    
    console.log(`📦 [SERVICE] Found ${expiredAuctions.length} expired auctions to complete`)
    
    // Complete each auction
    for (const auction of expiredAuctions) {
      await completeAuction(auction.id)
    }
    
  } catch (error: any) {
    console.error('❌ [SERVICE] Error in completeExpiredAuctions:', error.message)
  }
}

/**
 * Complete offline auctions (called on server startup)
 */
export async function completeOfflineAuctions(): Promise<void> {
  console.log('📦 [SERVER] Checking for auctions that ended while offline...')
  await completeExpiredAuctions()
}

/**
 * Start the real-time auction completion service
 */
export function startAuctionCompletionService(): void {
  console.log(`⏰ [SERVICE] Auction completion service started (checking every ${COMPLETION_INTERVAL / 1000}s)`)
  
  // Run immediately
  completeExpiredAuctions()
  
  // Then run on interval
  setInterval(() => {
    completeExpiredAuctions()
  }, COMPLETION_INTERVAL)
}
