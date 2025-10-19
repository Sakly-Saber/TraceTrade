/**
 * Next.js Instrumentation
 * Runs once when the server starts (not on every request)
 * Perfect for initializing background services
 */

export async function register() {
  // Only run in Node.js runtime (not in Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 [SERVER] Initializing background services...')
    
    // Import and start auction completion service
    const { startAuctionCompletionService, completeOfflineAuctions } = await import('./lib/services/auction-completion-service')
    
    // Complete any auctions that ended while server was offline
    console.log('📦 [SERVER] Checking for offline auctions...')
    await completeOfflineAuctions()
    
    // Start real-time auction completion service
    console.log('⏰ [SERVER] Starting real-time auction completion service...')
    startAuctionCompletionService()
    
    console.log('✅ [SERVER] Background services initialized')
  }
}
