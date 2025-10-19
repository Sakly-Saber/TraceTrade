const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createUserForBusiness() {
  const walletAddress = '0.0.6650412'
  
  console.log(`🔧 Creating user for wallet ${walletAddress}...\n`)

  try {
    // Find the business
    const business = await prisma.business.findFirst({
      where: { walletAddress },
    })

    if (!business) {
      console.log(`❌ No business found for wallet ${walletAddress}`)
      return
    }

    console.log(`✅ Found business: ${business.name} (ID: ${business.id})\n`)

    // Create a user for this business
    const user = await prisma.businessUser.create({
      data: {
        firstName: 'Main',
        lastName: 'User',
        email: `${walletAddress}@hedera.wallet`,
        role: 'OWNER',
        businessId: business.id,
        isActive: true,
        emailVerified: true,
      },
    })

    console.log(`✅ Created user:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Business: ${business.name}`)
    console.log(`   Active: ${user.isActive}`)
    
    console.log(`\n✨ You can now login with wallet ${walletAddress}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUserForBusiness()
