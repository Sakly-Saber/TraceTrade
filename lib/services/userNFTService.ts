import { prisma } from '@/lib/prisma'

export interface UserNFTAsset {
  id: string
  name: string
  description: string
  tokenId: string | null
  serialNumber: number
  imageUrl: string | null
  aiImageUrl: string | null
  status: string
  currentPrice: number | null
  collection: {
    id: string
    name: string
    symbol: string
    category: string
    assetType: string
  }
  createdAt: Date
  updatedAt: Date
}

export async function getUserNFTAssets(walletAddress: string): Promise<UserNFTAsset[]> {
  try {
    console.log('📦 Fetching NFT assets for wallet:', walletAddress)
    
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

    console.log('✅ Found NFT assets:', assets.length)
    return assets as UserNFTAsset[]

  } catch (error) {
    console.error('❌ Failed to fetch user NFT assets:', error)
    return []
  }
}

export async function getAllNFTAssets(): Promise<UserNFTAsset[]> {
  try {
    console.log('📦 Fetching all NFT assets...')
    
    const assets = await prisma.nFTAsset.findMany({
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
      },
      take: 20 // Limit to latest 20 assets
    })

    console.log('✅ Found total NFT assets:', assets.length)
    return assets as UserNFTAsset[]

  } catch (error) {
    console.error('❌ Failed to fetch all NFT assets:', error)
    return []
  }
}