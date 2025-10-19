import { prisma } from '@/lib/prisma'

// Simple category mapping function
function mapCategoryToEnum(category: string): string {
  const categoryMap: Record<string, string> = {
    'agricultural': 'AGRICULTURAL',
    'mining': 'MINING',
    'industrial': 'INDUSTRIAL',
    'energy': 'ENERGY',
    'technology': 'TECHNOLOGY',
    'real-estate': 'REAL_ESTATE',
    'services': 'SERVICES',
    'other': 'OTHER'
  }
  
  return categoryMap[category.toLowerCase()] || 'OTHER'
}

export interface NFTCollectionConfig {
  name: string
  symbol: string
  description?: string
  category: string
  assetType: string
  maxSupply?: number
  businessId: string
  createdBy: string
}

// Create or get NFT collection
export async function getOrCreateNFTCollection(config: NFTCollectionConfig) {
  try {
    const mappedCategory = mapCategoryToEnum(config.category)

    let collection = await prisma.nFTCollection.findFirst({
      where: {
        businessId: config.businessId,
        assetType: config.assetType,
        status: 'ACTIVE'
      }
    })

    if (collection) {
      return { success: true, collection }
    }

    collection = await prisma.nFTCollection.create({
      data: {
        name: config.name,
        symbol: config.symbol,
        description: config.description,
        category: mappedCategory as any, // Cast to avoid enum type issues
        assetType: config.assetType,
        maxSupply: config.maxSupply || 1000000,
        businessId: config.businessId,
        currentSupply: 0,
        status: 'ACTIVE'
      }
    })

    return { success: true, collection }

  } catch (error) {
    console.error('❌ Failed to create/get NFT collection:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get user assets
export async function getUserAssets(walletAddress: string) {
  try {
    const assets = await prisma.nFTAsset.findMany({
      where: {
        createdBy: walletAddress
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            symbol: true,
            category: true,
            assetType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, assets }
  } catch (error) {
    console.error('❌ Failed to get user assets:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Create or get user record for wallet address
export async function getOrCreateUser(walletAddress: string, businessId?: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    })

    if (user) {
      console.log('✅ Found existing user:', user.id)
      return { success: true, user }
    }

    // If no businessId provided, create a personal business for the user
    if (!businessId) {
      console.log('🏢 Creating personal business for new user...')
      const business = await prisma.business.create({
        data: {
          name: `Personal Business - ${walletAddress.slice(-8)}`,
          email: `${walletAddress.slice(-8)}@personal.local`,
          description: 'Personal business account for tokenization',
          website: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: 'Nigeria',
          postalCode: '',
          industry: 'OTHER',
          businessType: 'SOLE_PROPRIETORSHIP'
        }
      })
      businessId = business.id
      console.log('✅ Created personal business:', business.id)
    }

    user = await prisma.user.create({
      data: {
        walletAddress,
        walletType: 'HASHCONNECT',
        businessId: businessId,
        displayName: `User ${walletAddress.slice(-8)}`
      }
    })

    console.log('✅ Created new user:', user.id)
    return { success: true, user }

  } catch (error) {
    console.error('❌ Failed to create/get user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Create NFT asset in database (placeholder for now)
export async function createAndMintNFTAsset(config: any) {
  try {
    console.log('🎨 Creating NFT asset (placeholder):', config)
    
    // For now, return a mock result
    return {
      success: true,
      tokenId: `0.0.${Date.now()}`,
      serialNumber: 1,
      assetId: `asset-${Date.now()}`,
      transactionId: `tx-${Date.now()}`
    }

  } catch (error) {
    console.error('❌ Failed to create and mint NFT asset:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}