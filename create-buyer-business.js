const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createBusinessForBuyer() {
  const buyerAccount = '0.0.7023264'
  
  console.log(`\n🔧 Creating Business for buyer: ${buyerAccount}\n`)
  
  // Get the user
  const user = await prisma.user.findUnique({
    where: { walletAddress: buyerAccount }
  })
  
  if (!user) {
    console.log('❌ User not found!')
    return
  }
  
  console.log('✅ User found:', user.id)
  
  // Check if business already exists
  if (user.businessId) {
    console.log('✅ User already has a business:', user.businessId)
    return
  }
  
  // Create business
  const business = await prisma.business.create({
    data: {
      name: `Buyer ${buyerAccount}`,
      email: `${buyerAccount}@hedera.wallet`,
      phone: 'N/A',
      address: 'Hedera Network',
      city: 'Blockchain',
      state: 'Decentralized',
      country: 'Global',
      businessType: 'SOLE_PROPRIETORSHIP',
      industry: 'OTHER',
      walletAddress: buyerAccount,
      walletType: 'HASHCONNECT',
      status: 'ACTIVE'
    }
  })
  
  console.log('✅ Business created:', business.id)
  
  // Link business to user
  await prisma.user.update({
    where: { id: user.id },
    data: { businessId: business.id }
  })
  
  console.log('✅ Business linked to user!')
  
  // Verify
  const updatedUser = await prisma.user.findUnique({
    where: { walletAddress: buyerAccount },
    include: { business: true }
  })
  
  console.log('\n📊 Updated User:')
  console.log(JSON.stringify(updatedUser, null, 2))
  
  await prisma.$disconnect()
}

createBusinessForBuyer().catch(console.error)
