import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateNFTCollection, getOrCreateUser, createAndMintNFTAsset, NFTCollectionConfig } from '@/lib/services/nftCollectionService'

// Define types locally since they're needed here
interface NFTAssetConfig {
  name: string
  description: string
  collectionId: string
  assetData: any
  quantity?: number
  unit?: string
  quality?: string
  location?: string
  price?: number
  country?: string
  certifications?: string[]
  imageUrl?: string
  aiImageUrl?: string
  aiImageCID?: string
  documentUrls?: string[]
  metadataUri?: string
  metadataHash?: string
  createdBy: string
  ownerId: string
}

// POST /api/nft-collections - Create or get NFT collection
export async function POST(request: NextRequest) {
  try {
    console.log('📨 Received POST request to /api/nft-collections')
    
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    console.log('📨 Request body:', body)
    const { action, ...data } = body

    console.log('🎯 Action:', action)

    switch (action) {
      case 'getOrCreateCollection':
        console.log('📚 Handling getOrCreateCollection...')
        const collectionConfig: NFTCollectionConfig = data
        const collectionResult = await getOrCreateNFTCollection(collectionConfig)
        console.log('📚 Collection result:', collectionResult)
        return NextResponse.json(collectionResult)

      case 'getOrCreateUser':
        console.log('👤 Handling getOrCreateUser...')
        const { walletAddress, businessId } = data
        console.log('👤 Parameters:', { walletAddress, businessId })
        const userResult = await getOrCreateUser(walletAddress, businessId)
        console.log('👤 User result:', userResult)
        return NextResponse.json(userResult)

      case 'createAndMintAsset':
        console.log('🎨 Handling createAndMintAsset...')
        const assetConfig: NFTAssetConfig = data
        const assetResult = await createAndMintNFTAsset(assetConfig)
        console.log('🎨 Asset result:', assetResult)
        return NextResponse.json(assetResult)

      default:
        console.error('❌ Invalid action:', action)
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
