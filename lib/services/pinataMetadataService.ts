// Pinata Metadata Upload Service for IPFS NFT metadata
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.IPFS_TOKEN;
const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_GATEWAY = process.env.IPFS_GATEWAY || "amaranth-bitter-falcon-175.mypinata.cloud";

/**
 * NFT Metadata interface for type safety
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties?: {
    category?: string;
    commodity_type?: string;
    quantity?: number;
    unit?: string;
    quality?: string;
    location?: string;
    certifications?: string[];
    business_id?: string;
    auction_id?: string;
  };
}

/**
 * Uploads NFT metadata object to Pinata IPFS
 * @param {NFTMetadata} metadata - The NFT metadata object
 * @returns {Promise<string>} IPFS CID
 */
export const uploadMetadataToPinata = async (metadata: NFTMetadata): Promise<string> => {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured. Add NEXT_PUBLIC_PINATA_JWT or IPFS_TOKEN to .env");
  }

  if (!metadata || !metadata.name || !metadata.description) {
    throw new Error("Invalid metadata: name and description are required");
  }

  try {
    // Validate and enhance metadata with standard NFT properties
    const enhancedMetadata = {
      ...metadata,
      version: "1.0",
      created_at: new Date().toISOString(),
      platform: "HederaB2B-Marketplace"
    };

    // Convert metadata to Blob
    const blob = new Blob([JSON.stringify(enhancedMetadata, null, 2)], { 
      type: 'application/json' 
    });
    const file = new File([blob], 'metadata.json', { 
      type: 'application/json' 
    });

    const formData = new FormData();
    formData.append('file', file);

    // Add pinata metadata for better organization
    const pinataMetadata = JSON.stringify({
      name: `NFT-Metadata-${metadata.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
      keyvalues: {
        type: 'nft-metadata',
        commodity: metadata.properties?.commodity_type || 'unknown',
        uploadedAt: new Date().toISOString(),
        businessId: metadata.properties?.business_id || 'unknown'
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch(PINATA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Pinata metadata upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log("✅ Metadata uploaded to IPFS:", result.IpfsHash);
    return result.IpfsHash; // Return CID

  } catch (error) {
    console.error("❌ Pinata Metadata Upload Error:", error);
    throw error;
  }
};

/**
 * Creates complete NFT metadata for commodity tokenization
 * @param {Object} commodityData - Raw commodity data
 * @param {string} imageUrl - IPFS URL of the commodity image
 * @returns {NFTMetadata} Formatted NFT metadata
 */
export const createCommodityMetadata = (
  commodityData: {
    name: string;
    description: string;
    category: string;
    commodityType: string;
    quantity: number;
    unit: string;
    quality?: string;
    location?: string;
    certifications?: string[];
    businessId?: string;
    auctionId?: string;
  },
  imageUrl: string
): NFTMetadata => {
  return {
    name: commodityData.name,
    description: commodityData.description,
    image: imageUrl,
    external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace/${commodityData.auctionId}`,
    attributes: [
      {
        trait_type: "Category",
        value: commodityData.category
      },
      {
        trait_type: "Commodity Type",
        value: commodityData.commodityType
      },
      {
        trait_type: "Quantity",
        value: commodityData.quantity,
        display_type: "number"
      },
      {
        trait_type: "Unit",
        value: commodityData.unit
      },
      ...(commodityData.quality ? [{
        trait_type: "Quality",
        value: commodityData.quality
      }] : []),
      ...(commodityData.location ? [{
        trait_type: "Location",
        value: commodityData.location
      }] : []),
      {
        trait_type: "Tokenization Date",
        value: new Date().toISOString().split('T')[0]
      }
    ],
    properties: {
      category: commodityData.category,
      commodity_type: commodityData.commodityType,
      quantity: commodityData.quantity,
      unit: commodityData.unit,
      quality: commodityData.quality,
      location: commodityData.location,
      certifications: commodityData.certifications,
      business_id: commodityData.businessId,
      auction_id: commodityData.auctionId
    }
  };
};

/**
 * Gets the IPFS gateway URL for a given CID
 * @param {string} cid - The IPFS CID
 * @returns {string} Full gateway URL
 */
export const getIPFSUrl = (cid: string): string => {
  if (!cid) throw new Error("CID is required");
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
};

/**
 * Validates metadata before upload
 * @param {NFTMetadata} metadata - Metadata to validate
 * @returns {Object} Validation result
 */
export const validateMetadata = (metadata: NFTMetadata): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!metadata.name || metadata.name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!metadata.description || metadata.description.trim().length === 0) {
    errors.push("Description is required");
  }

  if (!metadata.image || !metadata.image.startsWith('http')) {
    errors.push("Valid image URL is required");
  }

  if (metadata.attributes) {
    metadata.attributes.forEach((attr, index) => {
      if (!attr.trait_type || !attr.value) {
        errors.push(`Attribute ${index + 1} missing trait_type or value`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};