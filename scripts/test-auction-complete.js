/**
 * Test Auction Completion Script
 * Manually triggers the auction completion cron job
 * Usage: node scripts/test-auction-complete.js
 */

const fetch = require('node-fetch')

async function testAuctionCompletion() {
  try {
    console.log('🧪 Testing auction completion cron job...')
    console.log('🔗 Calling: http://localhost:3000/api/auctions/cron/complete')
    
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    const response = await fetch('http://localhost:3000/api/auctions/cron/complete', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    console.log('\n📊 Response Status:', response.status)
    console.log('📝 Response Data:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log(`\n✅ Success! Processed ${data.processed} auctions`)
      console.log(`   ✓ Successful: ${data.successful}`)
      console.log(`   ✗ Failed: ${data.failed}`)
      
      if (data.results && data.results.length > 0) {
        console.log('\n📋 Results:')
        data.results.forEach((result, index) => {
          console.log(`\n${index + 1}. Auction: ${result.auctionId}`)
          if (result.success) {
            console.log(`   ✅ Status: SUCCESS`)
            console.log(`   💰 Final Bid: ${result.finalBid} ℏ`)
            console.log(`   👤 Winner: ${result.winner}`)
            console.log(`   📝 TX: ${result.transactionId}`)
          } else {
            console.log(`   ❌ Status: FAILED`)
            console.log(`   ⚠️  Error: ${result.error}`)
          }
        })
      }
    } else {
      console.error('\n❌ Failed:', data.error)
      if (data.details) {
        console.error('   Details:', data.details)
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing auction completion:', error.message)
    process.exit(1)
  }
}

testAuctionCompletion()
