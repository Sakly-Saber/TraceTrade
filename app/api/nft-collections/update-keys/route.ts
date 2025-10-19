import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, tokenId, supplyKey, adminKey, updatedBy } = body;

    console.log('🔑 Updating collection keys:', {
      collectionId,
      tokenId,
      updatedBy,
      hasSupplyKey: !!supplyKey,
      hasAdminKey: !!adminKey
    });

    // Validate required fields
    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    if (!supplyKey || !adminKey) {
      return NextResponse.json(
        { error: 'Both supply key and admin key are required' },
        { status: 400 }
      );
    }

    // Update the NFT collection with the token ID and keys
    const updatedCollection = await prisma.nFTCollection.update({
      where: {
        id: collectionId
      },
      data: {
        tokenId: tokenId,
        supplyKey: supplyKey,
        adminKey: adminKey,
        updatedAt: new Date()
      }
    });

    console.log('✅ Collection keys updated successfully:', updatedCollection.id);

    return NextResponse.json({
      success: true,
      collection: {
        id: updatedCollection.id,
        tokenId: updatedCollection.tokenId,
        name: updatedCollection.name,
        symbol: updatedCollection.symbol,
        hasKeys: true
      }
    });

  } catch (error) {
    console.error('❌ Failed to update collection keys:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update collection keys' },
      { status: 500 }
    );
  }
}