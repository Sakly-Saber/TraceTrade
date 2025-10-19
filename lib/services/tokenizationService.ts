/**
 * Tokenization Service
 * Ensures NFT assets are properly recorded in the database with business and wallet associations
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface TokenizationCheckResult {
  exists: boolean
  hasWalletAssociation: boolean
  asset?: any
  issues: string[]
}

/**
 * Check if an NFT asset is properly recorded in the database
 * @param tokenId - Hedera token ID (e.g., "0.0.123456")
 * @param serialNumber - NFT serial number
 * @returns TokenizationCheckResult with status and details
 */
export async function checkAssetRecorded(
  tokenId: string,
  serialNumber: number
): Promise<TokenizationCheckResult> {
  const issues: string[] = []
  
  try {
    // Find the NFT asset
    const asset = await prisma.nFTAsset.findFirst({
      where: {
        tokenId,
        serialNumber
      },
      include: {
        owner: true
      }
    })

    // Asset doesn't exist
    if (!asset) {
      return {
        exists: false,
        hasWalletAssociation: false,
        issues: ['NFT asset not found in database']
      }
    }

    // Check wallet association
    const hasWalletAssociation = !!asset.ownerId && !!asset.owner
    if (!hasWalletAssociation) {
      issues.push('NFT asset is not associated with a wallet/owner')
    }

    // Check if owner has wallet address
    if (!asset.owner?.walletAddress) {
      issues.push('Owner does not have a wallet address configured')
    }

    return {
      exists: true,
      hasWalletAssociation,
      asset,
      issues
    }

  } catch (error: any) {
    console.error('❌ [TOKENIZATION] Error checking asset:', error)
    return {
      exists: false,
      hasWalletAssociation: false,
      issues: [`Database error: ${error.message}`]
    }
  }
}

/**
 * Ensure an NFT asset is recorded in the database before listing/auctioning
 * @param tokenId - Hedera token ID
 * @param serialNumber - NFT serial number
 * @param data - Asset data to create/update
 * @returns Created or updated asset
 */
export async function ensureAssetRecorded(
  tokenId: string,
  serialNumber: number,
  data: {
    name: string
    description: string
    imageUrl: string
    ownerId: string
    collectionId: string
    assetData: string
    createdBy?: string
  }
): Promise<any> {
  try {
    // Check if asset already exists
    const existing = await prisma.nFTAsset.findFirst({
      where: {
        tokenId,
        serialNumber
      }
    })

    if (existing) {
      console.log(`✅ [TOKENIZATION] Asset ${tokenId}#${serialNumber} already exists`)
      return existing
    }

    // Create new asset record
    const asset = await prisma.nFTAsset.create({
      data: {
        tokenId,
        serialNumber,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        ownerId: data.ownerId,
        collectionId: data.collectionId,
        assetData: data.assetData,
        createdBy: data.createdBy || data.ownerId,
        status: 'MINTED'
      },
      include: {
        owner: true,
        collection: true
      }
    })

    console.log(`✅ [TOKENIZATION] Created asset record for ${tokenId}#${serialNumber}`)
    return asset

  } catch (error: any) {
    console.error('❌ [TOKENIZATION] Error ensuring asset recorded:', error)
    throw new Error(`Failed to record asset in database: ${error.message}`)
  }
}

/**
 * Get all NFT assets for a specific owner
 * @param ownerId - Owner's user ID
 * @returns Array of NFT assets
 */
export async function getAssetsByOwner(ownerId: string): Promise<any[]> {
  try {
    const assets = await prisma.nFTAsset.findMany({
      where: {
        ownerId,
        status: {
          in: ['MINTED', 'LISTED']
        }
      },
      include: {
        owner: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return assets

  } catch (error: any) {
    console.error('❌ [TOKENIZATION] Error fetching assets by owner:', error)
    return []
  }
}

/**
 * Validate an NFT before allowing marketplace listing or auction
 * @param tokenId - Hedera token ID
 * @param serialNumber - NFT serial number
 * @param ownerId - Expected owner ID
 * @returns Validation result
 */
export async function validateNFTForListing(
  tokenId: string,
  serialNumber: number,
  ownerId: string
): Promise<{ valid: boolean; error?: string; asset?: any }> {
  try {
    const result = await checkAssetRecorded(tokenId, serialNumber)

    if (!result.exists) {
      return {
        valid: false,
        error: 'NFT not found in database. Please ensure the NFT is minted and recorded first.'
      }
    }

    if (!result.hasWalletAssociation) {
      return {
        valid: false,
        error: 'NFT is not associated with a wallet. Cannot list for sale.'
      }
    }

    // Verify ownership
    if (result.asset?.ownerId !== ownerId) {
      return {
        valid: false,
        error: 'You are not the owner of this NFT.'
      }
    }

    // Check if already listed
    const existingListing = await prisma.marketplaceListing.findFirst({
      where: {
        nftAssetId: result.asset.id,
        status: 'ACTIVE'
      }
    })

    if (existingListing) {
      return {
        valid: false,
        error: 'NFT is already listed on the marketplace.'
      }
    }

    // Check if in active auction
    const existingAuction = await prisma.auction.findFirst({
      where: {
        nftAssets: {
          some: {
            id: result.asset.id
          }
        },
        status: 'ACTIVE'
      }
    })

    if (existingAuction) {
      return {
        valid: false,
        error: 'NFT is currently in an active auction.'
      }
    }

    return {
      valid: true,
      asset: result.asset
    }

  } catch (error: any) {
    console.error('❌ [TOKENIZATION] Validation error:', error)
    return {
      valid: false,
      error: `Validation failed: ${error.message}`
    }
  }
}
