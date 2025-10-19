import { 
  TokenCreateTransaction, 
  TokenMintTransaction, 
  TokenType,
  TokenSupplyType,
  PrivateKey,
  PublicKey,
  TokenId,
  Client,
  Hbar,
  AccountId
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
      uri: request.imageUrl, // Main publicly visible image
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

// Get or create Hedera client for direct minting
async function getHederaClient(): Promise<Client> {
  const { Client } = await import('@hashgraph/sdk');
  
  // Use testnet for now
  const client = Client.forTestnet();
  
  // Use the wallet's account as the operator for minting
  const operatorId = process.env.NEXT_PUBLIC_HEDERA_OPERATOR_ID || '0.0.6650412';
  const operatorKey = process.env.NEXT_PUBLIC_HEDERA_OPERATOR_KEY || '';
  
  if (operatorId && operatorKey) {
    try {
      const privateKey = PrivateKey.fromString(operatorKey);
      client.setOperator(AccountId.fromString(operatorId), privateKey);
      console.log('✅ Hedera client configured with operator:', operatorId);
    } catch (error) {
      console.warn('⚠️ Failed to set operator, using default configuration');
    }
  }
  
  return client;
}

export async function mintNFTWithHIP412(request: NFTMintRequest): Promise<NFTMintResult> {
  try {
    console.log('🎨 Starting HIP-412 compliant NFT minting...');
    console.log('📋 Request:', request);

    // Initialize Hedera client
    const client = await getHederaClient();

    // Connect to HashPack wallet for token creation
    console.log('🔗 Connecting to HashPack wallet...');
    const { connectHashPack } = await import('../hashconnect');
    const walletAddress = await connectHashPack();
    
    if (!walletAddress) {
      throw new Error('Failed to connect to HashPack wallet');
    }

    console.log('✅ Wallet connected:', walletAddress);

    // First, upload the image to IPFS if it's not already there
    console.log('🖼️ Processing image for IPFS storage...');
    const ipfsImageUrl = await uploadImageToIPFS(request.imageUrl);
    console.log('✅ Image ready for metadata:', ipfsImageUrl);

    // Update request with IPFS image URL
    const updatedRequest = {
      ...request,
      imageUrl: ipfsImageUrl
    };

    // Generate unique token storage key
    const tokenStorageKey = request.testMode 
      ? `nft_token_hip412_test` // Use consistent key for test mode
      : `nft_token_${request.name.replace(/\s+/g, '_')}`;

    let tokenId = localStorage.getItem(tokenStorageKey);
    
    // Only create new token if we don't have one or if explicitly requested
    if (!tokenId) {
      console.log('🆕 Creating new NFT token with generated supply key...');
      
      // Generate supply key pair for NFT
      console.log('🔑 Generating supply key for NFT token...');
      const supplyPrivateKey = PrivateKey.generate();
      const supplyPublicKey = supplyPrivateKey.publicKey;
      
      console.log('📤 Supply key generated:', supplyPublicKey.toString());
      
      // Create token with the generated supply key
      const tokenCreateTransaction = new TokenCreateTransaction()
        .setTokenName(request.name)
        .setTokenSymbol(request.symbol || request.name.substring(0, 4).toUpperCase())
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setInitialSupply(0)
        .setMaxSupply(1000000)
        .setTreasuryAccountId(request.treasuryId)
        .setSupplyKey(supplyPublicKey)
        .setAutoRenewAccountId(request.treasuryId)
        .setAutoRenewPeriod(7776000)
        .setMaxTransactionFee(new Hbar(10))
        .setTransactionMemo(`Creating ${request.name} NFT Collection`)
        .freezeWith(client); // CRITICAL: Freeze transaction before execution

      console.log('📤 Executing token creation with supply key...');
      const tokenCreateResult = await executeTransaction(tokenCreateTransaction, request.treasuryId);

      if (!tokenCreateResult.success) {
        throw new Error(`Token creation failed: ${tokenCreateResult.response?.error || 'Unknown error'}`);
      }

      // Extract token ID from response
      const createdTokenId = tokenCreateResult.response?.tokenId;
      tokenId = createdTokenId?.toString();
      
      if (!tokenId) {
        console.error('❌ Failed to extract token ID from result');
        throw new Error('Failed to get token ID from creation result');
      }
      
      // Store token ID and supply keys
      const keyInfo = {
        tokenId,
        supplyPrivateKey: supplyPrivateKey.toString(),
        supplyPublicKey: supplyPublicKey.toString(),
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(tokenStorageKey, tokenId);
      localStorage.setItem(`${tokenStorageKey}_keys`, JSON.stringify(keyInfo));
      console.log('🎉 NFT Token created successfully:', tokenId);
    } else {
      console.log('♻️ Using existing NFT token:', tokenId);
      
      // Verify we have the supply key for existing token
      const keyInfo = localStorage.getItem(`${tokenStorageKey}_keys`);
      if (!keyInfo) {
        console.error('❌ Found token ID but missing supply key - clearing token and creating new one');
        localStorage.removeItem(tokenStorageKey);
        // Recursive call to create new token
        return mintNFTWithHIP412(request);
      }
      
      try {
        const keys = JSON.parse(keyInfo);
        if (!keys.supplyPrivateKey) {
          throw new Error('Invalid key data');
        }
        console.log('✅ Existing token validated with supply key');
      } catch (error) {
        console.error('❌ Invalid key data - clearing token and creating new one');
        localStorage.removeItem(tokenStorageKey);
        localStorage.removeItem(`${tokenStorageKey}_keys`);
        // Recursive call to create new token
        return mintNFTWithHIP412(request);
      }
    }

    // Create HIP-412 compliant metadata
    console.log('📄 Creating HIP-412 compliant metadata...');
    const metadata = createHIP412Metadata(updatedRequest);
    console.log('✅ Metadata created:', metadata);

    // Upload metadata to IPFS
    console.log('☁️ Uploading metadata to IPFS...');
    const metadataUri = await uploadMetadataToIPFS(metadata);
    console.log('✅ Metadata uploaded:', metadataUri);

    // Get supply key for minting
    console.log('🔑 Retrieving supply key for minting...');
    const keyInfo = localStorage.getItem(`${tokenStorageKey}_keys`);
    if (!keyInfo) {
      throw new Error('Supply key not found - cannot mint NFT. Please create a new token first.');
    }

    let keys;
    try {
      keys = JSON.parse(keyInfo);
    } catch (error) {
      throw new Error('Failed to parse stored supply key information');
    }

    if (!keys.supplyPrivateKey) {
      throw new Error('Supply private key not found in storage');
    }

    const supplyPrivateKey = PrivateKey.fromString(keys.supplyPrivateKey);
    console.log('✅ Supply key loaded for minting');
    console.log('🔍 Token ID for minting:', tokenId);

    // Now mint the NFT through HashConnect with pre-signed transaction
    console.log('🎨 Minting NFT through HashConnect with pre-signed transaction...');
    
    // Extract CID from IPFS URI (remove ipfs:// prefix)
    const cid = metadataUri.replace('ipfs://', '');
    console.log('📋 Using CID for metadata:', cid);
    
    // Create mint transaction with IPFS CID as metadata
    const tokenMintTransaction = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([new Uint8Array(Buffer.from(cid, 'utf-8'))])
      .setMaxTransactionFee(new Hbar(5))
      .setTransactionMemo(`Minting ${request.name} HIP-412 NFT`)
      .freezeWith(client); // CRITICAL: Freeze transaction before signing

    // Pre-sign with supply key (this is critical for TOKEN_HAS_NO_SUPPLY_KEY error)
    console.log('🔑 Pre-signing transaction with supply key...');
    const signedMintTx = await tokenMintTransaction.sign(supplyPrivateKey);
    
    // Execute the pre-signed minting transaction through HashConnect
    console.log('📤 Executing pre-signed mint transaction through HashConnect...');
    const mintResult = await executeTransaction(signedMintTx, request.treasuryId);
    
    if (!mintResult.success) {
      const errorMessage = mintResult.response?.error || 'Unknown error';
      console.error('❌ Mint transaction failed:', errorMessage);
      console.error('❌ Full error details:', mintResult.response);
      throw new Error(`HIP-412 NFT minting failed: ${errorMessage}`);
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

  } catch (error) {
    console.error('❌ HIP-412 NFT minting failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}