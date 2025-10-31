import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  PublicKey,
  TokenId,
  Hbar,
  AccountId,
  Client
} from '@hashgraph/sdk';
import { executeTransaction } from '../hashconnect';

// HIP-412 Token Metadata JSON Schema V2 Interface
interface HIP412Metadata {
  name: string;
  type: string;
  image: string;
  description?: string;
  creator?: string;
  creatorDID?: string;
  checksum?: string;
  format?: string;
  properties?: {
    external_url?: string;
    [key: string]: any;
  };
  files?: Array<{
    uri: string;
    type: string;
    checksum?: string;
    is_default_file?: boolean;
    metadata?: any;
  }>;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'percentage' | 'datetime' | 'date';
    max_value?: number;
  }>;
  localization?: {
    uri: string;
    default: string;
    locales: string[];
  };
}

interface NFTMintRequest {
  name: string;
  symbol?: string;
  description: string;
  imageUrl: string;
  treasuryId: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'percentage' | 'datetime' | 'date';
    max_value?: number;
  }>;
  properties?: {
    external_url?: string;
    [key: string]: any;
  };
  creator?: string;
  testMode?: boolean;
}

interface NFTMintResult {
  success: boolean;
  tokenId?: string;
  serialNumber?: number;
  transactionId?: string;
  metadataUri?: string;
  error?: string;
}

// Upload image to IPFS using Pinata
async function uploadImageToIPFS(imageUrl: string): Promise<string> {
  try {
    console.log('🖼️ Uploading image to IPFS...', imageUrl);
    
    // If it's already an IPFS URL, return it
    if (imageUrl.startsWith('ipfs://') || imageUrl.includes('ipfs')) {
      console.log('✅ Image already on IPFS:', imageUrl);
      return imageUrl;
    }
    
    // Convert relative URLs to absolute URLs
    let fullImageUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      fullImageUrl = `${window.location.origin}${imageUrl}`;
    }
    
    console.log('🔗 Full image URL:', fullImageUrl);
    
    // Fetch the image
    const imageResponse = await fetch(fullImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    
    // Create form data for Pinata upload
    const formData = new FormData();
    formData.append('file', imageBlob, 'nft-image.png');
    
    const pinataMetadata = JSON.stringify({
      name: 'NFT Image',
      keyvalues: {
        type: 'NFT_IMAGE',
        purpose: 'main_display'
      }
    });
    
    formData.append('pinataMetadata', pinataMetadata);
    
    const pinataOptions = JSON.stringify({
      cidVersion: 1
    });
    
    formData.append('pinataOptions', pinataOptions);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Pinata image upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    const ipfsImageUrl = `https://amaranth-bitter-falcon-175.mypinata.cloud/ipfs/${result.IpfsHash}`;
    console.log('✅ Image uploaded to IPFS:', ipfsImageUrl);
    
    return ipfsImageUrl;
  } catch (error) {
    console.error('❌ Failed to upload image to IPFS:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}

// Upload metadata to IPFS using Pinata
async function uploadMetadataToIPFS(metadata: HIP412Metadata): Promise<string> {
  try {
    console.log('📤 Uploading HIP-412 metadata to IPFS...');
    
    // Create the metadata blob
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    const formData = new FormData();
    formData.append('file', metadataBlob, 'metadata.json');
    
    const pinataMetadata = JSON.stringify({
      name: `${metadata.name} Metadata`,
      keyvalues: {
        type: 'NFT_METADATA',
        standard: 'HIP-412',
        version: '2.0.0'
      }
    });
    
    formData.append('pinataMetadata', pinataMetadata);
    
    const pinataOptions = JSON.stringify({
      cidVersion: 1
    });
    
    formData.append('pinataOptions', pinataOptions);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    const ipfsUri = `ipfs://${result.IpfsHash}`;
    console.log('✅ Metadata uploaded to IPFS:', ipfsUri);
    
    return ipfsUri;
  } catch (error) {
    console.error('❌ Failed to upload metadata to IPFS:', error);
    throw error;
  }
}

// Create HIP-412 compliant metadata
function createHIP412Metadata(request: NFTMintRequest): HIP412Metadata {
  // Determine image type from URL
  const getImageType = (imageUrl: string): string => {
    const url = imageUrl.toLowerCase();
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'image/jpeg';
    if (url.includes('.png')) return 'image/png';
    if (url.includes('.gif')) return 'image/gif';
    if (url.includes('.webp')) return 'image/webp';
    if (url.includes('.svg')) return 'image/svg+xml';
    return 'image/png'; // Default fallback
  };

  const metadata: HIP412Metadata = {
    name: request.name,
    type: getImageType(request.imageUrl),
    image: request.imageUrl, // This is the main publicly visible image
    description: request.description,
    format: 'HIP412@2.0.0',
    creator: request.creator || 'HederaB2B Marketplace',
    properties: {
      external_url: 'https://localhost:3000/marketplace',
      ...request.properties
    }
  };

  // Add attributes if provided (these will be visible but not as prominent as the main image)
  if (request.attributes && request.attributes.length > 0) {
    metadata.attributes = request.attributes;
  }

  // Files array - main image as default, additional files as secondary
  metadata.files = [
    {
      uri: request.imageUrl.startsWith('ipfs://')
        ? `https://ipfs.io/ipfs/${request.imageUrl.replace('ipfs://', '')}`
        : request.imageUrl, // Main publicly visible image with proper IPFS gateway
      type: getImageType(request.imageUrl),
      is_default_file: true // This makes it the primary display image
    }
  ];

  // Add additional files if they exist (PDFs, documents - these will be secondary)
  if (request.properties?.documentUrls && Array.isArray(request.properties.documentUrls)) {
    const additionalFiles = request.properties.documentUrls.map((url: string) => ({
      uri: url,
      type: url.toLowerCase().includes('.pdf') ? 'application/pdf' : 'application/octet-stream',
      is_default_file: false // These are secondary, not the main display
    }));
    metadata.files.push(...additionalFiles);
  }

  return metadata;
}

async function getHederaClient(walletAddress: string): Promise<Client> {
  const { Client, PrivateKey, AccountId } = await import('@hashgraph/sdk');
  const client = Client.forTestnet();
  
  // Set operator for network information only (not transaction ID)
  // Use a known testnet account for network node information
  try {
    const operatorAccount = AccountId.fromString(walletAddress); // Hedera testnet network account
    const operatorKey = PrivateKey.fromString(
      process.env.NEXT_PUBLIC_HEDERA_OPERATOR_KEY || 
      '302e020100300506032b657004220420da3819af44e17ff71bca87c840522f52bf448d3a36a5b089e8ba68a6c5e4d7c0'
    );
    client.setOperator(operatorAccount, operatorKey);
    console.log('✅ Client configured for HashConnect transaction signing with wallet:', walletAddress);
  } catch (error) {
    console.warn('⚠️ Using testnet defaults for transaction building:', error);
  }
  
  return client;
}

async function fetchWalletPrivateKey(walletAddress: string): Promise<string> {
  // HashPack wallets don't expose private keys for security reasons
  // Instead, we'll use transaction signing through HashConnect
  // This function is kept for compatibility but returns null
  console.log('🔑 HashPack wallets use transaction signing - no private key access needed');
  return '';
}

// Helper function to clear cached NFT token data for testing
export function clearCachedNFTData(tokenName: string, testMode: boolean = false): void {
  const tokenStorageKey = testMode
    ? 'nft_token_hip412_test'
    : `nft_token_${tokenName.replace(/\s+/g, '_')}`;
  
  localStorage.removeItem(tokenStorageKey);
  localStorage.removeItem(`${tokenStorageKey}_keys`);
  
  console.log('🧹 Cleared cached NFT data for:', tokenName);
}

export async function mintNFTWithHIP412(request: NFTMintRequest): Promise<NFTMintResult> {
  try {
    console.log('🎨 Starting HIP-412 compliant NFT minting...');
    console.log('📋 Request:', request);

    // Connect to HashPack wallet for token creation
    console.log('🔗 Connecting to HashPack wallet...');
    const { connectHashPack } = await import('../hashconnect');
    const walletAddress = await connectHashPack();

    if (!walletAddress) {
      throw new Error('Failed to connect to HashPack wallet');
    }

    console.log('✅ Wallet connected:', walletAddress);

    // Initialize Hedera client with wallet address for transaction building
    const client = await getHederaClient(walletAddress);

    // First, upload the image to IPFS if it's not already there
    console.log('🖼️ Processing image for IPFS storage...');
    const ipfsImageUrl = await uploadImageToIPFS(request.imageUrl);
    console.log('✅ Image ready for metadata:', ipfsImageUrl);

    // Update request with IPFS image URL
    const updatedRequest = {
      ...request,
      imageUrl: ipfsImageUrl
    };

    // Update the treasury ID to use the connected wallet
    const updatedRequestWithWallet = {
      ...updatedRequest,
      treasuryId: walletAddress // Use connected wallet as treasury
    };

    // Generate unique token storage key
    const tokenStorageKey = request.testMode
      ? `nft_token_hip412_test` // Use consistent key for test mode
      : `nft_token_${request.name.replace(/\s+/g, '_')}`;

    let tokenId = localStorage.getItem(tokenStorageKey);
    
    // Create HIP-412 compliant metadata
    console.log('📄 Creating HIP-412 compliant metadata...');
    const metadata = createHIP412Metadata(updatedRequestWithWallet);
    console.log('✅ Metadata created:', metadata);

    // Upload metadata to IPFS
    console.log('☁️ Uploading metadata to IPFS...');
    const metadataUri = await uploadMetadataToIPFS(metadata);
    console.log('✅ Metadata uploaded:', metadataUri);

    // Create token (if needed) and mint NFT in one transaction through HashConnect
    console.log('🎨 Creating and minting NFT through HashConnect transaction signing...');
    
    // Extract CID from IPFS URI (remove ipfs:// prefix)
    const cid = metadataUri.replace('ipfs://', '');
    console.log('📋 Using CID for metadata:', cid);
    
    if (!tokenId) {
      console.log('🆕 Creating and minting NFT in single transaction...');
      
      // Generate supply key for token
      const supplyPrivateKey = PrivateKey.generate();
      const supplyPublicKey = supplyPrivateKey.publicKey;
      
      console.log('🔑 Supply key generated for token creation');
      console.log('🏦 Using connected wallet as treasury:', walletAddress);
      
      // Create token first using HashConnect
      console.log('🆕 Creating NFT token through HashConnect...');
      const createTokenTransaction = new TokenCreateTransaction()
        .setTokenName(request.name)
        .setTokenSymbol(request.symbol || request.name.substring(0, 4).toUpperCase())
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setInitialSupply(0)
        .setMaxSupply(1000000)
        .setTreasuryAccountId(walletAddress) // Use connected wallet as treasury
        .setSupplyKey(supplyPublicKey)
        .setAutoRenewAccountId(walletAddress) // Use connected wallet as auto-renew
        .setAutoRenewPeriod(7776000)
        .setMaxTransactionFee(new Hbar(15))
        .setTransactionMemo(`Creating ${request.name} NFT Collection`);
        // NO freezeWith() - let HashConnect handle it

      // Execute token creation
      console.log('📤 Executing token creation through HashConnect...');
      const createResult = await executeTransaction(createTokenTransaction, walletAddress);

      if (!createResult.success) {
        throw new Error(`Token creation failed: ${createResult.response?.error || 'Unknown error'}`);
      }

      // Extract token ID
      tokenId = createResult.response?.tokenId?.toString();
      if (!tokenId) {
        throw new Error('Failed to get token ID from creation result');
      }

      console.log('🎉 NFT Token created successfully:', tokenId);
      localStorage.setItem(tokenStorageKey, tokenId);
      
      // Store token ID and supply keys for future minting
      const keyInfo = {
        tokenId,
        supplyPrivateKey: supplyPrivateKey.toString(),
        supplyPublicKey: supplyPublicKey.toString(),
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`${tokenStorageKey}_keys`, JSON.stringify(keyInfo));
      console.log('💾 Supply keys stored for future minting');
      
      // Now mint the first NFT
      console.log('🎨 Minting first NFT for the new token...');
      
      // Create mint transaction
      const mintTransaction = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(tokenId))
        .setMetadata([new Uint8Array(Buffer.from(cid, 'utf-8'))])
        .setMaxTransactionFee(new Hbar(5))
        .setTransactionMemo(`Minting ${request.name} HIP-412 NFT`);
      
      // Freeze transaction first (required before signing)
      console.log('❄️ Freezing mint transaction...');
      // Skip freezing - let HashConnect handle the complete transaction
      const frozenMintTransaction = mintTransaction.freezeWith(client);
      
      // Pre-sign with supply key to get signature for NFT creation
      console.log('🔑 Pre-signing mint transaction with supply key...');
      const signedMintTransaction = await frozenMintTransaction.sign(supplyPrivateKey);
      
      // Execute the pre-signed transaction through HashConnect (will add account signature)
      console.log('📤 Executing pre-signed mint transaction through HashConnect...');
      const mintResult = await executeTransaction(signedMintTransaction, walletAddress);
      
      if (!mintResult.success) {
        throw new Error(`Mint transaction failed: ${mintResult.response?.error || 'Unknown error'}`);
      }

      const serialNumbers = mintResult.receipt?.serials;
      const serialNumber = serialNumbers && serialNumbers.length > 0 ? serialNumbers[0].toNumber() : 1;

      console.log('✅ NFT minted successfully with HIP-412 metadata!');
      console.log('📋 Transaction ID:', mintResult.transactionId);
      console.log(`🎉 NFT: ${tokenId}/${serialNumber}`);
      console.log('🌐 Metadata URI:', metadataUri);

      return {
        success: true,
        tokenId,
        serialNumber,
        transactionId: mintResult.transactionId,
        metadataUri
      };

    } else {
      console.log('♻️ Using existing NFT token:', tokenId);
      
      // Mint NFT with existing token - use a different approach
      // Instead of existing token path, clear it and create new token for testing
      console.log('🔄 Clearing existing token data to create fresh token for testing');
      localStorage.removeItem(tokenStorageKey);
      localStorage.removeItem(`${tokenStorageKey}_keys`);
      
      // Return error to trigger fresh token creation
      throw new Error('Token data cleared - creating fresh token');
    }

  } catch (error) {
    console.error('❌ HIP-412 NFT minting failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}