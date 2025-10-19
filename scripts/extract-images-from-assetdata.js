/**
 * Extract image URLs from assetData JSON and populate imageUrl/aiImageCID fields
 * This fixes the issue where images are stored in assetData but not in the dedicated fields
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function extractImagesFromAssetData() {
  try {
    console.log('🔍 Fetching all NFT assets...');
    const assets = await prisma.nFTAsset.findMany();
    
    console.log(`📦 Found ${assets.length} NFT assets\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const asset of assets) {
      try {
        // Check if imageUrl is already populated
        if (asset.imageUrl && asset.aiImageCID) {
          console.log(`⏭️  Skipping ${asset.name} - already has images`);
          skipped++;
          continue;
        }
        
        // Try to extract from assetData
        let imageUrl = null;
        let aiImageCID = null;
        
        if (asset.assetData && typeof asset.assetData === 'object') {
          const data = asset.assetData;
          
          // Try different possible field names for image URL
          const possibleImageFields = ['url', 'image', 'imageUrl', 'image_url', 'ipfs_url', 'metadataImage'];
          for (const field of possibleImageFields) {
            if (data[field]) {
              imageUrl = data[field];
              console.log(`✅ Found image in assetData.${field}: ${imageUrl}`);
              break;
            }
          }
          
          // Extract CID from image URL if found
          if (imageUrl) {
            if (imageUrl.includes('/ipfs/')) {
              aiImageCID = imageUrl.split('/ipfs/')[1]?.split(':')[0]?.split('?')[0];
            } else if (imageUrl.startsWith('ipfs://')) {
              aiImageCID = imageUrl.replace('ipfs://', '').replace(/^ipfs\//, '');
            }
          }
        }
        
        if (imageUrl || aiImageCID) {
          console.log(`🔄 Updating ${asset.name}...`);
          console.log(`   imageUrl: ${imageUrl}`);
          console.log(`   aiImageCID: ${aiImageCID}\n`);
          
          await prisma.nFTAsset.update({
            where: { id: asset.id },
            data: {
              imageUrl: imageUrl,
              aiImageCID: aiImageCID,
              // Also try to normalize the URL to use Cloudflare
              aiImageUrl: imageUrl ? normalizeIpfsUrl(aiImageCID, imageUrl) : null
            }
          });
          
          updated++;
        } else {
          console.log(`⚠️  No image found for ${asset.name}\n`);
          skipped++;
        }
        
      } catch (err) {
        console.error(`❌ Error processing ${asset.name}:`, err.message);
      }
    }
    
    console.log(`\n📊 RESULTS:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   Total: ${updated + skipped}`);
    
  } catch (err) {
    console.error('❌ Fatal error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Normalize IPFS references to an HTTP gateway URL
 */
function normalizeIpfsUrl(cid, url) {
  const gateway = 'cloudflare-ipfs.com';
  
  if (url && url.includes('/ipfs/')) {
    const hash = url.split('/ipfs/')[1]?.split(':')[0]?.split('?')[0];
    if (hash) return `https://${gateway}/ipfs/${hash}`;
  }
  
  if (url && url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '').replace(/^ipfs\//, '');
    return `https://${gateway}/ipfs/${hash}`;
  }
  
  if (cid) return `https://${gateway}/ipfs/${cid}`;
  
  return url || null;
}

extractImagesFromAssetData();
