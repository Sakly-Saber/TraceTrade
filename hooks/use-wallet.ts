"use client"

import { useState, useEffect, useCallback } from "react"
import { connectHashPack, getConnectionState, getPairingData, disconnectWallet } from "@/lib/hashconnect"
import { getRichNFTInfoForAccount, type EnrichedNFT } from "@/lib/services/richNFTService"
import { getAccountBalance } from "@/lib/services/balance-service"

// Define connection states locally to avoid importing hashconnect directly
enum ConnectionState {
  Disconnected = 'Disconnected',
  Connected = 'Connected',
  Paired = 'Paired'
}

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  walletType: 'metamask' | 'hashpack' | null
  balance: string | null
  isLoadingBalance: boolean
  nfts: EnrichedNFT[]
  isLoadingNFTs: boolean
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    walletType: null,
    balance: null,
    isLoadingBalance: false,
    nfts: [],
    isLoadingNFTs: false,
  })

  // Check for persisted wallet connection on mount
  useEffect(() => {
    const persistedWallet = localStorage.getItem('wallet_connection')
    if (persistedWallet) {
      try {
        const { address, walletType } = JSON.parse(persistedWallet)
        if (address && walletType) {
          setState(prev => ({
            ...prev,
            address,
            walletType,
            isConnected: true,
          }))
          // Auto-fetch wallet data
          setTimeout(() => refreshWalletData(address), 100)
        }
      } catch (error) {
        console.warn('Failed to restore wallet connection:', error)
        localStorage.removeItem('wallet_connection')
      }
    }
  }, [])

  // Connect to MetaMask
  const connectMetaMask = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not detected')
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (accounts.length === 0) {
      throw new Error('No accounts found')
    }

    return { address: accounts[0], walletType: 'metamask' as const }
  }, [])

  // Connect to HashPack
  const connectHashPackWallet = useCallback(async () => {
    try {
      const address = await connectHashPack()
      if (!address) throw new Error('No address returned from HashPack')

      console.log('✅ HashPack wallet connected:', address)
      return { address, walletType: 'hashpack' as const }
    } catch (error) {
      console.error('❌ HashPack connection failed:', error)
      throw new Error(`Failed to connect to HashPack: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Refresh wallet data (balance, NFTs, etc.)
  const refreshWalletData = useCallback(async (walletAddress?: string) => {
    const addressToUse = walletAddress || state.address
    if (!addressToUse) return

    setState(prev => ({
      ...prev,
      isLoadingBalance: true,
      isLoadingNFTs: true,
    }))

    try {
      console.log('🔄 Refreshing wallet data for:', addressToUse)
      
      // Fetch real balance from Hedera mirror node
      const realBalance = await getAccountBalance(addressToUse)
      console.log('💰 Fetched balance:', realBalance, 'HBAR')
      
      // Fetch NFTs using the rich NFT service
      const nfts = await getRichNFTInfoForAccount(addressToUse)
      console.log('📦 Fetched NFTs:', nfts)
      
      setState(prev => ({
        ...prev,
        balance: realBalance.toFixed(4), // Format to 4 decimal places
        nfts: nfts,
        isLoadingBalance: false,
        isLoadingNFTs: false,
      }))
    } catch (error) {
      console.error('❌ Failed to refresh wallet data:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh wallet data',
        isLoadingBalance: false,
        isLoadingNFTs: false,
      }))
    }
  }, [state.address])

  // Generic connect function
  const connect = useCallback(async (preferredWallet?: 'metamask' | 'hashpack') => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }))

    try {
      let result;
      
      if (preferredWallet === 'hashpack') {
        result = await connectHashPackWallet()
      } else if (preferredWallet === 'metamask') {
        result = await connectMetaMask()
      } else {
        // Try HashPack first, then MetaMask
        try {
          result = await connectHashPackWallet()
        } catch {
          result = await connectMetaMask()
        }
      }

      setState({
        address: result.address,
        isConnected: true,
        isConnecting: false,
        error: null,
        walletType: result.walletType,
        balance: null,
        isLoadingBalance: false,
        nfts: [],
        isLoadingNFTs: false,
      })

      // Persist wallet connection
      localStorage.setItem('wallet_connection', JSON.stringify({
        address: result.address,
        walletType: result.walletType
      }))

      // Fetch wallet data
      refreshWalletData(result.address)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet",
      }))
    }
  }, [connectHashPackWallet, connectMetaMask])

  const disconnect = useCallback(() => {
    if (state.walletType === 'hashpack') {
      disconnectWallet()
    }
    
    // Clear persisted wallet connection
    localStorage.removeItem('wallet_connection')
    
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      walletType: null,
      balance: null,
      isLoadingBalance: false,
      nfts: [],
      isLoadingNFTs: false,
    })
  }, [state.walletType])

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      // Check HashPack connection
      const hashpackState = getConnectionState()
      const hashpackPairing = getPairingData()
      
      if (hashpackState === 'Paired' && hashpackPairing) {
        setState({
          address: hashpackPairing.accountIds[0],
          isConnected: true,
          isConnecting: false,
          error: null,
          walletType: 'hashpack',
          balance: null,
          isLoadingBalance: false,
          nfts: [],
          isLoadingNFTs: false,
        })
        return
      }

      // Check MetaMask connection
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          })

          if (accounts.length > 0) {
            setState({
              address: accounts[0],
              isConnected: true,
              isConnecting: false,
              error: null,
              walletType: 'metamask',
              balance: null,
              isLoadingBalance: false,
              nfts: [],
              isLoadingNFTs: false,
            })
          }
        } catch (error) {
          console.error("Failed to check wallet connection:", error)
        }
      }
    }

    checkConnection()
  }, [])

  // Listen for MetaMask account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum && state.walletType === 'metamask') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          setState((prev) => ({
            ...prev,
            address: accounts[0],
            isConnected: true,
          }))
        }
      }

      const handleChainChanged = () => {
        window.location.reload()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [disconnect, state.walletType])

  return {
    ...state,
    connect,
    connectMetaMask: () => connect('metamask'),
    connectHashPack: () => connect('hashpack'),
    disconnect,
    refreshWalletData,
  }
}