/**
 * NFT Transfer Execution API
 * Backend uses operator key to transfer NFT after HBAR payment is verified
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  TransferTransaction,
  TokenId,
  AccountId,
  PrivateKey,
  Client,
  Hbar,
  TokenAssociateTransaction
} from '@hashgraph/sdk'

// Treasury operator account (has allowance from seller)
const OPERATOR_ID = process.env.NEXT_PUBLIC_OPERATOR_ID || process.env.OPERATOR_ID || '0.0.6606536'
const OPERATOR_KEY = process.env.OPERATOR_KEY || process.env.OPERATOR_PRIVATE_KEY || '0x2ed51bfe9104afd3340c3d26b7a316f008dbd8de0ba2b3e8389e247a5c32218c'
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'

// Hedera Mirror Node API
const MIRROR_NODE_URL = HEDERA_NETWORK === 'mainnet'
  ? 'https://mainnet-public.mirrornode.hedera.com'
  : 'https://testnet.mirrornode.hedera.com'

export async function POST(req: NextRequest) {
  try {
    const { listingId, buyerAccountId, paymentTransactionId } = await req.json()

    console.log('🔐 [NFT TRANSFER] Processing NFT transfer...', {
      listingId,
      buyer: buyerAccountId,
      paymentTx: paymentTransactionId,
      paymentTxType: typeof paymentTransactionId,
      paymentTxLength: paymentTransactionId?.length
    })

    // Validate input
    if (!listingId || !buyerAccountId || !paymentTransactionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 1. Verify the listing still exists and is active
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        nftAsset: {
          include: {
            owner: true
          }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Listing is no longer active' },
        { status: 400 }
      )
    }

    if (!listing.allowanceGranted) {
      return NextResponse.json(
        { success: false, error: 'NFT allowance not granted' },
        { status: 400 }
      )
    }

    if (!listing.nftAsset) {
      return NextResponse.json(
        { success: false, error: 'NFT asset not found' },
        { status: 404 }
      )
    }

    // Get seller address
    let sellerAccountId = listing.seller
    if (!sellerAccountId || !sellerAccountId.startsWith('0.0.')) {
      if (listing.nftAsset.owner?.walletAddress) {
        sellerAccountId = listing.nftAsset.owner.walletAddress
      } else {
        return NextResponse.json(
          { success: false, error: 'Could not determine seller wallet address' },
          { status: 500 }
        )
      }
    }

    // 2. Verify HBAR payment to seller (with retries)
    console.log('🔍 [NFT TRANSFER] Verifying HBAR payment to seller...')
    
    let paymentVerified: { success: boolean; error?: string } = { success: false }
    const maxRetries = 8
    const retryDelays = [2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000] // Longer delays for mirror node indexing
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`⏳ [NFT TRANSFER] Retry ${attempt}/${maxRetries - 1} - waiting ${retryDelays[attempt - 1]}ms...`)
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]))
      }
      
      paymentVerified = await verifyPayment(
        paymentTransactionId,
        buyerAccountId,
        sellerAccountId, // Payment should be to SELLER
        listing.priceHbar
      )
      
      if (paymentVerified.success) {
        break // Payment verified successfully
      }
      
      // If it's a "not found" error, retry (transaction might not be indexed yet)
      if (paymentVerified.error?.includes('not found') && attempt < maxRetries - 1) {
        console.log(`⏳ [NFT TRANSFER] Transaction not found yet, will retry...`)
        continue
      }
      
      // For other errors, break immediately
      if (!paymentVerified.error?.includes('not found')) {
        break
      }
    }

    if (!paymentVerified.success) {
      console.error('❌ [NFT TRANSFER] Payment verification failed:', paymentVerified.error)
      return NextResponse.json(
        { success: false, error: paymentVerified.error || 'Payment verification failed' },
        { status: 400 }
      )
    }

    console.log('✅ [NFT TRANSFER] Payment verified successfully')

    // 3. Set up Hedera client with operator credentials
    console.log('🔧 [NFT TRANSFER] Setting up Hedera client...')
    const client = HEDERA_NETWORK === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet()

    console.log('🔑 [NFT TRANSFER] Operator credentials:', {
      operatorId: OPERATOR_ID,
      keyFormat: OPERATOR_KEY.substring(0, 10) + '...',
      network: HEDERA_NETWORK
    })

    const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY)
    client.setOperator(OPERATOR_ID, operatorKey)

    // 4. Execute NFT transfer using operator's authority (seller granted allowance)
    console.log('🚀 [NFT TRANSFER] Executing NFT transfer using operator key...')
    
    const tokenId = TokenId.fromString(listing.nftAsset.tokenId)
    const serialNumber = listing.nftAsset.serialNumber
    const seller = AccountId.fromString(sellerAccountId)
    const buyer = AccountId.fromString(buyerAccountId)

    console.log('📋 [NFT TRANSFER] Transfer details:', {
      tokenId: listing.nftAsset.tokenId,
      serialNumber: listing.nftAsset.serialNumber,
      seller: sellerAccountId,
      buyer: buyerAccountId,
      operator: OPERATOR_ID,
      allowanceGranted: listing.allowanceGranted,
      allowanceTxId: listing.allowanceTransactionId
    })

    // 4a. Check if token is associated with buyer (query via mirror node)
    console.log('🔍 [NFT TRANSFER] Checking token association status...')
    const mirrorUrl = `${MIRROR_NODE_URL}/api/v1/accounts/${buyerAccountId}/tokens`
    try {
      const tokenCheckResponse = await fetch(mirrorUrl)
      const tokenCheckData = await tokenCheckResponse.json()
      const isAssociated = tokenCheckData.tokens?.some((t: any) => t.token_id === listing.nftAsset.tokenId)
      
      if (!isAssociated) {
        console.log('❌ [NFT TRANSFER] Token not associated with buyer account')
        return NextResponse.json({
          success: false,
          error: 'Token not associated with buyer account',
          code: 'TOKEN_NOT_ASSOCIATED',
          details: 'The buyer must associate the token with their account before the NFT can be transferred. Please complete token association on your wallet first.',
          tokenId: listing.nftAsset.tokenId,
          accountId: buyerAccountId
        }, { status: 400 })
      } else {
        console.log('✅ [NFT TRANSFER] Token already associated with buyer account')
      }
    } catch (checkError: any) {
      console.log('⚠️ [NFT TRANSFER] Could not verify token association status, but attempting transfer...')
    }

    // 4b. Verify NFT ownership and allowance status via mirror node
    console.log('🔍 [NFT TRANSFER] Verifying NFT and allowance status...')
    try {
      const nftCheckResponse = await fetch(`${MIRROR_NODE_URL}/api/v1/tokens/${listing.nftAsset.tokenId}/nfts/${listing.nftAsset.serialNumber}`)
      const nftData = await nftCheckResponse.json()
      
      console.log('📊 [NFT TRANSFER] NFT Mirror Node data:', {
        owner: nftData.owner,
        tokenId: listing.nftAsset.tokenId,
        serialNumber: listing.nftAsset.serialNumber,
        spender: nftData.spender
      })

      // Check if NFT is currently owned by seller
      if (nftData.owner && nftData.owner !== sellerAccountId) {
        console.warn('⚠️ [NFT TRANSFER] NFT owner mismatch - seller:', sellerAccountId, 'actual owner:', nftData.owner)
      }

      // Check if spender (operator) is approved
      if (!nftData.spender || nftData.spender !== OPERATOR_ID) {
        console.warn('⚠️ [NFT TRANSFER] Spender not set or mismatch - expected:', OPERATOR_ID, 'actual:', nftData.spender)
      }
    } catch (nftCheckError: any) {
      console.log('ℹ️ [NFT TRANSFER] Could not verify NFT details from mirror node, proceeding:', nftCheckError.message)
    }

    // 4b. Transfer the NFT
    console.log('📤 [NFT TRANSFER] Transferring NFT to buyer...', {
      tokenId,
      serialNumber,
      seller,
      buyer,
      operatorId: OPERATOR_ID
    })
    
    const nftTransfer = new TransferTransaction()
      .addApprovedNftTransfer(tokenId, serialNumber, seller, buyer)
      .freezeWith(client)

    // Sign with operator key
    console.log('🔐 [NFT TRANSFER] Signing transaction with operator key...')
    const signedTx = await nftTransfer.sign(operatorKey)
    
    // Execute transaction
    console.log('⚡ [NFT TRANSFER] Executing transaction...')
    const txResponse = await signedTx.execute(client)
    console.log('📜 [NFT TRANSFER] Transaction submitted, hash:', txResponse.transactionHash)
    
    // Get receipt to confirm success
    let receipt
    try {
      receipt = await txResponse.getReceipt(client)
    } catch (receiptError: any) {
      console.error('❌ [NFT TRANSFER] Receipt error:', receiptError.message)
      
      // Check if it's an allowance error
      if (receiptError.message?.includes('SPENDER_DOES_NOT_HAVE_ALLOWANCE')) {
        // Reset the allowanceGranted flag so seller can re-grant it
        await prisma.marketplaceListing.update({
          where: { id: listingId },
          data: { allowanceGranted: false }
        }).catch(err => console.log('Could not reset allowanceGranted:', err.message))
        
        return NextResponse.json({
          success: false,
          error: 'NFT allowance granted to wrong operator',
          code: 'ALLOWANCE_MISMATCH',
          details: `The allowance was granted to a different operator account. Current operator: ${OPERATOR_ID}. Please ask the seller to revoke the old allowance and grant it again to the correct operator.`,
          tokenId: listing.nftAsset.tokenId,
          serialNumber: listing.nftAsset.serialNumber,
          seller: sellerAccountId,
          currentOperator: OPERATOR_ID,
          requiresReauth: true,
          action: 'REVOKE_AND_REGRANTING'
        }, { status: 400 })
      }
      
      throw receiptError
    }
    
    console.log('✅ [NFT TRANSFER] NFT transferred successfully:', {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString()
    })

    const nftTransferTxId = txResponse.transactionId.toString()

    // 5. Update database - mark listing as SOLD
    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: 'SOLD',
        soldAt: new Date(),
        transactionId: `${paymentTransactionId},${nftTransferTxId}` // Store both transaction IDs
      }
    })

    // Ensure buyer user exists
    let buyerUser = await prisma.user.findUnique({
      where: { walletAddress: buyerAccountId },
      include: { business: true }
    })

    if (!buyerUser) {
      buyerUser = await prisma.user.create({
        data: {
          walletAddress: buyerAccountId,
          walletType: 'HASHCONNECT',
          email: `${buyerAccountId}@hedera.wallet`
        },
        include: { business: true }
      })
    }

    // Ensure buyer has a business (required for NFT ownership)
    let buyerBusiness = buyerUser.business
    if (!buyerBusiness && buyerUser.businessId) {
      buyerBusiness = await prisma.business.findUnique({
        where: { id: buyerUser.businessId }
      })
    }

    // Create a business for the buyer if they don't have one
    if (!buyerBusiness) {
      buyerBusiness = await prisma.business.create({
        data: {
          name: `Buyer ${buyerAccountId}`,
          email: `${buyerAccountId}@hedera.wallet`,
          phone: 'N/A',
          address: 'Hedera Network',
          city: 'Blockchain',
          state: 'Decentralized',
          country: 'Global',
          businessType: 'SOLE_PROPRIETORSHIP',
          industry: 'OTHER',
          walletAddress: buyerAccountId,
          walletType: 'HASHCONNECT',
          status: 'ACTIVE'
        }
      })

      // Link business to user
      await prisma.user.update({
        where: { id: buyerUser.id },
        data: { businessId: buyerBusiness.id }
      })
    }

    // Update NFT ownership
    await prisma.nFTAsset.update({
      where: { id: listing.nftAssetId },
      data: {
        ownerId: buyerBusiness.id,
        updatedAt: new Date()
      }
    })

    console.log('✅ [NFT TRANSFER] Database updated - listing marked as SOLD')

    return NextResponse.json({
      success: true,
      message: 'NFT transferred successfully',
      transactionId: nftTransferTxId,
      paymentTransactionId,
      explorerUrl: `https://hashscan.io/${HEDERA_NETWORK}/transaction/${nftTransferTxId}`
    })

  } catch (error: any) {
    console.error('❌ [NFT TRANSFER] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to transfer NFT',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Verify HBAR payment via Hedera Mirror Node
 */
async function verifyPayment(
  transactionId: string,
  expectedSender: string,
  expectedReceiver: string,
  expectedAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Parse transaction ID to Mirror Node format
    // Possible input formats:
    // 1. "0.0.xxx@seconds.nanoseconds" (Hedera SDK)
    // 2. "0.0.xxx-seconds-nanoseconds" (already formatted)
    // 3. "seconds.nanoseconds" (timestamp only)
    // Mirror Node expects: "0.0.xxx-seconds-nanoseconds"
    
    console.log('🔍 Original transaction ID:', transactionId)
    console.log('🔍 Transaction ID type:', typeof transactionId)
    
    let mirrorTxId = transactionId.trim() // Remove any whitespace
    
    // Check if already in correct format (contains dashes between all parts)
    if (mirrorTxId.match(/^\d+\.\d+\.\d+-\d+-\d+$/)) {
      console.log('✅ Transaction ID already in correct format:', mirrorTxId)
    }
    // Format: "0.0.xxx@seconds.nanoseconds"
    else if (mirrorTxId.includes('@')) {
      const [accountId, timestamp] = mirrorTxId.split('@')
      // Validate parts
      if (!accountId || !timestamp) {
        console.error('❌ Invalid @ format - missing parts:', { accountId, timestamp })
        return {
          success: false,
          error: `Invalid transaction ID format: malformed @ separator. Got: ${transactionId}`
        }
      }
      // Replace the dot in timestamp with dash: "1234567890.123456789" -> "1234567890-123456789"
      const formattedTimestamp = timestamp.replace('.', '-')
      mirrorTxId = `${accountId}-${formattedTimestamp}`
      console.log('🔄 Converted from @ format:', mirrorTxId)
    }
    // Format: "seconds.nanoseconds" (missing account ID)
    else if (mirrorTxId.match(/^\d+\.\d+$/)) {
      console.error('❌ Transaction ID missing account ID:', mirrorTxId)
      return {
        success: false,
        error: `Invalid transaction ID format: missing account ID. Got: ${transactionId}`
      }
    }
    // Unknown format - fail gracefully
    else {
      console.error('❌ Unknown transaction ID format:', mirrorTxId)
      return {
        success: false,
        error: `Invalid transaction ID format. Expected format: "0.0.xxx@seconds.nanoseconds" or "0.0.xxx-seconds-nanoseconds". Got: ${transactionId}`
      }
    }
    
    // Final validation - ensure format is correct
    if (!mirrorTxId.match(/^\d+\.\d+\.\d+-\d+-\d+$/)) {
      console.error('❌ Final format validation failed:', mirrorTxId)
      return {
        success: false,
        error: `Transaction ID conversion failed. Expected: "0.0.xxx-seconds-nanoseconds", Got: ${mirrorTxId}`
      }
    }
    
    console.log('🔍 Formatted for mirror node:', mirrorTxId)
    
    // Query Hedera Mirror Node API (URL encode the transaction ID)
    const encodedTxId = encodeURIComponent(mirrorTxId)
    const url = `${MIRROR_NODE_URL}/api/v1/transactions/${encodedTxId}`
    console.log('🔍 Querying mirror node:', url)

    const response = await fetch(url)
    
    if (!response.ok) {
      // If failed, log the error details
      const errorText = await response.text()
      console.error('❌ Mirror node error response:', errorText)
      
      return {
        success: false,
        error: `Mirror node query failed: ${response.status} ${response.statusText}. Details: ${errorText}`
      }
    }

    const data = await response.json()
    
    // Check if transaction exists
    if (!data.transactions || data.transactions.length === 0) {
      return {
        success: false,
        error: 'Transaction not found on mirror node'
      }
    }

    const tx = data.transactions[0]

    // Verify transaction succeeded
    if (tx.result !== 'SUCCESS') {
      return {
        success: false,
        error: `Transaction did not succeed: ${tx.result}`
      }
    }

    // Verify HBAR transfers
    const transfers = tx.transfers || []
    
    // Find sender's debit
    const senderTransfer = transfers.find((t: any) => 
      t.account === expectedSender && t.amount < 0
    )
    
    // Find receiver's credit
    const receiverTransfer = transfers.find((t: any) => 
      t.account === expectedReceiver && t.amount > 0
    )

    if (!senderTransfer || !receiverTransfer) {
      return {
        success: false,
        error: 'Expected transfers not found in transaction'
      }
    }

    // Verify amounts (convert from tinybars to HBAR)
    const sentAmount = Math.abs(senderTransfer.amount) / 100000000
    const receivedAmount = receiverTransfer.amount / 100000000

    console.log('💰 Payment amounts:', {
      expected: expectedAmount,
      sent: sentAmount,
      received: receivedAmount
    })

    // Allow small difference due to transaction fees
    const tolerance = 0.01 // 0.01 HBAR tolerance
    if (Math.abs(receivedAmount - expectedAmount) > tolerance) {
      return {
        success: false,
        error: `Payment amount mismatch: expected ${expectedAmount} HBAR, received ${receivedAmount} HBAR`
      }
    }

    console.log('✅ Payment verification successful')
    return { success: true }

  } catch (error: any) {
    console.error('❌ Payment verification error:', error)
    return {
      success: false,
      error: error.message || 'Failed to verify payment'
    }
  }
}
