import { ethers } from "ethers"

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  AUCTION_HOUSE: process.env.NEXT_PUBLIC_AUCTION_ADDRESS || "",
  TRACE_TRADE_LOT: process.env.NEXT_PUBLIC_LOT_NFT_ADDRESS || "",
  TRACE_TRADE_TOKEN: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "",
}

// Hedera Testnet configuration
export const HEDERA_CONFIG = {
  CHAIN_ID: 296, // Hedera testnet
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.hashio.io/api",
  EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://hashscan.io/testnet",
  MIRROR_NODE_URL: process.env.NEXT_PUBLIC_MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com",
}

// ABI definitions (simplified for demo)
export const AUCTION_HOUSE_ABI = [
  "function createAuction(address nftContract, uint256 tokenId, address currency, uint256 reservePrice, uint256 startTime, uint256 endTime, uint16 feeBps, string metadataURI) returns (uint256)",
  "function placeBid(uint256 auctionId, uint256 amount) payable",
  "function settleAuction(uint256 auctionId)",
  "function getAuction(uint256 auctionId) view returns (tuple(address seller, address nftContract, uint256 tokenId, address currency, uint256 reservePrice, uint256 startTime, uint256 endTime, bool settled, address highestBidder, uint256 highestBid, uint16 feeBps, string metadataURI))",
  "function getBids(uint256 auctionId) view returns (tuple(address bidder, uint256 amount, uint256 timestamp, bytes32 txHash)[])",
  "function auctionCount() view returns (uint256)",
  "event AuctionCreated(uint256 indexed auctionId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 reservePrice, uint256 startTime, uint256 endTime)",
  "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, uint256 timestamp)",
  "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalAmount)",
]

export const LOT_NFT_ABI = [
  "function mintLot(address to, string tokenURI, string commodityType, uint256 quantity, string unit, string quality, string location, string certifications) returns (uint256)",
  "function getLotMetadata(uint256 tokenId) view returns (tuple(string commodityType, uint256 quantity, string unit, string quality, string location, string certifications, uint256 createdAt, address originalOwner))",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
]

export const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function faucet(address to, uint256 amount)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

// Provider setup
export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  
  // Fallback to JSON-RPC provider for Hedera testnet
  return new ethers.JsonRpcProvider(HEDERA_CONFIG.RPC_URL)
}

export function getSigner() {
  const provider = getProvider()
  if ('getSigner' in provider) {
    return provider.getSigner()
  }
  throw new Error("Signer not available - please connect wallet")
}

export async function getNetwork() {
  const provider = getProvider()
  return provider.getNetwork()
}

export function waitForTransaction(txHash: string) {
  const provider = getProvider()
  return provider.waitForTransaction(txHash)
}

export function getExplorerUrl(txHash: string): string {
  return `${HEDERA_CONFIG.EXPLORER_URL}/transaction/${txHash}`
}

// HashConnect configuration (optional)
const appMetadata = {
  name: "Hedera B2B Marketplace",
  description: "B2B marketplace for agricultural commodities on Hedera",
  icons: ["https://www.hashpack.app/img/logo.svg"],
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
};

// Simplified HashConnect functions
export const initHashConnect = async () => {
  // Simple implementation that doesn't cause chunk loading issues
  return null;
};

export const getHashConnectConnectionState = () => {
  // Return null for SSR, will be populated on client
  return null;
};

export const getHashConnectPairingData = () => {
  // Return null for SSR, will be populated on client
  return null;
};

export const disconnectHashConnect = async () => {
  // Simple disconnect implementation
  console.log("HashConnect disconnect requested");
};

// HashConnect wallet connection (simplified)
export async function connectHashConnect(): Promise<string> {
  console.log("🔗 Connecting to HashConnect...");
  
  try {
    // For now, throw an error to force MetaMask usage
    // This avoids the complex HashConnect dynamic import issues
    throw new Error("HashConnect temporarily disabled - please use MetaMask");
  } catch (error) {
    console.error("❌ HashConnect connection failed:", error);
    throw error;
  }
}

// MetaMask wallet connection
export async function connectMetaMask(): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not available. Please install MetaMask to connect your wallet.");
  }

  try {
    console.log("🦊 Connecting to MetaMask...");
    
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    }) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found in MetaMask");
    }

    const account = accounts[0];
    console.log("✅ MetaMask connected:", account);

    // Check if we're on the correct network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
    const currentChainId = parseInt(chainId, 16);
    
    if (currentChainId !== HEDERA_CONFIG.CHAIN_ID) {
      console.log(`🔄 Switching to Hedera Testnet (Chain ID: ${HEDERA_CONFIG.CHAIN_ID})`);
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${HEDERA_CONFIG.CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If the chain hasn't been added to MetaMask, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${HEDERA_CONFIG.CHAIN_ID.toString(16)}`,
              chainName: 'Hedera Testnet',
              rpcUrls: [HEDERA_CONFIG.RPC_URL],
              nativeCurrency: {
                name: 'HBAR',
                symbol: 'HBAR',
                decimals: 18,
              },
              blockExplorerUrls: [HEDERA_CONFIG.EXPLORER_URL],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }

    return account;
  } catch (error: any) {
    console.error("❌ MetaMask connection failed:", error);
    throw new Error(`Failed to connect MetaMask: ${error.message}`);
  }
}

// Simple HashPack availability check (no dynamic imports needed)
function isHashPackAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  // For now, return false to avoid chunk loading issues
  // This will force the app to use MetaMask only
  return false;
}

// Check available wallets (simplified)
export async function getAvailableWallets(): Promise<{hashpack: boolean, metamask: boolean}> {
  const wallets = {
    hashpack: false,
    metamask: false
  };

  // Check HashPack availability using simple detection
  try {
    if (typeof window !== "undefined") {
      wallets.hashpack = isHashPackAvailable();
    }
  } catch (error) {
    console.log("HashPack detection error:", error);
  }

  // Check MetaMask availability
  if (typeof window !== "undefined" && window.ethereum) {
    // Make sure it's actually MetaMask and not just any ethereum provider
    wallets.metamask = !!(window.ethereum.isMetaMask || window.ethereum.providers?.some((p: any) => p.isMetaMask));
  }

  return wallets;
}

// Main wallet connection with fallback logic
export async function connectWallet(): Promise<string> {
  console.log("🔄 Starting wallet connection...");
  
  const availableWallets = await getAvailableWallets();
  
  // If only one wallet is available, connect directly
  if (availableWallets.hashpack && !availableWallets.metamask) {
    return await connectHashConnect();
  }
  
  if (!availableWallets.hashpack && availableWallets.metamask) {
    return await connectMetaMask();
  }
  
  // If both are available, this function should not be called directly
  // Instead, the UI should show wallet selection
  if (availableWallets.hashpack && availableWallets.metamask) {
    throw new Error("WALLET_SELECTION_REQUIRED");
  }
  
  // If no wallets are available
  throw new Error("No compatible wallets found. Please install HashPack or MetaMask.");
}

export async function disconnectWallet(): Promise<void> {
  console.log("🔌 Disconnecting wallet...");
  
  try {
    // Try to disconnect HashConnect if it was connected
    await disconnectHashConnect();
  } catch (error) {
    console.log("HashConnect was not connected or failed to disconnect:", error);
  }
  
  // MetaMask doesn't have a programmatic disconnect method
  // Users need to disconnect manually from MetaMask
  console.log("✅ Wallet disconnection initiated");
}

export async function getWalletBalance(address: string): Promise<string> {
  try {
    const provider = getProvider()
    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    return "0"
  }
}

// Contract interaction helpers
export async function getContract(address: string, abi: any[]) {
  const signer = await getSigner()
  return new ethers.Contract(address, abi, signer)
}

export async function getContractRead(address: string, abi: any[]) {
  const provider = getProvider()
  return new ethers.Contract(address, abi, provider)
}

// Transaction helpers
export interface TransactionResult {
  hash: string
  receipt?: any
  error?: string
}

export async function sendTransaction(
  contract: ethers.Contract,
  method: string,
  args: any[] = [],
  value?: bigint
): Promise<TransactionResult> {
  try {
    console.log(`📤 Sending transaction: ${method}`, args)
    
    const tx = value
      ? await contract[method](...args, { value })
      : await contract[method](...args)
    
    console.log(`⏳ Transaction sent: ${tx.hash}`)
    
    const receipt = await tx.wait()
    console.log(`✅ Transaction confirmed: ${tx.hash}`)
    
    return {
      hash: tx.hash,
      receipt
    }
  } catch (error: any) {
    console.error(`❌ Transaction failed:`, error)
    return {
      hash: '',
      error: error.message || 'Transaction failed'
    }
  }
}

// Missing exports that are imported in other files
export function formatEther(value: bigint | string): string {
  return ethers.formatEther(value);
}

export async function getAuctionHouseContract() {
  if (!CONTRACT_ADDRESSES.AUCTION_HOUSE) {
    throw new Error("Auction House contract address not configured");
  }
  return getContract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AUCTION_HOUSE_ABI);
}

export async function getAuctionHouseContractRead() {
  if (!CONTRACT_ADDRESSES.AUCTION_HOUSE) {
    throw new Error("Auction House contract address not configured");
  }
  return getContractRead(CONTRACT_ADDRESSES.AUCTION_HOUSE, AUCTION_HOUSE_ABI);
}

export async function getLotNftContract() {
  if (!CONTRACT_ADDRESSES.TRACE_TRADE_LOT) {
    throw new Error("Lot NFT contract address not configured");
  }
  return getContract(CONTRACT_ADDRESSES.TRACE_TRADE_LOT, LOT_NFT_ABI);
}

export async function getTokenContract() {
  if (!CONTRACT_ADDRESSES.TRACE_TRADE_TOKEN) {
    throw new Error("Token contract address not configured");
  }
  return getContract(CONTRACT_ADDRESSES.TRACE_TRADE_TOKEN, TOKEN_ABI);
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}