// NFT Collection and Asset Types for Database Integration

export interface NFTCollectionConfig {
  name: string
  symbol: string
  description?: string
  category: string
  assetType: string
  maxSupply?: number
  businessId: string
  createdBy: string
}

export interface NFTAssetConfig {
  name: string
  description: string
  collectionId: string
  assetData: any
  price?: number  // Asset price in USD
  country?: string  // Country where asset is located
  quantity?: number
  unit?: string
  quality?: string
  location?: string
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

export interface NFTCollectionResult {
  success: boolean
  collection?: any
  error?: string
}

export interface NFTAssetResult {
  success: boolean
  asset?: any
  serialNumber?: number
  error?: string
}

export interface UserResult {
  success: boolean
  user?: any
  error?: string
}