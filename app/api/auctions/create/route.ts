import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIpfsUrl } from '@/lib/utils'
import { migrateNFTToDatabase } from '@/lib/services/nftMigrationService'
import { getRichNFTInfoForAccount } from '@/lib/services/richNFTService'

// POST - Create auction for NFT
export async function POST(req: NextRequest) {
  try {
    const { 
      tokenId, 
      serialNumber, 
      seller, 
      ownerId, 
      collectionId, 
      nftData,
      auctionName,
      startingBid,
      reservePrice,
      durationHours,
      walletAddress
    } = await req.json()

    console.log('⚡ [AUCTION CREATE] Request data:', { 
      tokenId, 
      serialNumber, 
      seller, 
      auctionName,
      startingBid,
      durationHours
    })

    // Validate required fields
    if (!tokenId || typeof serialNumber !== 'number' || !seller || !auctionName || !startingBid || !durationHours) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If walletAddress is provided, migrate NFT from wallet first
    if (walletAddress) {
      console.log(`📥 [AUCTION CREATE] Wallet provided, migrating NFT first...`)
      try {
        const walletNFTs = await getRichNFTInfoForAccount(walletAddress)
        const nft = walletNFTs.find((n) => n.tokenId === tokenId && n.serialNumber === serialNumber)
        
        if (nft) {
          console.log(`📦 [AUCTION CREATE] Found NFT in wallet: ${nft.name}`)
          console.log(`   Image: ${nft.image}`)
          await migrateNFTToDatabase(nft, walletAddress, ownerId)
          console.log(`✅ [AUCTION CREATE] NFT auto-migrated with IPFS data`)
        }
      } catch (e) {
        console.warn(`⚠️ [AUCTION CREATE] Failed to auto-migrate NFT:`, e)
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

    console.log('🔍 [AUCTION CREATE] Existing NFT:', nftAsset ? 'Found' : 'Not found')

    // If NFT doesn't exist, create it (same logic as marketplace)
    if (!nftAsset) {
      if (!ownerId || !collectionId) {
        return NextResponse.json(
          { success: false, error: 'NFT not found. Please provide ownerId and collectionId.' },
          { status: 404 }
        )
      }

      // Create Business if not exists
      let owner = await prisma.business.findUnique({
        where: { id: ownerId }
      })

      if (!owner) {
        console.log('🏢 [AUCTION CREATE] Creating business owner')
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
      }

      // Create Collection if not exists
      let collection = await prisma.nFTCollection.findFirst({
        where: { tokenId: collectionId }
      })

      if (!collection) {
        console.log('📦 [AUCTION CREATE] Creating collection')
        collection = await prisma.nFTCollection.create({
          data: {
            name: nftData?.symbol || `Collection ${collectionId}`,
            description: 'Auto-created collection for auction',
            symbol: nftData?.symbol || 'NFT',
            tokenId: collectionId,
            maxSupply: 1000,
            category: 'OTHER',
            assetType: 'General NFT',
            createdBy: seller,
            businessId: owner.id
          }
        })
      }

      // Create NFT Asset
      console.log('✨ [AUCTION CREATE] Creating NFT asset')
      const normalizedImage = normalizeIpfsUrl(nftData?.aiImageCID || nftData?.imageCid, nftData?.imageUrl || nftData?.aiImageUrl)
      nftAsset = await prisma.nFTAsset.create({
        data: {
          tokenId,
          serialNumber,
          name: nftData?.name || `NFT #${serialNumber}`,
          description: nftData?.description || '',
          imageUrl: normalizedImage || nftData?.imageUrl || '',
          aiImageUrl: nftData?.aiImageUrl || null,
          aiImageCID: nftData?.aiImageCID || null,
          metadataUri: nftData?.metadataUri || null,
          ownerId: owner.id,
          collectionId: collection.id,
          assetData: JSON.stringify(nftData || {}),
          createdBy: seller,
          status: 'MINTED'
        }
      })

    } else {
      // If asset exists, attempt to patch missing ipfs/image/metadata fields
      const hasImageData = nftData?.imageUrl || nftData?.aiImageUrl || nftData?.aiImageCID || nftData?.metadataUri
      const needsUpdate = hasImageData && (!nftAsset.imageUrl || !nftAsset.aiImageUrl || !nftAsset.aiImageCID || !nftAsset.metadataUri)
      
      if (needsUpdate) {
        try {
          const normalizedImage = normalizeIpfsUrl(nftData?.aiImageCID || nftData?.imageCid, nftData?.imageUrl || nftData?.aiImageUrl)
          console.log('🔧 [AUCTION CREATE] Patching existing NFT asset with image data')
          
          await prisma.nFTAsset.update({
            where: { id: nftAsset.id },
            data: {
              imageUrl: nftAsset.imageUrl || normalizedImage || nftData?.imageUrl || undefined,
              aiImageUrl: nftAsset.aiImageUrl || nftData?.aiImageUrl || nftData?.imageUrl || undefined,
              aiImageCID: nftAsset.aiImageCID || nftData?.aiImageCID || undefined,
              metadataUri: nftAsset.metadataUri || nftData?.metadataUri || undefined
            }
          })
          console.log('✅ [AUCTION CREATE] Patched NFT asset with image/CID/metadata')
        } catch (e) {
          console.warn('⚠️ [AUCTION CREATE] Failed to patch nft asset image fields:', e)
        }
      }
    }

    // Check if already in active auction
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
        { success: false, error: 'NFT is already in an active auction' },
        { status: 400 }
      )
    }

    // Check if listed on marketplace
    const existingListing = await prisma.marketplaceListing.findFirst({
      where: {
        nftAssetId: nftAsset.id,
        status: 'ACTIVE'
      }
    })

    if (existingListing) {
      return NextResponse.json(
        { success: false, error: 'NFT is currently listed on marketplace. Please remove it first.' },
        { status: 400 }
      )
    }

    // Calculate end time
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)

    // Get or create business user for createdById
    const userEmail = `${seller.replace(/\./g, '_')}@hedera.network`
    let businessUser = await prisma.businessUser.findFirst({
      where: { 
        OR: [
          { businessId: nftAsset.ownerId },
          { email: userEmail }
        ]
      }
    })

    if (!businessUser) {
      console.log('👤 [AUCTION CREATE] Creating business user')
      businessUser = await prisma.businessUser.create({
        data: {
          firstName: 'User',
          lastName: seller.slice(0, 10),
          email: userEmail,
          businessId: nftAsset.ownerId,
          role: 'OWNER',
          isActive: true
        }
      })
    } else if (businessUser.businessId !== nftAsset.ownerId) {
      // User exists but for different business, update it
      console.log('🔄 [AUCTION CREATE] Updating existing business user')
      businessUser = await prisma.businessUser.update({
        where: { id: businessUser.id },
        data: { businessId: nftAsset.ownerId }
      })
    }

    console.log('📋 [AUCTION CREATE] Creating auction')
    // Create auction
    const auction = await prisma.auction.create({
      data: {
        title: auctionName,
        description: nftData?.description || `Auction for ${nftData?.name || 'NFT'}`,
        category: 'OTHER',
        commodityType: 'NFT',
        quantity: 1,
        unit: 'piece',
        location: 'Digital',
        reservePrice: reservePrice ? parseFloat(reservePrice.toString()) : parseFloat(startingBid.toString()),
        currentBid: 0,
        currency: 'HBAR',
        startTime,
        endTime,
        tokenId,
        nftContract: tokenId,
        metadataUri: nftData?.metadataUri,
        status: 'ACTIVE',
        businessId: nftAsset.ownerId,
        createdById: businessUser.id,
        nftAssets: {
          connect: [{ id: nftAsset.id }]
        }
      },
      include: {
        nftAssets: true,
        business: {
          select: {
            id: true,
            name: true,
            isVerified: true
          }
        }
      }
    })

    // Update NFT status to LISTED (will use IN_AUCTION after Prisma regeneration)
    await prisma.nFTAsset.update({
      where: { id: nftAsset.id },
      data: { 
        status: 'LISTED', // TODO: Change to IN_AUCTION after prisma generate
        auctionId: auction.id
      }
    })

    console.log('🎉 [AUCTION CREATE] Auction created successfully:', auction.id)

    return NextResponse.json({
      success: true,
      auction,
      message: 'Auction created successfully'
    })

  } catch (error: any) {
    console.error('❌ [AUCTION CREATE] Error:', error)
    console.error('❌ [AUCTION CREATE] Error stack:', error.stack)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create auction',
        message: error.message
      },
      { status: 500 }
    )
  }
}
