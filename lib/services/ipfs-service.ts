import crypto from 'crypto'

// Environment variables for Pinata
const PINATA_JWT = process.env.PINATA_JWT
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://coral-historical-smelt-628.mypinata.cloud"
const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'

// Encryption settings
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16

/**
 * Generate a secure encryption key
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * Encrypt sensitive data before IPFS upload
 */
export const encryptData = (data: string, key: string): {
  encryptedData: string
  iv: string
  tag: string
} => {
  const keyBuffer = Buffer.from(key, 'hex')
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, keyBuffer, iv)
  cipher.setAAD(Buffer.from('tokenization-metadata'))
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

/**
 * Decrypt data retrieved from IPFS
 */
export const decryptData = (
  encryptedData: string,
  key: string,
  iv: string,
  tag: string
): string => {
  const keyBuffer = Buffer.from(key, 'hex')
  const ivBuffer = Buffer.from(iv, 'hex')
  const tagBuffer = Buffer.from(tag, 'hex')
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, keyBuffer, ivBuffer)
  decipher.setAAD(Buffer.from('tokenization-metadata'))
  decipher.setAuthTag(tagBuffer)
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Upload encrypted metadata to Pinata IPFS
 */
export const uploadEncryptedMetadataToPinata = async (
  metadata: any,
  encryptionKey?: string
): Promise<{
  ipfsHash: string
  encryptionKey: string
  gatewayUrl: string
}> => {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured. Add PINATA_JWT to environment variables")
  }

  try {
    // Generate encryption key if not provided
    const key = encryptionKey || generateEncryptionKey()
    
    // Prepare metadata with privacy protection
    const sensitiveData = JSON.stringify(metadata, null, 2)
    const encryptedInfo = encryptData(sensitiveData, key)
    
    // Create encrypted metadata package
    const encryptedPackage = {
      encrypted: true,
      data: encryptedInfo.encryptedData,
      iv: encryptedInfo.iv,
      tag: encryptedInfo.tag,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }

    // Convert to blob and upload
    const blob = new Blob([JSON.stringify(encryptedPackage, null, 2)], { 
      type: 'application/json' 
    })
    const file = new File([blob], 'encrypted-metadata.json', { 
      type: 'application/json' 
    })

    const formData = new FormData()
    formData.append('file', file)
    
    // Add metadata for Pinata
    formData.append('pinataMetadata', JSON.stringify({
      name: `Asset-Metadata-${Date.now()}`,
      keyvalues: {
        encrypted: 'true',
        type: 'asset-metadata',
        version: '1.0'
      }
    }))

    const response = await fetch(PINATA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Pinata upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    const gatewayUrl = `${PINATA_GATEWAY}/ipfs/${result.IpfsHash}`

    return {
      ipfsHash: result.IpfsHash,
      encryptionKey: key,
      gatewayUrl
    }

  } catch (error) {
    console.error("❌ Pinata Encrypted Metadata Upload Error:", error)
    throw error
  }
}

/**
 * Upload image to Pinata IPFS
 */
export const uploadImageToPinata = async (
  file: File,
  filename?: string
): Promise<{
  ipfsHash: string
  gatewayUrl: string
  fileSize: number
}> => {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured")
  }

  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // Add metadata for Pinata
    formData.append('pinataMetadata', JSON.stringify({
      name: filename || file.name || `Asset-Image-${Date.now()}`,
      keyvalues: {
        type: 'asset-image',
        originalName: file.name,
        uploadDate: new Date().toISOString()
      }
    }))

    const response = await fetch(PINATA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Image upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    const gatewayUrl = `${PINATA_GATEWAY}/ipfs/${result.IpfsHash}`

    return {
      ipfsHash: result.IpfsHash,
      gatewayUrl,
      fileSize: file.size
    }

  } catch (error) {
    console.error("❌ Pinata Image Upload Error:", error)
    throw error
  }
}

/**
 * Upload multiple images in parallel
 */
export const uploadMultipleImagesToPinata = async (
  files: File[]
): Promise<Array<{
  ipfsHash: string
  gatewayUrl: string
  fileSize: number
  originalName: string
}>> => {
  const uploadPromises = files.map(async (file) => {
    const result = await uploadImageToPinata(file, file.name)
    return {
      ...result,
      originalName: file.name
    }
  })

  return Promise.all(uploadPromises)
}

/**
 * Retrieve and decrypt metadata from IPFS
 */
export const retrieveDecryptedMetadata = async (
  ipfsHash: string,
  encryptionKey: string
): Promise<any> => {
  try {
    const response = await fetch(`${PINATA_GATEWAY}/ipfs/${ipfsHash}`)
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve metadata: ${response.statusText}`)
    }

    const encryptedPackage = await response.json()
    
    if (!encryptedPackage.encrypted) {
      throw new Error('Retrieved data is not encrypted')
    }

    const decryptedData = decryptData(
      encryptedPackage.data,
      encryptionKey,
      encryptedPackage.iv,
      encryptedPackage.tag
    )

    return JSON.parse(decryptedData)

  } catch (error) {
    console.error("❌ IPFS Metadata Retrieval Error:", error)
    throw error
  }
}

/**
 * Create comprehensive asset metadata for tokenization
 */
export const createAssetMetadata = (
  assetData: any,
  imageHashes: string[],
  documentHashes: string[]
) => {
  return {
    name: assetData.name || 'Tokenized Asset',
    description: assetData.description || '',
    industry: assetData.industry,
    subIndustry: assetData.subIndustry,
    specificAsset: assetData.specificAsset,
    
    // Asset-specific data
    assetDetails: assetData.schemaData,
    
    // IPFS references
    images: imageHashes.map(hash => ({
      ipfsHash: hash,
      url: `${PINATA_GATEWAY}/ipfs/${hash}`
    })),
    
    documents: documentHashes.map(hash => ({
      ipfsHash: hash,
      url: `${PINATA_GATEWAY}/ipfs/${hash}`
    })),
    
    // Metadata
    tokenizationDate: new Date().toISOString(),
    version: '1.0',
    standard: 'ERC-721',
    blockchain: 'Hedera',
    
    // Privacy and security
    encrypted: true,
    accessLevel: 'private',
    
    // Verification
    verified: false,
    verificationDocuments: documentHashes
  }
}

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
): { valid: boolean; error?: string } => {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}