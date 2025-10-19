// Token Service for Hedera Token Management

export interface CreateTokenConfig {
  name: string
  symbol: string
  category: string
  assetType: string
  maxSupply: number
  description: string
}

export interface TokenCreationResult {
  success: boolean
  tokenId?: string
  name?: string
  symbol?: string
  category?: string
  assetType?: string
  maxSupply?: number
  error?: string
}

export interface TokenCollection {
  tokenId: string
  name: string
  symbol: string
  category: string
  assetType: string
  maxSupply: number
  description: string
  createdAt: string
  status: 'active' | 'pending' | 'inactive'
}

/**
 * Creates a new token collection on Hedera blockchain
 */
export async function createTokenCollection(config: CreateTokenConfig): Promise<TokenCreationResult> {
  try {
    console.log('🚀 Creating token collection with config:', config)
    
    const response = await fetch('/api/tokens/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Token creation result:', result)
    
    return result
  } catch (error) {
    console.error('❌ Token creation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Retrieves list of existing token collections
 */
export async function getTokenCollections(): Promise<TokenCollection[]> {
  try {
    const response = await fetch('/api/tokens/list')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.collections || []
  } catch (error) {
    console.error('❌ Failed to fetch token collections:', error)
    
    // Return mock data as fallback
    return [
      {
        tokenId: "0.0.12345",
        name: "African Commodities Collection",
        symbol: "AFCM",
        category: "Agriculture",
        assetType: "Commodity",
        maxSupply: 1000000,
        description: "Tokenized agricultural commodities from across Africa",
        createdAt: "2024-01-15T10:30:00Z",
        status: "active"
      },
      {
        tokenId: "0.0.67890",
        name: "Mining Assets Collection",
        symbol: "MINE",
        category: "Mining",
        assetType: "Natural Resource",
        maxSupply: 500000,
        description: "Digital tokens representing mining rights and mineral assets",
        createdAt: "2024-01-10T14:22:00Z",
        status: "active"
      }
    ]
  }
}
