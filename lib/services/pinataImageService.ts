// Pinata Image Upload Service for IPFS
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.IPFS_TOKEN;
const PINATA_GATEWAY = process.env.IPFS_GATEWAY || "amaranth-bitter-falcon-175.mypinata.cloud";

/**
 * Uploads an image file to Pinata IPFS
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The IPFS gateway URL
 */
export const uploadImageToPinata = async (file: File): Promise<string> => {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured. Add NEXT_PUBLIC_PINATA_JWT or IPFS_TOKEN to .env");
  }

  if (!file) {
    throw new Error("No file provided for upload");
  }

  // Validate file type (images and PDFs)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not supported. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`);
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    
    // Add pinata metadata for better organization
    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size.toString()
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${PINATA_JWT}` 
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Pinata upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const ipfsUrl = `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`;
    
    console.log("✅ File uploaded to IPFS:", ipfsUrl);
    return ipfsUrl;

  } catch (error) {
    console.error("❌ Pinata Image Upload Error:", error);
    throw error;
  }
};

/**
 * Uploads multiple files to Pinata IPFS
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<string[]>} Array of IPFS gateway URLs
 */
export const uploadMultipleImagesToPinata = async (files: File[]): Promise<string[]> => {
  if (!files || files.length === 0) {
    throw new Error("No files provided for upload");
  }

  try {
    const uploadPromises = files.map(file => uploadImageToPinata(file));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("❌ Multiple Files Upload Error:", error);
    throw error;
  }
};

/**
 * Validates if a file is supported for IPFS upload
 * @param {File} file - The file to validate
 * @returns {boolean} Whether the file is valid for upload
 */
export const validateFileForUpload = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: "No file provided" };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `File type ${file.type} not supported. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB` 
    };
  }

  return { isValid: true };
};