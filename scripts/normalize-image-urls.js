const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function normalizeImageUrls() {
  try {
    console.log('🔄 Normalizing image URLs from ipfs.io to Cloudflare...\n');
    
    const assets = await prisma.nFTAsset.findMany({
      where: {
        imageUrl: {
          contains: 'ipfs.io'
        }
      }
    });
    
    console.log(`📦 Found ${assets.length} assets with ipfs.io URLs\n`);
    
    let updated = 0;
    
    for (const asset of assets) {
      try {
        // Extract CID from ipfs.io URL
        const match = asset.imageUrl.match(/\/ipfs\/([\w]+)/);
        if (!match) continue;
        
        const cid = match[1];
        const newUrl = `https://cloudflare-ipfs.com/ipfs/${cid}`;
        
        console.log(`🔄 ${asset.name}`);
        console.log(`   Old: ${asset.imageUrl}`);
        console.log(`   New: ${newUrl}\n`);
        
        await prisma.nFTAsset.update({
          where: { id: asset.id },
          data: {
            imageUrl: newUrl,
            aiImageCID: cid,
            aiImageUrl: newUrl  // Also populate aiImageUrl with normalized URL
          }
        });
        
        updated++;
        
      } catch (err) {
        console.error(`❌ Error updating ${asset.name}:`, err.message);
      }
    }
    
    console.log(`\n✅ Updated ${updated} assets`);
    
  } catch (err) {
    console.error('❌ Fatal error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

normalizeImageUrls();
