/**
 * Expedite Auction Script
 * Sets an auction to end in 2 minutes for testing
 * Usage: node scripts/expedite-auction.js <auction-id>
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function expediteAuction(auctionId) {
  try {
    if (!auctionId) {
      console.error('❌ Please provide an auction ID')
      console.log('Usage: node scripts/expedite-auction.js <auction-id>')
      process.exit(1)
    }

    // Find the auction
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    })

    if (!auction) {
      console.error(`❌ Auction not found: ${auctionId}`)
      process.exit(1)
    }

    // Set end time to 2 minutes from now
    const newEndTime = new Date(Date.now() + 2 * 60 * 1000)

    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        endTime: newEndTime,
        status: 'ACTIVE'
      }
    })

    console.log('✅ Auction expedited successfully!')
    console.log(`📋 Auction ID: ${auctionId}`)
    console.log(`⏰ New End Time: ${newEndTime.toLocaleString()}`)
    console.log(`⏱️  Will end in: 2 minutes`)
    console.log(`\n🔗 View auction: http://localhost:3000/auctions/${auctionId}`)

  } catch (error) {
    console.error('❌ Error expediting auction:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get auction ID from command line arguments
const auctionId = process.argv[2]
expediteAuction(auctionId)
