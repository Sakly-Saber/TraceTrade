#!/usr/bin/env node

/**
 * Direct Database Query to show marketplace listings
 * Shows exactly what the API will return to the frontend
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showMarketplaceListings() {
  console.log('\n📊 Marketplace Listings (As API Will Return Them)\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const listings = await prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      include: {
        nftAsset: {
          include: {
            collection: true,
            owner: true
          }
        },
        sellerBusiness: {
          select: {
            name: true,
            isVerified: true,
            country: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Found ${listings.length} active marketplace listings\n`);

    for (let i = 0; i < Math.min(3, listings.length); i++) {
      const listing = listings[i];
      const nft = listing.nftAsset;

      console.log(`${i + 1}. ${nft.name}`);
      console.log(`   Token: ${nft.tokenId}#${nft.serialNumber}`);
      console.log(`   Price: ${listing.priceHbar} ℏ`);
      console.log(`   Seller: ${listing.sellerBusiness?.name || 'Unknown'}`);
      console.log(`   Image URL: ${nft.imageUrl}`);
      console.log(`   Status: ${nft.imageUrl?.includes('cloudflare-ipfs.com') ? '✅ Cloudflare' : '❌ Other gateway'}`);
      
      if (nft.aiImageCID) {
        console.log(`   ✅ CID available: ${nft.aiImageCID.substring(0, 20)}...`);
      } else {
        console.log(`   ❌ CID missing`);
      }

      if (nft.collection) {
        console.log(`   Collection: ${nft.collection.name}`);
      }
      console.log();
    }

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🎉 Summary:');
    console.log(`   Total active listings: ${listings.length}`);
    
    const cloudflareCount = listings.filter(l => l.nftAsset.imageUrl?.includes('cloudflare-ipfs.com')).length;
    const noImageCount = listings.filter(l => !l.nftAsset.imageUrl).length;
    
    console.log(`   Using Cloudflare: ${cloudflareCount}`);
    console.log(`   Missing image URL: ${noImageCount}`);
    console.log('\n✅ Ready for marketplace display!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showMarketplaceListings();
