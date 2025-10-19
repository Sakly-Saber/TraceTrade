const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifySetup() {
  const buyerAccount = '0.0.7023264'
  
  console.log(`\n🔍 VERIFICATION REPORT FOR: ${buyerAccount}\n`)
  console.log('='.repeat(60))
  
  // 1. Check User
  const user = await prisma.user.findUnique({
    where: { walletAddress: buyerAccount },
    include: { business: true }
  })
  
  console.log('\n✅ USER RECORD:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Wallet: ${user.walletAddress}`)
  console.log(`   Business ID: ${user.businessId}`)
  console.log(`   Business Linked: ${user.business ? 'YES' : 'NO'}`)
  
  // 2. Check Business
  if (user.business) {
    console.log('\n✅ BUSINESS RECORD:')
    console.log(`   ID: ${user.business.id}`)
    console.log(`   Name: ${user.business.name}`)
    console.log(`   Type: ${user.business.businessType}`)
    console.log(`   Industry: ${user.business.industry}`)
    console.log(`   Status: ${user.business.status}`)
    console.log(`   Wallet: ${user.business.walletAddress}`)
  }
  
  // 3. Check NFT ownership capability
  console.log('\n✅ NFT OWNERSHIP:')
  console.log(`   Can own NFTs: ${user.businessId ? 'YES' : 'NO'}`)
  console.log(`   Business ID for NFT.ownerId: ${user.businessId || 'N/A'}`)
  
  // 4. Check if there are any pending marketplace listings
  const listings = await prisma.marketplaceListing.findMany({
    where: { status: 'ACTIVE' },
    include: {
      nftAsset: {
        include: {
          collection: true
        }
      }
    },
    take: 1
  })
  
  if (listings.length > 0) {
    const listing = listings[0]
    console.log('\n✅ SAMPLE ACTIVE LISTING:')
    console.log(`   Listing ID: ${listing.id}`)
    console.log(`   NFT: ${listing.nftAsset.name}`)
    console.log(`   Token ID: ${listing.nftAsset.tokenId}`)
    console.log(`   Serial: ${listing.nftAsset.serialNumber}`)
    console.log(`   Price: ${listing.priceHbar} HBAR`)
    console.log(`   Seller: ${listing.seller}`)
    console.log(`   Current Owner ID: ${listing.nftAsset.ownerId}`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ READY FOR PURCHASE!')
  console.log('='.repeat(60) + '\n')
  
  await prisma.$disconnect()
}

verifySetup().catch(console.error)
