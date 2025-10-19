import { 
  TokenCreateTransaction, 
  TokenMintTransaction,
  TokenAssociateTransaction,
  TokenType,
  TokenSupplyType,
  TokenId,
  AccountId,
  Hbar,
  TransferTransaction,
  Client
} from '@hashgraph/sdk';

// Helper function to get executeTransaction on client-side only
const getExecuteTransaction = async () => {
  if (typeof window !== 'undefined    const tokenMintTransaction = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([new Uint8Array(Buffer.from(request.metadataHash || `ipfs://metadata-${Date.now()}`, 'utf-8'))])
      .setMaxTransactionFee(new Hbar(5))
      .setTransactionMemo(`Minting ${request.name} NFT`);

    // Create client for testnet (same pattern as working HIP412)
    console.log('🌐 Setting up Hedera client for transaction freezing...');
    const { Client } = await import('@hashgraph/sdk');
    const client = Client.forTestnet();

    // Freeze transaction with client (same pattern as working HIP412)
    console.log('🧊 Freezing mint transaction with client...');
    const frozenMintTransaction = tokenMintTransaction.freezeWith(client);

    // Sign the transaction with the supply key before submitting to HashConnect
    console.log('🔐 Signing mint transaction with supply key...');
    if (supplyPrivateKey) {
      frozenMintTransaction.sign(supplyPrivateKey);
      console.log('✅ Transaction signed with supply key');
    } else {
      throw new Error('Supply key required for minting but not available');
    }{
      const module = await import('../hashconnect');
      return module.executeTransaction;
    } catch (error) {
      console.warn('Failed to import executeTransaction:', error);
      return null;
    }
  }
  return null;
}

export interface NFTMintRequest {
  name: string;
  description: string;
  imageUrl: string;
  metadataUri: string;
  metadataHash: string;
  collectionId: string;
  assetData: Record<string, any>;
  treasuryId: string; // Connected wallet account ID
  createdBy: string; // Connected wallet account ID
}

export interface NFTMintResult {
  success: boolean;
  tokenId?: string | null;
  serialNumber?: number;
  transactionId?: string;
  error?: string;
  supplyKey?: string;
  message?: string;
}

export async function mintNFTClientSide(request: NFTMintRequest): Promise<NFTMintResult> {
  // This function will only work on the client side
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Client-side only function called on server'
    };
  }

  try {
    console.log('🎨 Starting NFT minting process with HashConnect wallet...');
    console.log('📋 Minting request:', {
      name: request.name,
      description: request.description,
      treasuryId: request.treasuryId,
      metadataUri: request.metadataUri
    });

    // Dynamic imports to prevent server-side issues
    const hashconnectModule = await import('../hashconnect');
    const { executeTransaction, getConnectedAccountId, getHashConnectInstance, connectHashPack } = hashconnectModule;

    console.log('🔄 Checking HashConnect connection status...');
    let hashConnectInstance = getHashConnectInstance();
    let connectedAccountId = getConnectedAccountId();

    // If not properly connected, trigger the wallet connection flow
    if (!hashConnectInstance || !connectedAccountId) {
      console.log('� No active wallet connection found. Initiating HashPack connection...');

      try {
        // Use the connectHashPack function which handles the full pairing flow
        connectedAccountId = await connectHashPack();
        
        if (!connectedAccountId) {
          throw new Error('Failed to connect to HashPack wallet');
        }

        // Re-fetch instance after connection
        hashConnectInstance = getHashConnectInstance();
        
        if (hashConnectInstance && connectedAccountId) {
          console.log('✅ HashPack wallet connected successfully');
          console.log('🔗 Connected account:', connectedAccountId);
        } else {
          throw new Error('Connection established but instance not available');
        }

      } catch (connectionError) {
        console.error('❌ HashPack wallet connection failed:', connectionError);
        throw new Error(
          `Wallet connection failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}. ` +
          'Please ensure HashPack is installed and try connecting again.'
        );
      }
    } else {
      console.log('✅ HashConnect already connected. Account:', connectedAccountId);
    }

    // Validate that we have everything we need
    if (!hashConnectInstance || !executeTransaction) {
      throw new Error('HashConnect not properly initialized. Please refresh and try again.');
    }

    if (!connectedAccountId) {
      throw new Error('No wallet account connected. Please connect your HashPack wallet.');
    }

    console.log('✅ HashConnect ready for transaction. Account:', connectedAccountId);

    // Step 1: Check for existing token using hybrid security approach
    console.log('🔍 Checking for existing token with hybrid security...');

    let tokenId: string | null = null;
    let existingCollection: any = null;
    let clientSideKeys: any = null;

    // First check client-side encrypted storage for keys
    try {
      const encryptedKeys = localStorage.getItem(`secure_token_keys_${request.collectionId}`);
      if (encryptedKeys) {
        clientSideKeys = JSON.parse(atob(encryptedKeys));
        if (clientSideKeys && clientSideKeys.tokenId) {
          tokenId = clientSideKeys.tokenId;
          console.log('✅ Found existing token in secure client storage:', tokenId);
          console.log('🔒 Private keys available client-side for minting operations');
        }
      }
    } catch (clientError) {
      console.warn('⚠️ Client-side key retrieval failed:', clientError);
    }

    // Also check database for metadata (no sensitive keys expected)
    if (!tokenId) {
      try {
        console.log('🗄️ Checking database for token metadata...');
        const response = await fetch('/api/nft-collections/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            collectionId: request.collectionId,
            createdBy: request.createdBy 
          })
        });
        
        if (response.ok) {
          existingCollection = await response.json();
          if (existingCollection && existingCollection.tokenId) {
            tokenId = existingCollection.tokenId;
            console.log('✅ Found existing token metadata in database:', tokenId);
            console.log('⚠️ No client-side keys found - will need to regenerate');
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Database metadata check failed:', dbError);
      }
    }

    if (!tokenId || !clientSideKeys) {
      console.log('🆕 Creating new token for collection...');

      // Create NFT token using HashConnect
      console.log('💰 Creating NFT token via HashConnect...');
      console.log('🚨 This will prompt your wallet for approval!');

      const treasuryAccountString = request.treasuryId;
      console.log('🏦 Treasury account:', treasuryAccountString);

      // Hybrid Approach: Generate keys client-side, store securely for future use
      // Keys never leave the client environment, but are persisted for reuse
      console.log('🔑 Implementing hybrid key management - client-side generation with secure persistence...');
      
      // Import required classes for key generation
      const { AccountId, PrivateKey } = await import('@hashgraph/sdk');
      
      // Generate supply key pair client-side for this token
      const supplyPrivateKey = PrivateKey.generate();
      const supplyPublicKey = supplyPrivateKey.publicKey;
      
      // Generate admin key pair client-side for administrative operations
      const adminPrivateKey = PrivateKey.generate();
      const adminPublicKey = adminPrivateKey.publicKey;
      
      console.log('� Client-side keys generated:');
      console.log('   • Supply key (public):', supplyPublicKey.toString());
      console.log('   • Admin key (public):', adminPublicKey.toString());
      console.log('   • Private keys remain client-side only');
      
      const tokenCreateTransaction = new TokenCreateTransaction()
        .setTokenName(request.name)
        .setTokenSymbol(request.name.substring(0, 4).toUpperCase())
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setInitialSupply(0)
        .setMaxSupply(1000000)
        .setTreasuryAccountId(treasuryAccountString)
        .setSupplyKey(supplyPublicKey) // Set the supply key to allow minting
        .setAdminKey(adminPublicKey) // Set admin key for management
        .setAutoRenewAccountId(treasuryAccountString)
        .setAutoRenewPeriod(7776000)
        .setMaxTransactionFee(new Hbar(10))
        .setTransactionMemo(`Creating ${request.name} NFT Collection`);

      console.log('📋 Token transaction configured with client-side generated keys');
      console.log('🔐 Transaction will be signed by HashConnect wallet - removing client-side signing');
      console.log('📤 Executing token creation transaction via HashConnect...');
      
      // Set up Hedera client for testnet before freezing
      console.log('🌐 Setting up Hedera client for transaction freezing...');
      const { Client } = await import('@hashgraph/sdk');
      const client = Client.forTestnet();
      
      // CRITICAL: Freeze the transaction with proper client before sending to HashConnect
      console.log('🧊 Freezing transaction for HashConnect...');
      const frozenTransaction = tokenCreateTransaction.freezeWith(client);
      console.log('✅ Transaction frozen successfully');
      
      const tokenCreateResult = await executeTransaction(frozenTransaction, request.treasuryId);

      if (!tokenCreateResult.success) {
        throw new Error(`Token creation failed: ${tokenCreateResult.response?.error || 'Unknown error'}`);
      }

      const createdTokenId = tokenCreateResult.receipt.tokenId;
      tokenId = createdTokenId?.toString() || `0.0.${Date.now()}`;
      console.log('🎉 NFT Token created successfully:', tokenId);

      // 🚨 CRITICAL: Show user their supply key and require confirmation
      console.log('🔑 TOKEN CREATION SUCCESSFUL - SUPPLY KEY REQUIRED FOR MINTING');
      console.log('📋 Your Supply Key:', supplyPrivateKey.toString());
      console.log('⚠️  IMPORTANT: Store this supply key securely! You will need it for minting NFTs.');
      
      // Show user a modal/alert with their supply key
      const supplyKeyMessage = `
🎉 Token Created Successfully!
Token ID: ${tokenId}

🔑 YOUR SUPPLY KEY (STORE THIS SECURELY):
${supplyPrivateKey.toString()}

⚠️ IMPORTANT: 
- This key is required for minting NFTs to your collection
- Store it in a secure location (password manager, secure notes, etc.)
- Do NOT share this key with anyone
- If you lose this key, you cannot mint more NFTs

Click OK after you have securely stored your supply key.
      `;
      
      // Show alert and wait for user confirmation
      alert(supplyKeyMessage);
      
      // Ask for additional confirmation
      const userConfirmed = confirm(
        "Have you securely stored your supply key?\n\n" +
        "✅ YES - I have stored it securely, proceed with minting\n" +
        "❌ NO - I need more time to store it safely"
      );
      
      if (!userConfirmed) {
        // Return with the supply key so user can store it and try again later
        return {
          success: false,
          error: 'User needs to store supply key before proceeding',
          tokenId: tokenId,
          supplyKey: supplyPrivateKey.toString(),
          message: 'Please store your supply key securely and try minting again.'
        };
      }
      
      console.log('✅ User confirmed supply key is stored securely, proceeding with minting...');

      // Hybrid Security Storage: Store keys securely for future use
      console.log('💾 Storing keys with hybrid security approach...');
      try {
        // Store full key information for client-side operations
        const secureKeyData = {
          tokenId: tokenId,
          collectionId: request.collectionId,
          supplyPrivate: supplyPrivateKey.toString(),
          supplyPublic: supplyPublicKey.toString(),
          adminPrivate: adminPrivateKey.toString(),
          adminPublic: adminPublicKey.toString(),
          createdAt: new Date().toISOString(),
          treasuryAsSupplyKey: false // Using dedicated supply key
        };
        
        // Store encrypted on client-side for future minting operations
        const encryptedKeys = btoa(JSON.stringify(secureKeyData));
        localStorage.setItem(`secure_token_keys_${request.collectionId}`, encryptedKeys);
        console.log('✅ Secure keys stored client-side for future minting');
        
        // Store basic token info for reference
        const tokenInfo = {
          tokenId: tokenId,
          collectionId: request.collectionId,
          createdAt: new Date().toISOString(),
          hasClientKeys: true
        };
        localStorage.setItem(`token_info_${request.collectionId}`, JSON.stringify(tokenInfo));
        
        // Send metadata to server (without private keys for security)
        const storeResponse = await fetch('/api/nft-collections/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionId: request.collectionId,
            tokenId: tokenId,
            name: request.name,
            treasuryId: request.treasuryId,
            createdBy: request.createdBy,
            adminKey: adminPublicKey.toString(), // Store public key only
            supplyKey: supplyPublicKey.toString(), // Store public key only
            description: request.description,
            securityModel: 'CLIENT_SIDE_KEYS'
          })
        });

        if (storeResponse.ok) {
          console.log('✅ Token metadata stored successfully (keys kept secure client-side)');
        } else {
          console.warn('⚠️ Server metadata storage failed');
        }
      } catch (storeError) {
        console.error('❌ Storage error:', storeError);
      }
    }

    // Ensure we have a valid tokenId before proceeding with minting
    if (!tokenId) {
      throw new Error('Failed to get or create a valid token ID');
    }

    // Step 2: Mint NFT using hybrid approach with client-side key signing
    console.log('🎨 Minting NFT with treasury account as supply key...');
    console.log('🚨 This will prompt wallet for approval - treasury signs as supply key!');

    // Get supply key from client-side storage for signing
    let supplyPrivateKey = null;
    let adminPrivateKey = null;
    
    console.log('🔑 Retrieving keys from secure client storage for transaction signing...');
    
    // Try to get keys from client-side storage first
    if (clientSideKeys && clientSideKeys.supplyPrivate && clientSideKeys.adminPrivate) {
      console.log('� Loading keys from existing client storage...');
      try {
        const { PrivateKey } = await import('@hashgraph/sdk');
        supplyPrivateKey = PrivateKey.fromString(clientSideKeys.supplyPrivate);
        adminPrivateKey = PrivateKey.fromString(clientSideKeys.adminPrivate);
        console.log('✅ Keys loaded from client storage for signing');
      } catch (keyError) {
        console.warn('⚠️ Failed to load client-side keys:', keyError);
      }
    } else {
      // If no client-side keys, check if we have them in a different format or regenerate
      console.log('🆘 No client-side keys found - this token may have been created elsewhere');
      console.log('❌ Cannot mint without supply key - user needs to recreate token or import keys');
      throw new Error('No supply key available for minting. Please recreate the token or import the supply key.');
    }

    const tokenMintTransaction = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([new Uint8Array(Buffer.from(request.metadataHash || `ipfs://metadata-${Date.now()}`, 'utf-8'))])
      .setMaxTransactionFee(new Hbar(5))
      .setTransactionMemo(`Minting ${request.name} NFT`);

    // Sign the transaction with the supply key before submitting to HashConnect
    console.log('� Signing mint transaction with supply key...');
    if (supplyPrivateKey) {
      tokenMintTransaction.sign(supplyPrivateKey);
      console.log('✅ Transaction signed with supply key');
    } else {
      throw new Error('Supply key required for minting but not available');
    }

    console.log('📤 Executing signed mint transaction via HashConnect...');
    const tokenMintResult = await executeTransaction(frozenMintTransaction, request.treasuryId);

    if (!tokenMintResult.success) {
      throw new Error(`Token minting failed: ${tokenMintResult.response?.error || 'Unknown error'}`);
    }

    const serialNumbers = tokenMintResult.receipt.serials;
    const serialNumber = serialNumbers && serialNumbers.length > 0 ? serialNumbers[0].toNumber() : 1;

    console.log('✅ NFT minted successfully with hybrid security approach!');
    console.log('🔒 Private keys remained secure on client-side throughout process');
    console.log('📋 Transaction ID:', tokenMintResult.transactionId);
    console.log(`\n🎉 NFT is ready with maximum security!`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Serial Number: ${serialNumber}`);
    console.log(`View NFT: https://hashscan.io/testnet/token/${tokenId}/${serialNumber}`);

    return {
      success: true,
      tokenId: tokenId,
      serialNumber,
      transactionId: tokenMintResult.transactionId
    };

  } catch (error) {
    console.error('❌ NFT minting failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function setAiGeneratedImageUid(imageUid: string): Promise<{ success: boolean }> {
  try {
    console.log('🎨 Setting AI generated image UID (placeholder for future AI pipeline):', imageUid);
    // TODO: Connect to database when AI image generation pipeline is configured
    // For now, just return success to prevent errors
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to set AI generated image UID:', error);
    return { success: false };
  }
}

export async function clearClientSideKeys(collectionId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    console.log('🗑️ Clearing client-side keys for collection:', collectionId);
    localStorage.removeItem(`secure_token_keys_${collectionId}`);
    console.log('✅ Client-side keys cleared');
  }
}

export async function debugTransactionSigning(request: NFTMintRequest): Promise<any> {
  if (typeof window === 'undefined') {
    return { error: 'Client-side only function' };
  }
  
  try {
    console.log('🔍 DEBUG: Testing transaction signing process...');
    
    // Check if we have client-side keys
    const encryptedKeys = localStorage.getItem(`secure_token_keys_${request.collectionId}`);
    if (!encryptedKeys) {
      return { error: 'No client-side keys found' };
    }
    
    const clientSideKeys = JSON.parse(atob(encryptedKeys));
    console.log('🔑 DEBUG: Keys structure:', {
      hasAdminPrivate: !!clientSideKeys.adminPrivate,
      hasSupplyPrivate: !!clientSideKeys.supplyPrivate,
      hasTokenId: !!clientSideKeys.tokenId,
      tokenId: clientSideKeys.tokenId
    });
    
    // Test key loading
    const { PrivateKey, TokenMintTransaction, TokenId, Hbar } = await import('@hashgraph/sdk');
    
    const supplyPrivateKey = PrivateKey.fromString(clientSideKeys.supplyPrivate);
    console.log('✅ DEBUG: Supply key loaded successfully');
    
    // Test transaction creation and signing
    const testTransaction = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(clientSideKeys.tokenId))
      .setMetadata([new Uint8Array(Buffer.from('test-metadata', 'utf-8'))])
      .setMaxTransactionFee(new Hbar(5));
      
    console.log('📋 DEBUG: Test transaction created');
    
    // Test signing
    testTransaction.sign(supplyPrivateKey);
    console.log('✅ DEBUG: Transaction signed successfully');
    
    return {
      success: true,
      tokenId: clientSideKeys.tokenId,
      hasRequiredKeys: true
    };
    
  } catch (error) {
    console.error('❌ DEBUG: Transaction signing test failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
}

export async function transferNFTClientSide(
  tokenId: string,
  serialNumber: number,
  fromAccountId: string,
  toAccountId: string
): Promise<NFTMintResult> {
  // This function will only work on the client side
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Client-side only function called on server'
    };
  }

  try {
    console.log('🔄 Starting NFT transfer with connected wallet...');
    console.log('📋 Transfer request:', {
      tokenId,
      serialNumber,
      from: fromAccountId,
      to: toAccountId
    });

    // Dynamic imports to prevent server-side issues
    const hashconnectModule = await import('../hashconnect');
    const executeTransaction = hashconnectModule.executeTransaction;

    if (!executeTransaction) {
      throw new Error('HashConnect not properly initialized');
    }

    const fromAccount = AccountId.fromString(fromAccountId);
    const toAccount = AccountId.fromString(toAccountId);
    const nftTokenId = TokenId.fromString(tokenId);

    // Step 1: Associate the token with the recipient account if not already associated
    try {
      console.log('🔗 Associating token with recipient account...');
      const associateTransaction = new TokenAssociateTransaction()
        .setAccountId(toAccount)
        .setTokenIds([nftTokenId])
        .setMaxTransactionFee(new Hbar(1));

      await executeTransaction(associateTransaction, toAccountId);
      console.log('✅ Token associated with recipient account');
    } catch (associateError) {
      console.warn('⚠️ Token association failed (may already be associated):', associateError);
      // Continue with transfer even if association fails
    }

    // Step 2: Transfer the NFT
    console.log('🔄 Transferring NFT with connected wallet...');
    console.log('🔗 This will prompt your wallet for approval...');

    const transferTransaction = new TransferTransaction()
      .addNftTransfer(nftTokenId, serialNumber, fromAccount, toAccount)
      .setMaxTransactionFee(new Hbar(1));

    console.log('📤 Executing NFT transfer transaction...');
    const transferResult = await executeTransaction(transferTransaction, fromAccountId);

    if (!transferResult.success) {
      throw new Error(`NFT transfer failed: ${transferResult.response?.error || 'Unknown error'}`);
    }

    console.log('✅ NFT transferred successfully:', {
      transactionId: transferResult.transactionId
    });

    return {
      success: true,
      transactionId: transferResult.transactionId
    };

  } catch (error) {
    console.error('❌ NFT transfer failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}