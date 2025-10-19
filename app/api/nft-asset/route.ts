import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AssetStatus } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH /api/nft-asset
export async function PATCH(request: NextRequest) {
  try {
    const { tokenId, serialNumber } = await request.json();
    if (!tokenId || typeof serialNumber !== 'number') {
      return NextResponse.json({ success: false, error: 'Missing tokenId or serialNumber' }, { status: 400 });
    }

    // Find the asset by tokenId and serialNumber
    const asset = await prisma.nFTAsset.findFirst({
      where: { tokenId, serialNumber },
    });
    if (!asset) {
      return NextResponse.json({ success: false, error: 'NFT asset not found' }, { status: 404 });
    }

    // Update asset status to LISTED
    const updated = await prisma.nFTAsset.update({
      where: { id: asset.id },
      data: { status: AssetStatus.LISTED },
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error) {
    console.error('Error listing NFT asset:', error);
    return NextResponse.json({ success: false, error: 'Failed to list NFT asset' }, { status: 500 });
  }
}
