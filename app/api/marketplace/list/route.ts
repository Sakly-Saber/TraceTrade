import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIpfsUrl } from '@/lib/utils'
import { migrateNFTToDatabase } from '@/lib/services/nftMigrationService'
import { getRichNFTInfoForAccount } from '@/lib/services/richNFTService'

// POST - List NFT on marketplace
export async function POST(req: NextRequest) {
  try {
    const { tokenId, serialNumber, priceHbar, seller, ownerId, collectionId, nftData, walletAddress, status } = await req.json()

    console.log('📝 [MARKETPLACE LIST] Request data:', { tokenId, serialNumber, priceHbar, seller, ownerId, collectionId, status })

    // Validate required fields
    if (!tokenId || typeof serialNumber !== 'number' || !priceHbar || !seller) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tokenId, serialNumber, priceHbar, seller' },
        { status: 400 }
      )
    }

    // Default to PENDING status (awaiting allowance)
    const listingStatus = status || 'PENDING'

    // If walletAddress is provided, migrate NFT from wallet first
    if (walletAddress) {
      console.log(`📥 [MARKETPLACE LIST] Wallet provided, migrating NFT first...`)
      try {
        const walletNFTs = await getRichNFTInfoForAccount(walletAddress)
        const nft = walletNFTs.find((n) => n.tokenId === tokenId && n.serialNumber === serialNumber)
        
        if (nft) {
          console.log(`📦 [MARKETPLACE LIST] Found NFT in wallet: ${nft.name}`)
          console.log(`   Image: ${nft.image}`)
          await migrateNFTToDatabase(nft, walletAddress, ownerId)
          console.log(`✅ [MARKETPLACE LIST] NFT auto-migrated with IPFS data`)
        }
      } catch (e) {
        console.warn(`⚠️ [MARKETPLACE LIST] Failed to auto-migrate NFT:`, e)
        // Continue anyway - let existing logic handle it
      }
    }

    // Check if NFT asset exists in database
    let nftAsset = await prisma.nFTAsset.findFirst({
      where: {
        tokenId,
        serialNumber
      }
    })

    console.log('🔍 [MARKETPLACE LIST] Existing NFT:', nftAsset ? 'Found' : 'Not found')

  // If NFT doesn't exist, create it
    if (!nftAsset) {
      if (!ownerId || !collectionId) {
        return NextResponse.json(
          { success: false, error: 'NFT not found in database. Please provide ownerId and collectionId to create it.' },
          { status: 404 }
        )
      }

      // STEP 1: Check if owner (Business) exists, create if not
      let owner = await prisma.business.findUnique({
        where: { id: ownerId }
      })

      if (!owner) {
        console.log('🏢 [MARKETPLACE LIST] Creating new business owner:', ownerId)
        // Create a basic business entity for this wallet
        owner = await prisma.business.create({
          data: {
            id: ownerId,
            name: `Seller ${seller.slice(0, 10)}`,
            email: `${seller.replace(/\./g, '_')}@hedera.network`,
            phone: '000-000-0000',
            address: 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            country: 'Africa',
            businessType: 'SOLE_PROPRIETORSHIP',
            industry: 'OTHER',
            walletAddress: seller
          }
        })
        console.log('✅ [MARKETPLACE LIST] Business owner created:', owner.id)
      }

      // STEP 2: Check if collection exists, create if not (NOW with valid businessId)
      let collection = await prisma.nFTCollection.findFirst({
        where: { tokenId: collectionId }
      })

      if (!collection) {
        console.log('📦 [MARKETPLACE LIST] Creating new collection:', collectionId)
        // Create a basic collection
        collection = await prisma.nFTCollection.create({
          data: {
            name: nftData?.symbol || `Collection ${collectionId}`,
            description: 'Auto-created collection for marketplace listing',
            symbol: nftData?.symbol || 'NFT',
            tokenId: collectionId,
            maxSupply: 1000,
            category: 'OTHER',
            assetType: 'General NFT',
            createdBy: seller,
            businessId: owner.id  // Now owner exists!
          }
        })
        console.log('✅ [MARKETPLACE LIST] Collection created:', collection.id)
      }

      console.log('✨ [MARKETPLACE LIST] Creating new NFT asset')

      // DO NOT normalize - store EXACT URL from wallet (Pinata)
      console.log('📸 [MARKETPLACE LIST] Storing EXACT image URL:', nftData?.imageUrl)
      console.log('📸 [MARKETPLACE LIST] Extracted CID:', nftData?.aiImageCID)

      nftAsset = await prisma.nFTAsset.create({
        data: {
          tokenId,
          serialNumber,
          name: nftData?.name || `NFT #${serialNumber}`,
          description: nftData?.description || '',
          imageUrl: nftData?.imageUrl || '', // EXACT Pinata URL from wallet
          aiImageUrl: nftData?.aiImageUrl || nftData?.imageUrl || '', // EXACT URL
          aiImageCID: nftData?.aiImageCID || null, // Just the CID
          metadataUri: nftData?.metadataUri || null,
          ownerId: owner.id,
          collectionId: collection.id,
          assetData: JSON.stringify(nftData || {}),
          createdBy: seller,
          status: 'MINTED'
        }
      })
      console.log('✅ [MARKETPLACE LIST] NFT asset created:', nftAsset.id)
    }

    // If nftAsset exists but missing image/CID/metadata fields, try to patch it
    else {
      const hasImageData = nftData?.imageUrl || nftData?.aiImageUrl || nftData?.aiImageCID || nftData?.metadataUri
      const needsUpdate = hasImageData && (!nftAsset.imageUrl || !nftAsset.aiImageUrl || !nftAsset.aiImageCID || !nftAsset.metadataUri)
      
      if (needsUpdate) {
        try {
          console.log('🔧 [MARKETPLACE LIST] Patching existing NFT asset with EXACT image data')
          console.log('� [MARKETPLACE LIST] New imageUrl:', nftData?.imageUrl)
          
          await prisma.nFTAsset.update({
            where: { id: nftAsset.id },
            data: {
              imageUrl: nftAsset.imageUrl || nftData?.imageUrl || '', // EXACT Pinata URL
              aiImageUrl: nftAsset.aiImageUrl || nftData?.aiImageUrl || nftData?.imageUrl || '',
              aiImageCID: nftAsset.aiImageCID || nftData?.aiImageCID || '',
              metadataUri: nftAsset.metadataUri || nftData?.metadataUri || ''
            }
          })
          console.log('✅ [MARKETPLACE LIST] Patched NFT asset with EXACT URLs')
        } catch (e) {
          console.warn('⚠️ [MARKETPLACE LIST] Failed to patch nft asset image fields:', e)
        }
      }
    }

    // Check if already listed (including all statuses)
    const existingListing = await prisma.marketplaceListing.findFirst({
      where: {
        nftAssetId: nftAsset.id
      }
    })

    if (existingListing) {
      console.log('⚠️ [MARKETPLACE LIST] NFT already has a listing:', existingListing.status)
      
      // If it's active, tell user
      if (existingListing.status === 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: 'NFT is already listed on marketplace', status: existingListing.status },
          { status: 400 }
        )
      }
      
      // If it's sold/cancelled/expired, update the existing listing instead of creating new
      console.log('🔄 [MARKETPLACE LIST] Reactivating existing listing')
      const updatedListing = await prisma.marketplaceListing.update({
        where: { id: existingListing.id },
        data: {
          seller,
          priceHbar,
          status: 'ACTIVE',
          updatedAt: new Date()
        },
        include: {
          nftAsset: true
        }
      })

      // Update NFT asset status to LISTED
      await prisma.nFTAsset.update({
        where: { id: nftAsset.id },
        data: { status: 'LISTED' }
      })

      console.log('🎉 [MARKETPLACE LIST] Listing reactivated!')
      return NextResponse.json({
        success: true,
        listing: updatedListing,
        message: 'NFT successfully relisted on marketplace'
      })
    }

    // Check if in active auction
    const existingAuction = await prisma.auction.findFirst({
      where: {
        nftAssets: {
          some: {
            id: nftAsset.id
          }
        },
        status: 'ACTIVE'
      }
    })

    if (existingAuction) {
      return NextResponse.json(
        { success: false, error: 'NFT is currently in an active auction' },
        { status: 400 }
      )
    }

    // Create marketplace listing
    console.log('📋 [MARKETPLACE LIST] Creating marketplace listing with status:', listingStatus)
    const listing = await prisma.marketplaceListing.create({
      data: {
        nftAssetId: nftAsset.id,
        seller,
        priceHbar,
        status: listingStatus, // Use the provided status (PENDING or ACTIVE)
        allowanceGranted: false // Will be updated when allowance is granted
      },
      include: {
        nftAsset: true
      }
    })
    console.log('✅ [MARKETPLACE LIST] Listing created:', listing.id)

    // Only update NFT asset status to LISTED if listing is ACTIVE
    if (listingStatus === 'ACTIVE') {
      await prisma.nFTAsset.update({
        where: { id: nftAsset.id },
        data: { status: 'LISTED' }
      })
    }

    console.log('🎉 [MARKETPLACE LIST] Success!')
    return NextResponse.json({
      success: true,
      listing,
      message: listingStatus === 'PENDING' 
        ? 'Listing created. Please grant NFT allowance to activate.' 
        : 'NFT successfully listed on marketplace'
    })

  } catch (error: any) {
    console.error('❌ [MARKETPLACE LIST] Error:', error)
    console.error('❌ [MARKETPLACE LIST] Error stack:', error.stack)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list NFT on marketplace',
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    )
  }
}
