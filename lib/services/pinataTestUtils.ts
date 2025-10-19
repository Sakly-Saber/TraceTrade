// Test utility for Pinata IPFS services
// This file demonstrates how to use the Pinata services and can be used for testing

import { uploadImageToPinata, uploadMultipleImagesToPinata, validateFileForUpload } from './pinataImageService'
import { uploadMetadataToPinata, createCommodityMetadata, NFTMetadata, validateMetadata } from './pinataMetadataService'

/**
 * Test image upload functionality
 * @param file - Image file to test
 */
export const testImageUpload = async (file: File) => {
  console.log('🧪 Testing image upload...')
  
  // First validate the file
  const validation = validateFileForUpload(file)
  if (!validation.isValid) {
    console.error('❌ File validation failed:', validation.error)
    return
  }
  
  try {
    console.log('📤 Uploading image to IPFS...')
    const ipfsUrl = await uploadImageToPinata(file)
    console.log('✅ Image uploaded successfully:', ipfsUrl)
    return ipfsUrl
  } catch (error) {
    console.error('❌ Image upload failed:', error)
    throw error
  }
}

/**
 * Test metadata upload functionality
 * @param commodityData - Sample commodity data
 * @param imageUrl - IPFS URL of uploaded image
 */
export const testMetadataUpload = async (commodityData: any, imageUrl: string) => {
  console.log('🧪 Testing metadata upload...')
  
  try {
    // Create metadata
    const metadata: NFTMetadata = createCommodityMetadata(commodityData, imageUrl)
    console.log('📝 Created metadata:', metadata)
    
    // Validate metadata
    const validation = validateMetadata(metadata)
    if (!validation.isValid) {
      console.error('❌ Metadata validation failed:', validation.errors)
      return
    }
    
    // Upload to IPFS
    console.log('📤 Uploading metadata to IPFS...')
    const ipfsHash = await uploadMetadataToPinata(metadata)
    console.log('✅ Metadata uploaded successfully. CID:', ipfsHash)
    
    return ipfsHash
  } catch (error) {
    console.error('❌ Metadata upload failed:', error)
    throw error
  }
}

/**
 * Complete tokenization test workflow
 * @param imageFile - Image file to upload
 * @param commodityData - Commodity information
 */
export const testCompleteTokenizationWorkflow = async (
  imageFile: File,
  commodityData: {
    name: string
    description: string
    category: string
    commodityType: string
    quantity: number
    unit: string
    quality?: string
    location?: string
    certifications?: string[]
  }
) => {
  console.log('🚀 Starting complete tokenization workflow test...')
  
  try {
    // Step 1: Upload image
    console.log('\n1️⃣ Uploading commodity image...')
    const imageUrl = await testImageUpload(imageFile)
    
    if (!imageUrl) {
      throw new Error('Image upload failed - no URL returned')
    }
    
    // Step 2: Create and upload metadata
    console.log('\n2️⃣ Creating and uploading NFT metadata...')
    const metadataCID = await testMetadataUpload(commodityData, imageUrl)
    
    // Step 3: Return results
    const result = {
      imageUrl,
      metadataCID,
      metadataUrl: `https://${process.env.IPFS_GATEWAY || 'amaranth-bitter-falcon-175.mypinata.cloud'}/ipfs/${metadataCID}`
    }
    
    console.log('\n✅ Tokenization workflow completed successfully!')
    console.log('📋 Results:', result)
    
    return result
    
  } catch (error) {
    console.error('\n❌ Tokenization workflow failed:', error)
    throw error
  }
}

/**
 * Sample test data for testing
 */
export const sampleCommodityData = {
  name: "Premium Copper Ore Batch #001",
  description: "High-grade copper ore with 99.8% purity, sourced from certified mines in Nigeria. Perfect for industrial manufacturing and electrical applications.",
  category: "Mining",
  commodityType: "Copper Ore",
  quantity: 50,
  unit: "tonnes",
  quality: "Premium Grade A",
  location: "Lagos, Nigeria",
  certifications: ["ISO 9001", "Environmental Impact Assessment", "Mining License ML-2024-001"]
}

/**
 * Example usage function (for documentation purposes)
 */
export const exampleUsage = () => {
  console.log(`
🎯 Example Usage:

1. Import the services:
   import { testCompleteTokenizationWorkflow, sampleCommodityData } from '@/lib/services/pinataTestUtils'

2. Use in your component:
   const handleTokenize = async (imageFile: File) => {
     try {
       const result = await testCompleteTokenizationWorkflow(imageFile, sampleCommodityData)
       console.log('Tokenization completed:', result)
     } catch (error) {
       console.error('Tokenization failed:', error)
     }
   }

3. The result will contain:
   - imageUrl: IPFS URL of the uploaded image
   - metadataCID: IPFS CID of the metadata
   - metadataUrl: Gateway URL to access the metadata

📝 Environment Variables Required:
   - NEXT_PUBLIC_PINATA_JWT
   - PINATA_API_KEY
   - PINATA_API_SECRET
   - PINATA_GATEWAY_TOKEN
  `)
}