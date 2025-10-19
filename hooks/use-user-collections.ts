import { useState, useEffect } from 'react';

interface UserCollection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  tokenId?: string;
  category: string;
  assetType: string;
  currentSupply: number;
  maxSupply: number;
  imageUrl?: string;
  hasSupplyKey: boolean;
  supplyKeyDisplayed: boolean;
  createdAt: string;
  status: string;
}

interface UserCollectionsData {
  collections: UserCollection[];
  hasCollections: boolean;
  totalCollections: number;
}

interface UseUserCollectionsResult {
  collections: UserCollection[];
  hasCollections: boolean;
  totalCollections: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserCollections(walletAddress?: string): UseUserCollectionsResult {
  const [data, setData] = useState<UserCollectionsData>({
    collections: [],
    hasCollections: false,
    totalCollections: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    if (!walletAddress) {
      setData({ collections: [], hasCollections: false, totalCollections: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user-collections?walletAddress=${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.status}`);
      }

      const result: UserCollectionsData = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching user collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [walletAddress]);

  return {
    collections: data.collections,
    hasCollections: data.hasCollections,
    totalCollections: data.totalCollections,
    loading,
    error,
    refetch: fetchCollections
  };
}