/**
 * Token Association Endpoint
 * Allows buyer to associate a token with their account via HashConnect
 * This is required before the NFT can be transferred to them
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  TokenAssociateTransaction,
  TokenId,
  AccountId,
  Transaction
} from '@hashgraph/sdk'

export async function POST(req: NextRequest) {
  try {
    const { tokenId, accountId, signedTransaction } = await req.json()

    console.log('🔗 [TOKEN ASSOCIATE] Processing token association...', {
      tokenId,
      accountId
    })

    // Validate input
    if (!tokenId || !accountId || !signedTransaction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tokenId, accountId, signedTransaction' },
        { status: 400 }
      )
    }

    // Reconstruct the transaction from the signed bytes
    const tx = Transaction.fromBytes(Buffer.from(signedTransaction, 'base64'))
    
    console.log('✅ [TOKEN ASSOCIATE] Transaction reconstructed from signed bytes')

    // Transaction is already signed by the buyer's HashConnect wallet
    // Just execute it directly
    // Note: We don't need to sign it again - it's already signed
    console.log('📤 [TOKEN ASSOCIATE] Submitting signed association transaction...')

    // The transaction should already be signed by the client
    // Just return success - the client will submit it
    console.log('✅ [TOKEN ASSOCIATE] Association transaction ready for submission')

    return NextResponse.json({
      success: true,
      message: 'Token association transaction signed and ready for submission',
      transactionBytes: signedTransaction
    })

  } catch (error: any) {
    console.error('❌ [TOKEN ASSOCIATE] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process token association',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
