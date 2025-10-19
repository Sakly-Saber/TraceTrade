const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com/api/v1";

export interface NFTBalance {
  token_id: string;
  balance: number;
}

/**
 * Fetch account data and return tokens with balance > 0
 * @param {string} accountId - e.g., "0.0.6606536"
 * @returns {Promise<Array>} Array of { token_id, balance }
 */
export const getAccountNFTBalances = async (accountId: string): Promise<NFTBalance[]> => {
  try {
    const response = await fetch(`${MIRROR_NODE_URL}/accounts/${accountId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract tokens with balance > 0
    const tokens = data?.balance?.tokens || [];
    const nftTokens = tokens
      .filter((t: any) => (t.balance || 0) > 0)
      .map((t: any) => ({
        token_id: t.token_id,
        balance: t.balance
      }));

    return nftTokens;
  } catch (error) {
    console.error("Error fetching NFT balances:", error);
    return [];
  }
};