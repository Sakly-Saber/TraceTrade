const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function linkUserToBusiness() {
  const walletAddress = '0.0.6650412'
  const userEmail = `${walletAddress}@hedera.wallet`
  
  console.log(`🔧 Linking user to business for wallet ${walletAddress}...\n`)

  try {
    // Find the business
    const business = await prisma.business.findFirst({
      where: { walletAddress },
    })

    if (!business) {
      console.log(`❌ No business found for wallet ${walletAddress}`)
      return
    }

    console.log(`✅ Found business: ${business.name} (ID: ${business.id})`)

    // Find existing user with this email
    const existingUser = await prisma.businessUser.findFirst({
      where: { email: userEmail },
    })

    if (existingUser) {
      console.log(`✅ Found existing user: ${existingUser.email}`)
      console.log(`   Current business: ${existingUser.businessId}`)
      
      // Update user to link to correct business
      const updated = await prisma.businessUser.update({
        where: { id: existingUser.id },
        data: {
          businessId: business.id,
          isActive: true,
          role: 'OWNER',
        },
      })
      
      console.log(`\n✅ Updated user:`)
      console.log(`   Email: ${updated.email}`)
      console.log(`   New business: ${business.id}`)
      console.log(`   Role: ${updated.role}`)
      console.log(`   Active: ${updated.isActive}`)
    } else {
      // Create new user with different email
      const newUser = await prisma.businessUser.create({
        data: {
          firstName: 'Main',
          lastName: 'User',
          email: `${walletAddress}@wallet.hedera`,  // Different email pattern
          role: 'OWNER',
          businessId: business.id,
          isActive: true,
          emailVerified: true,
        },
      })
      
      console.log(`\n✅ Created new user:`)
      console.log(`   Email: ${newUser.email}`)
      console.log(`   Business: ${business.id}`)
      console.log(`   Role: ${newUser.role}`)
    }
    
    console.log(`\n✨ You can now login with wallet ${walletAddress}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

linkUserToBusiness()
