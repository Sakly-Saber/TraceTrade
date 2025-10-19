import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      collectionId, 
      tokenId, 
      name, 
      treasuryId, 
      createdBy, 
      adminKey, 
      supplyKey,
      description,
      securityModel
    } = body;

    console.log('💾 Storing NFT collection with keys:', { 
      collectionId, 
      tokenId, 
      name, 
      treasuryId,
      securityModel: securityModel || 'CLIENT_SIDE_KEYS',
      hasAdminKey: !!adminKey,
      hasSupplyKey: !!supplyKey
    });

    if (!collectionId || !tokenId || !name || !treasuryId || !createdBy) {
      return NextResponse.json(
        { error: 'Required fields missing: collectionId, tokenId, name, treasuryId, createdBy' },
        { status: 400 }
      );
    }

    // Find or create a business for this user (we'll need this for the foreign key)
    let business;
    try {
      // First try to find existing business associated with this wallet
      const user = await prisma.user.findFirst({
        where: { walletAddress: createdBy },
        include: { business: true }
      });

      if (user && user.business) {
        business = user.business;
        console.log('✅ Using existing business for user');
      } else {
        // Create a business if none exists
        business = await prisma.business.create({
          data: {
            name: `Business for ${createdBy}`,
            description: 'Auto-created business for NFT collection',
            email: `${createdBy}@example.com`,
            phone: 'N/A',
            address: 'N/A',
            city: 'N/A',
            state: 'N/A',
            country: 'Nigeria',
            website: 'N/A',
            businessType: 'SOLE_PROPRIETORSHIP',
            industry: 'TECHNOLOGY',
            walletAddress: createdBy,
            walletType: 'HASHCONNECT',
            isVerified: false,
            status: 'ACTIVE'
          }
        });

        // Create or update user with business association
        await prisma.user.upsert({
          where: { walletAddress: createdBy },
          update: { businessId: business.id },
          create: {
            walletAddress: createdBy,
            businessId: business.id,
            displayName: `User ${createdBy.slice(-8)}`,
            walletType: 'HASHCONNECT'
          }
        });

        console.log('✅ Created new business and user association');
      }
    } catch (businessError) {
      console.error('❌ Error handling business/user association:', businessError);
      return NextResponse.json(
        { error: 'Failed to create business association' },
        { status: 500 }
      );
    }

    // Store the NFT collection with keys
    const nftCollection = await prisma.nFTCollection.upsert({
      where: { id: collectionId },
      update: {
        tokenId: tokenId,
        name: name,
        description: description || '',
        treasuryId: treasuryId,
        adminKey: adminKey, // Store key for admin operations
        supplyKey: supplyKey, // Store key for minting
        createdBy: createdBy,
        supplyKeyDisplayed: false, // Key not yet shown to user
        updatedAt: new Date()
      },
      create: {
        id: collectionId,
        tokenId: tokenId,
        name: name,
        symbol: name.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, ''), // Generate symbol from name
        description: description || '',
        category: 'INDUSTRIAL', // Default category
        assetType: 'Generic Asset', // Default asset type
        treasuryId: treasuryId,
        adminKey: adminKey, // Store key for admin operations
        supplyKey: supplyKey, // Store key for minting
        createdBy: createdBy,
        supplyKeyDisplayed: false, // Key not yet shown to user
        businessId: business.id,
        currentSupply: 0,
        status: 'ACTIVE'
      }
    });

    console.log('✅ NFT collection stored successfully:', nftCollection.id);
    
    return NextResponse.json({
      success: true,
      collection: {
        id: nftCollection.id,
        tokenId: nftCollection.tokenId,
        name: nftCollection.name,
        treasuryId: nftCollection.treasuryId,
        hasKeys: !!(nftCollection.adminKey && nftCollection.supplyKey)
      }
    });

  } catch (error) {
    console.error('❌ Error storing NFT collection:', error);
    return NextResponse.json(
      { error: 'Failed to store NFT collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}