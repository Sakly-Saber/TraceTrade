"use client"

// Client-side NFT Collection Service
// This service calls the server-side API routes for database operations

import { NFTCollectionConfig, NFTAssetConfig } from '@/lib/types/nftTypes'

export async function getOrCreateNFTCollection(config: NFTCollectionConfig) {
  try {
    const response = await fetch('/api/nft-collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getOrCreateCollection',
        ...config
      })
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Client: Failed to get/create NFT collection:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getOrCreateUser(walletAddress: string, businessId?: string) {
  try {
    console.log('🌐 Making API request to /api/nft-collections...')
    const response = await fetch('/api/nft-collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getOrCreateUser',
        walletAddress,
        businessId
      })
    })

    console.log('🌐 API response status:', response.status)
    console.log('🌐 API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API request failed:', response.status, errorText)
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text()
      console.error('❌ Expected JSON but got:', contentType, responseText.substring(0, 200))
      throw new Error(`Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 200)}`)
    }

    const result = await response.json()
    console.log('✅ Parsed JSON result:', result)
    return result
  } catch (error) {
    console.error('Client: Failed to get/create user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function createAndMintNFTAsset(config: NFTAssetConfig) {
  try {
    const response = await fetch('/api/nft-collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createAndMintAsset',
        ...config
      })
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Client: Failed to create and mint NFT asset:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}