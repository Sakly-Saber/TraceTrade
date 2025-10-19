/**
 * NFT Migration Service
 * Handles importing NFTs from wallet with their IPFS metadata to database
 */

import { prisma } from '@/lib/prisma'
import { normalizeIpfsUrl } from '@/lib/utils'
import type { EnrichedNFT } from './richNFTService'

interface MigrationResult {
  success: boolean
  tokensProcessed: number
  assetsCreated: number
  assetsUpdated: number
  errors: Array<{ tokenId: string; serialNumber: number; error: string }>
}

/**
 * Migrate a single NFT from wallet to database with IPFS metadata
 */
export async function migrateNFTToDatabase(
  nft: EnrichedNFT,
  sellerWalletAddress: string,
  sellerId: string
): Promise<{ success: boolean; assetId?: string; error?: string }> {
  try {
    // Ensure owner (Business) exists
    let owner = await prisma.business.findUnique({
      where: { id: sellerId }
    })

    if (!owner) {
      owner = await prisma.business.create({
        data: {
          id: sellerId,
          name: `Seller ${sellerWalletAddress.slice(0, 10)}`,
          email: `${sellerWalletAddress.replace(/\./g, '_')}@hedera.network`,
          phone: '000-000-0000',
          address: 'Unknown',
          city: 'Unknown',
          state: 'Unknown',
          country: 'Africa',
          businessType: 'SOLE_PROPRIETORSHIP',
          industry: 'OTHER',
          walletAddress: sellerWalletAddress
        }
      })
    }

    // Ensure collection exists
    let collection = await prisma.nFTCollection.findFirst({
      where: { tokenId: nft.tokenId }
    })

    if (!collection) {
      collection = await prisma.nFTCollection.create({
        data: {
          name: nft.symbol || `Collection ${nft.tokenId}`,
          description: `NFT collection ${nft.tokenId}`,
          symbol: nft.symbol || 'NFT',
          tokenId: nft.tokenId,
          maxSupply: 1000,
          category: 'OTHER',
          assetType: 'General NFT',
          createdBy: sellerWalletAddress,
          businessId: owner.id
        }
      })
    }

    // Check if NFT asset already exists
    let nftAsset = await prisma.nFTAsset.findFirst({
      where: {
        tokenId: nft.tokenId,
        serialNumber: nft.serialNumber
      }
    })

    // Normalize image URL from wallet
    const normalizedImageUrl = nft.image ? normalizeIpfsUrl(null, nft.image) : null

    // Extract CID intelligently from various URL formats
    let extractedCID: string | null = null
    
    if (nft.image) {
      // Try to extract CID from gateway URLs like:
      // - https://amaranth-bitter-falcon-175.mypinata.cloud/ipfs/QmXXX
      // - https://cloudflare-ipfs.com/ipfs/QmXXX
      // - ipfs://QmXXX
      if (nft.image.includes('/ipfs/')) {
        const cidMatch = nft.image.split('/ipfs/')[1]?.split(':')[0]?.split('?')[0]
        if (cidMatch) {
          extractedCID = cidMatch
          console.log(`   📌 Extracted CID from image URL: ${extractedCID}`)
        }
      }
    }

    // Also try to extract from metadata URI if available
    if (!extractedCID && nft.metadataUri) {
      if (nft.metadataUri.includes('/ipfs/')) {
        const cidMatch = nft.metadataUri.split('/ipfs/')[1]?.split(':')[0]?.split('?')[0]
        if (cidMatch) {
          extractedCID = cidMatch
          console.log(`   📌 Extracted CID from metadata URI: ${extractedCID}`)
        }
      } else {
        // Assume it's a raw CID
        const parts = nft.metadataUri.split('/')
        const lastPart = parts[parts.length - 1]
        if (lastPart && (lastPart.startsWith('Qm') || lastPart.startsWith('bafk'))) {
          extractedCID = lastPart
          console.log(`   📌 Extracted CID from metadata URI path: ${extractedCID}`)
        }
      }
    }

    if (!nftAsset) {
      // Create new NFT asset
      nftAsset = await prisma.nFTAsset.create({
        data: {
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          name: nft.name || `NFT #${nft.serialNumber}`,
          description: nft.description || '',
          imageUrl: normalizedImageUrl || nft.image || null,
          aiImageUrl: nft.image || null,
          aiImageCID: extractedCID || null,
          metadataUri: nft.metadataUri || null,
          ownerId: owner.id,
          collectionId: collection.id,
          assetData: JSON.stringify({
            name: nft.name,
            description: nft.description,
            image: nft.image,
            attributes: nft.attributes,
            symbol: nft.symbol,
            metadataUri: nft.metadataUri
          }),
          createdBy: sellerWalletAddress,
          status: 'MINTED'
        }
      })

      console.log(
        `✅ [NFT MIGRATION] Created asset for ${nft.tokenId}#${nft.serialNumber}: ${nftAsset.id}`
      )

      return { success: true, assetId: nftAsset.id }
    } else {
      // Update existing asset if missing image data
      const hasImageData = normalizedImageUrl || nft.image || extractedCID || nft.metadataUri
      const needsUpdate =
        hasImageData &&
        (!nftAsset.imageUrl || !nftAsset.aiImageUrl || !nftAsset.aiImageCID || !nftAsset.metadataUri)

      if (needsUpdate) {
        nftAsset = await prisma.nFTAsset.update({
          where: { id: nftAsset.id },
          data: {
            imageUrl: nftAsset.imageUrl || normalizedImageUrl || nft.image || undefined,
            aiImageUrl: nftAsset.aiImageUrl || nft.image || undefined,
            aiImageCID: nftAsset.aiImageCID || extractedCID || undefined,
            metadataUri: nftAsset.metadataUri || nft.metadataUri || undefined
          }
        })

        console.log(
          `🔧 [NFT MIGRATION] Updated asset for ${nft.tokenId}#${nft.serialNumber} with image data`
        )

        return { success: true, assetId: nftAsset.id }
      }

      console.log(`ℹ️ [NFT MIGRATION] Asset already exists and has image data: ${nft.tokenId}#${nft.serialNumber}`)
      return { success: true, assetId: nftAsset.id }
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error)
    console.error(
      `❌ [NFT MIGRATION] Error migrating ${nft.tokenId}#${nft.serialNumber}: ${err}`
    )
    return { success: false, error: err }
  }
}

/**
 * Batch migrate multiple NFTs from wallet to database
 */
export async function migrateNFTsToDatabase(
  nfts: EnrichedNFT[],
  sellerWalletAddress: string,
  sellerId: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    tokensProcessed: 0,
    assetsCreated: 0,
    assetsUpdated: 0,
    errors: []
  }

  console.log(
    `🚀 [NFT MIGRATION] Starting migration of ${nfts.length} NFTs for ${sellerWalletAddress}`
  )

  for (const nft of nfts) {
    const migrationResult = await migrateNFTToDatabase(nft, sellerWalletAddress, sellerId)

    if (migrationResult.success) {
      result.tokensProcessed++
      // We can't distinguish between created/updated from this function, so just count as processed
      result.assetsCreated++
    } else {
      result.success = false
      result.errors.push({
        tokenId: nft.tokenId,
        serialNumber: nft.serialNumber,
        error: migrationResult.error || 'Unknown error'
      })
    }
  }

  console.log(
    `✅ [NFT MIGRATION] Migration complete! Processed: ${result.tokensProcessed}, Errors: ${result.errors.length}`
  )

  return result
}
