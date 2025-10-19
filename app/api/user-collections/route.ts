import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('Fetching collections for wallet:', walletAddress);

    // Find the user and their associated business
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        business: {
          include: {
            nftCollections: {
              where: {
                status: 'ACTIVE'
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      }
    });

    if (!user || !user.business) {
      return NextResponse.json({
        collections: [],
        hasCollections: false,
        message: 'No user or business found'
      });
    }

    // Filter collections by the createdBy field (if it exists) or show all for this business
    const collections = user.business.nftCollections.filter(collection => 
      !collection.createdBy || collection.createdBy === walletAddress
    );
    
    // Transform collections to include necessary info for UI
    const collectionsWithInfo = collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      symbol: collection.symbol,
      description: collection.description,
      tokenId: collection.tokenId,
      category: collection.category,
      assetType: collection.assetType,
      currentSupply: collection.currentSupply,
      maxSupply: collection.maxSupply,
      imageUrl: collection.imageUrl,
      hasSupplyKey: !!collection.supplyKey,
      supplyKeyDisplayed: collection.supplyKeyDisplayed,
      createdAt: collection.createdAt,
      status: collection.status
    }));

    return NextResponse.json({
      collections: collectionsWithInfo,
      hasCollections: collections.length > 0,
      totalCollections: collections.length
    });

  } catch (error) {
    console.error('Error fetching user collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user collections' },
      { status: 500 }
    );
  }
}