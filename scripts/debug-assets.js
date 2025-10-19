const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAssets() {
  try {
    console.log('🔍 Checking first 3 NFT assets...\n');
    
    const assets = await prisma.nFTAsset.findMany({
      take: 3
    });
    
    assets.forEach((asset, idx) => {
      console.log(`\n📦 Asset ${idx + 1}: ${asset.name}`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   imageUrl: ${asset.imageUrl}`);
      console.log(`   aiImageUrl: ${asset.aiImageUrl}`);
      console.log(`   aiImageCID: ${asset.aiImageCID}`);
      console.log(`   metadataUri: ${asset.metadataUri}`);
      console.log(`   assetData type: ${typeof asset.assetData}`);
      
      if (asset.assetData) {
        console.log(`   assetData keys: ${Object.keys(asset.assetData).join(', ')}`);
        console.log(`   assetData: ${JSON.stringify(asset.assetData).substring(0, 200)}...`);
      }
    });
    
    // Also check one with images
    console.log('\n\n🔍 Checking an asset WITH images...\n');
    const withImage = await prisma.nFTAsset.findFirst({
      where: { imageUrl: { not: null } }
    });
    
    if (withImage) {
      console.log(`📦 ${withImage.name}`);
      console.log(`   imageUrl: ${withImage.imageUrl}`);
      console.log(`   aiImageUrl: ${withImage.aiImageUrl}`);
      console.log(`   aiImageCID: ${withImage.aiImageCID}`);
      console.log(`   assetData: ${JSON.stringify(withImage.assetData, null, 2)}`);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

debugAssets();
