import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize IPFS references to an HTTP gateway URL.
 * Always uses Pinata gateway (official provider, has all files)
 * Priority:
 * 1. Extract CID from any existing gateway URL
 * 2. If url is ipfs://CID or ipfs://ipfs/CID -> extract CID
 * 3. If cid is provided (a bare CID) -> use it
 * 4. If url looks like a CID alone -> treat as cid
 */
export function normalizeIpfsUrl(cid: string | null | undefined, url: string | null | undefined) {
  // Always use Pinata gateway (official provider)
  const gateway = 'https://amaranth-bitter-falcon-175.mypinata.cloud/ipfs'

  // Extract CID from various gateway URLs
  if (url && url.includes('/ipfs/')) {
    const hash = url.split('/ipfs/')[1]?.split(':')[0]?.split('?')[0]
    if (hash) return `${gateway}/${hash}`
  }

  // Handle ipfs:// protocol
  if (url && url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '').replace(/^ipfs\//, '')
    return `${gateway}/${hash}`
  }

  // Use provided CID directly
  if (cid) return `${gateway}/${cid}`

  // If url looks like a bare CID
  if (url && /^[A-Za-z0-9]{20,}$/.test(url)) {
    return `${gateway}/${url}`
  }

  // fallback to provided url or placeholder
  return url || `/placeholder-nft.png`
}
