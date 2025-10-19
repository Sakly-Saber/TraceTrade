import { NextRequest, NextResponse } from 'next/server'
import { getUserNFTAssets, getAllNFTAssets } from '@/lib/services/userNFTService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    
    let assets
    if (walletAddress) {
      console.log('🔍 Fetching NFTs for wallet:', walletAddress)
      assets = await getUserNFTAssets(walletAddress)
    } else {
      console.log('🔍 Fetching all NFTs')
      assets = await getAllNFTAssets()
    }

    return NextResponse.json({ 
      success: true, 
      assets: assets,
      count: assets.length 
    })

  } catch (error) {
    console.error('❌ Failed to fetch NFT assets:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        assets: [],
        count: 0
      },
      { status: 500 }
    )
  }
}