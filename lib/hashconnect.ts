// Dynamic client-side only HashConnect module - NO TOP LEVEL IMPORTS

const appMetadata = {
  name: "HederaB2B Marketplace",
  description: "Create and manage NFTs on Hedera", 
  icons: [""],
  url: typeof window !== 'undefined' ? window.location.origin : ''
};

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || "af66cf5d0a573e9b8049415951735f3b";
let hashconnectInstance: any = null;
let initializationPromise: Promise<any> | null = null; // Prevent concurrent initializations
let currentConnectionState: string = 'Disconnected';
let currentPairingData: any = null;
let isConnecting: boolean = false;
let connectionPromise: Promise<any> | null = null;
let savedAccount: any = null;
const STORAGE_KEY = 'hashconnect-session';

const normalizeForComparison = (value?: string | null): string | null => {
  if (!value || typeof value !== 'string') return null;

  let normalized = value.trim();
  if (!normalized) return null;

  if (normalized.startsWith('wc:')) {
    normalized = normalized.slice(3);
  }

  const queryIndex = normalized.indexOf('?');
  if (queryIndex >= 0) {
    normalized = normalized.slice(0, queryIndex);
  }

  return normalized;
};

const buildTopicVariants = (topic?: string | null): string[] => {
  if (!topic) return [];

  const variants = new Set<string>();
  const add = (value?: string | null) => {
    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) variants.add(trimmed);
    }
  };

  const stripPrefix = (value: string) => value.startsWith('wc:') ? value.slice(3) : value;
  const stripQuery = (value: string) => {
    const index = value.indexOf('?');
    return index >= 0 ? value.slice(0, index) : value;
  };

  const ensurePrefix = (value: string) => (value.startsWith('wc:') ? value : `wc:${value}`);

  add(topic);

  const noQuery = stripQuery(topic);
  add(noQuery);

  const noPrefix = stripPrefix(topic);
  add(noPrefix);

  const noPrefixNoQuery = stripPrefix(noQuery);
  add(noPrefixNoQuery);

  const baseWithoutVersion = noPrefixNoQuery.split('@')[0];
  add(baseWithoutVersion);

  if (noPrefixNoQuery.includes('@')) {
    const [base, version] = noPrefixNoQuery.split('@');
    if (base && version) {
      add(`${base}@${version}`);
      add(ensurePrefix(`${base}@${version}`));
    }
  }

  add(ensurePrefix(noPrefixNoQuery));
  add(ensurePrefix(baseWithoutVersion));

  return Array.from(variants);
};

const normalizeWalletConnectTopic = (topic?: string | null): string | null => {
  const variants = buildTopicVariants(topic);
  if (variants.length === 0) return null;

  const preferred = variants.find((variant) => !variant.startsWith('wc:') && variant.includes('@'))
    || variants.find((variant) => !variant.startsWith('wc:'))
    || variants[0];

  const normalized = normalizeForComparison(preferred);
  if (!normalized) {
    return preferred;
  }

  return preferred.startsWith('wc:') ? `wc:${normalized}` : normalized;
};

const findActiveSessionTopic = (rawTopic?: string | null): string | null => {
  if (!hashconnectInstance) return null;

  try {
    const signClient = (hashconnectInstance as any)?._signClient;
    if (!signClient?.session) return null;

    // First, try to get all sessions and find any active one
    if (typeof signClient.session.getAll === 'function') {
      try {
        const sessions = signClient.session.getAll();
        if (Array.isArray(sessions) && sessions.length > 0) {
          // If we have a specific topic to match, try to find it
          if (rawTopic) {
            const variants = buildTopicVariants(rawTopic);
            const match = sessions.find((session: any) => {
              const sessionTopic = session?.topic;
              if (!sessionTopic || typeof sessionTopic !== 'string') return false;

              const normalizedSession = normalizeForComparison(sessionTopic);
              if (!normalizedSession) return false;

              return variants.some((variant) => {
                const normalizedVariant = normalizeForComparison(variant);
                if (!normalizedVariant) return false;
                if (normalizedVariant === normalizedSession) return true;

                // Also allow matching on base topic without version
                const variantBase = normalizedVariant.split('@')[0];
                const sessionBase = normalizedSession.split('@')[0];
                return variantBase && sessionBase && variantBase === sessionBase;
              });
            });

            if (match?.topic) {
              console.log('🎯 Found matching session for topic:', match.topic);
              return match.topic;
            }
          }

          // If no specific match or no topic provided, use the most recent active session
          const activeSession = sessions.find((session: any) => 
            session?.topic && 
            session?.peer?.metadata?.name?.toLowerCase()?.includes('hashpack')
          ) || sessions[sessions.length - 1]; // Use the most recent session

          if (activeSession?.topic) {
            console.log('🔄 Using most recent active session:', activeSession.topic);
            return activeSession.topic;
          }

          console.warn('⚠️ No WalletConnect session matched the provided topic variants.', {
            rawTopic,
            availableTopics: sessions.map((session: any) => session?.topic).filter(Boolean),
            sessionCount: sessions.length
          });
        }
      } catch (listError) {
        console.warn('⚠️ Failed to enumerate WalletConnect sessions:', listError);
      }
    }

    // Fallback: try direct session lookup if we have a topic
    if (rawTopic && typeof signClient.session.get === 'function') {
      const variants = buildTopicVariants(rawTopic);
      for (const variant of variants) {
        try {
          const session = signClient.session.get(variant);
          if (session) {
            console.log('🎯 Found session via direct lookup:', session.topic);
            return session.topic ?? variant;
          }
        } catch (getError) {
          // WalletConnect throws when the session is missing; continue
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to inspect WalletConnect sessions:', error);
  }

  return null;
};

const hasActiveSignClientSession = (topic?: string | null): boolean => {
  const activeTopic = findActiveSessionTopic(topic);

  if (activeTopic) {
    // Update current pairing data with the active topic
    if (currentPairingData) {
      if (currentPairingData.topic !== activeTopic) {
        console.log('🔄 Updating pairing data with active session topic:', activeTopic);
        currentPairingData.topic = activeTopic;
        if (!currentPairingData.rawTopic && topic) {
          currentPairingData.rawTopic = topic;
        }

        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPairingData));
          } catch (storageError) {
            console.warn('⚠️ Failed to persist active HashConnect session topic:', storageError);
          }
        }
      }
    }
    
    return true;
  }

  // If no active topic found but we have HashConnect initialized and paired, 
  // try to recover by using any available session
  if (hashconnectInstance && currentConnectionState === 'Paired' && currentPairingData?.accountIds?.length > 0) {
    console.log('🔄 Attempting session recovery for paired connection...');
    const anyActiveTopic = findActiveSessionTopic(null); // Find any active session
    if (anyActiveTopic) {
      console.log('✅ Recovered session with topic:', anyActiveTopic);
      if (currentPairingData) {
        currentPairingData.topic = anyActiveTopic;
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPairingData));
          } catch (storageError) {
            console.warn('⚠️ Failed to persist recovered session topic:', storageError);
          }
        }
      }
      return true;
    }
  }

  return false;
};

export const resetHashConnectState = async (options: { clearStorage?: boolean; disconnect?: boolean } = {}) => {
  const { clearStorage = true, disconnect = true } = options;

  if (disconnect && hashconnectInstance?.disconnect) {
    try {
      await hashconnectInstance.disconnect();
    } catch (error) {
      console.warn('⚠️ Failed to disconnect existing HashConnect session:', error);
    }
  }

  if (clearStorage && typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('⚠️ Failed to clear persisted HashConnect session:', error);
    }
  }

  currentPairingData = null;
  currentConnectionState = 'Disconnected';
};

// Complete WalletConnect infrastructure reset
const performCompleteWalletReset = async (): Promise<void> => {
  console.log('🔄 Performing complete wallet infrastructure reset...');
  
  try {
    // 1. Disconnect and destroy current HashConnect instance
    if (hashconnectInstance) {
      try {
        await hashconnectInstance.disconnect();
        hashconnectInstance.removeAllListeners();
        hashconnectInstance = null;
      } catch (e) {
        console.warn('⚠️ Error during HashConnect disconnect:', e);
      }
    }

    // 2. Clear all event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', () => {});
      window.removeEventListener('unload', () => {});
    }

    // 3. Clear browser storage completely
    await clearAllWalletConnectStorage();

    // 4. Clear IndexedDB completely
    await clearIndexedDBDatabases();

    // 5. Reset global state
    resetGlobalWalletState();

    console.log('✅ Complete wallet reset completed');
  } catch (error) {
    console.error('❌ Error during complete wallet reset:', error);
    throw error;
  }
};

// Enhanced storage cleanup to handle IndexedDB issues
const clearAllWalletConnectStorage = async (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      console.log('🧹 Comprehensive WalletConnect storage cleanup...');
      
      // Clear localStorage
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('walletconnect') || 
            key.includes('wc@2') || 
            key.includes('hashconnect') ||
            key.includes('@walletconnect') ||
            key.includes('wc_') ||
            key.includes('hashconnect_') ||
            key.includes('walletconnect_')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log(`✅ Removed localStorage key: ${key}`);
          } catch (e) {
            console.warn(`⚠️ Failed to remove localStorage key: ${key}`);
          }
        });
      }

      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (
            key.includes('walletconnect') || 
            key.includes('wc@2') || 
            key.includes('hashconnect') ||
            key.includes('@walletconnect') ||
            key.includes('wc_') ||
            key.includes('hashconnect_')
          )) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => {
          try {
            sessionStorage.removeItem(key);
            console.log(`✅ Removed sessionStorage key: ${key}`);
          } catch (e) {
            console.warn(`⚠️ Failed to remove sessionStorage key: ${key}`);
          }
        });
      }

      console.log('✅ Storage cleanup completed');
      resolve();
    } catch (error) {
      console.error('❌ Error during storage cleanup:', error);
      resolve(); // Don't fail the reset process
    }
  });
};

// Clear IndexedDB databases
const clearIndexedDBDatabases = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve();
      return;
    }

    console.log('🗄️ Clearing IndexedDB databases...');

    const dbNames = [
      'walletconnect',
      'hashconnect',
      'wc@2:core:0.3//keychain',
      'wc@2:core:0.3//messages',
      'wc@2:core:0.3//subscription',
      'wc@2:client:0.3//session',
      'wc@2:client:0.3//proposal',
      'wc@2:client:0.3//request',
      '@walletconnect/keyvaluestorage',
      'wc_storage',
      'hashconnect_storage'
    ];

    let completedDeletes = 0;
    const totalDeletes = dbNames.length;

    if (totalDeletes === 0) {
      resolve();
      return;
    }

    dbNames.forEach(dbName => {
      try {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => {
          console.log(`✅ Deleted IndexedDB: ${dbName}`);
          completedDeletes++;
          if (completedDeletes >= totalDeletes) resolve();
        };
        deleteReq.onerror = () => {
          console.log(`⚠️ Failed to delete IndexedDB: ${dbName}`);
          completedDeletes++;
          if (completedDeletes >= totalDeletes) resolve();
        };
        deleteReq.onblocked = () => {
          console.log(`🚫 IndexedDB delete blocked: ${dbName}`);
          completedDeletes++;
          if (completedDeletes >= totalDeletes) resolve();
        };
      } catch (error) {
        console.log(`❌ Error deleting IndexedDB ${dbName}:`, error);
        completedDeletes++;
        if (completedDeletes >= totalDeletes) resolve();
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (completedDeletes < totalDeletes) {
        console.log('⏰ IndexedDB cleanup timeout, proceeding...');
        resolve();
      }
    }, 5000);
  });
};

// Recreate storage context after cleanup
const recreateStorageContext = async (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      // Clear localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('walletconnect') || key.includes('hashconnect')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage items
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('walletconnect') || key.includes('hashconnect')) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log('✅ Storage context recreated');
      resolve();
    } catch (error) {
      console.warn('⚠️ Error recreating storage context:', error);
      resolve(); // Don't block initialization
    }
  });
};

// Reset global wallet state
const resetGlobalWalletState = (): void => {
  console.log('🔄 Resetting global wallet state...');
  
  // Reset connection state
  isConnecting = false;
  connectionPromise = null;
  
  // Clear saved accounts
  savedAccount = null;
  
  console.log('✅ Global wallet state reset completed');
};

// Enhanced HashConnect initialization with IndexedDB bypassing
export const initHashConnect = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;
  
  if (hashconnectInstance) {
    console.log('🔄 HashConnect already initialized, returning existing instance');
    return hashconnectInstance;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    console.log('⏳ HashConnect initialization already in progress, waiting...');
    return await initializationPromise;
  }

  // Create simple initialization promise
  initializationPromise = initHashConnectInternal();
  return await initializationPromise;
};

const initHashConnectInternal = async (): Promise<any> => {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 HashConnect initialization attempt ${retryCount + 1}/${maxRetries}...`);

      // Progressive cleanup strategy with complete reset
      if (retryCount === 0) {
        console.log('🧹 Attempt 1: Basic cleanup');
        try {
          localStorage.removeItem('walletconnect');
          localStorage.removeItem('@walletconnect/keyvaluestorage');
        } catch (e) {
          console.warn('Basic cleanup failed:', e);
        }
      } else if (retryCount === 1) {
        console.log('🧹 Attempt 2: Complete storage reset');
        await performCompleteWalletReset();
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('🧹 Attempt 3: Nuclear reset with fresh start');
        await performCompleteWalletReset();
        await clearIndexedDBDatabases();
        
        // Force garbage collection if available
        if (typeof window !== 'undefined' && (window as any).gc) {
          (window as any).gc();
        }
        
        // Recreate fresh storage context
        await recreateStorageContext();
        await new Promise(resolve => setTimeout(resolve, 7000));
        
        // Force page reload to ensure clean state
        if (typeof window !== 'undefined') {
          console.log('🔄 Forcing page reload for fresh start...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
      }

      // Dynamic imports with error handling
      console.log('📦 Loading HashConnect modules...');
      const hashconnectModule = await import('hashconnect').catch(error => {
        console.error('Failed to import hashconnect:', error);
        throw new Error('HashConnect module load failed');
      });

      const hederaModule = await import('@hashgraph/sdk').catch(error => {
        console.error('Failed to import Hedera SDK:', error);
        throw new Error('Hedera SDK module load failed');
      });

      const { HashConnect, HashConnectConnectionState } = hashconnectModule;
      const { LedgerId } = hederaModule;

      // Create instance with custom configuration to avoid IndexedDB where possible
      const customMetadata = {
        ...appMetadata,
        name: `${appMetadata.name} ${Date.now()}`,
        url: appMetadata.url || 'http://localhost:3000',
      };

      console.log('🚀 Creating new HashConnect instance...');
      hashconnectInstance = new HashConnect(
        LedgerId.TESTNET,
        PROJECT_ID,
        customMetadata,
        true // debug mode
      );

      console.log('⚙️ Setting up HashConnect events...');
      setupEvents(HashConnectConnectionState);

      console.log('🔌 Initializing HashConnect core...');
      await hashconnectInstance.init();

      console.log('✅ HashConnect initialized successfully!');

      // Make HashConnect globally available for allowance modal and other components
      if (typeof window !== 'undefined') {
        (window as any).hashconnect = hashconnectInstance;
        console.log('🌐 HashConnect instance made globally available');
      }

      // Try to restore from localStorage (our fallback storage)
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const restoredData = JSON.parse(saved);

          const rawTopic =
            restoredData.rawTopic ||
            restoredData.topic ||
            hashconnectInstance.topic ||
            hashconnectInstance.pairingString;

          const resolvedTopic =
            findActiveSessionTopic(rawTopic) || normalizeWalletConnectTopic(rawTopic);

          const pairingData = {
            ...restoredData,
            rawTopic,
            topic: resolvedTopic || rawTopic,
          };

          currentPairingData = pairingData;
          currentConnectionState = HashConnectConnectionState.Paired;
          console.log('✅ Restored pairing from localStorage, topic:', pairingData.topic);

          if (!hasActiveSignClientSession(pairingData.topic)) {
            console.warn(
              '⚠️ Restored pairing is missing an active WalletConnect session. Clearing stale data.'
            );
            await resetHashConnectState({ clearStorage: true, disconnect: false });
          }
        } catch (e) {
          console.warn('Failed to restore pairing data:', e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      return hashconnectInstance;
    } catch (error) {
      console.error(`❌ HashConnect initialization attempt ${retryCount + 1} failed:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('IndexedDB') ||
        errorMessage.includes('backing store') ||
        errorMessage.includes('keyvaluestorage')
      ) {
        console.log('🔍 IndexedDB error detected, will retry with enhanced cleanup');
      }

      retryCount += 1;

      if (retryCount >= maxRetries) {
        console.error('💥 All HashConnect initialization attempts failed');
        initializationPromise = null;
        throw new Error(
          `HashConnect initialization failed after ${maxRetries} attempts. ` +
            'Please try refreshing the page and clearing browser data. ' +
            `Last error: ${errorMessage}`
        );
      }

      await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
    }
  }

  initializationPromise = null;
  return null;
};

const setupEvents = (HashConnectConnectionState: any) => {
  if (!hashconnectInstance) return;

  hashconnectInstance.pairingEvent.on((data: any) => {
    console.log('🎉 Pairing event received:', data);
    
    const rawTopic = data.topic || hashconnectInstance.topic || hashconnectInstance.pairingString;
    const resolvedTopic = findActiveSessionTopic(rawTopic) || normalizeWalletConnectTopic(rawTopic);

    const pairingData = {
      ...data,
      rawTopic,
      topic: resolvedTopic || rawTopic
    };
    
    currentPairingData = pairingData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pairingData));
    currentConnectionState = HashConnectConnectionState.Paired;
    console.log("🎉 New pairing:", pairingData.accountIds[0], "Topic:", pairingData.topic);
  });

  hashconnectInstance.disconnectionEvent.on(() => {
    currentPairingData = null;
    localStorage.removeItem(STORAGE_KEY);
    currentConnectionState = HashConnectConnectionState.Disconnected;
    console.log("🔌 Disconnected");
  });

  hashconnectInstance.connectionStatusChangeEvent.on((state: any) => {
    currentConnectionState = state;
    console.log("📶 Connection state:", state);
  });
};

export const openPairingModal = () => hashconnectInstance?.openPairingModal();
export const getPairingData = () => currentPairingData;
export const getConnectionState = () => currentConnectionState;
export const getHashConnectInstance = () => hashconnectInstance;

export const getConnectedAccountId = () => {
  if (currentPairingData && currentPairingData.accountIds?.length > 0) {
    return currentPairingData.accountIds[0];
  }
  return null;
};

export const connectHashPack = async () => {
  if (typeof window === 'undefined') return null;

  await initHashConnect();
  if (!hashconnectInstance) throw new Error('Failed to initialize HashConnect');

  const waitForPairing = () => new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout - please complete the pairing process in the HashPack wallet modal'));
    }, 60000);

    const checkPaired = () => {
      if (currentConnectionState === 'Paired' && currentPairingData && currentPairingData.accountIds && currentPairingData.accountIds.length > 0) {
        clearTimeout(timeout);
        console.log('✅ HashPack pairing completed successfully:', currentPairingData.accountIds[0]);
        resolve(currentPairingData.accountIds[0]);
      } else {
        setTimeout(checkPaired, 500);
      }
    };

    checkPaired();
  });

  const ensureTopic = (): string | null => {
    if (!currentPairingData) return null;

    const candidateTopic = currentPairingData.topic
      || currentPairingData.rawTopic
      || hashconnectInstance?.topic
      || hashconnectInstance?.pairingString
      || null;

    const activeTopic = findActiveSessionTopic(candidateTopic)
      || normalizeWalletConnectTopic(candidateTopic);

    if (activeTopic) {
      currentPairingData.topic = activeTopic;
    }

    if (!currentPairingData.rawTopic && candidateTopic) {
      currentPairingData.rawTopic = candidateTopic;
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPairingData));
      } catch (error) {
        console.warn('⚠️ Failed to persist updated HashConnect pairing topic:', error);
      }
    }

    return activeTopic || currentPairingData.topic || currentPairingData.rawTopic || null;
  };

  const hasPairedAccount = currentConnectionState === 'Paired' && currentPairingData?.accountIds?.length;

  if (hasPairedAccount) {
    const topic = ensureTopic();
    if (topic && hasActiveSignClientSession(topic)) {
      console.log('✅ HashPack already paired, returning existing address:', currentPairingData.accountIds[0], 'Topic:', topic);
      return currentPairingData.accountIds[0];
    }

    console.warn('⚠️ Stored HashPack pairing is missing an active session. Prompting re-pair.');
    await resetHashConnectState({ clearStorage: true, disconnect: false });
  }

  console.log('🔄 Opening HashPack pairing modal...');
  openPairingModal();
  return waitForPairing();
};

export const disconnectWallet = () => {
  resetHashConnectState().catch(error => {
    console.warn('⚠️ Failed to fully reset HashConnect state during disconnect:', error);
  });
};

export const executeTransaction = async (transaction: any, accountId: string, payerAccountId?: string) => {
  if (!hashconnectInstance || !currentPairingData) {
    throw new Error('HashConnect not initialized or not paired');
  }

  // Convert account ID to string early for consistent usage
  const accountIdString = String(accountId);
  const payerAccountIdString = payerAccountId ? String(payerAccountId) : accountIdString;

  try {
    console.log('🔗 Executing transaction through HashConnect...');
    console.log('📤 Transaction type:', transaction.constructor.name);
    console.log('🔍 Account ID:', accountIdString);
    console.log('🔍 Account ID type:', typeof accountIdString);
    console.log('🔍 Transaction details:', {
      type: transaction.constructor.name,
      maxFee: transaction.maxTransactionFee?.toString(),
      memo: transaction.transactionMemo
    });
    
    // Validate that we have the required account in our pairing data
    if (!currentPairingData.accountIds || currentPairingData.accountIds.length === 0) {
      throw new Error('No account IDs found in pairing data');
    }

    // Verify the account ID is in our paired accounts
    // Convert all account IDs to strings for comparison
    const pairedAccountStrings = currentPairingData.accountIds.map((id: any) => String(id));
    
    if (!pairedAccountStrings.includes(accountIdString)) {
      throw new Error(`Account ${accountIdString} not found in paired accounts. Available: ${pairedAccountStrings.join(', ')}`);
    }

    console.log('✅ Account verification passed');
    console.log('📤 Sending transaction to HashPack wallet...');
    
    // DON'T set transaction ID manually!
    // HashConnect will handle it internally and we'll get it from the signed transaction
    
    // Use HashConnect's official sendTransaction method
    try {
      // HashConnect 3.x returns { receipt, signedTransaction } on success
      const result = await hashconnectInstance.sendTransaction(accountIdString, transaction);
      console.log('📨 HashConnect response received:', result);
      console.log('📨 Response type:', result?.constructor?.name);
      console.log('📨 Response status:', result?.status?.toString());
      
      // Check if transaction succeeded
      const isSuccess = result?.status?.toString() === 'SUCCESS';
      
      if (!isSuccess) {
        throw new Error(`Transaction failed with status: ${result?.status?.toString() || 'unknown'}`);
      }
      
      // The transaction ID was set by HashConnect during the signing process
      // We need to get it from the transaction object AFTER it's been processed
      let transactionId = null;
      
      // Method 1: Check the transaction object (HashConnect should have set it)
      if (transaction.transactionId) {
        transactionId = transaction.transactionId.toString();
        console.log('🔍 Found transaction ID on transaction object:', transactionId);
      }
      
      // Method 2: Try to extract from the result
      if (!transactionId && result.transactionId) {
        transactionId = result.transactionId.toString();
        console.log('🔍 Found transaction ID in result:', transactionId);
      }
      
      // Method 3: Check for signedTransaction property
      if (!transactionId && result.signedTransaction) {
        if (result.signedTransaction.transactionId) {
          transactionId = result.signedTransaction.transactionId.toString();
          console.log('🔍 Found transaction ID in signedTransaction:', transactionId);
        }
      }
      
      // Method 4: Check HashConnect's internal state
      if (!transactionId) {
        // Try to access the last transaction ID from HashConnect
        const hcInstance = hashconnectInstance as any;
        if (hcInstance._lastTransactionId) {
          transactionId = hcInstance._lastTransactionId.toString();
          console.log('� Found transaction ID in HashConnect instance:', transactionId);
        } else if (hcInstance.lastTransactionId) {
          transactionId = hcInstance.lastTransactionId.toString();
          console.log('� Found transaction ID in HashConnect instance (alt):', transactionId);
        }
      }
      
      if (!transactionId) {
        console.error('⚠️ Could not find transaction ID anywhere');
        console.error('⚠️ Transaction object keys:', Object.keys(transaction));
        console.error('⚠️ Transaction object:', transaction);
        console.error('⚠️ Result keys:', Object.keys(result));
        
        // Last resort: try to get from transaction's internal properties
        const txAny = transaction as any;
        if (txAny._transactionId) {
          transactionId = txAny._transactionId.toString();
          console.log('🔍 Found transaction ID in transaction._transactionId:', transactionId);
        } else if (txAny.transactionId) {
          transactionId = txAny.transactionId.toString();
          console.log('🔍 Found transaction ID in transaction.transactionId:', transactionId);
        }
      }
      
      if (!transactionId) {
        // Transaction succeeded but we can't get the ID - this is a problem
        throw new Error('Transaction succeeded but could not retrieve transaction ID. Check your account on HashScan for recent transactions.');
      }
      
      console.log('✅ Transaction executed successfully with ID:', transactionId);
      return {
        success: true,
        transactionId: transactionId,
        receipt: result,
        response: result
      };
      
    } catch (sendError) {
      console.error('❌ Error in HashConnect sendTransaction:', sendError);
      console.log('🔍 SendTransaction error details:', {
        error: sendError,
        accountId: accountIdString,
        transactionType: transaction.constructor.name,
        hasHashConnectInstance: !!hashconnectInstance
      });
      throw sendError;
    }

  } catch (error) {
    console.error('❌ HashConnect transaction execution failed:', error);
    
    // Log debug information
    console.log('🔍 Debug information:', {
      hasInstance: !!hashconnectInstance,
      hasPairingData: !!currentPairingData,
      connectionState: currentConnectionState,
      accountIds: currentPairingData?.accountIds,
      requestedAccountId: accountIdString
    });

    // Re-throw the error with context
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Transaction execution failed: ${errorMessage}`);
  }
};

// Emergency reset function for severe WalletConnect issues
export const emergencyWalletReset = async (): Promise<void> => {
  console.log('🚨 EMERGENCY WALLET RESET INITIATED 🚨');
  
  try {
    // Perform complete reset
    await performCompleteWalletReset();
    
    console.log('✅ Emergency reset completed. Please refresh the page.');
    
    // Option to force reload
    if (typeof window !== 'undefined') {
      const shouldReload = confirm('Emergency wallet reset completed. Would you like to refresh the page for a clean start?');
      if (shouldReload) {
        window.location.reload();
      }
    }
  } catch (error) {
    console.error('❌ Emergency reset failed:', error);
    
    // Last resort: force page reload
    if (typeof window !== 'undefined') {
      console.log('🔄 Forcing page reload as last resort...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).emergencyWalletReset = emergencyWalletReset;
  (window as any).performCompleteWalletReset = performCompleteWalletReset;
}