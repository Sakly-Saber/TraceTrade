'use client';

// Client-only Hedera SDK wrapper
let HederaSDK: any = null;
let HashConnectLib: any = null;

export const initializeHedera = async () => {
  if (typeof window === 'undefined') return null;
  
  if (!HederaSDK) {
    try {
      HederaSDK = await import('@hashgraph/sdk');
      HashConnectLib = await import('hashconnect');
      console.log('✅ Hedera SDK initialized on client side');
      return { HederaSDK, HashConnectLib };
    } catch (error) {
      console.error('❌ Failed to initialize Hedera SDK:', error);
      return null;
    }
  }
  
  return { HederaSDK, HashConnectLib };
};

export const getHederaSDK = () => HederaSDK;
export const getHashConnectLib = () => HashConnectLib;