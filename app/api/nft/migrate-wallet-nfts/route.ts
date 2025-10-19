import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIpfsUrl } from '@/lib/utils'
import { getRichNFTInfoForAccount, type EnrichedNFT } from '@/lib/services/richNFTService'

/**
 * Migrate wallet NFTs to database with proper IPFS image handling
 * Extracts image URLs from metadata, normalizes them, and creates NFT assets
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, businessId } = await req.json()

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 [MIGRATE] Starting migration for wallet: ${walletAddress}`)

    // Step 1: Fetch enriched NFT data from wallet
    const enrichedNFTs = await getRichNFTInfoForAccount(walletAddress)
    console.log(`📦 [MIGRATE] Found ${enrichedNFTs.length} NFTs in wallet`)

    if (enrichedNFTs.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No NFTs found in wallet', migratedCount: 0 },
        { status: 200 }
      )
    }

    // Step 2: Get or create business for this wallet
    let business = null
    if (businessId) {
      business = await prisma.business.findUnique({ where: { id: businessId } })
    } else {
      // Try to find business by wallet address
      business = await prisma.business.findFirst({
        where: { walletAddress }
      })
    }

    if (!business) {
      // Create a default business if none exists
      console.log(`👤 [MIGRATE] Creating default business for wallet: ${walletAddress}`)
      business = await prisma.business.create({
        data: {
          name: `Business - ${walletAddress.slice(0, 10)}`,
          walletAddress,
          email: `${walletAddress}@hedera.local`,
          phone: 'N/A',
          address: 'N/A',
          city: 'N/A',
          state: 'N/A',
          businessType: 'SOLE_PROPRIETORSHIP',
          industry: 'OTHER',
          status: 'ACTIVE'
        }
      })
    }

    console.log(`✅ [MIGRATE] Using business: ${business.id} (${business.name})`)

    // Step 3: Process each NFT and create/update NFT assets
    const migratedNFTs = []
    let migratedCount = 0
    let errorCount = 0

    for (const nft of enrichedNFTs) {
      try {
        console.log(`\n📌 [MIGRATE] Processing: ${nft.tokenId}#${nft.serialNumber} (${nft.name})`)

        // Step 3a: Get or create NFT collection for this token
        let collection = await prisma.nFTCollection.findFirst({
          where: { tokenId: nft.tokenId }
        })

        if (!collection) {
          console.log(`   Creating collection for token: ${nft.tokenId}`)
          collection = await prisma.nFTCollection.create({
            data: {
              name: nft.name || `Collection ${nft.tokenId}`,
              symbol: nft.symbol || 'NFT',
              description: nft.description || '',
              tokenId: nft.tokenId,
              category: 'OTHER',
              assetType: 'General NFT',
              businessId: business.id,
              createdBy: walletAddress,
              status: 'ACTIVE'
            }
          })
        }

        // Extract and normalize image URL from metadata
        let normalizedImageUrl = null
        let imageCID = null

        if (nft.image) {
          console.log(`   Raw image URL: ${nft.image}`)

          // Extract CID from the URL
          let cid = null
          if (nft.image.includes('/ipfs/')) {
            cid = nft.image.split('/ipfs/')[1]?.split(':')[0]?.split('?')[0]
            console.log(`   Extracted CID: ${cid}`)
          }

          if (cid) {
            // Normalize to Cloudflare gateway
            normalizedImageUrl = `https://cloudflare-ipfs.com/ipfs/${cid}`
            imageCID = cid
            console.log(`   Normalized URL: ${normalizedImageUrl}`)
          }
        }

        // Check if NFT asset already exists
        const existingAsset = await prisma.nFTAsset.findFirst({
          where: {
            tokenId: nft.tokenId,
            serialNumber: nft.serialNumber
          }
        })

        let nftAsset
        if (existingAsset) {
          // Update existing asset with image data if missing
          console.log(`   Asset exists (${existingAsset.id}), updating image data...`)
          nftAsset = await prisma.nFTAsset.update({
            where: { id: existingAsset.id },
            data: {
              imageUrl: normalizedImageUrl || existingAsset.imageUrl,
              aiImageCID: imageCID || existingAsset.aiImageCID,
              aiImageUrl: normalizedImageUrl || existingAsset.aiImageUrl,
              metadataUri: nft.metadataUri || existingAsset.metadataUri,
              name: nft.name || existingAsset.name,
              description: nft.description || existingAsset.description,
              // Update owner if not set
              ...((!existingAsset.ownerId || existingAsset.ownerId === 'UNASSIGNED') && {
                ownerId: business.id,
                status: 'MINTED'
              })
            }
          })
          console.log(`   ✅ Updated asset: ${nftAsset.id}`)
        } else {
          // Create new NFT asset
          console.log(`   Creating new asset...`)
          nftAsset = await prisma.nFTAsset.create({
            data: {
              tokenId: nft.tokenId,
              serialNumber: nft.serialNumber,
              name: nft.name,
              description: nft.description || '',
              imageUrl: normalizedImageUrl || '',
              aiImageUrl: normalizedImageUrl || '',
              aiImageCID: imageCID || '',
              metadataUri: nft.metadataUri || '',
              ownerId: business.id,
              createdBy: walletAddress,
              collectionId: collection.id,
              status: 'MINTED',
              assetData: JSON.stringify({
                name: nft.name,
                description: nft.description || '',
                image: normalizedImageUrl,
                metadataUri: nft.metadataUri,
                attributes: nft.attributes || []
              })
            }
          })
          console.log(`   ✅ Created asset: ${nftAsset.id}`)
        }

        migratedNFTs.push({
          tokenId: nft.tokenId,
          serialNumber: nft.serialNumber,
          name: nft.name,
          assetId: nftAsset.id,
          imageUrl: normalizedImageUrl,
          imageCID
        })
        migratedCount++
      } catch (error) {
        console.error(`   ❌ Error processing NFT ${nft.tokenId}#${nft.serialNumber}:`, error)
        errorCount++
      }
    }

    console.log(`\n🎉 [MIGRATE] Migration complete: ${migratedCount} succeeded, ${errorCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} NFTs`,
      businessId: business.id,
      businessName: business.name,
      migratedCount,
      errorCount,
      migratedNFTs
    })
  } catch (error) {
    console.error('❌ [MIGRATE] Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Check migration status and list unmigrated NFTs
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Count NFT assets owned by this wallet's business
    const business = await prisma.business.findFirst({
      where: { walletAddress }
    })

    if (!business) {
      return NextResponse.json({
        success: true,
        migratedCount: 0,
        unmigratedCount: 0,
        message: 'No business found for wallet'
      })
    }

    const migratedAssets = await prisma.nFTAsset.count({
      where: { ownerId: business.id }
    })

    // Fetch wallet NFTs to see if there are unmigrated ones
    const walletNFTs = await getRichNFTInfoForAccount(walletAddress)

    const unmigratedCount = walletNFTs.length - migratedAssets

    return NextResponse.json({
      success: true,
      walletAddress,
      businessId: business.id,
      businessName: business.name,
      totalWalletNFTs: walletNFTs.length,
      migratedCount: migratedAssets,
      unmigratedCount: Math.max(0, unmigratedCount)
    })
  } catch (error) {
    console.error('❌ [MIGRATE STATUS] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
