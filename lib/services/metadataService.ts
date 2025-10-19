// Helper to fetch and extract image URL from IPFS metadata
async function getImageFromMetadata(metadataUri: string): Promise<string | null> {
  if (!metadataUri) return null
  
  try {
    // Convert ipfs:// to https://
    let url = metadataUri
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '')
      url = `https://ipfs.io/ipfs/${cid}`
    }
    
    console.log('📥 Fetching metadata from:', url)
    const response = await fetch(url, { 
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (!response.ok) {
      console.warn('⚠️ Metadata fetch failed:', response.status)
      return null
    }
    
    const metadata = await response.json()
    console.log('📋 Metadata:', metadata)
    
    // Extract image URL from metadata
    let imageUrl: string | null = metadata.image || metadata.imageUrl || null
    
    if (imageUrl) {
      // Convert ipfs:// to https://ipfs.io if needed
      if (imageUrl.startsWith('ipfs://')) {
        const cid = imageUrl.replace('ipfs://', '').replace(/^ipfs\//, '')
        imageUrl = `https://ipfs.io/ipfs/${cid}`
      }
      // Replace Pinata subdomain with public gateway
      else if (imageUrl.includes('amaranth-bitter-falcon-175.mypinata.cloud')) {
        const cid = imageUrl.split('/ipfs/')[1]
        imageUrl = `https://ipfs.io/ipfs/${cid}`
      }
    }
    
    console.log('🖼️ Extracted image URL:', imageUrl)
    return imageUrl
    
  } catch (error) {
    console.error('❌ Error fetching metadata:', error)
    return null
  }
}

export { getImageFromMetadata }
