const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com/api/v1";

export const getAccountBalance = async (accountId: string): Promise<number> => {
  try {
    const response = await fetch(`${MIRROR_NODE_URL}/accounts/${accountId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Account ${accountId} not found. Returning 0 balance.`);
        return 0;
      }
      throw new Error(`Mirror Node error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Mirror Node Account Data:", data);

    let balance = data?.balance?.balance; // ✅ Fixed: nested balance

    if (balance == null) {
      console.warn("No balance field in response. Defaulting to 0.");
      return 0;
    }

    if (typeof balance === 'string') {
      balance = balance.replace(/"/g, '').trim();
      if (balance === '') return 0;
      const parsed = parseFloat(balance);
      if (isNaN(parsed)) {
        console.error("Parsed balance is NaN. Raw value:", balance);
        return 0;
      }
      balance = parsed;
    }

    if (typeof balance !== 'number' || isNaN(balance)) {
      console.error("Final balance is invalid:", balance);
      return 0;
    }

    const hbar = balance / 100_000_000;
    return hbar;

  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
};