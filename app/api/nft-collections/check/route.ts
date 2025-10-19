import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, createdBy } = body;

    console.log('🔍 Checking for existing NFT collection:', { collectionId, createdBy });

    if (!collectionId || !createdBy) {
      return NextResponse.json(
        { error: 'Collection ID and creator are required' },
        { status: 400 }
      );
    }

    // Find existing NFT collection with stored keys
    const existingCollection = await prisma.nFTCollection.findFirst({
      where: {
        id: collectionId,
        treasuryId: createdBy, // Match the wallet that created it
      },
      select: {
        id: true,
        tokenId: true,
        name: true,
        adminKey: true,
        supplyKey: true,
        treasuryId: true,
        createdAt: true,
        businessId: true
      }
    });

    if (existingCollection) {
      console.log('✅ Found existing NFT collection with stored keys');
      return NextResponse.json(existingCollection);
    } else {
      console.log('❌ No existing collection found');
      return NextResponse.json(null);
    }

  } catch (error) {
    console.error('❌ Error checking NFT collection:', error);
    return NextResponse.json(
      { error: 'Failed to check NFT collection' },
      { status: 500 }
    );
  }
}