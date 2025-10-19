const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com/api/v1";

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface EnrichedNFT {
  tokenId: string;
  serialNumber: number;
  owner: string;
  name: string;
  description: string;
  image: string | null;
  attributes: NFTAttribute[];
  symbol: string;
  hashscanUrl: string;
  metadataUri?: string | null;
}

/**
 * Fetches rich NFT info including metadata, image, attributes
 * @param {string} accountId
 * @returns {Promise<Array>} Array of enriched NFT objects
 */
export const getRichNFTInfoForAccount = async (accountId: string): Promise<EnrichedNFT[]> => {
  try {
    // Step 1: Get ALL NFTs owned by account
    const nftsResponse = await fetch(`${MIRROR_NODE_URL}/accounts/${accountId}/nfts?limit=100`);
    if (!nftsResponse.ok) {
      throw new Error(`Failed to fetch NFTs: ${nftsResponse.statusText}`);
    }
    const nftsData = await nftsResponse.json();
    const allNFTs = nftsData.nfts || [];

    if (allNFTs.length === 0) return [];

    // Step 2: Enrich each NFT with metadata
    const enrichedNFTs = await Promise.all(
      allNFTs.map(async (nft: any): Promise<EnrichedNFT | null> => {
        try {
          // Get token info (name, symbol, metadata key)
          const tokenResponse = await fetch(`${MIRROR_NODE_URL}/tokens/${nft.token_id}`);
          if (!tokenResponse.ok) throw new Error("Token not found");
          const tokenData = await tokenResponse.json();

          // Get NFT-specific metadata from mirror node
          const nftInfoResponse = await fetch(
            `${MIRROR_NODE_URL}/tokens/${nft.token_id}/nfts/${nft.serial_number}`
          );
          if (!nftInfoResponse.ok) throw new Error("NFT info not found");
          const nftInfo = await nftInfoResponse.json();

          // Decode metadata URI (base64)
          let metadataUri: string | null = null;
          if (nftInfo.metadata) {
            try {
              metadataUri = atob(nftInfo.metadata);
            } catch (e) {
              console.warn("Failed to decode metadata:", e);
            }
          }

          // Fetch off-chain metadata if URI exists
          let metadata: any = null;
          let imageUrl: string | null = null;

          if (metadataUri) {
            try {
              const resolvedUri = resolveIPFS(metadataUri);
              if (resolvedUri) {
                const metaRes = await fetch(resolvedUri);
                if (metaRes.ok) {
                  metadata = await metaRes.json();
                  imageUrl = metadata.image ? resolveIPFS(metadata.image) : null;
                }
              }
            } catch (e) {
              console.warn(`Failed to fetch metadata from ${metadataUri}:`, e);
            }
          }

          return {
            tokenId: nft.token_id,
            serialNumber: nft.serial_number,
            owner: nft.account_id,
            name: metadata?.name || tokenData.name || "Unknown NFT",
            description: metadata?.description || "",
            image: imageUrl,
            attributes: metadata?.attributes || [],
            symbol: tokenData.symbol || "???",
            hashscanUrl: `https://hashscan.io/testnet/token/${nft.token_id}/${nft.serial_number}`,
            metadataUri, // for debugging
          };

        } catch (error) {
          console.warn(`Failed to enrich NFT ${nft.token_id}-${nft.serial_number}:`, error);
          return {
            tokenId: nft.token_id,
            serialNumber: nft.serial_number,
            owner: nft.account_id,
            name: "Unknown NFT",
            description: "Metadata unavailable",
            image: null,
            attributes: [],
            symbol: "???",
            hashscanUrl: `https://hashscan.io/testnet/token/${nft.token_id}/${nft.serial_number}`,
          };
        }
      })
    );

    return enrichedNFTs.filter((nft): nft is EnrichedNFT => nft !== null);

  } catch (error) {
    console.error("Error in getRichNFTInfoForAccount:", error);
    return [];
  }
};

/**
 * Converts IPFS hash to HTTP gateway URL
 */
const resolveIPFS = (uri: string): string | null => {
  if (!uri) return null;

  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // Fallback: assume it's a raw IPFS CID
  if (uri.length >= 46) {
    return `https://ipfs.io/ipfs/${uri}`;
  }

  return uri;
};