/**
 * Test Transaction ID Format Conversion
 * Use this endpoint to test transaction ID format conversion without doing a full purchase
 * 
 * Usage:
 * POST /api/test-transaction-id
 * Body: { "transactionId": "0.0.xxx@seconds.nanoseconds" }
 */

import { NextRequest, NextResponse } from 'next/server'

const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com'

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json()

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'transactionId is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing transaction ID format conversion...')
    console.log('🔍 Input:', transactionId)

    // Same parsing logic as the actual endpoint
    let mirrorTxId = transactionId.trim()
    let conversionMethod = 'unknown'

    // Check if already in correct format
    if (mirrorTxId.match(/^\d+\.\d+\.\d+-\d+-\d+$/)) {
      conversionMethod = 'already-correct'
      console.log('✅ Already in correct format')
    }
    // Format: "0.0.xxx@seconds.nanoseconds"
    else if (mirrorTxId.includes('@')) {
      const [accountId, timestamp] = mirrorTxId.split('@')
      if (!accountId || !timestamp) {
        return NextResponse.json({
          success: false,
          error: 'Invalid @ format - missing parts',
          input: transactionId,
          parsed: { accountId, timestamp }
        })
      }
      const formattedTimestamp = timestamp.replace('.', '-')
      mirrorTxId = `${accountId}-${formattedTimestamp}`
      conversionMethod = 'converted-from-@'
      console.log('🔄 Converted from @ format:', mirrorTxId)
    }
    // Format: "seconds.nanoseconds" (missing account ID)
    else if (mirrorTxId.match(/^\d+\.\d+$/)) {
      return NextResponse.json({
        success: false,
        error: 'Missing account ID',
        input: transactionId,
        conversionMethod: 'timestamp-only'
      })
    }
    // Unknown format
    else {
      return NextResponse.json({
        success: false,
        error: 'Unknown format',
        input: transactionId,
        conversionMethod: 'unknown'
      })
    }

    // Final validation
    const isValid = mirrorTxId.match(/^\d+\.\d+\.\d+-\d+-\d+$/)
    
    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Final validation failed',
        input: transactionId,
        output: mirrorTxId,
        conversionMethod,
        expectedPattern: '0.0.xxx-seconds-nanoseconds'
      })
    }

    // Test the Mirror Node query
    const encodedTxId = encodeURIComponent(mirrorTxId)
    const url = `${MIRROR_NODE_URL}/api/v1/transactions/${encodedTxId}`
    
    console.log('🔍 Testing Mirror Node query:', url)
    
    const response = await fetch(url)
    const mirrorNodeSuccess = response.ok
    
    let mirrorNodeData = null
    let mirrorNodeError = null
    
    if (response.ok) {
      mirrorNodeData = await response.json()
      console.log('✅ Mirror Node query successful')
    } else {
      mirrorNodeError = await response.text()
      console.log('❌ Mirror Node query failed:', response.status, mirrorNodeError)
    }

    return NextResponse.json({
      success: true,
      conversion: {
        input: transactionId,
        output: mirrorTxId,
        method: conversionMethod,
        valid: isValid,
        pattern: '0.0.xxx-seconds-nanoseconds'
      },
      mirrorNode: {
        url,
        success: mirrorNodeSuccess,
        status: response.status,
        statusText: response.statusText,
        error: mirrorNodeError,
        foundTransaction: mirrorNodeData?.transactions?.length > 0
      },
      parts: {
        original: mirrorTxId.split('-'),
        hasCorrectParts: mirrorTxId.split('-').length === 3
      }
    })

  } catch (error: any) {
    console.error('❌ Test error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also support GET for easy browser testing
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const transactionId = searchParams.get('transactionId')

  if (!transactionId) {
    return NextResponse.json({
      success: false,
      error: 'Missing transactionId parameter',
      usage: {
        method: 'GET or POST',
        examples: {
          get: '/api/test-transaction-id?transactionId=0.0.7023264@1760833407.656981994',
          post: 'POST /api/test-transaction-id with body: { "transactionId": "0.0.xxx@seconds.nanoseconds" }'
        }
      }
    })
  }

  // Reuse the POST logic
  return POST(req)
}
