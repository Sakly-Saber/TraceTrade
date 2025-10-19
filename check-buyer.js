const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkBuyer() {
  const buyerAccount = '0.0.7023264'
  
  console.log(`\n🔍 Checking database for buyer: ${buyerAccount}\n`)
  
  // Check User table
  const user = await prisma.user.findUnique({
    where: { walletAddress: buyerAccount },
    include: { business: true }
  })
  
  console.log('👤 User Record:')
  console.log(JSON.stringify(user, null, 2))
  
  // Check Business table
  const businesses = await prisma.business.findMany({
    where: { walletAddress: buyerAccount }
  })
  
  console.log('\n🏢 Business Records:')
  console.log(JSON.stringify(businesses, null, 2))
  
  // Check NFT ownership
  const nfts = await prisma.nFTAsset.findMany({
    where: {
      owner: {
        walletAddress: buyerAccount
      }
    },
    include: {
      collection: true,
      owner: true
    }
  })
  
  console.log('\n🎨 Owned NFTs:')
  console.log(JSON.stringify(nfts, null, 2))
  
  // Check all businesses to see what structure we need
  const allBusinesses = await prisma.business.findMany({
    take: 2
  })
  
  console.log('\n📊 Sample Business Schema (first 2 records):')
  console.log(JSON.stringify(allBusinesses, null, 2))
  
  await prisma.$disconnect()
}

checkBuyer().catch(console.error)
